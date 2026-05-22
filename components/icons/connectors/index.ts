import type { ConnectorSlug } from '@/types/playbook';
import type { ComponentType, SVGProps } from 'react';
import { ShopifyIcon } from './Shopify';
import { HubSpotIcon } from './HubSpot';
import { SlackIcon } from './Slack';
import { SalesforceIcon } from './Salesforce';
import { ClickUpIcon } from './ClickUp';

export const CONNECTOR_ICON: Record<ConnectorSlug, ComponentType<SVGProps<SVGSVGElement>>> = {
  shopify: ShopifyIcon,
  hubspot: HubSpotIcon,
  slack: SlackIcon,
  salesforce: SalesforceIcon,
  clickup: ClickUpIcon,
};

export { ShopifyIcon, HubSpotIcon, SlackIcon, SalesforceIcon, ClickUpIcon };
