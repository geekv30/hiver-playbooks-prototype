'use client';

import type { ReactNode } from 'react';
import {
  RiExternalLinkLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiTimeLine,
  RiCloseCircleLine,
  RiGitCommitLine,
} from 'react-icons/ri';
import { NOW, type RevisionMark, type SkillRun } from '@/data/runFixtures';
import { mailboxName } from '@/data/mailboxes';
import RunTrace from './RunTrace';
import { formatDateTime, formatDuration, formatWait } from './runsModel';
import styles from './RunDetail.module.css';

interface Props {
  run: SkillRun | null;
  staleMark?: RevisionMark | null;
  onOpenConversation?: (run: SkillRun) => void;
  showSkill?: boolean;
}

/** What happened, as a headline and a sentence. Every outcome gets one - a
 *  state name alone explains nothing, and "Failed" with no cause reads as
 *  "the skill is broken" rather than "one step could not reach HubSpot". */
function outcome(run: SkillRun): { icon: ReactNode; title: string; body: string } {
  switch (run.state) {
    case 'completed':
      return {
        icon: <RiCheckboxCircleLine />,
        title: 'Ran through to the end',
        body:
          run.applied.length > 0
            ? `Every step ran, and ${run.applied.length} ${
                run.applied.length === 1 ? 'action' : 'actions'
              } applied to this conversation.`
            : 'Every step ran. Nothing needed changing on this conversation.',
      };
    case 'awaiting':
      return {
        icon: <RiTimeLine />,
        title: `Waiting on ${run.assignee ?? 'a teammate'}`,
        body: `The reply is drafted and held for sign-off - it has waited ${formatWait(
          NOW - run.startedAt,
        )}. Approving or declining happens on the conversation, not here.`,
      };
    case 'failed':
      return {
        icon: <RiErrorWarningLine />,
        title: `${run.error?.step ?? 'A step'} failed`,
        body: `${run.error?.message ?? ''} Steps before it had already applied, so this conversation is partly changed.`,
      };
    case 'declined':
      return {
        icon: <RiCloseCircleLine />,
        title: `${run.assignee ?? 'A teammate'} declined the draft`,
        body: 'The reply never sent. Everything the skill did before that step still applied.',
      };
  }
}

/**
 * RunDetail - one run, in full.
 *
 * Reads top to bottom as a story: what it ran on, what happened, the facts,
 * then the steps. There is deliberately no separate list of actions taken -
 * the trace already is that list, and printing it twice made the pane repeat
 * itself three times over.
 */
export default function RunDetail({ run, staleMark, onOpenConversation, showSkill }: Props) {
  if (!run) {
    return (
      <div className={styles.detail}>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Pick a run</p>
          <p className={styles.emptyBody}>Select a run to see what the skill did, step by step.</p>
        </div>
      </div>
    );
  }

  const o = outcome(run);
  const ran = run.steps.filter((s) => s.status !== 'skipped').length;

  return (
    <div className={styles.detail}>
      <div className={styles.scroll}>
        <div className={styles.body}>
          <div className={styles.main}>
          <header className={styles.head}>
            <div className={styles.headTop}>
              <div>
                <h2 className={styles.subject}>{run.subject}</h2>
                <p className={styles.from}>
                  <span className={styles.fromName}>{run.sender}</span> &middot; {run.senderEmail}
                </p>
              </div>
              <button
                type="button"
                className={styles.openBtn}
                onClick={() => onOpenConversation?.(run)}
              >
                <RiExternalLinkLine aria-hidden />
                Open conversation
              </button>
            </div>

            <div className={styles.outcome} data-state={run.state}>
              <span className={styles.outcomeIcon} aria-hidden>
                {o.icon}
              </span>
              <div className={styles.outcomeText}>
                <p className={styles.outcomeTitle}>{o.title}</p>
                <p className={styles.outcomeBody}>{o.body}</p>
              </div>
            </div>

          </header>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h3 className={styles.sectionTitle}>What the skill did</h3>
              <span className={styles.sectionNote}>
                {ran} of {run.steps.length} steps ran
              </span>
            </div>

            {staleMark && (
              <div className={styles.stale}>
                <RiGitCommitLine className={styles.staleIcon} aria-hidden />
                <p className={styles.staleText}>
                  <span className={styles.staleLead}>This ran on an earlier version. </span>
                  The skill was edited since - {staleMark.summary.toLowerCase()} - so these steps
                  will not match the skill as it reads today.
                </p>
              </div>
            )}

            <RunTrace run={run} />
          </section>
          </div>

          <aside className={styles.rail}>
            <dl className={styles.facts}>
              {showSkill && (
                <div className={styles.fact}>
                  <dt className={styles.factKey}>Skill</dt>
                  <dd className={styles.factVal}>{run.skillName}</dd>
                </div>
              )}
              <div className={styles.fact}>
                <dt className={styles.factKey}>Mailbox</dt>
                <dd className={styles.factVal}>{mailboxName(run.mailboxId)}</dd>
              </div>
              <div className={styles.fact}>
                <dt className={styles.factKey}>Ran</dt>
                <dd className={styles.factVal}>{formatDateTime(run.startedAt)}</dd>
              </div>
              <div className={styles.fact}>
                <dt className={styles.factKey}>Took</dt>
                <dd className={styles.factVal}>{formatDuration(run.durationMs)}</dd>
              </div>
              <div className={styles.fact}>
                <dt className={styles.factKey}>Conversation</dt>
                <dd className={`${styles.factVal} ${styles.mono}`}>{run.conversationId}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </div>
  );
}
