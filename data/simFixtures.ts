// Simulate fixtures - GENERIC, swappable seed data for the Simulate panel.
//
// The 404 / Server / Edge "API" example is the illustrative SEED (it matches the
// Figma answer key). The renderers are generic and data-driven (one renderer per
// pattern), so swapping this array re-skins the whole panel - there is NO
// case-specific content baked into the components. See feedback-reusability-principle.
//
// Sample emails + drafts are written to be COHERENT with their topic (no
// "can't log in" under "404 errors") - believability is part of the craft bar.

export type SimStatusKind = 'idle' | 'running' | 'passed' | 'failed' | 'attention';

export interface SimEmail {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  /** Scripted run outcome (default 'passed'). Demonstrates the result states. */
  outcome?: 'passed' | 'failed' | 'attention';
  /** For 'failed': the trace step index that errors (later steps are skipped). */
  failAt?: number;
  /** Drafted reply shown on a passed run (coherent with this email). */
  draft?: string;
}

export interface SimTopic {
  id: string;
  /** Topic name shown on the card (AI-grouped category of past emails). */
  label: string;
  status: SimStatusKind;
  /** How many times this scenario has been run (0 = "no runs yet"). */
  runCount: number;
  emails: SimEmail[];
}

export const SIM_TOPICS: SimTopic[] = [
  {
    id: 'topic-1',
    label: '404 errors',
    status: 'idle',
    runCount: 0,
    emails: [
      {
        id: 'e1',
        sender: 'Maria Gomez',
        subject: '404 on the /v2/orders endpoint',
        preview:
          'Since this morning every call to /v2/orders comes back 404 not found, but the docs still list the route. Did something change?',
        draft:
          "Hi Maria, thanks for flagging this. The 404 on /v2/orders started with the v1.2.1 rollout - the route moved to /v2/order (singular), so updating the path resolves it. I've logged it for the team in case other endpoints are affected.",
      },
      {
        id: 'e2',
        sender: 'Devin Park',
        subject: 'Getting 404s after the v1.2.1 upgrade',
        preview:
          'After upgrading the SDK to v1.2.1 our webhook receiver returns 404 for routes that worked yesterday. Can you help us trace it?',
        draft:
          'Hi Devin, thanks for the detail. The v1.2.1 upgrade renamed several webhook routes, so the old paths now return 404. Remapping to the new routes (listed in the v1.2.1 changelog) restores delivery - happy to confirm the mapping for your endpoints.',
      },
    ],
  },
  {
    id: 'topic-2',
    label: 'Server errors',
    status: 'idle',
    runCount: 0,
    emails: [
      {
        id: 'e3',
        sender: 'Aisha Khan',
        subject: '500s spiking on checkout',
        preview:
          'We are seeing intermittent 500 Internal Server Error on the checkout API for the last 20 minutes. Is there an incident open?',
        draft:
          "Hi Aisha, thanks for the heads-up. We're seeing the elevated 500s on checkout as well and have opened an incident; a fix is rolling out now. I'll follow up the moment it clears - apologies for the disruption.",
      },
      {
        id: 'e4',
        sender: 'Tom Becker',
        subject: '503 from the reporting service',
        preview:
          'The reporting endpoint has returned 503 Service Unavailable since the last deploy. Our dashboards are all blank.',
        outcome: 'failed',
        failAt: 3, // KB lookup times out
      },
    ],
  },
  {
    id: 'topic-3',
    label: 'Edge cases',
    status: 'idle',
    runCount: 0,
    emails: [
      {
        id: 'e5',
        sender: 'Priya Nair',
        subject: 'Empty payload returns 200 instead of 400',
        preview:
          'When we POST an empty body the API responds 200 OK rather than a validation error, which quietly breaks our retry logic.',
        draft:
          "Hi Priya, good catch. An empty body should return a 400 validation error rather than 200 - that's a known gap we're tracking a fix for. In the meantime, validating the payload before the call avoids the silent pass; I'll let you know when the API-side fix ships.",
      },
      {
        id: 'e6',
        sender: 'Luca Rossi',
        subject: 'Large batch import times out silently',
        preview:
          'Batch imports over about 5,000 rows time out with no error code, so we cannot tell whether the import partially applied.',
        outcome: 'attention', // condition matches no branch -> caught gap
      },
    ],
  },
];

