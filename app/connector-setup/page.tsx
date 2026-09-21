import { Suspense } from 'react';
import EditorCanvas from '@/components/flow01/EditorCanvas';
import { CONNECTOR_SETUP_DEMO_DOC } from './seed';

// Canvas variant where every connector starts unauthenticated: adding one inserts
// a "{connector} . setup needed" tag, and clicking it runs the connection flow
// (intro -> token auth -> success -> select action).
// The editor reads its mode from the URL (`?runs=1`), so it needs a Suspense
// boundary to stay statically prerendered.
export default function ConnectorSetupPage() {
  return (
    <Suspense fallback={null}>
      <EditorCanvas initialDoc={CONNECTOR_SETUP_DEMO_DOC} companions connectorsStartUnauthed />
    </Suspense>
  );
}
