'use client';

import { useState } from 'react';
import { SIM_TOPICS } from '@/data/simFixtures';
import ScenarioList from './ScenarioList';
import TopicHeader from './TopicHeader';
import EmailList from './EmailList';
import TestAllBar from './TestAllBar';
import styles from './SimulatePanel.module.css';

type Tab = 'scenarios' | 'custom';

interface Props {
  /** Whether the panel is open (the canvas makes space for it). */
  open: boolean;
}

/**
 * SimulatePanel — the right-hand simulate surface.
 *
 * Scenarios tab: a topic list that drills into a topic's email list with a
 * pinned "Test all emails" bar. Custom test is a stub (out of scope). The
 * canvas-shift reveal animates the container WIDTH (fixed-width inner, no reflow).
 * The run engine (sequential trace) mounts here in M5.
 */
export default function SimulatePanel({ open }: Props) {
  const [tab, setTab] = useState<Tab>('scenarios');
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);

  const topic = openTopicId ? SIM_TOPICS.find((t) => t.id === openTopicId) ?? null : null;
  const inScenarios = tab === 'scenarios';

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
            (topic ? (
              <>
                <TopicHeader topic={topic} onBack={() => setOpenTopicId(null)} />
                <EmailList emails={topic.emails} />
              </>
            ) : (
              <ScenarioList topics={SIM_TOPICS} onOpenTopic={setOpenTopicId} />
            ))}
        </div>

        {inScenarios && topic && <TestAllBar mode="idle" />}
      </div>
    </aside>
  );
}
