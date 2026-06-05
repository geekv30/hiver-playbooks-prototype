'use client';

import { useState } from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';
import { SIM_COPY, type SimStatusKind } from '@/data/simFixtures';
import { SIM_TRACE, type StepStatus } from './traceFixture';
import TraceStep from './TraceStep';
import styles from './RunTrace.module.css';

interface Props {
  stepStatus: Record<string, StepStatus>;
  /** Actual per-step elapsed ms for this run (shown instead of the base). */
  stepMs?: Record<string, number>;
  /** The email's run outcome - adjusts the Condition step on a caught gap. */
  outcome?: SimStatusKind;
}

const LAST = SIM_TRACE.length - 1;

/** RunTrace - the collapsible Trace section on an email card. */
export default function RunTrace({ stepStatus, stepMs, outcome }: Props) {
  const [open, setOpen] = useState(true);
  return (
    <div className={styles.trace}>
      <button
        type="button"
        className={styles.head}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.title}>Trace</span>
        <RiArrowDownSLine className={styles.chev} data-open={open || undefined} aria-hidden />
      </button>
      <div className={styles.stepsWrap} data-open={open || undefined}>
        <div className={styles.steps}>
          {SIM_TRACE.map((s, i) => {
            const noBranch = s.kind === 'condition' && outcome === 'attention';
            const step = noBranch ? { ...s, branch: SIM_COPY.noBranchTrace } : s;
            return (
              <TraceStep
                key={s.id}
                step={step}
                status={stepStatus[s.id] ?? 'pending'}
                runMs={stepMs?.[s.id]}
                isLast={i === LAST}
                branchWarn={noBranch}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
