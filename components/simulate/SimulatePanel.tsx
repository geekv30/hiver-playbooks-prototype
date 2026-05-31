'use client';

import { useState } from 'react';
import { SIM_TOPICS } from '@/data/simFixtures';
import ScenarioList from './ScenarioList';
import styles from './SimulatePanel.module.css';

type Tab = 'scenarios' | 'custom';

interface Props {
  /** Whether the panel is open (the canvas makes space for it). */
  open: boolean;
}

/**
 * SimulatePanel (M1) — the right-hand simulate surface.
 *
 * Shell only: the canvas-shift reveal + the Scenarios / Custom test tabs. The
 * Scenarios body (topic list, drill-down, run trace) lands in M2+. The reveal
 * animates the container WIDTH while the inner content stays a fixed width, so
 * the editor re-centres smoothly and the panel content never reflows mid-animation.
 */
export default function SimulatePanel({ open }: Props) {
  const [tab, setTab] = useState<Tab>('scenarios');

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

        {/* Body — Scenarios shows the topic list; Custom test stays a stub. */}
        <div className={styles.body} role="tabpanel">
          {tab === 'scenarios' && <ScenarioList topics={SIM_TOPICS} />}
        </div>
      </div>
    </aside>
  );
}
