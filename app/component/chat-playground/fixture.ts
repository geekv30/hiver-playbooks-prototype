import type { ChatItem, ChatVerdict } from '@/components/simulate/chat/useChatRun';
import type { LiveTraceStep, TurnOutcome } from '@/lib/eval/wire';

/* One real playground chat, for the exhibit: the example skill (API error
 * triage) against the AI customer "Maya R.", recorded from a live run on
 * gpt-6-luna on 2026-09-28. The run was stopped before the agent's last turn,
 * so the sign-off and the rating at the end are added to show every state
 * the thread has. The review line is the live judge's own. */

const step = (s: Partial<LiveTraceStep> & Pick<LiveTraceStep, 'kind'>): LiveTraceStep => ({
  stepId: null,
  actionId: null,
  text: null,
  branch: null,
  status: 'done',
  error: null,
  ...s,
});

const think = (text: string) => step({ kind: 'thinking', text });
const act = (stepId: string, actionId: string | null, text: string) => step({ kind: 'action', stepId, actionId, text });
const cond = () => step({ kind: 'condition', stepId: 'ex-cond', branch: 'ex-b1' });
const reply = (text: string) => step({ kind: 'reply', stepId: 'ex-bl1', actionId: 'draft_reply', text });

const turn = (steps: LiveTraceStep[], text: string, ended = false) => ({
  stage: 'run' as const,
  note: null,
  steps,
  reply: text,
  ended,
  outcome: 'passed' as TurnOutcome,
  reason: 'ok' as const,
  gatedSteps: [] as string[],
  dropped: [] as string[],
});

const R1 =
  'A 404 means the requested resource or route was not found. Please confirm the base URL and that GET /v1/orders is still the correct endpoint, then try again. Could you share the exact error code or response body and the approximate time this first occurred?';
const R2 =
  'A 404 usually means the route wasn’t found, but I can’t confirm from this information whether the API or SDK changed. Please check that your requests still target the correct API environment and that GET /v1/orders is available for your API version. If possible, compare a request from before 9 a.m. with one now, including the full URL and response headers.';
const R3 =
  'I can’t confirm a change or outage from here, so I’m escalating this for an engineering review. Please capture the full request URL and response headers from a failing request, and share them here if available; the team can use those to investigate the 404 around 9 a.m.';

export const CUSTOMER = 'Maya R.';

export const ITEMS: ChatItem[] = [
  {
    kind: 'customer',
    id: 'c1',
    text: "I started getting a 404 from GET /v1/orders this morning. I'm using SDK version 3.2.1. Can you help me figure out what changed?",
  },
  {
    kind: 'agent',
    id: 'a1',
    status: 'done',
    firstRun: true,
    turn: turn(
      [
        think('I’ll record the reported API details, check the customer profile and engineering guidance, then determine the right response.'),
        act('ex-s1', null, 'Captured HTTP 404, GET /v1/orders, started this morning, SDK 3.2.1. Error code and exact start time are missing; ask the customer for those details.'),
        act('ex-s2', 'tag', 'Applied api-error and support tags.'),
        act('ex-s3', 'hubspot_get_contact', 'No matching customer contact found with the information provided.'),
        act('ex-s4', 'kb_search', 'No known fix found for this 404 on GET /v1/orders in Engineering space.'),
        think('A 404 is a client error, so I’ll share basic checks and request the missing details.'),
        cond(),
        reply(R1),
        act('ex-s6', 'clickup_create_task', 'Created an Engineering · Bugs task to track the reported 404 on GET /v1/orders with SDK 3.2.1.'),
      ],
      R1,
    ),
  },
  {
    kind: 'customer',
    id: 'c2',
    text: 'The base URL is correct, and GET /v1/orders is the endpoint we’ve been using. It started around 9 this morning; the response is just a 404 with no useful body. Did something change with the API or SDK?',
  },
  {
    kind: 'agent',
    id: 'a2',
    status: 'done',
    turn: turn(
      [
        think('I’ll assess the reported 404 and provide next steps while noting the missing HTTP status detail.'),
        act('ex-s1', null, 'Captured 404 on GET /v1/orders, began around 9 this morning, SDK 3.2.1; no response body.'),
        act('ex-s5', null, 'A 404 is a client-side error; the earlier response already suggested checking the base URL and endpoint.'),
        cond(),
        reply(R2),
      ],
      R2,
    ),
  },
  {
    kind: 'customer',
    id: 'c3',
    text: 'I already confirmed the base URL and endpoint, and the HTTP status is 404 with no response body. Can you check whether there was a change or outage around 9 this morning, or escalate this to someone who can?',
  },
  {
    kind: 'agent',
    id: 'a3',
    status: 'done',
    turn: turn(
      [
        think('I’ll escalate this confirmed 404 for an engineering review of possible API changes around 9 a.m.'),
        act('ex-s1', null, 'Confirmed HTTP 404 on GET /v1/orders, began around 9 a.m.; SDK 3.2.1. The customer asks whether there was a change or outage.'),
        cond(),
        reply(R3),
        act('ex-s7a', 'assign', 'Assigned to Varun to follow up with engineering on the potential API change or outage.'),
      ],
      R3,
      true,
    ),
  },
  {
    kind: 'customer',
    id: 'c4',
    text: 'Thanks for escalating. I’ll grab the request URL and headers if I can reproduce it, but please have engineering check for a route change around 9 this morning.',
  },
  {
    kind: 'agent',
    id: 'a4',
    status: 'done',
    turn: {
      ...turn([], 'Will do. Engineering has the details, and we’ll update you here as soon as we know more.'),
      stage: 'close',
    },
  },
  { kind: 'rating', id: 'r1', score: 3, comment: 'Got escalated in the end, but it took three messages.' },
];

export const OUTCOME: TurnOutcome = 'attention';

export const VERDICT: ChatVerdict = {
  verdict: 'unresolved',
  reason:
    'The customer asked for an engineering check or escalation, but the agent did not assign the chat until the third turn and never confirmed that engineering would check for a route change around 9 a.m.',
};
