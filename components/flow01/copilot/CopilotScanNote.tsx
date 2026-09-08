'use client';

import { RiSearchEyeLine, RiPlayLine } from 'react-icons/ri';
import Spinner from '@/components/atoms/Spinner';
import styles from './CopilotScanNote.module.css';

export interface ScanNoteState {
  /** The scan is still reading the mailbox. */
  scanning: boolean;
  /** Matches found so far. */
  count: number;
  /** The mailbox being read (one at a time). */
  mailbox: string;
}

interface Props {
  state: ScanNoteState;
  /** The note's one action. Omitted while scanning, or with nothing to show. */
  onOpenEvaluation?: () => void;
  /** Suppress the "nothing matched" wording - used where the scan was never
   *  asked for, so an empty result is not worth telling the user about. */
  hideEmpty?: boolean;
}

/**
 * CopilotScanNote - what trigger matching says inside Copilot, and the whole of
 * what it says: a status line while it reads, then one sentence and one button
 * pointing at the Evaluation tab. The matched emails themselves never render
 * here; Copilot points, the Evaluation tab holds the surface.
 *
 * One renderer for both placements: inside a reply (after Copilot asks which
 * mailboxes a new skill runs on) and on the empty Copilot screen (a skill that
 * already exists, scanned quietly on open).
 */
export default function CopilotScanNote({ state, onOpenEvaluation, hideEmpty }: Props) {
  const { scanning, count, mailbox } = state;
  if (!scanning && count === 0 && hideEmpty) return null;

  return (
    <div className={styles.note} data-found={!scanning || undefined} aria-live="polite">
      <span className={styles.icon} aria-hidden>
        {scanning ? <Spinner size={14} /> : <RiSearchEyeLine />}
      </span>
      <span className={styles.text}>
        {scanning
          ? `Looking for emails that match your trigger in ${mailbox}`
          : count === 0
            ? `Nothing in ${mailbox} matches your trigger yet`
            : `Found ${count} ${count === 1 ? 'email' : 'emails'} in ${mailbox} that match your trigger`}
      </span>
      {!scanning && count > 0 && onOpenEvaluation && (
        <button type="button" className={styles.btn} onClick={onOpenEvaluation}>
          <RiPlayLine aria-hidden />
          Open Evaluation
        </button>
      )}
    </div>
  );
}
