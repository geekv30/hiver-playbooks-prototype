'use client';

import { ReactNode } from 'react';
import { RiInformationLine } from 'react-icons/ri';
import styles from './Tooltip.module.css';

type Side = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  /** Tooltip body. String or rich node. */
  content: ReactNode;
  /** Which side of the trigger the bubble sits on. Default 'top'. */
  side?: Side;
  /**
   * The trigger. If omitted, renders the Figma default: a 14px info icon
   * (matches the `_tooltip` instance, node 258:21951).
   */
  children?: ReactNode;
}

/**
 * Tooltip - hover/focus advisory bubble.
 *
 * Figma note: the file's tooltip instance (258:21951) only places the info-icon
 * trigger; the bubble is a shared-library overlay that isn't statically placed.
 * The bubble styling here follows the app's established dark-bubble convention
 * (same ink bg + white text + shadow as Toast). FLAGGED for Varun.
 *
 * CSS-driven visibility (:hover + :focus-within) so it works without JS and is
 * keyboard-accessible.
 */
export default function Tooltip({ content, side = 'top', children }: TooltipProps) {
  return (
    <span className={styles.wrapper}>
      <span className={styles.trigger} tabIndex={0} aria-describedby="tt">
        {children ?? <RiInformationLine className={styles.infoIcon} aria-hidden />}
      </span>
      <span className={`${styles.bubble} ${styles[side]}`} role="tooltip">
        {content}
        <span className={styles.arrow} aria-hidden />
      </span>
    </span>
  );
}
