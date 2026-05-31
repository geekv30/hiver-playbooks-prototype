'use client';
import { RiCheckLine, RiSubtractLine } from 'react-icons/ri';
import styles from './Checkbox.module.css';

interface Props {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  ariaLabel?: string;
}

// Checkbox — Figma 211:21186. unchecked / checked / indeterminate / disabled.
export default function Checkbox({ checked, indeterminate, disabled, onChange, ariaLabel }: Props) {
  const state = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked';
  const cls = [styles.box, styles[state], disabled ? styles.disabled : ''].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : !!checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cls}
      onClick={onChange ? () => onChange(!checked) : undefined}
    >
      {indeterminate ? <RiSubtractLine /> : checked ? <RiCheckLine /> : null}
    </button>
  );
}
