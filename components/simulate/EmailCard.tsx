'use client';

import { useEffect, useRef, useState } from 'react';
import { RiMailLine } from 'react-icons/ri';
import Checkbox from '@/components/atoms/Checkbox';
import type { SimEmail } from '@/data/simFixtures';
import type { EmailRun } from './useSimRun';
import StatusPill from './StatusPill';
import RunOutcome, { type OutcomeStatus } from './RunOutcome';
import RunTrace from './RunTrace';
import styles from './EmailCard.module.css';

interface Props {
  email: SimEmail;
  /** Run state (present once a run starts). */
  run?: EmailRun;
  /** Re-run this email's evaluation (Redo / Retry). */
  onRerun?: () => void;
  /** Open Copilot to fix a caught gap (Fix with Copilot). */
  onFix?: () => void;
  /** Legacy select mode (used only by the /atoms gallery specimen). */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

/**
 * EmailCard - the evaluated conversation's result card (Figma 1769:20959 etc.):
 * sender / subject / preview head, then the run outcome (pill + action) and the
 * redesigned trace. Approve resolves an approval run to passed; Decline holds it.
 */
export default function EmailCard({ email, run, onRerun, onFix, selectable, selected, onToggleSelect }: Props) {
  const showRun = !!run && run.status !== 'idle';
  const inSelect = !!selectable && !showRun;
  const ref = useRef<HTMLElement>(null);
  const status = run?.status;

  const [decision, setDecision] = useState<'approved' | 'declined' | null>(null);
  // Reset the approval decision whenever a fresh run starts.
  useEffect(() => {
    setDecision(null);
  }, [status]);

  useEffect(() => {
    if (status !== 'running') return;
    const reduce =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    ref.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  }, [status]);

  const running = status === 'running';
  const outcomeStatus: OutcomeStatus | null =
    !status || running
      ? null
      : decision === 'approved'
        ? 'passed'
        : decision === 'declined'
          ? 'declined'
          : (status as OutcomeStatus);
  // Approve un-gates the reply in the trace; Decline keeps it held (gated), so the
  // trace and the "Declined" verdict never contradict each other.
  const traceOutcome = decision === 'approved' ? 'passed' : status;

  return (
    <article ref={ref} className={styles.card} data-selectable={inSelect || undefined} data-selected={(inSelect && selected) || undefined} onClick={inSelect ? onToggleSelect : undefined} style={{ scrollMarginBlock: 12 }}>
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
          {running ? (
            <div className={styles.pillRow}>
              <StatusPill status="running" />
            </div>
          ) : (
            outcomeStatus && (
              <RunOutcome
                status={outcomeStatus}
                draft={email.draft}
                onRedo={onRerun}
                onRetry={onRerun}
                onFix={onFix}
                onApprove={() => setDecision('approved')}
                onDecline={() => setDecision('declined')}
              />
            )
          )}
          <div className={styles.divider} aria-hidden />
          <RunTrace stepStatus={run!.steps} stepMs={run!.durations} outcome={traceOutcome} draft={email.draft} />
        </>
      )}
    </article>
  );
}
