'use client';

import styles from './Toggle.module.css';

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}

/** Switch control (Figma list page 1817:18991): 36x20 track, 16px knob that
 *  slides on toggle. Accent when on, gray when off. */
export default function Toggle({ checked, onChange, ariaLabel, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={styles.track}
      data-on={checked || undefined}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
    >
      <span className={styles.knob} aria-hidden />
    </button>
  );
}
