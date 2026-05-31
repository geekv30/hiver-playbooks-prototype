'use client';

import { motion, useReducedMotion } from 'motion/react';
import { RiCornerUpLeftLine, RiThumbUpLine, RiThumbDownLine, RiAlertLine } from 'react-icons/ri';
import { SIM_COPY } from '@/data/simFixtures';
import { SIM_BRANCH, SIM_DRAFT } from './traceFixture';
import styles from './RunOutcome.module.css';

export type Verdict = 'up' | 'down';

interface Props {
  /** 'passed' shows the drafted reply; 'attention' shows the caught-gap nudge. */
  kind: 'passed' | 'attention';
  branch?: string;
  draft?: string;
  /** Controlled verdict (persisted by the panel, so it survives re-runs). */
  verdict?: Verdict;
  onVerdict?: (v: Verdict) => void;
}

/**
 * RunOutcome — the payoff above the trace: the drafted reply with its matched
 * branch attributed inside the box, and a controlled human verdict (icon-only
 * thumbs). For a caught logic gap it shows the needs-attention nudge (guidance
 * only, no dead button). Springs in via Motion (motion.dev), reduced-motion aware.
 */
export default function RunOutcome({ kind, branch = SIM_BRANCH, draft = SIM_DRAFT, verdict, onVerdict }: Props) {
  const reduce = useReducedMotion();
  const spring = { type: 'spring' as const, stiffness: 420, damping: 34 };
  const enter = reduce ? false : { opacity: 0, y: 6 };

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
      <div className={styles.draft}>
        <div className={styles.draftHead}>
          <span className={styles.draftLabel}>
            <RiCornerUpLeftLine aria-hidden />
            Drafted reply
          </span>
          <div className={styles.verdict}>
            <button
              type="button"
              className={styles.vbtn}
              data-on={verdict === 'up' || undefined}
              aria-pressed={verdict === 'up'}
              aria-label="Looks right"
              onClick={() => onVerdict?.('up')}
            >
              <RiThumbUpLine aria-hidden />
            </button>
            <button
              type="button"
              className={styles.vbtn}
              data-down
              data-on={verdict === 'down' || undefined}
              aria-pressed={verdict === 'down'}
              aria-label="Needs work"
              onClick={() => onVerdict?.('down')}
            >
              <RiThumbDownLine aria-hidden />
            </button>
          </div>
        </div>
        <span className={styles.branchCaption}>matched: {branch}</span>
        <p className={styles.draftBody}>{draft}</p>
      </div>
    </motion.div>
  );
}
