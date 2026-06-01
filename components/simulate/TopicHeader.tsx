'use client';

import { RiArrowLeftLine } from 'react-icons/ri';
import { topicStatusLabel, type SimTopic } from '@/data/simFixtures';
import SimStatus from './SimStatus';
import styles from './TopicHeader.module.css';

interface Props {
  topic: SimTopic;
  onBack: () => void;
}

/**
 * TopicHeader - the drill-down header (Figma 211:20069): a back button, the
 * topic name, the rollup status, and a divider below. Reuses SimStatus.
 */
export default function TopicHeader({ topic, onBack }: Props) {
  return (
    <div className={styles.header}>
      <div className={styles.row}>
        <button type="button" className={styles.back} onClick={onBack} aria-label="Back to scenarios">
          <RiArrowLeftLine aria-hidden />
        </button>
        <span className={styles.name}>{topic.label}</span>
        <SimStatus status={topic.status} label={topicStatusLabel(topic)} />
      </div>
      <div className={styles.divider} aria-hidden />
    </div>
  );
}
