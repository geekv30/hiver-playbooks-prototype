'use client';

// ModalShell - THE one modal chrome (one renderer per pattern). Every centered
// scrim + dialog in the app renders through this: EnableModal,
// ConnectorSetupModal, ColdStartModal. It owns the mechanics they all repeated:
//   - scrim (fixed, centered, ink @ 32%) with fade in/out
//   - dialog card chrome (bg / radius / shadow via CSS vars, so a modal like
//     ColdStart can restyle without a specificity war)
//   - graceful close: exit animation -> onClose (reduced-motion skips straight)
//   - Esc to close, clean scrim-press dismiss (down + up on the scrim itself,
//     so a drag-select ending there never dismisses)
//   - Tab focus trap inside the dialog + focus restore to the opener on close
// Per-modal content, sizing and phases stay in the modal (dialogClassName,
// phase -> data-phase, dialogRef for measure/animate tricks).
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import styles from './ModalShell.module.css';

interface Props {
  ariaLabel?: string;
  /** id of the heading element, when the modal titles itself (else ariaLabel). */
  ariaLabelledby?: string;
  /** Fired AFTER the exit animation (immediately under reduced motion). */
  onClose: () => void;
  /** Block dismissal (Esc / scrim / requestClose) - e.g. mid go-live animation. */
  locked?: boolean;
  /** Mirrored onto the dialog as data-phase for per-modal phase CSS. */
  phase?: string;
  /** Per-modal scrim tweaks (z-index / blur) - set the --modal-* vars. */
  scrimClassName?: string;
  /** Per-modal dialog sizing/layout (+ --modal-* chrome overrides). A modal that
   *  needs the dialog NODE (measure/animate) can reach it from a ref on its own
   *  content root via parentElement. */
  dialogClassName?: string;
  /** Handles keys BEFORE the shell's Esc/Tab (preventDefault to claim a key). */
  onKeyDown?: (e: ReactKeyboardEvent) => void;
  /** How long the exit animation runs before onClose fires. */
  exitMs?: number;
  /** Children receive requestClose - the graceful close for Cancel / X. */
  children: (requestClose: () => void) => ReactNode;
}

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function ModalShell({
  ariaLabel,
  ariaLabelledby,
  onClose,
  locked,
  phase,
  scrimClassName,
  dialogClassName,
  onKeyDown,
  exitMs = 180,
  children,
}: Props) {
  const [closing, setClosing] = useState(false);
  const localDialogRef = useRef<HTMLDivElement>(null);
  const downTargetRef = useRef<EventTarget | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  // Latest-ref for the lock so requestClose (in listeners) reads the live value.
  const lockedRef = useRef(locked);
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  // Capture the opener once, to restore focus to on close.
  useEffect(() => {
    restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const requestClose = useCallback(() => {
    if (lockedRef.current || closing) return; // no bail mid-anim; no double dismiss
    const restore = () => restoreFocusRef.current?.focus();
    if (prefersReduced()) {
      onClose();
      restore();
      return;
    }
    setClosing(true);
    timerRef.current = window.setTimeout(() => {
      onClose();
      restore();
    }, exitMs);
  }, [closing, exitMs, onClose]);

  // Esc closes from anywhere (window-level, so it works wherever focus sits).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose]);

  // Modal-specific keys first, then the Tab trap (focus never escapes the dialog).
  const handleKeyDown = (e: ReactKeyboardEvent) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.key !== 'Tab') return;
    const root = localDialogRef.current;
    if (!root) return;
    const f = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button, input, textarea, [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
    if (f.length === 0) return;
    const first = f[0]!;
    const last = f[f.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Clean scrim press: dismiss only when the press began AND ended on the scrim.
  const onScrimDown = (e: ReactMouseEvent) => {
    downTargetRef.current = e.target;
  };
  const onScrimUp = (e: ReactMouseEvent) => {
    if (e.target === e.currentTarget && downTargetRef.current === e.currentTarget) requestClose();
  };

  return (
    <div
      className={scrimClassName ? `${styles.scrim} ${scrimClassName}` : styles.scrim}
      data-closing={closing || undefined}
      onMouseDown={onScrimDown}
      onMouseUp={onScrimUp}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={localDialogRef}
        className={dialogClassName ? `${styles.dialog} ${dialogClassName}` : styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        data-phase={phase}
      >
        {/* eslint-disable-next-line react-hooks/refs -- requestClose reads refs
            only when invoked from event handlers; the render prop just passes it */}
        {children(requestClose)}
      </div>
    </div>
  );
}
