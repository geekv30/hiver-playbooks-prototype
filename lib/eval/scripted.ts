// The scripted chat evaluation - what runs when the live model is not on (a
// shared prod link without the passcode). It walks the skill as written: every
// step on the IF path, each chip as an action, the first reply chip as the
// reply. The words are generic on purpose and the surface labels them
// "Scripted demo", so nothing here passes itself off as the model.
//
// It returns the same SkillTurnWire the model returns and goes through the
// same checkTurn, so a scripted turn and a live turn mean the same thing.

import type { Fragment } from '@/types/playbook';
import { findAction } from '@/data/library';
import { isCondition, lineIsEmpty, type EditorDoc } from '@/components/flow01/doc';
import type { ChatMessage, ChatScenario, LiveTraceStep, SkillTurnWire } from './wire';

const REPLIES = new Set(['draft_reply', 'send_reply']);

function actionResult(actionId: string, meta: string): string {
  const a = findAction(actionId);
  if (actionId === 'tag') return meta ? `Tagged: ${meta}` : 'Tagged';
  if (actionId === 'assign') return meta ? `Assigned to ${meta}` : 'Assigned';
  if (actionId === 'note') return 'Internal note added';
  if (actionId === 'kb_search') return 'Found 3 matching articles';
  if (actionId === 'change_status') return meta ? `Status set to ${meta}` : 'Status changed';
  if (actionId === 'set_field') return meta ? `Field set: ${meta}` : 'Field set';
  if (actionId === 'ai_extract' || actionId === 'summarize') return 'Pulled the key details from the message';
  if (a?.connectorSlug && /get/i.test(a.name)) return 'Record found';
  if (a?.connectorSlug && /create|update/i.test(a.name)) return 'Created';
  if (actionId === 'slack_send_message') return 'Posted';
  return 'Done';
}

function stepsFor(id: string, body: Fragment[], out: LiveTraceStep[], replyAt: { id: string | null; actionId: string | null }) {
  const chips = body.filter((f): f is Extract<Fragment, { kind: 'chip' }> => f.kind === 'chip');
  if (chips.length === 0) {
    out.push({ kind: 'action', stepId: id, actionId: null, text: 'Done', branch: null, status: 'done', error: null });
    return;
  }
  for (const c of chips) {
    const meta = typeof c.chip.config.meta === 'string' ? c.chip.config.meta : '';
    if (REPLIES.has(c.chip.actionId)) {
      if (!replyAt.id) {
        replyAt.id = id;
        replyAt.actionId = c.chip.actionId;
      }
      continue;
    }
    out.push({
      kind: 'action',
      stepId: id,
      actionId: c.chip.actionId,
      text: actionResult(c.chip.actionId, meta),
      branch: null,
      status: 'done',
      error: null,
    });
  }
}

const FIRST_REPLY =
  "Thanks for reaching out. I'm looking into this now and will update you here shortly.";
const LATER_REPLY =
  "Thanks, that helps. I've passed this on, and a teammate will follow up with you here.";

/** One scripted skill turn. The first walks the whole skill; later ones only reply. */
export function scriptedSkillTurn(doc: EditorDoc, transcript: ChatMessage[]): SkillTurnWire {
  const first = !transcript.some((m) => m.role === 'skill');
  const steps: LiveTraceStep[] = [];
  const replyAt: { id: string | null; actionId: string | null } = { id: null, actionId: null };

  if (first) {
    steps.push({
      kind: 'thinking',
      stepId: null,
      actionId: null,
      text: "Reading the customer's message to work out what they need.",
      branch: null,
      status: 'done',
      error: null,
    });
  }
  for (const s of doc.steps) {
    if (isCondition(s)) {
      const arm = s.branches[0];
      if (!arm) continue;
      if (first) {
        steps.push({ kind: 'condition', stepId: s.id, actionId: null, text: null, branch: arm.id, status: 'done', error: null });
      }
      for (const l of arm.lines) {
        if (lineIsEmpty(l.body)) continue;
        if (first) stepsFor(l.id, l.body, steps, replyAt);
        else stepsFor(l.id, l.body, [], replyAt);
      }
    } else if (!lineIsEmpty(s.body)) {
      if (first) stepsFor(s.id, s.body, steps, replyAt);
      else stepsFor(s.id, s.body, [], replyAt);
    }
  }
  const text = first ? FIRST_REPLY : LATER_REPLY;
  if (replyAt.id) {
    steps.push({ kind: 'reply', stepId: replyAt.id, actionId: replyAt.actionId, text, branch: null, status: 'done', error: null });
  }
  return { triggerMatches: true, steps, reply: replyAt.id ? text : null, ended: false };
}

/** The scripted customer: the scenario's own follow-ups, then done. */
export function scriptedCustomerTurn(scenario: ChatScenario, transcript: ChatMessage[]) {
  const sent = transcript.filter((m) => m.role === 'customer').length; // opening included
  const next = scenario.script?.[sent - 1];
  return next ? { message: next, done: false } : { message: '', done: true };
}
