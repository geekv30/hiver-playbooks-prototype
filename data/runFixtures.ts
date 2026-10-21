// Skill runs - the execution-history model and its deterministic seed data.
//
// A RUN is one execution of a live skill against one conversation. This is the
// post-enable twin of the Evaluation fixtures: same trace vocabulary, but the
// emails are real inbound rather than samples, and the outcome is history
// rather than a rehearsal.
//
// GENERIC + config-driven (see feedback-reusability-principle): the renderers
// read this model and nothing else. Swapping the pools below re-skins the whole
// Runs surface. Generation is seeded, so every reload shows the same history.

import { RECENT_EMAILS, type SimEmail } from './simFixtures';
import type { Channel } from './inboxes';

// --- Model ------------------------------------------------------------------

/** How a run ended. Every run ends in exactly one of these.
 *  `attention` (trigger fired, nothing matched) is deliberately absent: that is
 *  an Evaluation signal, not a run. Runs record what the skill DID. */
export type RunState = 'completed' | 'awaiting' | 'failed' | 'declined';

/** Step kinds, aligned with the Evaluation trace so one vocabulary covers both. */
export type RunStepKind = 'thinking' | 'action' | 'condition' | 'reply';

/** `held`: a gated action waiting on a person (chat - a live chat cannot hold
 *  its reply, so what waits is the action). `declined`: that person said no. */
export type RunStepStatus = 'done' | 'failed' | 'skipped' | 'held' | 'declined';

export interface RunStep {
  id: string;
  kind: RunStepKind;
  /** Label shown on the step row (a thinking step labels itself). */
  label?: string;
  /** Icon key resolved through ACTION_ICON. */
  iconKey?: string;
  /** Reply steps: the medium after the " - " (e.g. "draft"). */
  suffix?: string;
  status: RunStepStatus;
  /** What this step actually took, this run. */
  ms: number;
  /** thinking: the reasoning line. */
  text?: string;
  /** action: the result, once done. */
  output?: string;
  /** action: why it failed. */
  error?: string;
  /** condition: which arm fired. */
  condType?: 'if' | 'elseif' | 'else';
  branch?: string;
  /** reply: the drafted body. */
  draft?: string;
}

export interface RunError {
  /** The step label that threw. */
  step: string;
  /** Short machine code, shown verbatim - this is what gets grouped and searched. */
  code: string;
  message: string;
}

/** One customer message in a chat run, and what the AI agent did about it. */
export interface RunTurn {
  id: string;
  /** When the customer wrote. */
  at: number;
  message: string;
  /** What the agent did for this message, in order. Ends with the reply step
   *  when the agent got that far. */
  steps: RunStep[];
  /** What the customer received. Absent when the turn broke before a reply. */
  reply?: string;
  /** The reply came from the fallback, not from the skill (the turn failed). */
  fallback?: boolean;
}

/** How a chat came to an end, separate from how the run turned out. A run can
 *  complete and the customer still walk away mid-way. */
export type ChatEnding = 'closed' | 'left' | 'handedOff';

export interface SkillRun {
  id: string;
  skillId: string;
  skillName: string;
  channel: Channel;
  /** The conversation this ran on. */
  conversationId: string;
  /** Email only - a chat has no subject. */
  subject?: string;
  /** The customer: a name, or the generated handle of an anonymous visitor. */
  sender: string;
  /** Absent for a chat visitor who never gave one. */
  senderEmail?: string;
  /** The shared mailbox or chat inbox it ran in. */
  inboxId: string;
  /** Chat only: the turns the skill handled, oldest first. */
  turns?: RunTurn[];
  /** Chat only: messages exchanged before the skill picked the chat up. */
  priorMessages?: number;
  /** Chat only: how the chat ended. */
  ending?: ChatEnding;
  /** Chat only: planned steps the chat never reached (the customer left). */
  notReached?: string[];
  state: RunState;
  startedAt: number;
  durationMs: number;
  steps: RunStep[];
  /** Action labels that actually applied - the row chips and the facts panel. */
  applied: string[];
  /** Third-party writes that actually landed (connector actions). */
  external: string[];
  error?: RunError;
  /** Awaiting approval: who holds it, and since when. */
  assignee?: string;
}

// --- Seed pools (generic, swappable) ---------------------------------------

const SENDER_EMAIL: Record<string, string> = {
  'Ava Johnson': 'ava.johnson@northwind.co',
  'Liam Smith': 'liam@brightpath.io',
  'Noah Davis': 'n.davis@meridiansupply.com',
  'Emma Wilson': 'emma.wilson@larkstudio.com',
  'Olivia Brown': 'olivia@fernhill.co',
  'Mason Lee': 'mason.lee@arcadedata.io',
  'Sophia Carter': 'sophia.carter@blueharbor.com',
  'Noah Johnson': 'noah.j@stonebridge.co',
  'Isabella Martin': 'isabella@vantageworks.io',
  'James Anderson': 'j.anderson@coralpeak.com',
  'Mia Thompson': 'mia.thompson@quillside.co',
  'Ethan Clark': 'ethan@redwoodlabs.io',
};

/** Who holds a gated reply. Generic team names. */
const APPROVERS = ['Priya Nair', 'Daniel Osei', 'Sara Lund'];

/** Extra inbound for the skills the shared sample set does not cover. Kept here
 *  rather than in simFixtures so the Evaluation surfaces are untouched. */
const EXTRA_EMAILS: SimEmail[] = [
  {
    id: 'x1',
    sender: 'Grace Hall',
    subject: 'Where is my order? It is two weeks late now',
    preview:
      'The tracking has not moved past the depot for twelve days and nobody has been able to tell me where the parcel is.',
    draft:
      'Hi Grace, I am sorry about the wait. The parcel is stuck at the depot, so I have raised it with the carrier and asked for a replacement to ship today. I will confirm the new tracking as soon as it is issued.',
  },
  {
    id: 'x2',
    sender: 'Daniel Osei',
    subject: 'Delivery promised Friday, still nothing',
    preview:
      'We were told the shipment would land on Friday and it has not arrived. Our install is now blocked and the team is waiting.',
    draft:
      'Hi Daniel, apologies for the delay. The shipment missed its Friday slot and is now booked for tomorrow morning. I have flagged your install date to the ops team so they can prioritise it.',
  },
  {
    id: 'x3',
    sender: 'Amara Singh',
    subject: 'Renewal quote for next year',
    preview:
      'Our contract is up next month and I would like to see the renewal pricing before I take it to finance.',
    draft:
      'Hi Amara, happy to help. Your renewal quote is attached, on the same per-seat rate as this year. Let me know if finance needs it broken out differently.',
  },
  {
    id: 'x5',
    sender: 'Nina Kovac',
    subject: 'Could we get a weekly digest email?',
    preview:
      'A short weekly summary of what changed would save my team opening the app every morning just to check.',
    draft:
      'Hi Nina, thanks for the idea. A weekly digest is not built yet, but it is a request we hear often - I have logged yours so the team can weigh it alongside the rest.',
  },
  {
    id: 'x6',
    sender: 'Marcus Oyelaran',
    subject: 'Any plans for a mobile app?',
    preview:
      'Half our team works from the road and the web app is awkward on a phone. Is a native app on the roadmap?',
    draft:
      'Hi Marcus, a native app is not on the near-term roadmap, though mobile web is something we are actively improving. I have added your note so the team can see the demand.',
  },
  {
    id: 'x4',
    sender: 'Leo Fischer',
    subject: 'Getting set up with the team',
    preview:
      'We just signed up and I want to get the rest of the team on before our first sprint. Anything I should do first?',
    draft:
      'Hi Leo, welcome aboard. The quickest path is to invite the team from Settings, then connect your inbox - the setup guide walks through both. Shout if you would like a hand.',
  },
];

