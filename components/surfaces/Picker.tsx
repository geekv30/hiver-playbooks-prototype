'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ActionDef, Ref } from '@/types/playbook';
import { ACTIONS, BUCKETS } from '@/data/library';
import { DEFAULT_REFS, REF_GROUPS } from '@/data/refs';
import { FIELD_ICON } from '@/components/icons/fields';
import { CONNECTOR_ICON } from '@/components/icons/connectors';
import { ACTION_ICON } from '@/components/icons/ui';
import styles from './Picker.module.css';

export type PickerScope = 'action' | 'ref' | 'global';

interface Props {
  scope: PickerScope;
  query: string;
  onQuery: (q: string) => void;
  /** Caret-anchored position; null for centered (Cmd+K). */
  anchor: { top: number; left: number } | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** Optional ref list override (used by tests / playbook-specific scopes). */
  refs?: Ref[];
}

const WIDTH_BY_SCOPE: Record<PickerScope, number> = {
  action: 420,
  ref: 360,
  global: 520,
};

const SCOPE_LABEL: Record<PickerScope, string> = {
  action: 'Action',
  ref: 'Ref',
  global: 'All',
};

const PLACEHOLDER_BY_SCOPE: Record<PickerScope, string> = {
  action: 'Insert action...',
  ref: 'Insert ref...',
  global: 'Search everywhere...',
};

