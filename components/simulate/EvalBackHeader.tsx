'use client';

import { RiArrowLeftSLine } from 'react-icons/ri';
import styles from './EvalBackHeader.module.css';

interface Props {
  title: string;
  onBack: () => void;
}

/**
 * EvalBackHeader - replaces the Copilot | Evaluation tabs once a flow is entered
 * (Figma 695:15007). A `‹` back control + the flow title; back always lives at the
 * top. Matches the tab header's height so entering a flow doesn't shift the body.
 */
export default function EvalBackHeader({ title, onBack }: Props) {
  return (
    <div className={styles.header}>
      <button type="button" className={styles.back} onClick={onBack} aria-label="Back to evaluation options">
        <RiArrowLeftSLine aria-hidden />
      </button>
      <span className={styles.title}>{title}</span>
    </div>
  );
}
