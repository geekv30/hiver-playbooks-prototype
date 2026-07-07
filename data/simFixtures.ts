// Simulate fixtures - GENERIC, swappable seed data for the Simulate panel.
//
// The 404 / Server / Edge "API" example is the illustrative SEED (it matches the
// Figma answer key). The renderers are generic and data-driven (one renderer per
// pattern), so swapping this array re-skins the whole panel - there is NO
// case-specific content baked into the components. See feedback-reusability-principle.
//
// Sample emails + drafts are written to be COHERENT with their topic (no
// "can't log in" under "404 errors") - believability is part of the craft bar.

// Email-level run outcome. 'errored' = the evaluation itself failed (retryable);
// 'approval' = the AOP drafted a reply but an action requires human sign-off.
// 'failed' is retained for the /atoms gallery specimens only - the live flows use
// 'errored'. (Distinct from the per-STEP StepStatus, which keeps its own 'failed'.)
export type SimStatusKind =
  | 'idle'
  | 'running'
  | 'passed'
  | 'failed'
  | 'attention'
  | 'errored'
  | 'approval';

export interface SimEmail {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  /** Full email body - shown in the conversation-review modal and pre-filled into
   *  the editable field when a scenario is chosen. Falls back to `preview`. */
  body?: string;
  /** Scripted run outcome (default 'passed'). Demonstrates the result states. */
  outcome?: 'passed' | 'attention' | 'errored' | 'approval';
  /** For 'errored': the trace step index that errors (later steps are skipped). */
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
        // Demonstrates the approval-required state: the reply is drafted but held
        // for human sign-off (in production this is driven by the reply action's
        // requiresApproval flag).
        outcome: 'approval',
        draft:
          'Hi Devin, thanks for the details. The v1.2.1 upgrade renamed several webhook routes, so the old paths now return 404. Remapping to the new routes (listed in the v1.2.1 changelog) restores delivery - happy to confirm the mapping for your endpoints.',
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
        outcome: 'errored',
        failAt: 4, // KB lookup times out (index in SIM_TRACE, after the thinking step)
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

// Full bodies for the flattened AI scenarios - pre-filled into the editable field
// when a scenario is chosen (Figma 1752:21176). Coherent with each scenario's
// subject/preview; kept in the data layer so the renderers stay generic.
const SCENARIO_BODIES: Record<string, string> = {
  e1: "Hi there,\n\nSince this morning, every call to /v2/orders comes back with a 404 Not Found, but your API docs still list the route as active. We haven't changed anything on our end.\n\nDid the endpoint move or get renamed? This is blocking our order sync.\n\nThanks,\nMaria Gomez",
  e2: "Hello,\n\nAfter upgrading the SDK to v1.2.1, our webhook receiver started returning 404 for routes that worked perfectly yesterday. Rolling back fixes it, so it looks tied to the upgrade.\n\nCan you help us trace which routes changed in v1.2.1?\n\nBest,\nDevin Park",
  e3: "Hi,\n\nWe're seeing intermittent 500 Internal Server Errors on the checkout API for the last 20 minutes or so - maybe one in every five requests. Customers are hitting failed payments.\n\nIs there an incident open on your side? Happy to share request IDs.\n\nRegards,\nAisha Khan",
  e4: "Hello,\n\nThe reporting endpoint has returned 503 Service Unavailable since your last deploy. Our dashboards are all blank as a result, and retries don't help.\n\nCould you check whether the reporting service came back up cleanly after the deploy?\n\nThanks,\nTom Becker",
  e5: "Hi,\n\nWhen we POST an empty body, the API responds with 200 OK rather than a 400 validation error. That quietly breaks our retry logic, since we treat 200 as success.\n\nShouldn't an empty payload be rejected? Wanted to flag it in case it's unintended.\n\nBest,\nPriya Nair",
  e6: "Hello,\n\nBatch imports over about 5,000 rows time out with no error code returned at all. Because there's no error, we can't tell whether the import partially applied or failed entirely.\n\nIs there a size limit we should be chunking under? Some signal on partial failures would help a lot.\n\nThanks,\nLuca Rossi",
};

// Flattened AI scenarios (Figma 1752:20293) - the topic grouping is gone; the AI
// scenarios flow now shows a single flat list. Derived from SIM_TOPICS (so the
// content stays in one place) with a full body attached for the editable field.
export const SIM_SCENARIOS: SimEmail[] = SIM_TOPICS.flatMap((t) => t.emails).map((e) => ({
  ...e,
  body: SCENARIO_BODIES[e.id] ?? e.preview,
}));

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
    body:
      "Hi there,\n\nI keep getting an error when I try to sign in, even after resetting my password twice. The page just reloads without letting me through, and I'm not seeing any specific error message.\n\nCould you help me get back in? I have a report due today that I can't access.\n\nThanks,\nAva Johnson",
    draft:
      "Hi Ava, thanks for reaching out - sorry you're locked out. I've cleared the stale session on your account, so a fresh password reset should sign you in. If it still fails, reply here and I'll escalate right away.",
  },
  {
    id: 're2',
    sender: 'Liam Smith',
    subject: 'Trouble with my subscription payment',
    preview:
      'My card was charged twice for this month and I want to make sure the duplicate charge gets refunded.',
    body:
      "Hello,\n\nI noticed my card was charged twice for this month's subscription - two identical charges on the same day. I only have one active plan, so the second one looks like a duplicate.\n\nCould you confirm and refund the extra charge? Happy to send the transaction IDs if that helps.\n\nBest,\nLiam Smith",
    draft:
      'Hi Liam, thanks for flagging this. I can see the duplicate charge and have issued a refund for it - it should land in 5-7 business days. Your subscription itself is active and unaffected.',
  },
  {
    id: 're3',
    sender: 'Noah Davis',
    subject: "My order hasn't arrived yet",
    preview:
      "It's been two weeks since I got the shipping confirmation but the tracking still shows no movement.",
    body:
      "Hi,\n\nIt's been two weeks since I received the shipping confirmation, but the tracking link still shows no movement past the initial label creation. I'm starting to worry the package is lost.\n\nCan you look into where my order is? Order reference is in the subject of the original confirmation.\n\nThanks,\nNoah Davis",
    outcome: 'attention',
  },
  {
    id: 're4',
    sender: 'Emma Wilson',
    subject: 'Can you add a dark mode?',
    preview:
      'Love the product, but the bright theme is hard on the eyes at night. Is a dark mode on the roadmap?',
    body:
      "Hey team,\n\nI really love the product and use it every day. My one request: the bright theme is hard on the eyes when I work late at night.\n\nIs a dark mode on the roadmap anywhere? Would be a huge quality-of-life improvement.\n\nCheers,\nEmma Wilson",
    draft:
      "Hi Emma, thanks for the kind words and the suggestion. A dark mode is on our roadmap - I've added your vote to the request so the team can prioritize it, and I'll let you know when it ships.",
  },
  {
    id: 're5',
    sender: 'Olivia Brown',
    subject: 'Invoice total looks wrong',
    preview:
      "This month's invoice is higher than my plan price and I don't see what the extra line item is for.",
    body:
      "Hi,\n\nThis month's invoice came in higher than my usual plan price. There's an extra line item I don't recognize, and there's no description next to it explaining what it covers.\n\nCould you break down what the extra charge is for? I want to make sure it's expected before I pay.\n\nRegards,\nOlivia Brown",
    draft:
      'Hi Olivia, thanks for flagging this. The extra line is a one-off proration from your mid-cycle plan change; the next invoice returns to your standard plan price. I can send a detailed breakdown if helpful.',
  },
  {
    id: 're6',
    sender: 'Mason Lee',
    subject: 'Getting 500 errors on the export API',
    preview:
      'Our nightly export job has been failing with 500 Internal Server Error since yesterday. Can you check?',
    body:
      "Hello,\n\nOur nightly export job has been failing with a 500 Internal Server Error since yesterday evening. Nothing changed on our side, and the same request worked fine two days ago.\n\nCan you check whether something changed with the export endpoint? This is blocking our morning reports.\n\nThanks,\nMason Lee",
    outcome: 'errored',
    failAt: 4,
  },
  {
    id: 're7',
    sender: 'Sophia Carter',
    subject: "I'm unable to access my account",
    preview:
      "I'm facing issues with syncing across my devices and my info won't load on the mobile app at all.",
    body:
      "Hi,\n\nI'm having trouble syncing across my devices - changes I make on the web don't show up on my phone. On top of that, my info won't load on the mobile app at all; it just spins on a blank screen.\n\nCould you help me get everything synced again? I mostly work from mobile.\n\nThanks,\nSophia Carter",
    draft:
      "Hi Sophia, thanks for reaching out. I've re-synced your account on our end, so signing out and back in on the mobile app should restore your data. If anything is still missing, reply here and I'll take a closer look.",
  },
  {
    id: 're8',
    sender: 'Noah Johnson',
    subject: "I'm having issues with my subscription payment",
    preview:
      'My payment method was declined and I need to regain access to my workspace as soon as possible.',
    body:
      "Hi,\n\nMy payment method was declined this morning and now my workspace is locked. I've confirmed with my bank that the card is fine, so I'm not sure why the charge failed.\n\nI need to regain access as soon as possible - my team is blocked. What are my options?\n\nRegards,\nNoah Johnson",
    draft:
      'Hi Noah, sorry for the trouble. Your bank declined the last charge, so the workspace is on hold. Updating the card on the billing page and retrying the payment will restore access immediately - I can also send a secure payment link if that is easier.',
  },
  {
    id: 're9',
    sender: 'Isabella Martin',
    subject: 'How do I invite my teammates?',
    preview:
      "We just upgraded and I'd like to add the rest of my team, but I can't find where to send invites.",
    body:
      "Hello,\n\nWe just upgraded our plan and I'd like to add the rest of my team. I've looked around the settings but can't find where to send invites.\n\nCould you point me to the right place? There are about eight people I need to add.\n\nThanks,\nIsabella Martin",
    draft:
      'Hi Isabella, congratulations on the upgrade. You can invite teammates from Settings > Members > Invite people - just add their emails and pick a role. Invites are seat-based on your plan, and I am happy to walk through it if useful.',
  },
  {
    id: 're10',
    sender: 'James Anderson',
    subject: 'Webhook deliveries stopped after the update',
    preview:
      'Since the latest release our webhooks return 404 on the old paths and our integration has gone quiet.',
    body:
      "Hi,\n\nSince the latest release, our webhooks have gone quiet. When I test the old delivery paths they now return a 404, so our integration has effectively stopped receiving events.\n\nDid the webhook routes change in this release? If so, can you point me to the new paths?\n\nThanks,\nJames Anderson",
    outcome: 'approval',
    draft:
      'Hi James, thanks for the details. The recent upgrade renamed several webhook routes, so the old paths now return 404. Remapping to the new routes (listed in the changelog) restores delivery - happy to confirm the mapping for your endpoints.',
  },
  {
    id: 're11',
    sender: 'Mia Thompson',
    subject: 'Request to cancel and refund my plan',
    preview:
      "I'd like to cancel my subscription and check whether this month's charge can be refunded.",
    body:
      "Hi,\n\nI'd like to cancel my subscription - my project wrapped up and I no longer need the tool. I was also charged for this month a couple of days ago, so I wanted to check whether that charge can be refunded.\n\nCould you help me cancel and let me know about the refund?\n\nThanks,\nMia Thompson",
    draft:
      "Hi Mia, sorry to see you go. I've canceled your subscription so it won't renew, and since you're within the refund window I've refunded this month's charge - it should appear in 5-7 business days.",
  },
  {
    id: 're12',
    sender: 'Ethan Clark',
    subject: 'Data export is missing recent records',
    preview:
      "The CSV export I pulled this morning is missing everything created in the last few days. Is that expected?",
    body:
      "Hello,\n\nThe CSV export I pulled this morning is missing everything created in the last few days - older records are all there, but nothing recent shows up.\n\nIs that expected behavior, or is the export lagging behind? I need today's data for a reconciliation.\n\nThanks,\nEthan Clark",
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
  // Rendered with "ELSE" emphasised in RunOutcome (Figma 1769:20959).
  noBranchBody:
    'This email did not match any branch in the AOP. Add an ELSE branch to handle cases like it.',
  noBranchTrace: 'no matching branch for this email',
  stepError: 'Request failed, no response',
  // Errored (retryable evaluation error) - Figma 1769:20792, grammar-corrected.
  erroredBody: 'Something went wrong, please retry the evaluation.',
  // Approval-required (Figma 1839:33930 / trace 1839:34067).
  approvalTrace: 'Approval needed',
  declinedBody: 'Reply declined. The AOP held this reply for sign-off.',
} as const;
