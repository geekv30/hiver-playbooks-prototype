'use client';

import { motion, useReducedMotion } from 'motion/react';
import { RiCornerUpLeftLine, RiAlertLine, RiErrorWarningLine } from 'react-icons/ri';
import ThumbsRating, { type Verdict } from '@/components/atoms/ThumbsRating';
import { SIM_COPY } from '@/data/simFixtures';
import { SIM_BRANCH, SIM_DRAFT } from './traceFixture';
import styles from './RunOutcome.module.css';

// Re-exported so existing consumers (EmailCard, EmailList, RecentEmails,
// SimulatePanel) keep importing Verdict from here; the type now lives on the atom.
export type { Verdict };

interface Props {
  /** 'passed' shows the drafted reply; 'attention' the caught-gap nudge; 'failed'
   *  the failure reason. */
  kind: 'passed' | 'attention' | 'failed';
  branch?: string;
  draft?: string;
  /** Controlled verdict (persisted by the panel, so it survives re-runs). */
  verdict?: Verdict;
  onVerdict?: (v: Verdict) => void;
}

/**
 * RunOutcome - the payoff above the trace: the drafted reply with its matched
 * branch attributed inside the box, and a controlled human verdict (icon-only
 * thumbs). For a caught logic gap it shows the needs-attention nudge (guidance
 * only, no dead button). Springs in via Motion (motion.dev), reduced-motion aware.
 */
export default function RunOutcome({ kind, branch = SIM_BRANCH, draft = SIM_DRAFT, verdict, onVerdict }: Props) {
  const reduce = useReducedMotion();
  const spring = { type: 'spring' as const, stiffness: 420, damping: 34 };
  const enter = reduce ? false : { opacity: 0, y: 6 };

  if (kind === 'failed') {
    return (
      <motion.div className={styles.fail} initial={enter} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <div className={styles.failHead}>
          <RiErrorWarningLine aria-hidden />
          {SIM_COPY.failedHead}
        </div>
        <p className={styles.failBody}>{SIM_COPY.failedBody}</p>
      </motion.div>
    );
  }

  if (kind === 'attention') {
    return (
      <motion.div className={styles.attn} initial={enter} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <div className={styles.attnHead}>
          <RiAlertLine aria-hidden />
          {SIM_COPY.noBranchHead}
        </div>
        <p className={styles.attnBody}>{SIM_COPY.noBranchBody}</p>
      </motion.div>
    );
  }

  return (
    <motion.div className={styles.outcome} initial={enter} animate={{ opacity: 1, y: 0 }} transition={spring}>
      <span className={styles.branchCaption}>Matched branch: {branch}</span>
      <div className={styles.draftHead}>
        <span className={styles.draftLabel}>
          <RiCornerUpLeftLine aria-hidden />
          Reply drafted
        </span>
        <ThumbsRating
          verdict={verdict}
          onVerdict={(v) => onVerdict?.(v)}
          upLabel="Looks right"
          downLabel="Needs work"
        />
      </div>
      <p className={styles.draftCard}>{draft}</p>
    </motion.div>
  );
}
