'use client';

import type { SimTopic } from '@/data/simFixtures';
import TopicCard from './TopicCard';
import styles from './ScenarioList.module.css';

interface Props {
  topics: SimTopic[];
  /** Drill into a topic's email list (wired in M3). */
  onOpenTopic?: (id: string) => void;
}

/** ScenarioList - the stack of TopicCards in the Scenarios tab. */
export default function ScenarioList({ topics, onOpenTopic }: Props) {
  return (
    <div className={styles.list}>
      {topics.map((t) => (
        <TopicCard key={t.id} topic={t} onOpen={onOpenTopic} />
      ))}
    </div>
  );
}
