'use client';

// Pre-enable evaluation nudge (spec 2026-07-02). Shows ONLY when this AOP has
// never been evaluated (untested) or has failing evaluations (failures). Always
// skippable - Esc / scrim / x close it, "Enable anyway" proceeds. Chrome comes
// from the shared ModalShell (one renderer per pattern); only content lives here.
//
// Anatomy matches OUR modal register (EnableModal / ConnectorSetup: left-aligned
// title, body, right-aligned footer actions - centered text is reserved for
// success moments). The illustration sits as a full-width band above the text
// and is not decoration - it PREVIEWS an evaluation result (a mini email run
// with its trace and verdict), drawn in our own hairline/tint language.
import { useEffect, useRef, type CSSProperties } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import Button from '@/components/atoms/Button';
import ModalShell from '@/components/atoms/ModalShell';
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

/** Miniature evaluation result: an email card whose trace steps resolve one by
 *  one to a verdict. Pure SVG in the design-language palette; the rows stagger
 *  in via CSS (reduced-motion shows them settled). `failed` flips the last
 *  step + verdict to the failure state. */
function EvalPreviewIllustration({ failed }: { failed?: boolean }) {
  const okDot = '#1f9d61';
  const okTint = '#e6f4ec';
  const failDot = '#cd3746';
  const failTint = '#ffe0e3';
  const lastDot = failed ? failDot : okDot;
  const lastTint = failed ? failTint : okTint;
  return (
    <svg className={styles.illu} viewBox="0 0 240 132" aria-hidden>
      {/* back card of the stack - depth without shadow tricks */}
      <rect x="30" y="10" width="180" height="112" rx="10" fill="#f7f8fa" stroke="#eceff6" />
      {/* front card */}
      <rect x="20" y="18" width="200" height="106" rx="10" fill="#ffffff" stroke="#d6dde8" />
      {/* sender row: avatar + text bars */}
      <circle cx="40" cy="38" r="7" fill="#eceff6" />
      <rect x="53" y="31" width="64" height="5" rx="2.5" fill="#d6dde8" />
      <rect x="53" y="41" width="104" height="5" rx="2.5" fill="#eceff6" />
      {/* divider */}
      <line x1="32" y1="56" x2="208" y2="56" stroke="#eceff6" />
      {/* trace rail + steps, staggered in */}
      <g className={styles.illuRow} style={{ '--i': 0 } as CSSProperties}>
        <circle cx="40" cy="70" r="4" fill={okDot} />
        <rect x="52" y="66" width="72" height="8" rx="4" fill="#fafdff" stroke="#eceff6" />
      </g>
      <line x1="40" y1="75" x2="40" y2="85" stroke="#d6dde8" />
      <g className={styles.illuRow} style={{ '--i': 1 } as CSSProperties}>
        <circle cx="40" cy="90" r="4" fill={okDot} />
        <rect x="52" y="86" width="96" height="8" rx="4" fill="#fafdff" stroke="#eceff6" />
      </g>
      <line x1="40" y1="95" x2="40" y2="105" stroke="#d6dde8" />
      <g className={styles.illuRow} style={{ '--i': 2 } as CSSProperties}>
        <circle cx="40" cy="110" r="4" fill={lastDot} />
        <rect x="52" y="106" width="56" height="8" rx="4" fill="#fafdff" stroke="#eceff6" />
      </g>
      {/* verdict chip, top-right of the card */}
      <g className={styles.illuVerdict}>
        <rect x="162" y="64" width="46" height="18" rx="9" fill={lastTint} />
        {failed ? (
          <path
            d="M180 69.5 l7 7 M187 69.5 l-7 7"
            stroke={failDot}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <path
            d="M178 73.5 l4 4 L190 69"
            stroke={okDot}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </g>
    </svg>
  );
}

export default function EvalNudgeModal({ variant, agg, onEvaluate, onEnableAnyway, onClose }: Props) {
  const actionsRef = useRef<HTMLDivElement>(null);

  // Focus the primary action (the last button in the action row) on open.
  useEffect(() => {
    const buttons = actionsRef.current?.querySelectorAll<HTMLButtonElement>('button');
    buttons?.[buttons.length - 1]?.focus();
  }, []);

  const failures = variant === 'failures';
  const title = failures
    ? `${agg.failed} of ${agg.total} evaluation${agg.total === 1 ? '' : 's'} failed`
    : 'See it run before it goes live';
  const body = failures
    ? 'Each failed run points at the step that broke. Review them now - once this AOP is live, those are real customer conversations.'
    : 'Evaluate this AOP on real emails from your inbox and watch every step it takes - what it tags, what it drafts, where it pauses for a teammate. Nothing ever reaches a customer.';
  const primaryLabel = failures ? 'Review the failed runs' : 'Run an evaluation';

  return (
    <ModalShell ariaLabel={title} onClose={onClose} dialogClassName={styles.dialog}>
      {(requestClose) => (
        <>
          <button type="button" className={styles.close} aria-label="Close" onClick={requestClose}>
            <RiCloseLine />
          </button>
          <div className={styles.illuBand}>
            <EvalPreviewIllustration failed={failures} />
          </div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.body}>{body}</p>
          <div className={styles.actions} ref={actionsRef}>
            <button type="button" className={styles.ghost} onClick={onEnableAnyway}>
              Enable anyway
            </button>
            <Button variant="accent" onClick={onEvaluate}>
              {primaryLabel}
            </Button>
          </div>
        </>
      )}
    </ModalShell>
  );
}
