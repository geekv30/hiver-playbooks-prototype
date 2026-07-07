'use client';

import { useEffect, useMemo, useState } from 'react';
import { RiSendPlaneFill, RiStopCircleLine } from 'react-icons/ri';
import type { SimEmail, SimStatusKind } from '@/data/simFixtures';
import { useSimRun } from './useSimRun';
import { SIM_DRAFT } from './traceFixture';
import RunTrace from './RunTrace';
import RunOutcome, { type OutcomeStatus } from './RunOutcome';
import StatusPill from './StatusPill';
import styles from './ComposeEval.module.css';

interface Props {
  /** Pre-filled body (a chosen AI scenario's email); empty for a blank custom email. */
  initialBody?: string;
  /** Placeholder shown when the field is empty. */
  placeholder: string;
  /** Footer CTA label (default "Start Evaluation"). */
  ctaLabel?: string;
  /** The seeded email whose scripted outcome the run replays (+ its draft). */
  seed?: SimEmail;
  /** Report a completed run's status up to the canvas (the eval aggregate). */
  onRunRecorded?: (statuses: SimStatusKind[]) => void;
  /** Open Copilot to fix a caught gap (Fix with Copilot). */
  onOpenCopilot?: () => void;
}

/**
 * ComposeEval - edit an email, then evaluate it (Figma 1752:21176 / 1769:19480).
 * On start the email moves into a quoted result that streams the redesigned trace
 * and resolves to an outcome (pill + action). Approve resolves an approval run to
 * passed; Decline holds it. (The trace is the scripted illustrative run.)
 */
export default function ComposeEval({
  initialBody = '',
  placeholder,
  ctaLabel = 'Start Evaluation',
  seed,
  onRunRecorded,
  onOpenCopilot,
}: Props) {
  const [body, setBody] = useState(initialBody);
  const [sentBody, setSentBody] = useState<string | null>(null);
  const [decision, setDecision] = useState<'approved' | 'declined' | null>(null);

  const emails = useMemo<SimEmail[]>(
    () =>
      sentBody !== null
        ? [
            {
              id: 'compose',
              sender: seed?.sender ?? 'You',
              subject: seed?.subject ?? 'Custom email',
              preview: sentBody,
              body: sentBody,
              outcome: seed?.outcome,
              failAt: seed?.failAt,
            },
          ]
        : [],
    [sentBody, seed],
  );
  const { phase, runs, start, stop } = useSimRun(emails, onRunRecorded);
  const run = runs['compose'];
  const running = phase === 'running';
  const done = sentBody !== null && phase === 'done';
  const showResult = sentBody !== null && !!run && run.status !== 'idle';
  const replyDraft = seed?.draft ?? SIM_DRAFT;

  useEffect(() => {
    if (sentBody !== null) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentBody]);
  useEffect(() => {
    setDecision(null);
  }, [run?.status]);

  const startEval = () => {
    if (!body.trim() || running) return;
    setSentBody(body);
  };
  const stopEval = () => {
    stop();
    setSentBody(null);
  };

  const status = run?.status;
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
    <div className={styles.compose}>
      {showResult ? (
        <div className={styles.scroll}>
          <article className={styles.result}>
            {seed?.subject && <div className={styles.resultSubject}>{seed.subject}</div>}
            <p className={styles.resultBody}>{sentBody}</p>
            {running ? (
              <div className={styles.pillRow}>
                <StatusPill status="running" />
              </div>
            ) : (
              outcomeStatus && (
                <RunOutcome
                  status={outcomeStatus}
                  draft={replyDraft}
                  onRedo={start}
                  onRetry={start}
                  onFix={onOpenCopilot}
                  onApprove={() => setDecision('approved')}
                  onDecline={() => setDecision('declined')}
                />
              )
            )}
            <div className={styles.divider} aria-hidden />
            <RunTrace stepStatus={run!.steps} stepMs={run!.durations} outcome={traceOutcome} draft={replyDraft} />
          </article>
        </div>
      ) : (
        <>
          <div className={styles.spacer} aria-hidden />
          <div className={styles.fieldWrap}>
            <div className={styles.field}>
              <textarea
                className={styles.input}
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={placeholder}
                aria-label="Email body to evaluate"
              />
            </div>
          </div>
        </>
      )}

      {!showResult ? (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.startBtn}
            data-ready={body.trim().length > 0 || undefined}
            disabled={!body.trim()}
            onClick={startEval}
          >
            <RiSendPlaneFill aria-hidden />
            <span>{ctaLabel}</span>
          </button>
        </div>
      ) : running ? (
        <div className={styles.footer}>
          <button type="button" className={styles.secondaryBtn} onClick={stopEval}>
            <RiStopCircleLine aria-hidden />
            <span>Stop evaluation</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
