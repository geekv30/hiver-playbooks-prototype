'use client';

import { useState } from 'react';
import { SIM_TOPICS, type SimEmail, type SimTopic } from '@/data/simFixtures';
import ScenarioList from './ScenarioList';
import TopicHeader from './TopicHeader';
import EmailList from './EmailList';
import TestAllBar, { type TestAllMode } from './TestAllBar';
import { useSimRun } from './useSimRun';
import styles from './SimulatePanel.module.css';

type Tab = 'scenarios' | 'custom';

interface Props {
  /** Whether the panel is open (the canvas makes space for it). */
  open: boolean;
}

// Stable empty array so the run hook doesn't reset every render on the list view.
const NO_EMAILS: SimEmail[] = [];

/**
 * SimulatePanel — the right-hand simulate surface.
 *
 * Scenarios tab: topic list -> drill into a topic's emails -> "Test all" runs
 * them sequentially with a live trace, pinned bar reflecting the run state. The
 * run engine resets per topic. Custom test is a stub (out of scope).
 */
export default function SimulatePanel({ open }: Props) {
  const [tab, setTab] = useState<Tab>('scenarios');
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);

  const topic = openTopicId ? SIM_TOPICS.find((t) => t.id === openTopicId) ?? null : null;
  const inScenarios = tab === 'scenarios';

  const { phase, runs, start, stop } = useSimRun(topic?.emails ?? NO_EMAILS);
  const mode: TestAllMode = phase === 'running' ? 'running' : phase === 'done' ? 'done' : 'idle';

  // Live rollup for the drill header (M7 extends with failed / needs-attention).
  const headerTopic: SimTopic | null = topic
    ? {
        ...topic,
        status: phase === 'running' ? 'running' : phase === 'done' ? 'passed' : topic.status,
        runCount: phase === 'done' ? Math.max(1, topic.runCount) : topic.runCount,
      }
    : null;

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
            role="tab"
            aria-selected={tab === 'scenarios'}
            className={styles.tab}
            data-active={tab === 'scenarios' || undefined}
            onClick={() => setTab('scenarios')}
          >
            Scenarios
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'custom'}
            className={styles.tab}
            data-active={tab === 'custom' || undefined}
            onClick={() => setTab('custom')}
          >
            Custom test
          </button>
        </div>

        <div className={styles.body} role="tabpanel">
          {inScenarios &&
            (topic && headerTopic ? (
              <>
                <TopicHeader topic={headerTopic} onBack={() => setOpenTopicId(null)} />
                <EmailList emails={topic.emails} runs={runs} />
              </>
            ) : (
              <ScenarioList topics={SIM_TOPICS} onOpenTopic={setOpenTopicId} />
            ))}
        </div>

        {inScenarios && topic && <TestAllBar mode={mode} onTestAll={start} onStop={stop} />}
      </div>
    </aside>
  );
}
