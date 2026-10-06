import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import EditorCanvas from '@/components/flow01/EditorCanvas';
import { SEED_PAGE_IDS, seedDoc } from '@/lib/seedSkills';

export const metadata: Metadata = {
  title: 'Skill · Hiver',
  description: 'A seeded skill in the demo workspace.',
};

export function generateStaticParams() {
  return SEED_PAGE_IDS.map((id) => ({ id }));
}

// A seeded skill from the Skills list, in the editor. Its Runs live at /runs.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = seedDoc(id);
  if (!doc) notFound();
  return (
    <Suspense fallback={null}>
      <EditorCanvas key={id} skillId={id} initialDoc={doc} companions />
    </Suspense>
  );
}
