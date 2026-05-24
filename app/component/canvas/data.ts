import type { IconType } from 'react-icons';
import {
  RiSparklingLine, RiArticleLine, RiBookOpenLine, RiSearchLine,
  RiDraftLine, RiReplyLine, RiStickyNoteLine, RiPriceTag3Line,
  RiUserAddLine, RiCheckDoubleLine, RiTimeLine, RiGitBranchLine,
  RiStopCircleLine, RiGlobalLine,
} from 'react-icons/ri';
import { SiHubspot, SiSalesforce, SiSlack, SiShopify, SiClickup } from 'react-icons/si';

/* ============================================================ */
/* Types                                                          */
/* ============================================================ */
export type Bucket = 'read' | 'ticket' | 'external' | 'human' | 'wait' | 'flow';
export type ChipStatus = 'idle' | 'queued' | 'running' | 'ok' | 'error' | 'skipped' | 'draft';

export interface Ref {
  id: string;
  path: string;       // e.g. "from.email" or "ai_extract.output.tour"
  label: string;
  type: 'email' | 'text' | 'longtext' | 'number' | 'date' | 'bool' | 'enum' | 'doc' | 'draft';
  group: 'inputs' | 'outputs' | 'ticket';
}

export interface ActionDef {
  id: string;
  bucket: Bucket;
  name: string;       // e.g. "AI Extract" or "Slack · Send message"
  brand?: string;     // e.g. "Slack"
  verb: string;       // e.g. "Send message"
  desc: string;
  defaultMeta?: string;
  iconKey: string;
}

export interface Chip {
  id: string;
  actionId: string;
  status: ChipStatus;
  meta?: string;      // configured value string (e.g. "tour · dates · group")
  configCount?: number; // for the configure-panel state preview
}

export type Frag =
  | { kind: 'text'; text: string }
  | { kind: 'chip'; chip: Chip }
  | { kind: 'ref';  refPath: string }
  | { kind: 'code'; code: string };

export interface Step {
  id: string;
  kind: 'action';
  fragments: Frag[];
}

export interface ConditionBranch {
  id: string;
  label: string;       // "yes" / "no" / "else"
  predicate?: string;  // mono code
  steps: Step[];
}

export interface ConditionStep {
  id: string;
  kind: 'condition';
  exprText: string;
  branches: ConditionBranch[];
}

export interface EndStep {
  id: string;
  kind: 'end';
  reason?: string;
}

export type AnyStep = Step | ConditionStep | EndStep;

export interface Frontmatter {
  name: string;
  triggerFragments: Frag[];
  summary: string;
}

export interface Playbook {
  frontmatter: Frontmatter;
  steps: AnyStep[];
}

export interface TraceEntry {
  stepId: string;
  chipId?: string;
  status: 'queued' | 'running' | 'ok' | 'error' | 'skipped';
  durationMs?: number;
  input?: string;
  output?: string;
  errorMessage?: string;
}

/* ============================================================ */
/* Icon registry                                                  */
/* ============================================================ */
export const ICONS: Record<string, IconType> = {
  extract:    RiSparklingLine,
  summarize:  RiArticleLine,
  kb_search:  RiBookOpenLine,
  search:     RiSearchLine,
  draft:      RiDraftLine,
  reply:      RiReplyLine,
  note:       RiStickyNoteLine,
  tag:        RiPriceTag3Line,
  assign:     RiUserAddLine,
  approval:   RiCheckDoubleLine,
  wait:       RiTimeLine,
  condition:  RiGitBranchLine,
  end:        RiStopCircleLine,
  http:       RiGlobalLine,
  hubspot:    SiHubspot,
  salesforce: SiSalesforce,
  slack:      SiSlack,
  shopify:    SiShopify,
  clickup:    SiClickup,
};

