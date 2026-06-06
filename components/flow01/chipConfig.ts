import type { Chip } from '@/types/playbook';
import { findAction } from '@/data/library';
import { actionBehavior, type PickerOption } from './paletteCatalog';

// ---------------------------------------------------------------------------
// Click-to-reconfigure: the spec that drives the in-place ChipConfigPopover.
//
// One source of truth for (a) whether a chip is configurable - so EditorLine
// only makes those chips clickable - and (b) the options to show, pulled from
// the SAME catalog the insert palette uses (ACTION_BEHAVIOR). No case-specific
// content lives here; everything is the generic, pickable enum for the action.
// ---------------------------------------------------------------------------

// Reply is ONE verb with a structured mode (draft | send). It is expressed as
// two action ids in the library; the popover flips a placed chip between them in
// place (no data-model refactor). Labels match the before/after sketch (item 8).
export const DRAFT_REPLY_ID = 'draft_reply';
export const SEND_REPLY_ID = 'send_reply';

export interface ReplyOption {
  actionId: string;
  label: string;
}
export const REPLY_OPTIONS: ReplyOption[] = [
  { actionId: DRAFT_REPLY_ID, label: 'Draft for review' },
  { actionId: SEND_REPLY_ID, label: 'Send immediately' },
];

export type ChipConfigSpec =
  | { kind: 'reply'; title: string; options: ReplyOption[] }
  | { kind: 'pick-one'; title: string; placeholder: string; options: PickerOption[] }
  | { kind: 'pick-many'; title: string; placeholder: string; options: PickerOption[] }
  | { kind: 'input'; title: string; placeholder: string; quote: boolean };

// The reconfigure spec for a chip's action, or null when it carries no pickable
// value (AI Extract, connectors, Note, Approval, End, ...) - those stay inert.
export function chipConfigSpec(actionId: string): ChipConfigSpec | null {
  if (actionId === DRAFT_REPLY_ID || actionId === SEND_REPLY_ID) {
    return { kind: 'reply', title: 'Reply', options: REPLY_OPTIONS };
  }
  const b = actionBehavior(actionId);
  if (b.mode === 'pick-one')
    return { kind: 'pick-one', title: b.title, placeholder: b.placeholder, options: b.options };
  if (b.mode === 'pick-many')
    return { kind: 'pick-many', title: b.title, placeholder: b.placeholder, options: b.options };
  if (b.mode === 'input')
    return { kind: 'input', title: b.title, placeholder: b.placeholder, quote: !!b.quote };
  return null;
}

// True when clicking the chip should open the reconfigure popover - the predicate
// EditorLine uses to decide whether a chip gets a click affordance at all.
export function isConfigurableChip(actionId: string): boolean {
  return chipConfigSpec(actionId) !== null;
}

// The chip's current displayed value (config.meta, else the action's default
// meta) - used to pre-select the popover. Mirrors EditorLine's chipMeta + the
// Chip atom's fallback so the popover opens on what the chip actually shows.
export function readChipMeta(chip: Chip): string {
  const m = chip.config?.meta;
  if (typeof m === 'string') return m;
  return findAction(chip.actionId)?.meta ?? '';
}

// Strip surrounding quotes (KB-search stores its value quoted, e.g. "refund
// policy") so the input opens on the raw text for editing.
export function unquoteMeta(s: string): string {
  return s.replace(/^"([\s\S]*)"$/, '$1');
}

// What the popover emits on commit: a reply mode swaps the action id; every other
// kind sets the chip's meta string. EditorCanvas turns this into the chip update.
export type ChipConfigResult = { kind: 'reply'; actionId: string } | { kind: 'meta'; meta: string };
