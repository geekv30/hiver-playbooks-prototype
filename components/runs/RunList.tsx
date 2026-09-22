'use client';

import { RiGitCommitLine } from 'react-icons/ri';
import type { RevisionMark, SkillRun } from '@/data/runFixtures';
import { mailboxName } from '@/data/mailboxes';
import { RunStateDot } from './RunStatePill';
import { formatDayLabel, formatTime, groupByDay } from './runsModel';
import styles from './RunList.module.css';

interface Props {
  runs: SkillRun[];
  marks?: RevisionMark[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** All-skills mode puts the skill name on each row. */
  showSkill?: boolean;
  /** True when a filter is narrowing the list - changes what "nothing here" means. */
  filtered?: boolean;
}

/**
 * RunList - every run in the window, grouped by day, newest first.
 *
 * Two lines per run: what it ran on, and where it ran. What the skill DID, who
 * wrote in and how long it took all stay in the detail - repeating them on
 * every row made the list harder to scan, not easier, and the outcome dot
 * already carries the one thing worth seeing at this distance.
 *
 * Skill edits appear in the timeline where they happened, so a change in
 * behavior has a visible cause rather than something a person has to remember.
 */
export default function RunList({
  runs,
  marks = [],
  selectedId,
  onSelect,
  showSkill,
  filtered,
}: Props) {
  const groups = groupByDay(runs, marks);

  if (runs.length === 0) {
    return (
      <div className={styles.list} data-empty>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {filtered ? 'No runs match these filters' : 'No runs yet'}
          </p>
          <p className={styles.emptyBody}>
            {filtered
              ? 'Try a wider time range, or clear a filter above.'
              : 'Runs appear here as soon as this skill fires on an email in one of its mailboxes.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {groups.map((g) => (
        <section key={g.day}>
          <header className={styles.dayHead}>
            <span>{formatDayLabel(g.day)}</span>
            <span className={styles.dayCount}>
              {g.runs.length} {g.runs.length === 1 ? 'run' : 'runs'}
            </span>
          </header>

          {g.items.map((item) => {
            if (item.kind === 'mark') {
              const m = item.mark;
              return (
                <div key={`mark-${m.revision}`} className={styles.revision}>
                  <RiGitCommitLine className={styles.revIcon} aria-hidden />
                  <p className={styles.revText}>
                    <span className={styles.revLead}>Skill edited. </span>
                    {m.summary}. Runs below this ran on the earlier version.
                  </p>
                </div>
              );
            }
            const run = item.run;
            const on = run.id === selectedId;
            return (
              <button
                key={run.id}
                type="button"
                className={styles.row}
                data-on={on || undefined}
                aria-current={on || undefined}
                onClick={() => onSelect(run.id)}
              >
                <span className={styles.mark}>
                  <RunStateDot state={run.state} />
                </span>
                <span className={styles.subject}>{run.subject}</span>
                <span className={styles.time}>{formatTime(run.startedAt)}</span>

                <span className={styles.meta}>
                  <span className={styles.skill}>
                    {showSkill ? run.skillName : mailboxName(run.mailboxId)}
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      ))}
      <p className={styles.end}>
        {runs.length} {runs.length === 1 ? 'run' : 'runs'} shown
      </p>
    </div>
  );
}
