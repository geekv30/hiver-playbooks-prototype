'use client';

import { useMemo, useState } from 'react';
import type { RevisionMark, SkillRun } from '@/data/runFixtures';
import RunSummary from './RunSummary';
import RunFilters from './RunFilters';
import RunList from './RunList';
import RunDetail from './RunDetail';
import { DEFAULT_FILTER, applyFilter, startOfDay, type RunFilter } from './runsModel';
import styles from './RunsView.module.css';

interface Props {
  runs: SkillRun[];
  /** Skill edits, folded into the list timeline. */
  marks?: RevisionMark[];
  /** All-skills mode: rows and the detail name their skill, and the filter bar
   *  offers a skill picker. */
  allSkills?: boolean;
  /** Render flush in the page rather than as a card on the editor stage. */
  flush?: boolean;
  onOpenConversation?: (run: SkillRun) => void;
}

/**
 * RunsView - the execution history of a skill: summary, filters, the run list,
 * and one run in full.
 *
 * One component serves both the per-skill mode and the all-skills page; the
 * only difference is whether a row needs to name which skill it belongs to.
 * Everything here is read-only - the surface answers "what did it do", and
 * every way to act on the answer leads back to the conversation.
 */
export default function RunsView({
  runs,
  marks = [],
  allSkills,
  flush,
  onOpenConversation,
}: Props) {
  const [filter, setFilter] = useState<RunFilter>(DEFAULT_FILTER);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // The window drives the summary and the chart; the finer filters (state, day,
  // query) narrow only the list, so the summary never moves under the control
  // that is being used to read it.
  const windowRuns = useMemo(
    () => applyFilter(runs, { ...DEFAULT_FILTER, days: filter.days, skillId: filter.skillId }),
    [runs, filter.days, filter.skillId],
  );
  const listRuns = useMemo(() => applyFilter(runs, filter), [runs, filter]);

  const selected = listRuns.find((r) => r.id === selectedId) ?? listRuns[0] ?? null;

  // A run is stale when the skill was edited after it ran - the newest mark
  // that landed later than this run is the one that explains the difference.
  const staleMark = useMemo(() => {
    if (!selected) return null;
    const later = marks.filter((m) => m.at > selected.startedAt);
    return later.length > 0 ? later[later.length - 1]! : null;
  }, [selected, marks]);

  const narrowed =
    filter.state !== null || filter.day !== null || filter.query.trim() !== '';

  return (
    <div className={styles.view} data-flush={flush || undefined}>
      <RunSummary
        windowRuns={windowRuns}
        days={filter.days}
        state={filter.state}
        onState={(state) => setFilter((f) => ({ ...f, state }))}
        day={filter.day}
        onDay={(day) => setFilter((f) => ({ ...f, day: day === null ? null : startOfDay(day) }))}
      />
      <RunFilters filter={filter} onChange={setFilter} allSkills={allSkills} />

      {listRuns.length === 0 ? (
        // No runs means the detail pane has nothing to invite either - two empty
        // states side by side would just be a void with a caption on each half.
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
