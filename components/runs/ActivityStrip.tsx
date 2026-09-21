'use client';

import { useState } from 'react';
import { NOW } from '@/data/runFixtures';
import type { DayBucket } from './runsModel';
import { RUN_STATES, RUN_STATE_SHORT, formatDayShort, formatDayLabel } from './runsModel';
import styles from './ActivityStrip.module.css';

interface Props {
  buckets: DayBucket[];
  /** The day currently filtered to (start-of-day ms), or null. */
  picked: number | null;
  /** Clicking a column filters to that day; clicking it again clears. */
  onPick: (day: number | null) => void;
}

/**
 * ActivityStrip - run volume per day across the window, stacked by outcome.
 *
 * The list answers "what happened"; this answers "when, and was it normal".
 * A run of failures, a quiet weekend, the day volume doubled - all read as
 * shape before a single row is scanned. Each column is a filter: pick a day to
 * narrow the list to it, pick it again to clear.
 */
export default function ActivityStrip({ buckets, picked, onPick }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...buckets.map((b) => b.counts.total));

  return (
    <div>
      <div className={styles.strip} data-picked={picked !== null || undefined}>
        {buckets.map((b) => {
          const on = picked === b.day;
          const tall = (b.counts.total / max) * 100;
          return (
            <button
              key={b.day}
              type="button"
              className={styles.col}
              data-on={on || undefined}
              onClick={() => onPick(on ? null : b.day)}
              onMouseEnter={() => setHover(b.day)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(b.day)}
              onBlur={() => setHover(null)}
              aria-pressed={on}
              aria-label={`${formatDayLabel(b.day)}: ${b.counts.total} ${
                b.counts.total === 1 ? 'run' : 'runs'
              }`}
            >
              {b.counts.total === 0 ? (
                <span className={styles.empty} aria-hidden />
              ) : (
                // Failed first in DOM order = top of the column, where the eye lands.
                ['failed', 'awaiting', 'declined', 'completed'].map((s) => {
                  const n = b.counts[s as keyof typeof b.counts] as number;
                  if (n === 0) return null;
                  return (
                    <span
                      key={s}
                      className={styles.seg}
                      data-state={s}
                      style={{ height: `${(n / b.counts.total) * tall}%` }}
                    />
                  );
                })
              )}

              {hover === b.day && (
                <span className={styles.tip} role="presentation">
                  <span className={styles.tipDay}>{formatDayLabel(b.day)}</span>
                  {b.counts.total === 0 ? (
                    'No runs'
                  ) : (
                    RUN_STATES.filter((s) => b.counts[s] > 0).map((s) => (
                      <span key={s} className={styles.tipRow}>
                        <span className={styles.tipDot} data-state={s} />
                        {b.counts[s]} {RUN_STATE_SHORT[s].toLowerCase()}
                      </span>
                    ))
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className={styles.axis}>
        <span>{formatDayShort(buckets[0]?.day ?? NOW)}</span>
        <span>{formatDayShort(buckets[buckets.length - 1]?.day ?? NOW)}</span>
      </div>
    </div>
  );
}
