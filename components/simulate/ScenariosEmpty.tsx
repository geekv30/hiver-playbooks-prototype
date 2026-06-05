'use client';

import { RiFlaskLine } from 'react-icons/ri';
import type { SimTopic } from '@/data/simFixtures';
import Button from '@/components/atoms/Button';
import TopicCard from './TopicCard';
import SimEmptyState from './SimEmptyState';

interface Props {
  /** Whether the live AOP has a trigger yet (drives the action). */
  hasTrigger: boolean;
  /** Focus the trigger line in the editor (the "add a trigger" action). */
  onAddTrigger?: () => void;
}

// Generic preview rows - universal support topics, NOT one customer's data. They
// only exist to show what AI-grouped scenarios will look like once an AOP has
// a trigger. Rendered through the REAL TopicCard (dimmed), so this stays in sync
// with the live component (one renderer per pattern).
const GHOST_TOPICS: SimTopic[] = [
  { id: 'ghost-1', label: 'Refund requests', status: 'idle', runCount: 0, emails: [] },
  { id: 'ghost-2', label: 'Password resets', status: 'idle', runCount: 0, emails: [] },
  { id: 'ghost-3', label: 'Shipping delays', status: 'idle', runCount: 0, emails: [] },
];

/**
 * ScenariosEmpty - the informative empty state for the Simulate Scenarios tab.
 * Routes through the shared SimEmptyState: faded ghost TopicCards preview what is
 * coming, then a concrete instruction and one light action. Never a blank panel.
 */
export default function ScenariosEmpty({ hasTrigger, onAddTrigger }: Props) {
  return (
    <SimEmptyState
      ghosts={GHOST_TOPICS.map((t) => (
        <TopicCard key={t.id} topic={t} />
      ))}
      icon={RiFlaskLine}
      title="No scenarios to simulate yet"
      body={
        hasTrigger
          ? 'Hiver AI is grouping past emails that match your trigger into scenarios. They will show up here.'
          : 'Once your AOP has a trigger, Hiver AI groups real past emails into scenarios you can test here.'
      }
      action={
        !hasTrigger && onAddTrigger ? (
          <Button variant="text" onClick={onAddTrigger}>
            Add a trigger to get started
          </Button>
        ) : undefined
      }
    />
  );
}
