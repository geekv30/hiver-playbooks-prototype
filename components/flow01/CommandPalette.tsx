'use client';

import {
  useEffect,
  useLayoutEffect,
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
} from 'react-icons/ri';
import type { ConnectorSlug } from '@/types/playbook';
import Checkbox from '@/components/atoms/Checkbox';
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
type Drill = { type: 'connector'; slug: ConnectorSlug } | { type: 'action'; id: string };

interface Props {
  /** Caret anchor in visual viewport coords (left, line top/bottom). */
  anchor: { left: number; top: number; bottom: number };
  /** Insert: an ACTIONS id (with optional meta value), or 'reference' + ref path. */
  onSelect: (actionId: string, meta?: string) => void;
  /** Realtime: the in-progress selection (action + live config), so the parent can
   *  update the "@ action" placeholder chip as the user navigates. null = none yet. */
  onPreview?: (actionId: string | null, meta?: string) => void;
  onClose: () => void;
  /** Which world to open on: '/' lands on Actions (root), '@' on References. */
  initialScope?: 'actions' | 'references';
  /** Render in-flow (relative) instead of a fixed caret popover - for the review page. */
  presentation?: boolean;
  /** Hide the "Condition" action - used inside a branch body, where nesting another
   *  condition is disallowed (the block stays one level deep). */
  noCondition?: boolean;
  /** Open already drilled into this action's value page - used to reconfigure a
   *  placed chip by reopening the palette on its page (e.g. the tag list). */
  initialAction?: string;
  /** Pre-checked option ids on a pick-many page (the chip's current values). */
  initialPicked?: string[];
  /** Pre-fill the search/input field (e.g. a chip's current KB-search query). */
  initialQuery?: string;
  /** Open directly on a connector's actions as a MULTI-select (the post-connect
   *  "select action" picker). The picked verbs commit back to the carrier chip as
   *  its value. `initialPicked` pre-checks the chip's current actions. */
  connectorPick?: { slug: ConnectorSlug; carrierId: string };
}

