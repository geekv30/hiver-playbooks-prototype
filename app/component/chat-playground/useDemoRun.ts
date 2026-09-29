'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorDoc } from '@/components/flow01/doc';
import { itemOutcome, transcriptOf, type AgentItem, type ChatItem, type ChatPhase, type ChatVerdict } from '@/components/simulate/chat/useChatRun';
import { scriptedSkillTurn } from '@/lib/eval/scripted';
import { checkTurn, worstOutcome, type TurnOutcome } from '@/lib/eval/wire';
import { ITEMS, VERDICT } from './fixture';

/* The exhibit's stand-in for useChatRun: the same items, phases and outcome,
 * with no model calls. "AI customer" replays the recorded live chat beat by
 * beat; "You" answers with the scripted engine the playground falls back to.
 * Every panel on the page reads one of these, so they differ only in layout. */

export type DemoMode = 'ai' | 'you';

const BEAT = { customer: 900, agent: 1300, rating: 500, judge: 1500, you: 800 };

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

let seq = 0;
const nid = (p: string) => `${p}-demo-${(seq += 1)}`;

export function useDemoRun(mode: DemoMode, doc: EditorDoc) {
  const [items, setItems] = useState<ChatItem[]>(() => (mode === 'ai' ? ITEMS : []));
  const [phase, setPhase] = useState<ChatPhase>(mode === 'ai' ? 'ended' : 'idle');
  const [verdict, setVerdict] = useState<ChatVerdict | null>(mode === 'ai' ? VERDICT : null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const itemsRef = useRef(items);

  const commit = useCallback((next: ChatItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => clear, [clear]);

  const at = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, reduced() ? 0 : ms));
  }, []);

  /** Play the recorded chat again from the first message. */
  const replay = useCallback(() => {
    clear();
    commit([]);
    setVerdict(null);
    let t = 0;
    for (const it of ITEMS) {
      if (it.kind === 'customer') {
        at(t, () => setPhase('customer'));
        t += BEAT.customer;
        at(t, () => commit([...itemsRef.current, it]));
      } else if (it.kind === 'agent') {
        const running: AgentItem = { kind: 'agent', id: it.id, status: 'running' };
        at(t, () => {
          setPhase('agent');
          commit([...itemsRef.current, running]);
        });
        t += BEAT.agent;
        at(t, () => commit(itemsRef.current.map((x) => (x.id === it.id ? it : x))));
      } else {
        t += BEAT.rating;
        at(t, () => commit([...itemsRef.current, it]));
      }
    }
    at(t, () => setPhase('judging'));
    t += BEAT.judge;
    at(t, () => {
      setVerdict(VERDICT);
      setPhase('ended');
    });
  }, [at, clear, commit]);

  /** You, as the customer: the scripted engine answers. */
  const send = useCallback(
    (text: string) => {
      const started = itemsRef.current.some((i) => i.kind === 'agent' && i.turn?.stage === 'run');
      const id = nid('agent');
      const withCustomer: ChatItem[] = [...itemsRef.current, { kind: 'customer', id: nid('cust'), text }];
      commit([...withCustomer, { kind: 'agent', id, status: 'running' }]);
      setPhase('agent');
      at(BEAT.you, () => {
        const turn = checkTurn(doc, scriptedSkillTurn(doc, transcriptOf(withCustomer), started), started);
        const done: AgentItem = { kind: 'agent', id, status: 'done', turn, firstRun: !started && turn.stage === 'run' };
        commit(itemsRef.current.map((x) => (x.id === id ? done : x)));
        setPhase('idle');
      });
    },
    [at, commit, doc],
  );

  const end = useCallback(() => {
    clear();
    commit(itemsRef.current.filter((it) => !(it.kind === 'agent' && it.status === 'running')));
    setPhase('ended');
  }, [clear, commit]);

  const reset = useCallback(() => {
    clear();
    commit([]);
    setVerdict(null);
    setPhase('idle');
  }, [clear, commit]);

  const outcomes = items
    .filter((it): it is AgentItem => it.kind === 'agent')
    .map(itemOutcome)
    .filter((o): o is TurnOutcome => o !== null);
  if (verdict?.verdict === 'unresolved') outcomes.push('attention');

  return {
    mode,
    items,
    phase,
    verdict,
    engine: (mode === 'ai' ? 'live' : 'scripted') as 'live' | 'scripted',
    busy: phase === 'agent' || phase === 'customer' || phase === 'judging',
    outcome: phase === 'ended' && outcomes.length ? worstOutcome(outcomes) : null,
    replay,
    send,
    end,
    reset,
  };
}

export type DemoRun = ReturnType<typeof useDemoRun>;
