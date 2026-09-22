'use client';

import { RiCheckboxCircleLine, RiRadioButtonLine } from 'react-icons/ri';
import type { SkillRun } from '@/data/runFixtures';
import { countBy, summaryLine } from './runsModel';
import styles from './RunLead.module.css';

interface Props {
  windowRuns: SkillRun[];
  days: number;
}

/**
 * RunLead - one line on how the skill is doing over the window.
 *
 * It states the period plainly and stops there. Naming causes and the people a
 * reply is held on used to lead this page; that treatment is gone, so nothing
 * here ranks a run or asks to be acted on. The outcome filters directly below
 * carry the counts, and the list carries the runs.
 */
export default function RunLead({ windowRuns, days }: Props) {
  const counts = countBy(windowRuns);
  const idle = counts.total === 0;
  const clean = !idle && counts.failed === 0 && counts.awaiting === 0;

  return (
    <div className={styles.lead}>
      <div className={styles.state} data-quiet={clean ? undefined : true}>
        {/* Nothing has happened yet is not a success, and neither is a window
            with failures in it - a green tick on either claims something the
            skill has not done. */}
        {clean ? (
          <RiCheckboxCircleLine className={styles.stateIcon} aria-hidden />
        ) : (
          <RiRadioButtonLine className={styles.stateIcon} aria-hidden />
        )}
        <div className={styles.stateText}>
          <h2 className={styles.stateTitle}>
            {idle ? 'No runs yet' : clean ? 'Running normally' : 'Not everything ran cleanly'}
          </h2>
          <p className={styles.stateBody}>
            {idle
              ? 'Runs appear here as soon as this skill fires on an email in one of its mailboxes.'
              : clean
                ? `${summaryLine(counts, days)} Nothing needs your attention.`
                : summaryLine(counts, days)}
          </p>
        </div>
      </div>
    </div>
  );
}