interface Row {
  key: string;
  label: string;
  sub?: string;
  Icon: IconCmp | null;
  brand: boolean; // brand icon → render in true color, not currentColor
  drill: boolean; // trailing chevron - opens another page
  selectable: boolean; // multi-select → right-aligned check
  selected: boolean;
  desc?: string; // hover/keyboard tooltip copy (omitted for value-picker rows)
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

// Brief, plain-language tooltip copy. Catalog actions carry their own `desc`;
// these cover the palette-only entries that have no ActionDef.
const PALETTE_DESC: Record<string, string> = {
  condition: 'Branch the AOP - take a different path when a condition is true or false.',
  [REFERENCE_ID]: 'Insert a value from the email, the customer, or a connector.',
  wait: 'Pause the AOP until a set time.',
};
const rowDesc = (id: string): string | undefined => findAction(id)?.desc ?? PALETTE_DESC[id];

export default function CommandPalette({
  anchor,
  onSelect,
  onPreview,
  onClose,
  initialScope,
  presentation,
  noCondition,
  initialAction,
  initialPicked,
  initialQuery,
  connectorPick,
}: Props) {
  const [query, setQuery] = useState(initialQuery ?? '');
  // '@' opens straight on the References picker; '/' (default) opens the root
  // Actions+Connectors view. `initialAction` opens straight on an action's value
  // page (reconfiguring a placed chip). `connectorPick` opens straight on a
  // connector's actions as a multi-select. Back/cross-links keep the worlds reachable.
  const [drill, setDrill] = useState<Drill | null>(
    connectorPick
      ? { type: 'connector', slug: connectorPick.slug }
      : initialAction
        ? { type: 'action', id: initialAction }
        : initialScope === 'references'
          ? { type: 'action', id: REFERENCE_ID }
          : null,
  );
  const [picked, setPicked] = useState<Set<string>>(new Set(initialPicked ?? [])); // pick-many state
  const [active, setActive] = useState(0);
  // Drill navigation direction, for the page slide. null on first open (no slide).
  const [dir, setDir] = useState<'fwd' | 'back' | null>(null);
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

  // Commit the connector multi-select back to the carrier tag (empty = stays
  // "select action"). Closing the page finalizes the selection (like pick-many).
  const confirmConnector = () => {
    if (!connectorPick || drill?.type !== 'connector') return;
    const labels = connectorVerbs(drill.slug)
      .filter((v) => picked.has(v.id))
      .map((v) => v.label);
    onSelect(connectorPick.carrierId, labels.join(', '));
  };

  // Insert a single picked value (pick-one). Reference inserts a @ref instead.
  const choose = (actionId: string, opt: PickerOption) => {
    if (actionId === REFERENCE_ID)
      onSelect(REFERENCE_ID, opt.id); // opt.id = ref path
    else onSelect(actionId, opt.label);
  };

  const groups: Group[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Inside a branch body, "Condition" is omitted - an arm never nests a condition.
    const actions = noCondition ? PALETTE_ACTIONS.filter((a) => a.id !== 'condition') : PALETTE_ACTIONS;

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

    // --- Connector page --------------------------------------------------------
    // Single-select (insert one verb chip) by default; MULTI-select when opened as
    // the post-connect "select action" picker (connectorPick) - the checked verbs
    // commit back to the carrier tag as its value.
    if (drill?.type === 'connector') {
      const slug = drill.slug;
      const multi = !!connectorPick;
      const verbs = connectorVerbs(slug).filter((v) =>
        q ? v.label.toLowerCase().includes(q) : true,
      );
      const rows: Row[] = verbs.map((v) => ({
        key: v.id,
        label: v.label,
        Icon: CONNECTOR_ICON[slug],
        brand: true,
        drill: false,
        selectable: multi,
        selected: multi && picked.has(v.id),
        desc: findAction(v.id)?.desc,
        activate: multi
          ? () =>
              setPicked((prev) => {
                const next = new Set(prev);
                if (next.has(v.id)) next.delete(v.id);
                else next.add(v.id);
                return next;
              })
          : () => onSelect(v.id),
      }));
      return [{ key: 'verbs', label: `${connectorName(slug)} actions`, rows }];
    }

    // --- Flat search across everything ---------------------------------------
    if (q) {
      const actionRows: Row[] = actions.filter((a) =>
        a.label.toLowerCase().includes(q),
      ).map((a) => {
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
          desc: rowDesc(a.id),
          activate: drills ? () => openAction(a.id) : () => onSelect(a.id),
        };
      });

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
              desc: findAction(v.id)?.desc,
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
    const actionRows: Row[] = actions.map((a) => {
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
        desc: rowDesc(a.id),
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
      desc: `Run a ${connectorName(slug)} action.`,
      activate: () => {
        setDir('fwd');
        setDrill({ type: 'connector', slug });
      },
    }));
    return [
      { key: 'actions', label: 'Actions', rows: actionRows },
      { key: 'connectors', label: 'Connectors', rows: brandRows },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, drill, behavior, picked, onSelect, noCondition, connectorPick]);

