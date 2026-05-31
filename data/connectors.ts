import type { ConnectorSlug, ConnectorId } from '@/types/playbook';

export interface ConnectorMeta {
  slug: ConnectorSlug;
  name: string;
  accountLabelPlaceholder: string;
  fakeAuthedLabel: string;
}

// Generic account placeholders only — no specific customer's workspace.
export const CONNECTOR_META: Record<ConnectorSlug, ConnectorMeta> = {
  shopify:    { slug: 'shopify',    name: 'Shopify',    accountLabelPlaceholder: 'your-store.myshopify.com',  fakeAuthedLabel: 'your-store.myshopify.com' },
  hubspot:    { slug: 'hubspot',    name: 'HubSpot',    accountLabelPlaceholder: 'your-team.hubspot.com',     fakeAuthedLabel: 'your-team.hubspot.com' },
  slack:      { slug: 'slack',      name: 'Slack',      accountLabelPlaceholder: 'your-workspace.slack.com',  fakeAuthedLabel: 'your-workspace.slack.com' },
  salesforce: { slug: 'salesforce', name: 'Salesforce', accountLabelPlaceholder: 'your-org.my.salesforce.com', fakeAuthedLabel: 'your-org.my.salesforce.com' },
  clickup:    { slug: 'clickup',    name: 'ClickUp',    accountLabelPlaceholder: 'your-workspace.clickup.com', fakeAuthedLabel: 'your-workspace.clickup.com' },
};

export function defaultConnectorIds(): ConnectorId[] {
  return (Object.keys(CONNECTOR_META) as ConnectorSlug[]).map((slug) => ({
    slug,
    authed: false,
  }));
}
