import type { Fragment, Chip } from '@/types/playbook';

/**
 * Walk the DOM children of a contentEditable container and rebuild a
 * fragments array. Chips and refs are detected via their data-* attributes and
 * preserved from the original fragments array (so chip config and ref metadata
 * survive the edit). Text nodes are collected into text fragments.
 *
 * Children that are explicitly marked with `contentEditable="false"` or that
 * carry a `data-skip="true"` attribute (e.g. the inline WHEN label) are
 * ignored entirely.
 */
export function parseFragmentsFromDom(
  container: HTMLElement,
  original: Fragment[],
): Fragment[] {
  const chipById = new Map<string, Chip>();
  for (const f of original) {
    if (f.kind === 'chip') chipById.set(f.chip.id, f.chip);
  }

  const result: Fragment[] = [];
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

    // <code> blocks are preserved as code fragments
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
