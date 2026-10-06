import type { Metadata } from 'next';
import SavedSkillCanvas from '../SavedSkillCanvas';

export const metadata: Metadata = {
  title: 'Skill runs · Hiver',
  description: 'What a saved skill did, run by run.',
};

// A saved skill's execution history: its own route, like the seeded skill's
// (see app/api-example/runs), so it can be linked to and navigated back out of.
export default function Page() {
  return <SavedSkillCanvas runsMode />;
}
