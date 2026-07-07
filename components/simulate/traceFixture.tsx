// Per-step status during a run. gray dot -> green as each step succeeds.
export type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

// Trace step kinds (Figma 1839:34067): the agent's reasoning ('thinking'), an
// action with an output box, a branch decision, and the final reply (which can
// pause for approval).
export type TraceKind = 'thinking' | 'action' | 'condition' | 'reply';

export interface TraceStepDef {
  id: string;
  kind: TraceKind;
  /** Base duration (ms) for this op. The run engine jitters it per-run. */
  ms: number;
  /** thinking: the reasoning line (no output box). */
  text?: string;
  /** action / reply: icon key (resolved in TraceStep) + label + optional suffix. */
  iconKey?: string;
  label?: string;
  /** reply: the medium after the " · " (e.g. "send"). */
  suffix?: string;
  /** action: the result shown in a gray box once done. */
  output?: string;
  /** condition: which arm fired. */
  condType?: 'if' | 'elseif' | 'else';
  /** condition: the matched branch expression (or the no-branch note). */
  branch?: string;
}

// The trace template for the illustrative API AOP. Thinking steps are interleaved
// with the actions, mirroring how the agent reasons before it acts. The reply
// step's body is injected at render time (the email's own draft), so the trace
// shows the actual drafted reply.
export const SIM_TRACE: TraceStepDef[] = [
  {
    id: 't1',
    kind: 'thinking',
    ms: 600,
    text: "I'll first check the conversation to confirm the sender and pull the error details before acting.",
  },
  {
    id: 's1',
    kind: 'action',
    iconKey: 'extract',
    label: 'Summarize error',
    ms: 700,
    output: 'summary: 404, not found, 11:34, v1.2.1, southern-S3',
  },
  { id: 's2', kind: 'action', iconKey: 'tag', label: 'Tag', ms: 150, output: 'api-error, support' },
  {
    id: 's3',
    kind: 'action',
    iconKey: 'contact',
    label: 'Get contact',
    ms: 950,
    output: 'John Doe · hiverhq.com',
  },
  {
    id: 's4',
    kind: 'action',
    iconKey: 'kb',
    label: 'Search Knowledge Hub',
    ms: 450,
    output: 'returned: 200 OK',
  },
  {
    id: 't2',
    kind: 'thinking',
    ms: 450,
    text: 'Now categorizing the error to choose the right reply.',
  },
  {
    id: 's5',
    kind: 'condition',
    condType: 'if',
    ms: 90,
    branch: 'the error is a 4xx client error',
  },
  { id: 's6', kind: 'reply', iconKey: 'reply', label: 'Reply', suffix: 'send', ms: 1300 },
];

// The drafted reply (fallback), used when an email carries no draft of its own.
export const SIM_DRAFT =
  "Hi Maria, thanks for flagging this. The 404 on /v2/orders started with the v1.2.1 rollout - " +
  'the route moved to /v2/order (singular), so updating the path resolves it. ' +
  "I've logged it for the team in case other endpoints are affected.";
