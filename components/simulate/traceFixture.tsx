import type { ComponentType, SVGProps } from 'react';
import { RiPriceTag3Line, RiBookOpenLine, RiReplyLine } from 'react-icons/ri';
import { ExtractIcon } from '@/components/icons/ui/Extract';
import { HubSpotIcon } from '@/components/icons/connectors/HubSpot';
import { BranchIcon } from '@/components/icons/ui/Branch';

// Per-step status during a run. grey dot -> green as each step succeeds.
export type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export interface TraceStepDef {
  id: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Brand-coloured icon (e.g. the HubSpot logo) — skip the currentColor tint. */
  brand?: boolean;
  label: string;
  /** Mono detail after the " · " (JetBrains). */
  meta?: string;
  /** Simulated duration (ms) shown in the trace. */
  ms: number;
  /** Result line shown once the step is done. */
  output?: string;
  kind?: 'action' | 'condition';
  /** Condition: the matched branch line (matched-path-only). */
  branch?: string;
}

// The trace template (the illustrative API playbook). The renderer is generic;
// in the real product this derives from the live EditorDoc steps. The Condition
// renders matched-path-only, and the matched branch's Reply produces the draft.
export const SIM_TRACE: TraceStepDef[] = [
  {
    id: 's1',
    Icon: ExtractIcon,
    label: 'AI Extract',
    meta: 'summary',
    ms: 450,
    output: 'summary returned: 404, not found, 11:34, v1.2.1, southern-S3',
  },
  {
    id: 's2',
    Icon: RiPriceTag3Line,
    label: 'Tag',
    meta: 'api-error, support',
    ms: 120,
    output: 'ticket tagged: api-error, support',
  },
  {
    id: 's3',
    Icon: HubSpotIcon,
    brand: true,
    label: 'Hubspot · Get contact',
    meta: 'contact, company association',
    ms: 380,
    output: 'contact: John Doe · company: hiverhq.com',
  },
  {
    id: 's4',
    Icon: RiBookOpenLine,
    label: 'KB',
    meta: 'Engg-docs',
    ms: 210,
    output: 'returned: 200 ok',
  },
  {
    id: 's5',
    Icon: BranchIcon,
    kind: 'condition',
    label: 'Condition',
    ms: 90,
    branch: 'matched IF · client error (4xx)',
  },
  {
    id: 's6',
    Icon: RiReplyLine,
    label: 'Reply',
    meta: 'draft',
    ms: 1200,
    output: 'drafted reply ready',
  },
];

// The drafted reply (the payoff), surfaced above the trace on a passed run.
export const SIM_DRAFT =
  "Hi Maria, thanks for flagging this. The 404 on /v2/orders started with the v1.2.1 rollout - " +
  'the route moved to /v2/order (singular), so updating the path resolves it. ' +
  "I've logged it for the team in case other endpoints are affected.";

// The matched branch chip shown on the result headline.
export const SIM_BRANCH = 'error 401 or 403';
