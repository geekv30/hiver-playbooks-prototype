'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RiArrowUpLine, RiRestartLine, RiStarFill, RiStarLine, RiStopCircleLine } from 'react-icons/ri';
import PanelTabs from '@/components/flow01/copilot/PanelTabs';
import panelStyles from '@/components/flow01/copilot/SidePanel.module.css';
import EvalBackHeader from '@/components/simulate/EvalBackHeader';
import { CHAT_EVAL_ENTRIES, CHAT_EVAL_ICONS } from '@/components/simulate/EvalMenu';
import scenarioStyles from '@/components/simulate/AiScenarios.module.css';
import flowStyles from '@/components/simulate/RecentEmails.module.css';
import TraceStep from '@/components/simulate/TraceStep';
import { toDef } from '@/components/simulate/chat/LiveTrace';
import { findAction } from '@/data/library';
import type { EditorDoc } from '@/components/flow01/doc';
import type { CheckedTurn, TurnOutcome } from '@/lib/eval/wire';
import type { DemoRun } from './useDemoRun';
import styles from './shared.module.css';

export const RESULT: Record<TurnOutcome, string> = {
  passed: 'Passed',
  attention: 'Needs attention',
  errored: 'Errored',
};

// The panel's height at a 1440 x 900 window (measured on /api-example).
const PANEL_H = 830;

/** The docked side panel with the Evaluation tab on a chat flow, as it ships:
 *  the tabs, the flow's back-header and its one header action. */
export function Frame({ run, children }: { run: DemoRun; children: ReactNode }) {
  const entry = run.mode === 'ai' ? 'chatScenarios' : 'chatLive';
  const title = CHAT_EVAL_ENTRIES.find((e) => e.id === entry)!.title;
  const started = run.items.length > 0;
  const action =
    run.mode === 'ai' ? (
      run.phase === 'ended' ? (
        <button type="button" className={scenarioStyles.regen} onClick={run.replay}>
          <RiRestartLine aria-hidden />
          <span>Run again</span>
        </button>
      ) : undefined
    ) : !started ? undefined : run.phase === 'ended' ? (
      <button type="button" className={scenarioStyles.regen} onClick={run.reset}>
        <RiRestartLine aria-hidden />
        <span>Start over</span>
      </button>
    ) : (
      <button type="button" className={scenarioStyles.regen} onClick={run.end} disabled={run.busy}>
        <RiStopCircleLine aria-hidden />
        <span>End chat</span>
      </button>
    );
  return (
    <div className={styles.stage} style={{ height: PANEL_H }}>
      <aside className={panelStyles.panel} aria-label="Evaluation">
        <PanelTabs active="simulate" onChange={() => {}} />
        <EvalBackHeader title={title} icon={CHAT_EVAL_ICONS[entry]} onBack={() => {}} action={action} />
        <div className={styles.body}>{children}</div>
      </aside>
    </div>
  );
}

/** The skill's steps for one agent turn, in the trace renderer the email
 *  evaluation uses (its quiet form). */
export function Steps({ doc, turn }: { doc: EditorDoc; turn: CheckedTurn }) {
  const gated = new Set(turn.gatedSteps);
  const defs = turn.steps.map((s, i) => toDef(doc, s, i, gated));
  return (
    <div className={styles.steps}>
      {defs.map((d, i) => (
        <TraceStep
          key={d.id}
          step={d}
          status={turn.steps[i]!.status}
          isLast={i === defs.length - 1}
          branchWarn={d.kind === 'condition' && turn.steps[i]!.branch === 'none'}
          quiet
        />
      ))}
    </div>
  );
}

/** What the skill did this turn, as one line: the actions it ran, by name. */
export function stepSummary(turn: CheckedTurn): string {
  const names = turn.steps
    .filter((s) => s.kind === 'action' && s.actionId)
    // "HubSpot · Get contact" reads as "HubSpot": the tool, not the verb.
    .map((s) => (findAction(s.actionId!)?.name ?? '').split(' · ')[0]!)
    .filter((n, i, all) => n && all.indexOf(n) === i);
  const shown = names.slice(0, 2).join(', ');
  const more = names.length > 2 ? ` +${names.length - 2}` : '';
  return shown ? `${shown}${more}` : 'Reasoned and replied';
}

/** The condition branch this turn took, as the author wrote it. */
export function branchTaken(doc: EditorDoc, turn: CheckedTurn): string | null {
  const s = turn.steps.find((x) => x.kind === 'condition');
  if (!s) return null;
  const def = toDef(doc, s, 0, new Set());
  return def.branch ?? null;
}

export function Stars({ score }: { score: number }) {
  return (
    <span className={styles.stars} aria-label={`${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (n <= score ? <RiStarFill key={n} aria-hidden /> : <RiStarLine key={n} aria-hidden />))}
    </span>
  );
}

/** Keep the newest message in view as the chat grows. */
export function useFollow(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [dep]);
  return ref;
}

/** Writing as the customer. `look` picks the variant's shape. */
export function Composer({ run, look }: { run: DemoRun; look: 'card' | 'pill' }) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
  }, [value]);
  const submit = () => {
    const t = value.trim();
    if (!t || run.busy) return;
    run.send(t);
    setValue('');
  };
  const ready = !run.busy && value.trim().length > 0;
  return (
    <div className={styles.composerWrap}>
      <div className={styles.composer} data-look={look}>
        <textarea
          ref={ref}
          className={styles.input}
          rows={1}
          value={value}
          placeholder="Message as the customer..."
          aria-label="Message as the customer"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="button"
          className={styles.send}
          aria-label="Send as the customer"
          data-ready={ready || undefined}
          disabled={!ready}
          onClick={submit}
        >
          <RiArrowUpLine />
        </button>
      </div>
    </div>
  );
}

/** Stop evaluation, under an AI customer's chat while it runs. */
export function StopBar({ run }: { run: DemoRun }) {
  if (run.mode !== 'ai' || run.phase === 'ended' || run.phase === 'judging' || run.items.length === 0) return null;
  return (
    <div className={flowStyles.footer}>
      <button type="button" className={flowStyles.stopBtn} onClick={run.end}>
        <RiStopCircleLine aria-hidden />
        <span>Stop evaluation</span>
      </button>
    </div>
  );
}

export const EMPTY_HINT =
  'Write the first message the way a customer would in your chat widget. The skill starts once the customer says what they need.';
