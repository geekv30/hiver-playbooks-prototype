// Per-step status during a run. gray dot -> green as each step succeeds.
export type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export interface TraceStepDef {
  id: string;
  /** Library action id. The trace renders each step through the shared Chip
   *  atom, so its action-tags are identical to the editor's (one renderer per
   *  pattern - see feedback-reusability-principle). */
  actionId: string;
  /** Mono detail after the " · " (overrides the action's default meta). */
  meta?: string;
  /** Base duration (ms) for this op. The run engine jitters it per-run and the
   *  trace shows the ACTUAL elapsed time, so each run feels like a real one. */
  ms: number;
  /** Result line shown once the step is done. */
  output?: string;
  kind?: 'action' | 'condition';
  /** Condition: which arm fired (renders the matched IF / ELSE-IF / ELSE tag). */
  condType?: 'if' | 'elseif' | 'else';
  /** Condition: the matched branch line - the expression (or the no-branch note). */
  branch?: string;
}

// The trace template (the illustrative API AOP, mirroring the example doc).
// actionIds map to the action library so the Chip atom draws them.
export const SIM_TRACE: TraceStepDef[] = [
  {
    id: 's1',
    actionId: 'ai_extract',
    meta: 'summary',
    ms: 700,
    output: 'summary returned: 404, not found, 11:34, v1.2.1, southern-S3',
  },
  {
    id: 's2',
    actionId: 'tag',
    meta: 'api-error, support',
    ms: 150,
    output: 'ticket tagged: api-error, support',
  },
  {
    id: 's3',
    actionId: 'hubspot_get_contact',
    ms: 950,
    output: 'contact: John Doe, company: hiverhq.com',
  },
  {
    id: 's4',
    actionId: 'kb_search',
    meta: 'Engg-docs',
    ms: 450,
    output: 'returned: 200 OK',
  },
  {
    id: 's5',
    actionId: 'condition',
    kind: 'condition',
    condType: 'if',
    ms: 90,
    branch: 'the error is a 4xx client error',
  },
  {
    id: 's6',
    actionId: 'draft_reply',
    meta: 'draft',
    ms: 1300,
    output: 'drafted reply ready',
  },
];

// The drafted reply (the payoff), surfaced above the trace on a passed run.
export const SIM_DRAFT =
  "Hi Maria, thanks for flagging this. The 404 on /v2/orders started with the v1.2.1 rollout - " +
  'the route moved to /v2/order (singular), so updating the path resolves it. ' +
  "I've logged it for the team in case other endpoints are affected.";

// The matched branch shown on the result headline + the Condition trace step
// (kept consistent: a 404 matches the IF "the error is a 4xx client error").
export const SIM_BRANCH = 'the error is a 4xx client error';
