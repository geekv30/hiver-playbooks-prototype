'use client';

// useChatRun - one chat evaluation, turn by turn.
//
// The customer writes (the user, a past chat's first message, or the AI
// customer), the skill takes a turn, and so on. Each skill turn is a checked
// trace with an outcome (lib/eval/wire.checkTurn). A reply that is held - a
// draft, or an action that needs approval - does not reach the customer until
// someone sends it; in an AI scenario it is delivered for the test so the chat
// can go on, and still counts as held.
//
// Live when the model is on for this browser, scripted otherwise - decided per
// conversation, so a chat never switches engines halfway.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorDoc } from '@/components/flow01/doc';
import type { ConnectorHealth } from '@/components/flow01/connectorHealth';
import type { ConnectorSlug } from '@/types/playbook';
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

export type Decision = 'sent' | 'declined';

export type ChatItem =
  | { kind: 'customer'; id: string; text: string }
  | {
      kind: 'skill';
      id: string;
      status: 'running' | 'done' | 'error';
      turn?: CheckedTurn;
      /** Transport or model failure (not a checked outcome). */
      error?: string;
      /** A held reply, once someone acts on it. */
      decision?: Decision;
      /** Delivered for the test only (AI scenarios keep the chat going). */
      autoDelivered?: boolean;
    };

export type ChatPhase = 'idle' | 'skill' | 'customer' | 'ended';

/** Where the conversation came from - labels the first customer message. */
export type ChatOrigin = 'past' | 'scenario' | 'live';

const MAX_CUSTOMER_TURNS = 6;
// The scripted engine answers instantly; a short beat keeps its working state
// readable instead of flashing (it is labelled "Scripted demo" throughout).
const SCRIPTED_BEAT_MS = 700;

let seq = 0;
const nid = (p: string) => `${p}-${(seq += 1)}`;

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/** The conversation as the skill has seen it: every customer message, and the
 *  skill replies that actually reached the customer. */
export function transcriptOf(items: ChatItem[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const it of items) {
    if (it.kind === 'customer') out.push({ role: 'customer', text: it.text });
    else if (it.status === 'done' && it.turn?.reply && delivered(it)) out.push({ role: 'skill', text: it.turn.reply });
  }
  return out;
}

export function delivered(it: Extract<ChatItem, { kind: 'skill' }>): boolean {
  if (!it.turn?.reply) return false;
  if (!it.turn.held) return true;
  return it.decision === 'sent' || !!it.autoDelivered;
}

/** A skill item's outcome for the conversation roll-up. A transport failure
 *  is an errored turn: the evaluation broke, and it can be retried. */
export function itemOutcome(it: Extract<ChatItem, { kind: 'skill' }>): TurnOutcome | null {
  if (it.status === 'error') return 'errored';
  if (it.status !== 'done' || !it.turn) return null;
  return it.turn.outcome;
}

