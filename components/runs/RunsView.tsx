'use client';

import { useMemo, useState } from 'react';
import { RiArrowRightLine } from 'react-icons/ri';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import Dropdown from '@/components/atoms/Dropdown';
import { NOW, RUN_SOURCES, type RunState, type SkillRun } from '@/data/runFixtures';
import { mailboxName } from '@/data/mailboxes';
import RunStateFilter from './RunStateFilter';
import ActivityStrip, { type OffSpan } from './ActivityStrip';
import RunList, { type ListEmpty } from './RunList';
import RunDetail from './RunDetail';
import NoRunsYet, { type RunsSkill } from './NoRunsYet';
import { useIsClient } from './useIsClient';
import {
  DEFAULT_FILTER,
  applyFilter,
  bucketByDay,
  countBy,
  formatDayShort,
  quietDays,
  startOfDay,
  type RangeDays,
  type RunFilter,
} from './runsModel';
import styles from './RunsView.module.css';

interface Props {
  runs: SkillRun[];
  allSkills?: boolean;
  /** Pre-select a skill (arriving from that skill's Runs cell on the list). */
  initialSkillId?: string | null;
  onOpenConversation?: (run: SkillRun) => void;
  /** The skill this history belongs to (single-skill mode). Lets a skill that
   *  has never run say why, instead of drawing an empty chart and list. */
  skill?: RunsSkill;
  /** Open on a narrower view than the default (the exhibits use it). */
  initialFilter?: Partial<RunFilter>;
  /** Open Evaluation > Matching emails for this skill. */
  onCheckMatches?: () => void;
}

