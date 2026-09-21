'use client';

import { RiCheckboxCircleLine, RiAlertLine, RiArrowRightLine } from 'react-icons/ri';
import type { SkillRun } from '@/data/runFixtures';
import {
  attentionItems,
  countBy,
  healthyLine,
  type RunFilter,
} from './runsModel';
import styles from './RunVerdict.module.css';

interface Props {
  windowRuns: SkillRun[];
  days: number;
  onFocus: (patch: Partial<RunFilter>) => void;
}

/**
 * RunVerdict - the answer to the question people actually arrive with.
 *
 * Someone opening this screen is not asking "how many runs were there". They
 * are asking "is my skill behaving, and if not, what do I do". Four counts
 * cannot answer that; a sentence can. When something is blocking on a person -
 * a connector that needs reconnecting, replies nobody has signed off - it is
 * named here first, in the words a person would use, with the way to see those
 * runs. When nothing is, that is said plainly and the page moves on.
 *
 * Read-only, so the only action on offer is to look: each row filters the list
 * to the runs it is talking about.
 */
export default function RunVerdict({ windowRuns, days, onFocus }: Props) {
  const items = attentionItems(windowRuns);
  const counts = countBy(windowRuns);

  if (items.length === 0) {
    return (
      <div className={styles.verdict}>
        <div className={styles.clear}>
          <RiCheckboxCircleLine className={styles.clearIcon} aria-hidden />
          <div className={styles.clearText}>
            <h2 className={styles.clearTitle}>
              {counts.total === 0 ? 'No runs yet' : 'Running normally'}
            </h2>
            <p className={styles.clearBody}>
              {counts.total === 0
                ? 'Runs appear here as soon as this skill fires on an email in one of its mailboxes.'
                : `${healthyLine(counts, days)} Nothing needs your attention.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.verdict}>
      <div className={styles.head}>
        <RiAlertLine className={styles.headIcon} aria-hidden />
        <h2 className={styles.headTitle}>
          {items.length === 1 ? 'One thing needs attention' : `${items.length} things need attention`}
        </h2>
      </div>
      <div className={styles.items}>
        {items.map((it) => (
          <button
            key={it.kind}
            type="button"
            className={styles.item}
            data-kind={it.kind}
            onClick={() => onFocus(it.filter)}
          >
            <span className={styles.mark} aria-hidden />
            <span className={styles.itemTitle}>{it.title}</span>
            <span className={styles.itemGo}>
              Show these
              <RiArrowRightLine aria-hidden />
            </span>
            <span className={styles.itemDetail}>{it.detail}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
