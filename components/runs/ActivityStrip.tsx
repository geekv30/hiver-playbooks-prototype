'use client';

import { useState, type ReactNode } from 'react';
import type { RunState } from '@/data/runFixtures';
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
   * Whether the card header names the chart. 'full' shows "Runs per day";
   * 'peak' and 'none' leave the title to the surface above (the lead-band
   * exhibit still renders those arrangements).
   */
  caption?: 'full' | 'peak' | 'none';
  /**
   * The period control, at the right end of the header row.
   *
   * It belongs beside the plot it changes rather than down among the outcome
   * filters - but the strip only holds the slot, it does not own the control:
   * the range governs the list and the counts too, so the state stays with the
   * surface that owns the filter.
   */
  range?: ReactNode;
}

/** The tallest day in the window. */
export function peakOf(buckets: DayBucket[]): { peak: number; day: number } {
  const peak = Math.max(1, ...buckets.map((b) => b.counts.total));
  const busiest = buckets.reduce((a, b) => (b.counts.total > a.counts.total ? b : a), buckets[0]!);
  return { peak, day: busiest.day };
}

/** Four intervals on round numbers, the top one at or above the peak: a peak
 *  of 44 reads against 0 / 15 / 30 / 45 / 60, never against 44 itself. */
const STEPS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200, 250, 500, 1000];
const INTERVALS = 4;
export function scaleOf(peak: number): number[] {
  const step = STEPS.find((s) => s * INTERVALS >= peak) ?? Math.ceil(peak / INTERVALS);
  return Array.from({ length: INTERVALS + 1 }, (_, i) => step * (INTERVALS - i));
}

// Top to bottom. Completed sits on the baseline and the three states that need
// reading stack above it; declined is the pale cap. Fixed order, so a day with
// no failures never repaints the segments below it.
const STACK: RunState[] = ['declined', 'failed', 'awaiting', 'completed'];

// The legend reads in the order a person asks: did it work, what broke, what
// is waiting on someone, what was turned down.
const LEGEND: { state: RunState; label: string }[] = [
  { state: 'completed', label: 'Completed' },
  { state: 'failed', label: 'Failed' },
  { state: 'awaiting', label: 'Awaiting approval' },
  { state: 'declined', label: 'Declined' },
];

/** A week has room for every date and every total; a month or a quarter does
 *  not, so the axis thins to about eight dates (always ending on today) and the
 *  totals move into the hover readout. */
const LABEL_EVERY_UP_TO = 10;

/**
 * ActivityStrip - runs per day, stacked by outcome.
 *
 * The list answers "what happened"; this answers "when, and was it normal".
 * A failure cluster or a quiet weekend reads as shape before a row is scanned,
 * and each column is a filter: pick a day to narrow the list, pick it again to
 * clear. The y-axis carries the scale, so no bar needs a caption to be read.
 */
export default function ActivityStrip({ buckets, picked, onPick, caption = 'full', range }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const { peak } = peakOf(buckets);
  const ticks = scaleOf(peak);
  const max = ticks[0]!;
  const n = buckets.length;
  const dense = n > LABEL_EVERY_UP_TO;
  const every = dense ? Math.ceil(n / 8) : 1;

  return (
    <div className={styles.wrap}>
      {(caption === 'full' || range) && (
        <div className={styles.head}>
          {caption === 'full' && <h2 className={styles.title}>Runs per day</h2>}
          {range && <span className={styles.range}>{range}</span>}
        </div>
      )}

      <ul className={styles.legend} aria-label="Outcomes">
        {LEGEND.map((l) => (
          <li key={l.state} className={styles.key}>
            <span className={styles.swatch} data-state={l.state} aria-hidden />
            {l.label}
          </li>
        ))}
      </ul>

      <div className={styles.chart}>
        <div className={styles.yAxis} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className={styles.tick} style={{ top: `${100 - (t / max) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>

        <div className={styles.plot}>
          {ticks.map((t) => (
            <span
              key={t}
              className={styles.grid}
              data-base={t === 0 || undefined}
              style={{ top: `${100 - (t / max) * 100}%` }}
              aria-hidden
            />
          ))}

          <div className={styles.cols} data-picked={picked !== null || undefined}>
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
                    <span className={styles.none} aria-hidden />
                  ) : (
                    <span className={styles.bar} style={{ height: `${tall}%` }} aria-hidden>
                      {STACK.map((s) => {
                        const c = b.counts[s];
                        if (c === 0) return null;
                        return (
                          <span
                            key={s}
                            className={styles.seg}
                            data-state={s}
                            style={{ flexGrow: c }}
                          />
                        );
                      })}
                      {/* Last in the stack so the top segment stays :first-child. */}
                      {!dense && <span className={styles.value}>{b.counts.total}</span>}
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

        <div className={styles.xAxis} aria-hidden>
          {buckets.map((b, i) => (
            <span key={b.day} className={styles.date}>
              {(n - 1 - i) % every === 0 ? formatDayShort(b.day) : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
