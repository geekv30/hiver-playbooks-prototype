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


// --- Model ------------------------------------------------------------------

/** How a run ended. Every run ends in exactly one of these.
 *  `attention` (trigger fired, nothing matched) is deliberately absent: that is
 *  an Evaluation signal, not a run. Runs record what the skill DID. */
export type RunState = 'completed' | 'awaiting' | 'failed' | 'declined';

/** Step kinds, aligned with the Evaluation trace so one vocabulary covers both. */
export type RunStepKind = 'thinking' | 'action' | 'condition' | 'reply';

export type RunStepStatus = 'done' | 'failed' | 'skipped';

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

export interface SkillRun {
  id: string;
  skillId: string;
  skillName: string;
  /** The conversation this ran on. */
  conversationId: string;
  subject: string;
  sender: string;
  senderEmail: string;
  mailboxId: string;
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
  /** The skill revision this ran on. Pinned, so an old run still makes sense
   *  after the skill is edited. */
  revision: number;
}

/** A point where the skill definition changed. Rendered between runs so a
 *  change in behavior has a visible cause. */
export interface RevisionMark {
  revision: number;
  at: number;
  /** One short sentence: what changed. */
  summary: string;
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
  { id: 's1', kind: 'action', iconKey: 'extract', label: 'Extract details', output: 'customer, order reference, and what they asked for' },
  { id: 's2', kind: 'action', iconKey: 'tag', label: 'Tag', output: 'needs-reply, support' },
  { id: 's3', kind: 'action', iconKey: 'contact', label: 'Get contact', output: 'John Doe - hiverhq.com', optional: true },
  { id: 's4', kind: 'action', iconKey: 'kb', label: 'Search Knowledge Hub', output: '1 matching article', optional: true },
  { id: 's5', kind: 'action', iconKey: 'clickup', label: 'Create task', output: 'OPS-2213 - Support / Escalations', optional: true },
  { id: 't2', kind: 'thinking', text: 'Deciding which reply fits this case.' },
  { id: 's6', kind: 'condition', condType: 'if', branch: 'the request matches a known case' },
  { id: 's7', kind: 'reply', iconKey: 'reply', label: 'Reply', suffix: 'draft' },
];

/** Per-skill step copy. The template above is written to fit ANY support skill
 *  (see feedback-reusability-principle); a skill whose steps are worth naming
 *  precisely overrides them here rather than the template being about one case
 *  and wrong for the other seven. */
const SKILL_OVERRIDES: Record<string, Record<string, Partial<RunStep>>> = {
  'api-error-triage': {
    t1: { text: 'Checking the conversation to confirm the sender and pull the error details before acting.' },
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
    s1: { label: 'Extract order details', output: 'order #55210, 9 days late, no tracking movement' },
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
  /** Stopped N days ago (a paused skill): no runs after that point. */
  stoppedDaysAgo?: number;
  /** When the skill definition changed, as days ago. */
  revisions?: { daysAgo: number; summary: string }[];
}

/** Build one skill's run history. Pure and seeded: same source, same history. */
export function generateRuns(src: SkillRunSource): SkillRun[] {
  if (src.volume === 0 || src.mailboxes.length === 0) return [];
  const rand = rng(hash(src.skillId));
  const now = anchorNow();
  const revs = [...(src.revisions ?? [])].sort((a, b) => b.daysAgo - a.daysAgo);
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
      const startedAt = dayStart - (dayStart % DAY) + hour * 3_600_000 + Math.floor(rand() * 3_600_000);
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
      const durationMs = steps
        .filter((s) => s.status !== 'skipped')
        .reduce((a, s) => a + s.ms, 0);

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

      const daysAgo = (now - startedAt) / DAY;
      const revision =
        revs.findIndex((r) => daysAgo >= r.daysAgo) === -1
          ? revs.length + 1
          : revs.length - revs.findIndex((r) => daysAgo >= r.daysAgo);

      runs.push({
        id: `run_${src.skillId}_${runs.length + 1}`,
        skillId: src.skillId,
        skillName: src.skillName,
        conversationId: `c${(hash(`${src.skillId}${runs.length}`) % 900000) + 100000}`,
        subject: email.subject,
        sender: email.sender,
        senderEmail: SENDER_EMAIL[email.sender] ?? 'customer@example.com',
        mailboxId,
        state,
        startedAt,
        durationMs,
        steps,
        applied: appliedFinal,
        external,
        error: failure
          ? { step: failure.step, code: failure.code, message: failure.message }
          : undefined,
        assignee: state === 'awaiting' ? APPROVERS[Math.floor(rand() * APPROVERS.length)] : undefined,
        revision,
      });
    }
  }

  return runs.sort((a, b) => b.startedAt - a.startedAt);
}

