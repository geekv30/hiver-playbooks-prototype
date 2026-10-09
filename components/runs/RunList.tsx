'use client';

import type { SkillRun } from '@/data/runFixtures';
import { RiChat3Line, RiInbox2Line } from 'react-icons/ri';
import { inboxName } from '@/data/inboxes';
import { RunStateDot } from './RunStatePill';
import CustomerMark from './CustomerMark';
import { formatDayLabel, formatTime, groupByDay } from './runsModel';
import styles from './RunList.module.css';

interface Props {
  runs: SkillRun[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** All-skills mode puts the skill name on each row. */
  showSkill?: boolean;
  /** Mark each row's inbox with its channel - only when both channels are in
   *  play, where the mark tells two kinds of run apart. */
  showChannel?: boolean;
  /** True when a filter is narrowing the list - changes what "nothing here" means. */
  filtered?: boolean;
  /** What to say when the list is empty, and the ways out. Written by the
   *  surface, which knows what is filtered and what lies outside it. */
  empty?: ListEmpty;
}

export interface ListEmpty {
  title: string;
  body: string;
  /** At most two; the first is the likeliest next step. */
  actions?: { label: string; onClick: () => void }[];
}

/**
 * RunList - every run in the window, grouped by day, newest first.
 *
 * Two lines per run: what it ran on, and where it ran. What the skill DID, who
 * wrote in and how long it took all stay in the detail - repeating them on
 * every row made the list harder to scan, not easier, and the outcome dot
 * already carries the one thing worth seeing at this distance.
 */
export default function RunList({
  runs,
  selectedId,
  onSelect,
  showSkill,
  showChannel,
  filtered,
  empty,
}: Props) {
  const groups = groupByDay(runs);

  if (runs.length === 0 && empty) {
    return (
      <div className={styles.list} data-empty>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{empty.title}</p>
          <p className={styles.emptyBody}>{empty.body}</p>
          {empty.actions && empty.actions.length > 0 && (
            <div className={styles.emptyActions}>
              {empty.actions.map((a) => (
                <button key={a.label} type="button" className={styles.widen} onClick={a.onClick}>
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

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
              : 'Runs show up here once it fires.'}
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

          {g.runs.map((run) => {
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
                {/* An email by its subject; a chat by who it was with - a chat
                    has no subject, and "(no subject)" on every row says nothing. */}
                {run.channel === 'chat' ? (
                  <CustomerMark name={run.sender} className={styles.subject} />
                ) : (
                  <span className={styles.subject}>{run.subject}</span>
                )}
                <span className={styles.time}>{formatTime(run.startedAt)}</span>

                {/* Across all skills the row names its skill too - with the
                    facts rail gone, the row is the only place a run's mailbox
                    is written, so it never gives that up. */}
                <span className={styles.meta}>
                  {showSkill && (
                    <>
                      <span className={styles.skill}>{run.skillName}</span>
                      <span aria-hidden>&middot;</span>
                    </>
                  )}
                  <span className={styles.inbox}>
                    {showChannel &&
                      (run.channel === 'chat' ? (
                        <RiChat3Line className={styles.channel} aria-label="Chat" />
                      ) : (
                        <RiInbox2Line className={styles.channel} aria-label="Email" />
                      ))}
                    <span className={styles.skill}>{inboxName(run.inboxId)}</span>
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