/** The mail each skill plausibly fires on. Absent = the whole pool. */
const SKILL_EMAILS: Record<string, string[]> = {
  'api-error-triage': ['re6', 're10', 're12', 're7'],
  'refund-requests': ['re2', 're5', 're8', 're11'],
  'shipping-delays': ['re3', 'x1', 'x2'],
  'feature-requests': ['re4', 'x5', 'x6'],
  'welcome-onboarding': ['re9', 'x4'],
  'contract-renewals': ['x3'],
  'invoice-disputes': ['re2', 're5', 're8', 're11'],
};

/** How long a gated reply waits before the draft is discarded and the run
 *  closes. A pending approval older than this is not still pending - it timed
 *  out - and showing one would be a lie the surface tells about itself. */
export const APPROVAL_EXPIRY_DAYS = 5;

/** Failure causes, with the step they break at. Grouped by `code` in the
 *  summary ("3 failures, all HUBSPOT_401"), so the codes matter. */
const FAILURES: { step: string; code: string; message: string; atIdx: number }[] = [
  {
    step: 'Get contact',
    code: 'HUBSPOT_401',
    message: 'HubSpot rejected the request - the connection needs re-authentication.',
    atIdx: 3,
  },
  {
    step: 'Search Knowledge Hub',
    code: 'KB_TIMEOUT',
    message: 'Knowledge Hub did not respond in time.',
    atIdx: 4,
  },
  {
    step: 'Create task',
    code: 'CLICKUP_429',
    message: 'ClickUp rate limit reached - too many requests.',
    atIdx: 5,
  },
];

/** The step template a run walks. Mirrors the shipped Evaluation trace so the
 *  two surfaces read as one system.
 *
 *  Steps marked optional are the ones a skill only takes when the email calls
 *  for them - a known customer to look up, a bug worth filing. Every run walks
 *  the required steps; the optional ones vary, which is what makes one run's
 *  trace worth reading against another's. */
const STEP_TEMPLATE: (Omit<RunStep, 'status' | 'ms'> & { optional?: boolean })[] = [
  {
    id: 't1',
    kind: 'thinking',
    text: 'Reading the conversation to confirm the sender and pull out what is being asked.',
  },
  {
    id: 's1',
    kind: 'action',
    iconKey: 'extract',
    label: 'Extract details',
    output: 'customer, order reference, and what they asked for',
  },
  { id: 's2', kind: 'action', iconKey: 'tag', label: 'Tag', output: 'needs-reply, support' },
  {
    id: 's3',
    kind: 'action',
    iconKey: 'contact',
    label: 'Get contact',
    output: 'John Doe - hiverhq.com',
    optional: true,
  },
  {
    id: 's4',
    kind: 'action',
    iconKey: 'kb',
    label: 'Search Knowledge Hub',
    output: '1 matching article',
    optional: true,
  },
  {
    id: 's5',
    kind: 'action',
    iconKey: 'clickup',
    label: 'Create task',
    output: 'OPS-2213 - Support / Escalations',
    optional: true,
  },
  { id: 't2', kind: 'thinking', text: 'Deciding which reply fits this case.' },
  { id: 's6', kind: 'condition', condType: 'if', branch: 'the request matches a known case' },
  { id: 's7', kind: 'reply', iconKey: 'reply', label: 'Reply', suffix: 'draft' },
];

/** Per-skill step copy. The template above is written to fit ANY support skill
 *  (see feedback-reusability-principle); a skill whose steps are worth naming
 *  precisely overrides them here rather than the template being about one case
 *  and wrong for the other seven. */
const SKILL_OVERRIDES: Record<string, Record<string, Partial<RunStep>>> = {
  'order-status': {
    t1: { text: 'Reading the chat to find the order and what the customer wants to know.' },
    s1: { label: 'Extract order details', output: 'order #61204, shipped yesterday, due Thursday' },
    s2: { output: 'order-status, chat' },
    s4: { output: '1 matching article: Tracking your order' },
    s5: { output: 'OPS-3120 - Logistics / Address changes' },
    t2: { text: 'Checking whether the order has shipped, to choose the reply.' },
    s6: { branch: 'the order has not shipped yet' },
  },
  'api-error-triage': {
    t1: {
      text: 'Checking the conversation to confirm the sender and pull the error details before acting.',
    },
    s1: { label: 'Summarize error', output: 'summary: 404, not found, 11:34, v1.2.1, southern-S3' },
    s2: { output: 'api-error, support' },
    s4: { output: 'returned: 200 OK' },
    s5: { output: 'ENG-4471 - Engineering / Bugs' },
    t2: { text: 'Categorizing the error to choose the right reply.' },
    s6: { branch: 'the error is a 4xx client error' },
  },
  'refund-requests': {
    s1: { label: 'Extract refund details', output: 'order #40182, $129.00, requested today' },
    s2: { output: 'refund-request, billing' },
    s6: { branch: 'the order is inside the refund window' },
  },
  'shipping-delays': {
    s1: {
      label: 'Extract order details',
      output: 'order #55210, 9 days late, no tracking movement',
    },
    s2: { output: 'shipping-delay, escalated' },
    s5: { output: 'OPS-4471 - Logistics / Delays' },
    s6: { branch: 'the delivery is more than five days late' },
  },
  'feature-requests': {
    s1: { label: 'Extract the request', output: 'dark mode, raised by 3 customers this month' },
    s2: { output: 'feature-request, product' },
    s5: { output: 'PROD-881 - Product / Backlog' },
    s6: { branch: 'the request is already on the backlog' },
  },
  'welcome-onboarding': {
    s1: { label: 'Extract account details', output: 'new workspace, 4 seats, self-serve' },
    s2: { output: 'onboarding, welcome' },
    s6: { branch: 'the plan includes a guided setup' },
  },
};

