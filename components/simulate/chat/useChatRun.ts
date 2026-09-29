'use client';

// useChatRun - one playground chat, turn by turn.
//
// The customer writes (the user, a past chat's first message, or the AI
// customer) and the agent answers. Until the customer says what they need,
// the agent only greets and asks; once they do, the trigger decides whether
// the skill runs. Every reply reaches the customer - it is a simulation.
//
// Live when the model is on for this browser, scripted otherwise - decided per
// conversation, so a chat never switches engines halfway.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorDoc } from '@/components/flow01/doc';
import type { SimStatusKind } from '@/data/simFixtures';
import { findAction } from '@/data/library';
import type { LiveCopilot } from '@/lib/copilot/useLiveCopilot';
import { LiveCopilotError } from '@/lib/copilot/useLiveCopilot';
import {
  checkTurn,
  worstOutcome,
  type ChatMessage,
  type ChatScenario,
  type CheckedTurn,
  type CustomerTurnWire,
  type TurnOutcome,
  type Verdict,
} from '@/lib/eval/wire';
import { scriptedCustomerTurn, scriptedSkillTurn } from '@/lib/eval/scripted';

export type AgentItem = {
  kind: 'agent';
  id: string;
  status: 'running' | 'done' | 'error';
  turn?: CheckedTurn;
  /** The turn the skill started on - the thread marks it. */
  firstRun?: boolean;
  /** Transport or model failure: the evaluation broke, not the skill. */
  error?: string;
  /** Out of credits: the fix is the scripted replies, not a retry. */
  quota?: boolean;
};

/** The customer's rating at the end, as the widget asks for it. */
export type RatingItem = { kind: 'rating'; id: string; score: number; comment: string | null };

/** A file the customer attached. The playground shows it in the chat; the
 *  agent is told its name, not its contents. */
export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  /** An object URL, for an image's thumbnail; null for other files. */
  url: string | null;
}

export type CustomerItem = { kind: 'customer'; id: string; text: string; attachments?: ChatAttachment[] };

export type ChatItem = CustomerItem | AgentItem | RatingItem;

/** judging: the chat is over and the conversation is being reviewed. */
export type ChatPhase = 'idle' | 'agent' | 'customer' | 'judging' | 'ended';

/** The end-of-chat review: did the conversation actually go well? */
export interface ChatVerdict {
  verdict: Verdict;
  reason: string;
}

const MAX_CUSTOMER_TURNS = 8;
// The scripted engine answers instantly; a short beat keeps its typing state
// readable instead of flashing (it is labelled "Scripted demo" throughout).
const SCRIPTED_BEAT_MS = 700;

let seq = 0;
const nid = (p: string) => `${p}-${(seq += 1)}`;

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/** The conversation as both sides saw it. */
export function transcriptOf(items: ChatItem[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const it of items) {
    if (it.kind === 'customer') {
      const files = it.attachments?.length ? `[Attached: ${it.attachments.map((a) => a.name).join(', ')}]` : '';
      out.push({ role: 'customer', text: [it.text, files].filter(Boolean).join('\n') });
    }
    else if (it.kind === 'agent' && it.status === 'done' && it.turn?.reply) out.push({ role: 'agent', text: it.turn.reply });
  }
  return out;
}

/** Free the thumbnails' object URLs once their chat is gone. */
export function revokeAttachments(items: ChatItem[]) {
  for (const it of items) {
    if (it.kind !== 'customer') continue;
    for (const a of it.attachments ?? []) if (a.url) URL.revokeObjectURL(a.url);
  }
}

const started = (items: ChatItem[]) => items.some((it) => it.kind === 'agent' && it.turn?.stage === 'run');

/** An agent turn's part in the chat's result. A greeting is neither good nor
 *  bad - the skill has not been asked anything yet. */
export function itemOutcome(it: AgentItem): TurnOutcome | null {
  if (it.status === 'error') return 'errored';
  if (it.status !== 'done' || !it.turn || it.turn.stage === 'greet' || it.turn.stage === 'close') return null;
  return it.turn.outcome;
}

