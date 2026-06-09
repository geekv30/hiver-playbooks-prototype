import { emptyDoc, txt, type EditorDoc } from '@/components/flow01/doc';
import type { Fragment } from '@/types/playbook';

// A lean seed for the connector setup-flow demo: a trigger + a single step that
// references a connector (HubSpot). On this route every connector starts
// unauthenticated, so the tag renders "HubSpot . setup needed" and clicking it
// runs the connection flow. Fixed ids keep server/client markup identical (SSR).
const hubspotChip: Fragment = {
  kind: 'chip',
  chip: { id: 'cn-hubspot-1', actionId: 'hubspot_get_contact', status: 'ok', config: {} },
};

export const CONNECTOR_SETUP_DEMO_DOC: EditorDoc = {
  ...emptyDoc(),
  trigger: [txt('When an email arrives reporting an API error or status issue')],
  steps: [
    { id: 'cn-step-1', body: [txt('Look up the customer in '), hubspotChip, txt('')] },
    // Trailing empty step: the always-present "add the next step" line.
    { id: 'cn-step-2', body: [txt('')] },
  ],
};
