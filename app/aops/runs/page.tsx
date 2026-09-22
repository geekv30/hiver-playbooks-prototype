import { Suspense } from 'react';
import type { Metadata } from 'next';
import AllRunsPage from '@/components/runs/AllRunsPage';

export const metadata: Metadata = {
  title: 'All skill runs · Hiver',
  description: 'Everything every skill did across the shared inboxes.',
};

// Every skill's execution history in one place - the ops view, for someone who
// thinks in terms of the inbox rather than skill by skill.
// Reads ?skill= from the URL, so it needs a Suspense boundary to stay
// statically prerendered.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <AllRunsPage />
    </Suspense>
  );
}
