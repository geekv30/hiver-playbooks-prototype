import type { Fragment, Chip } from '@/types/playbook';
import { findAction } from '@/data/library';

// ---------------------------------------------------------------------------
// flow-01 editor document model.
// A line (the trigger, or a step body) is a Fragment[] — the structured-token
// model: text fragments interleaved with atomic chip/ref tokens.
// ---------------------------------------------------------------------------

export interface DocStep {
  id: string;
  body: Fragment[];
}

export interface EditorDoc {
  title: string;
  trigger: Fragment[];
  steps: DocStep[];
}

export type LineTarget = { kind: 'trigger' } | { kind: 'step'; id: string };

// Deterministic ids: fixed seed ids for SSR stability, a client-only counter
// for everything created through interaction (so server/client markup match).
let idSeq = 0;
export function newId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

export function emptyDoc(): EditorDoc {
  return {
    title: 'Untitled Playbook',
    trigger: [txt('')],
    steps: [{ id: 'step-seed-1', body: [txt('')] }],
  };
}

// --- Fragment helpers ------------------------------------------------------

export const txt = (text: string): Fragment => ({ kind: 'text', text });

export function makeChip(actionId: string, meta?: string): Fragment {
  const action = findAction(actionId);
  const fallbackMeta = meta ?? action?.meta;
  const chip: Chip = {
    id: newId('chip'),
    actionId,
    status: 'ok',
    config: fallbackMeta ? { meta: fallbackMeta } : {},
  };
  return { kind: 'chip', chip };
}

export const makeRef = (refPath: string): Fragment => ({ kind: 'ref', refPath });

// A line counts as "empty" when it has no chips/refs and only blank text.
export function lineIsEmpty(frags: Fragment[]): boolean {
  return frags.every((f) => f.kind === 'text' && f.text.trim() === '');
}

export function lineHasContent(frags: Fragment[]): boolean {
  return !lineIsEmpty(frags);
}

// Plain-text projection of a line (for validity / a11y / debugging).
export function lineToText(frags: Fragment[]): string {
  return frags
    .map((f) => {
      if (f.kind === 'text') return f.text;
      if (f.kind === 'ref') return `@${f.refPath}`;
      if (f.kind === 'chip') {
        const a = findAction(f.chip.actionId);
        return a ? a.name : 'action';
      }
      return '';
    })
    .join('');
}

// Normalize a line so adjacent text fragments merge and there is always a
// trailing text fragment to type into after a chip. Keeps the model tidy.
export function normalizeLine(frags: Fragment[]): Fragment[] {
  const out: Fragment[] = [];
  for (const f of frags) {
    const last = out[out.length - 1];
    if (f.kind === 'text' && last && last.kind === 'text') {
      out[out.length - 1] = { kind: 'text', text: last.text + f.text };
    } else {
      out.push(f);
    }
  }
  if (out.length === 0) out.push(txt(''));
  const tail = out[out.length - 1];
  if (tail && tail.kind !== 'text') out.push(txt(''));
  const head = out[0];
  if (head && head.kind !== 'text') out.unshift(txt(''));
  return out;
}
