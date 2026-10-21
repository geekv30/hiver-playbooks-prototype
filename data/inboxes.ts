// Where a skill runs: a shared mailbox (the email agent) or a chat inbox (the
// chat agent). One lookup for both, so a surface that lists runs from either
// channel names and marks them the same way. The ids never collide - chat
// inboxes and mailboxes are separate pools (see data/mailboxes and
// data/chatFixtures).

import { MAILBOXES } from './mailboxes';
import { CHAT_INBOXES } from './chatFixtures';

export type Channel = 'email' | 'chat';

export const inboxChannel = (id: string): Channel =>
  CHAT_INBOXES.some((c) => c.id === id) ? 'chat' : 'email';

export const inboxName = (id: string): string =>
  MAILBOXES.find((m) => m.id === id)?.name ?? CHAT_INBOXES.find((c) => c.id === id)?.name ?? id;

/** Plain prose for a set of inboxes of either kind: "Support", "Support and
 *  Website chat", "Support, Billing, and 2 more". */
export function inboxSummary(ids: string[], max = 3): string {
  const names = ids.map(inboxName);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  if (names.length <= max) {
    return names.length === 2
      ? `${names[0]} and ${names[1]}`
      : `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  }
  return `${names.slice(0, max).join(', ')}, and ${names.length - max} more`;
}
