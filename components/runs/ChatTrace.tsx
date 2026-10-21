'use client';

import { useState } from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';
import { AgentsIcon } from '@/components/icons/ui/Agents';
import type { ChatEnding, RunTurn, SkillRun } from '@/data/runFixtures';
import CustomerMark from './CustomerMark';
import { SkippedTail, StepRail, stepName } from './RunTrace';
import { chatSpan, formatTime } from './runsModel';
import styles from './ChatTrace.module.css';

/** How the chat ended, as the closing divider says it. */
export const ENDING_LABEL: Record<ChatEnding, string> = {
  closed: 'Chat closed',
  left: 'Customer stopped replying',
  handedOff: 'Handed to a teammate',
};

/** The steps a turn ran, without its reply - the reply is the message right
 *  under them, so listing it as a step too would say it twice. */
export const turnSteps = (turn: RunTurn) => turn.steps.filter((s) => s.kind !== 'reply');

/** The one thing in a turn worth seeing while it is folded: the step that
 *  broke, waits, or was turned down. Null for a turn that just ran. */
export function turnIssue(
  turn: RunTurn,
): { tone: 'failed' | 'awaiting' | 'declined'; text: string } | null {
  for (const s of turn.steps) {
    if (s.status === 'failed') return { tone: 'failed', text: `${stepName(s)} failed` };
    if (s.status === 'held') return { tone: 'awaiting', text: `${stepName(s)} needs approval` };
    if (s.status === 'declined') return { tone: 'declined', text: `${stepName(s)} declined` };
  }
  return null;
}

/** A centred, labelled hairline - the playground's event line, so a chat
 *  reads the same in Evaluation and in Runs. */
export function ChatEvent({ children }: { children: React.ReactNode }) {
  return (
    <p className={styles.event}>
      <span>{children}</span>
    </p>
  );
}

/**
 * ChatTrace - a chat run, turn by turn, under one outcome.
 *
 * An email run is one message in and one set of steps. A chat run is a short
 * conversation: each customer message gets its own steps and its own reply.
 * So the trace keeps the conversation as its spine and folds each turn's steps
 * under the AI agent's line, in the order they happened - message, steps,
 * reply. Folded, a turn costs two lines and still says when one of its steps
 * broke, waits or was turned down; the turn that decided the outcome opens on
 * its own. There is one summary for the whole run, above this - never one
 * per turn.
 */
export default function ChatTrace({ run }: { run: SkillRun }) {
  const turns = run.turns ?? [];
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(turns.filter((t) => turnIssue(t)).map((t) => t.id)),
  );
  const allOpen = turns.length > 0 && turns.every((t) => open.has(t.id));
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className={styles.chat}>
      {/* The section's own header: same caption-over-hairline as the email
          trace, plus how long the chat ran and one switch for every turn. */}
      <div className={styles.head}>
        <h3 className={styles.title}>Skill execution</h3>
        <span className={styles.span}>{chatSpan(run)}</span>
        <button
          type="button"
          className={styles.expandAll}
          onClick={() => setOpen(allOpen ? new Set() : new Set(turns.map((t) => t.id)))}
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <ChatEvent>
        Skill started &middot; {formatTime(turns[0]?.at ?? run.startedAt)}
        {run.priorMessages ? ` · after ${run.priorMessages} earlier messages` : ''}
      </ChatEvent>

      {turns.map((turn) => {
        const steps = turnSteps(turn);
        const issue = turnIssue(turn);
        const isOpen = open.has(turn.id);
        return (
          <div key={turn.id} className={styles.turn}>
            <div className={styles.message}>
              <div className={styles.who}>
                <CustomerMark name={run.sender} size={20} className={styles.customerName} />
                <span className={styles.time}>{formatTime(turn.at)}</span>
              </div>
              <p className={styles.customerText}>{turn.message}</p>
            </div>

            <div className={styles.message}>
              <button
                type="button"
                className={styles.agentLine}
                aria-expanded={isOpen}
                onClick={() => toggle(turn.id)}
              >
                <span className={styles.agentMark} aria-hidden>
                  <AgentsIcon />
                </span>
                <span className={styles.agentName}>AI agent</span>
                <span className={styles.sep} aria-hidden>
                  &middot;
                </span>
                <span className={styles.stepsLink}>
                  {steps.length} {steps.length === 1 ? 'step' : 'steps'}
                </span>
                {issue && (
                  <>
                    <span className={styles.sep} aria-hidden>
                      &middot;
                    </span>
                    <span className={styles.issue} data-tone={issue.tone}>
                      <span className={styles.issueDot} aria-hidden />
                      {issue.text}
                    </span>
                  </>
                )}
                <RiArrowDownSLine
                  className={styles.chevron}
                  data-open={isOpen || undefined}
                  aria-hidden
                />
              </button>

              {isOpen && (
                <div className={styles.steps}>
                  <StepRail run={run} steps={steps} />
                </div>
              )}

              {turn.reply && (
                <div className={styles.reply}>
                  <p className={styles.replyText}>{turn.reply}</p>
                  {turn.fallback && (
                    <p className={styles.fallbackNote}>
                      The chat agent&apos;s fallback, sent because a step failed. The skill did not
                      write it.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {run.notReached && <SkippedTail names={run.notReached} why="the customer left first" />}

      {run.ending && <ChatEvent>{ENDING_LABEL[run.ending]}</ChatEvent>}
    </div>
  );
}
