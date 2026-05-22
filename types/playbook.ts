export type ChipStatus = 'ok' | 'draft' | 'warn' | 'error' | 'running';

export type FieldType =
  | 'email' | 'text' | 'longtext' | 'number' | 'date'
  | 'bool' | 'enum' | 'doc' | 'draft';

export type RefSource = 'ticket' | 'customer' | 'connector' | 'previous-step' | 'manual';

export type ConnectorSlug = 'shopify' | 'hubspot' | 'slack' | 'salesforce' | 'clickup';

export interface Ref {
  id: string;
  path: string;
  label: string;
  type: FieldType;
  source: RefSource;
  desc?: string;
  group?: string;
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

export interface ActionStep {
  kind: 'action';
  id: string;
  chip: Chip;
  prose?: string;
}

export interface ConditionBranch {
  id: string;
  kind: 'if' | 'elseif' | 'else';
  expression?: string;
  steps: Step[];
}

export interface ConditionStep {
  kind: 'condition';
  id: string;
  branches: ConditionBranch[];
}

export interface ApprovalStep {
  kind: 'approval';
  id: string;
  approverRefId: string;
  prompt: string;
}

export type Step = ActionStep | ConditionStep | ApprovalStep;

export interface Frontmatter {
  name: string;
  summary: string;
  trigger: string;
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
  bucket: 'compose' | 'connector' | 'condition' | 'approval' | 'output' | 'meta';
  connectorSlug?: ConnectorSlug;
  iconKey: string;
  shortcut?: string;
}
