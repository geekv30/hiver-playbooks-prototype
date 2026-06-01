'use client';

import { useEffect, useRef, useState } from 'react';
import { RiCornerDownLeftLine, RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';
import { BranchIcon } from '@/components/icons/ui/Branch';
import styles from './BranchTypePicker.module.css';

interface Props {
  onPick: (type: 'elseif' | 'else') => void;
  onClose: () => void;
}

const OPTIONS: { type: 'elseif' | 'else'; label: string }[] = [
  { type: 'elseif', label: 'ELSE-IF' },
  { type: 'else', label: 'ELSE' },
];

/**
 * BranchTypePicker - the two-option popover (Figma 334:37982) opened from the
 * ELSE-IF / ELSE prompt. The command-palette chrome minus the search field: a
 * "Conditions" group header, two rows, and the navigate/select/close footer.
 */
export default function BranchTypePicker({ onPick, onClose }: Props) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, OPTIONS.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onPick(OPTIONS[active]!.type);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      ref={ref}
      className={styles.pop}
      role="listbox"
      aria-label="Branch type"
      tabIndex={-1}
      onKeyDown={onKey}
    >
      <div className={styles.groupLabel}>Conditions</div>
      {OPTIONS.map((o, i) => (
        <div key={o.type} className={styles.rowWrap}>
          <button
            type="button"
            role="option"
            aria-selected={i === active}
            className={`${styles.row} ${i === active ? styles.rowActive : ''}`}
            onMouseEnter={() => setActive(i)}
            onClick={() => onPick(o.type)}
          >
            <span className={styles.rowIco} aria-hidden>
              <BranchIcon />
            </span>
            <span className={styles.rowLabel}>{o.label}</span>
          </button>
        </div>
      ))}
      <div className={styles.footer}>
        <span className={styles.hint}>
          <span className={styles.keys}>
            <kbd className={styles.cap}><RiArrowUpLine /></kbd>
            <kbd className={styles.cap}><RiArrowDownLine /></kbd>
          </span>
          navigate
        </span>
        <span className={styles.hint}>
          <kbd className={styles.cap}><RiCornerDownLeftLine /></kbd>
          select
        </span>
        <span className={styles.hint}>
          <kbd className={`${styles.cap} ${styles.capWide}`}>esc</kbd>
          close
        </span>
      </div>
    </div>
  );
}
