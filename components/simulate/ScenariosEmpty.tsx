'use client';

import { RiFlaskLine } from 'react-icons/ri';
import type { SimEmail } from '@/data/simFixtures';
import Button from '@/components/atoms/Button';
import PickableEmailCard from './PickableEmailCard';
import SimEmptyState from './SimEmptyState';

interface Props {
  /** Whether the live AOP has a trigger yet (drives the action). */
  hasTrigger: boolean;
  /** Focus the trigger line in the editor (the "add a trigger" action). */
  onAddTrigger?: () => void;
}

// Generic preview rows - universal support scenarios, NOT one customer's data.
// They only exist to show what AI scenarios will look like once an AOP has a
// trigger. Rendered through the REAL PickableEmailCard (dimmed + inert), so this
// stays in sync with the live flat scenario list (one renderer per pattern).
const GHOST_SCENARIOS: SimEmail[] = [
  {
    id: 'ghost-1',
    sender: 'Priya Nair',
    subject: 'Empty payload returns 200 instead of 400',
    preview: 'When we POST an empty body the API responds 200 OK rather than a validation error.',
  },
  {
    id: 'ghost-2',
    sender: 'Aisha Khan',
    subject: '500s spiking on checkout',
    preview: 'We are seeing intermittent 500 Internal Server Error on the checkout API.',
  },
  {
    id: 'ghost-3',
    sender: 'Maria Gomez',
    subject: '404 on the /v2/orders endpoint',
    preview: 'Every call to /v2/orders comes back 404 not found, but the docs still list the route.',
  },
];

/**
 * ScenariosEmpty - the informative empty state for AI scenarios. Routes through
 * the shared SimEmptyState: faded ghost scenario rows preview what is coming, then
 * a concrete instruction and one light action. Never a blank panel.
 */
export default function ScenariosEmpty({ hasTrigger, onAddTrigger }: Props) {
  return (
    <SimEmptyState
      ghosts={GHOST_SCENARIOS.map((e) => (
        <PickableEmailCard key={e.id} email={e} selected={false} onSelect={() => {}} />
      ))}
      icon={RiFlaskLine}
      title="No scenarios to test yet"
      body={
        hasTrigger
          ? 'Hiver AI is turning past emails that match your trigger into test scenarios. They will show up here.'
          : 'Once your AOP has a trigger, Hiver AI turns real past emails into scenarios you can test here.'
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
