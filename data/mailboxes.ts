// Generic shared-mailbox options for the Enable flow's mailbox picker.
// Placeholder / config data - identical regardless of the AOP being built
// (reusability rule: no customer-specific names anywhere user-reachable). Sized
// to ~30+ to exercise the searchable, scrollable picker at realistic scale.

export interface Mailbox {
  id: string;
  name: string;
  address: string;
}

// [id, name, addressLocalPart?] - sensible shared mailboxes. The first six match
// the Figma (Enable modal 724:37307); the rest fill the searchable, scrollable
// list. Address defaults to the id; an explicit 3rd entry overrides it (e.g.
// Technical -> tech@). Generic / config (reusability rule: no customer data).
const RAW: [string, string, string?][] = [
  ['support', 'Support'],
  ['sales', 'Sales'],
  ['marketing', 'Marketing'],
  ['hr', 'HR'],
  ['technical', 'Technical', 'tech'],
  ['customerservice', 'Customer Service'],
  ['billing', 'Billing'],
  ['refunds', 'Refunds'],
  ['onboarding', 'Onboarding'],
  ['success', 'Customer Success'],
  ['partnerships', 'Partnerships'],
  ['finance', 'Finance'],
  ['legal', 'Legal'],
  ['security', 'Security'],
  ['it', 'IT'],
  ['operations', 'Operations'],
  ['product', 'Product'],
  ['engineering', 'Engineering'],
  ['escalations', 'Escalations'],
  ['feedback', 'Feedback'],
];

export const MAILBOXES: Mailbox[] = RAW.map(([id, name, local]) => ({
  id,
  name,
  address: `${local ?? id}@yourco.com`,
}));

export const mailboxName = (id: string): string =>
  MAILBOXES.find((m) => m.id === id)?.name ?? id;

// Full human prose for a set of mailbox ids ("Support", "Support and Billing",
// "Support, Billing, and Refunds"). Used when the count is small.
export function mailboxList(ids: string[]): string {
  const names = ids.map(mailboxName);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

// Count-aware summary that never becomes a wall of text: lists up to `max`
// names, then "and N more". Used by the consequence line + the success toast so
// 30+ selections stay readable.
export function mailboxSummary(ids: string[], max = 3): string {
  if (ids.length === 0) return '';
  if (ids.length <= max) return mailboxList(ids);
  const shown = ids.slice(0, max).map(mailboxName).join(', ');
  return `${shown}, and ${ids.length - max} more`;
}
