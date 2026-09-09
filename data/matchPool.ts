// Trigger matching - the seed data + the matcher behind the "Matching emails"
// evaluation type.
//
// GENERIC by construction (see feedback-reusability-principle): nothing here
// knows which skill is being evaluated. A mailbox's inbound pool is generated
// from topic templates, and relevance comes from ONE config object, the topic
// lexicon: a trigger and an email are compared by the topics their own words
// put them in. Swap the lexicon or the templates and the whole feature re-skins.

import type { SimEmail } from './simFixtures';

// ---------------------------------------------------------------------------
// The topic lexicon: topic -> the words that put a text in that topic. This is
// the only place "meaning" is encoded, and it is config, not logic.
// ---------------------------------------------------------------------------
const TOPIC_LEXICON: Record<string, string[]> = {
  api: ['api', 'endpoint', 'sdk', 'webhook', 'integration', 'rate limit', '404', '500', 'http'],
  error: ['error', 'errors', 'failing', 'failed', 'failure', 'broken', 'not working', 'bug', 'crash', 'timeout', 'status issue'],
  billing: ['invoice', 'charge', 'charged', 'billing', 'payment', 'card', 'subscription', 'plan price', 'overcharge'],
  refund: ['refund', 'refunded', 'cancel', 'cancellation', 'money back'],
  access: ['log in', 'login', 'sign in', 'signin', 'password', 'locked out', 'access', 'permission', 'two-factor'],
  order: ['order', 'shipping', 'tracking', 'delivery', 'package', 'shipment', 'dispatch'],
  feature: ['feature', 'roadmap', 'suggestion', 'improvement', 'wish'],
  data: ['export', 'csv', 'report', 'records', 'sync', 'syncing', 'import', 'backup'],
  account: ['account', 'workspace', 'seat', 'invite', 'teammate', 'member', 'upgrade', 'downgrade'],
  security: ['security', 'breach', 'phishing', 'suspicious', 'vulnerability', 'compliance'],
  howto: ['how do i', 'how can i', 'where do i', 'documentation', 'docs', 'walk me through'],
};

const STOPWORDS = new Set([
  'when', 'an', 'a', 'the', 'and', 'or', 'for', 'from', 'that', 'this', 'with', 'about',
  'into', 'their', 'there', 'here', 'they', 'them', 'have', 'has', 'been', 'will', 'would',
  'email', 'emails', 'arrives', 'arrive', 'customer', 'customers', 'reporting', 'reports',
  'asks', 'asking', 'comes', 'someone', 'anyone', 'please', 'thanks',
]);

// Topics that describe the MANNER of a request rather than its subject. A
// trigger about API errors should not pull in "I got an error signing in" just
// because both say "error", so a broad topic only decides a match when the
// trigger has nothing more specific to go on.
const BROAD_TOPICS = new Set(['error', 'howto']);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// One matcher per topic, compiled once. Whole-word (or whole-phrase) matching
// matters: "reporting an error" must not count as the data topic via "report".
const TOPIC_PATTERNS: [string, RegExp][] = Object.entries(TOPIC_LEXICON).map(([topic, kws]) => [
  topic,
  new RegExp(`(^|[^a-z0-9])(${kws.map(escape).join('|')})([^a-z0-9]|$)`, 'i'),
]);

/** The topics a piece of text belongs to, by its own words. */
export function topicsOf(text: string): string[] {
  return TOPIC_PATTERNS.filter(([, re]) => re.test(text)).map(([topic]) => topic);
}

/** Significant words, for the fallback when a trigger sits in no known topic. */
function keywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 5 && !STOPWORDS.has(w)),
  );
}

/**
 * Does this email match the trigger?
 *
 * The trigger's SPECIFIC topics decide it: an "API status issue" trigger keeps
 * the inbox's API mail and leaves a login error alone. When a trigger is written
 * only in broad terms ("when something is not working"), those broad topics
 * decide instead, and a trigger in no known topic falls back to word overlap -
 * so every trigger matches something sensible rather than nothing.
 */
