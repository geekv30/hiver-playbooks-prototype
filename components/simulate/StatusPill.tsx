import styles from './StatusPill.module.css';

export type PillStatus = 'running' | 'passed' | 'failed' | 'attention';

const LABEL: Record<PillStatus, string> = {
  running: 'Running evaluation',
  passed: 'Passed',
  failed: 'Failed',
  attention: 'Needs attention',
};

/**
 * StatusPill - the run state on an email card (Figma 211:20446). Running shows
 * three animated dots ("running simulation"); resolved shows a colored dot +
 * outcome. No emoji - real animated indicator + a dot.
 */
export default function StatusPill({ status }: { status: PillStatus }) {
  return (
    <span className={styles.pill} data-status={status}>
      {status === 'running' ? (
        <span className={styles.dots} aria-hidden>
          <span />
          <span />
          <span />
        </span>
      ) : (
        <span className={styles.dot} aria-hidden />
      )}
      <span className={styles.label}>{LABEL[status]}</span>
    </span>
  );
}
