'use client';
import type { ReactNode } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'text';
type Size = 'md' | 'sm';

interface Props {
  variant?: Variant;
  /** 'md' (default) = toolbar/CTA scale. 'sm' = compact (22px circular send). */
  size?: Size;
  children?: ReactNode;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** Icon-only button (no label). */
  iconOnly?: ReactNode;
  disabled?: boolean;
  /** Fully rounded (icon controls like stop / send). */
  pill?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  ariaLabel?: string;
}

// Button — Figma 211:19456 / 211:19749 / 211:20709. Neutral system:
// primary = soft-filled (#ECEFF6), secondary = bordered light, tertiary = ghost,
// text = link. px12 py9, radius 6, Inter Medium 14, 18px icons.
export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  iconLeft,
  iconRight,
  iconOnly,
  disabled,
  pill,
  onClick,
  type = 'button',
  ariaLabel,
}: Props) {
  const cls = [
    styles.btn,
    styles[variant],
    size === 'sm' ? styles.sm : '',
    iconOnly ? styles.iconOnly : '',
    pill ? styles.pill : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick} aria-label={ariaLabel}>
      {iconOnly ? (
        <span className={styles.icon}>{iconOnly}</span>
      ) : (
        <>
          {iconLeft && <span className={styles.icon}>{iconLeft}</span>}
          {children && <span className={styles.label}>{children}</span>}
          {iconRight && <span className={styles.icon}>{iconRight}</span>}
        </>
      )}
    </button>
  );
}
