'use client';

import Spinner from '@/components/atoms/Spinner';
import { SearchAiIcon } from '@/components/icons/ui';
import NewTag from '@/components/atoms/NewTag';
import styles from './CopilotScanNote.module.css';

export interface ScanNoteState {
  /** The scan is still reading the mailbox. */
  scanning: boolean;
  /** Matches found so far. */
  count: number;
  /** The mailbox being read (one at a time). */
  mailbox: string;
  /** True while the result is still news: the mark is violet, then it settles
   *  to the resting ink (Figma 3345:25415 -> 3351:30202). */
  fresh?: boolean;
}

interface Props {
  state: ScanNoteState;
  /** Open the Evaluation tab on the matched list. */
  onOpenEvaluation?: () => void;
  /** Row (the Copilot screen's list) or note (inside a reply). */
  variant?: 'row' | 'note';
  /** Row only: suppress a scan that found nothing - unprompted, so it speaks
   *  only when it has something to offer. */
  hideEmpty?: boolean;
}

/**
 * CopilotScanNote - what trigger matching says inside Copilot, and the whole of
 * what it says. The matched emails themselves never render here: Copilot points,
 * the Evaluation tab holds the surface.
 *
 * Two placements, one renderer. On the Copilot screen it is the last row of the
 * starter list (Figma 3351:29653 while it reads, 3345:25415 once it has found
 * something, 3351:30202 after that result stops being news). Inside a reply it
 * is a note, because there it answers a question the user was asked.
 */
export default function CopilotScanNote({
  state,
  onOpenEvaluation,
  variant = 'row',
  hideEmpty,
}: Props) {
  const { scanning, count, mailbox, fresh } = state;
  const empty = !scanning && count === 0;
  if (empty && hideEmpty) return null;

  const label = scanning
    ? 'Finding matching emails for you...'
    : empty
      ? `Nothing in ${mailbox} matches your trigger yet`
      : `Evaluate on ${count} ${count === 1 ? 'email' : 'emails'} that match your trigger`;

  const mark = scanning ? <Spinner size={16} /> : <SearchAiIcon width={16} height={16} />;

  if (variant === 'note') {
    return (
      <div className={styles.note} aria-live="polite">
        <span className={styles.noteIcon} aria-hidden>
          {mark}
        </span>
        <span className={styles.noteText}>
          {scanning
            ? `Looking for emails that match your trigger in ${mailbox}`
            : empty
              ? `Nothing in ${mailbox} matches your trigger yet`
              : `Found ${count} ${count === 1 ? 'email' : 'emails'} in ${mailbox} that match your trigger`}
        </span>
      </div>
    );
  }

  // A row that does nothing yet is a status line, not a control.
  const actionable = !scanning && count > 0 && !!onOpenEvaluation;

  return (
    <button
      type="button"
      className={styles.row}
      data-fresh={(fresh && actionable) || undefined}
      data-reading={scanning || undefined}
      disabled={!actionable}
      aria-live="polite"
      onClick={() => onOpenEvaluation?.()}
    >
      <span className={styles.rowIcon} aria-hidden>
        {mark}
      </span>
      <span className={styles.rowText}>{label}</span>
      {actionable && <NewTag />}
    </button>
  );
}
