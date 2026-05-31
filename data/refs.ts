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

// GENERIC, case-agnostic references ONLY. These ticket/email fields exist on
// any conversation regardless of the problem being solved — never story data
// (no tour/dietary/bookings). "From earlier steps" outputs are derived
// dynamically from the current doc, not hardcoded here.
export const DEFAULT_REFS: Ref[] = [
  { id: 'ref-from-email', path: 'ticket.from_email', label: 'Customer email', type: 'email',    desc: 'sender address',          group: 'ticket' },
  { id: 'ref-from-name',  path: 'ticket.from_name',  label: 'Customer name',  type: 'text',     desc: 'sender name',             group: 'ticket' },
  { id: 'ref-subject',    path: 'ticket.subject',    label: 'Subject line',   type: 'text',     desc: 'email subject',           group: 'ticket' },
  { id: 'ref-body',       path: 'ticket.body',       label: 'Message body',   type: 'longtext', desc: 'full message',            group: 'ticket' },
  { id: 'ref-status',     path: 'ticket.status',     label: 'Status',         type: 'enum',     desc: 'open / pending / closed', group: 'ticket' },
  { id: 'ref-priority',   path: 'ticket.priority',   label: 'Priority',       type: 'enum',     desc: 'ticket priority',         group: 'ticket' },
  { id: 'ref-assignee',   path: 'ticket.assignee',   label: 'Assignee',       type: 'text',     desc: 'current owner',           group: 'ticket' },
  { id: 'ref-created',    path: 'ticket.created_at', label: 'Created date',   type: 'date',     desc: 'when it arrived',         group: 'ticket' },
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
