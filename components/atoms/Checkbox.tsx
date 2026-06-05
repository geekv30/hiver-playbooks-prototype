'use client';
import { RiCheckLine, RiSubtractLine } from 'react-icons/ri';
import styles from './Checkbox.module.css';

interface Props {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  ariaLabel?: string;
  /** Box edge length in px (default 14). The command palette uses 16 (Figma 745:20564). */
  size?: number;
  /** Render a non-interactive visual (a <span>, not a <button>) - for use inside an
   *  already-clickable row (e.g. a command-palette option) where nesting a button
   *  would be invalid HTML and the row itself owns the toggle. */
  presentational?: boolean;
}

// Checkbox - Figma 211:21186. unchecked / checked / indeterminate / disabled.
export default function Checkbox({
  checked,
  indeterminate,
  disabled,
  onChange,
  ariaLabel,
  size,
  presentational,
}: Props) {
  const state = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked';
  const cls = [styles.box, styles[state], disabled ? styles.disabled : ''].filter(Boolean).join(' ');
  const sizeStyle = size ? { width: size, height: size } : undefined;
  const glyph = indeterminate ? <RiSubtractLine /> : checked ? <RiCheckLine /> : null;
  if (presentational) {
    return (
      <span className={cls} style={sizeStyle} aria-hidden>
        {glyph}
      </span>
    );
  }
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : !!checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cls}
      style={sizeStyle}
      onClick={onChange ? () => onChange(!checked) : undefined}
    >
      {glyph}
    </button>
  );
}
