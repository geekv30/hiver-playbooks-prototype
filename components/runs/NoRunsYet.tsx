'use client';

import { RiArrowRightLine } from 'react-icons/ri';
import type { DeployStatus } from '@/components/flow01/doc';
import { mailboxSummary } from '@/data/mailboxes';
import { formatTime } from './runsModel';
import styles from './NoRunsYet.module.css';

/** What the Runs surface needs to know about a skill that has never run. */
export interface RunsSkill {
  status: DeployStatus;
  mailboxes: string[];
  /** The trigger, as plain text - what the skill is waiting to match. */
  trigger: string;
  liveSince?: number;
  pausedAt?: number;
}

/** "today at 2:14 PM", "yesterday at 9:05 AM", "on Oct 3 at 4:40 PM". Real
 *  wall-clock time: these stamps are set by the person enabling the skill, not
 *  read off the fixtures' anchored clock. */
function when(t: number): string {
  const day = (x: number) => new Date(x).setHours(0, 0, 0, 0);
  const diff = Math.round((day(Date.now()) - day(t)) / 86_400_000);
  const at = formatTime(t);
  if (diff === 0) return `today at ${at}`;
  if (diff === 1) return `yesterday at ${at}`;
  return `on ${new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${at}`;
}

function copy(skill: RunsSkill): { title: string; body: string } {
  const where = mailboxSummary(skill.mailboxes);
  if (skill.status === 'draft') {
    return { title: 'Nothing to see. Yet.', body: 'Enable this skill and its runs show up here.' };
  }
  if (skill.status === 'paused') {
    return {
      title: 'Clocked out before its first shift',
      body: `Paused${skill.pausedAt ? ` ${when(skill.pausedAt)}` : ''}. Nothing matched while it was on.`,
    };
  }
  return {
    title: 'All ears, no emails yet',
    body: `Watching ${where || 'its mailboxes'}${skill.liveSince ? ` since ${when(skill.liveSince)}` : ''}. The first match lands here.`,
  };
}

/**
 * NoRunsYet - the Runs surface for a skill that has never run.
 *
 * One island in place of the chart and the log: a plot of empty days and an
 * empty list beside an empty detail would be three ways of saying nothing.
 * Instead it says which of the three reasons applies - not live yet, live and
 * waiting, or paused before anything matched - and, for a skill that has been
 * live, the trigger it is waiting on, since that is the first thing to check
 * when nothing has come in.
 */
export default function NoRunsYet({
  skill,
  onCheckMatches,
}: {
  skill: RunsSkill;
  /** Open Evaluation > Matching emails: the honest answer to "will anything
   *  ever match this?" without waiting to find out. */
  onCheckMatches?: () => void;
}) {
  const { title, body } = copy(skill);
  const showTrigger = skill.status !== 'draft' && skill.trigger.trim() !== '';
  return (
    <div className={styles.wrap} data-status={skill.status}>
      <div className={styles.head}>
        <span className={styles.mark} aria-hidden>
          <span className={styles.dot} />
        </span>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <p className={styles.body}>{body}</p>
      {showTrigger && (
        <div className={styles.trigger}>
          <span className={styles.label}>Trigger</span>
          <p className={styles.quote}>{skill.trigger}</p>
        </div>
      )}
      {showTrigger && onCheckMatches && (
        <button type="button" className={styles.link} onClick={onCheckMatches}>
          See what would match
          <RiArrowRightLine aria-hidden />
        </button>
      )}
    </div>
  );
}
