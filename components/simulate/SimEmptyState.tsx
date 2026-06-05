'use client';

import type { ComponentType, ReactNode } from 'react';
import styles from './SimEmptyState.module.css';

interface Props {
  /** Dimmed, faded preview of the populated surface - the REAL cards (one
   *  renderer per pattern), kept out of tab order + the a11y tree via `inert`. */
  ghosts: ReactNode;
  /** Centered icon (a react-icons component). */
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  body: string;
  /** Optional light action under the body (a Button, a "Coming soon" Badge, ...). */
  action?: ReactNode;
}

/**
 * SimEmptyState - the shared informative empty state for the Simulate tabs.
 * The empty state IS the populated surface, dimmed: a faded preview of the real
 * cards, then a centered cluster (icon / headline / explanation / one action).
 * Never a blank panel. Both the Scenarios and Custom test tabs route through this
 * single renderer so the treatment can never drift between them.
 */
export default function SimEmptyState({ ghosts, icon: Icon, title, body, action }: Props) {
  return (
    <div className={styles.wrap}>
      {/* `inert` keeps the ghost preview out of tab order + the a11y tree. */}
      <div className={styles.ghosts} inert>
        {ghosts}
      </div>

      <div className={styles.cluster}>
        <Icon className={styles.icon} aria-hidden />
        <p className={styles.title}>{title}</p>
        <p className={styles.body}>{body}</p>
        {action && <div className={styles.action}>{action}</div>}
      </div>
    </div>
  );
}
