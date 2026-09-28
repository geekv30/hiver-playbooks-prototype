// The chat evaluation's wire format - shared by the API route, the scripted
// fallback and the editor.
//
// A chat evaluation runs the skill turn by turn. On each customer message the
// skill decides which of its steps apply now, carries them out, and may reply.
// The model returns that as a TRACE in the four step kinds the trace renderer
// already draws (thinking / action / condition / reply). Everything the model
// says about the skill is checked against the skill it was shown, and the
// outcome is worked out from the checked trace - never taken from the model's
// own verdict.

import type { ConnectorSlug, Fragment } from '@/types/playbook';
import { findAction } from '@/data/library';
import { CONNECTOR_META } from '@/data/connectors';
import { isCondition, lineIsEmpty, type EditorDoc } from '@/components/flow01/doc';
import type { ConnectorHealth } from '@/components/flow01/connectorHealth';

// --- The conversation ---------------------------------------------------------

export type ChatRole = 'customer' | 'skill';

export interface ChatMessage {
  role: ChatRole;
  text: string;
}

export type TraceKind = 'thinking' | 'action' | 'condition' | 'reply';
export type TraceStatus = 'done' | 'failed' | 'skipped';

/** One step the skill took this turn. Every field is present; null = n/a. */
export interface LiveTraceStep {
  kind: TraceKind;
  /** The skill step (or condition, or branch line) this carries out. */
  stepId: string | null;
  /** The action chip it ran, when the step has one. */
  actionId: string | null;
  /** thinking: the reasoning. action: what came back. reply: the message. */
  text: string | null;
  /** condition: the id of the branch that held, or "none". */
  branch: string | null;
  status: TraceStatus;
  /** failed: why. */
  error: string | null;
}

/** What the model returns for one skill turn. */
export interface SkillTurnWire {
  /** First turn only: would the trigger fire on this chat at all? */
  triggerMatches: boolean;
  steps: LiveTraceStep[];
  /** The message the skill sends this turn, or null. */
  reply: string | null;
  /** The skill has nothing more to do on this chat. */
  ended: boolean;
}

export interface CustomerTurnWire {
  message: string;
  done: boolean;
}

export interface ChatScenario {
  id: string;
  persona: string;
  goal: string;
  opening: string;
  /** Scripted fallback only: the customer's follow-ups, in order. */
  script?: string[];
}

// --- Outcomes -------------------------------------------------------------------

/** The four outcomes email evaluation already uses. */
export type TurnOutcome = 'passed' | 'attention' | 'errored' | 'approval';

/** Why a turn landed where it did - drives the one line of copy under it. */
export type OutcomeReason =
  | 'ok'
  | 'trigger' // the trigger would not fire on this chat
  | 'noBranch' // a condition matched no branch and there is no ELSE
  | 'failedStep' // a step failed (a connector, usually)
  | 'invalid' // the trace did not match the skill
  | 'gated' // an action marked "requires approval" was reached
  | 'draft' // the reply is a draft: on chat a teammate has to send it
  | 'noReply'; // the customer wrote and nothing on the skill's path answered

export interface CheckedTurn {
  steps: LiveTraceStep[];
  reply: string | null;
  ended: boolean;
  outcome: TurnOutcome;
  reason: OutcomeReason;
  /** The reply is held until someone sends it (approval / draft). */
  held: boolean;
  /** Why it is held: an action needs approval, or the reply is a draft. */
  heldBy: 'gated' | 'draft' | null;
  /** What the checker dropped, for the errored copy and for debugging. */
  problems: string[];
}

const RANK: Record<TurnOutcome, number> = { passed: 0, approval: 1, attention: 2, errored: 3 };

/** The conversation's outcome: its worst turn. */
export function worstOutcome(outcomes: TurnOutcome[]): TurnOutcome {
  return outcomes.reduce<TurnOutcome>((w, o) => (RANK[o] > RANK[w] ? o : w), 'passed');
}

// --- The skill as the model reads it --------------------------------------------

function chipWire(f: Extract<Fragment, { kind: 'chip' }>): string {
  const meta = typeof f.chip.config.meta === 'string' && f.chip.config.meta.trim() ? ` | ${f.chip.config.meta}` : '';
  const gate = f.chip.requiresApproval ? ' (requires approval)' : '';
  return `[[${f.chip.actionId}${meta}]]${gate}`;
}

function lineWire(frags: Fragment[]): string {
  return frags
    .map((f) => (f.kind === 'text' ? f.text : f.kind === 'chip' ? chipWire(f) : f.kind === 'ref' ? `@${f.refPath}` : f.code))
    .join('')
    .trim();
}

/** Every id a trace step may name, and what sits there. */
interface StepIndex {
  lines: Map<string, Fragment[]>; // plain steps + branch lines
  conditions: Map<string, { branches: { id: string; type: string; hasElse: boolean }[] }>;
}

