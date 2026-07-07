'use client';

import { useState } from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';
import type { SimStatusKind } from '@/data/simFixtures';
import { SIM_TRACE, SIM_DRAFT, type StepStatus } from './traceFixture';
import TraceStep from './TraceStep';
import styles from './RunTrace.module.css';

interface Props {
  stepStatus: Record<string, StepStatus>;
  /** Actual per-step elapsed ms this run (drives the "Thought for Ns" label). */
  stepMs?: Record<string, number>;
  /** The email's run outcome - drives the condition no-branch note + reply approval. */
  outcome?: SimStatusKind;
  /** The drafted reply, injected into the Reply step's box. */
  draft?: string;
}

const LAST = SIM_TRACE.length - 1;

/** RunTrace - the collapsible Trace section: the redesigned step list (Figma 1839:34067). */
export default function RunTrace({ stepStatus, stepMs, outcome, draft = SIM_DRAFT }: Props) {
  const [open, setOpen] = useState(true);
  const approval = outcome === 'approval';
  return (
    <div className={styles.trace}>
      <button type="button" className={styles.head} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={styles.title}>Trace</span>
        <RiArrowDownSLine className={styles.chev} data-open={open || undefined} aria-hidden />
      </button>
      <div className={styles.stepsWrap} data-open={open || undefined}>
        <div className={styles.steps}>
          {SIM_TRACE.map((s, i) => (
            <TraceStep
              key={s.id}
              step={s}
              status={stepStatus[s.id] ?? 'pending'}
              runMs={stepMs?.[s.id]}
              isLast={i === LAST}
              draft={s.kind === 'reply' ? draft : undefined}
              approval={s.kind === 'reply' && approval}
              branchWarn={s.kind === 'condition' && outcome === 'attention'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
