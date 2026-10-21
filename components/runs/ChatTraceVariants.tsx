'use client';

import { useState } from 'react';
import type { RunTurn, SkillRun } from '@/data/runFixtures';
import CustomerMark from './CustomerMark';
import { SkippedTail, StepRail } from './RunTrace';
import { ChatEvent, ENDING_LABEL, turnIssue } from './ChatTrace';
import { chatSpan, formatTime } from './runsModel';
import styles from './ChatTraceVariants.module.css';

/* The two arrangements the review exhibit compares against ChatTrace (01).
 * Exhibit-only: the app ships ChatTrace. Both read the same run and draw steps
 * with the same StepRail, so what differs is only the arrangement. */

/** A turn's steps with its reply written into the reply step, the way an
 *  email run's drafted reply sits in its own step. */
function withReply(turn: RunTurn) {
  return turn.steps.map((s) =>
    s.kind === 'reply' && s.status === 'done' && turn.reply ? { ...s, draft: turn.reply } : s,
  );
}

function Head({ run }: { run: SkillRun }) {
  return (
    <div className={styles.head}>
      <h3 className={styles.title}>Skill execution</h3>
      <span className={styles.span}>{chatSpan(run)}</span>
    </div>
  );
}

function Said({ run, turn, label }: { run: SkillRun; turn: RunTurn; label?: string }) {
  return (
    <div className={styles.said}>
      <div className={styles.who}>
        {label && <span className={styles.label}>{label}</span>}
        <CustomerMark name={run.sender} size={18} className={styles.name} />
        <span className={styles.time}>{formatTime(turn.at)}</span>
      </div>
      <p className={styles.text}>{turn.message}</p>
    </div>
  );
}

/**
 * 02 One trace - the email trace, stretched over the chat. Every step of every
 * turn on one rail, each turn opened by what the customer said, each reply
 * inside its reply step. Nothing folds.
 */
export function OneTrace({ run }: { run: SkillRun }) {
  const turns = run.turns ?? [];
  return (
    <div className={styles.wrap}>
      <Head run={run} />
      {turns.map((turn, i) => (
        <div key={turn.id} className={styles.group}>
          <Said run={run} turn={turn} label={`Message ${i + 1}`} />
          <div className={styles.rail}>
            <StepRail run={run} steps={withReply(turn)} />
          </div>
          {turn.fallback && turn.reply && (
            <p className={styles.fallback}>Fallback sent: &ldquo;{turn.reply}&rdquo;</p>
          )}
        </div>
      ))}
      {run.notReached && <SkippedTail names={run.notReached} why="the customer left first" />}
      {run.ending && <ChatEvent>{ENDING_LABEL[run.ending]}</ChatEvent>}
    </div>
  );
}

/**
 * 03 Reply tabs - one turn at a time. A tab per customer message; the open tab
 * shows what they said, the steps, and the reply. Opens on the turn that
 * decided the outcome.
 */
export function ReplyTabs({ run }: { run: SkillRun }) {
  const turns = run.turns ?? [];
  const decisive = turns.findIndex((t) => turnIssue(t));
  const [at, setAt] = useState(decisive >= 0 ? decisive : turns.length - 1);
  const turn = turns[at];
  return (
    <div className={styles.wrap}>
      <Head run={run} />
      <div className={styles.tabs} role="tablist" aria-label="Messages">
        {turns.map((t, i) => {
          const issue = turnIssue(t);
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={i === at}
              className={styles.tab}
              onClick={() => setAt(i)}
            >
              Message {i + 1}
              {issue && (
                <span className={styles.tabDot} data-tone={issue.tone} aria-label={issue.text} />
              )}
            </button>
          );
        })}
      </div>
      {turn && (
        <div className={styles.group}>
          <Said run={run} turn={turn} />
          <div className={styles.rail}>
            <StepRail run={run} steps={withReply(turn)} />
          </div>
          {turn.fallback && turn.reply && (
            <p className={styles.fallback}>Fallback sent: &ldquo;{turn.reply}&rdquo;</p>
          )}
        </div>
      )}
      {at === turns.length - 1 && run.notReached && (
        <SkippedTail names={run.notReached} why="the customer left first" />
      )}
      {at === turns.length - 1 && run.ending && <ChatEvent>{ENDING_LABEL[run.ending]}</ChatEvent>}
    </div>
  );
}