/** Realistic base duration per step (ms), same order as STEP_TEMPLATE. */
const STEP_MS = [620, 700, 150, 950, 450, 780, 430, 90, 1300];

/** Which template steps count as an applied action, and how they read as a chip. */
const CHIP_LABEL: Record<string, string> = {
  s2: 'Tagged',
  s5: 'Task created',
  s7: 'Reply drafted',
};
/** Which applied steps are third-party writes. */
const EXTERNAL_LABEL: Record<string, string> = {
  s3: 'HubSpot contact read',
  s5: 'ClickUp task created',
};

// --- Deterministic generation ----------------------------------------------

/** Mulberry32 - small, fast, seeded. Same seed, same history, every reload. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** How much history exists. The UI offers 7 / 30 / 90 day ranges, so the
 *  fixtures have to cover the longest of them - generating only 30 left the
 *  90-day view two-thirds empty, which read as a dead skill rather than as a
 *  fixture that stopped short. */
export const RUN_WINDOW_DAYS = 90;

/** The period a skill's `volume` describes, when it has been live throughout. */
const VOLUME_PERIOD_DAYS = 30;
const DAY = 86_400_000;

/**
 * The clock the whole Runs surface reads.
 *
 * Resolved once at module load and anchored to the top of the hour, for three
 * reasons: the server and the client agree on what "today" is, every selector
 * in a render pass shares one instant (so a filter and a chart can never
 * straddle a day boundary mid-render), and reading it during render stays pure.
 */
export const NOW: number = Math.floor(Date.now() / 3_600_000) * 3_600_000;

function anchorNow(): number {
  return NOW;
}

/** The steps THIS run walked. Required steps always; each optional step on its
 *  own coin-flip, so no two runs read alike - and a failure at a step this run
 *  never reached is impossible by construction. */
function planSteps(rand: () => number, shape: RunShape): typeof STEP_TEMPLATE {
  const allowed = new Set(SHAPE_STEPS[shape]);
  return STEP_TEMPLATE.filter((t) => allowed.has(t.id) && (!t.optional || rand() < 0.62));
}

function buildSteps(
  rand: () => number,
  plan: typeof STEP_TEMPLATE,
  shape: RunShape,
  skillId: string,
  state: RunState,
  email: SimEmail,
  failure?: (typeof FAILURES)[number],
): RunStep[] {
  // Shape first (what kind of skill), then the skill's own copy on top.
  const overrides = { ...(SHAPE_OVERRIDES[shape] ?? {}), ...(SKILL_OVERRIDES[skillId] ?? {}) };
  // The failure lands on its own step wherever that sits in THIS run's plan.
  const failIdx = failure ? plan.findIndex((t) => t.label === failure.step) : -1;
  const failAt = state === 'failed' ? (failIdx >= 0 ? failIdx : -1) : -1;

  return plan.map((t, i) => {
    const base = STEP_MS[STEP_TEMPLATE.indexOf(t)] ?? 400;
    // Wide jitter on purpose: a live run's cost varies with the payload and the
    // network, and a column of identical durations would be the tell that none
    // of this is real.
    const jitter = 0.55 + rand() * 1.1;
    const ms = Math.max(70, Math.round(base * jitter));
    const status: RunStepStatus =
      failAt < 0 ? 'done' : i < failAt ? 'done' : i === failAt ? 'failed' : 'skipped';
    const step: RunStep = { ...t, ...(overrides[t.id] ?? {}), status, ms };
    if (status === 'failed') {
      step.error = failure?.message;
      step.output = undefined;
    }
    if (status === 'skipped') step.output = undefined;
    if (t.kind === 'reply' && status === 'done') step.draft = email.draft ?? email.preview;
    return step;
  });
}

/** Draw an outcome from the skill's own mix. */
function pickState(rand: () => number, mix: OutcomeMix): RunState {
  const r = rand();
  if (r < mix.completed) return 'completed';
  if (r < mix.completed + mix.awaiting) return 'awaiting';
  if (r < mix.completed + mix.awaiting + mix.failed) return 'failed';
  return 'declined';
}

/** How a skill's runs turn out. Weights, not counts - the generator draws from
 *  them per run. One shape does not fit every skill: a skill that only tags can
 *  barely fail, and one that drafts replies collects approvals. */
export interface OutcomeMix {
  completed: number;
  awaiting: number;
  failed: number;
  declined: number;
}

/** A support skill that reads, looks things up and drafts a reply. */
const MIX_DEFAULT: OutcomeMix = { completed: 0.7, awaiting: 0.17, failed: 0.09, declined: 0.04 };

/** Which steps a skill is built from. `triage` is the tag-and-move-on shape:
 *  no external lookups, no reply, so nothing to approve and almost nothing to
 *  fail. */
export type RunShape = 'full' | 'triage';

const SHAPE_STEPS: Record<RunShape, string[]> = {
  full: ['t1', 's1', 's2', 's3', 's4', 's5', 't2', 's6', 's7'],
  triage: ['t1', 's1', 's2'],
};

/** A shape reuses the step slots but not their words. A tagging skill that
 *  reported "Summarize error" and an HTTP status would be the trace describing
 *  a different skill than the one it ran. */
const SHAPE_OVERRIDES: Partial<Record<RunShape, Record<string, Partial<RunStep>>>> = {
  triage: {
    t1: { text: 'Reading the message to work out what it is about and how urgent it is.' },
    s1: { label: 'Classify', output: 'topic: account access - urgency: normal' },
    s2: { output: 'account-access, support' },
  },
};

export interface SkillRunSource {
  skillId: string;
  skillName: string;
  /** The line under the name on the Skills list. */
  description: string;
  /** Lifecycle, as the list shows it. */
  status: 'active' | 'paused' | 'draft';
  /** Mailboxes this skill is live on. Empty = unassigned. */
  mailboxes: string[];
  /** Chat inboxes the skill is live on - the chat agent's twin of a mailbox. */
  chatInboxes?: string[];
  /** Roughly how many CHAT runs per 30 days, on top of `volume` (email). */
  chatVolume?: number;
  /** How its chat runs turn out, when that differs from email. */
  chatMix?: OutcomeMix;
  /** Mailboxes beyond the two chips the row has room for (the "+N"). */
  moreMailboxes?: number;
  /** Where the row's name links. */
  href: string;
  /** When the skill was last edited, as the list shows it. */
  lastUpdated: string;
  /** Roughly how many runs over the window (jittered per day). 0 = never run. */
  volume: number;
  /** How its runs turn out. Defaults to the support-skill mix. */
  mix?: OutcomeMix;
  /** Which steps it is built from. Defaults to the full shape. */
  shape?: RunShape;
  /** Live only for the last N days - a skill enabled recently has no history
   *  before it existed, and the activity strip should show that honestly. */
  liveForDays?: number;
  /** Stopped N days ago: no runs after that point. On a paused skill that is
   *  when it was paused; on an active one, it has simply gone quiet. */
  stoppedDaysAgo?: number;
  /** The skill as written, for its editor page: the trigger and its steps. */
  trigger: string;
  steps: string[];
}