export function matchesTrigger(email: SimEmail, trigger: string): boolean {
  const triggerText = trigger.trim();
  if (!triggerText) return false;
  const emailText = `${email.subject} ${email.preview}`;
  const tTopics = topicsOf(triggerText);
  if (tTopics.length > 0) {
    const eTopics = new Set(topicsOf(emailText));
    const specific = tTopics.filter((t) => !BROAD_TOPICS.has(t));
    const decisive = specific.length > 0 ? specific : tTopics;
    return decisive.some((topic) => eTopics.has(topic));
  }
  const tWords = keywords(triggerText);
  if (tWords.size === 0) return false;
  const eWords = keywords(emailText);
  let shared = 0;
  tWords.forEach((w) => {
    if (eWords.has(w)) shared += 1;
  });
  return shared >= 2;
}

// ---------------------------------------------------------------------------
// The inbound pool. Templates carry a subject, a preview, a coherent drafted
// reply, and (for a few) a scripted run outcome so evaluating matched mail
// exercises every result state. Placeholder content, no real customer.
// ---------------------------------------------------------------------------
interface Template {
  subject: string;
  preview: string;
  draft: string;
  outcome?: SimEmail['outcome'];
  failAt?: number;
}

const TEMPLATES: Template[] = [
  // --- api / error
  {
    subject: 'Getting 500 errors on the export API',
    preview: 'Our nightly export job has been failing with 500 Internal Server Error since yesterday. Nothing changed on our side.',
    draft: 'Thanks for the report. The export endpoint returned 500s during last night\'s window; the job has been restarted and I am tracking the root cause with the team.',
    outcome: 'errored',
    failAt: 4,
  },
  {
    subject: '404 on the orders endpoint after the upgrade',
    preview: 'Since we moved to the latest SDK every call to the orders endpoint comes back 404, but the docs still list the route.',
    draft: 'Thanks for flagging this. The route moved in the latest release, so the old path now returns 404 - updating to the new path resolves it, and the changelog lists the full mapping.',
  },
  {
    subject: 'Webhook deliveries stopped arriving',
    preview: 'Our webhook receiver has gone quiet since the weekend. Test deliveries return 404 and nothing reaches our queue.',
    draft: 'Thanks for the details. Several webhook routes were renamed, so the old paths now return 404. Remapping to the new routes restores delivery, and I can confirm the mapping for your endpoints.',
    outcome: 'approval',
  },
  {
    subject: 'API rate limit hit much earlier than expected',
    preview: 'We are getting 429s at roughly half our documented rate limit, and the retry headers look inconsistent.',
    draft: 'Thanks for the numbers. Your account was on an older limit tier, which explains the early 429s; I have raised it to your plan default and the retry headers should now be consistent.',
  },
  {
    subject: 'Integration broken after the release',
    preview: 'Something in the last release broke our integration. Requests that worked on Friday now fail with a timeout.',
    draft: 'Sorry about the disruption. The timeouts trace to a change in the request handler; a fix is rolling out, and I will confirm here once your integration is clear.',
    outcome: 'attention',
  },
  // --- billing / refund
  {
    subject: 'Charged twice for this month',
    preview: 'My card was charged twice on the same day for one subscription. I only have one active plan.',
    draft: 'Thanks for flagging this. I can see the duplicate charge and have refunded it; it should land in 5-7 business days. Your subscription itself is unaffected.',
  },
  {
    subject: 'Invoice total looks wrong',
    preview: 'This month\'s invoice is higher than my plan price and there is an extra line item with no description.',
    draft: 'Thanks for checking before paying. The extra line is a proration from your mid-cycle plan change; the next invoice returns to your standard price. Happy to send a breakdown.',
  },
  {
    subject: 'Request to cancel and refund my plan',
    preview: 'My project wrapped up, so I would like to cancel. I was also charged a few days ago and wanted to ask about a refund.',
    draft: 'Sorry to see you go. Your subscription is cancelled so it will not renew, and since you are inside the refund window I have refunded the recent charge.',
  },
  {
    subject: 'Payment method declined and workspace locked',
    preview: 'My payment failed this morning and now the whole workspace is locked. My bank says the card is fine.',
    draft: 'Sorry for the trouble. The last charge was declined, which put the workspace on hold. Updating the card and retrying the payment restores access immediately.',
  },
  // --- access
  {
    subject: 'I cannot log into my account',
    preview: 'I keep getting an error when I try to sign in, even after resetting my password twice.',
    draft: 'Sorry you are locked out. I cleared the stale session on your account, so a fresh password reset should sign you in. Reply here if it still fails and I will escalate.',
  },
  {
    subject: 'Locked out after enabling two-factor',
    preview: 'I set up two-factor authentication and now my codes are rejected on every sign in attempt.',
    draft: 'Thanks for the detail. I have reset the two-factor enrolment on your account, so your next sign in will walk you through setting it up again.',
  },
  {
    subject: 'Permission error opening a shared view',
    preview: 'A teammate shared a view with me but opening it returns a permission error.',
    draft: 'Thanks for reporting this. The view was shared before your role change, so the old permission no longer applied. I have re-granted access and it opens now.',
  },
  // --- order
  {
    subject: 'My order has not arrived yet',
    preview: 'It has been two weeks since the shipping confirmation and the tracking still shows no movement.',
    draft: 'Sorry for the wait. The carrier never scanned the package after the label was created, so I have arranged a replacement shipment with tracking.',
    outcome: 'attention',
  },
  {
    subject: 'Tracking link shows the wrong destination',
    preview: 'The tracking page for my shipment lists a city I have never lived in. Has my delivery been misrouted?',
    draft: 'Thanks for catching that. The shipment was misrouted at the sorting hub; it is back on the correct route and the tracking page now shows your address.',
  },
  {
    subject: 'Need to change the delivery address on an order',
    preview: 'I ordered to my old address by mistake. Can the delivery still be redirected?',
    draft: 'Yes, the order has not been dispatched yet, so I have updated the delivery address. You will get a fresh confirmation shortly.',
  },
  // --- data
  {
    subject: 'Data export is missing recent records',
    preview: 'The CSV export I pulled this morning is missing everything created in the last few days.',
    draft: 'Thanks for the report. The export was reading a lagging replica, so the newest records were absent. It now runs against live data - a fresh export will be complete.',
    outcome: 'attention',
  },
  {
    subject: 'Sync between devices stopped working',
    preview: 'Changes I make on the web do not show up on my phone, and the mobile app loads a blank screen.',
    draft: 'Thanks for the detail. I re-synced your account, so signing out and back in on mobile restores your data. Tell me if anything is still missing.',
  },
  {
    subject: 'Scheduled report never arrived',
    preview: 'My weekly report has not been delivered for two weeks, though the schedule still shows as active.',
    draft: 'Thanks for flagging this. The schedule was pointing at a deleted recipient list, which silently dropped the delivery. It is repointed and the next run will send.',
  },
  // --- account
  {
    subject: 'How do I invite my teammates?',
    preview: 'We just upgraded and I would like to add the rest of my team, but I cannot find where to send invites.',
    draft: 'Congratulations on the upgrade. Invites live in Settings, Members, Invite people - add their emails and pick a role. Seats come from your plan.',
  },
  {
    subject: 'Need more seats on our workspace',
    preview: 'We have run out of seats mid-project and need to add four more people this week.',
    draft: 'Happy to help. I have added four seats to your workspace, prorated to your current cycle, so you can invite the new members right away.',
  },
  {
    subject: 'Merge two workspaces into one',
    preview: 'Two teams here signed up separately and we would like everything under a single workspace.',
    draft: 'That is possible. I can move the smaller workspace\'s members and content into the main one; confirm which should be the destination and I will schedule it.',
    outcome: 'approval',
  },
  // --- feature
  {
    subject: 'Can you add a dark mode?',
    preview: 'Love the product, but the bright theme is hard on the eyes at night. Is a dark mode on the roadmap?',
    draft: 'Thanks for the kind words and the suggestion. Dark mode is on the roadmap; I have added your vote to the request and will let you know when it ships.',
  },
  {
    subject: 'Feature request: bulk edit',
    preview: 'Editing records one at a time is slow for us. Any chance of a bulk edit action?',
    draft: 'Thanks for the suggestion. Bulk edit is in our backlog with several similar requests; I have attached your use case so the team can size it properly.',
  },
  {
    subject: 'Suggestion for the mobile app',
    preview: 'The mobile app would be much more useful with offline access to recent items.',
    draft: 'Thanks for the idea. Offline access to recent items is not available today; I have logged your suggestion with the mobile team and noted your use case.',
  },
  // --- security
  {
    subject: 'Suspicious login alert on our account',
    preview: 'We received an alert about a sign in from an unfamiliar location and want to confirm it was not a breach.',
    draft: 'Thanks for checking quickly. The sign in came from a known device on a new network, and no data was accessed unusually. I have listed the active sessions for your review.',
    outcome: 'approval',
  },
  {
    subject: 'Phishing email pretending to be your support',
    preview: 'One of our staff received an email imitating your support team and asking for credentials.',
    draft: 'Thank you for reporting it - that message did not come from us. I have passed the headers to our security team and nobody from support will ever ask for credentials.',
  },
  {
    subject: 'Where can I find your compliance documentation?',
    preview: 'Our security review needs your latest compliance report and data processing terms.',
    draft: 'Happy to help. The current compliance report and the data processing terms are both in the trust centre; I have sent the direct links for your review.',
  },
  // --- howto
  {
    subject: 'How do I set up a shared inbox?',
    preview: 'I want a shared inbox for the team but cannot work out where to start in the settings.',
    draft: 'Happy to walk you through it. Shared inboxes are created in Settings, Shared inboxes, Add - I have sent the setup guide with the recommended defaults for a small team.',
  },
  {
    subject: 'Where do I change notification settings?',
    preview: 'I get too many notifications and cannot find the place to turn some of them off.',
    draft: 'You can tune these in Settings, Notifications, where each type can be turned off independently. I have included the notification guide in case you want the details.',
  },
  {
    subject: 'Walk me through migrating our old data',
    preview: 'We are moving from another tool and need to bring several years of history with us.',
    draft: 'Happy to help with the migration. The importer handles history in batches; I have sent the migration checklist and can review your file before the first run.',
  },
];

