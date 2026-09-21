'use client';

import { useSyncExternalStore } from 'react';

// Nothing to subscribe to - mounting is a one-way transition. Module-level for
// a stable identity across renders.
const NO_SUBSCRIBE = () => () => {};

/**
 * True once the component is running on the client.
 *
 * Run history is derived from the clock (`NOW` in runFixtures), and these
 * routes are statically prerendered - so the server bakes "3 hrs ago" at BUILD
 * time while the browser computes it at page load. Rendering that difference
 * during hydration is a mismatch (React #418).
 *
 * useSyncExternalStore is the supported way out: React uses the server snapshot
 * for the hydrating render, so server and client agree, and only then swaps in
 * the real value. An effect would not work - it runs after hydration has
 * already compared the two trees.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    NO_SUBSCRIBE,
    () => true,
    () => false,
  );
}
