'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { RiAddLine, RiAttachment2, RiSendPlaneFill, RiStopCircleLine, RiSubtractLine } from 'react-icons/ri';
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
  /** How the card says From and Subject are optional. The app uses tag (the
   *  pick); the rest stay for the review page /component/optional-fields.
   *  tag - "Optional" at the end of each empty row; placeholder - the field's
   *  placeholder reads "Optional"; reveal - the rows hide behind a "Sender and
   *  subject" toggle in the toolbar; note - one line under the card; none - no cue. */
  optionalCue?: OptionalCue;
}

export type OptionalCue = 'none' | 'tag' | 'placeholder' | 'reveal' | 'note';

/**
 * ComposeEval - write or edit a test email, then evaluate it (Figma 1752:21176 /
 * 1769:19480). One email card: From and Subject rows, the body, files (paperclip,
 * drop on the card, or paste), all bottom-anchored above Start Evaluation. From
 * and Subject can stay empty (an empty row says "Optional"); a scenario
 * pre-fills them. Both wrap, so a long value stays readable. On start the email moves
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
  optionalCue = 'tag',
}: Props) {
  const [from, setFrom] = useState(seed?.sender ?? '');
  const [subject, setSubject] = useState(seed?.subject ?? '');
  const [body, setBody] = useState(initialBody);
  const [sentBody, setSentBody] = useState<string | null>(null);
  const [sent, setSent] = useState<{ from: string; subject: string; files: Attachment[] }>({ from: '', subject: '', files: [] });
  const att = useAttachments({ tooBig: 'over 10 MB. Each file can be up to 10 MB.', tooMany: `An email can carry ${MAX_FILES} files.` });
  // reveal: the rows start hidden unless a scenario already fills them.
  const [headersOpen, setHeadersOpen] = useState(optionalCue !== 'reveal' || !!seed?.sender || !!seed?.subject);
  const fromRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  // Opening moves focus to From; closing hands it back to the body. Only after
  // a click (not on mount), so a pre-filled scenario keeps its focus alone.
  const toggledHeaders = useRef(false);
  useEffect(() => {
    if (!toggledHeaders.current) return;
    if (headersOpen && !from) fromRef.current?.focus();
    else if (!headersOpen) bodyRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headersOpen]);
  const toggleHeaders = () => {
    toggledHeaders.current = true;
    setHeadersOpen((open) => !open);
  };
  // The cue is for an empty field; once there is a value it only takes room.
  const tag = (value: string) =>
    optionalCue === 'tag' && !value ? <span className={styles.rowOptional}>Optional</span> : null;
  // From and Subject are one line of text, but they wrap so a long address or
  // subject stays readable (up to 4 lines, then they scroll). Enter goes to the
  // next field instead of a new line; pasted line breaks become spaces.
  useLayoutEffect(() => {
    for (const el of [fromRef.current, subjectRef.current]) {
      if (!el) continue;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
    }
  }, [from, subject, headersOpen, sentBody]);
  const oneLine = (v: string) => v.replace(/[\r\n]+/g, ' ');
  const onRowKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    (e.currentTarget === fromRef.current ? subjectRef.current : bodyRef.current)?.focus();
  };
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
    // Hidden rows keep what was typed (open them again and it is back), but
    // the email goes without it.
    setSent({ from: headersOpen ? from.trim() : '', subject: headersOpen ? subject.trim() : '', files: att.files });
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
              {headersOpen && (
                <div className={styles.rows} data-revealed={optionalCue === 'reveal' || undefined}>
                  <label className={styles.row}>
                    <span className={styles.rowLabel}>From</span>
                    <textarea
                      ref={fromRef}
                      rows={1}
                      className={styles.rowInput}
                      value={from}
                      onChange={(e) => setFrom(oneLine(e.target.value))}
                      onKeyDown={onRowKeyDown}
                      placeholder={optionalCue === 'placeholder' ? 'Optional' : 'Name or email'}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {tag(from)}
                  </label>
                  <label className={styles.row}>
                    <span className={styles.rowLabel}>Subject</span>
                    <textarea
                      ref={subjectRef}
                      rows={1}
                      className={styles.rowInput}
                      value={subject}
                      onChange={(e) => setSubject(oneLine(e.target.value))}
                      onKeyDown={onRowKeyDown}
                      placeholder={optionalCue === 'placeholder' ? 'Optional' : 'Add a subject'}
                      autoComplete="off"
                    />
                    {tag(subject)}
                  </label>
                </div>
              )}
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
                {optionalCue === 'reveal' && (
                  <button
                    type="button"
                    className={styles.addHeaders}
                    onClick={toggleHeaders}
                    aria-pressed={headersOpen}
                    title={headersOpen ? 'Remove sender and subject' : 'Add sender and subject'}
                  >
                    {headersOpen ? <RiSubtractLine aria-hidden /> : <RiAddLine aria-hidden />}
                    <span>Sender and subject</span>
                  </button>
                )}
                <FilePicker inputRef={pickerRef} onFiles={att.add} />
              </div>
            </div>
            <AttachmentError className={styles.error} error={att.error} />
            {optionalCue === 'note' && <p className={styles.optionalNote}>From and Subject are optional.</p>}
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