/** Every step the skill actually took, turn by turn - what the review checks
 *  the agent's words against ("I'm escalating this" needs an Assign). */
function stepLog(items: ChatItem[]): string[] {
  const out: string[] = [];
  let turn = 0;
  for (const it of items) {
    if (it.kind !== 'agent' || !it.turn || it.turn.stage !== 'run') continue;
    turn += 1;
    for (const s of it.turn.steps) {
      if (s.kind === 'action') {
        const name = s.actionId ? (findAction(s.actionId)?.name ?? s.actionId) : 'Step';
        out.push(`Turn ${turn}: ${name}${s.text ? ` - ${s.text}` : ''}`);
      } else if (s.kind === 'condition') {
        out.push(`Turn ${turn}: condition took branch ${s.branch}`);
      }
    }
  }
  return out;
}

function actionsTakenOf(items: ChatItem[]): string[] {
  const out: string[] = [];
  for (const it of items) {
    if (it.kind !== 'agent' || !it.turn) continue;
    for (const s of it.turn.steps) {
      if (s.kind !== 'action' || !s.actionId) continue;
      out.push(`${findAction(s.actionId)?.name ?? s.actionId} (${s.stepId})`);
    }
  }
  return out;
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('aborted', 'AbortError'));
    });
  });

interface Options {
  doc: EditorDoc;
  live: LiveCopilot;
  /** The finished conversation's outcome, for the eval aggregate. */
  onRunRecorded?: (statuses: SimStatusKind[]) => void;
}

