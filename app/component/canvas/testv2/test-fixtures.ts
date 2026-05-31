import type { Playbook, TraceEntry } from '../data';

/* ============================================================ */
/* Types                                                          */
/* ============================================================ */

export interface CustomInput {
  from: string;
  subject: string;
  body: string;
  labels: string[];
  attrs: Record<string, string>;
  priorThread: Array<{ from: string; at: number; body: string }>;
}

export interface PastInput {
  threadId: string;
}

export interface Scenario {
  id: string;
  name: string;
  mode: 'custom' | 'past';
  input: CustomInput | PastInput;
  createdAt: number;
  updatedAt: number;
}

export interface Run {
  id: string;
  scenarioId: string;
  startedAt: number;
  endedAt: number;
  outcome: 'pass' | 'fail' | 'cancelled';
  versionHash: string;
  trace: TraceEntry[];
  variables: Record<string, unknown>;
  branchPath: string[];
}

export interface FixtureThread {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  body: string;
  labels: string[];
  at: number;
}

/* ============================================================ */
/* Content-hash util                                              */
/* ============================================================ */

function canonicalize(pb: Playbook): string {
  return JSON.stringify(pb, Object.keys(pb).sort());
}

/** Cheap synchronous hash. Not cryptographic; just stable. 7-char hex. */
export function versionHash(pb: Playbook): string {
  const s = canonicalize(pb);
  let h1 = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h1 ^= s.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  let h2 = 0xdeadbeef;
  for (let i = s.length - 1; i >= 0; i--) {
    h2 ^= s.charCodeAt(i);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const combined = (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
  return combined.slice(0, 7);
}

/* ============================================================ */
/* Fixture mailbox (Walk Japan, ~10 threads)                      */
/* ============================================================ */

const DAY = 86400000;
const NOW = Date.UTC(2026, 4, 24);

export const FIXTURE_MAILBOX: FixtureThread[] = [
  {
    id: 'th-001',
    from: 'alice.chen@gmail.com',
    fromName: 'Alice Chen',
    subject: 'Question about Nakasendo tour',
    body: 'Hi, my husband and I are interested in your Nakasendo tour for next April. Do you have availability for 2 people? We are reasonably fit but new to long walking trips, so wondering about the difficulty.',
    labels: ['tour-enquiry', 'nakasendo'],
    at: NOW - 2 * DAY,
  },
  {
    id: 'th-002',
    from: 'mark.evans@protonmail.com',
    fromName: 'Mark Evans',
    subject: 'Group of 12 - dietary needs',
    body: 'Hello, we are a group of 12 friends planning a Japan walking trip in October. Two of us are vegetarian and one is gluten-free. Can your tours accommodate this? Looking at the Kumano Kodo.',
    labels: ['tour-enquiry', 'kumano-kodo', 'group'],
    at: NOW - 4 * DAY,
  },
  {
    id: 'th-003',
    from: 'sophie.larsen@gmail.com',
    fromName: 'Sophie Larsen',
    subject: 'Nakasendo May 2027 - is it still available?',
    body: 'I noticed your Nakasendo tour for the second week of May 2027 was open last month but now shows sold out on the website. Is there any chance of openings? My family of 4 is very keen.',
    labels: ['tour-enquiry', 'nakasendo', 'sold-out'],
    at: NOW - 6 * DAY,
  },
  {
    id: 'th-004',
    from: 'james.osei@outlook.com',
    fromName: 'James Osei',
    subject: 'Solo traveler - Kumano Kodo difficulty',
    body: 'Hi team, traveling solo and looking at Kumano Kodo. I have done some hiking but nothing multi-day with packs. Is the 5-day option realistic for someone like me?',
    labels: ['tour-enquiry', 'kumano-kodo', 'solo'],
    at: NOW - 8 * DAY,
  },
  {
    id: 'th-005',
    from: 'rachel.kim@gmail.com',
    fromName: 'Rachel Kim',
    subject: 'Re: Booking confirmation #WJ-2871',
    body: 'Thanks for the confirmation. One more question - do you provide bear bells, or should we bring our own? Also is there laundry along the route?',
    labels: ['follow-up', 'kumano-kodo', 'logistics'],
    at: NOW - 10 * DAY,
  },
  {
    id: 'th-006',
    from: 'tom.harris@yahoo.com',
    fromName: 'Tom Harris',
    subject: 'Cancellation policy question',
    body: 'My wife has been advised by her doctor not to fly. We booked the Nakasendo tour for October. What is your cancellation policy, and is travel insurance acceptable proof?',
    labels: ['cancellation', 'nakasendo'],
    at: NOW - 12 * DAY,
  },
  {
    id: 'th-007',
    from: 'priya.sharma@hcl.com',
    fromName: 'Priya Sharma',
    subject: 'Corporate retreat - 25 people',
    body: 'Looking to book a corporate walking retreat for ~25 people over 4 nights. Mix of fitness levels. Open to dates in Sept or Oct. Can you share a quote?',
    labels: ['tour-enquiry', 'group', 'corporate'],
    at: NOW - 14 * DAY,
  },
  {
    id: 'th-008',
    from: 'liu.wei@163.com',
    fromName: 'Liu Wei',
    subject: 'Photography tour option?',
    body: 'Do you offer photography-focused tours? My partner and I are landscape photographers and would value more time at viewpoints than the standard pace.',
    labels: ['tour-enquiry', 'photography', 'specialist'],
    at: NOW - 16 * DAY,
  },
  {
    id: 'th-009',
    from: 'megan.wright@gmail.com',
    fromName: 'Megan Wright',
    subject: 'Refund request - Kumano Kodo April',
    body: 'Unfortunately due to a family emergency we need to cancel the April Kumano Kodo tour for 2 people. The booking reference is WJ-2843. Please advise on refund process.',
    labels: ['cancellation', 'kumano-kodo', 'refund'],
    at: NOW - 18 * DAY,
  },
  {
    id: 'th-010',
    from: 'noaa.kawasaki@gmail.com',
    fromName: 'Noaa Kawasaki',
    subject: 'Returning customer - new tour dates?',
    body: 'We did the Nakasendo with you in 2024 and loved it. Looking for something new for 2026 - any tours we have not done? Open to anything 5-8 nights.',
    labels: ['returning-customer', 'tour-enquiry'],
    at: NOW - 20 * DAY,
  },
];

export function findThread(id: string): FixtureThread | undefined {
  return FIXTURE_MAILBOX.find((t) => t.id === id);
}

/* ============================================================ */
/* Seed scenarios (3 for Walk Japan)                              */
/* ============================================================ */

const NOW_TS = NOW;

export const SEED_SCENARIOS: Scenario[] = [
  {
    id: 'sc-default',
    name: 'Default tour enquiry',
    mode: 'custom',
    createdAt: NOW_TS - 30 * DAY,
    updatedAt: NOW_TS - 30 * DAY,
    input: {
      from: 'alice.chen@gmail.com',
      subject: 'Question about Nakasendo tour',
      body: 'Hi, my husband and I are interested in your Nakasendo tour for next April. Do you have availability for 2 people? We are reasonably fit but new to long walking trips.',
      labels: ['tour-enquiry'],
      attrs: { tour: 'Nakasendo', party_size: '2' },
      priorThread: [],
    } satisfies CustomInput,
  },
  {
    id: 'sc-group-dietary',
    name: 'Group of 12 with dietary needs',
    mode: 'custom',
    createdAt: NOW_TS - 14 * DAY,
    updatedAt: NOW_TS - 14 * DAY,
    input: {
      from: 'mark.evans@protonmail.com',
      subject: 'Group of 12 - dietary needs',
      body: 'Hello, we are a group of 12 friends planning a Japan walking trip in October. Two of us are vegetarian and one is gluten-free. Can your tours accommodate this? Looking at the Kumano Kodo.',
      labels: ['tour-enquiry', 'group'],
      attrs: { tour: 'Kumano Kodo', party_size: '12', dietary: 'vegetarian, gluten-free' },
      priorThread: [],
    } satisfies CustomInput,
  },
  {
    id: 'sc-sold-out',
    name: 'Date conflict (tour sold out)',
    mode: 'past',
    createdAt: NOW_TS - 6 * DAY,
    updatedAt: NOW_TS - 6 * DAY,
    input: { threadId: 'th-003' } satisfies PastInput,
  },
];

/* ============================================================ */
/* Mocked outcome history (for History tab + diff demo)           */
/* ============================================================ */

/** Returns a frozen-style timestamp N hours ago, deterministic per offset. */
function ago(hours: number): number { return NOW_TS - hours * 3600 * 1000; }

export function buildSeedRuns(versionA: string, versionB: string): Record<string, Run[]> {
  return {
    'sc-default': [
      {
        id: 'run-default-1',
        scenarioId: 'sc-default',
        startedAt: ago(72),
        endedAt: ago(72) + 1340,
        outcome: 'pass',
        versionHash: versionB,
        trace: [],
        variables: {},
        branchPath: ['cond-availability:yes'],
      },
      {
        id: 'run-default-2',
        scenarioId: 'sc-default',
        startedAt: ago(2),
        endedAt: ago(2) + 980,
        outcome: 'pass',
        versionHash: versionA,
        trace: [],
        variables: {},
        branchPath: ['cond-availability:yes'],
      },
    ],
    'sc-group-dietary': [
      {
        id: 'run-dietary-1',
        scenarioId: 'sc-group-dietary',
        startedAt: ago(48),
        endedAt: ago(48) + 1620,
        outcome: 'pass',
        versionHash: versionB,
        trace: [],
        variables: {},
        branchPath: ['cond-availability:yes', 'cond-dietary:yes'],
      },
    ],
    'sc-sold-out': [
      {
        id: 'run-soldout-1',
        scenarioId: 'sc-sold-out',
        startedAt: ago(24),
        endedAt: ago(24) + 1410,
        outcome: 'fail',
        versionHash: versionB,
        trace: [],
        variables: {},
        branchPath: ['cond-availability:no'],
      },
    ],
  };
}

/* ============================================================ */
/* localStorage key                                                */
/* ============================================================ */

export const TESTV2_STORAGE_KEY = 'hiver.playbooks.walkjapan.v1.testv2';

export interface TestV2Store {
  scenarios: Scenario[];
  activeScenarioId: string | null;
  runs: Record<string, Run[]>;
}

export const RUNS_PER_SCENARIO_CAP = 50;
