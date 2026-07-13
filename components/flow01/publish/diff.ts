import { mailboxSummary } from '@/data/mailboxes';
import {
  isCondition,
  lineIsEmpty,
  lineToText,
  type EditorDoc,
  type Step,
} from '../doc';

/**
 * The publish model's diff engine. A live AOP keeps running its PUBLISHED
 * snapshot while the user edits; the editor compares the working doc against
 * that snapshot to (a) know when there are unpublished changes and (b) show a
 * human-readable "What changed" list in the publish review. All pure.
 */

// Steps that count toward the published definition: condition blocks always
// do; a plain line only when it has content. Empty lines are typing
// scaffolding (the trailing "next step" line), never a publishable change.
function contentSteps(steps: Step[]): Step[] {
  return steps.filter((s) => isCondition(s) || !lineIsEmpty(s.body));
}

// Stable projection of the publishable definition. Runtime status is
// excluded on purpose: pausing/resuming operates on the running AOP and must
// never read as an unpublished edit.
export function docFingerprint(doc: EditorDoc): string {
  return JSON.stringify({
    title: doc.title.trim(),
    trigger: doc.trigger,
    steps: contentSteps(doc.steps),
    triggerMode: doc.triggerMode,
    mailboxes: doc.mailboxes,
    guardrails: doc.guardrails,
  });
}

export type ChangeKind = 'added' | 'removed' | 'edited' | 'moved' | 'setting';

/** One row of the "What changed" list: a short lead + the affected excerpt. */
export interface DocChange {
  kind: ChangeKind;
  label: string;
  detail: string;
}

// A condition block reads by its IF expression; a plain step by its line text.
function stepText(step: Step): string {
  if (isCondition(step)) {
    const expr = step.branches[0]?.condition;
    return expr ? `If ${lineToText(expr)}` : 'Condition block';
  }
  return lineToText(step.body);
}

function excerpt(text: string, max = 72): string {
  const t = text.trim();
  if (!t) return 'Empty step';
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Diff the working doc against the published snapshot. Steps match by id
 *  (edits keep ids; duplicate/insert mint fresh ones), so the list reads as
 *  added / removed / edited rows plus one row for a pure reorder. */
export function diffDocs(published: EditorDoc, current: EditorDoc): DocChange[] {
  const out: DocChange[] = [];

  if (current.title.trim() !== published.title.trim()) {
    out.push({ kind: 'setting', label: 'Renamed', detail: excerpt(current.title) });
  }
  if (!same(current.trigger, published.trigger)) {
    out.push({ kind: 'edited', label: 'Trigger edited', detail: excerpt(lineToText(current.trigger)) });
  }

  const before = contentSteps(published.steps);
  const after = contentSteps(current.steps);
  const beforeById = new Map(before.map((s) => [s.id, s]));
  const afterIds = new Set(after.map((s) => s.id));

  for (const step of after) {
    const prev = beforeById.get(step.id);
    const noun = isCondition(step) ? 'Condition' : 'Step';
    if (!prev) {
      out.push({ kind: 'added', label: `${noun} added`, detail: excerpt(stepText(step)) });
    } else if (!same(prev, step)) {
      out.push({ kind: 'edited', label: `${noun} edited`, detail: excerpt(stepText(step)) });
    }
  }
  for (const step of before) {
    if (!afterIds.has(step.id)) {
      const noun = isCondition(step) ? 'Condition' : 'Step';
      out.push({ kind: 'removed', label: `${noun} removed`, detail: excerpt(stepText(step)) });
    }
  }

  // A pure reorder: the surviving steps appear in a different order.
  const beforeOrder = before.filter((s) => afterIds.has(s.id)).map((s) => s.id).join('|');
  const afterOrder = after.filter((s) => beforeById.has(s.id)).map((s) => s.id).join('|');
  if (beforeOrder !== afterOrder) {
    out.push({ kind: 'moved', label: 'Steps reordered', detail: 'Existing steps run in a new order' });
  }

  if (current.triggerMode !== published.triggerMode) {
    out.push({
      kind: 'setting',
      label: 'Trigger mode',
      detail: current.triggerMode === 'automatic' ? 'Now runs automatically' : 'Now runs manually',
    });
  }
  if (!same(current.mailboxes, published.mailboxes)) {
    out.push({
      kind: 'setting',
      label: 'Mailboxes',
      detail: current.mailboxes.length > 0 ? `Now on ${mailboxSummary(current.mailboxes)}` : 'No mailboxes selected',
    });
  }
  if (!same(current.guardrails, published.guardrails)) {
    out.push({ kind: 'setting', label: 'Guardrails', detail: 'Tone, instructions, or reply authority changed' });
  }

  return out;
}
