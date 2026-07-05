import type { Metadata } from 'next';
import EditorCanvas from '@/components/flow01/EditorCanvas';

export const metadata: Metadata = {
  title: 'New AOP · Hiver',
  description: 'Create a new AI Operating Procedure.',
};

// A fresh, empty canvas: no initialDoc, so the cold-start "draft with AI"
// modal greets the user (the same editor the seeded journeys use).
export default function Page() {
  return <EditorCanvas companions />;
}
