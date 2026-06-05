'use client';

import { useRef, type CSSProperties, type KeyboardEvent } from 'react';
import styles from './SegmentedControl.module.css';

export interface SegTab<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  tabs: SegTab<T>[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}

/**
 * A white-chip-on-track segmented control (Figma 530:33976). The active segment
 * is a white chip with a barely-there lift (Shadows/sm) that SLIDES between
 * equal-width segments; labels recolour muted -> ink. Generic over any N tabs.
 * Conformant tablist: roving tabindex + arrow/Home/End keyboard navigation.
 */
export default function SegmentedControl<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
}: Props<T>) {
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === active));
  const ref = useRef<HTMLDivElement>(null);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    let next = activeIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(activeIndex + 1, tabs.length - 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(activeIndex - 1, 0);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    const t = tabs[next];
    if (!t) return;
    if (t.id !== active) onChange(t.id);
    ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div
      className={styles.track}
      role="tablist"
      aria-label={ariaLabel}
      ref={ref}
      onKeyDown={onKey}
      style={{ '--n': tabs.length, '--active': activeIndex } as CSSProperties}
    >
      <span className={styles.chip} aria-hidden />
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === active}
          tabIndex={t.id === active ? 0 : -1}
          className={styles.seg}
          data-active={t.id === active || undefined}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
