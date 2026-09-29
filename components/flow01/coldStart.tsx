'use client';

import type { ComponentType, SVGProps } from 'react';
import {
  RiBug2Line,
  RiBankCardLine,
  RiLightbulbFlashLine,
  RiBookOpenLine,
  RiShoppingBag3Line,
  RiAlarmWarningLine,
} from 'react-icons/ri';
import type { ConnectorSlug } from '@/types/playbook';
import { ACTIONS } from '@/data/library';
import {
  type EditorDoc,
  type Step,
  type Branch,
  type BranchType,
  type ConditionStep,
  txt,
  makeChip,
  normalizeLine,
  newId,
  defaultGuardrails,
} from './doc';

// ---------------------------------------------------------------------------
// Cold-start "draft your skill with AI" data + doc builders.
//
// Everything here is GENERIC + reusable - universal support workflows any team
// has (triage bug reports, billing, feature requests, KB replies). NO named
// customer / person / company / one story's data (see feedback-reusability-
// principle). All paths funnel through ONE builder so the generated Skill is
// data-driven, never bespoke per starter.
// ---------------------------------------------------------------------------

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

// One step line: either plain prose (`text`) or prose wrapped around a single
// action chip (`before` + action chip + `after`).
interface StarterStep {
  text?: string;
  before?: string;
  action?: string;
  meta?: string;
  after?: string;
}

interface StarterBranch {
  type: BranchType;
  expr?: string; // the NL test (if / else-if); else has none
  before?: string;
  action: string;
  meta?: string;
  after?: string;
}

interface ConditionSpec {
  intro: string; // the prose line that introduces the branch ("Then draft the right reply:")
  branches: StarterBranch[];
}

/** Template filters on the Skills empty state, in display order. */
export const STARTER_CATEGORIES = ['Triage', 'Billing and orders', 'Replies', 'Escalation'] as const;
export type StarterCategory = (typeof STARTER_CATEGORIES)[number];

export interface StarterSpec {
  id: string;
  /** Bubble label (verb-led, generic). */
  label: string;
  /** One-line card summary of what the skill does, end to end. */
  blurb: string;
  /** The template filter it sits under on the Skills empty state. */
  category: StarterCategory;
  Icon: IconCmp;
  /** Prefill written into the prompt field on click (the user can edit before generating). */
  prompt: string;
  /** Resulting Skill fields. */
  title: string;
  trigger: string;
  steps: StarterStep[];
  condition?: ConditionSpec;
}

