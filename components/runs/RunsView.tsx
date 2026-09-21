'use client';

import { useMemo, useState } from 'react';
import { RiSearchLine } from 'react-icons/ri';
import Input from '@/components/atoms/Input';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import Dropdown from '@/components/atoms/Dropdown';
import { RUN_SOURCES, type RevisionMark, type SkillRun } from '@/data/runFixtures';
import RunVerdict from './RunVerdict';
import RunStateFilter from './RunStateFilter';
import ActivityStrip from './ActivityStrip';
import RunList from './RunList';
import RunDetail from './RunDetail';
import { useIsClient } from './useIsClient';
import {
  DEFAULT_FILTER,
  applyFilter,
  bucketByDay,
  countBy,
  startOfDay,
  type RangeDays,
  type RunFilter,
} from './runsModel';
import styles from './RunsView.module.css';

interface Props {
  runs: SkillRun[];
  marks?: RevisionMark[];
  allSkills?: boolean;
  onOpenConversation?: (run: SkillRun) => void;
}

const RANGES = [
  { id: '7', label: '7d' },
  { id: '30', label: '30d' },
  { id: '90', label: '90d' },
];

/**
 * RunsView - a skill's execution history.
 *
 * Ordered by the question people arrive with, not by what the data contains:
 * first whether the skill is behaving and what is blocking on a person, then
 * the outcome filters, then the log. The list and the detail are the answer to
 * "show me that one", which is the third reason someone comes here, not the
 * first - so they sit below the fold of the verdict, not above it.
 *
 * Everything is read-only. Every route out leads to the conversation.
 */
export default function RunsView({ runs, marks = [], allSkills, onOpenConversation }: Props) {
  const [filter, setFilter] = useState<RunFilter>(DEFAULT_FILTER);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Run history is clock-derived and these routes are prerendered, so the
  // server has no honest answer here. See useIsClient.
  const isClient = useIsClient();

  // The window drives the verdict and the chart; the finer filters narrow only
  // the list, so the verdict never moves under the control being used to read it.
  const windowRuns = useMemo(
    () => applyFilter(runs, { ...DEFAULT_FILTER, days: filter.days, skillId: filter.skillId }),
    [runs, filter.days, filter.skillId],
  );
  const listRuns = useMemo(() => applyFilter(runs, filter), [runs, filter]);

  const selected = listRuns.find((r) => r.id === selectedId) ?? listRuns[0] ?? null;

  const staleMark = useMemo(() => {
    if (!selected) return null;
    const later = marks.filter((m) => m.at > selected.startedAt);
    return later.length > 0 ? later[later.length - 1]! : null;
  }, [selected, marks]);

  const narrowed = filter.state !== null || filter.day !== null || filter.query.trim() !== '';

  if (!isClient) {
    return (
      <div className={styles.view}>
        <div className={styles.pending} aria-hidden />
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <div className={styles.lead}>
        <div className={styles.leadText}>
          <RunVerdict
            windowRuns={windowRuns}
            days={filter.days}
            onFocus={(patch) => setFilter((f) => ({ ...f, day: null, query: '', ...patch }))}
          />
        </div>
        <div className={styles.chart}>
          <ActivityStrip
            buckets={bucketByDay(windowRuns, filter.days)}
            picked={filter.day}
            onPick={(day) =>
              setFilter((f) => ({ ...f, day: day === null ? null : startOfDay(day) }))
            }
          />
        </div>
      </div>

      <div className={styles.controls}>
        <RunStateFilter
          counts={countBy(windowRuns)}
          value={filter.state}
          onChange={(state) => setFilter((f) => ({ ...f, state }))}
        />
        <span className={styles.spacer} />

        {allSkills && (
          <Dropdown
            options={[
              { id: 'all', label: 'All skills' },
              ...RUN_SOURCES.map((s) => ({ id: s.skillId, label: s.skillName })),
            ]}
            value={filter.skillId ?? 'all'}
            onChange={(id) => setFilter((f) => ({ ...f, skillId: id === 'all' ? null : id }))}
            ariaLabel="Filter by skill"
          />
        )}

        <div style={{ flex: '0 1 220px', minWidth: 160 }}>
          <Input
            value={filter.query}
            onChange={(query) => setFilter((f) => ({ ...f, query }))}
            placeholder="Search runs"
            prefixIcon={<RiSearchLine />}
            ariaLabel="Search runs"
          />
        </div>

        <span style={{ flex: 'none', width: 132 }}>
          <SegmentedControl
            tabs={RANGES}
            active={String(filter.days)}
            onChange={(id) => setFilter((f) => ({ ...f, days: Number(id) as RangeDays, day: null }))}
            ariaLabel="Time range"
          />
        </span>
      </div>

      {listRuns.length === 0 ? (
        <div className={styles.emptySplit}>
          <RunList
            runs={listRuns}
            marks={marks}
            selectedId={null}
            onSelect={setSelectedId}
            showSkill={allSkills}
            filtered={narrowed}
          />
        </div>
      ) : (
        <div className={styles.split}>
          <div className={styles.listCol}>
            <RunList
              runs={listRuns}
              marks={marks}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
              showSkill={allSkills}
              filtered={narrowed}
            />
          </div>
          <RunDetail
            run={selected}
            staleMark={staleMark}
            onOpenConversation={onOpenConversation}
            showSkill={allSkills}
          />
        </div>
      )}
    </div>
  );
}
