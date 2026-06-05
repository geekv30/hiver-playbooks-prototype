'use client';

import type { ComponentType, SVGProps } from 'react';
import { RiBug2Line, RiBankCardLine, RiLightbulbFlashLine, RiBookOpenLine } from 'react-icons/ri';
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
// Cold-start "draft your playbook with AI" data + doc builders.
//
// Everything here is GENERIC + reusable - universal support workflows any team
// has (triage bug reports, billing, feature requests, KB replies). NO named
// customer / person / company / one story's data (see feedback-reusability-
// principle). All paths funnel through ONE builder so the generated playbook is
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

export interface StarterSpec {
  id: string;
  /** Bubble label (verb-led, generic). */
  label: string;
  Icon: IconCmp;
  /** Prefill written into the prompt field on click (the user can edit before generating). */
  prompt: string;
  /** Resulting playbook fields. */
  title: string;
  trigger: string;
  steps: StarterStep[];
  condition?: ConditionSpec;
}

// The four starter workflows. Generic across every customer; the prefill prompt
// reads as a sentence the user could have typed, and the built doc is coherent
// with it.
export const STARTERS: StarterSpec[] = [
  {
    id: 'bug-triage',
    label: 'Triage bug reports',
    Icon: RiBug2Line,
    prompt:
      'When a customer reports a bug, gather the steps to reproduce and the affected account, tag it by severity, route it to the engineering queue, and reply to confirm we are on it.',
    title: 'Bug report triage',
    trigger: 'When a customer emails reporting a bug or something not working.',
    steps: [
      { action: 'ai_extract', meta: 'summary', after: ' the steps to reproduce, the affected account, and the severity.' },
      { before: 'Tag the ticket ', action: 'tag', meta: 'bug, needs-triage', after: '.' },
      { before: 'Assign it to the ', action: 'assign', meta: 'Engineering queue', after: '.' },
      { action: 'draft_reply', after: ' to confirm we are looking into it.' },
    ],
  },
  {
    id: 'billing',
    label: 'Answer billing questions',
    Icon: RiBankCardLine,
    prompt:
      'When a customer asks about an invoice or charge, look up their billing details, draft a clear reply from the knowledge base, and escalate to finance if a refund is requested.',
    title: 'Billing questions',
    trigger: 'When a customer asks about an invoice, a charge, or a refund.',
    steps: [
      { action: 'ai_extract', meta: 'summary', after: ' the invoice number, the amount, and what they are asking.' },
      { before: 'Look up the customer in ', action: 'hubspot_get_contact', after: '.' },
      { before: 'Search the ', action: 'kb_search', meta: 'Billing', after: ' for the relevant policy.' },
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
    Icon: RiLightbulbFlashLine,
    prompt:
      'When a customer suggests a new feature, summarise the request, log it to the product backlog, and reply to thank them and set expectations.',
    title: 'Feature requests',
    trigger: 'When a customer suggests a new feature or an improvement.',
    steps: [
      { action: 'ai_extract', meta: 'summary', after: ' the requested feature and the use case behind it.' },
      { before: 'Tag it ', action: 'tag', meta: 'feature-request', after: '.' },
      { before: 'Log it to the ', action: 'clickup_create_task', after: '.' },
      { action: 'draft_reply', after: ' thanking them and setting expectations on next steps.' },
    ],
  },
  {
    id: 'kb-reply',
    label: 'Reply from the knowledge base',
    Icon: RiBookOpenLine,
    prompt:
      'When a common how-to question comes in, find the matching knowledge base article, draft a reply that matches the customer tone, and ask a teammate to review before sending.',
    title: 'Knowledge base replies',
    trigger: 'When a common how-to question comes in.',
    steps: [
      { action: 'ai_extract', meta: 'summary', after: ' the question and the product area.' },
      { before: 'Search the ', action: 'kb_search', meta: 'Help center', after: ' for a matching article.' },
      { action: 'draft_reply', after: ' from the matching article, in a tone that matches the customer.' },
      { before: 'Then ', action: 'approval', after: ' so a teammate reviews it before it sends.' },
    ],
  },
];

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
  if (!base) return 'Untitled AOP';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// The free-text / SOP-upload path. Without a model we can't tailor the steps, so
// we seed an HONEST, generic starting scaffold (the universal support shape:
// extract -> search knowledge -> draft reply) with the user's words as the
// trigger. They edit from there. Generic + reusable - no hardcoded case content.
export function buildScaffoldDoc(opts: { text?: string; fileName?: string }): EditorDoc {
  const trigger =
    opts.text && opts.text.trim() ? firstSentence(opts.text) : 'When a matching email arrives.';
  const title = opts.fileName ? titleFromFileName(opts.fileName) : 'Untitled AOP';
  const steps: Step[] = [
    { id: newId('cs-step'), body: normalizeLine([makeChip('ai_extract', 'summary'), txt(' the key details from the email.')]) },
    { id: newId('cs-step'), body: normalizeLine([txt('Search the '), makeChip('kb_search', 'Help center'), txt(' for relevant context.')]) },
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
