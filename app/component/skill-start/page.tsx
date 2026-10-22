import { Suspense } from 'react';
import type { Metadata } from 'next';
import SkillStartDoc from './SkillStartDoc';

export const metadata: Metadata = {
  title: 'How a skill starts · Hiver',
  description: 'Today\'s tabs and three other layouts for how a skill starts: Automatic or Manual with / in the Assist Agent.',
};

// Reads ?o= from the URL, so it needs a Suspense boundary to stay statically
// prerendered.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SkillStartDoc />
    </Suspense>
  );
}