function actionsTakenOf(items: ChatItem[]): string[] {
  const out: string[] = [];
  for (const it of items) {
    if (it.kind !== 'skill' || !it.turn) continue;
    for (const s of it.turn.steps) {
      if (s.kind !== 'action' || s.status !== 'done' || !s.actionId) continue;
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
  health: Record<ConnectorSlug, ConnectorHealth>;
  live: LiveCopilot;
  /** The finished conversation's outcome, for the eval aggregate. */
  onRunRecorded?: (statuses: SimStatusKind[]) => void;
}

export function useChatRun({ doc, health, live, onRunRecorded }: Options) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [phase, setPhase] = useState<ChatPhase>('idle');
  const [engine, setEngine] = useState<'live' | 'scripted'>('scripted');
  const [scenario, setScenario] = useState<ChatScenario | null>(null);

  // Latest-refs, written after commit so async loops read fresh values.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const ctx = useRef({ doc, health, live, onRunRecorded });
  useEffect(() => {
    ctx.current = { doc, health, live, onRunRecorded };
  }, [doc, health, live, onRunRecorded]);
  const abort = useRef<AbortController | null>(null);
  const engineRef = useRef<'live' | 'scripted'>('scripted');
  const recorded = useRef(false);

  useEffect(() => () => abort.current?.abort(), []);

  const commit = useCallback((next: ChatItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  /** One skill turn on the conversation as it stands. */
  const skillTurn = useCallback(
    async (signal: AbortSignal, auto: boolean): Promise<Extract<ChatItem, { kind: 'skill' }>> => {
      const id = nid('skill');
      const pending: Extract<ChatItem, { kind: 'skill' }> = { kind: 'skill', id, status: 'running' };
      commit([...itemsRef.current, pending]);
      setPhase('skill');
      const before = itemsRef.current.filter((it) => it.id !== id);
      const transcript = transcriptOf(before);
      const firstTurn = !before.some((it) => it.kind === 'skill');
      const { doc: d, health: h, live: l } = ctx.current;
      let done: Extract<ChatItem, { kind: 'skill' }>;
      try {
        let turn: CheckedTurn;
        if (engineRef.current === 'live') {
          const res = await l.post<{ turn: CheckedTurn }>(
            '/api/evaluate',
            { kind: 'skill', doc: d, transcript, actionsTaken: actionsTakenOf(before), health: h },
            signal,
          );
          turn = res.turn;
        } else {
          if (!reduced()) await sleep(SCRIPTED_BEAT_MS, signal);
          turn = checkTurn(d, scriptedSkillTurn(d, transcript), h, firstTurn);
        }
        done = { ...pending, status: 'done', turn, autoDelivered: auto && turn.held };
      } catch (e) {
        if (signal.aborted) throw e;
        const why = e instanceof LiveCopilotError ? e.message : 'Something went wrong reaching the model.';
        done = { ...pending, status: 'error', error: why };
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
      .filter((it): it is Extract<ChatItem, { kind: 'skill' }> => it.kind === 'skill')
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

  /** Start a conversation. `first` is the customer's opening, if there is one. */
  const start = useCallback(
    async (origin: ChatOrigin, first?: string, sc?: ChatScenario) => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      recorded.current = false;
      const eng = ctx.current.live.mode === 'live' ? 'live' : 'scripted';
      engineRef.current = eng;
      setEngine(eng);
      setScenario(sc ?? null);
      commit(first ? [{ kind: 'customer', id: nid('cust'), text: first }] : []);
      if (!first) {
        setPhase('idle');
        return;
      }
      try {
        let turn = await skillTurn(ctrl.signal, origin === 'scenario');
        if (origin !== 'scenario' || !sc) {
          setPhase(turn.turn?.reason === 'trigger' ? 'ended' : 'idle');
          if (turn.turn?.reason === 'trigger') finish();
          return;
        }
        // AI scenario: the AI customer answers until it is done, the skill has
        // nothing to answer, or the chat runs long.
        for (let n = 1; n < MAX_CUSTOMER_TURNS; n += 1) {
          if (turn.status === 'error' || turn.turn?.reason === 'trigger' || !turn.turn?.reply) break;
          const msg = await customerTurn(sc, ctrl.signal);
          if (!msg) break;
          commit([...itemsRef.current, { kind: 'customer', id: nid('cust'), text: msg }]);
          turn = await skillTurn(ctrl.signal, true);
        }
        finish();
      } catch (e) {
        if (ctrl.signal.aborted) return;
        // The AI customer failed: close the chat with what it has.
        commit([
          ...itemsRef.current,
          { kind: 'skill', id: nid('skill'), status: 'error', error: e instanceof LiveCopilotError ? e.message : 'The AI customer could not reply.' },
        ]);
        finish();
      }
    },
    [commit, skillTurn, customerTurn, finish],
  );

  /** The user, as the customer, sends a message. */
  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || phase === 'skill' || phase === 'customer' || phase === 'ended') return;
      const ctrl = new AbortController();
      abort.current = ctrl;
      if (itemsRef.current.length === 0) {
        recorded.current = false;
        const eng = ctx.current.live.mode === 'live' ? 'live' : 'scripted';
        engineRef.current = eng;
        setEngine(eng);
      }
      commit([...itemsRef.current, { kind: 'customer', id: nid('cust'), text: t }]);
      try {
        const turn = await skillTurn(ctrl.signal, false);
        if (turn.turn?.reason === 'trigger') finish();
        else setPhase('idle');
      } catch {
        /* aborted */
      }
    },
    [phase, commit, skillTurn, finish],
  );

  /** Send or decline a held reply. */
  const decide = useCallback(
    (id: string, decision: Decision) => {
      commit(itemsRef.current.map((it) => (it.id === id && it.kind === 'skill' ? { ...it, decision } : it)));
    },
    [commit],
  );

  /** Re-run a failed turn from the same point in the chat. */
  const retry = useCallback(
    async (id: string) => {
      const i = itemsRef.current.findIndex((it) => it.id === id);
      if (i < 0 || phase === 'skill' || phase === 'customer') return;
      const ctrl = new AbortController();
      abort.current = ctrl;
      recorded.current = false;
      commit(itemsRef.current.slice(0, i));
      try {
        await skillTurn(ctrl.signal, false);
        setPhase('idle');
      } catch {
        /* aborted */
      }
    },
    [phase, commit, skillTurn],
  );

  /** Stop whatever is running and close the conversation. */
  const end = useCallback(() => finish(), [finish]);

  const reset = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    recorded.current = false;
    commit([]);
    setPhase('idle');
    setScenario(null);
  }, [commit]);

  const outcomes = items
    .filter((it): it is Extract<ChatItem, { kind: 'skill' }> => it.kind === 'skill')
    .map(itemOutcome)
    .filter((o): o is TurnOutcome => o !== null);

  return {
    items,
    phase,
    engine,
    scenario,
    busy: phase === 'skill' || phase === 'customer',
    outcome: outcomes.length ? worstOutcome(outcomes) : null,
    start,
    send,
    decide,
    retry,
    end,
    reset,
  };
}

export type ChatRun = ReturnType<typeof useChatRun>;
