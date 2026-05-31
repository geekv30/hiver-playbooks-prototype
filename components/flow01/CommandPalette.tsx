'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ComponentType,
  SVGProps,
} from 'react';
import {
  RiSearchLine,
  RiAtLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiCornerDownLeftLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckLine,
} from 'react-icons/ri';
import type { ConnectorSlug } from '@/types/playbook';
import { findAction } from '@/data/library';
import { ACTION_ICON } from '@/components/icons/ui';
import { CONNECTOR_ICON } from '@/components/icons/connectors';
import {
  PALETTE_ACTIONS,
  PALETTE_CONNECTORS,
  REFERENCE_ID,
  connectorName,
  connectorVerbs,
  actionBehavior,
  PickerOption,
} from './paletteCatalog';
import styles from './CommandPalette.module.css';

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

// Which page the palette is showing. null = root.
type Drill =
  | { type: 'connector'; slug: ConnectorSlug }
  | { type: 'action'; id: string };

interface Props {
  /** Caret anchor in visual viewport coords (left, line top/bottom). */
  anchor: { left: number; top: number; bottom: number };
  /** Insert: an ACTIONS id (with optional meta value), or 'reference' + ref path. */
  onSelect: (actionId: string, meta?: string) => void;
  onClose: () => void;
  /** Which world to open on: '/' lands on Actions (root), '@' on References. */
  initialScope?: 'actions' | 'references';
  /** Render in-flow (relative) instead of a fixed caret popover — for the review page. */
  presentation?: boolean;
}

interface Row {
  key: string;
  label: string;
  sub?: string;
  Icon: IconCmp | null;
  brand: boolean; // brand icon → render in true color, not currentColor
  drill: boolean; // trailing chevron — opens another page
  selectable: boolean; // multi-select → right-aligned check
  selected: boolean;
  activate: () => void; // click / Enter
}

interface Group {
  key: string;
  label: string;
  rows: Row[];
}

function actionIcon(id: string): IconCmp | null {
  if (id === REFERENCE_ID) return RiAtLine;
  const a = findAction(id);
  return (a && ACTION_ICON[a.iconKey]) || null;
}