/** Build one skill's run history. Pure and seeded: same source, same history. */
export function generateRuns(src: SkillRunSource): SkillRun[] {
  return [...generateEmailRuns(src), ...generateChatRuns(src)].sort(
    (a, b) => b.startedAt - a.startedAt,
  );
}

function generateEmailRuns(src: SkillRunSource): SkillRun[] {
  if (src.volume === 0 || src.mailboxes.length === 0) return [];
  const rand = rng(hash(src.skillId));
  const now = anchorNow();
  const mix = src.mix ?? MIX_DEFAULT;
  const allow = SKILL_EMAILS[src.skillId];
  const pool = allow
    ? [...RECENT_EMAILS, ...EXTRA_EMAILS].filter((e) => allow.includes(e.id))
    : RECENT_EMAILS;
  const shape = src.shape ?? 'full';
  const runs: SkillRun[] = [];

  // A skill only has history for the days it was actually live.
  const firstDay = src.liveForDays ?? RUN_WINDOW_DAYS;
  const lastDay = src.stoppedDaysAgo ?? 0;

  for (let day = RUN_WINDOW_DAYS - 1; day >= 0; day -= 1) {
    if (day >= firstDay || day < lastDay) continue;
    const dayStart = now - day * DAY;
    const date = new Date(dayStart);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    // Weekends run thinner - support volume follows the working week.
    // `volume` is runs per 30 days for a settled skill; for one that has only
    // been live a few days it is the total across those days. Dividing by the
    // 90-day generation window instead would silently thin every skill to a
    // third of its intended rate.
    const span = src.liveForDays ?? VOLUME_PERIOD_DAYS;
    const base = (src.volume / span) * (weekend ? 0.25 : 1.25);
    const count = Math.max(0, Math.round(base * (0.45 + rand() * 1.1)));

    for (let i = 0; i < count; i += 1) {
      const email = pool[Math.floor(rand() * pool.length)]!;
      const mailboxId = src.mailboxes[Math.floor(rand() * src.mailboxes.length)] ?? 'support';
      // Office hours, 9am - 7pm.
      const hour = 9 + Math.floor(rand() * 10);
      const startedAt =
        dayStart - (dayStart % DAY) + hour * 3_600_000 + Math.floor(rand() * 3_600_000);
      // A run that has not happened yet is not history.
      if (startedAt > now) continue;

      const plan = planSteps(rand, shape);
      let state = pickState(rand, mix);

      // A gated reply cannot still be pending past the approval window. Older
      // ones resolved: most were approved, some declined, a few timed out. The
      // surface must not show a 28-day-old "waiting" that could never exist.
      const ageDays = (now - startedAt) / DAY;
      if (state === 'awaiting' && ageDays > APPROVAL_EXPIRY_DAYS) {
        const r = rand();
        state = r < 0.66 ? 'completed' : r < 0.9 ? 'declined' : 'failed';
      }

      // A failure has to break at a step this run actually walked.
      const reachable = FAILURES.filter((f) => plan.some((t) => t.label === f.step));
      const expired =
        state === 'failed' && ageDays > APPROVAL_EXPIRY_DAYS && rand() < 0.2
          ? {
              step: 'Reply',
              code: 'APPROVAL_EXPIRED',
              message: `No one signed this reply off within ${APPROVAL_EXPIRY_DAYS} days, so the draft was discarded.`,
              atIdx: plan.length - 1,
            }
          : undefined;
      const failure =
        state === 'failed'
          ? (expired ?? reachable[Math.floor(rand() * reachable.length)] ?? FAILURES[0]!)
          : undefined;
      const steps = buildSteps(rand, plan, shape, src.skillId, state, email, failure);
      const durationMs = steps.filter((s) => s.status !== 'skipped').reduce((a, s) => a + s.ms, 0);

      const applied = steps
        .filter((s) => s.status === 'done' && CHIP_LABEL[s.id])
        .map((s) => CHIP_LABEL[s.id]!);
      const external = steps
        .filter((s) => s.status === 'done' && EXTERNAL_LABEL[s.id])
        .map((s) => EXTERNAL_LABEL[s.id]!);

      // A declined reply was drafted and turned down: the draft never sent, so
      // it is not an applied action.
      const appliedFinal =
        state === 'declined' ? applied.filter((a) => a !== 'Reply drafted') : applied;

      runs.push({
        id: `run_${src.skillId}_${runs.length + 1}`,
        skillId: src.skillId,
        skillName: src.skillName,
        conversationId: `c${(hash(`${src.skillId}${runs.length}`) % 900000) + 100000}`,
        subject: email.subject,
        sender: email.sender,
        senderEmail: SENDER_EMAIL[email.sender] ?? 'customer@example.com',
        channel: 'email',
        inboxId: mailboxId,
        state,
        startedAt,
        durationMs,
        steps,
        applied: appliedFinal,
        external,
        error: failure
          ? { step: failure.step, code: failure.code, message: failure.message }
          : undefined,
        assignee:
          state === 'awaiting' ? APPROVERS[Math.floor(rand() * APPROVERS.length)] : undefined,
      });
    }
  }

  return runs.sort((a, b) => b.startedAt - a.startedAt);
}

// --- Chat runs -------------------------------------------------------------
// A chat run is one skill run in one chat: the customer writes, the AI agent
// does its steps and replies, and that repeats until the chat ends. So a chat
// run is a short list of TURNS, each with its own steps, under one outcome.

interface ChatScript {
  turns: { customer: string; reply: string }[];
}

