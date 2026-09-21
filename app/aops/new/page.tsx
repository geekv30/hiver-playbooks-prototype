import { Suspense } from 'react';
import type { Metadata } from 'next';
import EditorCanvas from '@/components/flow01/EditorCanvas';

export const metadata: Metadata = {
  title: 'New skill · Hiver',
  description: 'Create a new skill.',
};

// A fresh, empty canvas: no initialDoc, so the cold-start "draft with AI"
// modal greets the user (the same editor the seeded journeys use).
// The editor reads its mode from the URL (`?runs=1`), so it needs a Suspense
// boundary to stay statically prerendered. The fallback is null on purpose:
// the shell is this component, so there is nothing to show before it.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <EditorCanvas companions />
    </Suspense>
  );
}