export function indexSkill(doc: EditorDoc): StepIndex {
  const lines = new Map<string, Fragment[]>();
  const conditions: StepIndex['conditions'] = new Map();
  for (const s of doc.steps) {
    if (isCondition(s)) {
      const hasElse = s.branches.some((b) => b.type === 'else');
      conditions.set(s.id, { branches: s.branches.map((b) => ({ id: b.id, type: b.type, hasElse })) });
      for (const b of s.branches) for (const l of b.lines) if (!lineIsEmpty(l.body)) lines.set(l.id, l.body);
    } else if (!lineIsEmpty(s.body)) {
      lines.set(s.id, s.body);
    }
  }
  return { lines, conditions };
}

/** Connector state as the model is told it. */
export function healthLine(slug: ConnectorSlug, state: ConnectorHealth): string {
  const name = CONNECTOR_META[slug].name;
  if (state === 'connected') return `${name}: connected`;
  if (state === 'reauth') return `${name}: needs re-authentication - its steps fail`;
  if (state === 'error') return `${name}: connection broken - its steps fail`;
  return `${name}: not connected - its steps fail`;
}

export function failReason(slug: ConnectorSlug, state: ConnectorHealth): string {
  const name = CONNECTOR_META[slug].name;
  if (state === 'reauth') return `${name} needs re-authentication, so this step could not run.`;
  if (state === 'error') return `${name}'s connection is broken, so this step could not run.`;
  return `${name} is not connected, so this step could not run.`;
}

/** The skill as text, with every id a trace may refer to. */
export function skillToWire(doc: EditorDoc, health: Record<ConnectorSlug, ConnectorHealth>): string {
  const out: string[] = [];
  out.push(`Skill: ${doc.title}`);
  out.push(`Trigger: ${lineWire(doc.trigger) || '(empty)'}`);
  out.push('Steps:');
  let n = 0;
  const used = new Set<ConnectorSlug>();
  const note = (frags: Fragment[]) => {
    for (const f of frags) {
      const slug = f.kind === 'chip' ? findAction(f.chip.actionId)?.connectorSlug : undefined;
      if (slug) used.add(slug);
    }
  };
  for (const s of doc.steps) {
    if (isCondition(s)) {
      n += 1;
      out.push(`${n}. [${s.id}] CONDITION`);
      for (const b of s.branches) {
        const head = b.type === 'if' ? 'IF' : b.type === 'elseif' ? 'ELSE IF' : 'ELSE';
        out.push(`     [${b.id}] ${head}${b.condition ? ` ${lineWire(b.condition)}` : ''}`);
        for (const l of b.lines) {
          if (lineIsEmpty(l.body)) continue;
          note(l.body);
          out.push(`       - [${l.id}] ${lineWire(l.body)}`);
        }
      }
    } else if (!lineIsEmpty(s.body)) {
      n += 1;
      note(s.body);
      out.push(`${n}. [${s.id}] ${lineWire(s.body)}`);
    }
  }
  if (n === 0) out.push('(no steps yet)');
  if (used.size > 0) {
    out.push('Connectors:');
    for (const slug of used) out.push(`- ${healthLine(slug, health[slug] ?? 'connected')}`);
  }
  return out.join('\n');
}

export function transcriptToWire(t: ChatMessage[]): string {
  if (t.length === 0) return '(no messages yet)';
  return t.map((m) => `${m.role === 'customer' ? 'Customer' : 'Skill'}: ${m.text}`).join('\n');
}

// --- Checking a turn ------------------------------------------------------------

function chipsIn(frags: Fragment[]) {
  return frags.filter((f): f is Extract<Fragment, { kind: 'chip' }> => f.kind === 'chip');
}

const REPLY_ACTIONS = new Set(['draft_reply', 'send_reply']);

/**
 * Check a turn against the skill, enforce connector health, and work out its
 * outcome. Pure: the API route and the scripted fallback both go through it,
 * so the two can never disagree about what a trace means.
 */
