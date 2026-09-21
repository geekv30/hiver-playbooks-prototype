import { Suspense } from 'react';
import EditorCanvas from '@/components/flow01/EditorCanvas';
import { EXAMPLE_DOC } from '@/components/flow01/doc';

// The skill's execution history. Its own route rather than a flag on the
// editor's: Runs is a distinct view, so it gets a distinct URL that can be
// linked to, bookmarked, and navigated back out of.
export default function ApiExampleRunsPage() {
  return (
    <Suspense fallback={null}>
      <EditorCanvas skillId="api-error-triage" initialDoc={EXAMPLE_DOC} companions runsMode />
    </Suspense>
  );
}
