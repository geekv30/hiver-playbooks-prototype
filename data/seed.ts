import type { Playbook, Step, Fragment, Chip, ConditionBranch } from '@/types/playbook';
import { DEFAULT_REFS } from './refs';
import { defaultConnectorIds } from './connectors';

// ---------------------------------------------------------------------------
// Helpers — deterministic ids so localStorage round-trips stay stable
// ---------------------------------------------------------------------------

function chip(id: string, actionId: string, status: Chip['status'] = 'ok'): Chip {
  return { id, actionId, status, config: {} };
}

const T = (text: string): Fragment => ({ kind: 'text', text });
const C = (id: string, actionId: string): Fragment => ({ kind: 'chip', chip: chip(id, actionId) });
const R = (refPath: string): Fragment => ({ kind: 'ref', refPath });
const K = (code: string): Fragment => ({ kind: 'code', code });

// ---------------------------------------------------------------------------
// Condition branches for step-05
// ---------------------------------------------------------------------------

const conditionBranches: ConditionBranch[] = [
  {
    id: 'br-if',
    tag: 'if',
    exprFragments: [
      R('bookings.available'),
      T(' == '),
      K('"yes"'),
    ],
    bodyFragments: [
      T('Draft a warm reply '),
      C('chip-draft-reply-if', 'draft_reply'),
      T(' with availability, fitness/dietary notes pulled from the right articles, the help-center links, and an invitation to hold the dates.'),
    ],
  },
  {
    id: 'br-else',
    tag: 'else',
    exprFragments: [
      T('not available'),
    ],
    bodyFragments: [
      T('Draft a “sorry it is not open then, here is what is similar” reply '),
      C('chip-draft-reply-else', 'draft_reply'),
      T(' with two alternative dates or two similar tours, again with help-center links.'),
    ],
  },
];

// ---------------------------------------------------------------------------
// Steps — ported verbatim from canvas SOLVED (lines 826-889)
// ---------------------------------------------------------------------------

const steps: Step[] = [
  // Step 01 - AI Extract
  {
    kind: 'action',
    id: 'step-01',
    fragments: [
      T('First, read the email and tell me in one line: which tour they are asking about, what dates, group size, and any special concerns (fitness, dietary, accessibility) '),
      C('chip-ai-extract-01', 'ai_extract'),
      T('.'),
    ],
  },

  // Step 02 - HTTP GET bookings sheet
  {
    kind: 'action',
    id: 'step-02',
    fragments: [
      T('Look up the tour and dates in our bookings sheet '),
      C('chip-http-02', 'http'),
      T(' — tell me if those dates are available, partially available, or full.'),
    ],
  },

  // Step 03 - HubSpot Get contact
  {
    kind: 'action',
    id: 'step-03',
    fragments: [
      T('Then look up the customer in HubSpot '),
      C('chip-hubspot-03', 'hubspot_get_contact'),
      T(' — are they a repeat guest, new, or have they enquired before?'),
    ],
  },

  // Step 04 - Search knowledge
  {
    kind: 'action',
    id: 'step-04',
    fragments: [
      T('Search our help center '),
      C('chip-kb-search-04', 'kb_search'),
      T(' for the tour overview article, the fitness-level guide, and the dietary FAQ. Have those handy.'),
    ],
  },

  // Step 05 - Condition (2 branches: if/else on bookings.available)
  {
    kind: 'condition',
    id: 'step-05',
    exprFragments: [
      T('now check '),
      R('bookings.available'),
    ],
    meta: '2 branches',
    branches: conditionBranches,
  },

  // Step 06 - Tag
  {
    kind: 'action',
    id: 'step-06',
    fragments: [
      T('Tag the ticket '),
      C('chip-tag-06', 'tag'),
      T(' so we can track interest per tour.'),
    ],
  },

  // Step 07 - Note
  {
    kind: 'action',
    id: 'step-07',
    fragments: [
      T('Leave a private note '),
      C('chip-note-07', 'note'),
      T(' so the person sending the reply has the full picture without re-reading the thread.'),
    ],
  },

  // Step 08 - HTTP POST Airtable
  {
    kind: 'action',
    id: 'step-08',
    fragments: [
      T('Log a row in our enquiries tracker '),
      C('chip-http-08', 'http'),
      T(': customer name, tour, dates, source, status.'),
    ],
  },

  // Step 09 - Assign
  {
    kind: 'action',
    id: 'step-09',
    fragments: [
      T('Hand the draft to whoever is on inbox duty '),
      C('chip-assign-09', 'assign'),
      T('. They read it, rewrite anything that does not sound like us, add the personal touches, and send.'),
    ],
  },

  // Step 10 - Wait + Tag (two chips in one step)
  {
    kind: 'action',
    id: 'step-10',
    fragments: [
      T('Wait 5 days '),
      C('chip-wait-10', 'wait'),
      T('. If we have not heard back, flag it '),
      C('chip-tag-10b', 'tag'),
      T(' and tell the human — we do not auto-send nudges to enquiries.'),
    ],
  },

  // Step 11 - End
  {
    kind: 'end',
    id: 'step-end',
  },
];

// ---------------------------------------------------------------------------
// Exported seed playbook
// ---------------------------------------------------------------------------

export const WALK_JAPAN_PLAYBOOK: Playbook = {
  id: 'pb-walkjapan-tour-enquiry',
  version: 1,
  frontmatter: {
    name: 'Tour enquiry — Walk Japan',
    summary: '',
    triggerFragments: [
      { kind: 'text', text: 'Email arrives in ' },
      { kind: 'ref',  refPath: 'info@walkjapan.com' },
      { kind: 'text', text: ' inbox asking about a tour.' },
    ],
  },
  steps,
  refs: DEFAULT_REFS,
  connectors: defaultConnectorIds(),
  bindings: [
    { mailboxId: 'mb-support', mailboxName: 'Support', active: true  },
    { mailboxId: 'mb-billing', mailboxName: 'Billing', active: false },
  ],
  updatedAt: 0,
};