/** The smallest range, wider than the current one, that reaches back to `t`. */
function widenTo(t: number, days: RangeDays): RangeDays | null {
  const age = Math.ceil((startOfDay(NOW) - startOfDay(t)) / 86_400_000) + 1;
  return ([30, 90] as RangeDays[]).find((d) => d > days && d >= age) ?? null;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The empty list's headline per outcome - what it looked for, said like a
 *  person would. */
const NOTHING: Record<RunState, string> = {
  completed: 'Nothing completed',
  awaiting: "Nobody's waiting on approval",
  failed: 'Nothing failed',
  declined: 'No drafts turned down',
};

/** One line about the runs that ARE here, so "0 failed" reads as the fact it
 *  is rather than as a broken page. */
function noneOf(state: RunState, n: number): string {
  switch (state) {
    case 'completed':
      return `None of the ${n} runs here made it to the end. Worth a look.`;
    case 'awaiting':
      return 'Approvals: inbox zero.';
    case 'failed':
      return `Not one of the ${n} runs here tripped.`;
    case 'declined':
      return 'Nobody said no to a single draft.';
  }
}

const RANGES = [
  { id: '7', label: '7d' },
  { id: '30', label: '30d' },
  { id: '90', label: '90d' },
];

/**
 * RunsView - a skill's execution history.
 *
 * Two islands on the stage, the same cards the skill editor sits in, so moving
 * from editing a skill to reading its runs never feels like leaving the page
 * (Figma 3588:21139). The first holds the shape of the period; the second the
 * filters, the log and the one run picked from it. The page scrolls as a whole
 * and the log island is exactly one stage tall, so scrolling past the chart
 * hands over to a list and a detail that each scroll on their own.
 *
 * The period control sits with the chart: it is the one control that changes
 * what the plot draws. It still governs the list and the counts, so this
 * surface keeps the state. The mailbox and outcome filters narrow the log only,
 * so the chart never moves under the controls used to read it.
 *
 * Everything is read-only. Every route out leads to the conversation.
 */
export default function RunsView({
  runs,
  allSkills,
  initialSkillId = null,
  onOpenConversation,
  skill,
  initialFilter,
  onCheckMatches,
}: Props) {
  // A week opens the page: every day then has room for its date and its total.
  const [filter, setFilter] = useState<RunFilter>({
    ...DEFAULT_FILTER,
    days: 7,
    skillId: initialSkillId,
    ...initialFilter,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Run history is clock-derived and these routes are prerendered, so the
  // server has no honest answer here. See useIsClient.
  const isClient = useIsClient();

  // The window drives the lead band and the chart; the finer filters narrow
  // only the list, so the band never moves under the control used to read it.
  const windowRuns = useMemo(
    () => applyFilter(runs, { ...DEFAULT_FILTER, days: filter.days, skillId: filter.skillId }),
    [runs, filter.days, filter.skillId],
  );
  // What the filter row counts: the window, through the mailbox pick. The
  // outcome chips must agree with the list they narrow.
  const scopeRuns = useMemo(
    () => applyFilter(runs, { ...DEFAULT_FILTER, days: filter.days, skillId: filter.skillId, mailboxId: filter.mailboxId }),
    [runs, filter.days, filter.skillId, filter.mailboxId],
  );
  const listRuns = useMemo(() => applyFilter(runs, filter), [runs, filter]);

  // Only the mailboxes this window actually ran in: a mailbox with no runs
  // would be a pick that empties the list.
  // The current pick always stays listed, so narrowing the range under it
  // leaves the pill naming what it filters rather than falling to a placeholder.
  const mailboxes = useMemo(() => {
    const ids = Array.from(new Set(windowRuns.map((r) => r.mailboxId)));
    if (filter.mailboxId && !ids.includes(filter.mailboxId)) ids.push(filter.mailboxId);
    return ids
      .map((id) => ({ id, label: mailboxName(id) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [windowRuns, filter.mailboxId]);

  const selected = listRuns.find((r) => r.id === selectedId) ?? listRuns[0] ?? null;

  const narrowed =
    filter.state !== null ||
    filter.day !== null ||
    filter.mailboxId !== null ||
    filter.query.trim() !== '';

  if (!isClient) {
    return (
      <div className={styles.view}>
        <div className={styles.pending} aria-hidden />
      </div>
    );
  }

  // Never run: one island that says why, in place of the chart and the log.
  if (!allSkills && skill && runs.length === 0) {
    return (
      <div className={styles.view}>
        <section className={`${styles.island} ${styles.zeroIsland}`} aria-label="Runs">
          <NoRunsYet skill={skill} onCheckMatches={onCheckMatches} />
        </section>
      </div>
    );
  }

  const empty = listRuns.length === 0 ? emptyFor() : undefined;

  // Still switched on, but nothing has run in a week or more: worth saying
  // before anyone reads the chart, because the chart only shows it as absence.
  const quiet = !allSkills && skill?.status === 'active' ? quietDays(runs) : null;

  // The days the skill could not have run, so they are not read as quiet ones.
  const off: OffSpan[] = [];
  if (!allSkills && skill) {
    if (skill.liveSince) off.push({ from: 0, to: startOfDay(skill.liveSince) - 1, label: 'Not live yet' });
    if (skill.status === 'paused' && skill.pausedAt) {
      off.push({ from: startOfDay(skill.pausedAt), to: startOfDay(NOW), label: 'Paused' });
    }
  }

  /** The list's empty statement: what it looked for, what is there instead,
   *  and at most two ways out. */
  function emptyFor(): ListEmpty | undefined {
    const setDays = (days: RangeDays) => setFilter((f) => ({ ...f, days, day: null }));
    const where = filter.mailboxId ? ` in ${mailboxName(filter.mailboxId)}` : '';
    const when = filter.day !== null ? ` on ${formatDayShort(filter.day)}` : ` in the last ${filter.days} days`;

    if (!narrowed) {
      // Nothing in this window, but the skill has run before it: say when,
      // and offer the range that reaches it, rather than "No runs yet".
      const last = filter.skillId ? runs.find((r) => r.skillId === filter.skillId) : runs[0];
      if (!last) return undefined;
      const widen = widenTo(last.startedAt, filter.days);
      return {
        title: `Crickets for ${filter.days} days`,
        body: `Last run: ${formatDayShort(last.startedAt)}${widen ? '.' : ', further back than this page goes.'}`,
        actions: widen ? [{ label: `Show the last ${widen} days`, onClick: () => setDays(widen) }] : undefined,
      };
    }

    // An outcome is picked. The runs it filtered out are the useful fact.
    if (filter.state) {
      const state = filter.state;
      const others = applyFilter(runs, { ...filter, state: null });
      const actions: ListEmpty['actions'] = [];
      if (others.length > 0) {
        actions.push({
          label: `Show all ${plural(others.length, 'run', 'runs')}`,
          onClick: () => setFilter((f) => ({ ...f, state: null })),
        });
      }
      // A wider range that does hold this outcome is worth one click.
      if (filter.day === null && filter.days < 90) {
        const wider = ([30, 90] as RangeDays[]).find(
          (d) => d > filter.days && applyFilter(runs, { ...filter, days: d }).length > 0,
        );
        if (wider) {
          const n = applyFilter(runs, { ...filter, days: wider }).length;
          actions.push({
            label: `Show the last ${wider} days (${n})`,
            onClick: () => setDays(wider),
          });
        }
      }
      if (others.length === 0 && actions.length === 0) {
        actions.push({ label: 'Clear filters', onClick: () => setFilter((f) => ({ ...f, state: null, mailboxId: null, day: null, query: '' })) });
      }
      return {
        title: `${NOTHING[state]}${where}${when}`,
        body: others.length > 0 ? noneOf(state, others.length) : 'Not a peep.',
        actions,
      };
    }

    // Narrowed by mailbox or day alone.
    return {
      title: `No runs${where}${when}`,
      body: filter.day !== null ? 'A quiet day off.' : 'Not a peep from this one.',
      actions: [
        { label: 'Clear filters', onClick: () => setFilter((f) => ({ ...f, mailboxId: null, day: null, query: '' })) },
      ],
    };
  }

  return (
    <div className={styles.view}>
      {quiet !== null && (
        <section className={`${styles.island} ${styles.notice}`} aria-label="Heads up">
          <span className={styles.noticeDot} aria-hidden />
          <p className={styles.noticeText}>
            {/* The date, not "N days": the list's "11 days ago" rounds differently
                and the two must never disagree. */}
            <span className={styles.noticeTitle}>Suspiciously quiet.</span> Still on, but nothing since{' '}
            {formatDayShort(runs[0]!.startedAt)}. Check the trigger or the mailbox.
          </p>
          {onCheckMatches && (
            <button type="button" className={styles.noticeLink} onClick={onCheckMatches}>
              See what would match
              <RiArrowRightLine aria-hidden />
            </button>
          )}
        </section>
      )}

      <section className={`${styles.island} ${styles.chartIsland}`} aria-label="Runs per day">
        <ActivityStrip
          off={off}
          buckets={bucketByDay(windowRuns, filter.days)}
          picked={filter.day}
          onPick={(day) => setFilter((f) => ({ ...f, day: day === null ? null : startOfDay(day) }))}
          range={
            <SegmentedControl
              size="sm"
              tabs={RANGES}
              active={String(filter.days)}
              onChange={(id) =>
                setFilter((f) => ({ ...f, days: Number(id) as RangeDays, day: null }))
              }
              ariaLabel="Time range"
            />
          }
        />
      </section>

      <section className={`${styles.island} ${styles.logIsland}`} aria-label="Runs">
        <div className={styles.controls}>
          {allSkills && (
            <Dropdown
              variant="pill"
              prefix="Skill"
              options={[
                { id: 'all', label: 'All' },
                ...RUN_SOURCES.map((s) => ({ id: s.skillId, label: s.skillName })),
              ]}
              value={filter.skillId ?? 'all'}
              onChange={(id) =>
                setFilter((f) => ({ ...f, skillId: id === 'all' ? null : id, mailboxId: null }))
              }
              ariaLabel="Filter by skill"
            />
          )}
          <Dropdown
            variant="pill"
            prefix="Mailbox"
            options={[{ id: 'all', label: 'All' }, ...mailboxes]}
            value={filter.mailboxId ?? 'all'}
            onChange={(id) => setFilter((f) => ({ ...f, mailboxId: id === 'all' ? null : id }))}
            ariaLabel="Filter by mailbox"
          />
          <RunStateFilter
            counts={countBy(scopeRuns)}
            value={filter.state}
            onChange={(state) => setFilter((f) => ({ ...f, state }))}
          />
        </div>

        {/* Nothing in the window, or nothing through the filters: either way the
            list says so in its own words, across the whole island rather than
            in a column beside an equally empty pane. */}
        {listRuns.length === 0 ? (
          <div className={styles.emptySplit}>
            <RunList
              runs={listRuns}
              selectedId={null}
              onSelect={setSelectedId}
              showSkill={allSkills}
              filtered={narrowed}
              empty={empty}
            />
          </div>
        ) : (
          <div className={styles.split}>
            <div className={styles.listCol}>
              <RunList
                runs={listRuns}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
                showSkill={allSkills}
                filtered={narrowed}
              />
            </div>
            <RunDetail
              run={selected}
              onOpenConversation={onOpenConversation}
              showSkill={allSkills}
            />
          </div>
        )}
      </section>
    </div>
  );
}
