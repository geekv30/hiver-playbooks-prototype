// Simulate fixtures — GENERIC, swappable seed data for the Simulate panel.
//
// The 404 / Server / Edge "API" example is the illustrative SEED (it matches the
// Figma answer key). The renderers are generic and data-driven (one renderer per
// pattern), so swapping this array re-skins the whole panel — there is NO
// case-specific content baked into the components. See feedback-reusability-principle.
//
// Sample emails are written to be COHERENT with their topic (no "can't log in"
// under "404 errors") — believability is part of the craft bar.

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
      },
      {
        id: 'e2',
        sender: 'Devin Park',
        subject: 'Getting 404s after the v1.2.1 upgrade',
        preview:
          'After upgrading the SDK to v1.2.1 our webhook receiver returns 404 for routes that worked yesterday. Can you help us trace it?',
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
