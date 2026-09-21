'use client';

import { RiExternalLinkLine, RiCheckLine, RiGitCommitLine } from 'react-icons/ri';
import { NOW, type RevisionMark, type SkillRun } from '@/data/runFixtures';
import { mailboxName } from '@/data/mailboxes';
import RunStatePill from './RunStatePill';
import RunTrace from './RunTrace';
import { formatDateTime, formatDuration, formatWait } from './runsModel';
import styles from './RunDetail.module.css';

interface Props {
  run: SkillRun | null;
  /** The revision this run pinned, when the skill has since been edited. */
  staleMark?: RevisionMark | null;
  onOpenConversation?: (run: SkillRun) => void;
  showSkill?: boolean;
}

/** What the outcome means, said plainly. A state name on its own explains
 *  nothing - "Errored" reading as "the skill is broken" is exactly the gap. */
function stateBody(run: SkillRun): { body: React.ReactNode; strong?: string } {
  switch (run.state) {
    case 'completed':
      return {
        body:
          run.applied.length > 0
            ? `The skill ran every step and applied ${run.applied.length} ${
                run.applied.length === 1 ? 'action' : 'actions'
              } to this conversation.`
            : 'The skill ran every step. Nothing needed changing on this conversation.',
      };
    case 'awaiting':
      return {
        strong: `Waiting on ${run.assignee ?? 'a teammate'}.`,
        body: ` The skill drafted a reply and stopped, because this step needs a person to sign it off. The draft is on the conversation - approving or declining happens there, not here.`,
      };
    case 'failed':
      return {
        strong: `${run.error?.step ?? 'A step'} failed.`,
        body: ` ${run.error?.message ?? ''} Steps before it had already applied, so this conversation is partly changed.`,
      };
    case 'declined':
      return {
        strong: `${run.assignee ?? 'A teammate'} declined the draft.`,
        body: ' The reply was never sent. Everything the skill did before that step still applied.',
      };
  }
}

/**
 * RunDetail - one run, in full: what it ran on, how it ended, what actually
 * landed, and the step-by-step trace.
 *
 * Read-only on purpose. The one way out is the conversation, because that is
 * where a person has both the context and the permission to act - approving a
 * draft from a list, without the thread in front of you, is the wrong place to
 * make that call.
 */
export default function RunDetail({ run, staleMark, onOpenConversation, showSkill }: Props) {
  if (!run) {
    return (
      <div className={styles.detail}>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Pick a run</p>
          <p className={styles.emptyBody}>
            Select a run to see what the skill did, step by step.
          </p>
        </div>
      </div>
    );
  }

  const { body, strong } = stateBody(run);
  const waited = run.state === 'awaiting' ? NOW - run.startedAt : null;

  return (
    <div className={styles.detail}>
      <div className={styles.scroll}>
        <div className={styles.measure}>
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

          <div className={styles.facts}>
            <span className={styles.fact}>
              <RunStatePill state={run.state} />
            </span>
            {showSkill && (
              <span className={styles.fact}>
                <span className={styles.factKey}>Skill</span>
                <span className={styles.factVal}>{run.skillName}</span>
              </span>
            )}
            <span className={styles.fact}>
              <span className={styles.factKey}>Mailbox</span>
              <span className={styles.factVal}>{mailboxName(run.mailboxId)}</span>
            </span>
            <span className={styles.fact}>
              <span className={styles.factKey}>Ran</span>
              <span className={styles.factVal}>{formatDateTime(run.startedAt)}</span>
            </span>
            <span className={styles.fact}>
              <span className={styles.factKey}>Took</span>
              <span className={styles.factVal}>{formatDuration(run.durationMs)}</span>
            </span>
            <span className={styles.fact}>
              <span className={styles.factKey}>Conversation</span>
              <span className={`${styles.factVal} ${styles.mono}`}>{run.conversationId}</span>
            </span>
          </div>
        </header>

        <div className={styles.state} data-state={run.state}>
          <p className={styles.stateBody}>
            {strong && <span className={styles.stateStrong}>{strong}</span>}
            {body}
          </p>
          {waited !== null && (
            <p className={styles.stateBody}>Waiting {formatWait(waited)} so far.</p>
          )}
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>What landed</h3>
          </div>
          {run.applied.length === 0 && run.external.length === 0 ? (
            <p className={styles.none}>
              Nothing was applied - the run ended before any step changed anything.
            </p>
          ) : (
            <div className={styles.applied}>
              {run.applied.map((a) => (
                <p key={a} className={styles.appliedRow}>
                  <RiCheckLine className={styles.tick} aria-hidden />
                  {a} on this conversation
                </p>
              ))}
              {run.external.map((e) => (
                <p key={e} className={styles.appliedRow}>
                  <RiCheckLine className={styles.tick} aria-hidden />
                  {e}
                </p>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Trace</h3>
            <span className={styles.sectionNote}>
              {run.steps.filter((s) => s.status !== 'skipped').length} of {run.steps.length} steps ran
            </span>
          </div>
          <RunTrace run={run} />
        </section>

        {staleMark && (
          <section className={styles.section}>
            <div className={styles.state}>
              <p className={styles.stateBody}>
                <RiGitCommitLine
                  style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--violet-intense)' }}
                  aria-hidden
                />
                <span className={styles.stateStrong}>This ran on an earlier version.</span> The
                skill was edited since - {staleMark.summary.toLowerCase()} - so the steps above
                will not match the skill as it reads today.
              </p>
            </div>
          </section>
        )}
        </div>
      </div>
    </div>
  );
}
