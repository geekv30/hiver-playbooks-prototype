// The live Copilot's wire format - shared by the API route and the editor.
//
// The model never sees or writes the editor's Fragment[] structure. It reads the
// skill as plain text, with each step's id in brackets and each action chip
// written as [[action_id]] or [[action_id | label]], and it proposes changes as
// a short list of ops in the same notation. The server checks every op against
// the doc it was shown and the action library before a proposal reaches the
// card; the client turns the checked ops into a DocPatch.

import type { Fragment } from '@/types/playbook';
import { ACTIONS, findAction } from '@/data/library';
import {
  isCondition,
  lineIsEmpty,
  makeChip,
  txt,
  type DocPatch,
  type DocPatchOp,
  type EditorDoc,
  type PatchBranch,
} from '@/components/flow01/doc';
import { mailboxName } from '@/data/mailboxes';
import { KB_SOURCES, sourceTypeLabel } from '@/data/knowledgeSources';

// --- Reading: the doc as text ------------------------------------------------

function chipText(actionId: string, meta: unknown): string {
  return typeof meta === 'string' && meta.trim() ? `[[${actionId} | ${meta}]]` : `[[${actionId}]]`;
}

export function lineToWire(frags: Fragment[]): string {
  return frags
    .map((f) => {
      if (f.kind === 'text') return f.text;
      if (f.kind === 'chip') return chipText(f.chip.actionId, f.chip.config.meta);
      if (f.kind === 'ref') return `@${f.refPath}`;
      return f.code;
    })
    .join('')
    .trim();
}

/** The skill as the model reads it. Ids are the step ids ops refer to. */
export function docToWire(doc: EditorDoc): string {
  const out: string[] = [];
  out.push(`Title: ${doc.title}`);
  out.push(`Status: ${doc.status}`);
  out.push(
    `Mailboxes: ${doc.mailboxes.length ? doc.mailboxes.map(mailboxName).join(', ') : 'none chosen yet'}`,
  );
  out.push(
    `Replies: ${doc.guardrails.replyAuthority === 'send' ? 'may send directly' : 'drafts only (a person sends)'}`,
  );
  out.push(`Trigger: ${lineToWire(doc.trigger) || '(empty)'}`);
  out.push('Steps:');
  let n = 0;
  for (const s of doc.steps) {
    if (isCondition(s)) {
      n += 1;
      out.push(`${n}. [${s.id}] CONDITION`);
      for (const b of s.branches) {
        const head =
          b.type === 'if' ? 'IF' : b.type === 'elseif' ? 'ELSE IF' : 'ELSE';
        const cond = b.condition ? ` ${lineToWire(b.condition)}` : '';
        out.push(`     ${head}${cond}`);
        for (const l of b.lines) {
          if (!lineIsEmpty(l.body)) out.push(`       - ${lineToWire(l.body)}`);
        }
      }
    } else if (!lineIsEmpty(s.body)) {
      n += 1;
      out.push(`${n}. [${s.id}] ${lineToWire(s.body)}`);
    }
  }
  if (n === 0) out.push('(no steps yet)');
  return out.join('\n');
}

/** The action library, one line each, for the system prompt. */
export function actionsToWire(): string {
  return ACTIONS.filter((a) => a.id !== 'condition')
    .map((a) => `- ${a.id}: ${a.name} - ${a.desc}${a.meta ? ` (default label: ${a.meta})` : ''}`)
    .join('\n');
}

/** The Knowledge Hub's sources, for [[kb_search | ...]] labels. */
export function kbSourcesToWire(): string {
  return KB_SOURCES.map((k) => `- ${k.name} (${sourceTypeLabel(k.type)}, ${k.sub})`).join('\n');
}

// --- Writing: text back to fragments -------------------------------------------

const CHIP_RE = /\[\[\s*([a-z0-9_]+)\s*(?:\|\s*([^\]]*?))?\s*\]\]/g;

/** Action ids in a wire line that the library does not know. */
export function unknownActions(line: string): string[] {
  const bad: string[] = [];
  for (const m of line.matchAll(CHIP_RE)) {
    const id = m[1]!;
    if (!findAction(id) || id === 'condition') bad.push(id);
  }
  return bad;
}

/** Knowledge Hub source names in a wire line that the Hub does not have. A
 *  label already in the skill is allowed through, so rewriting a step never
 *  trips over a source the user picked earlier. */
export function unknownSources(line: string, known: Set<string>): string[] {
  const bad: string[] = [];
  for (const m of line.matchAll(CHIP_RE)) {
    if (m[1] !== 'kb_search' || !m[2]?.trim()) continue;
    for (const name of m[2].split(',').map((x) => x.trim()).filter(Boolean)) {
      if (!known.has(name)) bad.push(name);
    }
  }
  return bad;
}

