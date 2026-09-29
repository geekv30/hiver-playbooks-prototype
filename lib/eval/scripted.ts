// The scripted chat evaluation - what runs when the live model is not on (a
// shared prod link without the passcode). It walks the skill as written: every
// step on the IF path, each chip as an action, the first reply chip as the
// reply. The words are generic on purpose and the surface labels them
// "Scripted demo", so nothing here passes itself off as the model.
//
// It returns the same SkillTurnWire the model returns and goes through the
// same checkTurn, so a scripted turn and a live turn mean the same thing. It
// cannot judge the trigger, so any message that says something runs the skill.

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

function stepsFor(id: string, body: Fragment[], out: LiveTraceStep[], replyAt: { id: string | null }) {
  const chips = body.filter((f): f is Extract<Fragment, { kind: 'chip' }> => f.kind === 'chip');
  if (chips.length === 0) {
    out.push({ kind: 'action', stepId: id, actionId: null, text: 'Done', branch: null, status: 'done', error: null });
    return;
  }
  for (const c of chips) {
    const meta = typeof c.chip.config.meta === 'string' ? c.chip.config.meta : '';
    if (REPLIES.has(c.chip.actionId)) {
      if (!replyAt.id) replyAt.id = id;
      continue;
    }
    out.push({ kind: 'action', stepId: id, actionId: c.chip.actionId, text: actionResult(c.chip.actionId, meta), branch: null, status: 'done', error: null });
  }
}

// "thanks", "that's all", "bye" - the customer is wrapping up. The whole
// message has to be the sign-off: "Thanks, but it still fails" is not one.
const CLOSING =
  /^\s*((ok(ay)?|great|perfect|awesome),?\s*)?(thanks|thank you|thx|that'?s all|that is all|bye|goodbye)(\s+(so much|a lot|again|for (the|your) help))?[\s!.,]*(((that'?s|that is) all( i needed)?|bye|goodbye)[\s!.]*)?$/i;
const CLOSE_REPLY = "You're welcome! If anything else comes up, just message us here.";

// "hi", "hello there", "are you there?" - nothing the skill could act on yet.
const GREETING = /^\s*(hi|hey|hello|hiya|yo|good (morning|afternoon|evening)|are you there|anyone there|help)[\s!.?,]*(there)?[\s!.?]*$/i;

const GREET_REPLY = 'Hi there! What can I help you with today?';
const FIRST_REPLY = "Thanks for reaching out. I'm looking into this now and will update you here shortly.";
const LATER_REPLY = "Thanks, that helps. I've passed this on, and a teammate will follow up with you here.";

/** One scripted agent turn. The first real message walks the whole skill;
 *  later ones only reply. */
export function scriptedSkillTurn(doc: EditorDoc, transcript: ChatMessage[], skillStarted: boolean): SkillTurnWire {
  const last = [...transcript].reverse().find((m) => m.role === 'customer')?.text ?? '';
  if (skillStarted && CLOSING.test(last)) {
    return { stage: 'close', note: null, steps: [], reply: CLOSE_REPLY, ended: true };
  }
  if (!skillStarted && GREETING.test(last)) {
    return { stage: 'greet', note: null, steps: [], reply: GREET_REPLY, ended: false };
  }
  const first = !skillStarted;
  const steps: LiveTraceStep[] = [];
  const replyAt: { id: string | null } = { id: null };
  if (first) {
    steps.push({ kind: 'thinking', stepId: null, actionId: null, text: "Reading the customer's message to work out what they need.", branch: null, status: 'done', error: null });
  }
  for (const s of doc.steps) {
    if (isCondition(s)) {
      const arm = s.branches[0];
      if (!arm) continue;
      if (first) steps.push({ kind: 'condition', stepId: s.id, actionId: null, text: null, branch: arm.id, status: 'done', error: null });
      for (const l of arm.lines) if (!lineIsEmpty(l.body)) stepsFor(l.id, l.body, first ? steps : [], replyAt);
    } else if (!lineIsEmpty(s.body)) {
      stepsFor(s.id, s.body, first ? steps : [], replyAt);
    }
  }
  const text = first ? FIRST_REPLY : LATER_REPLY;
  if (replyAt.id) steps.push({ kind: 'reply', stepId: replyAt.id, actionId: null, text, branch: null, status: 'done', error: null });
  return { stage: 'run', note: null, steps, reply: replyAt.id ? text : null, ended: false };
}

/** The scripted customer: the scenario's own follow-ups, then done. */
export function scriptedCustomerTurn(scenario: ChatScenario, transcript: ChatMessage[]) {
  const sent = transcript.filter((m) => m.role === 'customer').length; // opening included
  const next = scenario.script?.[sent - 1];
  return next
    ? { message: next, done: false, rating: null, comment: null }
    : { message: 'Thanks, that is all I needed.', done: true, rating: 4, comment: 'Got an answer quickly.' };
}
