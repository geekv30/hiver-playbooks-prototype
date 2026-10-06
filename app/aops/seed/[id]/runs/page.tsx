import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import EditorCanvas from '@/components/flow01/EditorCanvas';
import { SEED_PAGE_IDS, seedDoc } from '@/lib/seedSkills';

export const metadata: Metadata = {
  title: 'Skill runs · Hiver',
  description: 'What a seeded skill did, run by run.',
};

export function generateStaticParams() {
  return SEED_PAGE_IDS.map((id) => ({ id }));
}

// A seeded skill's execution history: its own route, like /api-example/runs.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = seedDoc(id);
  if (!doc) notFound();
  return (
    <Suspense fallback={null}>
      <EditorCanvas key={id} skillId={id} initialDoc={doc} companions runsMode />
    </Suspense>
  );
}