/** What the customers of each skill say in chat. Generic, swappable. */
const CHAT_SCRIPTS: Record<string, ChatScript[]> = {
  'api-error-triage': [
    {
      turns: [
        {
          customer:
            'Hi, every call to /v2/orders returns 404 since this morning. We are on SDK 1.2.1.',
          reply:
            'Thanks for flagging this. Could you share a request ID from one of the failed calls so I can trace it?',
        },
        {
          customer: 'Sure, req_8f21c. It worked fine yesterday.',
          reply:
            'Found it. In 1.2.1 the route moved to /v2/order. Updating the path fixes the 404s.',
        },
        {
          customer: 'Our mobile app is pinned to the old path. Can you keep both working?',
          reply:
            'I have raised it with engineering so they can look at keeping the old route. You will get an update here.',
        },
      ],
    },
    {
      turns: [
        {
          customer: 'Checkout API has been throwing 500s for about 20 minutes. Is something down?',
          reply:
            'Sorry about that. Which endpoint are you calling, and when did the first error come in?',
        },
        {
          customer: 'POST /v2/checkout, first one at 10:42.',
          reply:
            'Thanks. That matches an incident we are tracking, and a fix is rolling out now. I have added your account to it, so you get the update.',
        },
      ],
    },
    {
      turns: [
        {
          customer: 'I keep getting 429 too many requests when I sync customer records.',
          reply: 'That is the rate limit. How many requests do you send per minute during a sync?',
        },
        {
          customer: 'Around 900, all in one burst.',
          reply:
            'The limit is 600 a minute. Batching the sync, or adding a short backoff between calls, keeps you under it.',
        },
        {
          customer: 'Can the limit be raised for our plan?',
          reply:
            'A higher limit needs a quick review by the team. I have passed your request on, and they will reply here.',
        },
      ],
    },
  ],
  'refund-requests': [
    {
      turns: [
        {
          customer: 'I was charged twice for order #40182. Can I get one of them refunded?',
          reply:
            'Sorry about the double charge. Can you confirm the email on the order so I can find it?',
        },
        {
          customer: 'It is under olivia@fernhill.co.',
          reply:
            'Thanks, found it. The second charge of $129.00 is refunded to your card. It shows in 3 to 5 days.',
        },
      ],
    },
    {
      turns: [
        {
          customer: 'The jacket I ordered does not fit. Can I return it for a refund?',
          reply: 'Of course. Did the order arrive in the last 30 days?',
        },
        {
          customer: 'Yes, I got it last week.',
          reply:
            'Then it is inside the refund window. I have started the return, and the label comes by email.',
        },
      ],
    },
  ],
  'shipping-delays': [
    {
      turns: [
        {
          customer: 'My order was due Friday and the tracking has not moved in five days.',
          reply: 'Sorry for the wait. Could you share the order number?',
        },
        {
          customer: 'It is #55210.',
          reply:
            'Thanks. The parcel is stuck at the depot, so I have asked our ops team for a new delivery date. They will update you here.',
        },
      ],
    },
    {
      turns: [
        {
          customer: 'Where is my parcel? It is two weeks late now.',
          reply: 'I am sorry. What is the order number, so I can check the tracking?',
        },
        {
          customer: '#55871',
          reply:
            'It missed its slot and is now booked for tomorrow morning. I have flagged it, so the team keeps an eye on it.',
        },
      ],
    },
  ],
  'welcome-onboarding': [
    {
      turns: [
        {
          customer: 'We just signed up. How do I get the rest of my team in?',
          reply:
            'Welcome aboard! You can invite them from Settings, then Team. How many people are joining?',
        },
        {
          customer: 'About 12.',
          reply:
            'Your plan covers that. After they join, connect your inbox. The setup guide shows how.',
        },
      ],
    },
    {
      turns: [
        {
          customer: 'Hi, is there a guide for setting things up?',
          reply:
            'Hi and welcome! The setup guide covers inviting your team and connecting your inbox. Shall I send it here?',
        },
        {
          customer: 'Yes please.',
          reply: 'Here it is: Getting started with your workspace. Shout if anything is unclear.',
        },
      ],
    },
  ],
  'order-status': [
    {
      turns: [
        {
          customer: 'Hi, where is my order #61204?',
          reply:
            'It left our warehouse yesterday and is due on Thursday. Do you want the tracking link?',
        },
        {
          customer: 'Yes please.',
          reply: 'Here it is. It updates a few times a day, so you can follow it there.',
        },
      ],
    },
    {
      turns: [
        {
          customer: 'Has my order shipped yet?',
          reply: 'Happy to check. What is the order number, or the email you ordered with?',
        },
        {
          customer: 'mia.thompson@quillside.co',
          reply: 'Thanks. Your order is packed and ships today. The tracking link comes by email.',
        },
      ],
    },
    {
      turns: [
        {
          customer: 'I need to change the delivery address on my order.',
          reply: 'I can help with that. What is the order number?',
        },
        {
          customer: '#61877, I moved last week.',
          reply:
            'The order has not shipped yet, so the address can still change. What is the new address?',
        },
        {
          customer: '22 Harbour Lane, Leeds LS1 4AB.',
          reply:
            'Done. The order now goes to 22 Harbour Lane, and the tracking email will show it.',
        },
      ],
    },
  ],
};

const CHAT_SCRIPT_DEFAULT: ChatScript[] = [
  {
    turns: [
      {
        customer: 'Hi, I need some help with my account.',
        reply: 'Happy to help. What is going on?',
      },
      {
        customer: "I cannot see last week's invoices.",
        reply: 'Thanks. They are under Billing, then History. I have sent you a direct link too.',
      },
    ],
  },
];

/** Chat customers who gave their name. The rest are anonymous visitors. */
const CHAT_NAMES: [string, string][] = [
  ['Maya Robinson', 'maya@northwind.co'],
  ['Jordan Kim', 'jordan.kim@brightpath.io'],
  ['Priya Shah', 'priya@meridiansupply.com'],
  ['Derek Lane', 'derek.lane@larkstudio.com'],
  ['Olivia Brown', 'olivia@fernhill.co'],
  ['Ethan Clark', 'ethan@redwoodlabs.io'],
  ['Mia Thompson', 'mia.thompson@quillside.co'],
  ['Lucas Meyer', 'lucas@stonebridge.co'],
];

/** The name a chat widget gives a visitor who never said who they are. */
const HANDLE_A = ['winter', 'amber', 'quiet', 'silver', 'north', 'coral', 'maple', 'lunar'];
const HANDLE_B = ['voice', 'river', 'field', 'harbor', 'falcon', 'meadow', 'stone', 'cloud'];

/** What the customer sees when a step breaks mid-chat. Not the skill's words -
 *  the chat agent's fallback, which hands the chat to a person. */
export const CHAT_FALLBACK =
  'Sorry, I hit a problem on my side. I have passed this to a teammate, who will reply here shortly.';

/** What the customer sees while a gated action waits on a person. */
const CHAT_HOLDING =
  'I have asked the team to approve the next step. They will confirm here, and you will get an email too.';