function knownSources(doc: EditorDoc): Set<string> {
  const known = new Set(KB_SOURCES.map((k) => k.name));
  const scan = (frags: Fragment[]) => {
    for (const f of frags) {
      if (f.kind === 'chip' && f.chip.actionId === 'kb_search' && typeof f.chip.config.meta === 'string') {
        for (const n of f.chip.config.meta.split(',')) if (n.trim()) known.add(n.trim());
      }
    }
  };
  for (const st of doc.steps) {
    if (isCondition(st)) st.branches.forEach((b) => b.lines.forEach((l) => scan(l.body)));
    else scan(st.body);
  }
  return known;
}

/** A wire line as editor fragments. Call only on a line that passed checkWire. */
export function wireToLine(line: string): Fragment[] {
  const out: Fragment[] = [];
  let last = 0;
  for (const m of line.matchAll(CHIP_RE)) {
    const i = m.index ?? 0;
    if (i > last) out.push(txt(line.slice(last, i)));
    const meta = m[2]?.trim();
    out.push(makeChip(m[1]!, meta ? meta : undefined));
    last = i + m[0].length;
  }
  if (last < line.length) out.push(txt(line.slice(last)));
  return out.length ? out : [txt('')];
}

// --- The model's turn ---------------------------------------------------------

export type WireOpName =
  | 'appendStep'
  | 'insertStep'
  | 'replaceStep'
  | 'removeStep'
  | 'appendCondition'
  | 'insertCondition'
  | 'replaceCondition'
  | 'setTrigger'
  | 'setTitle';

export interface WireBranch {
  type: 'if' | 'elseif' | 'else';
  condition: string | null;
  lines: string[];
}

export interface WireOp {
  op: WireOpName;
  /** replaceStep / replaceCondition / removeStep: the target step id. */
  id: string | null;
  /** insertStep / insertCondition: the step to insert after, or "START". */
  afterId: string | null;
  /** The line for step ops, the trigger for setTrigger, the name for setTitle. */
  text: string | null;
  branches: WireBranch[] | null;
}

export interface WireProposal {
  title: string;
  summary: string[];
  ops: WireOp[];
}

export interface WireTurn {
  reply: string;
  proposal: WireProposal | null;
}

const OP_NAMES: WireOpName[] = [
  'appendStep',
  'insertStep',
  'replaceStep',
  'removeStep',
  'appendCondition',
  'insertCondition',
  'replaceCondition',
  'setTrigger',
  'setTitle',
];

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: 'null' }] });

/** Structured-output schema (strict: every key required, nulls for n/a).
 *  `reply` comes first so it streams before the proposal is written. */
export const TURN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'proposal'],
  properties: {
    reply: { type: 'string' },
    proposal: nullable({
      type: 'object',
      additionalProperties: false,
      required: ['title', 'summary', 'ops'],
      properties: {
        title: { type: 'string' },
        summary: { type: 'array', items: { type: 'string' } },
        ops: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['op', 'id', 'afterId', 'text', 'branches'],
            properties: {
              op: { type: 'string', enum: OP_NAMES },
              id: nullable({ type: 'string' }),
              afterId: nullable({ type: 'string' }),
              text: nullable({ type: 'string' }),
              branches: nullable({
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['type', 'condition', 'lines'],
                  properties: {
                    type: { type: 'string', enum: ['if', 'elseif', 'else'] },
                    condition: nullable({ type: 'string' }),
                    lines: { type: 'array', items: { type: 'string' } },
                  },
                },
              }),
            },
          },
        },
      },
    }),
  },
} as const;

// --- Checking a proposal ------------------------------------------------------

function checkBranches(branches: WireBranch[] | null, where: string, errs: string[], sources: Set<string>) {
  if (!branches || branches.length === 0) {
    errs.push(`${where}: a condition needs at least one branch`);
    return;
  }
  branches.forEach((b, i) => {
    if (i === 0 && b.type !== 'if') errs.push(`${where}: the first branch must be IF`);
    if (i > 0 && b.type === 'if') errs.push(`${where}: only the first branch can be IF`);
    if (b.type === 'else' && i !== branches.length - 1) errs.push(`${where}: ELSE must be last`);
    if (b.type !== 'else' && !b.condition?.trim()) errs.push(`${where}: IF / ELSE IF need a condition`);
    const lines = b.lines.filter((l) => l.trim());
    if (lines.length === 0) errs.push(`${where}: every branch needs at least one line`);
    for (const l of lines) {
      for (const id of unknownActions(l)) errs.push(`${where}: unknown action "${id}"`);
      for (const n of unknownSources(l, sources)) errs.push(`${where}: unknown Knowledge Hub source "${n}"`);
    }
  });
}

