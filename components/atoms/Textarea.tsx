'use client';

import {
  TextareaHTMLAttributes,
  ReactNode,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react';
import Tooltip from './Tooltip';
import styles from './Textarea.module.css';

interface Props
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'style'> {
  /** Bottom-right corner info tooltip (renders the info-icon trigger). */
  info?: ReactNode;
  error?: boolean;
  /** Minimum visible rows before auto-grow. Default 2. */
  minRows?: number;
}

/**
 * Textarea — the bordered NL field (Figma trigger field 256:2895).
 * Border 1px hairline-soft, radius 10, padding 16/10, muted-soft placeholder,
 * auto-grows with content, optional corner info-Tooltip.
 *
 * Inline @-reference chips inside the field are a molecule concern (Frontmatter);
 * this atom is the field shell + auto-grow + placeholder + corner info.
 */
export default function Textarea({
  info,
  error,
  minRows = 2,
  disabled,
  onInput,
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Size to content on mount and whenever the value changes externally.
  useLayoutEffect(resize, [resize, rest.value, rest.defaultValue]);

  const cls = [styles.field, error ? styles.error : '', disabled ? styles.disabled : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls}>
      <textarea
        ref={ref}
        className={styles.input}
        rows={minRows}
        disabled={disabled}
        aria-invalid={error || undefined}
        onInput={(e) => {
          resize();
          onInput?.(e);
        }}
        {...rest}
      />
      {info != null && (
        <span className={styles.corner}>
          <Tooltip content={info} side="left" />
        </span>
      )}
    </div>
  );
}