/** A gated action in a live chat waits minutes, not days: the customer is
 *  still there. Older ones were decided or timed out to a teammate. */
const CHAT_APPROVAL_EXPIRY_DAYS = 2;

/** Split the plan across the turns, earlier turns taking the extra step. The
 *  thinking step that decides the reply always stays with its condition. */
function splitPlan<T extends { id: string }>(plan: T[], n: number): T[][] {
  const out: T[][] = [];
  let at = 0;
  for (let i = 0; i < n; i += 1) {
    const size = Math.ceil((plan.length - at) / (n - i));
    out.push(plan.slice(at, at + size));
    at += size;
  }
  for (let i = 0; i < out.length - 1; i += 1) {
    const chunk = out[i]!;
    if (chunk.length > 1 && chunk[chunk.length - 1]!.id === 't2') out[i + 1]!.unshift(chunk.pop()!);
  }
  return out;
}

/** The name a step goes by in the trace - kept in step with RunTrace. */
const stepTitle = (s: { kind: RunStepKind; label?: string }) =>
  s.kind === 'thinking' ? 'Reasoning' : s.kind === 'condition' ? 'Categorize' : (s.label ?? 'Step');

function generateChatRuns(src: SkillRunSource): SkillRun[] {
  const inboxes = src.chatInboxes ?? [];
  const volume = src.chatVolume ?? 0;
  if (volume === 0 || inboxes.length === 0) return [];
  // Its own seed, so adding chat never reshuffles a skill's email history.
  const rand = rng(hash(`${src.skillId}:chat`));
  const now = anchorNow();
  const mix = src.chatMix ?? src.mix ?? MIX_DEFAULT;
  const scripts = CHAT_SCRIPTS[src.skillId] ?? CHAT_SCRIPT_DEFAULT;
  const shape = src.shape ?? 'full';
  const overrides = { ...(SHAPE_OVERRIDES[shape] ?? {}), ...(SKILL_OVERRIDES[src.skillId] ?? {}) };
  const runs: SkillRun[] = [];
  const firstDay = src.liveForDays ?? RUN_WINDOW_DAYS;
  const lastDay = src.stoppedDaysAgo ?? 0;
  let owedWait = mix.awaiting > 0;

  for (let day = RUN_WINDOW_DAYS - 1; day >= 0; day -= 1) {
    if (day >= firstDay || day < lastDay) continue;
    const dayStart = now - day * DAY;
    const weekend = [0, 6].includes(new Date(dayStart).getDay());
    // Chat runs a little later into the evening than email, and keeps more of
    // its weekend - people use the widget when they are free.
    const span = src.liveForDays ?? VOLUME_PERIOD_DAYS;
    const base = (volume / span) * (weekend ? 0.5 : 1.15);
    const count = Math.max(0, Math.round(base * (0.45 + rand() * 1.1)));

    for (let i = 0; i < count; i += 1) {
      const hour = 8 + Math.floor(rand() * 13);
      const startedAt =
        dayStart - (dayStart % DAY) + hour * 3_600_000 + Math.floor(rand() * 3_600_000);
      if (startedAt > now) continue;
      const ageDays = (now - startedAt) / DAY;

      const script = scripts[Math.floor(rand() * scripts.length)]!;
      const inboxId = inboxes[Math.floor(rand() * inboxes.length)]!;
      const known = rand() < 0.62;
      const [name, email] = known
        ? CHAT_NAMES[Math.floor(rand() * CHAT_NAMES.length)]!
        : [
            `${HANDLE_A[Math.floor(rand() * HANDLE_A.length)]}-${HANDLE_B[Math.floor(rand() * HANDLE_B.length)]}-${100 + Math.floor(rand() * 900)}`,
            undefined,
          ];

      let state = pickState(rand, mix);
      if ((state === 'awaiting' || state === 'declined') && shape === 'triage') state = 'completed';
      if (state === 'awaiting' && ageDays > CHAT_APPROVAL_EXPIRY_DAYS)
        state = rand() < 0.75 ? 'completed' : 'declined';
      // A skill that gates actions shows at least one chat still waiting -
      // the state this surface most needs to show for chat.
      if (owedWait && ageDays <= CHAT_APPROVAL_EXPIRY_DAYS && shape !== 'triage') {
        if (state === 'completed') state = 'awaiting';
        if (state === 'awaiting') owedWait = false;
      }

      // The steps, as for email but without the single reply at the end: in a
      // chat every turn ends in its own reply.
      const plan = planSteps(rand, shape).filter((t) => t.kind !== 'reply');
      const gated = state === 'awaiting' || state === 'declined';
      if (gated && !plan.some((t) => t.id === 's5')) {
        const s5 = STEP_TEMPLATE.find((t) => t.id === 's5')!;
        const at = plan.findIndex((t) => t.id === 't2');
        plan.splice(at >= 0 ? at : plan.length, 0, s5);
      }
      const reachable = FAILURES.filter((f) =>
        plan.some((t) => (overrides[t.id]?.label ?? t.label) === f.step),
      );
      const failure =
        state === 'failed' ? reachable[Math.floor(rand() * reachable.length)] : undefined;
      if (state === 'failed' && !failure) state = 'completed';

      const chunks = splitPlan(plan, script.turns.length);
      // A completed chat can still stop short: the customer goes quiet after
      // one of the agent's questions.
      const leftAfter =
        state === 'completed' && script.turns.length > 1 && rand() < 0.16
          ? 1 + Math.floor(rand() * (script.turns.length - 1))
          : script.turns.length;

      const priorMessages = rand() < 0.3 ? 2 : 0;
      let at = startedAt;
      const turns: RunTurn[] = [];
      let ending: ChatEnding = 'closed';
      let stop = false;
      for (let k = 0; k < leftAfter && !stop; k += 1) {
        const id = `t${k + 1}`;
        if (k > 0) at += (45 + Math.floor(rand() * 150)) * 1000;
        const steps: RunStep[] = chunks[k]!.map((t) => {
          const step: RunStep = {
            ...t,
            ...(overrides[t.id] ?? {}),
            id: `${id}-${t.id}`,
            status: 'done',
            ms: Math.max(
              70,
              Math.round((STEP_MS[STEP_TEMPLATE.indexOf(t)] ?? 400) * (0.55 + rand() * 1.1)),
            ),
          };
          delete (step as { optional?: boolean }).optional;
          return step;
        });
        const turn: RunTurn = {
          id,
          at,
          message: script.turns[k]!.customer,
          steps,
          reply: script.turns[k]!.reply,
        };

        const failIdx = failure ? steps.findIndex((s) => s.label === failure.step) : -1;
        const heldIdx = gated ? steps.findIndex((s) => s.id.endsWith('-s5')) : -1;
        if (failIdx >= 0) {
          steps.forEach((s, j) => {
            if (j > failIdx) {
              s.status = 'skipped';
              s.output = undefined;
            }
          });
          steps[failIdx]!.status = 'failed';
          steps[failIdx]!.error = failure!.message;
          steps[failIdx]!.output = undefined;
          turn.reply = CHAT_FALLBACK;
          turn.fallback = true;
          ending = 'handedOff';
          stop = true;
        } else if (heldIdx >= 0) {
          steps[heldIdx]!.status = state === 'awaiting' ? 'held' : 'declined';
          steps[heldIdx]!.output = undefined;
          turn.reply = CHAT_HOLDING;
          stop = true;
        }
        steps.push({
          id: `${id}-reply`,
          kind: 'reply',
          iconKey: 'reply',
          label: 'Reply',
          suffix: turn.fallback ? 'fallback' : 'sent',
          status: turn.fallback ? 'skipped' : 'done',
          ms: Math.round(900 + rand() * 900),
        });
        turns.push(turn);
      }

      const notReached =
        leftAfter < script.turns.length
          ? chunks
              .slice(leftAfter)
              .flat()
              .filter((t) => t.kind !== 'thinking')
              .map((t) => stepTitle({ kind: t.kind, label: overrides[t.id]?.label ?? t.label }))
          : undefined;
      if (notReached) ending = 'left';

      const steps = turns.flatMap((t) => t.steps);
      const applied = steps
        .filter((s) => s.status === 'done' && CHIP_LABEL[s.id.split('-')[1]!] && s.kind !== 'reply')
        .map((s) => CHIP_LABEL[s.id.split('-')[1]!]!);
      const external = steps
        .filter((s) => s.status === 'done' && EXTERNAL_LABEL[s.id.split('-')[1]!])
        .map((s) => EXTERNAL_LABEL[s.id.split('-')[1]!]!);

      runs.push({
        id: `run_${src.skillId}_chat_${runs.length + 1}`,
        skillId: src.skillId,
        skillName: src.skillName,
        channel: 'chat',
        conversationId: `ch${(hash(`${src.skillId}chat${runs.length}`) % 900000) + 100000}`,
        sender: name,
        senderEmail: email,
        inboxId,
        turns,
        priorMessages: priorMessages || undefined,
        ending,
        notReached: notReached && notReached.length > 0 ? notReached : undefined,
        state,
        startedAt,
        durationMs: steps.filter((s) => s.status !== 'skipped').reduce((a, s) => a + s.ms, 0),
        steps,
        applied,
        external,
        error: failure
          ? { step: failure.step, code: failure.code, message: failure.message }
          : undefined,
        assignee: gated ? APPROVERS[Math.floor(rand() * APPROVERS.length)] : undefined,
      });
    }
  }
  return runs;
}