// Recent inbound emails for the "Recent emails" eval tab - a GENERIC placeholder
// inbox (no real customer). Run through the same trace fixture as scenarios.
// See feedback-reusability-principle.
export const RECENT_EMAILS: SimEmail[] = [
  {
    id: 're1',
    sender: 'Ava Johnson',
    subject: "I can't log into my account",
    preview:
      'I keep getting an error when I try to sign in, even after resetting my password. Can you help me get back in?',
    draft:
      "Hi Ava, thanks for reaching out - sorry you're locked out. I've cleared the stale session on your account, so a fresh password reset should sign you in. If it still fails, reply here and I'll escalate right away.",
  },
  {
    id: 're2',
    sender: 'Liam Smith',
    subject: 'Trouble with my subscription payment',
    preview:
      'My card was charged twice for this month and I want to make sure the duplicate charge gets refunded.',
    draft:
      'Hi Liam, thanks for flagging this. I can see the duplicate charge and have issued a refund for it - it should land in 5-7 business days. Your subscription itself is active and unaffected.',
  },
  {
    id: 're3',
    sender: 'Noah Davis',
    subject: "My order hasn't arrived yet",
    preview:
      "It's been two weeks since I got the shipping confirmation but the tracking still shows no movement.",
    outcome: 'attention',
  },
  {
    id: 're4',
    sender: 'Emma Wilson',
    subject: 'Can you add a dark mode?',
    preview:
      'Love the product, but the bright theme is hard on the eyes at night. Is a dark mode on the roadmap?',
    draft:
      "Hi Emma, thanks for the kind words and the suggestion. A dark mode is on our roadmap - I've added your vote to the request so the team can prioritise it, and I'll let you know when it ships.",
  },
  {
    id: 're5',
    sender: 'Olivia Brown',
    subject: 'Invoice total looks wrong',
    preview:
      "This month's invoice is higher than my plan price and I don't see what the extra line item is for.",
    draft:
      'Hi Olivia, thanks for flagging this. The extra line is a one-off proration from your mid-cycle plan change; the next invoice returns to your standard plan price. I can send a detailed breakdown if helpful.',
  },
  {
    id: 're6',
    sender: 'Mason Lee',
    subject: 'Getting 500 errors on the export API',
    preview:
      'Our nightly export job has been failing with 500 Internal Server Error since yesterday. Can you check?',
    outcome: 'failed',
    failAt: 3,
  },
  {
    id: 're7',
    sender: 'Sophia Carter',
    subject: "I'm unable to access my account",
    preview:
      "I'm facing issues with syncing across my devices and my info won't load on the mobile app at all.",
    draft:
      "Hi Sophia, thanks for reaching out. I've re-synced your account on our end, so signing out and back in on the mobile app should restore your data. If anything is still missing, reply here and I'll take a closer look.",
  },
  {
    id: 're8',
    sender: 'Noah Johnson',
    subject: "I'm having issues with my subscription payment",
    preview:
      'My payment method was declined and I need to regain access to my workspace as soon as possible.',
    draft:
      'Hi Noah, sorry for the trouble. Your bank declined the last charge, so the workspace is on hold. Updating the card on the billing page and retrying the payment will restore access immediately - I can also send a secure payment link if that is easier.',
  },
  {
    id: 're9',
    sender: 'Isabella Martin',
    subject: 'How do I invite my teammates?',
    preview:
      "We just upgraded and I'd like to add the rest of my team, but I can't find where to send invites.",
    draft:
      'Hi Isabella, congratulations on the upgrade. You can invite teammates from Settings > Members > Invite people - just add their emails and pick a role. Invites are seat-based on your plan, and I am happy to walk through it if useful.',
  },
  {
    id: 're10',
    sender: 'James Anderson',
    subject: 'Webhook deliveries stopped after the update',
    preview:
      'Since the latest release our webhooks return 404 on the old paths and our integration has gone quiet.',
    draft:
      'Hi James, thanks for the details. The recent upgrade renamed several webhook routes, so the old paths now return 404. Remapping to the new routes (listed in the changelog) restores delivery - happy to confirm the mapping for your endpoints.',
  },
  {
    id: 're11',
    sender: 'Mia Thompson',
    subject: 'Request to cancel and refund my plan',
    preview:
      "I'd like to cancel my subscription and check whether this month's charge can be refunded.",
    draft:
      "Hi Mia, sorry to see you go. I've cancelled your subscription so it won't renew, and since you're within the refund window I've refunded this month's charge - it should appear in 5-7 business days.",
  },
  {
    id: 're12',
    sender: 'Ethan Clark',
    subject: 'Data export is missing recent records',
    preview:
      "The CSV export I pulled this morning is missing everything created in the last few days. Is that expected?",
    outcome: 'attention',
  },
];

// Deterministic per-mailbox recent inbound: each mailbox surfaces a stable subset
// of the generic pool (so different mailboxes show different - but consistent -
// emails, instead of the same list everywhere). Generic content, reusability-safe.
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
export function recentForMailbox(mailboxId: string, count = 10): SimEmail[] {
  if (!mailboxId) return [];
  if (hashId(mailboxId) % 7 === 0) return []; // some mailboxes have no recent inbound
  const n = Math.min(count, RECENT_EMAILS.length);
  const start = hashId(mailboxId) % RECENT_EMAILS.length;
  return Array.from({ length: n }, (_, i) => RECENT_EMAILS[(start + i) % RECENT_EMAILS.length]!);
}

// Outcome narrative copy - kept in the data layer (not baked into renderers) so
// the components stay generic and other outcomes can reuse them. See
// feedback-reusability-principle.
export const SIM_COPY = {
  noBranchHead: 'No matching branch',
  noBranchBody:
    'This email did not match any branch in the playbook. Add an ELSE branch to handle cases like it.',
  noBranchTrace: 'no matching branch for this email',
  stepError: 'Request failed, no response',
  failedHead: 'Run failed',
  failedBody:
    'A step in the playbook failed, so the run stopped before drafting a reply. Check the trace below for where it broke.',
} as const;

// One label helper for both the topic card and the topic header (DRY).
export function topicStatusLabel(t: SimTopic): string {
  if (t.status === 'idle') return 'no runs yet';
  const runs = `${t.runCount} run${t.runCount === 1 ? '' : 's'}`;
  switch (t.status) {
    case 'passed':
      return `Passed · ${runs}`;
    case 'failed':
      return `Failed · ${runs}`;
    case 'attention':
      return `Needs attention · ${runs}`;
    case 'running':
      return 'Running…';
    default:
      return runs;
  }
}
