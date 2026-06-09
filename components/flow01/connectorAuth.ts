'use client';
import { createContext, useContext } from 'react';
import type { ConnectorSlug } from '@/types/playbook';

/**
 * The set of connectors that are NOT yet authenticated on the current canvas.
 * A connector action-tag whose slug is in this set renders the "setup needed"
 * state (and its click opens the connector setup flow instead of reconfiguring).
 * Empty by default - every connector is treated as already connected, so this is
 * a no-op on canvases that don't opt into the setup flow.
 */
export const UnauthedConnectorsContext = createContext<ReadonlySet<ConnectorSlug>>(new Set());

export function useUnauthedConnectors(): ReadonlySet<ConnectorSlug> {
  return useContext(UnauthedConnectorsContext);
}
