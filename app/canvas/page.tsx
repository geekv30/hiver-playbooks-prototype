import { Suspense } from 'react';
import EditorCanvas from '@/components/flow01/EditorCanvas';

// Canvas 360 - flow-01 assembly (the live Skill editor, empty state) with
// the Copilot + Evaluate companions: the floating tool-switcher rail and the two
// mutually-exclusive right-hand panels.
// The editor reads its mode from the URL (`?runs=1`), so it needs a Suspense
// boundary to stay statically prerendered. The fallback is null on purpose:
// the shell is this component, so there is nothing to show before it.
export default function CanvasPage() {
  return (
    <Suspense fallback={null}>
      <EditorCanvas companions />
    </Suspense>
  );
}
