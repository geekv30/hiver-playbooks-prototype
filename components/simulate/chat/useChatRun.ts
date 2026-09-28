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

export type ChatItem = { kind: 'customer'; id: string; text: string } | AgentItem;

export type ChatPhase = 'idle' | 'agent' | 'customer' | 'ended';

const MAX_CUSTOMER_TURNS = 6;
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
    if (it.kind === 'customer') out.push({ role: 'customer', text: it.text });
    else if (it.status === 'done' && it.turn?.reply) out.push({ role: 'agent', text: it.turn.reply });
  }
  return out;
}

const started = (items: ChatItem[]) => items.some((it) => it.kind === 'agent' && it.turn?.stage === 'run');

/** An agent turn's part in the chat's result. A greeting is neither good nor
 *  bad - the skill has not been asked anything yet. */
export function itemOutcome(it: AgentItem): TurnOutcome | null {
  if (it.status === 'error') return 'errored';
  if (it.status !== 'done' || !it.turn || it.turn.stage === 'greet') return null;
  return it.turn.outcome;
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

  useEffect(() => () => abort.current?.abort(), []);

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
          const res = await l.post<{ turn: CheckedTurn }>(
            '/api/evaluate',
            { kind: 'skill', doc: d, transcript, actionsTaken: actionsTakenOf(before), skillStarted: wasStarted },
            signal,
          );
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

  const finish = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setPhase('ended');
    if (recorded.current) return;
    const outcomes = itemsRef.current
      .filter((it): it is AgentItem => it.kind === 'agent')
      .map(itemOutcome)
      .filter((o): o is TurnOutcome => o !== null);
    if (outcomes.length === 0) return;
    recorded.current = true;
    ctx.current.onRunRecorded?.([worstOutcome(outcomes)]);
  }, []);

  /** The AI customer's next message, or null when they are done. */
  const customerTurn = useCallback(async (sc: ChatScenario, signal: AbortSignal): Promise<string | null> => {
    setPhase('customer');
    const transcript = transcriptOf(itemsRef.current);
    let next: CustomerTurnWire;
    if (engineRef.current === 'live') {
      const res = await ctx.current.live.post<{ turn: CustomerTurnWire }>(
        '/api/evaluate',
        { kind: 'customer', scenario: sc, transcript },
        signal,
      );
      next = res.turn;
    } else {
      if (!reduced()) await sleep(SCRIPTED_BEAT_MS, signal);
      next = scriptedCustomerTurn(sc, transcript);
    }
    return next.done || !next.message.trim() ? null : next.message.trim();
  }, []);

  /** A past chat's opening, or an AI scenario: the chat starts with the
   *  customer's first message. An AI scenario then runs itself to the end. */
  const start = useCallback(
    async (first: string, sc?: ChatScenario) => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      recorded.current = false;
      pickEngine();
      commit([{ kind: 'customer', id: nid('cust'), text: first }]);
      try {
        let turn = await agentTurn(ctrl.signal);
        if (!sc) {
          setPhase('idle');
          return;
        }
        for (let n = 1; n < MAX_CUSTOMER_TURNS; n += 1) {
          // Nothing to answer: the evaluation broke, the skill does not fit
          // this chat, or the agent said nothing.
          if (turn.status === 'error' || turn.turn?.stage === 'noMatch' || !turn.turn?.reply) break;
          const msg = await customerTurn(sc, ctrl.signal);
          if (!msg) break;
          commit([...itemsRef.current, { kind: 'customer', id: nid('cust'), text: msg }]);
          turn = await agentTurn(ctrl.signal);
        }
        finish();
      } catch (e) {
        if (ctrl.signal.aborted) return;
        commit([
          ...itemsRef.current,
          { kind: 'agent', id: nid('agent'), status: 'error', error: e instanceof LiveCopilotError ? e.message : 'The AI customer could not reply.' },
        ]);
        finish();
      }
    },
    [commit, agentTurn, customerTurn, finish, pickEngine],
  );

  /** The user, as the customer, sends a message. */
  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || phase === 'agent' || phase === 'customer' || phase === 'ended') return;
      const ctrl = new AbortController();
      abort.current = ctrl;
      if (itemsRef.current.length === 0) {
        recorded.current = false;
        pickEngine();
      }
      commit([...itemsRef.current, { kind: 'customer', id: nid('cust'), text: t }]);
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

  const end = useCallback(() => finish(), [finish]);

  const reset = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    recorded.current = false;
    commit([]);
    setPhase('idle');
  }, [commit]);

  const outcomes = items
    .filter((it): it is AgentItem => it.kind === 'agent')
    .map(itemOutcome)
    .filter((o): o is TurnOutcome => o !== null);

  return {
    items,
    phase,
    engine,
    busy: phase === 'agent' || phase === 'customer',
    outcome: outcomes.length ? worstOutcome(outcomes) : null,
    start,
    send,
    retry,
    end,
    reset,
  };
}

export type ChatRun = ReturnType<typeof useChatRun>;
