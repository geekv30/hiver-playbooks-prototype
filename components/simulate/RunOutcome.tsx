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
 * RunOutcome — the payoff above the trace (Varun's decision): the branch that
 * fired + the drafted reply + a human verdict. For a caught logic gap it shows
 * the "needs attention / add an ELSE" nudge instead.
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
          <RiCornerUpLeftLine aria-hidden />
          Drafted reply
        </div>
        <p className={styles.draftBody}>{draft}</p>
      </div>
      <div className={styles.verdict}>
        <button
          type="button"
          className={styles.vbtn}
          data-on={verdict === 'up' || undefined}
          onClick={() => choose('up')}
        >
          <RiThumbUpLine aria-hidden />
          Looks right
        </button>
        <button
          type="button"
          className={styles.vbtn}
          data-down
          data-on={verdict === 'down' || undefined}
          onClick={() => choose('down')}
        >
          <RiThumbDownLine aria-hidden />
          Needs work
        </button>
      </div>
    </div>
  );
}
