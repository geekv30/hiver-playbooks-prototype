import type { ConnectorSlug } from '@/types/playbook';
import { ACTIONS } from '@/data/library';
import { CONNECTOR_META } from '@/data/connectors';
import { DEFAULT_REFS } from '@/data/refs';
import { KB_SOURCES } from '@/data/knowledgeSources';

// The command-palette catalog (Figma 283:28427). Two root groups: Actions +
// Connectors. Connectors drill into their verbs; parameterized actions drill
// into a value-picker (a tag list, an assignee list, etc.) on a second page.

export interface PaletteAction {
  /** an ACTIONS id, or the sentinel 'reference' (the @-mention insert). */
  id: string;
  label: string;
}

export const REFERENCE_ID = 'reference';

// Curated "Actions" group - the five the Figma shows first (verbatim), then the
// rest of the vocabulary in plain labels.
export const PALETTE_ACTIONS: PaletteAction[] = [
  { id: 'wait', label: 'Wait' },
  { id: 'tag', label: 'Add a tag' },
  { id: REFERENCE_ID, label: 'Reference' },
  { id: 'kb_search', label: 'Search Knowledge Hub' },
  { id: 'condition', label: 'Condition' },
  { id: 'ai_extract', label: 'AI Extract' },
  { id: 'summarize', label: 'Summarize' },
  { id: 'draft_reply', label: 'Draft a reply' },
  { id: 'send_reply', label: 'Send a reply' },
  { id: 'note', label: 'Add a note' },
  { id: 'assign', label: 'Assign' },
  { id: 'change_status', label: 'Change status' },
  { id: 'set_field', label: 'Set a field' },
  { id: 'approval', label: 'Request approval' },
  { id: 'wait_for_reply', label: 'Wait for reply' },
  { id: 'end', label: 'End AOP' },
];

// Connectors shown as brands (proper brand casing, not the Figma's "Hubspot"/"Clickup").
export const PALETTE_CONNECTORS: ConnectorSlug[] = [
  'hubspot',
  'shopify',
  'slack',
  'salesforce',
  'clickup',
];

export function connectorName(slug: ConnectorSlug): string {
  return CONNECTOR_META[slug].name;
}

// A connector's verbs, label stripped of the "Brand · " prefix ("Get contact").
export function connectorVerbs(slug: ConnectorSlug): { id: string; label: string }[] {
  return ACTIONS.filter((a) => a.connectorSlug === slug).map((a) => {
    const dot = a.name.indexOf(' · ');
    return { id: a.id, label: dot > -1 ? a.name.slice(dot + 3) : a.name };
  });
}

// A connector's tools for the setup modal's "what the AI agent can show" grid:
// the verb label + its one-line description, derived from the catalog (so the
// list stays in sync with the connector's real actions - no duplicated copy).
export function connectorTools(slug: ConnectorSlug): { label: string; desc: string }[] {
  return ACTIONS.filter((a) => a.connectorSlug === slug).map((a) => {
    const dot = a.name.indexOf(' · ');
    return { label: dot > -1 ? a.name.slice(dot + 3) : a.name, desc: a.desc };
  });
}

// ---------------------------------------------------------------------------
// Second-page value pickers.
//
// A parameterized action opens a second page inside the palette. Three shapes:
//   pick-one  - choose one option, inserts immediately (Assign, Status, ...)
//   pick-many - check several, confirm with the footer button (Tag)
//   input     - type a free value, Enter inserts (KB search)
// The picked value becomes the chip's meta, so the chip reads e.g. "Tag · VIP".
// Absence from ACTION_BEHAVIOR (or mode 'insert') = insert directly, no page.
// ---------------------------------------------------------------------------

export interface PickerOption {
  id: string;
  label: string;
  /** secondary line (an assignee's role, a field's type). */
  sub?: string;
  /** grouping key (e.g. a knowledge-source TYPE), for pickers that section their rows. */
  group?: string;
}

export type ActionBehavior =
  | { mode: 'insert' }
  | { mode: 'pick-one'; title: string; placeholder: string; options: PickerOption[] }
  | { mode: 'pick-many'; title: string; placeholder: string; options: PickerOption[]; verb: string }
  | { mode: 'input'; title: string; placeholder: string; quote?: boolean };