// The starter workflows. Generic across every customer; the prefill prompt
// reads as a sentence the user could have typed, and the built doc is coherent
// with it.
export const STARTERS: StarterSpec[] = [
  {
    id: 'bug-triage',
    label: 'Triage bug reports',
    blurb: 'Collects repro steps, tags severity, and routes to engineering.',
    category: 'Triage',
    Icon: RiBug2Line,
    prompt:
      'When a customer reports a bug, gather the steps to reproduce and the affected account, tag it by severity, route it to the engineering queue, and reply to confirm we are on it.',
    title: 'Bug report triage',
    trigger: 'When a customer emails reporting a bug or something not working.',
    steps: [
      { text: 'Pull out the steps to reproduce, the affected account, and the severity.' },
      { before: 'Tag the ticket ', action: 'tag', meta: 'bug, needs-triage', after: '.' },
      { before: 'Assign it to the ', action: 'assign', meta: 'Engineering queue', after: '.' },
      { action: 'draft_reply', after: ' to confirm we are looking into it.' },
    ],
  },
  {
    id: 'billing',
    label: 'Answer billing questions',
    blurb: 'Looks up the customer and drafts a reply from your policy.',
    category: 'Billing and orders',
    Icon: RiBankCardLine,
    prompt:
      'When a customer asks about an invoice or charge, look up their billing details, draft a clear reply from the knowledge base, and escalate to finance if a refund is requested.',
    title: 'Billing questions',
    trigger: 'When a customer asks about an invoice, a charge, or a refund.',
    steps: [
      { text: 'Pull out the invoice number, the amount, and what they are asking.' },
      { before: 'Look up the customer in ', action: 'hubspot_get_contact', after: '.' },
      { action: 'kb_search', meta: 'Billing', after: ' for the relevant policy.' },
    ],
    condition: {
      intro: 'Then draft the right reply:',
      branches: [
        { type: 'if', expr: 'they are asking for a refund', action: 'draft_reply', after: ' with the refund steps and loop in Finance for approval.' },
        { type: 'else', action: 'draft_reply', after: ' with the billing details.' },
      ],
    },
  },
  {
    id: 'feature-request',
    label: 'Route feature requests',
    blurb: 'Logs the request to your backlog and thanks the customer.',
    category: 'Triage',
    Icon: RiLightbulbFlashLine,
    prompt:
      'When a customer suggests a new feature, summarize the request, log it to the product backlog, and reply to thank them and set expectations.',
    title: 'Feature requests',
    trigger: 'When a customer suggests a new feature or an improvement.',
    steps: [
      { text: 'Pull out the requested feature and the use case behind it.' },
      { before: 'Tag it ', action: 'tag', meta: 'feature-request', after: '.' },
      { before: 'Log it to the ', action: 'clickup_create_task', after: '.' },
      { action: 'draft_reply', after: ' thanking them and setting expectations on next steps.' },
    ],
  },
  {
    id: 'kb-reply',
    label: 'Reply from the knowledge base',
    blurb: 'Drafts a reply from the matching article, for approval.',
    category: 'Replies',
    Icon: RiBookOpenLine,
    prompt:
      'When a common how-to question comes in, find the matching knowledge base article, draft a reply that matches the customer tone, and ask a teammate to review before sending.',
    title: 'Knowledge base replies',
    trigger: 'When a common how-to question comes in.',
    steps: [
      { text: 'Pull out the question and the product area.' },
      { action: 'kb_search', meta: 'Help center', after: ' for a matching article.' },
      { action: 'draft_reply', after: ' from the matching article, in a tone that matches the customer.' },
      { before: 'Then ', action: 'approval', after: ' so a teammate reviews it before it sends.' },
    ],
  },
  {
    id: 'order-issues',
    label: 'Resolve order issues',
    blurb: 'Checks the order in Shopify and routes refunds for approval.',
    category: 'Billing and orders',
    Icon: RiShoppingBag3Line,
    prompt:
      'When a customer writes about a late, damaged, or wrong order, look up the order in Shopify. If it qualifies for a refund, ask a teammate to approve it; otherwise reply with the order status and next steps.',
    title: 'Order issues',
    trigger: 'When a customer writes about a late, damaged, or wrong order.',
    steps: [
      { text: 'Pull out the order number and what went wrong.' },
      { before: 'Look up the order in ', action: 'shopify_get_order', after: '.' },
    ],
    condition: {
      intro: 'Then resolve it:',
      branches: [
        { type: 'if', expr: 'the order qualifies for a refund', before: 'Ask for ', action: 'approval', after: ' to refund it.' },
        { type: 'else', action: 'draft_reply', after: ' with the order status and next steps.' },
      ],
    },
  },
  {
    id: 'escalate-urgent',
    label: 'Escalate urgent issues',
    blurb: 'Tags it urgent, alerts Slack, and hands off to Tier 2.',
    category: 'Escalation',
    Icon: RiAlarmWarningLine,
    prompt:
      'When a customer reports an outage or an urgent blocker, look them up in HubSpot, tag it urgent, post a summary to the escalations channel in Slack, and assign it to the Tier 2 queue.',
    title: 'Urgent escalations',
    trigger: 'When a customer reports an outage or an urgent blocker.',
    steps: [
      { text: 'Pull out what is broken and how many people it affects.' },
      { before: 'Look up the customer in ', action: 'hubspot_get_contact', after: '.' },
      { before: 'Tag it ', action: 'tag', meta: 'urgent', after: '.' },
      { action: 'slack_send_message', meta: '#support-escalations', after: ' with a short summary.' },
      { before: 'Assign it to the ', action: 'assign', meta: 'Tier 2 queue', after: '.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// At-a-glance facts for a starter's card, read off its own steps - never typed
// in separately, so a card can't claim a connector the skill doesn't use.
// ---------------------------------------------------------------------------

function starterActionIds(spec: StarterSpec): string[] {
  const ids = spec.steps.map((s) => s.action);
  spec.condition?.branches.forEach((b) => ids.push(b.action));
  return ids.filter((id): id is string => !!id);
}

/** The connectors a starter calls, in the order its steps first use them. */
export function starterConnectors(spec: StarterSpec): ConnectorSlug[] {
  const out: ConnectorSlug[] = [];
  for (const id of starterActionIds(spec)) {
    const slug = ACTIONS.find((a) => a.id === id)?.connectorSlug;
    if (slug && !out.includes(slug)) out.push(slug);
  }
  return out;
}

/** Lines the editor shows once it's built: each step, plus the condition's
 *  intro line and the condition block itself (see buildStarterDoc). */
export function starterStepCount(spec: StarterSpec): number {
  return spec.steps.length + (spec.condition ? 2 : 0);
}

export type ReplyMode = 'sends' | 'approval' | 'drafts' | 'none';

/** How far the starter goes on its own: the strictest human gate wins. */
export function starterReplyMode(spec: StarterSpec): ReplyMode {
  const ids = starterActionIds(spec);
  if (ids.includes('approval')) return 'approval';
  if (ids.includes('send_reply')) return 'sends';
  if (ids.includes('draft_reply')) return 'drafts';
  return 'none';
}

// Build a step line's fragments from a starter step / branch spec.
function lineFrags(s: { text?: string; before?: string; action?: string; meta?: string; after?: string }) {
  if (s.text != null) return normalizeLine([txt(s.text)]);
  return normalizeLine([
    ...(s.before ? [txt(s.before)] : []),
    ...(s.action ? [makeChip(s.action, s.meta)] : []),
    ...(s.after ? [txt(s.after)] : []),
  ]);
}

// THE one builder: a starter spec -> a real EditorDoc, assembled from the same
// fragment/chip/condition primitives the editor itself uses. A spec ending in a
// condition gets an empty line below it (added by the reducer's withTrailingEmpty
// on load); one ending in a normal step does not - the user adds more with Enter.
export function buildStarterDoc(spec: StarterSpec): EditorDoc {
  const steps: Step[] = spec.steps.map((s) => ({ id: newId('cs-step'), body: lineFrags(s) }));

  if (spec.condition) {
    steps.push({ id: newId('cs-step'), body: lineFrags({ text: spec.condition.intro }) });
    const branches: Branch[] = spec.condition.branches.map((b) => ({
      id: newId('cs-branch'),
      type: b.type,
      condition: b.type === 'else' ? undefined : normalizeLine([txt(b.expr ?? '')]),
      lines: [{ id: newId('cs-bline'), body: lineFrags(b) }],
    }));
    const cond: ConditionStep = { id: newId('cs-cond'), kind: 'condition', branches };
    steps.push(cond);
  }

  return {
    title: spec.title,
    trigger: normalizeLine([txt(spec.trigger)]),
    steps,
    status: 'draft',
    triggerMode: 'automatic',
    mailboxes: [],
    guardrails: defaultGuardrails(),
  };
}

// First sentence/line of a free-text description, capped, used as the trigger.
function firstSentence(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const end = flat.search(/[.!?](\s|$)/);
  const head = end > 0 ? flat.slice(0, end + 1) : flat;
  return head.length > 160 ? `${head.slice(0, 157).trimEnd()}...` : head;
}

function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  if (!base) return 'Untitled skill';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// The free-text / SOP-upload path. Without a model we can't tailor the steps, so
// we seed an HONEST, generic starting scaffold (the universal support shape:
// extract -> search knowledge -> draft reply) with the user's words as the
// trigger. They edit from there. Generic + reusable - no hardcoded case content.
export function buildScaffoldDoc(opts: { text?: string; fileName?: string }): EditorDoc {
  const trigger =
    opts.text && opts.text.trim() ? firstSentence(opts.text) : 'When a matching email arrives.';
  const title = opts.fileName ? titleFromFileName(opts.fileName) : 'Untitled skill';
  const steps: Step[] = [
    { id: newId('cs-step'), body: normalizeLine([txt('Pull out the key details from the email.')]) },
    { id: newId('cs-step'), body: normalizeLine([makeChip('kb_search', 'Help center'), txt(' for relevant context.')]) },
    { id: newId('cs-step'), body: normalizeLine([makeChip('draft_reply'), txt(' for the agent to review and send.')]) },
  ];
  return {
    title,
    trigger: normalizeLine([txt(trigger)]),
    steps,
    status: 'draft',
    triggerMode: 'automatic',
    mailboxes: [],
    guardrails: defaultGuardrails(),
  };
}
