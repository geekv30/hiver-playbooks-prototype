import { RiTimeLine, RiErrorWarningLine, RiCloseCircleLine } from 'react-icons/ri';
import type { RunState } from '@/data/runFixtures';
import { RUN_STATE_LABEL, RUN_STATE_SHORT } from './runsModel';
import styles from './RunStatePill.module.css';

interface Props {
  state: RunState;
  /** Short labels for tight spots (filters, row meta). */
  short?: boolean;
}

/**
 * RunStatePill - the outcome of one run. Completed carries a plain dot; the
 * three states that need reading carry a glyph, so the difference survives
 * without color (an amber and a red pill are otherwise one shape apart).
 */
export default function RunStatePill({ state, short }: Props) {
  return (
    <span className={styles.pill} data-state={state}>
      {state === 'completed' && <span className={styles.dot} aria-hidden />}
      {state === 'awaiting' && <RiTimeLine className={styles.icon} aria-hidden />}
      {state === 'failed' && <RiErrorWarningLine className={styles.icon} aria-hidden />}
      {state === 'declined' && <RiCloseCircleLine className={styles.icon} aria-hidden />}
      {short ? RUN_STATE_SHORT[state] : RUN_STATE_LABEL[state]}
    </span>
  );
}

/** The same state as a bare mark, for list rows where a pill per line would
 *  stripe the column. */
export function RunStateDot({ state }: { state: RunState }) {
  return (
    <span
      className={styles.bare}
      data-state={state}
      role="img"
      aria-label={RUN_STATE_LABEL[state]}
    />
  );
}
