import type { Metadata } from 'next';
import AopListPage from '@/components/aops/AopListPage';

export const metadata: Metadata = {
  title: 'Skills · Hiver',
  description: 'The skill list, before the first skill exists.',
};

export default function Page() {
  return <AopListPage empty />;
}
