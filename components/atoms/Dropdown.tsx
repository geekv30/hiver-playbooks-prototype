'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';
import Checkbox from './Checkbox';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  id: string;
  label: string;
  /** A small mark ahead of the label (e.g. which channel an inbox is). */
  icon?: ReactNode;
}

/** One pick: the menu closes on choosing. */
interface Single {
  multiple?: false;
  value: string;
  onChange: (id: string) => void;
}

/** Several picks: a checkbox per row, the menu stays open, and an "All" row on
 *  top clears them. No picks means all. */
interface Multi {
  multiple: true;
  values: string[];
  onChange: (ids: string[]) => void;
  /** The label for no picks, on the trigger and the top row. */
  allLabel?: string;
}

type Props = (Single | Multi) & {
  options: DropdownOption[];
  placeholder?: string;
  ariaLabel?: string;
  /** 'pill' is the filter-row trigger (Figma 3593:22242): a 32px rounded chip
   *  that names what it filters, "Mailbox · All", and sizes to its label. */
  variant?: 'field' | 'pill';
  /** Pill only: the dimension being filtered, shown ahead of the value. */
  prefix?: string;
};

/**
 * A design-language dropdown (replaces the native <select>). Trigger shows the
 * selected label or a placeholder; the menu grows from the trigger, closes on
 * outside-click / Esc, and supports arrow + Enter keyboard selection.
 */
export default function Dropdown(props: Props) {
  const { options, placeholder = 'Select', ariaLabel, variant = 'field', prefix } = props;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const multi = props.multiple === true;
  const value = props.multiple ? (props.values[0] ?? '') : props.value;
  const picks = props.multiple ? props.values : [props.value];
  const allLabel = props.multiple ? (props.allLabel ?? 'All') : '';
  // Multi: the "All" row comes first, so the rows are offset by one.
  const rows: DropdownOption[] = multi ? [{ id: '', label: allLabel }, ...options] : options;
  const selected: DropdownOption | undefined = props.multiple
    ? props.values.length === 0
      ? { id: '', label: allLabel }
      : props.values.length === 1
        ? options.find((o) => o.id === props.values[0])
        : { id: '', label: `${props.values.length} selected` }
    : options.find((o) => o.id === props.value);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Opening points the active row at the current value. Only on opening: in
  // multi mode the picks change while the menu is open, and the highlight
  // must stay where the person is.
  const openMenu = () => {
    const i = rows.findIndex((o) => o.id === value);
    setActive(i >= 0 ? i : 0);
    setOpen(true);
  };

  // Keep the active row in view.
  useEffect(() => {
    if (!open) return;
    menuRef.current
      ?.querySelector<HTMLElement>(`[data-row="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const pick = (id: string) => {
    if (props.multiple) {
      // Picking every option is the same as picking none: say "All".
      const next =
        id === ''
          ? []
          : props.values.includes(id)
            ? props.values.filter((v) => v !== id)
            : [...props.values, id];
      props.onChange(next.length === options.length ? [] : next);
      return;
    }
    props.onChange(id);
    setOpen(false);
  };
  const isOn = (id: string) =>
    multi ? (id === '' ? picks.length === 0 : picks.includes(id)) : id === value;

  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const o = rows[active];
      if (o) pick(o.id);
    }
  };

  return (
    <div className={styles.root} data-variant={variant} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        data-open={open || undefined}
        data-empty={!selected || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKey}
      >
        <span className={styles.value}>
          {prefix && <span className={styles.prefix}>{prefix} </span>}
          {prefix ? (
            <span className={styles.picked}>
              &middot; {selected ? selected.label : placeholder}
            </span>
          ) : selected ? (
            selected.label
          ) : (
            placeholder
          )}
        </span>
        <RiArrowDownSLine className={styles.chevron} aria-hidden />
      </button>
      {open && (
        <ul
          className={styles.menu}
          role="listbox"
          aria-multiselectable={multi || undefined}
          ref={menuRef}
        >
          {rows.map((o, i) => (
            <li key={o.id || 'all'}>
              <button
                type="button"
                role="option"
                data-row={i}
                aria-selected={isOn(o.id)}
                className={styles.option}
                data-multi={multi || undefined}
                data-active={i === active || undefined}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o.id)}
              >
                {multi && <Checkbox checked={isOn(o.id)} presentational subtle size={16} />}
                {o.icon && (
                  <span className={styles.optionIcon} aria-hidden>
                    {o.icon}
                  </span>
                )}
                <span className={styles.optionLabel}>{o.label}</span>
                {!multi && isOn(o.id) && <RiCheckLine className={styles.optionCheck} aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
