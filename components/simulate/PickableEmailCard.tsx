'use client';

import { RiShareBoxLine } from 'react-icons/ri';
import Radio from '@/components/atoms/Radio';
import type { SimEmail } from '@/data/simFixtures';
import styles from './PickableEmailCard.module.css';

interface Props {
  email: SimEmail;
  /** Single-select state (the inner Radio is the real role="radio" control). */
  selected: boolean;
  onSelect: () => void;
  /** When provided, a hover-revealed redirect opens the full conversation. */
  onOpen?: () => void;
}

/**
 * PickableEmailCard - one selectable conversation row (Figma 1745:68080 /
 * 1752:20293). The interactive control is the inner Radio (a real role="radio",
 * keyboard-operable); the card is a mouse-convenience click target, so the
 * redirect button is a valid sibling rather than nested inside a radio. When
 * `onOpen` is set (recent conversations), the redirect reveals on hover.
 */
export default function PickableEmailCard({ email, selected, onSelect, onOpen }: Props) {
  return (
    <article className={styles.card} data-selected={selected || undefined} onClick={onSelect}>
      <div className={styles.top}>
        <div className={styles.sender}>
          <Radio
            checked={selected}
            onChange={onSelect}
            ariaLabel={`Select the conversation from ${email.sender}: ${email.subject}`}
          />
          <span className={styles.name}>{email.sender}</span>
        </div>
        {onOpen && (
          <button
            type="button"
            className={styles.open}
            aria-label={`Open the full conversation from ${email.sender}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            <RiShareBoxLine aria-hidden />
          </button>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.subject}>{email.subject}</div>
        <div className={styles.preview}>{email.preview}</div>
      </div>
    </article>
  );
}
