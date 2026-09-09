'use client';

import { useSyncExternalStore } from 'react';

/**
 * Whether the user has read the "how matching works" explainer.
 *
 * A one-line store rather than component state, following the connectorHealth
 * pattern: hydrated from localStorage once at module load so it survives a
 * reload, is SSR-safe, and never seeds useState from the browser.
 */
const STORAGE_KEY = 'hiver.playbooks.matchingIntro.v1';

let seen = false; // default: unread, so the explainer shows once
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  try {
    seen = window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    /* storage blocked - the explainer simply shows again next time */
  }
}

export function markMatchingIntroSeen(): void {
  if (seen) return;
  seen = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* storage blocked - in-memory state still holds for this session */
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useMatchingIntroSeen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => seen,
    () => false,
  );
}
