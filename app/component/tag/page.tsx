'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  RiCloseLine, RiSearchLine, RiCheckLine, RiAddLine, RiMore2Fill,
  RiPriceTag3Line, RiAlertLine,
} from 'react-icons/ri';
import styles from './tag.module.css';

interface TagDef {
  id: string;
  name: string;
  color: string; // hex
  category?: string;
  description?: string;
  usage: number;
  spark: number[]; // last 7 days
  lastUsed: string; // relative
  archived?: boolean;
}

const PALETTE = ['#16A34A', '#2563EB', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#BE185D', '#65A30D'];

const SEED_TAGS: TagDef[] = [
  { id: 't-kumano',     name: 'kumano-kodo',           color: '#16A34A', category: 'Tour',     description: 'Kumano Kodo enquiries',  usage: 42, spark: [2,3,5,4,8,6,9], lastUsed: '2h ago' },
  { id: 't-nakasendo',  name: 'nakasendo',             color: '#16A34A', category: 'Tour',     description: 'Nakasendo trail',        usage: 27, spark: [1,2,3,3,4,5,4], lastUsed: '4h ago' },
  { id: 't-priority',   name: 'priority',              color: '#DC2626', category: 'Priority', description: 'Drop-everything urgent', usage: 8,  spark: [0,1,0,2,0,1,1], lastUsed: '6h ago' },
  { id: 't-vip',        name: 'vip',                   color: '#D97706', category: 'Priority', description: 'Returning premium guest',usage: 15, spark: [1,2,2,3,1,2,3], lastUsed: '1h ago' },
  { id: 't-warm',       name: 'warm-follow-up-needed', color: '#7C3AED', category: 'Workflow', description: 'Follow up within 5 days',usage: 31, spark: [3,4,5,4,5,4,3], lastUsed: 'just now' },
  { id: 't-dietary',    name: 'dietary',               color: '#0891B2', category: 'Customer', description: 'Vegetarian / dietary',    usage: 11, spark: [1,1,2,1,2,2,1], lastUsed: '1d ago' },
  { id: 't-bug',        name: 'bug',                   color: '#DC2626', category: 'Workflow', description: 'Product bug reported',    usage: 4,  spark: [0,0,1,0,1,1,0], lastUsed: '2d ago' },
  { id: 't-archived',   name: 'old-promo',             color: '#65A30D', category: 'Workflow', description: 'Spring 2025 promotion',  usage: 0,  spark: [0,0,0,0,0,0,0], lastUsed: '3mo ago', archived: true },
];

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <span className={styles.usageSpark}>
      {data.map((v, i) => (
        <span key={i} style={{ height: `${Math.max(2, (v / max) * 14)}px` }} />
      ))}
    </span>
  );
}

interface TagChipProps {
  tag?: TagDef;
  unconfigured?: boolean;
  selected?: boolean;
  disabled?: boolean;
  error?: boolean;
  showX?: boolean;
  showCategory?: boolean;
  showCount?: boolean;
  extraCount?: number;
  onClick?: (e: React.MouseEvent) => void;
  onRemove?: (e: React.MouseEvent) => void;
  placeholder?: string;
}
function TagChip({
  tag, unconfigured, selected, disabled, error, showX, showCategory, showCount, extraCount,
  onClick, onRemove, placeholder = 'Pick a tag…',
}: TagChipProps) {
  const cls = [styles.tag];
  if (unconfigured) cls.push(styles.tagUnconfigured);
  if (selected) cls.push(styles.tagSelected);
  if (disabled) cls.push(styles.tagDisabled);
  if (error) cls.push(styles.tagError);

  return (
    <span className={cls.join(' ')} onClick={onClick}>
      {unconfigured ? (
        <>
          <RiPriceTag3Line style={{ width: 11, height: 11 }} />
          {placeholder}
        </>
      ) : tag ? (
        <>
          <span className={styles.tagSwatch} style={{ background: tag.color }} />
          {showCategory && tag.category && (
            <>
              <span className={styles.tagCat}>{tag.category}</span>
              <span className={styles.tagCatSep}>·</span>
            </>
          )}
          <span className={styles.tagName}>{tag.name}</span>
          {showCount && <span className={styles.tagBadge}>{tag.usage}</span>}
          {error && <RiAlertLine className={styles.tagErrIco} />}
          {extraCount && extraCount > 0 ? <span className={styles.tagPlus}>+{extraCount}</span> : null}
          {showX && (
            <button
              type="button"
              className={styles.tagX}
              onClick={(e) => { e.stopPropagation(); onRemove?.(e); }}
              title={`Remove ${tag.name}`}
            >
              <RiCloseLine />
            </button>
          )}
        </>
      ) : null}
    </span>
  );
}