/* ============================================================ */
/* Action library (29 across 6 buckets)                           */
/* ============================================================ */
export const ACTIONS: ActionDef[] = [
  // read
  { id: 'ai_extract',           bucket: 'read',     verb: 'AI Extract',    name: 'AI Extract',           desc: 'Pull structured fields from prose',   defaultMeta: 'from email body',   iconKey: 'extract' },
  { id: 'summarize',            bucket: 'read',     verb: 'Summarize',     name: 'Summarize',            desc: 'One-paragraph summary',               defaultMeta: 'this conversation', iconKey: 'summarize' },
  { id: 'kb_search',            bucket: 'read',     verb: 'Search knowledge', name: 'Search knowledge',  desc: 'Find articles in the KB',             defaultMeta: 'help center',       iconKey: 'kb_search' },
  { id: 'sheets_get',           bucket: 'read',     brand: 'Sheets',    verb: 'Get rows',      name: 'Sheets · Get rows',     desc: 'Fetch rows from a Google Sheet',      defaultMeta: 'bookings sheet',    iconKey: 'search' },
  { id: 'hubspot_find',         bucket: 'read',     brand: 'HubSpot',   verb: 'Find contact',  name: 'HubSpot · Find contact',desc: 'Look up a contact by email or ID',    defaultMeta: 'by from_email',     iconKey: 'hubspot' },
  { id: 'shopify_get_order',    bucket: 'read',     brand: 'Shopify',   verb: 'Get order',     name: 'Shopify · Get order',   desc: 'Look up an order by ID',              iconKey: 'shopify' },

  // ticket
  { id: 'tag',                  bucket: 'ticket',   verb: 'Tag',           name: 'Tag',                  desc: 'Apply one or more tags',              defaultMeta: '@tour.name',        iconKey: 'tag' },
  { id: 'note',                 bucket: 'ticket',   verb: 'Note',          name: 'Note',                 desc: 'Add an internal-only note',           defaultMeta: 'internal',          iconKey: 'note' },
  { id: 'draft_reply',          bucket: 'ticket',   verb: 'Draft reply',   name: 'Draft reply',          desc: 'Save a draft for the agent to send',  defaultMeta: 'save as draft',     iconKey: 'draft' },
  { id: 'send_reply',           bucket: 'ticket',   verb: 'Send reply',    name: 'Send reply',           desc: 'Send a reply immediately',                                              iconKey: 'reply' },
  { id: 'assign',               bucket: 'ticket',   verb: 'Assign',        name: 'Assign',               desc: 'Reassign to a user or queue',         defaultMeta: 'on-shift inbox',    iconKey: 'assign' },
  { id: 'change_status',        bucket: 'ticket',   verb: 'Change status', name: 'Change status',        desc: 'Open / Pending / Closed',                                                iconKey: 'tag' },
  { id: 'set_field',            bucket: 'ticket',   verb: 'Set field',     name: 'Set custom field',     desc: 'Update a custom field value',                                            iconKey: 'tag' },

  // external
  { id: 'slack_send',           bucket: 'external', brand: 'Slack',     verb: 'Send message',  name: 'Slack · Send message',  desc: 'Post to a channel or DM',             defaultMeta: '#cs-team',          iconKey: 'slack' },
  { id: 'hubspot_create_ticket',bucket: 'external', brand: 'HubSpot',   verb: 'Create ticket', name: 'HubSpot · Create ticket',desc: 'Open a support ticket',                                              iconKey: 'hubspot' },
  { id: 'salesforce_get',       bucket: 'external', brand: 'Salesforce',verb: 'Get account',   name: 'Salesforce · Get account',desc: 'Look up an account',                                              iconKey: 'salesforce' },
  { id: 'clickup_create',       bucket: 'external', brand: 'ClickUp',   verb: 'Create task',   name: 'ClickUp · Create task', desc: 'Add a task to a list',                                              iconKey: 'clickup' },
  { id: 'shopify_refund',       bucket: 'external', brand: 'Shopify',   verb: 'Issue refund',  name: 'Shopify · Issue refund',desc: 'Refund an order',                                                    iconKey: 'shopify' },
  { id: 'http',                 bucket: 'external',                     verb: 'HTTP',          name: 'HTTP',                  desc: 'Call a custom endpoint',              defaultMeta: 'advanced',          iconKey: 'http' },

  // human
  { id: 'approval',             bucket: 'human',                        verb: 'Approval',      name: 'Approval',              desc: 'Pause for human sign-off',            defaultMeta: 'manager · 24h',     iconKey: 'approval' },

  // wait
  { id: 'wait',                 bucket: 'wait',                         verb: 'Wait',          name: 'Wait',                  desc: 'Pause for a fixed duration',          defaultMeta: '1 business day',    iconKey: 'wait' },
  { id: 'wait_for_reply',       bucket: 'wait',                         verb: 'Wait for reply',name: 'Wait for reply',        desc: 'Resume when the customer responds',                                  iconKey: 'wait' },
  { id: 'wait_until',           bucket: 'wait',                         verb: 'Wait until',    name: 'Wait until',            desc: 'Resume at a specific date/time',                                       iconKey: 'wait' },

  // flow
  { id: 'condition',            bucket: 'flow',                         verb: 'Condition',     name: 'Condition',             desc: 'Branch on an expression',                                              iconKey: 'condition' },
  { id: 'end',                  bucket: 'flow',                         verb: 'End playbook',  name: 'End playbook',          desc: 'Stop here',                                                            iconKey: 'end' },
];

