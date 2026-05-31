'use client';

import { useState } from 'react';
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
 * RunOutcome — the payoff above the trace: which branch fired (neutral chip) +
 * the drafted reply, with the human verdict as icon-only thumbs inside the
 * reply box. For a caught logic gap it shows the "needs attention" nudge instead.
 */
export default function RunOutcome({ kind, branch = SIM_BRANCH, draft = SIM_DRAFT, onVerdict }: Props) {
  const [verdict, setVerdict] = useState<Verdict>('none');
  const choose = (v: 'up' | 'down') => {
    setVerdict(v);
    onVerdict?.(v);
  };

  if (kind === 'attention') {
    return (
      <div className={styles.attn}>
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
      </div>
    );
  }

  return (
    <div className={styles.outcome}>
      <span className={styles.branch}>matched: {branch}</span>
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
        <p className={styles.draftBody}>{draft}</p>
      </div>
    </div>
  );
}
