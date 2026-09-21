import type { RunCounts } from './runsModel';
import { RUN_STATES, RUN_STATE_LABEL } from './runsModel';
import styles from './OutcomeBar.module.css';

/**
 * OutcomeBar - the outcome mix of a set of runs as one thin stacked rule.
 * Reused by the Skills list cell and the Runs summary so the same numbers
 * always look the same. Purely a summary: the labelled counts sit beside it.
 */
export default function OutcomeBar({ counts }: { counts: RunCounts }) {
  const { total } = counts;
  const label = RUN_STATES.filter((s) => counts[s] > 0)
    .map((s) => `${counts[s]} ${RUN_STATE_LABEL[s].toLowerCase()}`)
    .join(', ');

  return (
    <span
      className={styles.bar}
      data-empty={total === 0 || undefined}
      role="img"
      aria-label={total === 0 ? 'No runs' : label}
    >
      {total > 0 &&
        RUN_STATES.filter((s) => counts[s] > 0).map((s) => (
          <span
            key={s}
            className={styles.seg}
            data-state={s}
            style={{ width: `${(counts[s] / total) * 100}%` }}
          />
        ))}
    </span>
  );
}
