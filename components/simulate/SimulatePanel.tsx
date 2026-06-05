'use client';

import { useEffect, useState } from 'react';
import { RiPlayFill, RiCloseLine } from 'react-icons/ri';
import { SIM_TOPICS, type SimEmail, type SimStatusKind, type SimTopic } from '@/data/simFixtures';
import EvalMenu, { type EvalView, EVAL_TITLES } from './EvalMenu';
import EvalBackHeader from './EvalBackHeader';
import RecentEmails from './RecentEmails';
import ScenarioList from './ScenarioList';
import ScenariosEmpty from './ScenariosEmpty';
import CustomEval from './CustomEval';
import EmailList from './EmailList';
import TestAllBar, { type TestAllMode } from './TestAllBar';
import { useSimRun } from './useSimRun';
import type { Verdict } from './RunOutcome';
import styles from './SimulatePanel.module.css';

interface Props {
  /** Whether the panel is open (the canvas makes space for it). */
  open: boolean;
  /** Close the panel (the floating header X; docked has no close). */
  onClose?: () => void;
  /** Whether this AOP has generated scenarios to show. When false, the AI
   *  scenarios flow shows the informative empty state. */
  hasScenarios?: boolean;
  /** Whether the live AOP has a trigger (drives the empty-state action). */
  hasTrigger?: boolean;
  /** Focus the trigger line in the editor (the empty-state action). */
  onAddTrigger?: () => void;
  /** Render as a floating rounded card (matching CopilotPanel) - /api-example. */
  floating?: boolean;
  /** Rendered inside the docked SidePanel - drop the panel chrome; the SidePanel
   *  provides the card + the Copilot | Evaluation header. */
  docked?: boolean;
  /** Report whether a flow is entered, so the shell swaps the Copilot | Evaluation
   *  tabs for the flow's own top back-header. */
  onSubview?: (inSubview: boolean) => void;
}

interface TopicResult {
  status: SimStatusKind;
  runCount: number;
}

// Stable empty array so the run hook doesn't reset every render on the list view.
const NO_EMAILS: SimEmail[] = [];

function aggregate(statuses: (SimStatusKind | undefined)[]): SimStatusKind {
  if (statuses.some((s) => s === 'failed')) return 'failed';
  if (statuses.some((s) => s === 'attention')) return 'attention';
  return 'passed';
}

/**
 * SimulatePanel - the Evaluate surface (Figma 647:43211 / 695:* / 698:*).
 *
 * A router: the root offers three entry cards (Recent conversations / AI scenarios
 * / Custom email - EvalMenu). Entering one opens its flow and swaps the panel's
 * Copilot | Evaluation tabs for the flow's own `‹` back-header (back always on
 * top). Each flow owns its sub-navigation; the run engine + scenario rollup live
 * here so they survive the slide.
 */
export default function SimulatePanel({
  open,
  onClose,
  hasScenarios = true,
  hasTrigger = false,
  onAddTrigger,
  floating,
  docked,
  onSubview,
}: Props) {
  const [view, setView] = useState<EvalView>('menu');
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TopicResult>>({});
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  // Drill direction for the slide (forward = into a flow / topic, back = out).
  const [dir, setDir] = useState<'fwd' | 'back' | null>(null);

  // Tell the shell to swap the tabs for the back-header while a flow is entered.
  useEffect(() => {
    onSubview?.(view !== 'menu');
  }, [view, onSubview]);

  const topic = openTopicId ? SIM_TOPICS.find((t) => t.id === openTopicId) ?? null : null;
  const { phase, runs, start, stop } = useSimRun(topic?.emails ?? NO_EMAILS);
  const mode: TestAllMode = phase === 'running' ? 'running' : phase === 'done' ? 'done' : 'idle';

  // Persist the rollup when a scenario run completes so the list reflects it later.
  useEffect(() => {
    if (phase !== 'done' || !openTopicId || !topic) return;
    const agg = aggregate(topic.emails.map((e) => runs[e.id]?.status));
    setResults((prev) => ({
      ...prev,
      [openTopicId]: { status: agg, runCount: (prev[openTopicId]?.runCount ?? 0) + 1 },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, openTopicId]);

  const listTopics: SimTopic[] = SIM_TOPICS.map((t) => {
    const r = results[t.id];
    return r ? { ...t, status: r.status, runCount: r.runCount } : t;
  });

  const openFlow = (v: Exclude<EvalView, 'menu'>) => {
    setDir('fwd');
    setView(v);
  };
  const toMenu = () => {
    setDir('back');
    setOpenTopicId(null);
    setView('menu');
  };
  // Scenarios back: a topic returns to the list; the list leaves to the menu.
  const scenariosBack = () => {
    if (topic) {
      setDir('back');
      setOpenTopicId(null);
    } else {
      toMenu();
    }
  };

  const slideKey = view === 'scenarios' ? (topic ? `t:${topic.id}` : 'scenarios') : view;

  return (
    <aside
      className={styles.panel}
      data-open={open || undefined}
      data-floating={floating || undefined}
      data-docked={docked || undefined}
      aria-label="Evaluation"
      aria-hidden={!open}
      inert={!open}
    >
      <div className={styles.inner}>
        {/* Floating-only "Evaluate" header on the menu (the docked panel uses the
            SidePanel's Copilot | Evaluation tabs instead). */}
        {view === 'menu' && !docked && (
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <RiPlayFill className={styles.headerIcon} />
              <span className={styles.headerText}>Evaluate</span>
            </div>
            <button type="button" className={styles.headerClose} aria-label="Close Evaluate" onClick={onClose}>
              <RiCloseLine />
            </button>
          </header>
        )}

        <div className={styles.viewWrap} data-dir={dir ?? undefined} key={slideKey}>
          {view === 'menu' && <EvalMenu onOpen={openFlow} />}

          {view === 'recent' && <RecentEmails onExit={toMenu} />}

          {view === 'custom' && (
            <div className={styles.flow}>
              <EvalBackHeader title={EVAL_TITLES.custom} onBack={toMenu} />
              <CustomEval />
            </div>
          )}

          {view === 'scenarios' && (
            <div className={styles.flow}>
              <EvalBackHeader title={topic ? topic.label : EVAL_TITLES.scenarios} onBack={scenariosBack} />
              <div className={styles.scroll}>
                {!hasScenarios ? (
                  <ScenariosEmpty hasTrigger={hasTrigger} onAddTrigger={onAddTrigger} />
                ) : topic ? (
                  <EmailList
                    emails={topic.emails}
                    runs={runs}
                    verdicts={verdicts}
                    onVerdict={(id, v) => setVerdicts((p) => ({ ...p, [id]: v }))}
                  />
                ) : (
                  <ScenarioList
                    topics={listTopics}
                    onOpenTopic={(id) => {
                      setDir('fwd');
                      setOpenTopicId(id);
                    }}
                  />
                )}
              </div>
              {hasScenarios && topic && <TestAllBar mode={mode} onTestAll={start} onStop={stop} />}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
