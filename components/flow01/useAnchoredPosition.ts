'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

export interface Anchor {
  left: number;
  top: number;
  bottom: number;
}

/**
 * Position a fixed popover at an anchor (a clicked tag/chip), zoom-aware:
 * prefer below, flip above when it would overflow the bottom, clamp into the
 * viewport when neither side fully fits. Anchor + getBoundingClientRect are
 * visual (zoom-applied) px; the popover is fixed inside the zoomed app, so the
 * returned left/top are layout px (= visual / --app-scale). Because it is fixed,
 * it escapes any `overflow` ancestor - so it never clips at a container border.
 *
 * Runs in useLayoutEffect (before paint) so the corrected position is the first
 * thing shown - no flash. Returns null until measured; render at a fallback.
 */
export function useAnchoredPosition(
  anchor: Anchor,
  ref: RefObject<HTMLElement | null>,
  gap = 6,
): { left: number; top: number } | null {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    const zoom =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-scale')) || 1;
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = el.getBoundingClientRect(); // visual px
    const h = r.height;
    const w = r.width;
    const spaceBelow = vh - anchor.bottom - margin;
    const spaceAbove = anchor.top - margin;
    let visualTop: number;
    if (h <= spaceBelow) visualTop = anchor.bottom + gap;
    else if (h <= spaceAbove) visualTop = anchor.top - gap - h;
    else if (spaceBelow >= spaceAbove) visualTop = vh - margin - h;
    else visualTop = margin;
    visualTop = Math.max(margin, Math.min(visualTop, vh - margin - h));
    const visualLeft = Math.max(margin, Math.min(anchor.left, vw - w - margin));
    const next = { left: visualLeft / zoom, top: visualTop / zoom };
    setPos((prev) =>
      prev && Math.abs(prev.left - next.left) < 0.5 && Math.abs(prev.top - next.top) < 0.5
        ? prev
        : next,
    );
  }, [anchor.left, anchor.top, anchor.bottom, ref, gap]);
  return pos;
}
