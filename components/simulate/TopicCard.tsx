'use client';

import { RiArrowRightSLine } from 'react-icons/ri';
import { topicStatusLabel, type SimTopic } from '@/data/simFixtures';
import SimStatus from './SimStatus';
import styles from './TopicCard.module.css';

interface Props {
  topic: SimTopic;
  /** Drill into the topic's email list. */
  onOpen?: (id: string) => void;
}

/**
 * TopicCard - one AI-grouped scenario (Figma 211:18599): name on the left,
 * status dot + label on the right, a drill chevron revealed on hover. Renders
 * any SimTopic; no hardcoded content.
 */
export default function TopicCard({ topic, onOpen }: Props) {
  return (
    <button type="button" className={styles.card} onClick={() => onOpen?.(topic.id)}>
      <span className={styles.name}>{topic.label}</span>
      <span className={styles.right}>
        <SimStatus status={topic.status} label={topicStatusLabel(topic)} />
        <RiArrowRightSLine className={styles.chevron} aria-hidden />
      </span>
    </button>
  );
}
