'use client';

import type { RunState, SkillRun } from '@/data/runFixtures';
import ActivityStrip from './ActivityStrip';
import {
  RUN_STATES,
  RUN_STATE_LABEL,
  bucketByDay,
  countBy,
  failureLead,
  formatWait,
  oldestWait,
  trendPct,
  type RangeDays,
} from './runsModel';
import styles from './RunSummary.module.css';

interface Props {
  /** Runs in the window, before the state / day / query filters. */
  windowRuns: SkillRun[];
  days: RangeDays;
  state: RunState | null;
  onState: (s: RunState | null) => void;
  day: number | null;
  onDay: (d: number | null) => void;
}

/**
 * RunSummary - the shape of the window before any row is read: how many runs,
 * whether that is up or down, the daily activity, and the outcome split.
 *
 * Each outcome stat is also the filter for its state, so the summary doubles
 * as the coarse navigation instead of repeating the filter bar. Two counts
 * carry a second line, because a number alone is not actionable: failures name
 * their dominant cause, and pending approvals name the oldest wait.
 */
export default function RunSummary({
  windowRuns,
  days,
  state,
  onState,
  day,
  onDay,
}: Props) {
  const counts = countBy(windowRuns);
  const buckets = bucketByDay(windowRuns, days);
  const trend = trendPct(windowRuns, days);
  const lead = failureLead(windowRuns);
  const wait = oldestWait(windowRuns);

  const note = (s: RunState): { text: string; code?: string } | null => {
    if (s === 'failed' && lead) {
      return lead.count === lead.total
        ? { text: 'all ', code: lead.code }
        : { text: `${lead.count} of them ` , code: lead.code };
    }
    if (s === 'awaiting' && wait !== null) {
      return { text: `oldest waiting ${formatWait(wait)}` };
    }
    return null;
  };

  return (
    <div className={styles.summary}>
      <div className={styles.top}>
        <div className={styles.lead}>
          <span className={styles.count}>
            <span className={styles.figure}>{counts.total}</span>
            {trend !== null && (
              <span className={styles.trend} data-dir={trend > 0 ? 'up' : trend < 0 ? 'down' : undefined}>
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
            )}
          </span>
          <span className={styles.period}>
            {counts.total === 1 ? 'run' : 'runs'} in the last {days} days
          </span>
        </div>
        <div className={styles.chart}>
          <ActivityStrip buckets={buckets} picked={day} onPick={onDay} />
        </div>
      </div>

      <div className={styles.stats}>
        {RUN_STATES.map((s) => {
          const n = note(s);
          const on = state === s;
          return (
            <button
              key={s}
              type="button"
              className={styles.stat}
              data-on={on || undefined}
              aria-pressed={on}
              onClick={() => onState(on ? null : s)}
            >
              <span className={styles.statHead}>
                <span className={styles.dot} data-state={s} aria-hidden />
                <span className={styles.statN}>{counts[s]}</span>
              </span>
              <span className={styles.statLabel}>{RUN_STATE_LABEL[s]}</span>
              {n && (
                <span className={styles.note}>
                  {n.text}
                  {n.code && <span className={styles.code}>{n.code}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
