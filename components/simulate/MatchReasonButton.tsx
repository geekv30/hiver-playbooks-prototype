'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RiInformationLine } from 'react-icons/ri';
import styles from './MatchReasonButton.module.css';

interface Props {
  /** Why the trigger matched this email, in plain words. */
  reason: string;
}

// Room the bubble needs under the icon before it flips above instead.
const ROOM_BELOW = 140;

/** The nearest scrolling ancestor - the list the card sits in - if any. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let n = el.parentElement; n; n = n.parentElement) {
    const oy = getComputedStyle(n).overflowY;
    if (oy === 'auto' || oy === 'scroll') return n;
  }
  return null;
}

// The viewport a position:fixed box is laid out in: scrollbars excluded, which
// window.innerWidth/innerHeight are not.
const viewW = () => document.documentElement.clientWidth;
const viewH = () => document.documentElement.clientHeight;

// The app renders inside `.app-scale` (a global CSS zoom). The bubble mounts
// there too so its type matches the card's; its fixed insets are then zoomed
// as well, so viewport measurements are divided by the effective scale.
const scaleRoot = () => document.querySelector<HTMLElement>('.app-scale') ?? document.body;

interface Anchor {
  /** Distance from the viewport's right edge to the icon's right edge. */
  right: number;
  /** Set when the bubble sits below the icon. */
  top?: number;
  /** Set when it flips above (not enough room below). */
  bottom?: number;
}

/**
 * MatchReasonButton - the "why it matched" info icon on a matched email card.
 *
 * Opens on CLICK, not hover: the reason is information, and hover only ever
 * reveals affordances here. The bubble reuses the "How it works?" tooltip's
 * dark treatment so the flow has one tooltip language, and it is portalled to
 * the app root so the panel's scroll container can never clip it.
 *
 * Closes on Escape (focus returns to the icon), a click anywhere else, or any
 * scroll/resize - a fixed bubble must not drift away from its card.
 */
export default function MatchReasonButton({ reason }: Props) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  // The list the card scrolls in, found on open; its scroll closes the bubble.
  const listRef = useRef<HTMLElement | null>(null);
  const tipId = useId();
  const open = anchor !== null;

  const toggle = () => {
    if (open) {
      setAnchor(null);
      return;
    }
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const list = scrollParent(btn);
    listRef.current = list;
    // Flip against the list's visible bottom, not the window's: running past it
    // would cover whatever sits under the list (the Evaluate footer).
    const floor = Math.min(list?.getBoundingClientRect().bottom ?? viewH(), viewH());
    // Rendered width over layout width = the zoom the icon (and bubble) is under.
    const k = btn.offsetWidth > 0 ? r.width / btn.offsetWidth : 1;
    const right = (viewW() - r.right) / k;
    setAnchor(
      floor - r.bottom < ROOM_BELOW * k
        ? { right, bottom: (viewH() - r.top) / k + 6 }
        : { right, top: r.bottom / k + 6 },
    );
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setAnchor(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      close();
      btnRef.current?.focus();
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      // The icon toggles itself; a click inside the bubble keeps it open.
      if (btnRef.current?.contains(t) || tipRef.current?.contains(t)) return;
      close();
    };
    // Only the card's own list and the page move the icon. Other scrollers
    // (Copilot's thread streaming a reply) must not close it mid-read.
    const list = listRef.current;
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    list?.addEventListener('scroll', close);
    window.addEventListener('scroll', close);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      list?.removeEventListener('scroll', close);
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const above = anchor?.bottom !== undefined;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={styles.btn}
        aria-label="Why this email matched"
        aria-expanded={open}
        aria-controls={open ? tipId : undefined}
        data-open={open || undefined}
        onClick={(e) => {
          // The card behind is a select target; this click only opens the reason.
          e.stopPropagation();
          toggle();
        }}
      >
        <RiInformationLine aria-hidden />
      </button>
      {anchor &&
        createPortal(
          <div
            ref={tipRef}
            id={tipId}
            // A click-opened panel, not a hover tooltip. Announced as it opens
            // so the reason is read without moving focus off the icon.
            role="status"
            className={styles.tip}
            data-side={above ? 'top' : 'bottom'}
            style={{ right: anchor.right, top: anchor.top, bottom: anchor.bottom }}
            // Portalled, but React still bubbles its events to the card, whose
            // click selects the email. Reading (or selecting) the reason must not.
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {!above && <span className={styles.arrow} aria-hidden />}
            <div className={styles.bubble}>
              <p className={styles.title}>Why it matched</p>
              <p className={styles.reason}>{reason}</p>
            </div>
            {above && <span className={styles.arrow} data-down aria-hidden />}
          </div>,
          scaleRoot(),
        )}
    </>
  );
}
