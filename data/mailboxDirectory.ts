// Per-mailbox directory used by the Enable flow's readiness review: which tags
// already exist in a shared mailbox, and who its members are. Mock/config data
// (frontend-only prototype - stands in for the real per-SM lookup). Any mailbox
// not listed here falls back to the defaults below, so every one of the 20
// pickable mailboxes behaves sensibly without 20 hand-written entries.

export interface MailboxDirectoryEntry {
  /** Tag names that already exist in this mailbox. */
  tags: string[];
  /** Members of this mailbox, by display name. */
  members: string[];
}

/** People an AOP can assign work to (the readiness review treats an Assign
 *  value that matches one of these names as a person - queues and rules are
 *  never membership-checked). */
export const TEAM_MEMBERS = [
  'Varun',
  'Aisha Khan',
  'Daniel Lee',
  'Priya Nair',
  'Tom Becker',
] as const;

// Tags most teams share everywhere - AOP-authored tags like "api-error" or
// "security" only exist where a directory entry says so.
const COMMON_TAGS = ['urgent', 'follow-up', 'vip'];

const DIRECTORY: Record<string, MailboxDirectoryEntry> = {
  support: {
    tags: [...COMMON_TAGS, 'api-error', 'support', 'escalation', 'awaiting-customer'],
    members: ['Varun', 'Aisha Khan', 'Daniel Lee', 'Priya Nair'],
  },
  sales: {
    tags: [...COMMON_TAGS, 'support'],
    members: ['Aisha Khan', 'Tom Becker'],
  },
  marketing: {
    tags: [...COMMON_TAGS],
    members: ['Tom Becker'],
  },
  technical: {
    tags: [...COMMON_TAGS, 'api-error', 'engg', 'dev-support'],
    members: ['Varun', 'Daniel Lee'],
  },
  engineering: {
    tags: [...COMMON_TAGS, 'api-error', 'engg', 'dev-support', 'backlog'],
    members: ['Varun', 'Daniel Lee', 'Priya Nair'],
  },
  billing: {
    tags: [...COMMON_TAGS, 'support'],
    members: ['Priya Nair', 'Tom Becker'],
  },
};

// Unlisted mailboxes: common tags only, staffed by the two "floaters" - so a
// wide selection exercises both the tag-creation and the invite paths.
const FALLBACK: MailboxDirectoryEntry = {
  tags: COMMON_TAGS,
  members: ['Aisha Khan', 'Tom Becker'],
};

export function mailboxDirectory(mailboxId: string): MailboxDirectoryEntry {
  return DIRECTORY[mailboxId] ?? FALLBACK;
}

export function mailboxHasTag(mailboxId: string, tag: string): boolean {
  return mailboxDirectory(mailboxId).tags.some((t) => t.toLowerCase() === tag.toLowerCase());
}

export function mailboxHasMember(mailboxId: string, person: string): boolean {
  return mailboxDirectory(mailboxId).members.some(
    (m) => m.toLowerCase() === person.toLowerCase(),
  );
}

/** Is this Assign value a person we track membership for (vs a queue/rule)? */
export function isTeamMember(name: string): boolean {
  return TEAM_MEMBERS.some((m) => m.toLowerCase() === name.trim().toLowerCase());
}
