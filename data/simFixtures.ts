// Simulate fixtures — GENERIC, swappable seed data for the Simulate panel.
//
// The 404 / Server / Edge "API" example is the illustrative SEED (it matches the
// Figma answer key). The renderers are generic and data-driven (one renderer per
// pattern), so swapping this array re-skins the whole panel — there is NO
// case-specific content baked into the components. See feedback-reusability-principle.

export type SimStatusKind = 'idle' | 'running' | 'passed' | 'failed' | 'attention';

export interface SimTopic {
  id: string;
  /** Topic name shown on the card (AI-grouped category of past emails). */
  label: string;
  status: SimStatusKind;
  /** How many times this scenario has been run (0 = "no runs yet"). */
  runCount: number;
}

export const SIM_TOPICS: SimTopic[] = [
  { id: 'topic-1', label: '404 errors', status: 'idle', runCount: 0 },
  { id: 'topic-2', label: 'Server errors', status: 'idle', runCount: 0 },
  { id: 'topic-3', label: 'Edge cases', status: 'idle', runCount: 0 },
];
