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
 * It closes the band rather than opening it: the chart states the shape of the
 * period, this states what the shape amounts to. There is no headline left, so
 * the MARK carries the state on its own - a tick only when the window is
 * genuinely clean, a quiet dot whenever it is not, because a tick over fifteen
 * failures would claim something the skill has not done.
 *
 * Nothing here ranks a run or asks to be acted on: the outcome filters below
 * carry the counts, and the list carries the runs. The copy lives in
 * runsModel.leadState.
 */
export default function RunLead({ windowRuns, days }: Props) {
  const counts = countBy(windowRuns);
  const state = leadState(counts, days);
  const clean = state.kind === 'clean';

  return (
    <p className={styles.summary} data-quiet={clean ? undefined : true}>
      {clean ? (
        <RiCheckboxCircleLine className={styles.mark} aria-hidden />
      ) : (
        <RiRadioButtonLine className={styles.mark} aria-hidden />
      )}
      <span>{state.body}</span>
    </p>
  );
}
