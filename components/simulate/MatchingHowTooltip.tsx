'use client';

import { useEffect, useRef } from 'react';
import { SCAN_CEILING } from '@/data/matchPool';
import styles from './MatchingHowTooltip.module.css';

interface Props {
  /** Close it: a click outside, Escape, or the trigger again. */
  onDismiss: () => void;
}

/**
 * MatchingHowTooltip - how matching works, as a tooltip rather than a panel
 * (Figma 3345:22590). It floats over the flow instead of pushing the list down,
 * so asking the question costs the user no space and no scroll position.
 *
 * Anchored under the "How it works?" action by its wrapper; the arrow points up
 * at it. Dismisses on Escape or a click anywhere else.
 */
export default function MatchingHowTooltip({ onDismiss }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    const onDown = (e: MouseEvent) => {
      const el = ref.current;
      // The trigger toggles itself, so ignore clicks inside the anchor.
      if (el && !el.parentElement?.contains(e.target as Node)) onDismiss();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onDismiss]);

  return (
    <div ref={ref} className={styles.tip} role="tooltip">
      <span className={styles.arrow} aria-hidden />
      <div className={styles.bubble}>
        <p className={styles.title}>How matching works?</p>
        <ol className={styles.list}>
          <li>We read the {SCAN_CEILING} most recent emails from your selected inbox.</li>
          <li>Hiver AI keeps the ones with matching trigger.</li>
        </ol>
      </div>
    </div>
  );
}
