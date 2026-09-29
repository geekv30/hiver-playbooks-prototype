import type { Metadata } from 'next';
import WorkspaceReset from '@/components/aops/WorkspaceReset';

export const metadata: Metadata = {
  title: 'Skills · Hiver',
  description: 'Resets the demo workspace to the empty state.',
};

export default function Page() {
  return <WorkspaceReset workspace="empty" />;
}
