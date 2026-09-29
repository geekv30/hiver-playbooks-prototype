import { Suspense } from 'react';
import type { Metadata } from 'next';
import NewSkillCanvas from './NewSkillCanvas';

export const metadata: Metadata = {
  title: 'New skill · Hiver',
  description: 'Create a new skill.',
};

// The editor for a brand-new skill, primed by the composer's handoff (a
// prompt, template, or SOP) or "Create from scratch". With no handoff it goes
// to the New skill page (see NewSkillCanvas). The handoff is read from the
// URL, so it needs a Suspense boundary to stay statically prerendered. The
// fallback is null on purpose: the shell is this component, so there is
// nothing to show before it.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <NewSkillCanvas />
    </Suspense>
  );
}