/** The revision marks for a skill, as absolute timestamps. */
export function revisionMarks(src: SkillRunSource): RevisionMark[] {
  const now = anchorNow();
  const revs = [...(src.revisions ?? [])].sort((a, b) => b.daysAgo - a.daysAgo);
  return revs.map((r, i) => ({
    revision: revs.length - i + 1,
    at: now - r.daysAgo * DAY,
    summary: r.summary,
  }));
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
    lastUpdated: 'Sep 17, 2026',
    volume: 148,
    revisions: [
      { daysAgo: 12, summary: 'Reply step changed from send to draft' },
      { daysAgo: 4, summary: 'Added a ClickUp task step' },
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
    href: '/canvas',
    lastUpdated: 'Sep 15, 2026',
    volume: 76,
    mix: { completed: 0.88, awaiting: 0, failed: 0, declined: 0.12 },
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
    href: '/canvas',
    lastUpdated: 'Aug 30, 2026',
    volume: 412,
    shape: 'triage',
    mix: { completed: 1, awaiting: 0, failed: 0, declined: 0 },
  },

  // Low volume: a handful of runs across a month, so the activity strip is
  // mostly empty days. One kind of trouble only - approvals, no failures.
  {
    skillId: 'shipping-delays',
    skillName: 'Shipping delay escalations',
    description: 'Escalates late deliveries to the ops queue',
    status: 'active',
    mailboxes: ['support'],
    href: '/canvas',
    lastUpdated: 'Sep 9, 2026',
    volume: 16,
    mix: { completed: 0.62, awaiting: 0.3, failed: 0, declined: 0.08 },
  },

  // Paused, with history. The runs stop dead six days ago, which is the whole
  // point - a paused skill is not a skill with no history.
  {
    skillId: 'feature-requests',
    skillName: 'Feature request routing',
    description: 'Logs feature requests to the product backlog',
    status: 'paused',
    mailboxes: ['support', 'marketing'],
    href: '/canvas',
    lastUpdated: 'Sep 12, 2026',
    volume: 54,
    stoppedDaysAgo: 6,
    mix: { completed: 0.82, awaiting: 0.04, failed: 0.1, declined: 0.04 },
  },

  // Enabled four days ago: no history before it existed, so the left of the
  // strip is genuinely empty rather than a quiet stretch.
  {
    skillId: 'welcome-onboarding',
    skillName: 'Onboarding welcome',
    description: 'Welcomes new customers and shares setup docs',
    status: 'active',
    mailboxes: ['onboarding'],
    href: '/canvas',
    lastUpdated: 'Sep 18, 2026',
    volume: 26,
    liveForDays: 5,
    mix: { completed: 0.82, awaiting: 0.09, failed: 0, declined: 0.09 },
  },

  // Live, but nothing has matched its trigger yet. The honest empty state on
  // both surfaces: "No runs yet" on the list, and a verdict that says so.
  {
    skillId: 'contract-renewals',
    skillName: 'Contract renewal reminders',
    description: 'Flags renewals coming up in the next 30 days',
    status: 'active',
    mailboxes: ['success'],
    href: '/canvas',
    lastUpdated: 'Sep 20, 2026',
    volume: 0,
  },

  // Never enabled and unassigned - it has no mailbox to run in.
  {
    skillId: 'nps-followups',
    skillName: 'NPS follow-ups',
    description: 'Follows up on low scores with an apology and a call offer',
    status: 'draft',
    mailboxes: [],
    href: '/connector-setup',
    lastUpdated: 'Sep 19, 2026',
    volume: 0,
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

export function sourceFor(skillId: string): SkillRunSource | undefined {
  return RUN_SOURCES.find((s) => s.skillId === skillId);
}
