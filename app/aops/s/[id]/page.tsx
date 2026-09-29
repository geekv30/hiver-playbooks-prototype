import type { Metadata } from 'next';
import SavedSkillCanvas from './SavedSkillCanvas';

export const metadata: Metadata = {
  title: 'Skill · Hiver',
  description: 'Edit a saved skill.',
};

export default function Page() {
  return <SavedSkillCanvas />;
}
