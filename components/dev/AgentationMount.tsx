'use client';

import { Agentation } from 'agentation';

// Visual-feedback tool (agentation.com): click any element to annotate it and
// copy structured context (selectors, paths, computed styles) back to the agent.
// Dev-only - gated in the layout so it never ships to a production build.
export default function AgentationMount() {
  return <Agentation />;
}
