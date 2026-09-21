import type { Metadata } from 'next';
import AllRunsPage from '@/components/runs/AllRunsPage';

export const metadata: Metadata = {
  title: 'All skill runs · Hiver',
  description: 'Everything every skill did across the shared inboxes.',
};

// Every skill's execution history in one place - the ops view, for someone who
// thinks in terms of the inbox rather than skill by skill.
export default function Page() {
  return <AllRunsPage />;
}