export const BUCKET_TITLES: Record<Bucket, string> = {
  read:     'Read',
  ticket:   'Ticket',
  external: 'External',
  human:    'Human',
  wait:     'Wait',
  flow:     'Flow',
};

export const BUCKET_HINTS: Record<Bucket, string> = {
  read:     'silent · lookup + understand',
  ticket:   'Hiver-native verbs',
  external: 'connectors + HTTP',
  human:    'pause for review',
  wait:     'time-based',
  flow:     'branching + end',
};

export const BUCKET_ORDER: Bucket[] = ['read', 'ticket', 'external', 'human', 'wait', 'flow'];

export function findAction(id: string): ActionDef | undefined {
  return ACTIONS.find((a) => a.id === id);
}

/* ============================================================ */
/* Ref library                                                    */
/* ============================================================ */
export const REFS: Ref[] = [
  { id: 'r1',  path: 'from.email',                label: 'Sender email',       type: 'email',    group: 'ticket'  },
  { id: 'r2',  path: 'from.name',                 label: 'Sender name',        type: 'text',     group: 'ticket'  },
  { id: 'r3',  path: 'subject',                   label: 'Subject',            type: 'text',     group: 'ticket'  },
  { id: 'r4',  path: 'body',                      label: 'Body',               type: 'longtext', group: 'ticket'  },
  { id: 'r5',  path: 'received_at',               label: 'Received at',        type: 'date',     group: 'ticket'  },
  { id: 'r6',  path: 'inbox',                     label: 'Mailbox',            type: 'email',    group: 'inputs'  },
  { id: 'r7',  path: 'ai_extract.output.tour',    label: 'Tour name',          type: 'text',     group: 'outputs' },
  { id: 'r8',  path: 'ai_extract.output.dates',   label: 'Tour dates',         type: 'text',     group: 'outputs' },
  { id: 'r9',  path: 'ai_extract.output.group',   label: 'Group size',         type: 'number',   group: 'outputs' },
  { id: 'r10', path: 'ai_extract.output.concerns',label: 'Concerns',           type: 'text',     group: 'outputs' },
  { id: 'r11', path: 'sheets_get.rows',           label: 'Bookings rows',      type: 'doc',      group: 'outputs' },
  { id: 'r12', path: 'hubspot_find.contact',      label: 'HubSpot contact',    type: 'doc',      group: 'outputs' },
  { id: 'r13', path: 'kb_search.results',         label: 'KB articles',        type: 'doc',      group: 'outputs' },
];

