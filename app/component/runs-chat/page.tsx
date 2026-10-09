'use client';

import { useLayoutEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import Link from 'next/link';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import RunDetail from '@/components/runs/RunDetail';
import ChatTrace from '@/components/runs/ChatTrace';
import { OneTrace, ReplyTabs } from '@/components/runs/ChatTraceVariants';
import { useIsClient } from '@/components/runs/useIsClient';
import { runsForSkill, type SkillRun } from '@/data/runFixtures';
import styles from './page.module.css';

/* Skill runs on chat - the open question, side by side.
 *
 * A chat run is several replies, each with its own steps. Three ways to lay
 * that out, all inside the REAL run pane (RunDetail: header, ONE outcome, then
 * the trace), all reading the same real run. Pick a case on top; each option
 * notes its measured height for that case. 01 is what the app ships. */

type CaseId = 'failed' | 'awaiting' | 'declined' | 'left' | 'clean';

const CASES: { id: CaseId; label: string; pick: (r: SkillRun) => boolean }[] = [
  {
    id: 'failed',
    label: 'A step failed',
    pick: (r) => r.state === 'failed' && (r.turns?.length ?? 0) > 1,
  },
  { id: 'awaiting', label: 'Waiting on approval', pick: (r) => r.state === 'awaiting' },
  { id: 'declined', label: 'Approval declined', pick: (r) => r.state === 'declined' },
  { id: 'left', label: 'Customer left', pick: (r) => r.ending === 'left' },
  {
    id: 'clean',
    label: 'Ran clean',
    pick: (r) => r.state === 'completed' && r.ending === 'closed' && (r.turns?.length ?? 0) > 2,
  },
];

const OPTIONS: {
  n: string;
  name: string;
  tag?: string;
  Trace: ComponentType<{ run: SkillRun }>;
  note: string;
  refs: string;
}[] = [
  {
    n: '01',
    name: 'Conversation, steps folded',
    tag: 'Recommended - live in the app',
    Trace: ChatTrace,
    note: 'The chat is the spine. Each AI agent line says how many steps it ran and folds them; the turn that decided the outcome opens by itself, and a folded turn still names a step that broke, waits or was declined. Steps sit between the message and the reply, in the order they happened. Same "AI agent · N steps" grammar as the Evaluation playground.',
    refs: 'Intercom Fin ("Fin’s thoughts" inline, collapsed), Gorgias ("Show reasoning" under each reply), Copilot Studio (collapsed Reasoning), LangSmith Threads (Trajectory view)',
  },
  {
    n: '02',
    name: 'One trace, grouped by message',
    Trace: OneTrace,
    note: 'The email trace stretched over the chat: every step of every turn on the rail, nothing folds, each reply inside its reply step. Closest to email, but a 3-reply chat is three email traces tall, and the conversation is hard to follow between the steps.',
    refs: 'Decagon Trace View (turn by turn, every step shown), Langfuse session replay',
  },
  {
    n: '03',
    name: 'A tab per message',
    Trace: ReplyTabs,
    note: 'One turn at a time, opening on the turn that decided the outcome. Compact, but it hides the arc of the chat: you cannot read what led to the failure without clicking back through the tabs.',
    refs: 'LangSmith Threads (Turns view, one card per turn)',
  },
];

function Option({ o, run }: { o: (typeof OPTIONS)[number]; run: SkillRun }) {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(Math.round(el.getBoundingClientRect().height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <section className={styles.option} data-pick={o.tag ? true : undefined}>
      <div className={styles.optionText}>
        <p className={styles.optionKicker}>
          {o.n}
          {o.tag && <span className={styles.tag}>{o.tag}</span>}
        </p>
        <h2 className={styles.h2}>{o.name}</h2>
        <p className={styles.note}>{o.note}</p>
        <p className={styles.refs}>Seen in: {o.refs}</p>
        {h !== null && <p className={styles.measure}>{h}px tall for this case</p>}
      </div>
      <div className={styles.pane} ref={ref}>
        <RunDetail key={`${o.n}-${run.id}`} run={run} chatTrace={o.Trace} />
      </div>
    </section>
  );
}

export default function RunsChatExhibit() {
  const isClient = useIsClient();
  const [caseId, setCaseId] = useState<CaseId>('failed');
  const chats = useMemo(
    () => (isClient ? runsForSkill('api-error-triage').filter((r) => r.channel === 'chat') : []),
    [isClient],
  );
  const run = chats.find(CASES.find((c) => c.id === caseId)!.pick) ?? null;

  return (
    <div className={styles.bg}>
      <main className={styles.page}>
        <header className={styles.mast}>
          <p className={styles.kicker}>Skill runs · chat</p>
          <h1 className={styles.h1}>One chat run, many replies: three ways to show its steps</h1>
          <p className={styles.standfirst}>
            An email run is one message in, one trace, one summary. A chat run is a short
            conversation, and every reply has its own steps. All three options keep ONE summary for
            the whole run and draw steps with the same rail; only the arrangement differs. Each
            renders the real run pane on a real API error triage chat.
          </p>
          <p className={styles.try}>
            Live in the app: <Link href="/api-example/runs">API error triage runs</Link> (email and
            chat) · <Link href="/aops/seed/order-status/runs">Order status questions runs</Link>{' '}
            (chat only)
          </p>
        </header>

        <div className={styles.picker}>
          <SegmentedControl
            size="sm"
            tabs={CASES.map((c) => ({ id: c.id, label: c.label }))}
            active={caseId}
            onChange={(id) => setCaseId(id as CaseId)}
            ariaLabel="Case"
          />
        </div>

        {run ? (
          OPTIONS.map((o) => <Option key={o.n} o={o} run={run} />)
        ) : (
          <p className={styles.note}>
            {isClient ? 'No run of this kind in the current history.' : ''}
          </p>
        )}
      </main>
    </div>
  );
}
