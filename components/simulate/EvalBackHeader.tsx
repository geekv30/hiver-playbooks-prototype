'use client';

import type { ReactNode } from 'react';
import { RiArrowLeftSLine } from 'react-icons/ri';
import styles from './EvalBackHeader.module.css';

interface Props {
  title: string;
  onBack: () => void;
  /** Leading glyph before the title (the flow's menu icon), matching the entry card. */
  icon?: ReactNode;
  /** Trailing control on the right (e.g. Regenerate on AI scenarios). */
  action?: ReactNode;
}

/**
 * EvalBackHeader - the entered-flow header, now a row BELOW the persistent
 * Copilot | Evaluation tabs (Figma 1745:67909). A `‹` back control + the flow's
 * icon + title, with an optional trailing action. Matches the tab header height so
 * entering a flow doesn't shift the body.
 */
export default function EvalBackHeader({ title, onBack, icon, action }: Props) {
  return (
    <div className={styles.header}>
      <button type="button" className={styles.back} onClick={onBack} aria-label="Back to evaluation options">
        <RiArrowLeftSLine aria-hidden />
      </button>
      {icon && <span className={styles.icon} aria-hidden>{icon}</span>}
      <span className={styles.title}>{title}</span>
      {action && <span className={styles.action}>{action}</span>}
    </div>
  );
}