export function useChatRun({ doc, live, onRunRecorded }: Options) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [phase, setPhase] = useState<ChatPhase>('idle');
  const [engine, setEngine] = useState<'live' | 'scripted'>('scripted');
  const [verdict, setVerdict] = useState<ChatVerdict | null>(null);
  /** The AI customer was still going when the chat hit its length cap. */
  const [capped, setCapped] = useState(false);
  const goal = useRef<string | null>(null);

  // Latest-refs, written after commit so async loops read fresh values.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const ctx = useRef({ doc, live, onRunRecorded });
  useEffect(() => {
    ctx.current = { doc, live, onRunRecorded };
  }, [doc, live, onRunRecorded]);
  const abort = useRef<AbortController | null>(null);
  const engineRef = useRef<'live' | 'scripted'>('scripted');
  const recorded = useRef(false);

  useEffect(
    () => () => {
      abort.current?.abort();
      revokeAttachments(itemsRef.current);
    },
    [],
  );

  const commit = useCallback((next: ChatItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const pickEngine = useCallback(() => {
    const eng = ctx.current.live.mode === 'live' ? 'live' : 'scripted';
    engineRef.current = eng;
    setEngine(eng);
  }, []);

  /** One agent turn on the conversation as it stands. */
  const agentTurn = useCallback(
    async (signal: AbortSignal): Promise<AgentItem> => {
      const id = nid('agent');
      const pending: AgentItem = { kind: 'agent', id, status: 'running' };
      const before = itemsRef.current;
      commit([...before, pending]);
      setPhase('agent');
      const transcript = transcriptOf(before);
      const wasStarted = started(before);
      const { doc: d, live: l } = ctx.current;
      let done: AgentItem;
      try {
        let turn: CheckedTurn;
        if (engineRef.current === 'live') {
          const body = { kind: 'skill', doc: d, transcript, actionsTaken: actionsTakenOf(before), skillStarted: wasStarted };
          // A slow or dropped call is retried once, quietly: a hiccup in the
          // model is not something to put in front of the author.
          const ask = () => l.post<{ turn: CheckedTurn }>('/api/evaluate', body, signal);
          const res = await ask().catch((e: unknown) => {
            if (signal.aborted || !(e instanceof LiveCopilotError) || (e.kind !== 'timeout' && e.kind !== 'failed')) throw e;
            return ask();
          });
          turn = res.turn;
        } else {
          if (!reduced()) await sleep(SCRIPTED_BEAT_MS, signal);
          turn = checkTurn(d, scriptedSkillTurn(d, transcript, wasStarted), wasStarted);
        }
        done = { ...pending, status: 'done', turn, firstRun: !wasStarted && turn.stage === 'run' };
      } catch (e) {
        if (signal.aborted) throw e;
        const why = e instanceof LiveCopilotError ? e.message : 'The model could not be reached.';
        done = { ...pending, status: 'error', error: why, quota: e instanceof LiveCopilotError && e.kind === 'quota' };
      }
      commit(itemsRef.current.map((it) => (it.id === id ? done : it)));
      return done;
    },
    [commit],
  );

  // The chat is over. With the live model, the whole conversation is then
  // reviewed: a reply to every message is not the same as a good chat, and
  // only the review can say whether the customer was actually helped.
  const finish = useCallback(async () => {
    abort.current?.abort();
    abort.current = null;
    // A turn cut off by Stop never answered: drop it, or its typing dots stay
    // on under "Chat ended".
    const pending = itemsRef.current.filter((it) => it.kind === 'agent' && it.status === 'running');
    if (pending.length) commit(itemsRef.current.filter((it) => !pending.includes(it)));
    if (recorded.current) {
      setPhase('ended');
      return;
    }
    recorded.current = true;
    const agentItems = itemsRef.current.filter((it): it is AgentItem => it.kind === 'agent');
    const outcomes = agentItems.map(itemOutcome).filter((o): o is TurnOutcome => o !== null);
    const ran = agentItems.some((it) => it.turn?.stage === 'run');
    let judged: ChatVerdict | null = null;
    if (ran && engineRef.current === 'live') {
      setPhase('judging');
      try {
        const res = await ctx.current.live.post<{ verdict: ChatVerdict }>('/api/evaluate', {
          kind: 'judge',
          doc: ctx.current.doc,
          transcript: transcriptOf(itemsRef.current),
          goal: goal.current,
          actions: stepLog(itemsRef.current),
          rating: (() => {
            const r = itemsRef.current.find((it): it is RatingItem => it.kind === 'rating');
            return r ? { score: r.score, comment: r.comment } : null;
          })(),
        });
        judged = res.verdict;
        setVerdict(judged);
      } catch {
        /* no review: the result falls back to the turns alone */
      }
    }
    setPhase('ended');
    if (judged?.verdict === 'unresolved') outcomes.push('attention');
    if (outcomes.length > 0) ctx.current.onRunRecorded?.([worstOutcome(outcomes)]);
  }, [commit]);

  /** The AI customer's next message, and whether they are done. */
  const customerTurn = useCallback(async (sc: ChatScenario, signal: AbortSignal): Promise<CustomerTurnWire> => {
    setPhase('customer');
    const transcript = transcriptOf(itemsRef.current);
    let next: CustomerTurnWire;
    if (engineRef.current === 'live') {
      const ask = () =>
        ctx.current.live.post<{ turn: CustomerTurnWire }>('/api/evaluate', { kind: 'customer', scenario: sc, transcript }, signal);
      const res = await ask().catch((e: unknown) => {
        if (signal.aborted || !(e instanceof LiveCopilotError) || (e.kind !== 'timeout' && e.kind !== 'failed')) throw e;
        return ask();
      });
      next = res.turn;
    } else {
      if (!reduced()) await sleep(SCRIPTED_BEAT_MS, signal);
      next = scriptedCustomerTurn(sc, transcript);
    }
    return { ...next, message: next.message.trim() };
  }, []);

  /** A past chat's opening, or an AI scenario: the chat starts with the
   *  customer's first message. An AI scenario then runs itself to the end. */
  const start = useCallback(
    async (first: string, sc?: ChatScenario) => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      recorded.current = false;
      setVerdict(null);
      setCapped(false);
      goal.current = sc?.goal ?? null;
      pickEngine();
      commit([{ kind: 'customer', id: nid('cust'), text: first }]);
      try {
        let turn = await agentTurn(ctrl.signal);
        if (!sc) {
          setPhase('idle');
          return;
        }
        // The AI customer and the agent talk until the customer is done -
        // their last word, the agent's sign-off, then their rating - or the
        // chat runs long, which is itself a finding.
        let wrapped = false;
        for (let n = 1; n < MAX_CUSTOMER_TURNS; n += 1) {
          // Nothing to answer: the evaluation broke or the skill does not fit.
          if (turn.status === 'error' || turn.turn?.stage === 'noMatch') {
            wrapped = true;
            break;
          }
          const next = await customerTurn(sc, ctrl.signal);
          if (next.message) {
            commit([...itemsRef.current, { kind: 'customer', id: nid('cust'), text: next.message }]);
            turn = await agentTurn(ctrl.signal);
          }
          if (next.done) {
            if (next.rating !== null) {
              commit([...itemsRef.current, { kind: 'rating', id: nid('rate'), score: next.rating, comment: next.comment }]);
            }
            wrapped = true;
            break;
          }
        }
        if (!wrapped) setCapped(true);
        await finish();
      } catch (e) {
        if (ctrl.signal.aborted) return;
        commit([
          ...itemsRef.current,
          {
            kind: 'agent',
            id: nid('agent'),
            status: 'error',
            error: e instanceof LiveCopilotError ? e.message : 'The AI customer could not reply.',
            quota: e instanceof LiveCopilotError && e.kind === 'quota',
          },
        ]);
        void finish();
      }
    },
    [commit, agentTurn, customerTurn, finish, pickEngine],
  );

  /** The user, as the customer, sends a message. */
  const send = useCallback(
    async (text: string, attachments: ChatAttachment[] = []) => {
      const t = text.trim();
      if ((!t && attachments.length === 0) || phase === 'agent' || phase === 'customer' || phase === 'ended') return;
      const ctrl = new AbortController();
      abort.current = ctrl;
      if (itemsRef.current.length === 0) {
        recorded.current = false;
        setVerdict(null);
        setCapped(false);
        goal.current = null;
        pickEngine();
      }
      commit([
        ...itemsRef.current,
        { kind: 'customer', id: nid('cust'), text: t, ...(attachments.length ? { attachments } : {}) },
      ]);
      try {
        await agentTurn(ctrl.signal);
        setPhase('idle');
      } catch {
        /* aborted */
      }
    },
    [phase, commit, agentTurn, pickEngine],
  );

  /** Re-run a turn the evaluation could not finish. `scripted` switches the
   *  rest of this chat to the scripted replies (the out-of-credits fix). */
  const retry = useCallback(
    async (id: string, scripted?: boolean) => {
      const i = itemsRef.current.findIndex((it) => it.id === id);
      if (i < 0 || phase === 'agent' || phase === 'customer') return;
      const ctrl = new AbortController();
      abort.current = ctrl;
      commit(itemsRef.current.slice(0, i));
      if (scripted) {
        engineRef.current = 'scripted';
        setEngine('scripted');
      }
      try {
        await agentTurn(ctrl.signal);
        setPhase('idle');
      } catch {
        /* aborted */
      }
    },
    [phase, commit, agentTurn],
  );

  const end = useCallback(() => void finish(), [finish]);

  const reset = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    revokeAttachments(itemsRef.current);
    recorded.current = false;
    commit([]);
    setVerdict(null);
    setCapped(false);
    setPhase('idle');
  }, [commit]);

  const outcomes = items
    .filter((it): it is AgentItem => it.kind === 'agent')
    .map(itemOutcome)
    .filter((o): o is TurnOutcome => o !== null);
  if (verdict?.verdict === 'unresolved') outcomes.push('attention');

  return {
    items,
    phase,
    engine,
    busy: phase === 'agent' || phase === 'customer' || phase === 'judging',
    verdict,
    capped,
    outcome: outcomes.length ? worstOutcome(outcomes) : null,
    start,
    send,
    retry,
    end,
    reset,
  };
}

export type ChatRun = ReturnType<typeof useChatRun>;