export function checkTurn(
  doc: EditorDoc,
  turn: SkillTurnWire,
  health: Record<ConnectorSlug, ConnectorHealth>,
  firstTurn: boolean,
): CheckedTurn {
  if (firstTurn && !turn.triggerMatches) {
    return { steps: [], reply: null, ended: true, outcome: 'attention', reason: 'trigger', held: false, heldBy: null, problems: [] };
  }
  const idx = indexSkill(doc);
  const problems: string[] = [];
  const steps: LiveTraceStep[] = [];
  let gated = false;
  let draft = false;
  let noBranch = false;
  let reply: string | null = null;

  for (const raw of turn.steps) {
    const s: LiveTraceStep = { ...raw };
    if (s.kind === 'thinking') {
      if (!s.text?.trim()) continue;
      steps.push({ ...s, stepId: null, actionId: null, branch: null, status: 'done', error: null });
      continue;
    }
    if (s.kind === 'condition') {
      const cond = s.stepId ? idx.conditions.get(s.stepId) : undefined;
      if (!cond) {
        problems.push(`a condition step named "${s.stepId}", which is not a condition in this skill`);
        continue;
      }
      if (s.branch === 'none') {
        if (cond.branches.some((b) => b.type === 'else')) {
          problems.push('a condition with an ELSE branch reported that no branch matched');
          continue;
        }
        noBranch = true;
      } else if (!cond.branches.some((b) => b.id === s.branch)) {
        problems.push(`a branch "${s.branch}" that is not in that condition`);
        continue;
      }
      steps.push({ ...s, actionId: null, status: 'done', error: null });
      continue;
    }
    // action / reply: must name a real step, and a chip that is on it. An
    // action filed against a CONDITION's id is the right step in the wrong
    // kind (the branch decision already says what it did), so it is dropped,
    // not treated as an invented step.
    if (s.stepId && idx.conditions.has(s.stepId)) continue;
    const line = s.stepId ? idx.lines.get(s.stepId) : undefined;
    if (!line) {
      problems.push(`a step "${s.stepId}" that is not in this skill`);
      continue;
    }
    const chips = chipsIn(line);
    const chip = s.actionId ? chips.find((c) => c.chip.actionId === s.actionId) : undefined;
    if (s.actionId && !chip) {
      problems.push(`an action "${s.actionId}" that step ${s.stepId} does not have`);
      continue;
    }
    if (s.kind === 'reply') {
      if (!chip || !REPLY_ACTIONS.has(chip.chip.actionId)) {
        problems.push(`a reply from step ${s.stepId}, which has no reply action`);
        continue;
      }
      if (!s.text?.trim()) continue;
      reply = s.text.trim();
      if (chip.chip.requiresApproval) gated = true;
      else if (chip.chip.actionId === 'draft_reply') draft = true;
      steps.push({ ...s, status: 'done', error: null });
      continue;
    }
    // An action on a connector that is not healthy fails, whatever the model said.
    const slug = chip ? findAction(chip.chip.actionId)?.connectorSlug : undefined;
    const state = slug ? (health[slug] ?? 'connected') : 'connected';
    if (slug && state !== 'connected') {
      steps.push({ ...s, status: 'failed', text: null, error: failReason(slug, state) });
      continue;
    }
    if (chip?.chip.requiresApproval) gated = true;
    if (chip?.chip.actionId === 'approval') gated = true;
    steps.push({ ...s, status: s.status === 'failed' ? 'failed' : 'done', error: s.status === 'failed' ? s.error : null });
  }

  const failed = steps.some((s) => s.status === 'failed');
  let outcome: TurnOutcome = 'passed';
  let reason: OutcomeReason = 'ok';
  if (problems.length > 0) {
    outcome = 'errored';
    reason = 'invalid';
  } else if (failed) {
    outcome = 'errored';
    reason = 'failedStep';
  } else if (noBranch) {
    outcome = 'attention';
    reason = 'noBranch';
  } else if (gated) {
    outcome = 'approval';
    reason = 'gated';
  } else if (draft) {
    outcome = 'approval';
    reason = 'draft';
  } else if (reply === null && !turn.ended) {
    // On chat the customer is waiting: a message the skill does not answer,
    // and does not hand off, leaves them there.
    outcome = 'attention';
    reason = 'noReply';
  }
  return {
    steps,
    reply,
    ended: turn.ended,
    outcome,
    reason,
    held: reply !== null && (gated || draft),
    heldBy: reply === null ? null : gated ? 'gated' : draft ? 'draft' : null,
    problems,
  };
}

// --- Structured-output schemas ----------------------------------------------------

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: 'null' }] });

export const SKILL_TURN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['triggerMatches', 'steps', 'reply', 'ended'],
  properties: {
    triggerMatches: { type: 'boolean' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['kind', 'stepId', 'actionId', 'text', 'branch', 'status', 'error'],
        properties: {
          kind: { type: 'string', enum: ['thinking', 'action', 'condition', 'reply'] },
          stepId: nullable({ type: 'string' }),
          actionId: nullable({ type: 'string' }),
          text: nullable({ type: 'string' }),
          branch: nullable({ type: 'string' }),
          status: { type: 'string', enum: ['done', 'failed', 'skipped'] },
          error: nullable({ type: 'string' }),
        },
      },
    },
    reply: nullable({ type: 'string' }),
    ended: { type: 'boolean' },
  },
} as const;

export const CUSTOMER_TURN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['message', 'done'],
  properties: { message: { type: 'string' }, done: { type: 'boolean' } },
} as const;

export const SCENARIOS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['scenarios'],
  properties: {
    scenarios: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['persona', 'goal', 'opening'],
        properties: { persona: { type: 'string' }, goal: { type: 'string' }, opening: { type: 'string' } },
      },
    },
  },
} as const;
