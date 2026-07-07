'use client';
import styles from './Radio.module.css';

interface Props {
  checked?: boolean;
  disabled?: boolean;
  onChange?: () => void;
  ariaLabel?: string;
  /** Diameter in px (default 16). */
  size?: number;
  /** Non-interactive visual (a <span>, not a <button>) - for use inside an
   *  already-clickable row where nesting a button would be invalid HTML and the
   *  row itself owns the toggle. Mirrors Checkbox's presentational mode. */
  presentational?: boolean;
}

// Radio - single-select control (mirrors Checkbox). A ring that fills with an
// inner dot when selected. Generic + reusable - no case-specific content.
export default function Radio({ checked, disabled, onChange, ariaLabel, size, presentational }: Props) {
  const cls = [styles.ring, checked ? styles.checked : '', disabled ? styles.disabled : '']
    .filter(Boolean)
    .join(' ');
  const sizeStyle = size ? { width: size, height: size } : undefined;
  const dot = checked ? <span className={styles.dot} aria-hidden /> : null;
  if (presentational) {
    return (
      <span className={cls} style={sizeStyle} aria-hidden>
        {dot}
      </span>
    );
  }
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cls}
      style={sizeStyle}
      onClick={onChange}
    >
      {dot}
    </button>
  );
}