// Generic sender names (placeholder identities, reusability-safe).
const SENDERS = [
  'Ava Johnson', 'Liam Smith', 'Noah Davis', 'Emma Wilson', 'Olivia Brown', 'Mason Lee',
  'Sophia Carter', 'Ethan Clark', 'Isabella Martin', 'James Anderson', 'Mia Thompson',
  'Lucas Reed', 'Amelia Hayes', 'Henry Patel', 'Grace Nakamura', 'Owen Fischer',
  'Chloe Duarte', 'Elias Novak', 'Ruby Osei', 'Felix Moreau', 'Nina Kovac', 'Theo Almeida',
  'Priya Raman', 'Jonas Weber',
];

// How long ago each row arrived - the pool is newest first, so the label grows
// with the index (minutes, then hours, then days).
const ago = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
function receivedLabel(i: number): string {
  if (i === 0) return 'just now';
  if (i < 6) return ago(i * 9, 'min');
  if (i < 30) return ago(Math.max(1, Math.round(i / 5)), 'hr');
  return ago(Math.max(1, Math.round(i / 24)), 'day');
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The scannable ceiling for one mailbox - the backend never reads deeper. */
export const SCAN_CEILING = 200;
/** How many emails one scan batch takes. */
export const SCAN_BATCH = 50;

/**
 * The most recent inbound mail for a mailbox, newest first, up to the ceiling.
 * Deterministic per mailbox: the same mailbox always yields the same inbox, and
 * two mailboxes yield different ones. Co-primes on the template and sender
 * strides keep repeats far apart, the way a real inbox reads.
 */
export function poolForMailbox(mailboxId: string, size = SCAN_CEILING): SimEmail[] {
  if (!mailboxId) return [];
  const seed = hash(mailboxId);
  return Array.from({ length: size }, (_, i) => {
    const t = TEMPLATES[(seed + i * 7) % TEMPLATES.length]!;
    const sender = SENDERS[(seed + i * 11) % SENDERS.length]!;
    return {
      id: `${mailboxId}-m${i}`,
      sender,
      subject: t.subject,
      preview: t.preview,
      body: `Hi,\n\n${t.preview}\n\nCould you take a look?\n\nThanks,\n${sender.split(' ')[0]}`,
      draft: t.draft,
      outcome: t.outcome,
      failAt: t.failAt,
      received: receivedLabel(i),
    };
  });
}
