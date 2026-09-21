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
    text: "Checking the conversation to confirm the sender and pull the error details before acting.",
  },
  { id: 's1', kind: 'action', iconKey: 'extract', label: 'Summarize error', output: 'summary: 404, not found, 11:34, v1.2.1, southern-S3' },
  { id: 's2', kind: 'action', iconKey: 'tag', label: 'Tag', output: 'api-error, support' },
  { id: 's3', kind: 'action', iconKey: 'contact', label: 'Get contact', output: 'John Doe - hiverhq.com', optional: true },
  { id: 's4', kind: 'action', iconKey: 'kb', label: 'Search Knowledge Hub', output: 'returned: 200 OK', optional: true },
  { id: 's5', kind: 'action', iconKey: 'clickup', label: 'Create task', output: 'ENG-4471 - Engineering / Bugs', optional: true },
  { id: 't2', kind: 'thinking', text: 'Categorizing the error to choose the right reply.' },
  { id: 's6', kind: 'condition', condType: 'if', branch: 'the error is a 4xx client error' },
  { id: 's7', kind: 'reply', iconKey: 'reply', label: 'Reply', suffix: 'draft' },
];

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

/** The window every count and chart is computed over. Fixed at 30 days in v1. */
export const RUN_WINDOW_DAYS = 30;
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
function planSteps(rand: () => number): typeof STEP_TEMPLATE {
  return STEP_TEMPLATE.filter((t) => !t.optional || rand() < 0.62);
}

function buildSteps(
  rand: () => number,
  plan: typeof STEP_TEMPLATE,
  state: RunState,
  email: SimEmail,
  failure?: (typeof FAILURES)[number],
): RunStep[] {
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
    const step: RunStep = { ...t, status, ms };
    if (status === 'failed') {
      step.error = failure?.message;
      step.output = undefined;
    }
    if (status === 'skipped') step.output = undefined;
    if (t.kind === 'reply' && status === 'done') step.draft = email.draft ?? email.preview;
    return step;
  });
}

/** The outcome mix. Weighted so a healthy skill reads as mostly completed, with
 *  enough of the other states that every surface has something to show. */
function pickState(rand: () => number): RunState {
  const r = rand();
  if (r < 0.7) return 'completed';
  if (r < 0.87) return 'awaiting';
  if (r < 0.96) return 'failed';
  return 'declined';
}

export interface SkillRunSource {
  skillId: string;
  skillName: string;
  /** Mailboxes this skill is live on. */
  mailboxes: string[];
  /** Roughly how many runs over the window (jittered per day). */
  volume: number;
  /** When the skill definition changed, as days ago. */
  revisions?: { daysAgo: number; summary: string }[];
}

/** Build one skill's run history. Pure and seeded: same source, same history. */
export function generateRuns(src: SkillRunSource): SkillRun[] {
  const rand = rng(hash(src.skillId));
  const now = anchorNow();
  const revs = [...(src.revisions ?? [])].sort((a, b) => b.daysAgo - a.daysAgo);
  const runs: SkillRun[] = [];

  for (let day = RUN_WINDOW_DAYS - 1; day >= 0; day -= 1) {
    const dayStart = now - day * DAY;
    const date = new Date(dayStart);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    // Weekends run thinner - support volume follows the working week.
    const base = (src.volume / RUN_WINDOW_DAYS) * (weekend ? 0.25 : 1.25);
    const count = Math.max(0, Math.round(base * (0.45 + rand() * 1.1)));

    for (let i = 0; i < count; i += 1) {
      const email = RECENT_EMAILS[Math.floor(rand() * RECENT_EMAILS.length)]!;
      const mailboxId = src.mailboxes[Math.floor(rand() * src.mailboxes.length)] ?? 'support';
      // Office hours, 9am - 7pm.
      const hour = 9 + Math.floor(rand() * 10);
      const startedAt = dayStart - (dayStart % DAY) + hour * 3_600_000 + Math.floor(rand() * 3_600_000);
      // A run that has not happened yet is not history.
      if (startedAt > now) continue;

      const plan = planSteps(rand);
      let state = pickState(rand);

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
      const steps = buildSteps(rand, plan, state, email, failure);
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
  {
    skillId: 'api-error-triage',
    skillName: 'API error triage',
    mailboxes: ['support', 'sales'],
    volume: 148,
    revisions: [
      { daysAgo: 12, summary: 'Reply step changed from send to draft' },
      { daysAgo: 4, summary: 'Added a ClickUp task step' },
    ],
  },
  {
    skillId: 'refund-handling',
    skillName: 'Refund handling',
    mailboxes: ['billing'],
    volume: 61,
    revisions: [{ daysAgo: 7, summary: 'Trigger narrowed to refund requests only' }],
  },
];

/** Every run across every skill, newest first. */
export function allRuns(): SkillRun[] {
  return RUN_SOURCES.flatMap(generateRuns).sort((a, b) => b.startedAt - a.startedAt);
}

export function runsForSkill(skillId: string): SkillRun[] {
  const src = RUN_SOURCES.find((s) => s.skillId === skillId);
  return src ? generateRuns(src) : [];
}

export function sourceFor(skillId: string): SkillRunSource | undefined {
  return RUN_SOURCES.find((s) => s.skillId === skillId);
}
