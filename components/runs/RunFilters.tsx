'use client';

import { RiSearchLine, RiCloseLine } from 'react-icons/ri';
import Input from '@/components/atoms/Input';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import Dropdown from '@/components/atoms/Dropdown';
import { RUN_SOURCES } from '@/data/runFixtures';
import {
  DEFAULT_FILTER,
  RUN_STATE_LABEL,
  formatDayLabel,
  type RangeDays,
  type RunFilter,
} from './runsModel';
import styles from './RunFilters.module.css';

interface Props {
  filter: RunFilter;
  onChange: (next: RunFilter) => void;
  /** All-skills mode adds the skill picker. */
  allSkills?: boolean;
}

const RANGES: { id: string; label: string }[] = [
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
];

/**
 * RunFilters - the window, the skill, and free-text search, plus a readout of
 * whatever is currently narrowing the list.
 *
 * State filtering deliberately lives on the summary stats rather than being
 * repeated here: the counts are where a person decides to look at failures, so
 * that is where the control belongs. What comes back here is the *result* -
 * every applied filter as a removable chip, so nothing narrows the list
 * invisibly.
 */
export default function RunFilters({ filter, onChange, allSkills }: Props) {
  const set = (patch: Partial<RunFilter>) => onChange({ ...filter, ...patch });

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filter.state) {
    chips.push({
      key: 'state',
      label: RUN_STATE_LABEL[filter.state],
      clear: () => set({ state: null }),
    });
  }
  if (filter.day !== null) {
    chips.push({
      key: 'day',
      label: formatDayLabel(filter.day),
      clear: () => set({ day: null }),
    });
  }
  if (allSkills && filter.skillId) {
    const name = RUN_SOURCES.find((s) => s.skillId === filter.skillId)?.skillName;
    chips.push({ key: 'skill', label: name ?? filter.skillId, clear: () => set({ skillId: null }) });
  }
  if (filter.query.trim()) {
    chips.push({
      key: 'query',
      label: `"${filter.query.trim()}"`,
      clear: () => set({ query: '' }),
    });
  }

  return (
    <div className={styles.bar}>
      <div className={styles.search}>
        <Input
          value={filter.query}
          onChange={(query) => set({ query })}
          placeholder="Search runs"
          prefixIcon={<RiSearchLine />}
          ariaLabel="Search runs"
        />
      </div>

      <span className={styles.range}>
        <SegmentedControl
          tabs={RANGES}
          active={String(filter.days)}
          onChange={(id) => set({ days: Number(id) as RangeDays, day: null })}
          ariaLabel="Time range"
        />
      </span>

      {allSkills && (
        <span className={styles.skill}>
        <Dropdown
          options={[
            { id: 'all', label: 'All skills' },
            ...RUN_SOURCES.map((s) => ({ id: s.skillId, label: s.skillName })),
          ]}
          value={filter.skillId ?? 'all'}
          onChange={(id) => set({ skillId: id === 'all' ? null : id })}
          ariaLabel="Filter by skill"
        />
        </span>
      )}

      <span className={styles.spacer} />

      {chips.length > 0 && (
        <div className={styles.applied}>
          {chips.map((c) => (
            <span key={c.key} className={styles.chip}>
              {c.label}
              <button
                type="button"
                className={styles.chipX}
                onClick={c.clear}
                aria-label={`Remove filter ${c.label}`}
              >
                <RiCloseLine aria-hidden />
              </button>
            </span>
          ))}
          {chips.length > 1 && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => onChange({ ...DEFAULT_FILTER, days: filter.days })}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
