'use client';

import { useEffect, useRef } from 'react';
import { RiMailLine } from 'react-icons/ri';
import Checkbox from '@/components/atoms/Checkbox';
import type { SimEmail } from '@/data/simFixtures';
import type { EmailRun } from './useSimRun';
import StatusPill, { type PillStatus } from './StatusPill';
import RunOutcome, { type Verdict } from './RunOutcome';
import RunTrace from './RunTrace';
import styles from './EmailCard.module.css';

interface Props {
  email: SimEmail;
  /** Run state (present once a run starts). */
  run?: EmailRun;
  /** Persisted human verdict for this email (survives re-runs). */
  verdict?: Verdict;
  onVerdict?: (v: Verdict) => void;
  /** Recent-emails select mode: show a checkbox + make the card a toggle. */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

/**
 * EmailCard - Figma 211:20104 / 211:20418: bordered card with sender, subject,
 * single-line preview. When a run is in flight it grows a status pill + the
 * collapsible trace, and auto-scrolls into view when it starts running (so the
 * panel follows the run from one email to the next).
 */
export default function EmailCard({ email, run, verdict, onVerdict, selectable, selected, onToggleSelect }: Props) {
  const showRun = !!run && run.status !== 'idle';
  const inSelect = !!selectable && !showRun;
  const ref = useRef<HTMLElement>(null);
  const status = run?.status;

  useEffect(() => {
    if (status === 'running') {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [status]);

  return (
    <article
      ref={ref}
      className={styles.card}
      data-selectable={inSelect || undefined}
      data-selected={(inSelect && selected) || undefined}
      onClick={inSelect ? onToggleSelect : undefined}
      style={{ scrollMarginBlock: 12 }}
    >
      <div className={styles.head}>
        <div className={styles.sender}>
          {inSelect ? (
            <Checkbox checked={selected} ariaLabel={`Select email from ${email.sender}`} />
          ) : (
            <RiMailLine className={styles.mail} aria-hidden />
          )}
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
          {run!.status === 'passed' && (
            <RunOutcome kind="passed" draft={email.draft} verdict={verdict} onVerdict={onVerdict} />
          )}
          {run!.status === 'attention' && <RunOutcome kind="attention" />}
          {run!.status === 'failed' && <RunOutcome kind="failed" />}
          <div className={styles.divider} aria-hidden />
          <RunTrace stepStatus={run!.steps} stepMs={run!.durations} outcome={run!.status} />
        </>
      )}
    </article>
  );
}
