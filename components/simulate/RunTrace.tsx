'use client';

import { useState } from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';
import { SIM_TRACE, type StepStatus } from './traceFixture';
import TraceStep from './TraceStep';
import styles from './RunTrace.module.css';

interface Props {
  stepStatus: Record<string, StepStatus>;
}

/** RunTrace — the collapsible TRACE section on an email card. */
export default function RunTrace({ stepStatus }: Props) {
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
      {open && (
        <div className={styles.steps}>
          {SIM_TRACE.map((s, i) => (
            <TraceStep
              key={s.id}
              step={s}
              status={stepStatus[s.id] ?? 'pending'}
              isLast={i === SIM_TRACE.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
