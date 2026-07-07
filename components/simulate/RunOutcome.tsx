'use client';

import { motion, useReducedMotion } from 'motion/react';
import { RiRestartLine, RiSparkling2Line } from 'react-icons/ri';
import { SIM_COPY } from '@/data/simFixtures';
import { SIM_DRAFT } from './traceFixture';
import StatusPill from './StatusPill';
import styles from './RunOutcome.module.css';

export type OutcomeStatus = 'passed' | 'attention' | 'errored' | 'approval' | 'declined';

interface Props {
  status: OutcomeStatus;
  /** The drafted reply, shown in the approval box (Figma 1839:33930). */
  draft?: string;
  onRedo?: () => void;
  onFix?: () => void;
  onRetry?: () => void;
  onApprove?: () => void;
  onDecline?: () => void;
}

// The needs-attention body with "ELSE" emphasised (Figma 1769:20993).
function AttentionBody() {
  const [before, after] = SIM_COPY.noBranchBody.split('ELSE');
  return (
    <p className={styles.boxText}>
      {before}
      <strong className={styles.strong}>ELSE</strong>
      {after}
    </p>
  );
}

/**
 * RunOutcome - the result header + action (Figma 1769:20959 / 20792 / 1799:18390 /
 * 1839:33930): a status pill, an optional message/draft box, and the contextual
 * action(s). The drafted reply itself lives in the trace's Reply step; this block
 * carries the verdict-free pill + next step (Redo / Fix with Copilot / Retry, or
 * Approve / Decline). Springs in via Motion, reduced-motion aware.
 */
export default function RunOutcome({ status, draft = SIM_DRAFT, onRedo, onFix, onRetry, onApprove, onDecline }: Props) {
  const reduce = useReducedMotion();
  const spring = { type: 'spring' as const, stiffness: 420, damping: 34 };
  const enter = reduce ? false : { opacity: 0, y: 6 };

  return (
    <motion.div className={styles.outcome} initial={enter} animate={{ opacity: 1, y: 0 }} transition={spring}>
      {status === 'declined' ? (
        <span className={styles.declinedPill}>Declined</span>
      ) : (
        <StatusPill status={status} />
      )}

      {status === 'attention' && (
        <div className={styles.box}>
          <AttentionBody />
        </div>
      )}
      {status === 'errored' && (
        <div className={styles.box}>
          <p className={styles.boxText}>{SIM_COPY.erroredBody}</p>
        </div>
      )}
      {status === 'approval' && (
        <div className={styles.box}>
          <p className={styles.boxText}>{draft}</p>
        </div>
      )}
      {status === 'declined' && (
        <div className={styles.box}>
          <p className={styles.boxText}>{SIM_COPY.declinedBody}</p>
        </div>
      )}

      {status === 'passed' && (
        <button type="button" className={styles.strokeBtn} onClick={onRedo}>
          <RiRestartLine aria-hidden />
          <span>Redo evaluation</span>
        </button>
      )}
      {status === 'attention' && (
        <button type="button" className={styles.strokeBtn} onClick={onFix}>
          <RiSparkling2Line className={styles.sparkle} aria-hidden />
          <span>Fix with Copilot</span>
        </button>
      )}
      {status === 'errored' && (
        <button type="button" className={styles.strokeBtn} onClick={onRetry}>
          <RiRestartLine aria-hidden />
          <span>Retry evaluation</span>
        </button>
      )}
      {status === 'declined' && (
        <button type="button" className={styles.strokeBtn} onClick={onRedo}>
          <RiRestartLine aria-hidden />
          <span>Redo evaluation</span>
        </button>
      )}
      {status === 'approval' && (
        <div className={styles.approvalRow}>
          <button type="button" className={styles.primaryBtn} onClick={onApprove}>
            Approve
          </button>
          <button type="button" className={styles.tertiaryBtn} onClick={onDecline}>
            Decline
          </button>
        </div>
      )}
    </motion.div>
  );
}