export default function Picker({ scope, query, onQuery, anchor, onSelect, onClose, refs = DEFAULT_REFS }: Props) {
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Filtered items
  const items: ReadonlyArray<ActionDef | Ref> = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (scope === 'action' || scope === 'global') {
      return ACTIONS.filter((a) =>
        !q || a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q) || a.id.includes(q),
      );
    }
    return refs.filter((r) =>
      !q || r.label.toLowerCase().includes(q) || r.path.toLowerCase().includes(q),
    );
  }, [scope, query, refs]);

  useEffect(() => { setHighlightIdx(0); }, [scope, query]);

  // Keyboard handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(items.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[highlightIdx];
        if (item) onSelect(item.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, highlightIdx, onSelect, onClose]);

  // Autofocus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!mounted) return null;
  const centered = scope === 'global' || !anchor;
  const width = WIDTH_BY_SCOPE[scope];

  const positionStyle: React.CSSProperties = centered
    ? { width }
    : { top: anchor!.top, left: anchor!.left, width };

  const popClasses = [styles.pop, centered ? styles.popCentered : ''].filter(Boolean).join(' ');

  // For each row, render icon + name + sub + optional kbd
  function renderRow(item: ActionDef | Ref, globalIdx: number) {
    const isAction = 'bucket' in item;
    const onHover = () => setHighlightIdx(globalIdx);
    const onClick = () => onSelect(item.id);
    const isCursor = globalIdx === highlightIdx;
    const rowClass = [styles.popRow, isCursor ? styles.cursor : ''].filter(Boolean).join(' ');

    if (isAction) {
      const a = item;
      const ConnIcon = a.connectorSlug ? CONNECTOR_ICON[a.connectorSlug] : null;
      const VerbIcon = !a.connectorSlug ? ACTION_ICON[a.iconKey] : null;
      const Icon = ConnIcon ?? VerbIcon ?? null;
      const icoClass = [styles.popRowIco, a.connectorSlug ? styles.brand : ''].filter(Boolean).join(' ');
      return (
        <div key={a.id} className={rowClass} onMouseEnter={onHover} onClick={onClick} role="option" aria-selected={isCursor}>
          <span className={icoClass}>{Icon && <Icon />}</span>
          <span className={styles.popRowText}>
            <span className={styles.popRowName}>{a.name}</span>
            <span className={styles.popRowSub}>
              {a.desc}
              <span className={styles.popSubSep}>·</span>
              <span className={styles.popSubMono}>{a.id}</span>
            </span>
          </span>
          {a.shortcut && (
            <span className={styles.popRowShortcut}>
              <span className={styles.popRowShortcutKbd}>{a.shortcut}</span>
            </span>
          )}
        </div>
      );
    } else {
      const r = item;
      const FIcon = FIELD_ICON[r.type];
      return (
        <div key={r.id} className={rowClass} onMouseEnter={onHover} onClick={onClick} role="option" aria-selected={isCursor}>
          <span className={styles.popRowIco}>{FIcon && <FIcon />}</span>
          <span className={styles.popRowText}>
            <span className={styles.popRowName}>{r.label}</span>
            <span className={styles.popRowSub}>
              <span className={styles.popSubMono}>{r.path}</span>
              <span className={styles.popSubSep}>·</span>
              <span className={styles.popSubType}>{r.type}</span>
            </span>
          </span>
        </div>
      );
    }
  }

  // Build sectioned list. Use a running index so highlight position maps correctly.
  const sections: React.ReactNode[] = [];
  let runningIdx = 0;
  if (scope === 'action' || scope === 'global') {
    for (const b of BUCKETS) {
      const inBucket = (items as ActionDef[]).filter((a) => a.bucket === b.id);
      if (inBucket.length === 0) continue;
      sections.push(
        <div key={`section-${b.id}`}>
          <div className={styles.popSectionLabel}>
            {b.label}
            <span className={styles.popSectionCount}>{inBucket.length}</span>
          </div>
          {inBucket.map((a) => {
            const node = renderRow(a, runningIdx);
            runningIdx += 1;
            return node;
          })}
        </div>,
      );
    }
  } else {
    for (const g of REF_GROUPS) {
      const inGroup = (items as Ref[]).filter((r) => r.group === g.key);
      if (inGroup.length === 0) continue;
      sections.push(
        <div key={`section-${g.key}`}>
          <div className={styles.popSectionLabel}>
            {g.label}
            <span className={styles.popSectionCount}>{inGroup.length}</span>
          </div>
          {inGroup.map((r) => {
            const node = renderRow(r, runningIdx);
            runningIdx += 1;
            return node;
          })}
        </div>,
      );
    }
  }

  const empty = items.length === 0;

  const body = (
    <>
      {centered && <div className={styles.popBackdrop} onClick={onClose} aria-hidden="true" />}
      <div
        className={popClasses}
        style={positionStyle}
        role="listbox"
        aria-label={`${SCOPE_LABEL[scope]} picker`}
      >
        <div className={styles.popHead}>
          {scope === 'ref' ? <span className={styles.popPrefixAt}>@</span> : null}
          <input
            ref={inputRef}
            className={styles.popInput}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={PLACEHOLDER_BY_SCOPE[scope]}
            autoFocus
            aria-label={PLACEHOLDER_BY_SCOPE[scope]}
          />
          <span className={styles.popScope}>{SCOPE_LABEL[scope]}</span>
        </div>
        <div className={styles.popBody}>
          {!empty && sections}
          {empty && (
            <div className={styles.popEmpty}>
              <div className={styles.popEmptyMsg}>No results</div>
              <div className={styles.popEmptyHint}>Try a different keyword</div>
              {scope === 'ref' && (
                <span className={styles.popEmptyCreate} onClick={() => onSelect('__create__')}>
                  Create new ref
                </span>
              )}
            </div>
          )}
        </div>
        <div className={styles.popFoot}>
          <span className={styles.popLegend}>
            <span className={styles.popLegendGrp}>
              <span className={styles.popLegendKbd}>↑</span>
              <span className={styles.popLegendKbd}>↓</span>
              navigate
            </span>
            <span className={styles.popLegendGrp}>
              <span className={styles.popLegendKbd}>↵</span>
              select
            </span>
            <span className={styles.popLegendGrp}>
              <span className={styles.popLegendKbd}>esc</span>
              close
            </span>
          </span>
          <span className={styles.popFootCount}>{items.length}</span>
        </div>
      </div>
    </>
  );

  return createPortal(body, document.body);
}
