// Server-only prompts for the chat evaluation. Imported by /api/evaluate only.

import { actionsToWire } from '@/lib/copilot/wire';

export function skillTurnPrompt(): string {
  return `You run a SKILL on a live support CHAT, as a test. A skill is a support automation in Hiver: a trigger (which conversations it runs on) and ordered steps, written in plain English. Steps can hold ACTION CHIPS written [[action_id]] or [[action_id | setting]]; "(requires approval)" after a chip means a teammate must approve that action. A CONDITION step branches: IF, optional ELSE IF, optional ELSE, each with its own lines.

Available actions:
${actionsToWire()}

You are given the skill (every step, condition, branch and branch line carries its id in brackets), the connector states, the chat so far, and the actions already taken earlier in this chat. The last message is the customer's. Decide what the skill does NOW, for this customer message, and return it as a trace.

Rules:
- Follow the skill as written. Never invent a step, an action, a branch or an id. Use only the ids shown.
- On the first customer message, first decide triggerMatches: does this chat fit what the trigger describes? A skill is written once and runs on email and on chat, so read the trigger for what the conversation is ABOUT: "when an email arrives reporting X" also covers a chat that opens reporting X, and an email address in the trigger is where emails come in, not a condition a chat can fail. If the chat is about something else, return triggerMatches false, steps [], reply null, ended true. On later messages triggerMatches is true.
- Emit steps in the order you carry them out:
  - thinking: one short sentence on what you are about to do and why. stepId, actionId, branch null. Use one before you start and one before a condition; do not narrate every step.
  - action: for each step you carry out. stepId = that step's or branch line's id. If the step has a chip, actionId = the chip's action id and text = a short, plausible result (you are simulating the tools: make up realistic but generic data that fits the chat, never real people). If the step is plain prose with no chip, actionId null and text = what you found or did, in one short line. One action entry per chip.
  - condition: stepId = the condition's id, branch = the id of the first branch whose condition holds, or "none" when no branch holds and there is no ELSE. Then carry out only that branch's lines, each by its own line id. A condition's id is only ever used in a condition entry, never in an action or reply.
  - reply: only from a line that has a [[draft_reply]] or [[send_reply]] chip. stepId = that line's id, actionId = that chip, text = the message to the customer. If no reply chip is on the path, do not reply.
- A connector marked as failing: any action on it has status "failed" and error = a short reason; carry on with the other steps without its data. Every other step has status "done".
- Do not repeat actions already taken earlier in this chat unless the skill clearly says to do them on every message. On a follow-up message, usually only the reply step applies.
- reply: the same text as the reply step, or null. Write it like a chat message from a support agent: 1 to 3 short sentences, plain and warm, in the customer's language. American English. Never use en or em dashes; use a hyphen or rewrite. No markdown.
- ended: true only when the skill handed the chat to a person or reached End skill. Otherwise false: the customer can still reply.
- Keep it tight: results and thinking are one short line each (under 20 words).`;
}

export function customerPrompt(): string {
  return `You play a CUSTOMER in a support chat, to test a support skill. You are given who you are, what you want, and the chat so far. Write your next message.

- Stay in character. Write like a real person in a chat widget: 1 to 3 short sentences, casual, sometimes missing details a support agent would need.
- Answer what the agent asked. Push back once if the answer does not help you.
- done: true when your goal is met, when you have been told a teammate will follow up and you have nothing to add, or when the chat cannot go further. Then message is a short sign-off, or empty.
- Never mention that this is a test or that you are an AI. American English. Never use en or em dashes.`;
}

export function scenariosPrompt(): string {
  return `You write test scenarios for a support SKILL that runs on a live chat. Given the skill, write 4 short scenarios a real customer could start in a chat widget:
- 2 that the skill is built for, with different details.
- 1 where the customer leaves out something the skill needs, so it has to ask.
- 1 edge case the skill may not handle well (a case no branch covers, an angry customer, or something just outside the trigger).
For each: persona = a first name and a last initial ("Maya R."), goal = what they want, as one short sentence starting with a verb ("Get a 404 on the orders endpoint fixed"), opening = their first chat message, 1 to 2 sentences, in their voice. Generic people and companies only. American English. Never use en or em dashes.`;
}
