'use client';
import { useState } from 'react';
import styles from './FieldInput.module.css';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: 'text' | 'email' | 'number' | 'date';
  help?: string;
  error?: string;
}

export default function FieldInput({
  label, value, onChange, placeholder, multiline = false, type = 'text', help, error,
}: Props) {
  const [focused, setFocused] = useState(false);
  const fieldCls = [
    styles.field,
    focused ? styles.focused : '',
    error ? styles.error : '',
  ].filter(Boolean).join(' ');

  return (
    <label className={fieldCls}>
      <span className={styles.label}>{label}</span>
      {multiline ? (
        <textarea
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={3}
        />
      ) : (
        <input
          className={styles.input}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      )}
      {error ? (
        <span className={styles['error-msg']}>{error}</span>
      ) : help ? (
        <span className={styles.help}>{help}</span>
      ) : null}
    </label>
  );
}
