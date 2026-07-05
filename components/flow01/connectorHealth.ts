'use client';

import { useSyncExternalStore } from 'react';
import type { ConnectorSlug } from '@/types/playbook';

/**
 * Shared connector health - ONE source of truth for every surface that shows
 * connector state (the list page's Connectors button, the hub modal, the editor
 * toolbar, and the Enable flow's readiness review). Frontend-only mock: state
 * lives in memory + localStorage so it holds across pages and reloads.
 *
 *   connected    - authenticated and working
 *   reauth       - token expired; needs re-authentication before AOPs can use it
 *   error        - connection is broken (API failing); needs to be fixed
 *   disconnected - never connected
 */
export type ConnectorHealth = 'connected' | 'reauth' | 'error' | 'disconnected';

const STORAGE_KEY = 'hiver.playbooks.connectorHealth.v1';

// Seeded so every state shows somewhere: the demo AOP uses HubSpot (reauth -
// the enablement story), Slack is broken, Salesforce was never connected.
const DEFAULT_HEALTH: Record<ConnectorSlug, ConnectorHealth> = {
  shopify: 'connected',
  hubspot: 'reauth',
  clickup: 'connected',
  slack: 'error',
  salesforce: 'disconnected',
};

let health: Record<ConnectorSlug, ConnectorHealth> = { ...DEFAULT_HEALTH };
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) health = { ...DEFAULT_HEALTH, ...(JSON.parse(raw) as typeof health) };
  } catch {
    /* corrupted storage - keep defaults */
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(health));
  } catch {
    /* storage unavailable - in-memory state still works */
  }
}

export function getConnectorHealth(): Record<ConnectorSlug, ConnectorHealth> {
  return health;
}

export function setConnectorHealth(slug: ConnectorSlug, state: ConnectorHealth) {
  hydrate();
  health = { ...health, [slug]: state };
  persist();
  emit();
}

// Hydrate once at module load on the client (before any snapshot is read), so
// getSnapshot stays referentially stable within a render pass.
if (typeof window !== 'undefined') hydrate();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

// SSR renders the defaults; the client store hydrated at module load.
const getServerSnapshot = () => DEFAULT_HEALTH;
const getSnapshot = () => health;

/** Live connector health map (re-renders on any change, any surface). */
export function useConnectorHealth(): Record<ConnectorSlug, ConnectorHealth> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** True when any connector needs attention (drives the button badges). */
export function hasConnectorIssues(map: Record<ConnectorSlug, ConnectorHealth>): boolean {
  return Object.values(map).some((s) => s === 'reauth' || s === 'error');
}
