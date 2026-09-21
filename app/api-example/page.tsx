import { Suspense } from 'react';
import EditorCanvas from '@/components/flow01/EditorCanvas';
import { EXAMPLE_DOC } from '@/components/flow01/doc';

// Stakeholder demo route - the "API error triage" example Skill, pre-built and
// ready to review with the full experience: the Copilot + Evaluation companions,
// the Enable go-live flow, etc. (the pre-built doc means no cold-start modal).
// The editor reads its mode from the URL (`?runs=1`), so it needs a Suspense
// boundary to stay statically prerendered. The fallback is null on purpose:
// the shell is this component, so there is nothing to show before it.
export default function ApiExamplePage() {
  return (
    <Suspense fallback={null}>
      <EditorCanvas skillId="api-error-triage" initialDoc={EXAMPLE_DOC} companions />
    </Suspense>
  );
}
