'use client';
import { useState, useMemo, useEffect } from 'react';
import { RiCloseLine, RiSearchLine } from 'react-icons/ri';
import styles from './PastConversationPicker.module.css';
import { FIXTURE_MAILBOX, type FixtureThread } from './test-fixtures';

interface Props {
  onPick: (threadId: string) => void;
  onClose: () => void;
}

export function PastConversationPicker({ onPick, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // All labels in the mailbox
  const allLabels = useMemo(() => {
    const s = new Set<string>();
    for (const t of FIXTURE_MAILBOX) for (const l of t.labels) s.add(l);
    return Array.from(s).sort();
  }, []);

  const DAY = 86400000;
  const now = Date.now();

  const filtered = useMemo(() => {
    return FIXTURE_MAILBOX.filter((t) => {
      if (query) {
        const q = query.toLowerCase();
        if (!t.subject.toLowerCase().includes(q) && !t.body.toLowerCase().includes(q)) return false;
      }
      if (activeLabel && !t.labels.includes(activeLabel)) return false;
      if (range === '7d' && (now - t.at) > 7 * DAY) return false;
      if (range === '30d' && (now - t.at) > 30 * DAY) return false;
      return true;
    });
  }, [query, activeLabel, range, now, DAY]);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const initials = (name: string) =>
    name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const timeAgo = (at: number) => {
    const d = now - at;
    if (d < DAY) return 'today';
    const days = Math.round(d / DAY);
    return `${days}d ago`;
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className={styles.head}>
          <h2 className={styles.title}>Pick a thread to test against</h2>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close">
            <RiCloseLine />
          </button>
        </header>

        <div className={styles.filterBar}>
          <label className={styles.searchWrap}>
            <RiSearchLine />
            <input
              className={styles.searchInput}
              placeholder="Search subject or body"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              type="search"
            />
          </label>
          <div className={styles.rangePills}>
            {(['7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                className={`${styles.rangePill} ${range === r ? styles.rangePillActive : ''}`}
                onClick={() => setRange(r)}
                type="button"
              >
                {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'All time'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.labelStrip}>
          <button
            className={`${styles.labelChip} ${!activeLabel ? styles.labelChipActive : ''}`}
            onClick={() => setActiveLabel(null)}
            type="button"
          >
            All
          </button>
          {allLabels.map((l) => (
            <button
              key={l}
              className={`${styles.labelChip} ${activeLabel === l ? styles.labelChipActive : ''}`}
              onClick={() => setActiveLabel(activeLabel === l ? null : l)}
              type="button"
            >
              {l}
            </button>
          ))}
        </div>

        <div className={styles.count}>
          {filtered.length === 0 ? 'No threads match.' : `${filtered.length} thread${filtered.length === 1 ? '' : 's'} match.`}
        </div>

        <div className={styles.list}>
          {filtered.map((t) => (
            <ThreadRow
              key={t.id}
              thread={t}
              initials={initials(t.fromName)}
              timeAgo={timeAgo(t.at)}
              selected={selectedId === t.id}
              onClick={() => setSelectedId(t.id)}
              onDoubleClick={() => onPick(t.id)}
            />
          ))}
        </div>

        <footer className={styles.foot}>
          <button className={styles.useBtn} disabled={!selectedId} onClick={() => selectedId && onPick(selectedId)} type="button">
            Use selected thread
          </button>
        </footer>
      </div>
    </div>
  );
}

function ThreadRow({
  thread, initials, timeAgo, selected, onClick, onDoubleClick,
}: {
  thread: FixtureThread;
  initials: string;
  timeAgo: string;
  selected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  return (
    <button
      className={`${styles.row} ${selected ? styles.rowSelected : ''}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      type="button"
    >
      <span className={styles.avatar}>{initials}</span>
      <span className={styles.rowMid}>
        <span className={styles.rowSubj}>{thread.subject}</span>
        <span className={styles.rowBody}>{thread.body}</span>
      </span>
      <span className={styles.rowMeta}>
        <span className={styles.rowLabels}>
          {thread.labels.slice(0, 2).map((l) => (
            <span key={l} className={styles.rowLabel}>{l}</span>
          ))}
        </span>
        <span className={styles.rowTime}>{timeAgo}</span>
      </span>
    </button>
  );
}
