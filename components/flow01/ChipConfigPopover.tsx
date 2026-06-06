'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RiCheckLine, RiCornerDownLeftLine } from 'react-icons/ri';
import type { Chip as ChipModel } from '@/types/playbook';
import Checkbox from '@/components/atoms/Checkbox';
import { useAnchoredPosition, type Anchor } from './useAnchoredPosition';
import {
  readChipMeta,
  unquoteMeta,
  type ChipConfigSpec,
  type ChipConfigResult,
} from './chipConfig';
import styles from './ChipConfigPopover.module.css';

interface Props {
  /** The clicked chip's viewport rect (left + line top/bottom), to anchor against. */
  anchor: Anchor;
  spec: ChipConfigSpec;
  chip: ChipModel;
  /** Commit a new value (parent applies it to the chip and closes). */
  onCommit: (result: ChipConfigResult) => void;
  /** Close without committing (parent unmounts). */
  onClose: () => void;
}

interface ViewRow {
  key: string;
  label: string;
  sub?: string;
  selected: boolean;
  activate: () => void;
}

/**
 * ChipConfigPopover - reconfigure a placed chip in place (QoL #8), the "click the
 * cell to edit it" model. A small, light value-picker (NOT the command palette):
 * a quiet title + the action's value rows. Data-driven by `spec` (reply toggle /
 * pick-one / pick-many / free text), so the options are always the action's
 * generic enum - never case-specific content. Springs in (reduced-motion aware);
 * fixed-positioned at the chip so it never clips at a container border.
 */
export default function ChipConfigPopover({ anchor, spec, chip, onCommit, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  const currentMeta = useMemo(() => readChipMeta(chip), [chip]);

  // pick-many: the option ids whose label is currently on the chip, seeded once.
  const initialPicked = useMemo(() => {
    if (spec.kind !== 'pick-many') return new Set<string>();
    const labels = new Set(currentMeta.split(', ').map((s) => s.trim()).filter(Boolean));
    return new Set(spec.options.filter((o) => labels.has(o.label)).map((o) => o.id));
  }, [spec, currentMeta]);
  const initialKey = useMemo(() => [...initialPicked].sort().join('|'), [initialPicked]);

  const [picked, setPicked] = useState<Set<string>>(initialPicked);
  const [value, setValue] = useState(() => (spec.kind === 'input' ? unquoteMeta(currentMeta) : ''));

  const rows: ViewRow[] = useMemo(() => {
    if (spec.kind === 'reply') {
      return spec.options.map((o) => ({
        key: o.actionId,
        label: o.label,
        selected: o.actionId === chip.actionId,
        activate: () => onCommit({ kind: 'reply', actionId: o.actionId }),
      }));
    }
    if (spec.kind === 'pick-one') {
      return spec.options.map((o) => ({
        key: o.id,
        label: o.label,
        sub: o.sub,
        selected: o.label === currentMeta,
        activate: () => onCommit({ kind: 'meta', meta: o.label }),
      }));
    }
    if (spec.kind === 'pick-many') {
      return spec.options.map((o) => ({
        key: o.id,
        label: o.label,
        sub: o.sub,
        selected: picked.has(o.id),
        activate: () =>
          setPicked((prev) => {
            const next = new Set(prev);
            if (next.has(o.id)) next.delete(o.id);
            else next.add(o.id);
            return next;
          }),
      }));
    }
    return [];
  }, [spec, chip.actionId, currentMeta, picked, onCommit]);

  const selectedIdx = rows.findIndex((r) => r.selected);
  const [active, setActive] = useState(selectedIdx >= 0 ? selectedIdx : 0);

  // pick-many has no confirm button: closing commits the checked set - but only
  // if it actually changed (a no-op open/close must never rewrite the chip, which
  // would also drop any value the catalog can't represent).
  const commitMany = () => {
    if (spec.kind !== 'pick-many') return onClose();
    if ([...picked].sort().join('|') === initialKey) return onClose();
    const labels = spec.options.filter((o) => picked.has(o.id)).map((o) => o.label);
    if (labels.length) onCommit({ kind: 'meta', meta: labels.join(', ') });
    else onClose();
  };
  const commitInput = () => {
    const v = value.trim();
    if (!v || (spec.kind === 'input' && (spec.quote ? `"${v}"` : v) === currentMeta)) return onClose();
    onCommit({ kind: 'meta', meta: spec.kind === 'input' && spec.quote ? `"${v}"` : v });
  };
  // Esc / outside-click: pick-many finalizes its checks; everything else (which
  // commits explicitly on click/Enter) just closes.
  const closeSoft = () => (spec.kind === 'pick-many' ? commitMany() : onClose());

  useEffect(() => {
    if (spec.kind === 'input') inputRef.current?.focus();
    else ref.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeSoft();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.kind, picked, value]);

  const fallback = (() => {
    if (typeof window === 'undefined') return { left: anchor.left, top: anchor.bottom + 6 };
    const z =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-scale')) || 1;
    return { left: anchor.left / z, top: (anchor.bottom + 6) / z };
  })();
  const pos = useAnchoredPosition(anchor, ref);
  const place = pos ?? fallback;

  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || (e.key === ' ' && spec.kind === 'pick-many')) {
      e.preventDefault();
      rows[active]?.activate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSoft();
    }
  };

  const isMany = spec.kind === 'pick-many';

  return (
    <motion.div
      ref={ref}
      className={styles.pop}
      style={{ left: place.left, top: place.top }}
      role={spec.kind === 'input' ? 'dialog' : 'listbox'}
      aria-label={`${spec.title} - reconfigure`}
      tabIndex={-1}
      onKeyDown={spec.kind === 'input' ? undefined : onKey}
      initial={reduce ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
    >
      <div className={styles.title}>{spec.title}</div>

      {spec.kind === 'input' ? (
        <div className={styles.inputWrap}>
          <input
            ref={inputRef}
            className={styles.input}
            value={value}
            placeholder={spec.placeholder}
            spellCheck={false}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitInput();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          />
          <div className={styles.inputHint}>
            Press{' '}
            <kbd className={styles.cap}>
              <RiCornerDownLeftLine />
            </kbd>{' '}
            to save
          </div>
        </div>
      ) : (
        <div className={styles.rows} role="presentation">
          {rows.map((row, i) => (
            <button
              key={row.key}
              type="button"
              role="option"
              aria-selected={row.selected}
              className={`${styles.row} ${i === active ? styles.rowActive : ''}`}
              onMouseEnter={() => setActive(i)}
              {...(isMany
                ? {
                    onMouseDown: (e: React.MouseEvent) => {
                      e.preventDefault();
                      row.activate();
                    },
                  }
                : { onClick: () => row.activate() })}
            >
              <span className={styles.rowText}>
                <span className={styles.rowLabel}>{row.label}</span>
                {row.sub && <span className={styles.rowSub}>{row.sub}</span>}
              </span>
              {isMany ? (
                <span className={styles.rowBox}>
                  <Checkbox presentational size={16} checked={row.selected} />
                </span>
              ) : (
                row.selected && <RiCheckLine className={styles.rowCheck} aria-hidden />
              )}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
