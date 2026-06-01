'use client';

import { useEffect, useState } from 'react';
import { RiMailAddLine } from 'react-icons/ri';
import { SIM_TOPICS, type SimEmail, type SimStatusKind, type SimTopic } from '@/data/simFixtures';
import ScenarioList from './ScenarioList';
import TopicHeader from './TopicHeader';
import EmailList from './EmailList';
import TestAllBar, { type TestAllMode } from './TestAllBar';
import { useSimRun } from './useSimRun';
import type { Verdict } from './RunOutcome';
import styles from './SimulatePanel.module.css';

type Tab = 'scenarios' | 'custom';

interface Props {
  /** Whether the panel is open (the canvas makes space for it). */
  open: boolean;
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
 * SimulatePanel - the right-hand simulate surface.
 *
 * Scenarios tab: topic list -> drill into a topic's emails -> "Test all" runs
 * them sequentially with a live trace + per-email outcome. Topic rolls up (header
 * live; list cards persist past runs). Human verdicts persist per email so they
 * survive re-runs. Custom test is a clear "coming soon" placeholder.
 */
export default function SimulatePanel({ open }: Props) {
  const [tab, setTab] = useState<Tab>('scenarios');
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TopicResult>>({});
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});

  const topic = openTopicId ? SIM_TOPICS.find((t) => t.id === openTopicId) ?? null : null;
  const inScenarios = tab === 'scenarios';

  const { phase, runs, start, stop } = useSimRun(topic?.emails ?? NO_EMAILS);
  const mode: TestAllMode = phase === 'running' ? 'running' : phase === 'done' ? 'done' : 'idle';

  // Persist the rollup when a run completes so the topic list reflects it later.
  useEffect(() => {
    if (phase !== 'done' || !openTopicId || !topic) return;
    const agg = aggregate(topic.emails.map((e) => runs[e.id]?.status));
    setResults((prev) => ({
      ...prev,
      [openTopicId]: { status: agg, runCount: (prev[openTopicId]?.runCount ?? 0) + 1 },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, openTopicId]);

  const stored = openTopicId ? results[openTopicId] : undefined;
  const liveAgg = aggregate((topic?.emails ?? []).map((e) => runs[e.id]?.status));

  const headerTopic: SimTopic | null = topic
    ? {
        ...topic,
        status:
          phase === 'running' ? 'running' : phase === 'done' ? liveAgg : stored?.status ?? topic.status,
        runCount: phase === 'done' ? Math.max(1, stored?.runCount ?? 0) : stored?.runCount ?? topic.runCount,
      }
    : null;

  const listTopics: SimTopic[] = SIM_TOPICS.map((t) => {
    const r = results[t.id];
    return r ? { ...t, status: r.status, runCount: r.runCount } : t;
  });

  const tabPanelLabel = tab === 'scenarios' ? 'sim-tab-scenarios' : 'sim-tab-custom';

  return (
    <aside
      className={styles.panel}
      data-open={open || undefined}
      aria-label="Simulate"
      aria-hidden={!open}
      inert={!open}
    >
      <div className={styles.inner}>
        <div className={styles.tabs} role="tablist" aria-label="Simulate views">
          <button
            type="button"
            id="sim-tab-scenarios"
            role="tab"
            aria-selected={tab === 'scenarios'}
            aria-controls="sim-tabpanel"
            className={styles.tab}
            data-active={tab === 'scenarios' || undefined}
            onClick={() => setTab('scenarios')}
          >
            Scenarios
          </button>
          <button
            type="button"
            id="sim-tab-custom"
            role="tab"
            aria-selected={tab === 'custom'}
            aria-controls="sim-tabpanel"
            className={styles.tab}
            data-active={tab === 'custom' || undefined}
            onClick={() => setTab('custom')}
          >
            Custom test
          </button>
        </div>

        <div
          id="sim-tabpanel"
          className={styles.body}
          role="tabpanel"
          aria-labelledby={tabPanelLabel}
        >
          {inScenarios ? (
            topic && headerTopic ? (
              <>
                <TopicHeader topic={headerTopic} onBack={() => setOpenTopicId(null)} />
                <EmailList
                  emails={topic.emails}
                  runs={runs}
                  verdicts={verdicts}
                  onVerdict={(id, v) => setVerdicts((p) => ({ ...p, [id]: v }))}
                />
              </>
            ) : (
              <ScenarioList topics={listTopics} onOpenTopic={setOpenTopicId} />
            )
          ) : (
            <div className={styles.custom} aria-live="polite">
              <RiMailAddLine className={styles.customIcon} aria-hidden />
              <p className={styles.customTitle}>Custom test</p>
              <p className={styles.customBody}>
                Paste or compose a single email and run this playbook against it. Coming soon.
              </p>
            </div>
          )}
        </div>

        {inScenarios && topic && <TestAllBar mode={mode} onTestAll={start} onStop={stop} />}
      </div>
    </aside>
  );
}
