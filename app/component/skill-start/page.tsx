import { Suspense } from 'react';
import type { Metadata } from 'next';
import SkillStartDoc from './SkillStartDoc';

export const metadata: Metadata = {
  title: 'How a skill starts · Hiver',
  description: 'Three directions for starting a skill on its own, with / in Copilot, or both.',
};

// Reads ?d= from the URL, so it needs a Suspense boundary to stay statically
// prerendered.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SkillStartDoc />
    </Suspense>
  );
}
