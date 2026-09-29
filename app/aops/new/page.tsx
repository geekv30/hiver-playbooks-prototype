import { Suspense } from 'react';
import type { Metadata } from 'next';
import NewSkillCanvas from './NewSkillCanvas';

export const metadata: Metadata = {
  title: 'New skill · Hiver',
  description: 'Create a new skill.',
};

// A fresh, empty canvas: no initialDoc, so the cold-start "draft with AI"
// modal greets the user (the same editor the seeded journeys use) - unless the
// Skills empty state handed off a prompt or "Create from scratch" (see
// NewSkillCanvas). That handoff is read from the URL, so it needs a Suspense
// boundary to stay statically prerendered. The fallback is null on purpose:
// the shell is this component, so there is nothing to show before it.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <NewSkillCanvas />
    </Suspense>
  );
}
