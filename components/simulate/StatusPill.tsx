import { RiInformationLine } from 'react-icons/ri';
import styles from './StatusPill.module.css';

export type PillStatus = 'running' | 'passed' | 'failed' | 'attention' | 'errored' | 'approval';

const LABEL: Record<PillStatus, string> = {
  running: 'Running evaluation',
  passed: 'Passed',
  failed: 'Failed',
  attention: 'Needs attention',
  errored: 'Errored',
  approval: 'Approval required',
};

// Amber, info-led states (Figma 1769:20959 / 20792 / 1839:33930).
const AMBER = new Set<PillStatus>(['attention', 'errored', 'approval']);

/**
 * StatusPill - the run-state pill (Figma 1769:20959 etc.). Running shows animated
 * dots; Passed shows a green dot; the amber attention / errored / approval states
 * show a leading info glyph. 12px label, 22px pill.
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
      ) : AMBER.has(status) ? (
        <RiInformationLine className={styles.icon} aria-hidden />
      ) : (
        <span className={styles.dot} aria-hidden />
      )}
      <span className={styles.label}>{LABEL[status]}</span>
    </span>
  );
}
