import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import EditorCanvas from '@/components/flow01/EditorCanvas';
import { START_UIS, isStartUi } from '@/components/flow01/startUi';
import { seedDoc } from '@/lib/seedSkills';
import { normalizeLine, txt } from '@/components/flow01/doc';
import { LONG_TRIGGERS } from '@/components/skillstart/longTriggers';

export const metadata: Metadata = {
  title: 'Skill editor, start option · Hiver',
  description: 'The full skill editor with one of the start layouts on its Trigger.',
};

// The options on /component/skill-start, each in the full editor. A live skill
// and a draft, so Enable, Pause and the toasts all show. Review only: the
// shipped editor (/aops/...) keeps the tabs.
const SKILLS = ['refund-requests', 'nps-followups'];
export const dynamicParams = false;

export function generateStaticParams() {
  return START_UIS.flatMap((ui) => SKILLS.map((skill) => ({ ui, skill })));
}

export default async function Page({ params }: { params: Promise<{ ui: string; skill: string }> }) {
  const { ui, skill } = await params;
  const seeded = SKILLS.includes(skill) ? seedDoc(skill) : null;
  if (!isStartUi(ui) || !seeded) notFound();
  // A full trigger, so each layout is tried with real, wrapping text.
  const doc = { ...seeded, trigger: normalizeLine([txt(LONG_TRIGGERS[skill] ?? '')]) };
  return (
    <Suspense fallback={null}>
      <EditorCanvas key={`${ui}-${skill}`} initialDoc={doc} companions startUi={ui} />
    </Suspense>
  );
}
