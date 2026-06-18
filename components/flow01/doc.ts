import type { Fragment, Chip } from '@/types/playbook';
import { findAction } from '@/data/library';

// ---------------------------------------------------------------------------
// flow-01 editor document model.
// A line (the trigger, or a step body) is a Fragment[] - the structured-token
// model: text fragments interleaved with atomic chip/ref tokens.
// ---------------------------------------------------------------------------

export interface DocStep {
  id: string;
  body: Fragment[];
}

// --- Deployment + guardrails state -----------------------------------------
// An AOP's behavior config (guardrails) and its go-live state. Both live on
// the doc so they undo/redo with the rest of the document. "Enable" flips status
// to 'active'; "Pause" flips it to 'paused'. `mailboxes` = the shared mailboxes
// the AOP is live on.
export type Tone = 'professional' | 'friendly' | 'concise';
export type DeployStatus = 'draft' | 'active' | 'paused';
// How the AOP is triggered. Lives on the doc (with the "when should this run"
// frontmatter); surfaced as a quiet control there and confirmed at enable.
export type TriggerMode = 'automatic' | 'manual';
// What the AI is allowed to do with replies. A GLOBAL guardrail (applies to every
// reply in the AOP), not a per-chip setting. The highest-stakes choice.
export type ReplyAuthority = 'draft' | 'send';

export interface Guardrails {
  tone: Tone;
  customInstructions: string;
  replyAuthority: ReplyAuthority;
}

export function defaultGuardrails(): Guardrails {
  return { tone: 'professional', customInstructions: '', replyAuthority: 'draft' };
}

export interface EditorDoc {
  title: string;
  trigger: Fragment[];
  steps: Step[];
  status: DeployStatus;
  triggerMode: TriggerMode;
  mailboxes: string[];
  guardrails: Guardrails;
}

// --- Condition block (IF / ELSE-IF / ELSE) ---------------------------------
// Replaces the old flat condition chip. One nesting level: a branch body holds
// normal steps, never another condition. (Wired into EditorDoc.steps in the
// reducer step; the types live here so components can build against them.)
export type BranchType = 'if' | 'elseif' | 'else';

// One arm of a condition. `condition` is the NL expression for if / else-if;
// `else` has none. `lines` are the arm's action lines (always >= 1). Plain step
// lines only - an arm never nests another condition (kept to one level, by
// construction: DocStep[] can't hold a ConditionStep).
export interface Branch {
  id: string;
  type: BranchType;
  condition?: Fragment[];
  lines: DocStep[];
}

// A condition step: ordered IF -> ELSE-IF* -> (optional) ELSE arms.
export interface ConditionStep {
  id: string;
  kind: 'condition';
  branches: Branch[];
}

// A step in the document is either a normal line or a condition block.
export type Step = DocStep | ConditionStep;
export function isCondition(s: Step): s is ConditionStep {
  return (s as ConditionStep).kind === 'condition';
}

export type LineTarget =
  | { kind: 'trigger' }
  | { kind: 'step'; id: string }
  // a line inside a condition block: the branch's NL expression, or a specific body
  // line (lineId; omitted = the arm's first line).
  | { kind: 'cond'; condId: string; branchId: string; part: 'expr' | 'body'; lineId?: string };

// Deterministic ids: fixed seed ids for SSR stability, a client-only counter
// for everything created through interaction (so server/client markup match).
let idSeq = 0;
export function newId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

export function emptyDoc(): EditorDoc {
  return {
    title: 'Untitled AOP',
    trigger: [txt('')],
    steps: [{ id: 'step-seed-1', body: [txt('')] }],
    status: 'draft',
    triggerMode: 'automatic',
    mailboxes: [],
    guardrails: defaultGuardrails(),
  };
}

// Deterministic example chip (fixed id -> SSR-safe, no counter).
function exChip(id: string, actionId: string, meta?: string): Fragment {
  return { kind: 'chip', chip: { id, actionId, status: 'ok', config: meta ? { meta } : {} } };
}

