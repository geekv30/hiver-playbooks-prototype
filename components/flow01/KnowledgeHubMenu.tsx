'use client';

import { RiStackLine } from 'react-icons/ri';
import Checkbox from '@/components/atoms/Checkbox';
import {
  KB_SOURCES,
  SOURCE_TYPES,
  sourcesByType,
  sourceCountByType,
  sourceTypeLabel,
  type SourceTypeId,
  type KbSource,
} from '@/data/knowledgeSources';
import { SOURCE_ICON, SOURCE_ICON_BRAND } from '@/components/icons/sources';
import styles from './CommandPalette.module.css';

export type HubFilter = SourceTypeId | 'all';

interface Props {
  picked: ReadonlySet<string>;
  onToggle: (id: string) => void;
  /** The palette search field filters across every source (overrides the type nav). */
  query: string;
  /** Which type's sources the right column shows ('all' = every type, grouped). */
  hubType: HubFilter;
  setHubType: (t: HubFilter) => void;
}

// A source TYPE glyph - brand marks carry their own colour, the rest inherit the
// muted ink set by `.rowIco`.
function TypeGlyph({ type }: { type: SourceTypeId }) {
  const Icon = SOURCE_ICON[type];
  return (
    <span className={`${styles.rowIco} ${SOURCE_ICON_BRAND[type] ? styles.rowIcoBrand : ''}`}>
      <Icon />
    </span>
  );
}

// The Knowledge Hub picker: source TYPES on the left, the sources for the chosen
// type (or all types, grouped) on the right. Lives inside the command palette;
// selection is the palette's pick-many state, committed on close like any picker.
export default function KnowledgeHubMenu({ picked, onToggle, query, hubType, setHubType }: Props) {
  const q = query.trim().toLowerCase();
  const matches = (s: KbSource) => !q || (s.name + ' ' + s.sub).toLowerCase().includes(q);

  // The sections shown on the right. A search, or the "All sources" nav item, lists
  // every type (each as a headed group); a specific type lists just that type.
  const groups: { type: SourceTypeId; sources: KbSource[] }[] =
    q || hubType === 'all'
      ? SOURCE_TYPES.map((t) => ({ type: t.id, sources: sourcesByType(t.id).filter(matches) })).filter(
          (g) => g.sources.length,
        )
      : [{ type: hubType, sources: sourcesByType(hubType) }];

  const navTypes = SOURCE_TYPES.filter((t) => sourceCountByType(t.id) > 0);

  return (
    <div className={styles.hubColumns}>
      {/* Left: source types */}
      <div className={styles.hubNav}>
        <button
          type="button"
          className={`${styles.hubNavRow} ${hubType === 'all' && !q ? styles.hubNavRowOn : ''}`}
          onClick={() => setHubType('all')}
        >
          <span className={styles.rowIco}>
            <RiStackLine />
          </span>
          <span className={styles.hubNavName}>All sources</span>
          <span className={styles.hubNavCount}>{KB_SOURCES.length}</span>
        </button>
        {navTypes.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.hubNavRow} ${hubType === t.id && !q ? styles.hubNavRowOn : ''}`}
            onClick={() => setHubType(t.id)}
          >
            <TypeGlyph type={t.id} />
            <span className={styles.hubNavName}>{t.label}</span>
            <span className={styles.hubNavCount}>{sourceCountByType(t.id)}</span>
          </button>
        ))}
      </div>

      {/* Right: the sources, grouped under type headings */}
      <div className={styles.hubBody}>
        {groups.length === 0 && (
          <div className={styles.empty}>No sources match “{query.trim()}”.</div>
        )}
        {groups.map((g) => (
          <div key={g.type} className={styles.hubGroup}>
            <div className={styles.hubGroupHead}>
              <span className={styles.hubGroupName}>{sourceTypeLabel(g.type)}</span>
              <span className={styles.hubGroupCount}>{g.sources.length}</span>
            </div>
            {g.sources.map((src) => (
              <button
                key={src.id}
                type="button"
                className={styles.row}
                onClick={() => onToggle(src.id)}
                aria-pressed={picked.has(src.id)}
              >
                <TypeGlyph type={src.type} />
                <span className={styles.rowText}>
                  <span className={styles.rowLabel}>{src.name}</span>
                  <span className={styles.rowSub}>{src.sub}</span>
                </span>
                <span className={styles.rowBox}>
                  <Checkbox presentational subtle size={16} checked={picked.has(src.id)} />
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
