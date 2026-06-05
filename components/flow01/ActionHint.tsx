import type { MouseEvent } from 'react';
import { RiAtLine } from 'react-icons/ri';
import styles from './ActionHint.module.css';

interface ActionHintProps {
  /** Opens the actions command palette. Omitted in the gallery specimen. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Positioning passthrough (the editor anchors it below the first line). */
  className?: string;
}

/**
 * The "@ for actions" hint pill (Figma 647:40172): a quiet full-radius pill -
 * an @-icon chip + "for actions" label - that opens the actions command palette.
 * ONE renderer for both the editor's fresh-canvas affordance and the gallery
 * specimen; the editor passes a positioning className, the gallery passes none.
 */
export default function ActionHint({ onClick, className }: ActionHintProps) {
  return (
    <button
      type="button"
      className={className ? `${styles.hint} ${className}` : styles.hint}
      onClick={onClick}
    >
      <span className={styles.at} aria-hidden>
        <RiAtLine />
      </span>
      for actions
    </button>
  );
}