interface PickerProps {
  options: TagDef[];
  selectedIds: string[];
  multi?: boolean;
  open: boolean;
  onClose: () => void;
  onApply: (id: string) => void;
  onCreate: (name: string, color: string) => void;
}
function Picker({ options, selectedIds, multi, open, onClose, onApply, onCreate }: PickerProps) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const recents = useMemo(() => options.filter((t) => !t.archived).slice(0, 3), [options]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.filter((t) => !t.archived);
    return options.filter((t) =>
      !t.archived &&
      (t.name.toLowerCase().includes(q) || (t.category ?? '').toLowerCase().includes(q))
    );
  }, [options, query]);

  const showCreate = query.trim().length > 0 && !filtered.some((t) => t.name.toLowerCase() === query.trim().toLowerCase());
  const showRecents = query.trim().length === 0;
  const visibleRows = showRecents ? [...recents, ...filtered.filter((t) => !recents.find((r) => r.id === t.id))] : filtered;

  // Clamp activeIdx
  useEffect(() => {
    if (activeIdx >= visibleRows.length) setActiveIdx(Math.max(0, visibleRows.length - 1));
  }, [visibleRows.length, activeIdx]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(visibleRows.length - 1 + (showCreate ? 1 : 0), i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx < visibleRows.length) {
        const t = visibleRows[activeIdx];
        if (t) onApply(t.id);
        if (!multi || !e.shiftKey) onClose();
      } else if (showCreate) {
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        if (color) onCreate(query.trim(), color);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className={`${styles.picker} ${open ? styles.pickerOpen : ''}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={handleKey}
    >
      <div className={styles.pickerHead}>
        <span className={styles.pickerScope}>TAG</span>
        <input
          ref={inputRef}
          className={styles.pickerInput}
          placeholder="Find or create a tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className={styles.pickerBody}>
        {showRecents && recents.length > 0 && <div className={styles.pickerSection}>Recent</div>}
        {visibleRows.length === 0 && !showCreate && (
          <div className={styles.pickerEmpty}>No tags match &quot;{query}&quot;</div>
        )}
        {visibleRows.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.pickerRow} ${i === activeIdx ? styles.pickerRowActive : ''}`}
            onMouseEnter={() => setActiveIdx(i)}
            onClick={(e) => {
              e.stopPropagation();
              onApply(t.id);
              if (!multi || !e.shiftKey) onClose();
            }}
          >
            <span className={styles.swatch} style={{ background: t.color }} />
            <span className={styles.label}>
              {t.category && (
                <>
                  <span className={styles.labelCat}>{t.category}</span>
                  <span className={styles.labelSep}>·</span>
                </>
              )}
              {t.name}
            </span>
            {selectedIds.includes(t.id) ? (
              <span className={styles.check}><RiCheckLine /></span>
            ) : (
              <span className={styles.count}>{t.usage}</span>
            )}
          </button>
        ))}
        {showCreate && (
          <button
            type="button"
            className={styles.pickerCreate}
            onClick={() => {
              const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
              if (color) onCreate(query.trim(), color);
              onClose();
            }}
          >
            <span className={styles.plus}><RiAddLine /></span>
            <span className={styles.label}>Create <em>&quot;{query.trim()}&quot;</em></span>
            <span className={styles.hint}>↩</span>
          </button>
        )}
      </div>
      <div className={styles.pickerFoot}>
        <span className={styles.hint}><span className={styles.kbd}>↩</span> apply</span>
        {multi && <span className={styles.hint}><span className={styles.kbd}>⇧↩</span> multi</span>}
        <span className={styles.hint}><span className={styles.kbd}>esc</span> close</span>
      </div>
    </div>
  );
}