// A complete, named, ready-to-simulate example AOP (the API-error triage
// case that the Simulate scenarios are built around). Seeds /canvas so a
// stakeholder lands on a real AOP to fiddle with - not a blank editor.
// Fixed ids keep it hydration-stable. Conditions stay inline (the editor does
// not nest IF/ELSE yet); the matched-branch detail lives in the simulate trace.
export function exampleDoc(): EditorDoc {
  return {
    title: 'API error triage',
    status: 'draft',
    triggerMode: 'automatic',
    mailboxes: [],
    guardrails: defaultGuardrails(),
    // Handwritten NL trigger (no references/chips - the trigger box is plain text).
    trigger: normalizeLine([
      txt('When an email arrives at engg.hiver@grexit.com reporting an error or API status issue.'),
    ]),
    steps: [
      {
        id: 'ex-s1',
        body: normalizeLine([
          txt('Summarize the error and pull the code, HTTP status, endpoint, timestamps, and SDK version.'),
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
          exChip('ex-c3', 'hubspot_get_contact'),
          txt('.'),
        ]),
      },
      {
        id: 'ex-s4',
        body: normalizeLine([
          exChip('ex-c4', 'kb_search', 'Engg-docs'),
          txt(' for the error code and a known fix.'),
        ]),
      },
      {
        id: 'ex-s5',
        body: normalizeLine([txt('Then categorize the error and draft the right reply:')]),
      },
      // The condition block replaces the old flat "Condition" chip + draft step:
      // each arm drafts the reply that fits the error class.
      {
        id: 'ex-cond',
        kind: 'condition',
        branches: [
          {
            id: 'ex-b1',
            type: 'if',
            condition: normalizeLine([txt('the error is a 4xx client error')]),
            lines: [
              {
                id: 'ex-bl1',
                body: normalizeLine([exChip('ex-bc1', 'draft_reply'), txt(' with the fix and send for review.')]),
              },
            ],
          },
          {
            id: 'ex-b2',
            type: 'elseif',
            condition: normalizeLine([txt('the error is a 5xx server error')]),
            lines: [
              {
                id: 'ex-bl2',
                body: normalizeLine([exChip('ex-bc2', 'draft_reply'), txt(' with a status update.')]),
              },
            ],
          },
          {
            id: 'ex-b3',
            type: 'else',
            lines: [
              {
                id: 'ex-bl3',
                body: normalizeLine([exChip('ex-bc3', 'draft_reply'), txt(' with a warm note that we are looking into it.')]),
              },
            ],
          },
        ],
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

// The sentinel actionId for the "@ action" placeholder chip - the dashed pill
// inserted the moment '@' is typed and held (configured in realtime) until the
// user finalizes the action (Figma 647:41076). It is never a finalized chip.
export const PENDING_ACTION = '__pending__';

export function makePendingChip(): Fragment {
  return { kind: 'chip', chip: { id: newId('chip'), actionId: PENDING_ACTION, status: 'ok', config: {} } };
}

export function isPendingChip(f: Fragment): boolean {
  return f.kind === 'chip' && f.chip.actionId === PENDING_ACTION;
}

export const makeRef = (refPath: string): Fragment => ({ kind: 'ref', refPath });

// --- Condition helpers -----------------------------------------------------

export function newBranch(type: BranchType): Branch {
  return {
    id: newId('branch'),
    type,
    condition: type === 'else' ? undefined : [txt('')],
    lines: [newBranchLine()],
  };
}

// A fresh empty action line for a branch body.
export function newBranchLine(): DocStep {
  return { id: newId('bline'), body: [txt('')] };
}

// A fresh condition block: a single IF arm (empty expression + empty body).
export function makeCondition(): ConditionStep {
  return { id: newId('cond'), kind: 'condition', branches: [newBranch('if')] };
}

// Whether a step "has content": a condition block always does; a normal step
// does when its line is non-empty.
export function stepHasContent(step: Step): boolean {
  return isCondition(step) ? true : lineHasContent(step.body);
}

// Hard preconditions for going live, as human-readable blockers. Empty = ready.
// Connector-auth gating is deferred: flow-01 has no connector-auth model yet (the
// BehaviorPanel surfaces used connectors + their auth, and a hard auth gate can
// layer on once that state exists). See plan 09, flag.
export function enableBlockers(doc: EditorDoc): string[] {
  const out: string[] = [];
  if (!lineHasContent(doc.trigger)) out.push('Add a trigger to enable');
  if (!doc.steps.some((s) => stepHasContent(s))) out.push('Add a step to enable');
  if (doc.mailboxes.length === 0) out.push('Pick at least one shared mailbox');
  return out;
}

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

// Deep-clone a step with FRESH ids (the step, its chips, and any branch ids) so a
// duplicate never shares an id with the original (ids are React keys + edit
// targets). Used by the row "Duplicate" action.
const cloneFrag = (f: Fragment): Fragment =>
  f.kind === 'chip' ? { kind: 'chip', chip: { ...f.chip, id: newId('chip') } } : { ...f };

export function cloneStep(step: Step): Step {
  if (isCondition(step)) {
    return {
      id: newId('cond'),
      kind: 'condition',
      branches: step.branches.map((b) => ({
        id: newId('branch'),
        type: b.type,
        condition: b.condition ? b.condition.map(cloneFrag) : undefined,
        lines: b.lines.map((ln) => ({ id: newId('bline'), body: ln.body.map(cloneFrag) })),
      })),
    };
  }
  return { id: newId('step'), body: step.body.map(cloneFrag) };
}

// --- Copilot apply: generic, append-only document patches -------------------
// The Copilot can PROPOSE a concrete change; the user reviews it and applies it.
// A patch is a small list of append-only ops. Append-only on purpose: it is then
// robust on ANY document state (it never depends on an existing step/branch id),
// and one patch maps to exactly one undo entry. The ops carry only generic
// placeholder content (same reusability class as the canned Copilot replies) -
// no case-specific story is baked into the model.
export type DocPatchOp =
  | { op: 'appendStep'; body: Fragment[] }
  | {
      op: 'appendCondition';
      branches: Array<{ type: BranchType; condition?: Fragment[]; body: Fragment[] }>;
    };

export type DocPatch = DocPatchOp[];

// Apply a patch, returning a NEW doc. A trailing empty line is dropped before
// appending so the inserted steps land in order; the reducer's withTrailingEmpty
// then re-adds an empty line only if the patch ends in a condition block. Meant to
// be committed through useEditorDoc.applyPatch (one history entry per patch).
export function applyDocPatch(doc: EditorDoc, patch: DocPatch): EditorDoc {
  const steps: Step[] = [...doc.steps];
  const last = steps[steps.length - 1];
  if (last && !isCondition(last) && lineIsEmpty(last.body)) steps.pop();
  for (const op of patch) {
    if (op.op === 'appendStep') {
      steps.push({ id: newId('step'), body: normalizeLine(op.body) });
    } else {
      const branches: Branch[] = op.branches.map((b) => ({
        id: newId('branch'),
        type: b.type,
        condition: b.type === 'else' ? undefined : normalizeLine(b.condition ?? [txt('')]),
        lines: [{ id: newId('bline'), body: normalizeLine(b.body) }],
      }));
      steps.push({ id: newId('cond'), kind: 'condition', branches });
    }
  }
  return { ...doc, steps };
}

// Built AFTER the fragment helpers above are initialized (the helpers are
// `const`s, so referencing them earlier hits a temporal-dead-zone error).
// Computed once at module load: deterministic + hydration-stable.
export const EXAMPLE_DOC: EditorDoc = exampleDoc();
