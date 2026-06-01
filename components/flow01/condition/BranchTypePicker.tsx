'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RiCornerDownLeftLine, RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';
import { BranchIcon } from '@/components/icons/ui/Branch';
import styles from './BranchTypePicker.module.css';

interface Props {
  onPick: (type: 'elseif' | 'else') => void;
  onClose: () => void;
  /** Hide ELSE when choosing it would drop trailing arms (a non-last arm). */
  allowElse?: boolean;
}

const ALL: { type: 'elseif' | 'else'; label: string }[] = [
  { type: 'elseif', label: 'ELSE-IF' },
  { type: 'else', label: 'ELSE' },
];

/**
 * BranchTypePicker - the two-option popover (Figma 334:37982) opened from the
 * ELSE-IF / ELSE tag. The command-palette chrome minus the search field. ELSE is
 * hidden when picking it would truncate trailing arms (so a tag re-pick can never
 * silently destroy authored branches). Springs in (interruptible, reduced-motion
 * aware) to match the trace's reveals.
 */
export default function BranchTypePicker({ onPick, onClose, allowElse = true }: Props) {
  const options = useMemo(() => (allowElse ? ALL : ALL.filter((o) => o.type !== 'else')), [allowElse]);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    ref.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const o = options[active];
      if (o) onPick(o.type);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <motion.div
      ref={ref}
      className={styles.pop}
      role="listbox"
      aria-label="Branch type"
      aria-activedescendant={`branch-opt-${options[active]?.type ?? options[0]?.type}`}
      tabIndex={-1}
      onKeyDown={onKey}
      initial={reduce ? false : { opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
      style={{ transformOrigin: 'top left' }}
    >
      <div className={styles.groupLabel}>Conditions</div>
      {options.map((o, i) => (
        <div key={o.type} className={styles.rowWrap}>
          <button
            type="button"
            id={`branch-opt-${o.type}`}
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
    </motion.div>
  );
}
