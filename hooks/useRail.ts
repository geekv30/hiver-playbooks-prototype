'use client';
import { useCallback, useState } from 'react';
import type { ConnectorSlug } from '@/types/playbook';

export type RailTab = 'playbook' | 'config' | 'output' | 'run';
export type RailMode = 'tab' | 'setup';

export interface RailState {
  tab: RailTab;
  mode: RailMode;
  configChipId: string | null;
  setupConnectorSlug: ConnectorSlug | null;
}

const INITIAL: RailState = { tab: 'playbook', mode: 'tab', configChipId: null, setupConnectorSlug: null };

export function useRail() {
  const [state, setState] = useState<RailState>(INITIAL);

  const setTab = useCallback((tab: RailTab) => setState((s) => ({ ...s, tab, mode: 'tab' })), []);
  const openConfig = useCallback((chipId: string) =>
    setState((s) => ({ ...s, tab: 'config', mode: 'tab', configChipId: chipId })), []);
  const closeConfig = useCallback(() =>
    setState((s) => ({ ...s, tab: 'playbook', mode: 'tab', configChipId: null })), []);
  const openSetup = useCallback((slug: ConnectorSlug) =>
    setState((s) => ({ ...s, mode: 'setup', setupConnectorSlug: slug })), []);
  const closeSetup = useCallback(() =>
    setState((s) => ({ ...s, mode: 'tab', setupConnectorSlug: null })), []);

  return { ...state, setTab, openConfig, closeConfig, openSetup, closeSetup };
}
