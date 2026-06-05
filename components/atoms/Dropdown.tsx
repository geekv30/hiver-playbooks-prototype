'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  id: string;
  label: string;
}

interface Props {
  options: DropdownOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * A design-language dropdown (replaces the native <select>). Trigger shows the
 * selected label or a placeholder; the menu grows from the trigger, closes on
 * outside-click / Esc, and supports arrow + Enter keyboard selection.
 */
export default function Dropdown({ options, value, onChange, placeholder = 'Select', ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const selected = options.find((o) => o.id === value);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // On open, point the active row at the current value.
  useEffect(() => {
    if (!open) return;
    const i = options.findIndex((o) => o.id === value);
    setActive(i >= 0 ? i : 0);
  }, [open, value, options]);

  // Keep the active row in view.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const o = options[active];
      if (o) pick(o.id);
    }
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        data-open={open || undefined}
        data-empty={!selected || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
      >
        <span className={styles.value}>{selected ? selected.label : placeholder}</span>
        <RiArrowDownSLine className={styles.chevron} aria-hidden />
      </button>
      {open && (
        <ul className={styles.menu} role="listbox" ref={menuRef}>
          {options.map((o, i) => (
            <li key={o.id}>
              <button
                type="button"
                role="option"
                data-row={i}
                aria-selected={o.id === value}
                className={styles.option}
                data-active={i === active || undefined}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o.id)}
              >
                <span>{o.label}</span>
                {o.id === value && <RiCheckLine className={styles.optionCheck} aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
