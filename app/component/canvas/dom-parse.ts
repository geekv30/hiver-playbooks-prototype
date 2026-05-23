import type { Chip, Frag } from './data';

/**
 * Walk the DOM children of a contentEditable step body and rebuild the
 * fragments array. Chips, refs, and code blocks are detected via data-*
 * attributes and preserved (chip config survives the edit). Text nodes
 * are collected into text fragments.
 *
 * Adapted from prototype/lib/parseFragments.ts.
 */
export function parseFragmentsFromDom(
  container: HTMLElement,
  original: Frag[],
): Frag[] {
  const chipById = new Map<string, Chip>();
  for (const f of original) {
    if (f.kind === 'chip') chipById.set(f.chip.id, f.chip);
  }

  const result: Frag[] = [];
  let buffer = '';
  const flush = () => {
    if (buffer.length > 0) {
      result.push({ kind: 'text', text: buffer });
      buffer = '';
    }
  };

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      buffer += node.textContent ?? '';
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    if (el.dataset && el.dataset.skip === 'true') return;

    const chipId = el.getAttribute('data-chip-id');
    if (chipId) {
      flush();
      const chip = chipById.get(chipId);
      if (chip) result.push({ kind: 'chip', chip });
      return;
    }

    const refPath = el.getAttribute('data-ref-path');
    if (refPath) {
      flush();
      result.push({ kind: 'ref', refPath });
      return;
    }

    if (el.tagName === 'CODE') {
      flush();
      const code = el.textContent ?? '';
      if (code) result.push({ kind: 'code', code });
      return;
    }

    el.childNodes.forEach(walk);
  };

  container.childNodes.forEach(walk);
  flush();
  return result;
}

/**
 * Text offset from start of stepBody to the current caret position.
 * Used to place an inserted chip at exactly the caret.
 */
export function getCaretTextOffset(container: HTMLElement): number {
  if (typeof window === 'undefined') return 0;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange();
  pre.selectNodeContents(container);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

/**
 * Caret-anchor for popping a picker just below the caret.
 */
export interface CaretAnchor { top: number; left: number; }
export function getCaretAnchor(container: HTMLElement, pickerHeight = 320): CaretAnchor | null {
  if (typeof window === 'undefined') return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  let rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    rect = container.getBoundingClientRect();
  }
  const viewportBottom = window.innerHeight - 16;
  const top = rect.bottom + 4;
  if (top + pickerHeight > viewportBottom) {
    return { top: rect.top - pickerHeight - 4, left: rect.left };
  }
  return { top, left: rect.left };
}

/**
 * Insert a chip into a step's fragments at the given text offset.
 * Text offset = number of characters from the start of the step body's
 * textContent up to the caret.
 *
 * Atomic fragments (chip / ref / code) are treated as having their visible
 * text length so the offset math matches what the user sees / what
 * window.getSelection().toString() returns.
 */
export function insertChipAtTextOffset(
  fragments: Frag[],
  chip: Chip,
  textOffset: number,
  fragmentTextLen: (f: Frag) => number,
): Frag[] {
  const next: Frag[] = [];
  let running = 0;
  let inserted = false;
  for (const f of fragments) {
    const flen = fragmentTextLen(f);
    if (!inserted && textOffset <= running + flen) {
      if (f.kind === 'text') {
        const splitAt = Math.max(0, textOffset - running);
        const left = f.text.slice(0, splitAt);
        const right = f.text.slice(splitAt);
        if (left) next.push({ kind: 'text', text: left });
        next.push({ kind: 'chip', chip });
        if (right) next.push({ kind: 'text', text: right });
      } else {
        next.push({ kind: 'chip', chip });
        next.push(f);
      }
      inserted = true;
    } else {
      next.push(f);
      running += flen;
    }
  }
  if (!inserted) next.push({ kind: 'chip', chip });
  // collapse adjacent text fragments
  return collapseTextFragments(next);
}

export function collapseTextFragments(fragments: Frag[]): Frag[] {
  const out: Frag[] = [];
  for (const f of fragments) {
    const prev = out[out.length - 1];
    if (f.kind === 'text' && prev && prev.kind === 'text') {
      out[out.length - 1] = { kind: 'text', text: prev.text + f.text };
    } else {
      out.push(f);
    }
  }
  return out;
}