/* ============================================================ */
/* Walk Japan seed                                                */
/* ============================================================ */
export const WALK_JAPAN_SEED: Playbook = {
  frontmatter: {
    name: 'Tour enquiry',
    triggerFragments: [
      { kind: 'ref',  refPath: 'info@walkjapan.com' },
      { kind: 'text', text: ' receives a tour enquiry.' },
    ],
    summary: 'Get the team 80% of the way to a reply, then leave the last 20% to a human who can keep the Walk Japan voice.',
  },
  steps: [
    {
      id: 'step-01',
      kind: 'action',
      fragments: [
        { kind: 'text', text: 'First, ' },
        { kind: 'chip', chip: { id: 'c-01', actionId: 'ai_extract', status: 'idle', meta: 'tour · dates · group size · concerns' } },
        { kind: 'text', text: ' from the email in one line — which tour, what dates, group size, and any special concerns (fitness, dietary, accessibility).' },
      ],
    },
    {
      id: 'step-02',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'c-02', actionId: 'sheets_get', status: 'idle', meta: 'bookings sheet' } },
        { kind: 'text', text: ' to see if ' },
        { kind: 'ref',  refPath: 'ai_extract.output.tour' },
        { kind: 'text', text: ' on those dates is available, partially available, or full.' },
      ],
    },
    {
      id: 'step-03',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'c-03', actionId: 'hubspot_find', status: 'idle', meta: 'by from_email' } },
        { kind: 'text', text: ' — are they a repeat guest, new, or have they enquired before?' },
      ],
    },
    {
      id: 'step-04',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'c-04', actionId: 'kb_search', status: 'idle', meta: 'tour overview · fitness · dietary' } },
        { kind: 'text', text: ' — the tour overview, the fitness-level guide, and the dietary FAQ. Keep those links handy for the draft.' },
      ],
    },
    {
      id: 'step-05',
      kind: 'condition',
      exprText: 'Check whether the tour is available on those dates.',
      branches: [
        {
          id: 'b-yes',
          label: 'yes',
          predicate: 'availability == "yes"',
          steps: [
            {
              id: 'step-05a',
              kind: 'action',
              fragments: [
                { kind: 'chip', chip: { id: 'c-05a', actionId: 'draft_reply', status: 'idle', meta: 'warm + availability + KB links' } },
                { kind: 'text', text: ' — warm voice, the availability, fitness/dietary notes from the right articles, help-center links, and an invitation to hold the dates.' },
              ],
            },
          ],
        },
        {
          id: 'b-no',
          label: 'no',
          predicate: 'availability == "no"',
          steps: [
            {
              id: 'step-05b',
              kind: 'action',
              fragments: [
                { kind: 'chip', chip: { id: 'c-05b', actionId: 'draft_reply', status: 'idle', meta: 'sorry + alternatives + similar tours' } },
                { kind: 'text', text: ' — "sorry it’s not open then, but here’s what’s similar" — two alternative dates or two similar tours, with help-center links.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'step-06',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'c-06', actionId: 'tag', status: 'idle', meta: 'the tour name' } },
        { kind: 'text', text: ' so we can track interest per tour.' },
      ],
    },
    {
      id: 'step-07',
      kind: 'action',
      fragments: [
        { kind: 'text', text: 'Leave a private ' },
        { kind: 'chip', chip: { id: 'c-07', actionId: 'note', status: 'idle', meta: 'tour · dates · group size · concerns' } },
        { kind: 'text', text: ' — so the sender has the full picture without re-reading the thread.' },
      ],
    },
    {
      id: 'step-08',
      kind: 'action',
      fragments: [
        { kind: 'text', text: 'Log a row in our enquiries tracker: ' },
        { kind: 'chip', chip: { id: 'c-08', actionId: 'http', status: 'idle', meta: 'Airtable · customer · tour · dates · source · status' } },
        { kind: 'text', text: '.' },
      ],
    },
    {
      id: 'step-09',
      kind: 'action',
      fragments: [
        { kind: 'text', text: 'Hand the draft over: ' },
        { kind: 'chip', chip: { id: 'c-09', actionId: 'assign', status: 'idle', meta: 'whoever’s on inbox duty' } },
        { kind: 'text', text: '. They’ll read it, rewrite anything that doesn’t sound like us, add the personal touches, and send.' },
      ],
    },
    {
      id: 'step-10',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'c-10', actionId: 'wait', status: 'idle', meta: '5 days' } },
        { kind: 'text', text: ' for the customer to reply.' },
      ],
    },
    {
      id: 'step-11',
      kind: 'action',
      fragments: [
        { kind: 'text', text: 'If we haven’t heard back, ' },
        { kind: 'chip', chip: { id: 'c-11', actionId: 'tag', status: 'idle', meta: 'warm-follow-up-needed' } },
        { kind: 'text', text: ' and tell the human — we don’t auto-send nudges to enquiries. A human writes that one too.' },
      ],
    },
    {
      id: 'step-12',
      kind: 'end',
      reason: 'enquiry handled',
    },
  ],
};

