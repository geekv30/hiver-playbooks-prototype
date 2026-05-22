export type ChipStatus = 'ok' | 'draft' | 'warn' | 'error' | 'running';

export type FieldType =
  | 'email' | 'text' | 'longtext' | 'number' | 'date'
  | 'bool' | 'enum' | 'doc' | 'draft';

export type ConnectorSlug = 'shopify' | 'hubspot' | 'slack' | 'salesforce' | 'clickup';

export interface Ref {
  id: string;
  path: string;
  label: string;
  type: FieldType;
  desc?: string;
  group: 'ticket' | 'inputs' | 'outputs';
}

export interface ConnectorId {
  slug: ConnectorSlug;
  authed: boolean;
  accountLabel?: string;
}

export type ChipConfigValue = string | number | boolean | Ref | null | ChipConfig;
export interface ChipConfig { [key: string]: ChipConfigValue; }

export interface Chip {
  id: string;
  actionId: string;
  status: ChipStatus;
  config: ChipConfig;
  outputRefId?: string;
}

export type Fragment =
  | { kind: 'text'; text: string }
  | { kind: 'chip'; chip: Chip }
  | { kind: 'ref';  refPath: string }   // matches a Ref.path, or a literal display string (e.g. 'info@walkjapan.com')
  | { kind: 'code'; code: string };     // literal code-formatted span (e.g. '"yes"')

export interface ActionStep {
  kind: 'action';
  id: string;
  fragments: Fragment[];
}

export interface ConditionBranch {
  id: string;
  tag: 'if' | 'elseif' | 'else';
  exprFragments: Fragment[];            // the per-branch test expression
  bodyFragments: Fragment[];            // the per-branch body
}

export interface ConditionStep {
  kind: 'condition';
  id: string;
  exprFragments: Fragment[];            // the condition's top-level expression
  meta?: string;                        // display hint like '2 branches'
  branches: ConditionBranch[];
}

export interface ApprovalStep {
  kind: 'approval';
  id: string;
  approverRefPath: string;              // consistent with Fragment refPath
  promptFragments: Fragment[];          // fragments-based for symmetry
}

export interface EndStep {
  kind: 'end';
  id: string;
}

export type Step = ActionStep | ConditionStep | ApprovalStep | EndStep;

export interface Frontmatter {
  name: string;
  summary: string;
  triggerFragments: Fragment[];          // was: trigger: string
}

export interface ShareMailboxBinding {
  mailboxId: string;
  mailboxName: string;
  active: boolean;
}

export interface Playbook {
  id: string;
  version: 1;
  frontmatter: Frontmatter;
  steps: Step[];
  refs: Ref[];
  connectors: ConnectorId[];
  bindings: ShareMailboxBinding[];
  updatedAt: number;
}

export interface ActionDef {
  id: string;
  name: string;
  desc: string;
  meta?: string;            // default chip-meta text (canvas-spec; preserve verbatim)
  bucket: 'read' | 'ticket' | 'external' | 'human' | 'wait' | 'flow';
  connectorSlug?: ConnectorSlug;
  iconKey: string;
  shortcut?: string;
}
