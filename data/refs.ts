import type { Ref } from '@/types/playbook';

export interface RefGroup {
  key: Ref['group'];
  label: string;
}

export const REF_GROUPS: RefGroup[] = [
  { key: 'ticket',  label: 'Ticket fields' },
  { key: 'inputs',  label: 'Trigger inputs' },
  { key: 'outputs', label: 'From earlier steps' },
];

export const DEFAULT_REFS: Ref[] = [
  // ticket - inbound message fields, always in scope
  { id: 'ref-ticket-from-email', path: 'ticket.from_email', label: 'Customer email', type: 'email',    desc: 'sender',              group: 'ticket' },
  { id: 'ref-ticket-subject',    path: 'ticket.subject',    label: 'Subject line',   type: 'text',     desc: 'email subject',       group: 'ticket' },
  { id: 'ref-ticket-body',       path: 'ticket.body',       label: 'Email body',     type: 'longtext', desc: 'full message',        group: 'ticket' },

  // inputs - trigger frontmatter fields the playbook reads
  { id: 'ref-tour-name',         path: 'tour.name',         label: 'Tour name',      type: 'text',     desc: 'which tour they asked about', group: 'inputs' },
  { id: 'ref-tour-dates',        path: 'tour.dates',        label: 'Tour dates',     type: 'date',     desc: 'requested travel dates',      group: 'inputs' },
  { id: 'ref-tour-group-size',   path: 'tour.group_size',   label: 'Group size',     type: 'number',   desc: 'number of guests',            group: 'inputs' },

  // outputs - produced by earlier steps
  { id: 'ref-bookings-available', path: 'bookings.available', label: 'Bookings status', type: 'enum',  desc: 'step 02 · yes/partial/full', group: 'outputs' },
  { id: 'ref-customer-is-repeat', path: 'customer.is_repeat', label: 'Repeat guest',    type: 'bool',  desc: 'step 03 · returning flag',   group: 'outputs' },
  { id: 'ref-kb-overview',        path: 'kb.overview',        label: 'Tour overview',   type: 'doc',   desc: 'step 04 · KB article',       group: 'outputs' },
  { id: 'ref-kb-fitness',         path: 'kb.fitness',         label: 'Fitness guide',   type: 'doc',   desc: 'step 04 · KB article',       group: 'outputs' },
  { id: 'ref-kb-dietary',         path: 'kb.dietary',         label: 'Dietary FAQ',     type: 'doc',   desc: 'step 04 · KB article',       group: 'outputs' },
  { id: 'ref-step5-draft',        path: 'step5.draft',        label: 'Draft reply',     type: 'draft', desc: 'step 05 · drafted text',     group: 'outputs' },
];

export function refsByGroup(group: Ref['group']): Ref[] {
  return DEFAULT_REFS.filter((r) => r.group === group);
}

export function findRef(id: string): Ref | undefined {
  return DEFAULT_REFS.find((r) => r.id === id);
}

export function findRefByPath(path: string): Ref | undefined {
  return DEFAULT_REFS.find((r) => r.path === path);
}