/** Everything wrong with a proposal against the doc it was written for. */
export function checkWire(p: WireProposal, doc: EditorDoc): string[] {
  const errs: string[] = [];
  if (!p.title.trim()) errs.push('the proposal has no title');
  if (p.ops.length === 0) errs.push('the proposal changes nothing');
  const plain = new Set(doc.steps.filter((s) => !isCondition(s)).map((s) => s.id));
  const conds = new Set(doc.steps.filter((s) => isCondition(s)).map((s) => s.id));
  const removed = new Set<string>();
  const sources = knownSources(doc);
  p.ops.forEach((o, i) => {
    const where = `op ${i + 1} (${o.op})`;
    const needText = () => {
      if (!o.text?.trim()) errs.push(`${where}: missing text`);
      else {
        for (const id of unknownActions(o.text)) errs.push(`${where}: unknown action "${id}"`);
        for (const n of unknownSources(o.text, sources)) errs.push(`${where}: unknown Knowledge Hub source "${n}"`);
      }
    };
    switch (o.op) {
      case 'appendStep':
        needText();
        break;
      case 'insertStep':
      case 'insertCondition':
        if (o.afterId !== 'START' && !(o.afterId && (plain.has(o.afterId) || conds.has(o.afterId))))
          errs.push(`${where}: afterId "${o.afterId}" is not a step in this skill`);
        if (o.op === 'insertStep') needText();
        else checkBranches(o.branches, where, errs, sources);
        break;
      case 'replaceStep':
        if (!o.id || !plain.has(o.id)) errs.push(`${where}: "${o.id}" is not a plain step in this skill`);
        needText();
        break;
      case 'replaceCondition':
        if (!o.id || !conds.has(o.id)) errs.push(`${where}: "${o.id}" is not a condition in this skill`);
        checkBranches(o.branches, where, errs, sources);
        break;
      case 'appendCondition':
        checkBranches(o.branches, where, errs, sources);
        break;
      case 'removeStep':
        if (!o.id || !(plain.has(o.id) || conds.has(o.id)))
          errs.push(`${where}: "${o.id}" is not a step in this skill`);
        else if (removed.has(o.id)) errs.push(`${where}: "${o.id}" is removed twice`);
        else removed.add(o.id);
        break;
      case 'setTrigger':
        if (!o.text?.trim()) errs.push(`${where}: missing trigger text`);
        break;
      case 'setTitle':
        if (!o.text?.trim()) errs.push(`${where}: missing title`);
        break;
    }
  });
  return errs;
}

// --- Checked ops to a DocPatch (client side: mints the editor's ids) ---------

function toBranches(bs: WireBranch[]): PatchBranch[] {
  return bs.map((b) => ({
    type: b.type,
    condition: b.type === 'else' ? undefined : wireToLine(b.condition ?? ''),
    lines: b.lines.filter((l) => l.trim()).map(wireToLine),
  }));
}

export function wireToPatch(ops: WireOp[]): DocPatch {
  const out: DocPatchOp[] = [];
  for (const o of ops) {
    const text = o.text ?? '';
    const after = o.afterId === 'START' ? null : o.afterId;
    switch (o.op) {
      case 'appendStep':
        out.push({ op: 'appendStep', body: wireToLine(text) });
        break;
      case 'insertStep':
        out.push({ op: 'insertStep', afterId: after, body: wireToLine(text) });
        break;
      case 'replaceStep':
        out.push({ op: 'replaceStep', id: o.id!, body: wireToLine(text) });
        break;
      case 'removeStep':
        out.push({ op: 'removeStep', id: o.id! });
        break;
      case 'appendCondition':
        out.push({ op: 'appendCondition', branches: toBranches(o.branches ?? []) });
        break;
      case 'insertCondition':
        out.push({ op: 'insertCondition', afterId: after, branches: toBranches(o.branches ?? []) });
        break;
      case 'replaceCondition':
        out.push({ op: 'replaceCondition', id: o.id!, branches: toBranches(o.branches ?? []) });
        break;
      case 'setTrigger':
        out.push({ op: 'setTrigger', body: [txt(text.replace(CHIP_RE, (_m, id, meta) => meta || findAction(id)?.name || ''))] });
        break;
      case 'setTitle':
        out.push({ op: 'setTitle', title: text });
        break;
    }
  }
  return out;
}
