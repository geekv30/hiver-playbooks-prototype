import type { ConnectorSlug, ConnectorId } from '@/types/playbook';

export interface ConnectorMeta {
  slug: ConnectorSlug;
  name: string;
  accountLabelPlaceholder: string;
  fakeAuthedLabel: string;
}

export const CONNECTOR_META: Record<ConnectorSlug, ConnectorMeta> = {
  shopify:    { slug: 'shopify',    name: 'Shopify',    accountLabelPlaceholder: 'mystore.myshopify.com',    fakeAuthedLabel: 'walkjapan-store.myshopify.com' },
  hubspot:    { slug: 'hubspot',    name: 'HubSpot',    accountLabelPlaceholder: 'workspace.hubspot.com',    fakeAuthedLabel: 'walkjapan.hubspot.com' },
  slack:      { slug: 'slack',      name: 'Slack',      accountLabelPlaceholder: 'workspace.slack.com',      fakeAuthedLabel: 'walkjapan.slack.com' },
  salesforce: { slug: 'salesforce', name: 'Salesforce', accountLabelPlaceholder: 'org.my.salesforce.com',    fakeAuthedLabel: 'walkjapan.my.salesforce.com' },
  clickup:    { slug: 'clickup',    name: 'ClickUp',    accountLabelPlaceholder: 'workspace.clickup.com',    fakeAuthedLabel: 'walkjapan.clickup.com' },
};

export function defaultConnectorIds(): ConnectorId[] {
  return (Object.keys(CONNECTOR_META) as ConnectorSlug[]).map((slug) => ({
    slug,
    authed: false,
  }));
}
