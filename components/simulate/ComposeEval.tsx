'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { RiAttachment2, RiSendPlaneFill, RiStopCircleLine } from 'react-icons/ri';
import type { SimEmail, SimStatusKind } from '@/data/simFixtures';
import { useSimRun } from './useSimRun';
import { SIM_DRAFT } from './traceFixture';
import RunTrace from './RunTrace';
import RunOutcome, { type OutcomeStatus } from './RunOutcome';
import StatusPill from './StatusPill';
import {
  AttachmentChips,
  AttachmentError,
  FilePicker,
  MAX_FILES,
  useAttachments,
  type Attachment,
} from './attachments';
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
 * ComposeEval - write or edit a test email, then evaluate it (Figma 1752:21176 /
 * 1769:19480). One email card: From and Subject rows, the body, files (paperclip,
 * drop on the card, or paste), all bottom-anchored above Start Evaluation. From
 * and Subject can stay empty; a scenario pre-fills them. On start the email moves
 * into a quoted result that streams the trace and resolves to an outcome (pill +
 * action). Approve resolves an approval run to passed; Decline holds it. Files are
 * UI only. (The trace is the scripted illustrative run.)
 */
export default function ComposeEval({
  initialBody = '',
  placeholder,
  ctaLabel = 'Start Evaluation',
  seed,
  onRunRecorded,
  onOpenCopilot,
}: Props) {
  const [from, setFrom] = useState(seed?.sender ?? '');
  const [subject, setSubject] = useState(seed?.subject ?? '');
  const [body, setBody] = useState(initialBody);
  const [sentBody, setSentBody] = useState<string | null>(null);
  const [sent, setSent] = useState<{ from: string; subject: string; files: Attachment[] }>({ from: '', subject: '', files: [] });
  const att = useAttachments({ tooBig: 'over 10 MB. Each file can be up to 10 MB.', tooMany: `An email can carry ${MAX_FILES} files.` });
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  // The body grows with its text, then scrolls. Measured before paint, so a
  // long pre-filled scenario opens at its height instead of jumping to it.
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 120), 240)}px`;
  }, [body, sentBody]);
  const [decision, setDecision] = useState<'approved' | 'declined' | null>(null);

  const emails = useMemo<SimEmail[]>(
    () =>
      sentBody !== null
        ? [
            {
              id: 'compose',
              sender: sent.from || 'Customer',
              subject: sent.subject || 'Custom email',
              preview: sentBody,
              body: sentBody,
              outcome: seed?.outcome,
              failAt: seed?.failAt,
            },
          ]
        : [],
    // The strings, not the `sent` object: a new object with the same values
    // must not reset the run.
    [sentBody, sent.from, sent.subject, seed],
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

  // Stop takes the Start button's place; a double-click on Start must not stop.
  const startedAt = useRef(0);
  const startEval = () => {
    if (!body.trim() || running || sentBody !== null) return;
    startedAt.current = Date.now();
    att.clearError();
    setSent({ from: from.trim(), subject: subject.trim(), files: att.files });
    setSentBody(body);
  };
  const stopEval = () => {
    if (Date.now() - startedAt.current < 500) return;
    stop();
    setSentBody(null);
  };
  // Anywhere on the card: paste files, Cmd/Ctrl+Enter starts.
  const onCardPaste = (e: ClipboardEvent) => att.onPaste(e);
  const onCardKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      startEval();
    }
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
            {(sent.subject || sent.from) && (
              <header className={styles.resultHead}>
                {sent.subject && <div className={styles.resultSubject}>{sent.subject}</div>}
                {sent.from && <div className={styles.resultFrom}>From {sent.from}</div>}
              </header>
            )}
            <p className={styles.resultBody}>{sentBody}</p>
            <AttachmentChips files={sent.files} />
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
        // The whole edit area takes a drop, so a file released beside the card
        // is attached instead of opened by the browser (losing the email).
        <div className={styles.editScroll} {...att.dropProps}>
          <div className={styles.spacer} aria-hidden />
          <div className={styles.fieldWrap}>
            <div
              className={styles.card}
              data-dragging={att.dragging || undefined}
              onPaste={onCardPaste}
              onKeyDown={onCardKeyDown}
            >
              <label className={styles.row}>
                <span className={styles.rowLabel}>From</span>
                <input
                  className={styles.rowInput}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="Name or email"
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <label className={styles.row}>
                <span className={styles.rowLabel}>Subject</span>
                <input
                  className={styles.rowInput}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Add a subject"
                  autoComplete="off"
                />
              </label>
              <textarea
                ref={bodyRef}
                className={styles.input}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={att.dragging ? 'Drop files to attach them' : placeholder}
                aria-label="Email body to evaluate"
              />
              <AttachmentChips
                className={styles.chips}
                files={att.files}
                onRemove={(id) => {
                  att.remove(id);
                  bodyRef.current?.focus();
                }}
              />
              <div className={styles.toolbar}>
                <button
                  type="button"
                  className={styles.attach}
                  onClick={() => pickerRef.current?.click()}
                  aria-label="Attach files"
                  title="Attach files"
                  disabled={att.full}
                >
                  <RiAttachment2 aria-hidden />
                </button>
                {att.full && <span className={styles.toolbarNote}>{MAX_FILES} files is the limit</span>}
                <FilePicker inputRef={pickerRef} onFiles={att.add} />
              </div>
            </div>
            <AttachmentError className={styles.error} error={att.error} />
          </div>
        </div>
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
