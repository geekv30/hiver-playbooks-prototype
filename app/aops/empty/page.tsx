import type { Metadata } from 'next';
import AopListPage from '@/components/aops/AopListPage';

export const metadata: Metadata = {
  title: 'AI Operating Procedures · Hiver',
  description: 'The AOP list, before the first AOP exists.',
};

export default function Page() {
  return <AopListPage empty />;
}
