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

// Deterministic example chip (fixed id -> SSR-safe, no counter).
function exChip(id: string, actionId: string, meta?: string): Fragment {
  return { kind: 'chip', chip: { id, actionId, status: 'ok', config: meta ? { meta } : {} } };
}

// A complete, named, ready-to-simulate example playbook (the API-error triage
// case that the Simulate scenarios are built around). Seeds /canvas so a
// stakeholder lands on a real playbook to fiddle with — not a blank editor.
// Fixed ids keep it hydration-stable. Conditions stay inline (the editor does
// not nest IF/ELSE yet); the matched-branch detail lives in the simulate trace.
export function exampleDoc(): EditorDoc {
  return {
    title: 'API error triage',
    trigger: normalizeLine([
      txt('When an email arrives at '),
      makeRef('engg.hiver@grexit.com'),
      txt(' reporting an error or API status issue.'),
    ]),
    steps: [
      {
        id: 'ex-s1',
        body: normalizeLine([
          exChip('ex-c1', 'ai_extract', 'summary'),
          txt(' the error and pull the code, HTTP status, endpoint, timestamps, and SDK version.'),
        ]),
      },
      {
        id: 'ex-s2',
        body: normalizeLine([txt('Tag the ticket '), exChip('ex-c2', 'tag', 'api-error, support'), txt('.')]),
      },
      {
        id: 'ex-s3',
        body: normalizeLine([
          txt('Look up the customer with '),
          exChip('ex-c3', 'hubspot_get_contact', 'contact, company'),
          txt('.'),
        ]),
      },
      {
        id: 'ex-s4',
        body: normalizeLine([
          txt('Search the developer KB '),
          exChip('ex-c4', 'kb_search', 'Engg-docs'),
          txt(' for the error code and a known fix.'),
        ]),
      },
      {
        id: 'ex-s5',
        body: normalizeLine([
          txt('Categorise the error with a '),
          exChip('ex-c5', 'condition', '4xx / 5xx / config'),
          txt('.'),
        ]),
      },
      {
        id: 'ex-s6',
        body: normalizeLine([
          exChip('ex-c6', 'draft_reply', 'with the fix'),
          txt(' for the agent to review and send.'),
        ]),
      },
      // Trailing empty step: the always-present "add the next step" line (carries
      // the + affordance and the placeholder).
      { id: 'ex-s7', body: [txt('')] },
    ],
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

// Built AFTER the fragment helpers above are initialized (the helpers are
// `const`s, so referencing them earlier hits a temporal-dead-zone error).
// Computed once at module load: deterministic + hydration-stable.
export const EXAMPLE_DOC: EditorDoc = exampleDoc();
