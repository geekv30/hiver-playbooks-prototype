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
/* ============================================================ */
/* Walk Japan tag library — what Tag's inline picker picks from   */
/* ============================================================ */
export interface TagDef {
  id: string;
  name: string;
  usage: number;       // mock count for sorting Recents
  group: 'recent' | 'all';
}
export const TAGS_DEFAULT: TagDef[] = [
  { id: 't1', name: 'tour-enquiry',     usage: 142, group: 'recent' },
  { id: 't2', name: 'vip-customer',     usage: 28,  group: 'recent' },
  { id: 't3', name: 'awaiting-customer', usage: 51, group: 'recent' },
  { id: 't4', name: 'refund-needed',    usage: 9,   group: 'all'    },
  { id: 't5', name: 'urgent',           usage: 17,  group: 'all'    },
  { id: 't6', name: 'escalated',        usage: 6,   group: 'all'    },
  { id: 't7', name: 'low-priority',     usage: 12,  group: 'all'    },
  { id: 't8', name: 'group-of-4-plus',  usage: 33,  group: 'all'    },
  { id: 't9', name: 'kumano-kodo',      usage: 87,  group: 'all'    },
  { id: 't10', name: 'shikoku',         usage: 41,  group: 'all'    },
  { id: 't11', name: 'spring-2026',     usage: 22,  group: 'all'    },
];

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
      { kind: 'text', text: ' receives an email containing ' },
      { kind: 'code', code: '"tour"' },
    ],
    summary: 'Auto-triage incoming tour requests: extract details, check availability, draft the right reply, and pull the right team in if needed.',
  },
  steps: [
    {
      id: 'step-01',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'c-01', actionId: 'ai_extract', status: 'idle', meta: 'tour · dates · group · concerns' } },
        { kind: 'text', text: ' from the inbound message.' },
      ],
    },
    {
      id: 'step-02',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'c-02', actionId: 'sheets_get', status: 'idle', meta: 'GET bookings sheet' } },
        { kind: 'text', text: ' to check availability for ' },
        { kind: 'ref',  refPath: 'ai_extract.output.tour' },
        { kind: 'text', text: '.' },
      ],
    },
    {
      id: 'step-03',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'c-03', actionId: 'hubspot_find', status: 'idle', meta: 'by from_email' } },
        { kind: 'text', text: ' so we can personalise the reply.' },
      ],
    },
    {
      id: 'step-04',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'c-04', actionId: 'kb_search', status: 'idle', meta: 'overview · fitness · dietary' } },
        { kind: 'text', text: ' for relevant articles.' },
      ],
    },
    {
      id: 'step-05',
      kind: 'condition',
      exprText: 'Availability check',
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
                { kind: 'chip', chip: { id: 'c-05a', actionId: 'draft_reply', status: 'idle', meta: 'availability + KB links' } },
                { kind: 'text', text: ' with tour confirmation and supporting articles.' },
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
                { kind: 'chip', chip: { id: 'c-05b', actionId: 'draft_reply', status: 'idle', meta: 'alternatives + similar tours' } },
                { kind: 'text', text: ' suggesting other dates.' },
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
        { kind: 'chip', chip: { id: 'c-06', actionId: 'tag', status: 'idle', meta: '@tour.name' } },
        { kind: 'text', text: ' so the team can sort by tour.' },
      ],
    },
    {
      id: 'step-07',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'c-07', actionId: 'note', status: 'idle', meta: 'tour · dates · group · concerns' } },
        { kind: 'text', text: ' so the on-shift agent has full context.' },
      ],
    },
    {
      id: 'step-08',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'c-08', actionId: 'http', status: 'idle', meta: 'POST Airtable · enquiries' } },
        { kind: 'text', text: ' for analytics archive.' },
      ],
    },
    {
      id: 'step-09',
      kind: 'action',
      fragments: [
        { kind: 'chip', chip: { id: 'c-09', actionId: 'assign', status: 'idle', meta: 'on-shift inbox' } },
        { kind: 'text', text: '.' },
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
        { kind: 'chip', chip: { id: 'c-11', actionId: 'tag', status: 'idle', meta: 'warm-follow-up-needed' } },
        { kind: 'text', text: ' if no response by then.' },
      ],
    },
    {
      id: 'step-12',
      kind: 'end',
      reason: 'tour-enquiry handled',
    },
  ],
};

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
