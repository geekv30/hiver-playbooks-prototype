'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
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
  /**
   * How much of the caption row the strip carries.
   *
   * 'peak' when the surface above already says what is counted (the band's
   * sentence does), leaving the one label the plot cannot do without - the
   * scale. 'none' when that surface carries the peak too.
   */
  caption?: 'full' | 'peak' | 'none';
  /**
   * The period control, rendered at the end of the caption row.
   *
   * It belongs beside the plot it changes rather than down among the outcome
   * filters - but the strip only holds the slot, it does not own the control:
   * the range governs the list and the counts too, so the state stays with the
   * surface that owns the filter.
   */
  range?: ReactNode;
}

/** The tallest day in the window - the scale every bar is read against. */
export function peakOf(buckets: DayBucket[]): { peak: number; day: number } {
  const peak = Math.max(1, ...buckets.map((b) => b.counts.total));
  const busiest = buckets.reduce((a, b) => (b.counts.total > a.counts.total ? b : a), buckets[0]!);
  return { peak, day: busiest.day };
}

// Failures ride the top of every stack, where the eye lands first; completed
// sits on the baseline. Fixed order, so a day with no failures never repaints
// the segments below it.
const STACK: typeof RUN_STATES = ['failed', 'awaiting', 'declined', 'completed'];

/**
 * ActivityStrip - runs per day, stacked by outcome.
 *
 * The list answers "what happened"; this answers "when, and was it normal".
 * A failure cluster or a quiet weekend reads as shape before a row is scanned,
 * and each column is a filter: pick a day to narrow the list, pick it again to
 * clear.
 *
 * The outcome colors are the STATUS palette, not a categorical one - these four
 * mean good / waiting / broken / declined, so they carry the same meaning here
 * that they carry on the pills and the filter chips. They never stand for
 * "series 1..4".
 */
export default function ActivityStrip({ buckets, picked, onPick, caption = 'full', range }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const { peak, day: busiestDay } = peakOf(buckets);

  return (
    <div className={styles.wrap}>
      {(caption !== 'none' || range) && (
        <div className={styles.caption}>
          {caption === 'full' && <span className={styles.captionLabel}>Runs per day</span>}
          {/* The one direct label the chart carries: without a peak value there
              is no scale to read the bars against, and every day looks alike. */}
          {caption !== 'none' && (
            <span className={styles.peak}>
              peak {peak} on {formatDayShort(busiestDay)}
            </span>
          )}
          {range && <span className={styles.range}>{range}</span>}
        </div>
      )}

      <div className={styles.plot}>
        <span className={`${styles.grid} ${styles.gridTop}`} aria-hidden />
        <span className={`${styles.grid} ${styles.gridBase}`} aria-hidden />

        {/* The bar is 60% of its slot; these are the ceilings that keep it thin.
            With a week's worth of columns the slots are enormous, so the cap
            opens up - a 28px bar in a 280px slot reads as lonely, not airy. The
            28px was 22 while the plot shared the band with a text column; now
            that it spans the width, 22 clamped the bars to 43% of the slot and
            the 60% rule stopped governing. */}
        <div
          className={styles.cols}
          data-picked={picked !== null || undefined}
          style={{ '--bar-max': buckets.length <= 10 ? '42px' : '28px' } as CSSProperties}
        >
          {buckets.map((b) => {
            const on = picked === b.day;
            const tall = (b.counts.total / peak) * 100;
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
                  <span className={styles.none} aria-hidden />
                ) : (
                  <span className={styles.bar} style={{ height: `${tall}%` }} aria-hidden>
                    {STACK.map((s) => {
                      const n = b.counts[s];
                      if (n === 0) return null;
                      return (
                        <span
                          key={s}
                          className={styles.seg}
                          data-state={s}
                          style={{ height: `${(n / b.counts.total) * 100}%` }}
                        />
                      );
                    })}
                  </span>
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
                          <span className={styles.tipN}>{b.counts[s]}</span>
                          {RUN_STATE_SHORT[s].toLowerCase()}
                        </span>
                      ))
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.axis}>
        <span>{formatDayShort(buckets[0]?.day ?? NOW)}</span>
        <span>{formatDayShort(buckets[buckets.length - 1]?.day ?? NOW)}</span>
      </div>
    </div>
  );
}