export default function TagComponentPage() {
  const [tags, setTags] = useState<TagDef[]>(SEED_TAGS);
  const [pickerOpenFor, setPickerOpenFor] = useState<'demo1' | 'demo2' | null>(null);
  const [appliedDemo1, setAppliedDemo1] = useState<string[]>(['t-kumano']);
  const [appliedDemo2, setAppliedDemo2] = useState<string[]>(['t-vip', 't-dietary', 't-warm']);

  const [managerQuery, setManagerQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Outside-click closes picker — defer attach so the opening click doesn't immediately close
  const pickerWrap1Ref = useRef<HTMLSpanElement | null>(null);
  const pickerWrap2Ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!pickerOpenFor) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const wrap = pickerOpenFor === 'demo1' ? pickerWrap1Ref.current : pickerWrap2Ref.current;
      if (wrap && !wrap.contains(target)) setPickerOpenFor(null);
    };
    const id = window.setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [pickerOpenFor]);

  const filteredManagerTags = useMemo(() => {
    const q = managerQuery.trim().toLowerCase();
    return tags.filter((t) => {
      if (t.archived && !showArchived) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || (t.category ?? '').toLowerCase().includes(q);
    });
  }, [tags, managerQuery, showArchived]);

  const apply = (which: 'demo1' | 'demo2', id: string) => {
    if (which === 'demo1') {
      setAppliedDemo1((cur) => cur.includes(id) ? cur : [id]); // single-tag for demo1
    } else {
      setAppliedDemo2((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
    }
  };
  const remove = (which: 'demo1' | 'demo2', id: string) => {
    if (which === 'demo1') setAppliedDemo1((cur) => cur.filter((x) => x !== id));
    else setAppliedDemo2((cur) => cur.filter((x) => x !== id));
  };

  const create = (name: string, color: string) => {
    const id = `t-new-${Date.now()}`;
    const tag: TagDef = { id, name, color, category: undefined, description: undefined, usage: 0, spark: [0,0,0,0,0,0,0], lastUsed: 'just now' };
    setTags((cur) => [tag, ...cur]);
  };

  return (
    <div className={styles.page}>
      <header className={styles.docbar}>
        <div className={styles.brand}>P</div>
        <div className={styles.crumb}>
          <Link href="/">Playbooks</Link>
          <span className={styles.csep}>/</span>
          <Link href="/component/node">Components</Link>
          <span className={styles.csep}>/</span>
          <span className={styles.name}>Tag</span>
        </div>
        <span className={styles.meta}>Extraction · 2026-05-23</span>
        <span className={styles.tbDivider} />
        <span className={styles.meta}>Intercom (primary) · Linear (colors/groups) · GitHub (description)</span>
        <span className={styles.spacer} />
        <Link className={styles.linkbtn} href="/component/node">Node</Link>
        <Link className={styles.linkbtn} href="/design-language-2">v2 editor</Link>
        <Link className={styles.linkbtn} href="/">Back to editor</Link>
      </header>

      <div className={styles.wrap}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Component · Tag · Chip + Picker + Manager</span>
          <h1 className={styles.h1}>Tag, extracted from Intercom and Linear</h1>
          <p className={styles.lede}>
            Tag is Intercom-native (ticketing primitive; OpenAI has none). We lift Intercom&apos;s structure: chip + typeahead picker + Manager with archive/delete.
            We override Intercom&apos;s monochrome with Linear&apos;s coloured palette + label groups, because scanability matters when 8 steps each end with a tag.
            We borrow GitHub&apos;s tag description as one extra field in the Manager.
          </p>
          <div className={styles.heroMeta}>
            <span><strong>Chip:</strong> color + name + category + ×</span>
            <span><strong>Picker:</strong> typeahead + create-new + ↩/⇧↩/esc</span>
            <span><strong>Manager:</strong> search · archive · usage · sparkline</span>
            <span><strong>Where:</strong> inside a Node body</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 01 Chip — all states                                          */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>01</span> Tag chip — all states</span>
          <h2 className={styles.h2}>The atom in every visual state</h2>
          <p className={styles.sub}>Hover any chip to see the × fade in. Coloured swatch on the left. Category prefix is optional.</p>

          <div className={styles.canvasSurface} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
            <TagChip unconfigured placeholder="Pick a tag…" />
            <TagChip tag={tags[0]} />
            <TagChip tag={tags[0]} showX onRemove={() => {}} />
            <TagChip tag={tags[2]} showCategory />
            <TagChip tag={tags[3]} showCategory showCount />
            <TagChip tag={tags[4]} extraCount={2} />
            <TagChip tag={tags[1]} selected />
            <TagChip tag={tags[5]} disabled />
            <TagChip tag={{ ...tags[6]!, name: 'deprecated-tag' }} error />
          </div>
        </section>

        {/* ============================================================ */}
        {/* 02 Chip in a Node body                                        */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>02</span> Chip in context</span>
          <h2 className={styles.h2}>How the tag chip sits inside a Node</h2>
          <p className={styles.sub}>Click the tag chip to open the picker. Single-tag demo on top, multi-tag below.</p>

          <div className={styles.canvasSurface}>
            <div className={styles.card}>
              <span className={styles.cardDot} />
              <span className={styles.cardNum}>01</span>
              <span className={styles.cardBody}>
                Tag the conversation with{' '}
                <span className={styles.pickerWrap} ref={pickerWrap1Ref}>
                  {appliedDemo1.length === 0 ? (
                    <TagChip
                      unconfigured
                      onClick={(e) => { e.stopPropagation(); setPickerOpenFor(pickerOpenFor === 'demo1' ? null : 'demo1'); }}
                    />
                  ) : (
                    appliedDemo1.map((id) => {
                      const t = tags.find((x) => x.id === id);
                      if (!t) return null;
                      return (
                        <TagChip
                          key={t.id}
                          tag={t}
                          showX
                          selected={pickerOpenFor === 'demo1'}
                          onClick={(e) => { e.stopPropagation(); setPickerOpenFor(pickerOpenFor === 'demo1' ? null : 'demo1'); }}
                          onRemove={() => remove('demo1', id)}
                        />
                      );
                    })
                  )}
                  <Picker
                    options={tags}
                    selectedIds={appliedDemo1}
                    multi={false}
                    open={pickerOpenFor === 'demo1'}
                    onClose={() => setPickerOpenFor(null)}
                    onApply={(id) => apply('demo1', id)}
                    onCreate={create}
                  />
                </span>
                {' '}for routing.
              </span>
            </div>

            <div className={styles.card}>
              <span className={styles.cardDot} />
              <span className={styles.cardNum}>02</span>
              <span className={styles.cardBody}>
                Apply tags{' '}
                <span className={styles.pickerWrap} ref={pickerWrap2Ref}>
                  {appliedDemo2.length === 0 ? (
                    <TagChip
                      unconfigured
                      placeholder="Add tags…"
                      onClick={(e) => { e.stopPropagation(); setPickerOpenFor(pickerOpenFor === 'demo2' ? null : 'demo2'); }}
                    />
                  ) : (
                    <>
                      {appliedDemo2.slice(0, 2).map((id) => {
                        const t = tags.find((x) => x.id === id);
                        if (!t) return null;
                        return (
                          <TagChip
                            key={t.id}
                            tag={t}
                            showX
                            selected={pickerOpenFor === 'demo2'}
                            onClick={(e) => { e.stopPropagation(); setPickerOpenFor(pickerOpenFor === 'demo2' ? null : 'demo2'); }}
                            onRemove={() => remove('demo2', id)}
                          />
                        );
                      })}
                      {appliedDemo2.length > 2 && (
                        <span
                          className={styles.tag}
                          onClick={(e) => { e.stopPropagation(); setPickerOpenFor('demo2'); }}
                          style={{ cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11 }}
                        >
                          +{appliedDemo2.length - 2} more
                        </span>
                      )}
                    </>
                  )}
                  <Picker
                    options={tags}
                    selectedIds={appliedDemo2}
                    multi
                    open={pickerOpenFor === 'demo2'}
                    onClose={() => setPickerOpenFor(null)}
                    onApply={(id) => apply('demo2', id)}
                    onCreate={create}
                  />
                </span>
                {' '}to this conversation. (Multi-select with <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>⇧↩</span>)
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 03 Manager                                                    */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>03</span> Tag manager</span>
          <h2 className={styles.h2}>Admin surface · search · usage · last used</h2>
          <p className={styles.sub}>The Settings → Data → Tags view. Search filters live; <strong>Show archived</strong> reveals retired tags with a Restore action.</p>

          <div className={styles.manager}>
            <div className={styles.managerHead}>
              <span className={styles.managerTitle}>Tags</span>
              <div className={styles.managerSearch}>
                <RiSearchLine />
                <input
                  placeholder="Search by name or category…"
                  value={managerQuery}
                  onChange={(e) => setManagerQuery(e.target.value)}
                />
              </div>
              <button className={styles.managerNew} type="button"><RiAddLine /> New tag</button>
            </div>

            <div className={styles.tableHead}>
              <span></span>
              <span>Name</span>
              <span>Category</span>
              <span>Usage</span>
              <span>Last used</span>
              <span></span>
            </div>

            {filteredManagerTags.map((t) => (
              <div key={t.id} className={`${styles.tableRow} ${t.archived ? styles.tableRowArchived : ''}`}>
                <span className={styles.swatchCell} style={{ background: t.color }} />
                <div className={styles.nameCell}>
                  <div className={styles.nameLine}>
                    {t.category && (
                      <>
                        <span className={styles.nameCat}>{t.category}</span>
                        <span className={styles.nameSep}>·</span>
                      </>
                    )}
                    {t.name}
                  </div>
                  {t.description && <div className={styles.nameDesc}>{t.description}</div>}
                </div>
                <span className={styles.categoryCell}>{t.category ?? '—'}</span>
                <div className={styles.usageCell}>
                  <span className={styles.usageNum}>{t.usage}</span>
                  <Sparkline data={t.spark} />
                </div>
                <span className={styles.lastUsedCell}>{t.lastUsed}</span>
                <button className={styles.rowKebab} type="button"><RiMore2Fill /></button>
              </div>
            ))}

            {filteredManagerTags.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                No tags match &quot;{managerQuery}&quot;
              </div>
            )}

            <div className={styles.managerFoot}>
              <button
                type="button"
                className={`${styles.managerToggle} ${showArchived ? styles.managerToggleActive : ''}`}
                onClick={() => setShowArchived((v) => !v)}
              >
                {showArchived ? 'Hide archived' : 'Show archived'}
              </button>
              <span>{filteredManagerTags.length} {filteredManagerTags.length === 1 ? 'tag' : 'tags'} {managerQuery && '(filtered)'}</span>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <Link href="/component/node">/component/node</Link>
          <Link href="/design-language-2">/design-language-2</Link>
          <Link href="/">/ assembled editor</Link>
          <a href="https://github.com/geekv30/hiver-playbooks-prototype" target="_blank" rel="noreferrer">repo</a>
        </footer>
      </div>
    </div>
  );
}
