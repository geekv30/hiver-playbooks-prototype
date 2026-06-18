import type { ConnectorSlug, ConnectorId } from '@/types/playbook';

export interface ConnectorMeta {
  slug: ConnectorSlug;
  name: string;
  accountLabelPlaceholder: string;
  fakeAuthedLabel: string;
  /** One-line tagline shown under the connector name in the setup modal. */
  tagline: string;
  /** Short paragraph describing what connecting does (setup modal intro). */
  blurb: string;
  /** Placeholder shown in the token field of the auth modal. */
  tokenPlaceholder: string;
}

// Generic, connector-level copy only - no specific customer's workspace or data.
export const CONNECTOR_META: Record<ConnectorSlug, ConnectorMeta> = {
  shopify: {
    slug: 'shopify', name: 'Shopify',
    accountLabelPlaceholder: 'your-store.myshopify.com', fakeAuthedLabel: 'acme-store.myshopify.com',
    tagline: "Bring your store's orders and customers into Hiver.",
    blurb: 'Connect Shopify to look up orders, customers, and fulfillment status while you reply. Use it to resolve order issues without leaving the inbox.',
    tokenPlaceholder: 'shpat_0a1b2c3d',
  },
  hubspot: {
    slug: 'hubspot', name: 'HubSpot',
    accountLabelPlaceholder: 'your-team.hubspot.com', fakeAuthedLabel: 'your-team.hubspot.com',
    tagline: 'Bring contact and company data into Hiver.',
    blurb: 'Connect HubSpot to sync customer, company, and ticket data with Hiver. Use it to speed up support and personalize customer interactions.',
    tokenPlaceholder: 'hub123$0321',
  },
  slack: {
    slug: 'slack', name: 'Slack',
    accountLabelPlaceholder: 'your-workspace.slack.com', fakeAuthedLabel: 'your-workspace.slack.com',
    tagline: 'Notify the right channel from your AOP.',
    blurb: 'Connect Slack to post updates and loop in teammates from inside an AOP. Use it to escalate or notify without switching tools.',
    tokenPlaceholder: 'xoxb-1234-5678',
  },
  salesforce: {
    slug: 'salesforce', name: 'Salesforce',
    accountLabelPlaceholder: 'your-org.my.salesforce.com', fakeAuthedLabel: 'your-org.my.salesforce.com',
    tagline: 'Bring account and case data into Hiver.',
    blurb: 'Connect Salesforce to look up accounts and cases while you work a ticket. Use it to ground replies in CRM context.',
    tokenPlaceholder: 'sf_00D5x000',
  },
  clickup: {
    slug: 'clickup', name: 'ClickUp',
    accountLabelPlaceholder: 'your-workspace.clickup.com', fakeAuthedLabel: 'your-workspace.clickup.com',
    tagline: 'Create and track tasks from your AOP.',
    blurb: 'Connect ClickUp to look up and create tasks from inside an AOP. Use it to turn a customer request into tracked work.',
    tokenPlaceholder: 'pk_1234_ABCD',
  },
};

export function defaultConnectorIds(): ConnectorId[] {
  return (Object.keys(CONNECTOR_META) as ConnectorSlug[]).map((slug) => ({
    slug,
    authed: false,
  }));
}
