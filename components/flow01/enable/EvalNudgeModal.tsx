'use client';

// Pre-enable evaluation nudge (spec 2026-07-02). Shows ONLY when this AOP has
// never been evaluated (untested) or has failing evaluations (failures). Always
// skippable - Esc / scrim / x close it, "Enable anyway" proceeds. Same calm
// scrim/dialog family as EnableModal (no morphs), reduced-motion aware via CSS.
import { useEffect, useRef } from 'react';
import { RiCloseLine, RiPlayCircleLine, RiErrorWarningLine } from 'react-icons/ri';
import Button from '@/components/atoms/Button';
import type { EvalAggregate } from '@/components/simulate/useEvalState';
import styles from './EvalNudgeModal.module.css';

interface Props {
  variant: 'untested' | 'failures';
  agg: EvalAggregate;
  /** Primary: open the Evaluation panel (untested: start; failures: review). */
  onEvaluate: () => void;
  /** Ghost: skip the nudge and continue to the Enable modal. */
  onEnableAnyway: () => void;
  onClose: () => void;
}

export default function EvalNudgeModal({ variant, agg, onEvaluate, onEnableAnyway, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the primary action (the last button in the dialog) on open.
  useEffect(() => {
    const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button');
    buttons?.[buttons.length - 1]?.focus();
  }, []);

  const failures = variant === 'failures';
  const title = failures
    ? `${agg.failed} of ${agg.total} evaluation${agg.total === 1 ? '' : 's'} failed`
    : 'Test it before it goes live';
  const body = failures
    ? 'Some evaluation runs did not pass. Review what went wrong before this AOP starts running on real conversations.'
    : 'Run this AOP on a few real emails first and see exactly what it would do. Evaluations never email anyone.';
  const primaryLabel = failures ? 'Review results' : 'Evaluate first';

  return (
    <div
      className={styles.scrim}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-variant={variant}
      >
        <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          <RiCloseLine />
        </button>
        <span className={styles.icon} data-warn={failures || undefined} aria-hidden>
          {failures ? <RiErrorWarningLine /> : <RiPlayCircleLine />}
        </span>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={onEnableAnyway}>
            Enable anyway
          </button>
          <Button variant="accent" onClick={onEvaluate}>
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