/* ============================================================ */
/* Devansh seed — Dev support API error reply with approval       */
/* From PLAYBOOKS_STORIES.md Story 3 — the stress-test:           */
/* 4-way diagnose branching + multi-channel approval + timeout    */
/* ============================================================ */
export const DEVANSH_API_SEED: Playbook = {
  frontmatter: {
    name: 'API error reply',
    triggerFragments: [
      { kind: 'ref',  refPath: 'dev-support@theirco.com' },
      { kind: 'text', text: ' receives an email with an HTTP status code, a stack trace, or one of our endpoints.' },
    ],
    summary: 'Let the AI do the boring research and drafting. Route every reply through the on-shift engineer before it goes out. Anything high-impact gets a second approval.',
  },
  steps: [
    {
      id: 'dv-01',
      kind: 'action',
      fragments: [
        { kind: 'text', text: 'First, ' },
        { kind: 'chip', chip: { id: 'dv-c01', actionId: 'ai_extract', status: 'idle', meta: 'error code · HTTP status · endpoint · when · SDK · payload (sanitized)' } },
        { kind: 'text', text: ' — the bits that matter.' },
      ],
    },
    {
      id: 'dv-02',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'dv-c02', actionId: 'tag', status: 'idle', meta: 'api-error' } },
        { kind: 'text', text: ' and route it to developer-support.' },
      ],
    },
    {
      id: 'dv-03',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'dv-c03', actionId: 'hubspot_find', status: 'idle', meta: 'in HubSpot' } },
        { kind: 'text', text: ' — which contact, which company.' },
      ],
    },
    {
      id: 'dv-04',
      kind: 'action',
      fragments: [
        { kind: 'text', text: 'Then ' },
        { kind: 'chip', chip: { id: 'dv-c04', actionId: 'salesforce_get', status: 'idle', meta: 'contract · API rate-limit tier · SLA terms' } },
        { kind: 'text', text: ' for the company.' },
      ],
    },
    {
      id: 'dv-05',
      kind: 'action',
      fragments: [
        { kind: 'text', text: 'Leave a private ' },
        { kind: 'chip', chip: { id: 'dv-c05', actionId: 'note', status: 'idle', meta: 'who they are · plan · what SLA we owe them' } },
        { kind: 'text', text: '.' },
      ],
    },
    {
      id: 'dv-06',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'dv-c06', actionId: 'kb_search', status: 'idle', meta: 'error docs · SDK examples · changelog · known incidents' } },
        { kind: 'text', text: ' in our developer KB.' },
      ],
    },
    {
      id: 'dv-07',
      kind: 'condition',
      exprText: 'Now figure out what kind of error this is and draft a fix.',
      branches: [
        {
          id: 'dv-b-auth',
          label: "it's auth (401/403)",
          predicate: 'http_status in (401, 403)',
          steps: [
            {
              id: 'dv-07a',
              kind: 'action',
              fragments: [
                { kind: 'chip', chip: { id: 'dv-c07a', actionId: 'draft_reply', status: 'idle', meta: 'scope walk-through + corrected request' } },
                { kind: 'text', text: '.' },
              ],
            },
          ],
        },
        {
          id: 'dv-b-schema',
          label: "it's a schema problem (400)",
          predicate: 'http_status == 400',
          steps: [
            {
              id: 'dv-07b',
              kind: 'action',
              fragments: [
                { kind: 'chip', chip: { id: 'dv-c07b', actionId: 'draft_reply', status: 'idle', meta: 'point out the malformed field · paste a working code example' } },
                { kind: 'text', text: '.' },
              ],
            },
          ],
        },
        {
          id: 'dv-b-rate',
          label: "it's a rate limit (429)",
          predicate: 'http_status == 429',
          steps: [
            {
              id: 'dv-07c',
              kind: 'action',
              fragments: [
                { kind: 'chip', chip: { id: 'dv-c07c', actionId: 'draft_reply', status: 'idle', meta: 'reference their SLA tier + our rate-limit policy' } },
                { kind: 'text', text: '.' },
              ],
            },
          ],
        },
        {
          id: 'dv-b-server',
          label: "it's a server error (5xx)",
          predicate: 'http_status >= 500',
          steps: [
            {
              id: 'dv-07d',
              kind: 'action',
              fragments: [
                { kind: 'chip', chip: { id: 'dv-c07d', actionId: 'draft_reply', status: 'idle', meta: 'use our incident-response template' } },
                { kind: 'text', text: '.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'dv-08',
      kind: 'action',
      fragments: [
        { kind: 'text', text: 'Leave another private ' },
        { kind: 'chip', chip: { id: 'dv-c08', actionId: 'note', status: 'idle', meta: 'diagnosis · KB articles used · draft preview · confidence out of 10' } },
        { kind: 'text', text: '.' },
      ],
    },
    {
      id: 'dv-09',
      kind: 'action',
      fragments: [
        { kind: 'text', text: 'Now ask for ' },
        { kind: 'chip', chip: { id: 'dv-c09', actionId: 'approval', status: 'idle', meta: 'on-shift dev-support · Slack DM + Hiver pending · 1h · escalate to backup engineer · off-hours → next shift' } },
        { kind: 'text', text: ' before anything sends. They see the original email, the parsed bits, your diagnosis, the drafted reply, the KB sources, the customer’s SLA, and your confidence score. Three outcomes: Approve · Edit and approve · Reject.' },
      ],
    },
    {
      id: 'dv-10',
      kind: 'condition',
      exprText: 'How did the approver respond?',
      branches: [
        {
          id: 'dv-b-approved',
          label: 'they approved (as-is)',
          predicate: 'approval == "approve"',
          steps: [
            {
              id: 'dv-10a',
              kind: 'action',
              fragments: [
                { kind: 'chip', chip: { id: 'dv-c10a', actionId: 'send_reply', status: 'idle', meta: 'as drafted' } },
                { kind: 'text', text: ', ' },
                { kind: 'chip', chip: { id: 'dv-c10b', actionId: 'tag', status: 'idle', meta: 'auto-drafted-approved' } },
                { kind: 'text', text: ', and move the ticket to Pending.' },
              ],
            },
          ],
        },
        {
          id: 'dv-b-edited',
          label: 'they edited and approved',
          predicate: 'approval == "edit-and-approve"',
          steps: [
            {
              id: 'dv-10c',
              kind: 'action',
              fragments: [
                { kind: 'chip', chip: { id: 'dv-c10c', actionId: 'send_reply', status: 'idle', meta: 'with the approver’s edits' } },
                { kind: 'text', text: ', ' },
                { kind: 'chip', chip: { id: 'dv-c10d', actionId: 'tag', status: 'idle', meta: 'auto-drafted-approved' } },
                { kind: 'text', text: ', and move the ticket to Pending.' },
              ],
            },
          ],
        },
        {
          id: 'dv-b-rejected',
          label: 'they rejected',
          predicate: 'approval == "reject"',
          steps: [
            {
              id: 'dv-10e',
              kind: 'action',
              fragments: [
                { kind: 'text', text: 'Leave a private ' },
                { kind: 'chip', chip: { id: 'dv-c10f', actionId: 'note', status: 'idle', meta: 'rejection reason + correct diagnosis if given' } },
                { kind: 'text', text: ', ' },
                { kind: 'chip', chip: { id: 'dv-c10g', actionId: 'tag', status: 'idle', meta: 'manual-handling' } },
                { kind: 'text', text: ', and hand off to the SE queue.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'dv-11',
      kind: 'condition',
      exprText: 'Did the approver authorize anything high-impact while reviewing? Those need a second approval — the reply itself can go; the bumps and acks wait.',
      branches: [
        {
          id: 'dv-b-bump',
          label: 'they OK’d a rate-limit bump',
          predicate: 'approval.flags has "rate_limit_bump"',
          steps: [
            {
              id: 'dv-11a',
              kind: 'action',
              fragments: [
                { kind: 'text', text: 'Get a second ' },
                { kind: 'chip', chip: { id: 'dv-c11a', actionId: 'approval', status: 'idle', meta: 'Solutions Engineering lead' } },
                { kind: 'text', text: ' before the bump goes through. If approved, ' },
                { kind: 'chip', chip: { id: 'dv-c11b', actionId: 'clickup_create', status: 'idle', meta: 'SE queue · implement quota bump' } },
                { kind: 'text', text: '.' },
              ],
            },
          ],
        },
        {
          id: 'dv-b-ack',
          label: 'they OK’d a public bug acknowledgment',
          predicate: 'approval.flags has "public_bug_ack"',
          steps: [
            {
              id: 'dv-11c',
              kind: 'action',
              fragments: [
                { kind: 'text', text: 'Get a second ' },
                { kind: 'chip', chip: { id: 'dv-c11c', actionId: 'approval', status: 'idle', meta: 'Engineering on-call' } },
                { kind: 'text', text: ' before the acknowledgment is sent.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'dv-12',
      kind: 'end',
      reason: 'api-error handled',
    },
  ],
};

/* ============================================================ */
/* Playbook registry — drives the topbar switcher                 */
/* ============================================================ */
export interface PlaybookOption {
  id: string;
  label: string;
  blurb: string;
  seed: Playbook;
}
export const PLAYBOOKS: PlaybookOption[] = [
  { id: 'walk-japan', label: 'Tour enquiry',     blurb: 'Walk Japan · inbound tour enquiries', seed: WALK_JAPAN_SEED },
  { id: 'devansh',    label: 'API error reply',  blurb: 'Dev-support · API errors with approval', seed: DEVANSH_API_SEED },
];

/* ============================================================ */
/* Mock test trace generator                                      */
/* ============================================================ */
export const MOCK_TRACE_OUTPUTS: Record<string, { input: string; output: string; errorMessage?: string }> = {
  'c-01': { input: 'subject + body',           output: '{tour: "Nakasendo", dates: "Apr 4–8", group: 2, concerns: "fitness"}' },
  'c-02': { input: 'tour: Nakasendo',          output: '[{date: Apr 4, status: open}, {date: Apr 11, status: full}]' },
  'c-03': { input: 'rhys@walkjapan.com',       output: '{contact: rhys@walkjapan.com, source: web}' },
  'c-04': { input: 'overview, fitness, dietary',output: '3 articles found' },
  'c-05a': { input: 'availability + KB links', output: 'Draft #4711 saved' },
  'c-05b': { input: 'alternatives',             output: '(skipped — availability == "yes")' },
  'c-06': { input: 'tag: Nakasendo',           output: 'tagged' },
  'c-07': { input: 'note body 4 lines',         output: 'note added' },
  'c-08': { input: 'POST Airtable',             output: '201 Created · row-id 5821' },
  'c-09': { input: 'on-shift inbox',            output: 'assigned to maya@walkjapan.com' },
  'c-10': { input: '5 days',                    output: 'waiting…' },
  'c-11': { input: 'warm-follow-up-needed',     output: '(awaiting wait completion)' },
};
