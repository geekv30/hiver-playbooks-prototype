'use client';

import { RiThumbUpLine, RiThumbDownLine } from 'react-icons/ri';
import styles from './ThumbsRating.module.css';

export type Verdict = 'up' | 'down';

interface Props {
  /** Controlled verdict (persist it in the parent so it survives re-renders). */
  verdict?: Verdict;
  onVerdict: (v: Verdict) => void;
  upLabel?: string;
  downLabel?: string;
  className?: string;
}

/**
 * ThumbsRating - icon-only up/down verdict, the single renderer for "rate this"
 * across the app (the Simulate run outcome and the Copilot reply). A picked thumb
 * lights up (ok/warn toned) and pops once. One renderer per pattern; the consumer
 * owns the value.
 */
export default function ThumbsRating({
  verdict,
  onVerdict,
  upLabel = 'Good response',
  downLabel = 'Bad response',
  className,
}: Props) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={styles.btn}
        data-on={verdict === 'up' || undefined}
        aria-pressed={verdict === 'up'}
        aria-label={upLabel}
        onClick={() => onVerdict('up')}
      >
        <RiThumbUpLine aria-hidden />
      </button>
      <button
        type="button"
        className={styles.btn}
        data-down
        data-on={verdict === 'down' || undefined}
        aria-pressed={verdict === 'down'}
        aria-label={downLabel}
        onClick={() => onVerdict('down')}
      >
        <RiThumbDownLine aria-hidden />
      </button>
    </div>
  );
}