// ---- PLACEHOLDER illustrative data ----------------------------------------
// NOT a real Hiver account's tags / users / statuses. A believable support-team
// seed so the pickers feel real; swap for live data when wiring to a backend.

// Tag names per the updated Figma (283:28810) - dev-team flavored.
export const SEED_TAGS: PickerOption[] = [
  { id: 'dev-support', label: 'dev-support' },
  { id: 'api-error', label: 'api-error' },
  { id: 'engg', label: 'engg' },
  { id: 'design', label: 'design' },
  { id: 'backlog', label: 'backlog' },
  { id: 'awaiting-customer', label: 'awaiting-customer' },
  { id: 'escalation', label: 'escalation' },
];

// Generic queues + roles only - no named individuals from any one account.
export const SEED_ASSIGNEES: PickerOption[] = [
  { id: 'me', label: 'Me', sub: 'Assign to myself' },
  { id: 'support-queue', label: 'Support queue', sub: 'Shared inbox' },
  { id: 'billing-queue', label: 'Billing queue', sub: 'Shared inbox' },
  { id: 'escalations-queue', label: 'Escalations queue', sub: 'Shared inbox' },
  { id: 'unassigned', label: 'Unassigned', sub: 'Remove the assignee' },
];

export const SEED_STATUSES: PickerOption[] = [
  { id: 'open', label: 'Open' },
  { id: 'pending', label: 'Pending' },
  { id: 'on-hold', label: 'On hold' },
  { id: 'closed', label: 'Closed' },
];

// Generic custom fields a support team might define - no story-specific fields.
export const SEED_FIELDS: PickerOption[] = [
  { id: 'priority', label: 'Priority', sub: 'Single-select' },
  { id: 'category', label: 'Category', sub: 'Single-select' },
  { id: 'sentiment', label: 'Sentiment', sub: 'Single-select' },
  { id: 'order-id', label: 'Order ID', sub: 'Text' },
  { id: 'refund-amount', label: 'Refund amount', sub: 'Number' },
  { id: 'due-date', label: 'Due date', sub: 'Date' },
];

// Knowledge Hub sources as picker options. Built from the single KB_SOURCES seed
// (data/knowledgeSources) so the picker, the commit value, and the reconfigure
// round-trip all share one source of truth. `group` carries the source TYPE so
// the picker can section + icon its rows.
export const SEED_KB_SOURCES: PickerOption[] = KB_SOURCES.map((s) => ({
  id: s.id,
  label: s.name,
  sub: s.sub,
  group: s.type,
}));

export const WAIT_PRESETS: PickerOption[] = [
  { id: '30m', label: '30 minutes' },
  { id: '1h', label: '1 hour' },
  { id: '4h', label: '4 hours' },
  { id: '1bd', label: '1 business day' },
  { id: '2d', label: '2 days' },
  { id: '1w', label: '1 week' },
];

// Reference picker - the @-mention's second page. Pick a field / step output;
// the chosen path becomes a @ref token (handled specially on insert).
export const REFERENCE_OPTIONS: PickerOption[] = DEFAULT_REFS.map((r) => ({
  id: r.path,
  label: r.label,
  sub: r.path,
}));

export const ACTION_BEHAVIOR: Record<string, ActionBehavior> = {
  tag: { mode: 'pick-many', title: 'Add a tag', placeholder: 'Search tags...', options: SEED_TAGS, verb: 'Add' },
  assign: { mode: 'pick-one', title: 'Assign to', placeholder: 'Search people & queues...', options: SEED_ASSIGNEES },
  change_status: { mode: 'pick-one', title: 'Set status', placeholder: 'Search statuses...', options: SEED_STATUSES },
  set_field: { mode: 'pick-one', title: 'Set a custom field', placeholder: 'Search fields...', options: SEED_FIELDS },
  wait: { mode: 'pick-one', title: 'Wait for', placeholder: 'Search durations...', options: WAIT_PRESETS },
  kb_search: { mode: 'pick-many', title: 'Knowledge Hub', placeholder: 'Search sources...', options: SEED_KB_SOURCES, verb: 'Search' },
  [REFERENCE_ID]: { mode: 'pick-one', title: 'Insert a reference', placeholder: 'Search fields & step outputs...', options: REFERENCE_OPTIONS },
};

export function actionBehavior(id: string): ActionBehavior {
  return ACTION_BEHAVIOR[id] ?? { mode: 'insert' };
}
