'use client';
import type { ReactNode } from 'react';
import styles from './Input.module.css';

interface Props {
  defaultValue?: string;
  placeholder?: string;
  /** Leading icon (search, etc.). */
  prefixIcon?: ReactNode;
  /** Trailing affordance (chevron for select, clear, etc.). */
  suffix?: ReactNode;
  disabled?: boolean;
  error?: boolean;
  readOnly?: boolean;
  ariaLabel?: string;
}

// Input field — Figma 258:21645. Field chrome + optional prefix icon / suffix.
export default function Input({
  defaultValue,
  placeholder,
  prefixIcon,
  suffix,
  disabled,
  error,
  readOnly,
  ariaLabel,
}: Props) {
  const cls = [styles.field, error ? styles.error : '', disabled ? styles.disabled : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      {prefixIcon && <span className={styles.affix}>{prefixIcon}</span>}
      <input
        className={styles.input}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-label={ariaLabel}
      />
      {suffix && <span className={styles.affix}>{suffix}</span>}
    </div>
  );
}
