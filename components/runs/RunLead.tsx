'use client';

import { RiCheckboxCircleLine, RiRadioButtonLine } from 'react-icons/ri';
import type { SkillRun } from '@/data/runFixtures';
import { countBy, leadState } from './runsModel';
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
 *
 * The copy lives in runsModel.leadState, not here.
 */
export default function RunLead({ windowRuns, days }: Props) {
  const counts = countBy(windowRuns);
  const state = leadState(counts, days);
  const clean = state.kind === 'clean';

  return (
    <div className={styles.lead}>
      <div className={styles.state} data-quiet={clean ? undefined : true}>
        {clean ? (
          <RiCheckboxCircleLine className={styles.stateIcon} aria-hidden />
        ) : (
          <RiRadioButtonLine className={styles.stateIcon} aria-hidden />
        )}
        <div className={styles.stateText}>
          <h2 className={styles.stateTitle}>{state.title}</h2>
          <p className={styles.stateBody}>{state.body}</p>
        </div>
      </div>
    </div>
  );
}
