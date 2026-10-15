import type { Metadata } from 'next';
import SkillTriggerDoc from './SkillTriggerDoc';

export const metadata: Metadata = {
  title: 'Trigger: Describe it or Manual · Hiver',
  description: 'One control on the trigger: the skill runs on its own when a conversation matches, or only with / in Copilot.',
};

export default function Page() {
  return <SkillTriggerDoc />;
}