// --- The seeded skills -----------------------------------------------------
// Mirrors the Skills list rows. Generic across customers; the only per-skill
// content is a name and a volume.

export const RUN_SOURCES: SkillRunSource[] = [
  // The flagship: busy, and carrying both kinds of trouble - a connector that
  // needs reconnecting and replies nobody has signed off. Drives the
  // "2 things need attention" verdict.
  {
    skillId: 'api-error-triage',
    skillName: 'API error triage',
    description: 'Triages API error reports and drafts a fix',
    status: 'active',
    mailboxes: ['support', 'sales'],
    moreMailboxes: 9,
    href: '/api-example',
    chatInboxes: ['website', 'inapp'],
    chatVolume: 64,
    lastUpdated: 'Sep 17, 2026',
    volume: 148,
    trigger: 'When a customer reports an API error or a problem with the API.',
    steps: [
      'Summarize the error and tag the conversation.',
      'Create a bug task for engineering.',
      'Draft a reply with the fix or next step.',
    ],
  },

  // Healthy. Nothing failing, nothing waiting - the verdict reads "Running
  // normally". Declines are present on purpose: a person turning a draft down
  // is the skill working, not a problem, so it must not raise attention.
  {
    skillId: 'refund-requests',
    skillName: 'Refund requests',
    description: 'Checks order context before drafting refund replies',
    status: 'active',
    mailboxes: ['billing', 'refunds'],
    chatInboxes: ['website'],
    chatVolume: 30,
    chatMix: { completed: 1, awaiting: 0, failed: 0, declined: 0 },
    href: '/aops/seed/refund-requests',
    lastUpdated: 'Sep 15, 2026',
    volume: 76,
    mix: { completed: 0.88, awaiting: 0, failed: 0, declined: 0.12 },
    trigger: 'When a customer asks for a refund on an order.',
    steps: [
      'Look up the order and check it is inside the refund window.',
      'Draft a reply confirming the refund or explaining why not.',
    ],
  },

  // High volume, and the cleanest possible history: it only reads and tags, so
  // there is no connector to break and no reply to approve. Three of the four
  // outcome chips sit at zero.
  {
    skillId: 'inbound-tagging',
    skillName: 'Inbound tagging',
    description: 'Tags every inbound email by topic and urgency',
    status: 'active',
    mailboxes: ['support', 'sales'],
    moreMailboxes: 14,
    href: '/aops/seed/inbound-tagging',
    lastUpdated: 'Aug 30, 2026',
    volume: 412,
    shape: 'triage',
    mix: { completed: 1, awaiting: 0, failed: 0, declined: 0 },
    trigger: 'When any new email arrives.',
    steps: ['Classify the topic and urgency.', 'Tag the conversation.'],
  },

  // Low volume: a handful of runs across a month, so the activity strip is
  // mostly empty days. One kind of trouble only - approvals, no failures.
  {
    skillId: 'shipping-delays',
    skillName: 'Shipping delay escalations',
    description: 'Escalates late deliveries to the ops queue',
    status: 'active',
    mailboxes: ['support'],
    chatInboxes: ['helpcenter'],
    chatVolume: 10,
    href: '/aops/seed/shipping-delays',
    lastUpdated: 'Sep 9, 2026',
    volume: 16,
    mix: { completed: 0.62, awaiting: 0.3, failed: 0, declined: 0.08 },
    trigger: 'When a customer says a delivery is late or has not arrived.',
    steps: [
      'Pull the order and tracking details.',
      'Create a task in the ops queue.',
      'Draft a reply with the new delivery date.',
    ],
  },

  // Paused, with history. The runs stop dead six days ago, which is the whole
  // point - a paused skill is not a skill with no history.
  {
    skillId: 'feature-requests',
    skillName: 'Feature request routing',
    description: 'Logs feature requests to the product backlog',
    status: 'paused',
    mailboxes: ['support', 'marketing'],
    href: '/aops/seed/feature-requests',
    lastUpdated: 'Sep 12, 2026',
    volume: 54,
    stoppedDaysAgo: 6,
    mix: { completed: 0.82, awaiting: 0.04, failed: 0.1, declined: 0.04 },
    trigger: 'When a customer asks for a feature we do not have.',
    steps: ['Log the request on the product backlog.', 'Draft a reply thanking them.'],
  },

  // Chat only: live on two chat inboxes and no mailbox. Every run is a chat,
  // so nothing on its Runs page may assume an email.
  {
    skillId: 'order-status',
    skillName: 'Order status questions',
    description: 'Answers where-is-my-order chats and updates addresses',
    status: 'active',
    mailboxes: [],
    chatInboxes: ['website', 'helpcenter'],
    href: '/aops/seed/order-status',
    lastUpdated: 'Sep 24, 2026',
    volume: 0,
    chatVolume: 92,
    mix: { completed: 0.86, awaiting: 0.04, failed: 0.07, declined: 0.03 },
    trigger: 'When a customer asks where their order is, or wants to change its delivery address.',
    steps: ['Look up the order and its tracking.', 'Reply with the status, or update the address.'],
  },

  // Enabled four days ago: no history before it existed, so the left of the
  // strip is genuinely empty rather than a quiet stretch.
  {
    skillId: 'welcome-onboarding',
    skillName: 'Onboarding welcome',
    description: 'Welcomes new customers and shares setup docs',
    status: 'active',
    mailboxes: ['onboarding'],
    chatInboxes: ['inapp'],
    chatVolume: 18,
    href: '/aops/seed/welcome-onboarding',
    lastUpdated: 'Sep 18, 2026',
    volume: 26,
    liveForDays: 5,
    mix: { completed: 0.82, awaiting: 0.09, failed: 0, declined: 0.09 },
    trigger: 'When a new customer emails for the first time after signing up.',
    steps: ['Draft a welcome reply with the setup guide.'],
  },

  // Live, but nothing has matched its trigger yet. The honest empty state on
  // both surfaces: "No runs yet" on the list, and a verdict that says so.
  {
    skillId: 'contract-renewals',
    skillName: 'Contract renewal reminders',
    description: 'Flags renewals coming up in the next 30 days',
    status: 'active',
    mailboxes: ['success'],
    chatInboxes: ['website'],
    href: '/aops/seed/contract-renewals',
    lastUpdated: 'Sep 20, 2026',
    volume: 0,
    liveForDays: 3,
    trigger: 'When a customer asks about renewing their contract.',
    steps: ['Pull the contract and renewal date.', 'Draft a reply with the renewal quote.'],
  },

  // Live, busy until nine days ago, then nothing: still switched on, but no
  // email has matched since. The quiet that should make someone look.
  {
    skillId: 'invoice-disputes',
    skillName: 'Invoice disputes',
    description: 'Pulls the invoice and drafts a reply to billing disputes',
    status: 'active',
    mailboxes: ['billing'],
    href: '/aops/seed/invoice-disputes',
    lastUpdated: 'Aug 28, 2026',
    volume: 38,
    stoppedDaysAgo: 9,
    mix: { completed: 0.8, awaiting: 0.12, failed: 0.04, declined: 0.04 },
    trigger: 'When a customer disputes a charge on their invoice.',
    steps: [
      'Pull the invoice and the charge in question.',
      'Draft a reply explaining the charge or confirming a credit.',
    ],
  },

  // Never enabled and unassigned - it has no mailbox to run in.
  {
    skillId: 'nps-followups',
    skillName: 'NPS follow-ups',
    description: 'Follows up on low scores with an apology and a call offer',
    status: 'draft',
    mailboxes: [],
    href: '/aops/seed/nps-followups',
    lastUpdated: 'Sep 19, 2026',
    volume: 0,
    trigger: 'When a customer leaves a low NPS score.',
    steps: ['Draft an apology and offer a call.'],
  },
];

