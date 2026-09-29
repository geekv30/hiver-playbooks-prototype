import { Suspense } from 'react';
import type { Metadata } from 'next';
import AopListPage from '@/components/aops/AopListPage';
import WorkspaceReset from '@/components/aops/WorkspaceReset';

export const metadata: Metadata = {
  title: 'Skills · Hiver',
  description: 'The skill list, before the first skill exists.',
};

export default function Page() {
  return (
    <>
      {/* `?fresh` resets this workspace; it reads the URL, so it sits in its own
          Suspense boundary and the list itself stays statically prerendered. */}
      <Suspense fallback={null}>
        <WorkspaceReset workspace="empty" />
      </Suspense>
      <AopListPage empty />
    </>
  );
}