  function openAction(id: string) {
    setDir('fwd');
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

  // Realtime preview: reflect the in-progress selection onto the "@ action"
  // placeholder chip as the user drills + toggles (Figma 647:41314 - the chip
  // updates live to "Tag · dev-support, api error"). Root/connector pages keep it
  // a placeholder; an action page shows the action + (for pick-many) the values.
  useEffect(() => {
    if (!onPreview) return;
    if (drill?.type === 'action' && behavior && behavior.mode !== 'insert') {
      if (behavior.mode === 'pick-many') {
        const labels = behavior.options.filter((o) => picked.has(o.id)).map((o) => o.label);
        onPreview(drill.id, labels.join(', '));
      } else {
        onPreview(drill.id, '');
      }
    } else {
      onPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drill, picked, behavior]);

  // Keep the active row in view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const goBack = () => {
    setDir('back');
    setQuery('');
    setPicked(new Set());
    setDrill(null);
  };

  // Closing a pick-many page commits the checked values (there is no confirm
  // button - per the Figma, esc/outside-click "close" finalizes the selection).
  const closePalette = () => {
    if (connectorPick && drill?.type === 'connector') {
      confirmConnector(); // commits the picked actions back to the tag
    } else if (drill?.type === 'action' && behavior?.mode === 'pick-many' && picked.size > 0) {
      confirmMany(); // inserts → parent unmounts the palette
    } else {
      onClose();
    }
  };

  // Close on outside click (not in presentation mode - it's an in-flow demo).
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

  // Position the popover. Anchor is visual-viewport coords; this popover is fixed
  // inside the zoomed .app-scale, so CSS left/top live in layout px (= visual / zoom).
  // SSR-safe: only touches window/document on the client and when fixed.
  const width = 324;
  let left = 0;
  let top = 0;
  if (!presentation && typeof window !== 'undefined') {
    const zoom =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-scale')) || 1;
    const visualLeft = Math.max(12, Math.min(anchor.left, window.innerWidth - width * zoom - 12));
    left = visualLeft / zoom;
    top = (anchor.bottom + 6) / zoom; // first-pass: below the caret (refined below)
  }

  // Measured vertical placement: prefer below the caret, flip ABOVE when the
  // popover would run off the bottom, and clamp into the viewport when neither
  // side fully fits (the results card scrolls internally). Runs before paint, so
  // the corrected position is the first thing shown - no flash, no off-screen menu.
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (presentation || typeof window === 'undefined') return;
    const el = popRef.current;
    if (!el) return;
    const zoom =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-scale')) || 1;
    const margin = 12;
    const vh = window.innerHeight;
    // getBoundingClientRect returns visual (zoom-applied) px - the same space as anchor.
    const h = el.getBoundingClientRect().height;
    const spaceBelow = vh - anchor.bottom - margin;
    const spaceAbove = anchor.top - margin;

    let visualTop: number;
    if (h <= spaceBelow) {
      visualTop = anchor.bottom + 6; // fits below
    } else if (h <= spaceAbove) {
      visualTop = anchor.top - 6 - h; // flip above
    } else if (spaceBelow >= spaceAbove) {
      visualTop = vh - margin - h; // clamp to the bottom edge
    } else {
      visualTop = margin; // clamp to the top edge
    }
    visualTop = Math.max(margin, Math.min(visualTop, vh - margin - h));

    const visualLeft = Math.max(margin, Math.min(anchor.left, window.innerWidth - width * zoom - margin));
    const next = { left: visualLeft / zoom, top: visualTop / zoom };
    setPos((prev) =>
      prev && Math.abs(prev.left - next.left) < 0.5 && Math.abs(prev.top - next.top) < 0.5
        ? prev
        : next,
    );
  });

  // Hover/keyboard tooltip: a brief description of the active row, shown to the
  // side of the palette (the Fin pattern). It follows `active`, which BOTH hover
  // (onMouseEnter) and arrow-key nav update - so one tooltip serves both. A short
  // open delay on first appearance; once open it tracks the active row instantly.
  const TIP_W = 236; // layout px
  const [tip, setTip] = useState<{ text: string; left: number; top: number; side: 'right' | 'left' } | null>(
    null,
  );
  const tipOpened = useRef(false);
  const tipTimer = useRef<number | null>(null);
  useEffect(() => {
    if (presentation || typeof window === 'undefined') return;
    const text = flatRows[active]?.desc;
    if (!text) {
      setTip(null);
      if (tipTimer.current) window.clearTimeout(tipTimer.current);
      return;
    }
    const place = () => {
      const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`);
      const pop = popRef.current;
      if (!el || !pop) return;
      const zoom =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-scale')) || 1;
      const pr = pop.getBoundingClientRect();
      const rr = el.getBoundingClientRect();
      const gap = 10;
      const margin = 12;
      const tipWv = TIP_W * zoom;
      const rowCenter = rr.top + rr.height / 2;
      // Prefer the right of the palette; flip left when it would run off-screen.
      let side: 'right' | 'left' = 'right';
      let leftV = pr.right + gap;
      if (leftV + tipWv > window.innerWidth - margin) {
        side = 'left';
        leftV = pr.left - gap - tipWv;
      }
      setTip({ text, left: leftV / zoom, top: rowCenter / zoom, side });
    };
    const run = () => requestAnimationFrame(place);
    if (tipOpened.current) {
      run();
    } else {
      if (tipTimer.current) window.clearTimeout(tipTimer.current);
      tipTimer.current = window.setTimeout(() => {
        tipOpened.current = true;
        run();
      }, 320);
    }
    return () => {
      if (tipTimer.current) window.clearTimeout(tipTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, flatRows, presentation]);

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

  // Remount key for the drill page - changes only when the drill TARGET changes
  // (not on query/pick), so typing or toggling never replays the slide.
  const pageKey = drill
    ? drill.type === 'connector'
      ? `c:${drill.slug}`
      : `a:${drill.id}`
    : 'root';

  return (
    <>
    <div
      ref={popRef}
      className={`${styles.pop} ${presentation ? styles.popStatic : ''}`}
      style={presentation ? { width } : { left: pos?.left ?? left, top: pos?.top ?? top, width }}
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
        <div className={styles.page} data-dir={dir ?? undefined} key={pageKey}>
          {drill && (
            <button type="button" className={styles.pageHead} onClick={goBack}>
              <RiArrowLeftSLine className={styles.pageHeadBack} aria-hidden />
              {PageIcon && (
                <span
                  className={`${styles.pageHeadIco} ${pageIsBrand ? styles.pageHeadIcoBrand : ''}`}
                >
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
                  <>
                    Press{' '}
                    <kbd className={styles.cap}>
                      <RiCornerDownLeftLine />
                    </kbd>{' '}
                    to insert
                  </>
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
                          <span
                            className={`${styles.rowIco} ${row.brand ? styles.rowIcoBrand : ''}`}
                          >
                            <row.Icon />
                          </span>
                        )}
                        <span className={styles.rowText}>
                          <span className={styles.rowLabel}>{row.label}</span>
                          {row.sub && <span className={styles.rowSub}>{row.sub}</span>}
                        </span>
                        {row.drill && (
                          <RiArrowRightSLine className={styles.rowChevron} aria-hidden />
                        )}
                        {row.selectable && (
                          <span className={styles.rowBox}>
                            <Checkbox presentational size={16} checked={row.selected} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Footer hints */}
      <div className={styles.footer}>
        {isInputPage ? (
          <>
            <span className={styles.hint}>
              <kbd className={styles.cap}>
                <RiCornerDownLeftLine />
              </kbd>
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
                <kbd className={styles.cap}>
                  <RiArrowUpLine />
                </kbd>
                <kbd className={styles.cap}>
                  <RiArrowDownLine />
                </kbd>
              </span>
              navigate
            </span>
            <span className={styles.hint}>
              <kbd className={styles.cap}>
                <RiCornerDownLeftLine />
              </kbd>
              select
            </span>
            <span className={styles.hint}>
              <kbd className={`${styles.cap} ${styles.capWide}`}>esc</kbd>
              {isPickMany ? 'save & close' : 'close'}
            </span>
          </>
        )}
      </div>
    </div>
    {tip && (
      <div
        className={styles.tooltip}
        data-side={tip.side}
        style={{ left: tip.left, top: tip.top, width: TIP_W }}
        role="tooltip"
        aria-hidden
      >
        {tip.text}
      </div>
    )}
    </>
  );
}