// Generation is deterministic but not free, and the list calls it once per row
// on every render. Cached per skill for the life of the module.
const RUN_CACHE = new Map<string, SkillRun[]>();

export function runsForSkill(skillId: string): SkillRun[] {
  const hit = RUN_CACHE.get(skillId);
  if (hit) return hit;
  const src = RUN_SOURCES.find((s) => s.skillId === skillId);
  const out = src ? generateRuns(src) : [];
  RUN_CACHE.set(skillId, out);
  return out;
}

/** When a seeded skill went live and, if paused, when it stopped. Read off
 *  the skill's own generated runs - the first one, the last one - so the chart's
 *  shading meets the history exactly in any timezone, and on the same clock
 *  (NOW) as the history. Client-side only: NOW is the browser's. A skill with
 *  no runs falls back to the span it was configured with. */
export function liveSpan(skillId: string): { liveSince?: number; pausedAt?: number } {
  const src = RUN_SOURCES.find((s) => s.skillId === skillId);
  if (!src || src.status === 'draft') return {};
  const runs = runsForSkill(skillId); // newest first
  const dayAgo = (d: number) => {
    const t = new Date(NOW - d * DAY);
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  };
  let liveSince: number | undefined;
  if (src.liveForDays) {
    liveSince =
      runs.length > 0
        ? runs[runs.length - 1]!.startedAt
        : dayAgo(src.liveForDays - 1) + 10 * 3_600_000;
  }
  let pausedAt: number | undefined;
  if (src.status === 'paused' && src.stoppedDaysAgo) {
    pausedAt =
      runs.length > 0
        ? Math.min(NOW, runs[0]!.startedAt + 3_600_000)
        : dayAgo(src.stoppedDaysAgo - 1) + 9 * 3_600_000;
  }
  return { liveSince, pausedAt };
}

/** The chat inboxes a seeded skill is live on. The editor's document only
 *  holds mailboxes - enabling on chat is not built in the prototype - so the
 *  seeds carry this for the Runs surfaces. */
export function chatInboxesFor(skillId: string): string[] {
  return RUN_SOURCES.find((s) => s.skillId === skillId)?.chatInboxes ?? [];
}

/** Every run across every skill, newest first. */
export function allRuns(): SkillRun[] {
  return RUN_SOURCES.flatMap((s) => runsForSkill(s.skillId)).sort(
    (a, b) => b.startedAt - a.startedAt,
  );
}

/** Runs in the last N days - what the Skills list column counts. */
export function runsInLastDays(skillId: string, days: number): SkillRun[] {
  const cutoff = NOW - days * DAY;
  return runsForSkill(skillId).filter((r) => r.startedAt >= cutoff);
}
