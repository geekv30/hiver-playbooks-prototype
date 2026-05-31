'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RiCornerUpLeftLine, RiThumbUpLine, RiThumbDownLine, RiAlertLine } from 'react-icons/ri';
import { SIM_BRANCH, SIM_DRAFT } from './traceFixture';
import styles from './RunOutcome.module.css';

type Verdict = 'none' | 'up' | 'down';

interface Props {
  /** 'passed' shows the drafted reply; 'attention' shows the caught-gap nudge. */
  kind: 'passed' | 'attention';
  branch?: string;
  draft?: string;
  onVerdict?: (v: 'up' | 'down') => void;
}

/**
 * RunOutcome — the payoff above the trace: the drafted reply with its matched
 * branch attributed inside the box (so branch -> draft reads as connected) and
 * the verdict as icon-only thumbs; or the caught-gap nudge. Springs in via Motion
 * (motion.dev), honouring prefers-reduced-motion.
 */
export default function RunOutcome({ kind, branch = SIM_BRANCH, draft = SIM_DRAFT, onVerdict }: Props) {
  const [verdict, setVerdict] = useState<Verdict>('none');
  const reduce = useReducedMotion();
  const choose = (v: 'up' | 'down') => {
    setVerdict(v);
    onVerdict?.(v);
  };

  const spring = { type: 'spring' as const, stiffness: 420, damping: 34 };
  const enter = reduce ? false : { opacity: 0, y: 6 };

  if (kind === 'attention') {
    return (
      <motion.div className={styles.attn} initial={enter} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <div className={styles.attnHead}>
          <RiAlertLine aria-hidden />
          No branch matched
        </div>
        <p className={styles.attnBody}>
          The condition didn&apos;t match any branch for this email. Add an ELSE to handle it.
        </p>
        <button type="button" className={styles.attnAction}>
          Add an ELSE branch
        </button>
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
              onClick={() => choose('up')}
              aria-label="Looks right"
              title="Looks right"
            >
              <RiThumbUpLine aria-hidden />
            </button>
            <button
              type="button"
              className={styles.vbtn}
              data-down
              data-on={verdict === 'down' || undefined}
              onClick={() => choose('down')}
              aria-label="Needs work"
              title="Needs work"
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
