'use client';

import { useEffect, useRef } from 'react';
import { RiMailLine } from 'react-icons/ri';
import type { SimEmail } from '@/data/simFixtures';
import type { EmailRun } from './useSimRun';
import StatusPill, { type PillStatus } from './StatusPill';
import RunOutcome from './RunOutcome';
import RunTrace from './RunTrace';
import styles from './EmailCard.module.css';

interface Props {
  email: SimEmail;
  /** Run state (present once "Test all" starts). */
  run?: EmailRun;
}

/**
 * EmailCard — Figma 211:20104 / 211:20418: bordered card with sender, subject,
 * single-line preview. When a run is in flight it grows a status pill + the
 * collapsible trace, and auto-scrolls into view when it starts running (so the
 * panel follows the run from one email to the next).
 */
export default function EmailCard({ email, run }: Props) {
  const showRun = !!run && run.status !== 'idle';
  const ref = useRef<HTMLElement>(null);
  const status = run?.status;

  useEffect(() => {
    if (status === 'running') {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [status]);

  return (
    <article ref={ref} className={styles.card} style={{ scrollMarginBlock: 12 }}>
      <div className={styles.head}>
        <div className={styles.sender}>
          <RiMailLine className={styles.mail} aria-hidden />
          <span className={styles.name}>{email.sender}</span>
        </div>
        <div className={styles.body}>
          <div className={styles.subject}>{email.subject}</div>
          <div className={styles.preview}>{email.preview}</div>
        </div>
      </div>

      {showRun && (
        <>
          <div className={styles.pillRow}>
            <StatusPill status={run!.status as PillStatus} />
          </div>
          {run!.status === 'passed' && <RunOutcome kind="passed" draft={email.draft} />}
          {run!.status === 'attention' && <RunOutcome kind="attention" />}
          <div className={styles.divider} aria-hidden />
          <RunTrace stepStatus={run!.steps} outcome={run!.status} />
        </>
      )}
    </article>
  );
}
