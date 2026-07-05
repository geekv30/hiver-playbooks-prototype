import type { Metadata } from 'next';
import AopListPage from '@/components/aops/AopListPage';

export const metadata: Metadata = {
  title: 'AI Operating Procedures · Hiver',
  description: 'The AOP list - the entry point into AI Operating Procedures.',
};

export default function Page() {
  return <AopListPage />;
}
