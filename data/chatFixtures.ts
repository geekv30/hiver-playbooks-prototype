// Chat evaluation fixtures - GENERIC, swappable seed data.
//
// Chats live in a CHAT INBOX (the chat twin of a shared mailbox). The past
// chats are believable support conversations, not any real account's; the
// scenario list is what AI scenarios offers before (or without) the live model
// writing scenarios for the skill. Deterministic, so every reload matches.

import type { ChatScenario } from '@/lib/eval/wire';

export interface ChatInbox {
  id: string;
  name: string;
}

export const CHAT_INBOXES: ChatInbox[] = [
  { id: 'website', name: 'Website chat' },
  { id: 'helpcenter', name: 'Help center chat' },
  { id: 'inapp', name: 'In-app chat' },
];

export const chatInboxName = (id: string): string => CHAT_INBOXES.find((c) => c.id === id)?.name ?? id;

export interface PastChatMessage {
  /** Who wrote it in the real chat: the customer, or the teammate who answered. */
  from: 'customer' | 'agent';
  text: string;
}

export interface PastChat {
  id: string;
  customer: string;
  /** Relative start time, as the list shows it. */
  started: string;
  messages: PastChatMessage[];
}

export const PAST_CHATS: PastChat[] = [
  {
    id: 'pc1',
    customer: 'Maya Robinson',
    started: '12 mins ago',
    messages: [
      { from: 'customer', text: 'Hi, every call to /v2/orders has returned 404 since this morning. We are on SDK 1.2.1. Did something change?' },
      { from: 'agent', text: 'Thanks Maya. Could you share a request ID so I can look it up?' },
      { from: 'customer', text: 'Sure, req_8f21c. It worked fine yesterday.' },
      { from: 'agent', text: 'Found it. The route moved to /v2/order in 1.2.1. Updating the path fixes it, and I have flagged the docs.' },
    ],
  },
  {
    id: 'pc2',
    customer: 'Jordan Kim',
    started: '40 mins ago',
    messages: [
      { from: 'customer', text: 'Checkout API is throwing 500s for about 20 minutes now. Is there an incident?' },
      { from: 'agent', text: 'Yes, we are seeing it too and a fix is rolling out. I will update you here when it clears.' },
      { from: 'customer', text: 'Ok thanks, please do.' },
    ],
  },
  {
    id: 'pc3',
    customer: 'Priya Shah',
    started: '1 hr ago',
    messages: [
      { from: 'customer', text: 'I keep getting an error when I sync customer records. Can someone help?' },
      { from: 'agent', text: 'Happy to help. What does the error say, and which endpoint are you calling?' },
      { from: 'customer', text: 'It says 429 too many requests on /v2/customers.' },
      { from: 'agent', text: 'That is the rate limit. Batching the sync or adding a short backoff keeps you under it.' },
    ],
  },
  {
    id: 'pc4',
    customer: 'Derek Lane',
    started: '2 hrs ago',
    messages: [
      { from: 'customer', text: 'Your API has been failing all morning and we have lost orders because of it. I need this fixed now.' },
      { from: 'agent', text: 'I am sorry, Derek. I have escalated this to engineering and will stay with you until it is resolved.' },
    ],
  },
  {
    id: 'pc5',
    customer: 'Grace Hall',
    started: '3 hrs ago',
    messages: [
      { from: 'customer', text: 'How do I change the billing email on our account?' },
      { from: 'agent', text: 'Go to Settings, then Billing, and edit the contact email there.' },
    ],
  },
  {
    id: 'pc6',
    customer: 'Sam Ortiz',
    started: '5 hrs ago',
    messages: [
      { from: 'customer', text: 'Webhooks stopped arriving after we rotated our signing secret. Getting 401 on our side now.' },
      { from: 'agent', text: 'The new secret takes a few minutes to apply. If 401s continue, re-save it under Webhooks.' },
      { from: 'customer', text: 'Re-saved it and it works now, thanks.' },
    ],
  },
  {
    id: 'pc7',
    customer: 'Lena Fischer',
    started: 'Yesterday',
    messages: [
      { from: 'customer', text: 'Is there a way to export all our tickets to CSV?' },
      { from: 'agent', text: 'Yes, under Reports you can export any view to CSV.' },
    ],
  },
  {
    id: 'pc8',
    customer: 'Omar Haddad',
    started: 'Yesterday',
    messages: [
      { from: 'customer', text: 'Getting a timeout on the reporting endpoint, it just hangs and then returns 504.' },
      { from: 'agent', text: 'Thanks Omar. Large date ranges can time out. Could you try a shorter range while we look into it?' },
    ],
  },
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** The past chats a chat inbox shows: a stable slice per inbox. */
export function pastChatsForInbox(inboxId: string, count = 6): PastChat[] {
  if (!inboxId) return [];
  const start = hashId(inboxId) % PAST_CHATS.length;
  const n = Math.min(count, PAST_CHATS.length);
  return Array.from({ length: n }, (_, i) => PAST_CHATS[(start + i) % PAST_CHATS.length]!);
}

/** What AI scenarios offers until the live model writes scenarios for the
 *  skill, and all it offers without it. Each carries a scripted follow-up so
 *  the scripted demo can play the customer too. */
export const CHAT_SCENARIOS: ChatScenario[] = [
  {
    id: 'cs1',
    persona: 'Maya R.',
    goal: 'Get a 404 on an endpoint fixed after upgrading the SDK.',
    opening: 'Hi, since we upgraded to SDK 1.2.1 our calls to /v2/orders return 404. What changed?',
    script: ['Yes, the path is exactly what the docs say. It worked yesterday.', 'Ok, I will try that. Thanks.'],
  },
  {
    id: 'cs2',
    persona: 'Jordan K.',
    goal: 'Find out whether a burst of 500 errors is an incident.',
    opening: 'Checkout API is returning 500s for the last 20 minutes. Is something down?',
    script: ['How long until it is fixed? Our customers cannot pay.', 'Thanks, please keep me posted.'],
  },
  {
    id: 'cs3',
    persona: 'Priya S.',
    goal: 'Get help with an error, without giving the details up front.',
    opening: 'I keep getting an error when I sync records. Can someone help?',
    script: ['It says 429 too many requests.', 'Got it, thank you.'],
  },
  {
    id: 'cs4',
    persona: 'Derek L.',
    goal: 'Get an outage fixed now, and be heard while it is.',
    opening: 'Your API has been failing all morning and we have lost orders. I need someone to fix this right now.',
    script: ['That is not good enough. When exactly will it be fixed?', 'Fine. Call me as soon as you know more.'],
  },
];
