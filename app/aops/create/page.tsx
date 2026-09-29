import { Suspense } from 'react';
import type { Metadata } from 'next';
import NewSkillPage from '@/components/aops/NewSkillPage';

export const metadata: Metadata = {
  title: 'Create new skill · Hiver',
  description: 'Describe a skill, start from a template, or attach an SOP.',
};

// Reads its workspace from the URL (`?ws=empty`), so it needs a Suspense
// boundary to stay statically prerendered.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <NewSkillPage />
    </Suspense>
  );
}
