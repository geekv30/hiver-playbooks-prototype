'use client';

import { RiArrowRightSLine } from 'react-icons/ri';
import type { SimTopic } from '@/data/simFixtures';
import SimStatus from './SimStatus';
import styles from './TopicCard.module.css';

interface Props {
  topic: SimTopic;
  /** Drill into the topic's email list (wired in M3). */
  onOpen?: (id: string) => void;
}

// Status label text for a topic card. Idle = "no runs yet"; once run, rolls up
// to "Passed · N run(s)" etc. (refined as the run states land in M7).
function topicStatusLabel(t: SimTopic): string {
  if (t.status === 'idle') return 'no runs yet';
  const runs = `${t.runCount} run${t.runCount === 1 ? '' : 's'}`;
  switch (t.status) {
    case 'passed':
      return `Passed · ${runs}`;
    case 'failed':
      return `Failed · ${runs}`;
    case 'attention':
      return `Needs attention · ${runs}`;
    case 'running':
      return 'Running…';
    default:
      return runs;
  }
}

/**
 * TopicCard — one AI-grouped scenario (Figma 211:18599): name on the left,
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
