'use client';

import { useEffect, useRef, useState } from 'react';
import { RiExternalLinkLine, RiFileCopyLine, RiCheckLine, RiGitCommitLine } from 'react-icons/ri';
import { NOW, type RevisionMark, type SkillRun } from '@/data/runFixtures';
import RunTrace from './RunTrace';
import { formatWait } from './runsModel';
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
function outcome(run: SkillRun): { title: string; body: string } {
  switch (run.state) {
    case 'completed':
      return {
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
        title: `Waiting on ${run.assignee ?? 'a teammate'}`,
        body: `The reply is drafted and held for sign-off - it has waited ${formatWait(
          NOW - run.startedAt,
        )}. Approving or declining happens on the conversation, not here.`,
      };
    case 'failed':
      return {
        title: `${run.error?.step ?? 'A step'} failed`,
        body: `${run.error?.message ?? ''} Steps before it had already applied, so this conversation is partly changed.`,
      };
    case 'declined':
      return {
        title: `${run.assignee ?? 'A teammate'} declined the draft`,
        body: 'The reply never sent. Everything the skill did before that step still applied.',
      };
  }
}

/** The sender's address, copyable in place - the one fact from this pane that
 *  a person most often needs somewhere else (a CRM, a search, a reply). */
function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const copy = () => {
    void navigator.clipboard?.writeText(email).catch(() => {});
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button
      type="button"
      className={styles.copy}
      onClick={copy}
      aria-label={copied ? 'Email copied' : `Copy ${email}`}
      title={copied ? 'Copied' : 'Copy email'}
    >
      {copied ? <RiCheckLine aria-hidden /> : <RiFileCopyLine aria-hidden />}
    </button>
  );
}

/**
 * RunDetail - one run, in full (Figma 3593:24686).
 *
 * Reads top to bottom as a story: what it ran on, what happened, then the
 * steps. When and where it ran are on the run's own row beside this pane, so
 * the pane does not repeat them in a facts rail. There is deliberately no
 * separate list of actions taken - the trace already is that list.
 */
export default function RunDetail({ run, staleMark, onOpenConversation }: Props) {
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

  return (
    <div className={styles.detail}>
      <div className={styles.scroll}>
        <header className={styles.head}>
          <div className={styles.headText}>
            <h2 className={styles.subject}>{run.subject}</h2>
            <p className={styles.from}>
              <span>{run.sender}</span>
              <span className={styles.fromSep} aria-hidden>
                &middot;
              </span>
              <span>{run.senderEmail}</span>
              <CopyEmail email={run.senderEmail} />
            </p>
          </div>
          <button
            type="button"
            className={styles.openBtn}
            onClick={() => onOpenConversation?.(run)}
          >
            <RiExternalLinkLine aria-hidden />
            Go to conversation
          </button>
        </header>

        <div className={styles.outcome} data-state={run.state}>
          <span className={styles.outcomeMark} aria-hidden>
            <span className={styles.outcomeDot} />
          </span>
          <div className={styles.outcomeText}>
            <p className={styles.outcomeTitle}>{o.title}</p>
            <p className={styles.outcomeBody}>{o.body}</p>
          </div>
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Skill execution</h3>

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
    </div>
  );
}
