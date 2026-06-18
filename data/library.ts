import type { ActionDef } from '@/types/playbook';

export interface BucketDef {
  id: ActionDef['bucket'];
  label: string;
  sub: string;
}

export const BUCKETS: BucketDef[] = [
  { id: 'read',     label: 'Read & understand',       sub: 'silent' },
  { id: 'ticket',   label: 'Touch the ticket',        sub: 'Hiver-native verbs' },
  { id: 'external', label: 'Touch the outside world', sub: 'external connectors' },
  { id: 'human',    label: 'Loop in a human',         sub: 'pause for review' },
  { id: 'wait',     label: 'Wait & come back',        sub: 'time-based' },
  { id: 'flow',     label: 'Control flow & end',      sub: 'branching, termination' },
];

export const ACTIONS: ActionDef[] = [
  // Read & understand (10)
  { id: 'ai_extract',              name: 'AI Extract',                desc: 'Pull structured fields from prose',            meta: 'from email body',      bucket: 'read',     iconKey: 'extract' },
  { id: 'shopify_get_order',       name: 'Shopify · Get order',         desc: 'Look up an order by ID, email, or number',     bucket: 'read',     connectorSlug: 'shopify',    iconKey: 'shopify' },
  { id: 'shopify_get_customer',    name: 'Shopify · Get customer',      desc: 'Look up a customer profile',                   bucket: 'read',     connectorSlug: 'shopify',    iconKey: 'shopify' },
  { id: 'hubspot_get_contact',     name: 'HubSpot · Get contact',       desc: 'Look up a contact by email or ID',             bucket: 'read',     connectorSlug: 'hubspot',    iconKey: 'hubspot' },
  { id: 'hubspot_get_company',     name: 'HubSpot · Get company',       desc: 'Look up a company by domain',                  bucket: 'read',     connectorSlug: 'hubspot',    iconKey: 'hubspot' },
  { id: 'hubspot_get_ticket',      name: 'HubSpot · Get ticket',        desc: 'Look up a support ticket',                     bucket: 'read',     connectorSlug: 'hubspot',    iconKey: 'hubspot' },
  { id: 'salesforce_get_account',  name: 'Salesforce · Get account',    desc: 'Look up an account by name',                   bucket: 'read',     connectorSlug: 'salesforce', iconKey: 'salesforce' },
  { id: 'clickup_get_task',        name: 'ClickUp · Get task',          desc: 'Look up a task by ID',                         bucket: 'read',     connectorSlug: 'clickup',    iconKey: 'clickup' },
  { id: 'kb_search',               name: 'Search Knowledge Hub',      desc: 'Search across your Knowledge Hub sources',     bucket: 'read',     iconKey: 'kb' },
  { id: 'summarize',               name: 'Summarize',                 desc: 'One-paragraph summary of the thread',          meta: 'this conversation',    bucket: 'read',     iconKey: 'note' },

  // Touch the ticket (7)
  { id: 'tag',                     name: 'Tag',                       desc: 'Apply one or more tags',                       bucket: 'ticket',   iconKey: 'tag' },
  { id: 'note',                    name: 'Note',                      desc: 'Add an internal-only note',                    meta: 'internal',             bucket: 'ticket',   iconKey: 'note' },
  // Reply is ONE verb with a structured MODE attribute: draft | send (a pickable
  // enum value, not prose). The "what to say" stays natural language on the line.
  { id: 'draft_reply',             name: 'Reply',                     desc: 'Save a draft for the agent to send',           meta: 'draft',                bucket: 'ticket',   iconKey: 'reply' },
  { id: 'send_reply',              name: 'Reply',                     desc: 'Send a reply immediately',                     meta: 'send',                 bucket: 'ticket',   iconKey: 'reply' },
  { id: 'assign',                  name: 'Assign',                    desc: 'Reassign to a user or queue',                  bucket: 'ticket',   iconKey: 'tag' },
  { id: 'change_status',           name: 'Change status',             desc: 'Open / Pending / Closed / Custom',             bucket: 'ticket',   iconKey: 'tag' },
  { id: 'set_field',               name: 'Set custom field',          desc: 'Update a custom field value',                  bucket: 'ticket',   iconKey: 'tag' },

  // Touch the outside world (7)
  { id: 'shopify_issue_refund',    name: 'Shopify · Issue refund',      desc: 'Refund an order',                              bucket: 'external', connectorSlug: 'shopify',    iconKey: 'shopify' },
  { id: 'shopify_cancel_order',    name: 'Shopify · Cancel order',      desc: 'Cancel an open order',                         bucket: 'external', connectorSlug: 'shopify',    iconKey: 'shopify' },
  { id: 'hubspot_create_ticket',   name: 'HubSpot · Create ticket',     desc: 'Create a support ticket',                      bucket: 'external', connectorSlug: 'hubspot',    iconKey: 'hubspot' },
  { id: 'hubspot_update_contact',  name: 'HubSpot · Update contact',    desc: 'Update contact properties',                    bucket: 'external', connectorSlug: 'hubspot',    iconKey: 'hubspot' },
  { id: 'clickup_create_task',     name: 'ClickUp · Create task',       desc: 'Add a task to a list',                         bucket: 'external', connectorSlug: 'clickup',    iconKey: 'clickup' },
  { id: 'slack_send_message',      name: 'Slack · Send message',        desc: 'Post to a channel or DM',                      bucket: 'external', connectorSlug: 'slack',      iconKey: 'slack' },
  { id: 'http',                    name: 'Generic HTTP',              desc: 'Call a custom HTTP endpoint',              meta: 'advanced',             bucket: 'external', iconKey: 'http' },

  // Loop in a human (1)
  { id: 'approval',                name: 'Approval',                  desc: 'Pause for human sign-off',                     meta: 'rich block',           bucket: 'human',    iconKey: 'approval' },

  // Wait & come back (3)
  { id: 'wait_for_reply',          name: 'Wait for customer reply',   desc: 'Resume when the customer responds',            bucket: 'wait',     iconKey: 'wait' },
  { id: 'wait',                    name: 'Wait',                      desc: 'Pause for a fixed duration',                   meta: '1 business hour',      bucket: 'wait',     iconKey: 'wait' },
  { id: 'wait_until',              name: 'Wait until',                desc: 'Pause until a specific time',                  meta: 'Monday 9 AM',          bucket: 'wait',     iconKey: 'wait' },

  // Control flow & end (2)
  { id: 'condition',               name: 'Condition',                 desc: 'Branch on a plain-English expression',         meta: 'if / else if / else',  bucket: 'flow',     iconKey: 'condition' },
  { id: 'end',                     name: 'End AOP',              desc: 'Stop here; no further steps run',              bucket: 'flow',     iconKey: 'end' },
];

export function actionsByBucket(bucket: ActionDef['bucket']): ActionDef[] {
  return ACTIONS.filter((a) => a.bucket === bucket);
}

export function findAction(id: string): ActionDef | undefined {
  return ACTIONS.find((a) => a.id === id);
}
