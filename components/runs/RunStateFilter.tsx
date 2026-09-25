'use client';

import type { RunState } from '@/data/runFixtures';
import { RUN_STATES, RUN_STATE_SHORT, type RunCounts } from './runsModel';
import styles from './RunStateFilter.module.css';

interface Props {
  counts: RunCounts;
  value: RunState | null;
  onChange: (s: RunState | null) => void;
}

/**
 * RunStateFilter - the primary way through the list.
 *
 * One chip per outcome plus All, each showing its count. Selection is carried
 * by the chip (filled), and the outcome's color by its dot, so the two never
 * compete for the same surface. States with no runs stay visible and inert -
 * "0 failed" is worth reading, and clicking it would only empty the list.
 */
export default function RunStateFilter({ counts, value, onChange }: Props) {
  return (
    <div className={styles.group} role="group" aria-label="Filter by outcome">
      <button
        type="button"
        className={styles.chip}
        data-on={value === null || undefined}
        aria-pressed={value === null}
        onClick={() => onChange(null)}
      >
        <span>
          <span className={styles.label}>All</span>{' '}
          <span className={styles.n}>&middot; {counts.total}</span>
        </span>
      </button>

      {RUN_STATES.map((s) => {
        const n = counts[s];
        const on = value === s;
        return (
          <button
            key={s}
            type="button"
            className={styles.chip}
            data-on={on || undefined}
            data-empty={n === 0 || undefined}
            aria-pressed={on}
            disabled={n === 0}
            onClick={() => onChange(on ? null : s)}
          >
            <span className={styles.dotBox} aria-hidden>
              <span className={styles.dot} data-state={s} />
            </span>
            <span>
              <span className={styles.label}>{RUN_STATE_SHORT[s]}</span>{' '}
              <span className={styles.n}>&middot; {n}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
