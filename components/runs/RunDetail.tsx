'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { RiExternalLinkLine, RiFileCopyLine, RiCheckLine } from 'react-icons/ri';
import { NOW, type SkillRun } from '@/data/runFixtures';
import RunTrace from './RunTrace';
import ChatTrace from './ChatTrace';
import CustomerMark from './CustomerMark';
import { formatWait } from './runsModel';
import styles from './RunDetail.module.css';

interface Props {
  run: SkillRun | null;
  /** How a chat run's turns are drawn. The app uses ChatTrace; the review
   *  exhibit swaps in the alternatives to compare them in the real pane. */
  chatTrace?: ComponentType<{ run: SkillRun }>;
  onOpenConversation?: (run: SkillRun) => void;
  showSkill?: boolean;
}

/** What happened, as a headline and a sentence. Every outcome gets one - a
 *  state name alone explains nothing, and "Failed" with no cause reads as
 *  "the skill is broken" rather than "one step could not reach HubSpot". */
function outcome(run: SkillRun): { title: string; body: string } {
  if (run.channel === 'chat') return chatOutcome(run);
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

/** The same summary for a chat run - ONE for the whole chat, however many
 *  replies it took. What differs from email is what the customer saw: a chat
 *  reply is never held for sign-off (the customer is there, waiting), so what
 *  waits on a person is an action, and a broken step hands the chat over live. */
function chatOutcome(run: SkillRun): { title: string; body: string } {
  const turns = run.turns ?? [];
  const replies = turns.filter((t) => t.reply && !t.fallback).length;
  const at = (pick: (s: SkillRun['steps'][number]) => boolean) => {
    const i = turns.findIndex((t) => t.steps.some(pick));
    return i >= 0 ? i + 1 : null;
  };
  const step = (status: string) => run.steps.find((s) => s.status === status)?.label ?? 'A step';
  const applied =
    run.applied.length > 0
      ? `, and ${run.applied.length} ${run.applied.length === 1 ? 'action' : 'actions'} applied to this chat`
      : '';
  switch (run.state) {
    case 'completed':
      if (run.ending === 'left') {
        const n = run.notReached?.length ?? 0;
        return {
          title: 'Stopped when the customer left',
          body: `The customer stopped replying after message ${turns.length}. Nothing failed, but ${n} ${
            n === 1 ? 'step' : 'steps'
          } never ran.`,
        };
      }
      return {
        title: 'Ran through to the end',
        body: `Every step ran over ${replies} ${replies === 1 ? 'reply' : 'replies'}${applied}.`,
      };
    case 'awaiting':
      return {
        title: `Waiting on ${run.assignee ?? 'a teammate'}`,
        body: `${step('held')} is held for sign-off - it has waited ${formatWait(
          NOW - run.startedAt,
        )}. The customer was told the team will confirm. Approving or declining happens on the conversation, not here.`,
      };
    case 'failed':
      return {
        title: `${run.error?.step ?? 'A step'} failed in message ${at((s) => s.status === 'failed') ?? 1}`,
        body: `${run.error?.message ?? ''} The chat went to a teammate with a fallback reply. Steps before it had already applied.`,
      };
    case 'declined':
      return {
        title: `${run.assignee ?? 'A teammate'} declined ${step('declined')}`,
        body: 'It never ran. The customer still got every reply, and everything else the skill did applied.',
      };
  }
}

/** The sender's address, copyable in place - the one fact from this pane that
 *  a person most often needs somewhere else (a CRM, a search, a reply). */
function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
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
export default function RunDetail({
  run,
  onOpenConversation,
  chatTrace: Trace = ChatTrace,
}: Props) {
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
          {run.channel === 'chat' ? (
            // A chat is headed by who it was with - it has no subject. Their
            // address when they gave one; a visitor who did not is said so.
            <div className={styles.headText}>
              <h2 className={styles.subject}>
                <CustomerMark name={run.sender} size={22} />
              </h2>
              <p className={styles.from} data-indent>
                {run.senderEmail ? (
                  <>
                    <span>{run.senderEmail}</span>
                    <CopyEmail email={run.senderEmail} />
                  </>
                ) : (
                  <span>Anonymous visitor</span>
                )}
              </p>
            </div>
          ) : (
            <div className={styles.headText}>
              <h2 className={styles.subject}>{run.subject}</h2>
              <p className={styles.from}>
                <span>{run.sender}</span>
                <span className={styles.fromSep} aria-hidden>
                  &middot;
                </span>
                <span>{run.senderEmail}</span>
                {run.senderEmail && <CopyEmail email={run.senderEmail} />}
              </p>
            </div>
          )}
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
          {run.channel === 'chat' ? (
            // Keyed: a different chat opens with its own deciding turn open.
            <Trace key={run.id} run={run} />
          ) : (
            <>
              <h3 className={styles.sectionTitle}>Skill execution</h3>
              <RunTrace run={run} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
