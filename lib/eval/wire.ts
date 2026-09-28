// The chat evaluation's wire format - shared by the API route, the scripted
// fallback and the editor.
//
// A chat evaluation is a PLAYGROUND: a simulation of the chat widget, where
// every reply reaches the customer and every connector counts as connected.
// Nothing waits for approval and nothing fails for setup reasons - those are
// questions for going live, not for "how does my skill talk on chat".
//
// On each customer message the chat agent works out where the chat is:
//   greet    - the customer has not said what they need yet ("hello"): the
//              agent answers like any chat widget and asks. The trigger is
//              not judged on a greeting.
//   run      - what they need is what the trigger describes: the skill runs
//              its steps and replies.
//   noMatch  - what they need is clear and it is not what the trigger
//              describes: the skill does not run, and the playground says so.
// Once the skill has started, every later message is a `run`.
//
// The model returns the steps it took as a TRACE in the four step kinds the
// trace renderer already draws. The checker keeps the steps that name real
// parts of the skill and quietly drops the rest - a model slip is the
// engine's problem, not something to put in front of the author. The outcome
// is worked out from the checked trace, never taken from the model's verdict.

import type { Fragment } from '@/types/playbook';
import { isCondition, lineIsEmpty, type EditorDoc } from '@/components/flow01/doc';

// --- The conversation ---------------------------------------------------------

export type ChatRole = 'customer' | 'agent';

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
  error: string | null;
}

export type Stage = 'greet' | 'run' | 'noMatch';

/** What the model returns for one agent turn. */
export interface SkillTurnWire {
  stage: Stage;
  /** noMatch: one short sentence on why the skill does not fit this chat. */
  note: string | null;
  steps: LiveTraceStep[];
  /** The message to the customer, or null. */
  reply: string | null;
  /** The skill handed the chat off or reached End skill. */
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

/** A playground chat can pass, need attention, or break (the evaluation
 *  itself failed - retryable). */
export type TurnOutcome = 'passed' | 'attention' | 'errored';

/** Why a turn landed where it did - drives its one line of copy. */
export type OutcomeReason =
  | 'ok'
  | 'greet' // the agent asked what the customer needs; the skill has not started
  | 'noMatch' // the customer's need is not what the trigger describes
  | 'noBranch' // a condition matched no branch and there is no ELSE
  | 'noReply'; // the customer wrote and nothing on the skill's path answered

export interface CheckedTurn {
  stage: Stage;
  note: string | null;
  steps: LiveTraceStep[];
  reply: string | null;
  ended: boolean;
  outcome: TurnOutcome;
  reason: OutcomeReason;
  /** Steps whose actions need a teammate's approval once the skill is live. */
  gatedSteps: string[];
  /** What the checker dropped. Logged for debugging, never shown as a fault. */
  dropped: string[];
}

const RANK: Record<TurnOutcome, number> = { passed: 0, attention: 1, errored: 2 };

/** The conversation's outcome: its worst turn. */
export function worstOutcome(outcomes: TurnOutcome[]): TurnOutcome {
  return outcomes.reduce<TurnOutcome>((w, o) => (RANK[o] > RANK[w] ? o : w), 'passed');
}

// --- The skill as the model reads it --------------------------------------------

function chipWire(f: Extract<Fragment, { kind: 'chip' }>): string {
  const meta = typeof f.chip.config.meta === 'string' && f.chip.config.meta.trim() ? ` | ${f.chip.config.meta}` : '';
  return `[[${f.chip.actionId}${meta}]]`;
}

function lineWire(frags: Fragment[]): string {
  return frags
    .map((f) => (f.kind === 'text' ? f.text : f.kind === 'chip' ? chipWire(f) : f.kind === 'ref' ? `@${f.refPath}` : f.code))
    .join('')
    .trim();
}

interface StepIndex {
  lines: Map<string, Fragment[]>; // plain steps + branch lines
  conditions: Map<string, { branches: { id: string; type: string }[] }>;
  /** A skill with no reply chip cannot answer the customer at all. */
  canReply: boolean;
}

const REPLY_ACTIONS = new Set(['draft_reply', 'send_reply']);

export function indexSkill(doc: EditorDoc): StepIndex {
  const lines = new Map<string, Fragment[]>();
  const conditions: StepIndex['conditions'] = new Map();
  let canReply = false;
  const add = (id: string, body: Fragment[]) => {
    lines.set(id, body);
    if (body.some((f) => f.kind === 'chip' && REPLY_ACTIONS.has(f.chip.actionId))) canReply = true;
  };
  for (const s of doc.steps) {
    if (isCondition(s)) {
      conditions.set(s.id, { branches: s.branches.map((b) => ({ id: b.id, type: b.type })) });
      for (const b of s.branches) for (const l of b.lines) if (!lineIsEmpty(l.body)) add(l.id, l.body);
    } else if (!lineIsEmpty(s.body)) {
      add(s.id, s.body);
    }
  }
  return { lines, conditions, canReply };
}

/** The skill as text, with every id a trace may refer to. */
export function skillToWire(doc: EditorDoc): string {
  const out: string[] = [];
  out.push(`Skill: ${doc.title}`);
  out.push(`Trigger: ${lineWire(doc.trigger) || '(empty)'}`);
  out.push('Steps:');
  let n = 0;
  for (const s of doc.steps) {
    if (isCondition(s)) {
      n += 1;
      out.push(`${n}. [${s.id}] CONDITION`);
      for (const b of s.branches) {
        const head = b.type === 'if' ? 'IF' : b.type === 'elseif' ? 'ELSE IF' : 'ELSE';
        out.push(`     [${b.id}] ${head}${b.condition ? ` ${lineWire(b.condition)}` : ''}`);
        for (const l of b.lines) {
          if (!lineIsEmpty(l.body)) out.push(`       - [${l.id}] ${lineWire(l.body)}`);
        }
      }
    } else if (!lineIsEmpty(s.body)) {
      n += 1;
      out.push(`${n}. [${s.id}] ${lineWire(s.body)}`);
    }
  }
  if (n === 0) out.push('(no steps yet)');
  return out.join('\n');
}

export function transcriptToWire(t: ChatMessage[]): string {
  if (t.length === 0) return '(no messages yet)';
  return t.map((m) => `${m.role === 'customer' ? 'Customer' : 'Agent'}: ${m.text}`).join('\n');
}

/** Chat text is plain: the widget does not render markdown, so strip it. */
export function plain(text: string): string {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[–—]/g, '-')
    .trim();
}