export default function CommandPalette({ anchor, onSelect, onClose, initialScope, presentation }: Props) {
  const [query, setQuery] = useState('');
  // '@' opens straight on the References picker; '/' (default) opens the root
  // Actions+Connectors view. Back/cross-links keep the two worlds reachable.
  const [drill, setDrill] = useState<Drill | null>(
    initialScope === 'references' ? { type: 'action', id: REFERENCE_ID } : null,
  );
  const [picked, setPicked] = useState<Set<string>>(new Set()); // pick-many state
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // The action page (pick-one / pick-many / input), if drilled into an action.
  const behavior = drill?.type === 'action' ? actionBehavior(drill.id) : null;
  const isInputPage = behavior?.mode === 'input';
  const isPickMany = behavior?.mode === 'pick-many';

  // Commit a pick-many page: insert one chip whose meta lists the picked labels.
  const confirmMany = () => {
    if (drill?.type !== 'action' || behavior?.mode !== 'pick-many') return;
    const labels = behavior.options.filter((o) => picked.has(o.id)).map((o) => o.label);
    if (!labels.length) return;
    onSelect(drill.id, labels.join(', '));
  };

  // Insert a single picked value (pick-one). Reference inserts a @ref instead.
  const choose = (actionId: string, opt: PickerOption) => {
    if (actionId === REFERENCE_ID) onSelect(REFERENCE_ID, opt.id); // opt.id = ref path
    else onSelect(actionId, opt.label);
  };

  const groups: Group[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    // --- Action page (pick-one / pick-many / input) --------------------------
    if (drill?.type === 'action' && behavior && behavior.mode !== 'insert') {
      if (behavior.mode === 'input') return []; // rendered separately, not as rows
      const opts = behavior.options.filter((o) =>
        q ? (o.label + ' ' + (o.sub ?? '')).toLowerCase().includes(q) : true,
      );
      const rows: Row[] = opts.map((o) => ({
        key: o.id,
        label: o.label,
        sub: o.sub,
        Icon: null,
        brand: false,
        drill: false,
        selectable: behavior.mode === 'pick-many',
        selected: picked.has(o.id),
        activate:
          behavior.mode === 'pick-many'
            ? () =>
                setPicked((prev) => {
                  const next = new Set(prev);
                  if (next.has(o.id)) next.delete(o.id);
                  else next.add(o.id);
                  return next;
                })
            : () => choose(drill.id, o),
      }));
      return [{ key: 'opts', label: behavior.title, rows }];
    }

    // --- Connector page (single-select verbs) --------------------------------
    if (drill?.type === 'connector') {
      const verbs = connectorVerbs(drill.slug).filter((v) =>
        q ? v.label.toLowerCase().includes(q) : true,
      );
      const rows: Row[] = verbs.map((v) => ({
        key: v.id,
        label: v.label,
        Icon: CONNECTOR_ICON[drill.slug],
        brand: true,
        drill: false,
        selectable: false,
        selected: false,
        activate: () => onSelect(v.id),
      }));
      return [{ key: 'verbs', label: `${connectorName(drill.slug)} actions`, rows }];
    }

    // --- Flat search across everything ---------------------------------------
    if (q) {
      const actionRows: Row[] = PALETTE_ACTIONS.filter((a) => a.label.toLowerCase().includes(q)).map(
        (a) => {
          const b = actionBehavior(a.id);
          const drills = b.mode !== 'insert';
          return {
            key: a.id,
            label: a.label,
            Icon: actionIcon(a.id),
            brand: false,
            drill: drills,
            selectable: false,
            selected: false,
            activate: drills ? () => openAction(a.id) : () => onSelect(a.id),
          };
        },
      );

      const verbRows: Row[] = [];
      PALETTE_CONNECTORS.forEach((slug) => {
        connectorVerbs(slug).forEach((v) => {
          if (`${connectorName(slug)} ${v.label}`.toLowerCase().includes(q)) {
            verbRows.push({
              key: v.id,
              label: `${connectorName(slug)} · ${v.label}`,
              Icon: CONNECTOR_ICON[slug],
              brand: true,
              drill: false,
              selectable: false,
              selected: false,
              activate: () => onSelect(v.id),
            });
          }
        });
      });

      const g: Group[] = [];
      if (actionRows.length) g.push({ key: 'actions', label: 'Actions', rows: actionRows });
      if (verbRows.length) g.push({ key: 'connectors', label: 'Connectors', rows: verbRows });
      return g;
    }

    // --- Root ----------------------------------------------------------------
    const actionRows: Row[] = PALETTE_ACTIONS.map((a) => {
      const b = actionBehavior(a.id);
      const drills = b.mode !== 'insert';
      return {
        key: a.id,
        label: a.label,
        Icon: actionIcon(a.id),
        brand: false,
        drill: drills,
        selectable: false,
        selected: false,
        activate: drills ? () => openAction(a.id) : () => onSelect(a.id),
      };
    });
    const brandRows: Row[] = PALETTE_CONNECTORS.map((slug) => ({
      key: `brand-${slug}`,
      label: connectorName(slug),
      Icon: CONNECTOR_ICON[slug],
      brand: true,
      drill: true,
      selectable: false,
      selected: false,
      activate: () => setDrill({ type: 'connector', slug }),
    }));
    return [
      { key: 'actions', label: 'Actions', rows: actionRows },
      { key: 'connectors', label: 'Connectors', rows: brandRows },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, drill, behavior, picked, onSelect]);

  function openAction(id: string) {
    setQuery('');
    setPicked(new Set());
    setDrill({ type: 'action', id });
  }

  const flatRows = useMemo(() => groups.flatMap((g) => g.rows), [groups]);

  // Focus the search input on mount and whenever the page changes.
  useEffect(() => {
    inputRef.current?.focus();
  }, [drill]);
  useEffect(() => setActive(0), [query, drill]);

  // Keep the active row in view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const goBack = () => {
    setQuery('');
    setPicked(new Set());
    setDrill(null);
  };

  // Closing a pick-many page commits the checked values (there is no confirm
  // button — per the Figma, esc/outside-click "close" finalizes the selection).
  const closePalette = () => {
    if (drill?.type === 'action' && behavior?.mode === 'pick-many' && picked.size > 0) {
      confirmMany(); // inserts → parent unmounts the palette
    } else {
      onClose();
    }
  };

  // Close on outside click (not in presentation mode — it's an in-flow demo).
  useEffect(() => {
    if (presentation) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) closePalette();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, presentation, drill, behavior, picked]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flatRows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isInputPage) {
        const v = query.trim();
        if (v && drill?.type === 'action') {
          const quoted = behavior?.mode === 'input' && behavior.quote ? `"${v}"` : v;
          onSelect(drill.id, quoted);
        }
        return;
      }
      // pick-many: Enter toggles the focused row (commit happens on close).
      flatRows[active]?.activate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    } else if (e.key === 'Backspace' && query === '' && drill) {
      e.preventDefault();
      goBack();
    }
  };

  // Position below the caret. Anchor is visual coords; this popover is fixed
  // inside the zoomed .app-scale, so divide by the scale.
  // SSR-safe: only touches window/document on the client and when fixed.
  const width = 324;
  let left = 0;
  let top = 0;
  if (!presentation && typeof window !== 'undefined') {
    const zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-scale')) || 1;
    const visualLeft = Math.max(12, Math.min(anchor.left, window.innerWidth - width * zoom - 12));
    left = visualLeft / zoom;
    top = (anchor.bottom + 6) / zoom;
  }

  // Drill-page header (single row: back chevron + page icon + title).
  let PageIcon: IconCmp | null = null;
  let pageIsBrand = false;
  let pageTitle = '';
  if (drill?.type === 'connector') {
    PageIcon = CONNECTOR_ICON[drill.slug];
    pageIsBrand = true;
    pageTitle = `${connectorName(drill.slug)} actions`;
  } else if (drill?.type === 'action' && behavior && behavior.mode !== 'insert') {
    PageIcon = actionIcon(drill.id);
    pageTitle = behavior.title;
  }

  let rowIndex = -1;

  return (
    <div
      ref={popRef}
      className={`${styles.pop} ${presentation ? styles.popStatic : ''}`}
      style={presentation ? { width } : { left, top, width }}
      role="dialog"
      aria-label="Insert action"
    >
      {/* Search (or input-page field) */}
      <div className={styles.search}>
        <RiSearchLine className={styles.searchIco} aria-hidden />
        <input
          ref={inputRef}
          className={styles.searchInput}
          placeholder={
            behavior && behavior.mode !== 'insert'
              ? behavior.placeholder
              : 'Search for any actions, connectors...'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
        />
      </div>

      {/* Results card */}
      <div className={styles.card} ref={listRef}>
        {drill && (
          <button type="button" className={styles.pageHead} onClick={goBack}>
            <RiArrowLeftSLine className={styles.pageHeadBack} aria-hidden />
            {PageIcon && (
              <span className={`${styles.pageHeadIco} ${pageIsBrand ? styles.pageHeadIcoBrand : ''}`}>
                <PageIcon />
              </span>
            )}
            <span className={styles.pageHeadTitle}>{pageTitle}</span>
          </button>
        )}

        {isInputPage && behavior?.mode === 'input' && (
          <div className={styles.inputPage}>
            <div className={styles.inputHint}>
              {query.trim() ? (
                <>Press <kbd className={styles.cap}><RiCornerDownLeftLine /></kbd> to insert</>
              ) : (
                behavior.title
              )}
            </div>
          </div>
        )}

        {!isInputPage && flatRows.length === 0 && (
          <div className={styles.empty}>No matches for “{query.trim()}”.</div>
        )}

        {!isInputPage &&
          groups.map((g) => (
            <div key={g.key} className={styles.group}>
              {!drill && <div className={styles.groupLabel}>{g.label}</div>}
              <div className={styles.rows}>
                {g.rows.map((row) => {
                  rowIndex += 1;
                  const idx = rowIndex;
                  const isActive = idx === active;
                  // Toggle rows (pick-many) use mousedown+preventDefault to keep
                  // the search input focused; navigation/insert rows use click so
                  // the press completes before the list changes underneath.
                  const handlers = row.selectable
                    ? {
                        onMouseDown: (e: ReactMouseEvent) => {
                          e.preventDefault();
                          row.activate();
                        },
                      }
                    : { onClick: () => row.activate() };
                  return (
                    <button
                      key={row.key}
                      type="button"
                      data-row={idx}
                      className={`${styles.row} ${row.selectable || (!row.Icon && !row.brand) ? styles.rowPlain : ''} ${isActive ? styles.rowActive : ''}`}
                      onMouseEnter={() => setActive(idx)}
                      role="option"
                      aria-selected={isActive}
                      {...handlers}
                    >
                      {row.Icon && !row.selectable && (
                        <span className={`${styles.rowIco} ${row.brand ? styles.rowIcoBrand : ''}`}>
                          <row.Icon />
                        </span>
                      )}
                      <span className={styles.rowText}>
                        <span className={styles.rowLabel}>{row.label}</span>
                        {row.sub && <span className={styles.rowSub}>{row.sub}</span>}
                      </span>
                      {row.drill && <RiArrowRightSLine className={styles.rowChevron} aria-hidden />}
                      {row.selectable && (
                        <span className={styles.rowCheck} aria-hidden>
                          {row.selected && <RiCheckLine />}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* Footer hints */}
      <div className={styles.footer}>
        {isInputPage ? (
          <>
            <span className={styles.hint}>
              <kbd className={styles.cap}><RiCornerDownLeftLine /></kbd>
              insert
            </span>
            <span className={styles.hint}>
              <kbd className={`${styles.cap} ${styles.capWide}`}>esc</kbd>
              close
            </span>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
