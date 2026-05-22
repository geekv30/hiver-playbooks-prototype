'use client';
import { useCallback, useState } from 'react';

export type PickerScope = 'action' | 'ref' | 'global';

export interface PickerState {
  isOpen: boolean;
  scope: PickerScope | null;
  query: string;
  anchor: { top: number; left: number } | null;
  contextStepId: string | null;
  onSelect: ((id: string) => void) | null;
}

const INITIAL: PickerState = {
  isOpen: false,
  scope: null,
  query: '',
  anchor: null,
  contextStepId: null,
  onSelect: null,
};

export function usePicker() {
  const [state, setState] = useState<PickerState>(INITIAL);

  const open = useCallback((opts: Omit<PickerState, 'isOpen'>) => {
    setState({ ...opts, isOpen: true });
  }, []);

  const close = useCallback(() => setState(INITIAL), []);

  const setQuery = useCallback((q: string) => setState((s) => ({ ...s, query: q })), []);

  return { ...state, open, close, setQuery };
}