// --- Checking a turn ------------------------------------------------------------

/**
 * Check a turn against the skill and work out its outcome. Pure: the API
 * route and the scripted fallback both go through it, so the two can never
 * disagree about what a trace means.
 */
export function checkTurn(doc: EditorDoc, turn: SkillTurnWire, skillStarted: boolean): CheckedTurn {
  const idx = indexSkill(doc);
  const base = { gatedSteps: [] as string[], dropped: [] as string[] };

  // Before the skill starts, the agent is only greeting or telling us it does
  // not fit. Neither carries steps.
  const stage: Stage = skillStarted ? 'run' : turn.stage;
  if (stage === 'greet') {
    const reply = turn.reply ? plain(turn.reply) : "Hi there! What can I help you with today?";
    return { ...base, stage, note: null, steps: [], reply, ended: false, outcome: 'passed', reason: 'greet' };
  }
  if (stage === 'noMatch') {
    return { ...base, stage, note: turn.note ? plain(turn.note) : null, steps: [], reply: null, ended: false, outcome: 'attention', reason: 'noMatch' };
  }

  const steps: LiveTraceStep[] = [];
  const dropped: string[] = [];
  const gatedSteps: string[] = [];
  let noBranch = false;
  let reply: string | null = null;

  for (const raw of turn.steps) {
    const s: LiveTraceStep = { ...raw, status: 'done', error: null };
    if (s.kind === 'thinking') {
      if (s.text?.trim()) steps.push({ ...s, stepId: null, actionId: null, branch: null, text: plain(s.text) });
      continue;
    }
    if (s.kind === 'condition') {
      const cond = s.stepId ? idx.conditions.get(s.stepId) : undefined;
      const hasElse = cond?.branches.some((b) => b.type === 'else');
      if (!cond || (s.branch !== 'none' && !cond.branches.some((b) => b.id === s.branch)) || (s.branch === 'none' && hasElse)) {
        dropped.push(`condition ${s.stepId}/${s.branch}`);
        continue;
      }
      if (s.branch === 'none') noBranch = true;
      steps.push({ ...s, actionId: null });
      continue;
    }
    // A step filed against a condition's id is the right step in the wrong
    // kind - the branch decision already says what happened.
    if (s.stepId && idx.conditions.has(s.stepId)) {
      dropped.push(`${s.kind} on condition ${s.stepId}`);
      continue;
    }
    const line = s.stepId ? idx.lines.get(s.stepId) : undefined;
    if (s.kind === 'reply') {
      // The reply is what reaches the customer. It counts whenever the skill
      // has a way to reply at all, even if the model filed it on the wrong line.
      if (!idx.canReply || !s.text?.trim()) {
        dropped.push(`reply from ${s.stepId}`);
        continue;
      }
      reply = plain(s.text);
      const chip = line?.find((f): f is Extract<Fragment, { kind: 'chip' }> => f.kind === 'chip' && REPLY_ACTIONS.has(f.chip.actionId));
      steps.push({ ...s, text: reply, actionId: chip?.chip.actionId ?? s.actionId ?? 'send_reply' });
      if (chip?.chip.requiresApproval && s.stepId) gatedSteps.push(s.stepId);
      continue;
    }
    if (!line) {
      dropped.push(`action on unknown step ${s.stepId}`);
      continue;
    }
    const chips = line.filter((f): f is Extract<Fragment, { kind: 'chip' }> => f.kind === 'chip');
    // The reply chip is the reply step's; an action entry for it would show
    // the same message twice.
    if (s.actionId && REPLY_ACTIONS.has(s.actionId)) {
      dropped.push(`reply chip logged as an action on ${s.stepId}`);
      continue;
    }
    if (!s.actionId && chips.length > 0 && chips.every((c) => REPLY_ACTIONS.has(c.chip.actionId))) {
      dropped.push(`prose action on reply line ${s.stepId}`);
      continue;
    }
    const chip = s.actionId ? chips.find((c) => c.chip.actionId === s.actionId) : undefined;
    // An action id the line does not carry: a prose step is still that step,
    // with no chip; a line with chips gets its first non-reply chip.
    let actionId = chip?.chip.actionId ?? null;
    if (s.actionId && !chip) {
      const fallback = chips.find((c) => !REPLY_ACTIONS.has(c.chip.actionId));
      actionId = fallback?.chip.actionId ?? null;
      dropped.push(`action "${s.actionId}" on ${s.stepId} read as ${actionId ?? 'the prose step'}`);
    }
    const gate = chips.find((c) => c.chip.actionId === actionId)?.chip.requiresApproval;
    if (gate && s.stepId) gatedSteps.push(s.stepId);
    steps.push({ ...s, actionId, text: s.text ? plain(s.text) : null });
  }

  let outcome: TurnOutcome = 'passed';
  let reason: OutcomeReason = 'ok';
  if (noBranch) {
    outcome = 'attention';
    reason = 'noBranch';
  } else if (reply === null) {
    // On chat the customer is waiting: a message the skill does not answer
    // leaves them there - even when the skill hands off, the customer is
    // told nothing. Handing off never stands in for a reply.
    outcome = 'attention';
    reason = 'noReply';
  }
  return { stage: 'run', note: null, steps, reply, ended: turn.ended, outcome, reason, gatedSteps, dropped };
}

// --- Structured-output schemas ----------------------------------------------------

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: 'null' }] });

export const SKILL_TURN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['stage', 'note', 'steps', 'reply', 'ended'],
  properties: {
    stage: { type: 'string', enum: ['greet', 'run', 'noMatch'] },
    note: nullable({ type: 'string' }),
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
