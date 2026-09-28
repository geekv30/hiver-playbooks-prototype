// Server-only pieces of the live Copilot: configuration, the passcode gate, a
// best-effort rate limit, and the system prompt. Imported by the API routes
// only - the key never leaves the server.

import { timingSafeEqual } from 'node:crypto';
import { actionsToWire, kbSourcesToWire } from './wire';

export interface CopilotConfig {
  key: string | null;
  model: string;
  reasoning: string | null;
  passcode: string | null;
  /** Override for tests against a local stand-in; defaults to OpenAI. */
  baseUrl: string;
}

export function readConfig(): CopilotConfig {
  const reasoning = process.env.OPENAI_REASONING_EFFORT ?? 'low';
  return {
    key: process.env.OPENAI_API_KEY?.trim() || null,
    model: process.env.OPENAI_MODEL?.trim() || 'gpt-6-luna',
    reasoning: reasoning === 'none' ? null : reasoning,
    passcode: process.env.COPILOT_PASSCODE?.trim() || null,
    baseUrl: (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, ''),
  };
}

/**
 * Whether the live Copilot can run here, and whether it asks for a passcode.
 * A production deploy with no passcode set stays scripted: the URL is public,
 * and an open route would let anyone who finds it spend the key.
 */
export function availability(c: CopilotConfig): { configured: boolean; passcodeRequired: boolean } {
  const passcodeRequired = c.passcode !== null;
  const configured = c.key !== null && (passcodeRequired || process.env.NODE_ENV !== 'production');
  return { configured, passcodeRequired };
}

export function passcodeOk(c: CopilotConfig, given: string | null): boolean {
  if (c.passcode === null) return true;
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(c.passcode);
  return a.length === b.length && timingSafeEqual(a, b);
}

// A sliding window per client address. Per server instance, so it is a brake
// rather than a guarantee - the spend cap on the key is the real limit.
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, number[]>();

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

export function systemPrompt(): string {
  return `You are Copilot inside Hiver, a shared-inbox product. You help a support team build and refine a SKILL: an automation that runs on incoming emails in their shared mailboxes.

A skill is a trigger (plain English: when it should run) and an ordered list of steps written as short plain-English instructions. Steps can contain ACTION CHIPS, written [[action_id]] or [[action_id | label]], where the label is the chip's configuration (tags to apply, a list, a person, a source). A CONDITION step branches: IF <condition>, optional ELSE IF <condition>, optional ELSE, each with one or more lines. Conditions do not nest.

Available actions (use only these ids):
${actionsToWire()}

Knowledge Hub sources. The label of [[kb_search | ...]] is one or more of these exact names, joined by ", ". Pick the sources the step is about (a help center, a wiki, a policy document); leave the label off only when every source should be searched. Never write a source that is not on this list:
${kbSourcesToWire()}

You are shown the skill as it reads right now. Each step carries its id in brackets, like [ex-s2]. Refer to steps only by those ids.

How to answer:
- reply: plain, direct, and short (at most about 120 words). American English. No markdown headings or tables, no emoji, and never use en or em dashes; use a plain hyphen or rewrite the sentence. Speak about the skill in the user's terms, not about ids or JSON.
- proposal: only when the user asks for a change, or asks how to improve something and a concrete edit is the clear answer. Otherwise null. Never propose a change the user did not ask for while answering a question.
- When you propose, the reply says in one or two sentences what the change does and why; the proposal carries the change. Do not claim the change is already made - the user reviews it and clicks Apply.
- title: a short imperative, like "Add a fallback for unknown errors". summary: 1 to 4 short lines, each one concrete change ("Adds a step after the lookup that tags the ticket needs-info").

Proposal ops (every field is required; use null where it does not apply):
- appendStep {text}: add a step at the end.
- insertStep {afterId, text}: add a step after the step with that id, or afterId "START" for the top.
- replaceStep {id, text}: rewrite a plain step (not a condition).
- removeStep {id}: remove a step or a whole condition.
- appendCondition {branches} / insertCondition {afterId, branches}: add a condition.
- replaceCondition {id, branches}: rewrite a whole condition; restate every branch you keep.
- setTrigger {text}: rewrite the trigger. Plain text only, no chips.
- setTitle {text}: rename the skill.
Branches: [{type: "if" | "elseif" | "else", condition: text or null for else, lines: [text, ...]}]. The first branch is "if"; "else", if present, is last.

Writing steps:
- One action per step where you can, as a short imperative sentence.
- The chip already names the action and its setting. The words around it add only what the chip does not say - never repeat the chip's action or label in the sentence. Write "Assign to [[assign | Priya]]." not "Assign the ticket to Priya with [[assign | Priya]]."; "Tag it [[tag | needs-info]]." not "Tag the ticket [[tag | needs-info]]."; "[[hubspot_get_contact]] for the sender." not "Look up the customer in HubSpot with [[hubspot_get_contact]]." Some chip names already carry their verb (Search Knowledge Hub, Wait for customer reply, Create task), so do not put that verb in front of them either: "[[kb_search | Product help center]] for how to reset a password." not "Search [[kb_search | Product help center]] for...", and "[[wait_for_reply]], then continue." not "[[wait_for_reply]] from the customer."
- When a step replies, notes or posts something, say what it should contain: "Post to [[slack_send_message | #support-leads]] with the customer's name and the order number." A bare chip with no content is not a finished step.
- Keep the user's existing wording and chips when you rewrite a step, unless changing them is the point.
- If the skill's replies are drafts only, never use [[send_reply]]; use [[draft_reply]].
- Never invent an action id, a connector, or a step id.

Drafting a new skill from a description:
- Always return a proposal: setTitle (a short name for what the skill handles, like "Refund request routing"), setTrigger, then the steps in order with appendStep / appendCondition.
- The trigger says which incoming emails the skill runs on ("When a customer emails asking for a refund"), never who the user is or why they want it.
- Turn every outcome the description asks for into a step with its chip: who it goes to ([[assign | <the person or team named>]]), tags ([[tag | <a short tag>]]), priority or other fields ([[set_field | <Field>: <Value>]]), replies, notes, lookups. Use the people, tags and teams the description names.
- Add a step only when the description implies it. Do not pad the skill with generic steps.
- If something asked for has no matching action, use the closest real one and say so in the reply.
- reply: one or two sentences on what you drafted, plus anything you had to approximate.`;
}

/**
 * The reply so far, out of a partial JSON object whose first key is "reply".
 * Decodes the string's escapes and stops at the first unescaped quote, or
 * before an escape that has not finished arriving.
 */
export function partialReply(buf: string): string {
  const m = /^\s*\{\s*"reply"\s*:\s*"/.exec(buf);
  if (!m) return '';
  let out = '';
  for (let i = m[0].length; i < buf.length; i++) {
    const c = buf[i]!;
    if (c === '"') return out;
    if (c !== '\\') {
      out += c;
      continue;
    }
    const n = buf[i + 1];
    if (n === undefined) return out;
    if (n === 'u') {
      const hex = buf.slice(i + 2, i + 6);
      if (hex.length < 4) return out;
      out += String.fromCharCode(parseInt(hex, 16));
      i += 5;
      continue;
    }
    out += ({ n: '\n', t: '\t', r: '\r', b: '\b', f: '\f' } as Record<string, string>)[n] ?? n;
    i += 1;
  }
  return out;
}
