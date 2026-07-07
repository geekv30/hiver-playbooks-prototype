'use client';

import type { ReactNode } from 'react';
import { RiArrowRightSLine, RiTimeLine, RiMailAiLine, RiHashtag } from 'react-icons/ri';
import styles from './EvalMenu.module.css';

export type EvalView = 'menu' | 'recent' | 'scenarios' | 'custom';

// The three ways to evaluate (Figma 1721:67361). Generic, reusable entries - copy
// is the only per-entry content. Names double as the back-header title.
export const EVAL_ENTRIES: { id: Exclude<EvalView, 'menu'>; title: string; sub: string }[] = [
  { id: 'recent', title: 'Recent conversations', sub: 'Recent emails from your shared inbox' },
  { id: 'scenarios', title: 'AI scenarios', sub: 'Tailor-made AI test scenarios' },
  { id: 'custom', title: 'Custom email', sub: 'Write your own test email' },
];

// Back-header titles for each flow (sentence case throughout).
export const EVAL_TITLES: Record<Exclude<EvalView, 'menu'>, string> = {
  recent: 'Recent conversations',
  scenarios: 'AI scenarios',
  custom: 'Custom email',
};

// One icon per flow - shared by the entry card and the flow's back-header so the
// two always match (Figma 1721:67361: time-line / mail-ai-line / hashtag).
export const EVAL_ICONS: Record<Exclude<EvalView, 'menu'>, ReactNode> = {
  recent: <RiTimeLine />,
  scenarios: <RiMailAiLine />,
  custom: <RiHashtag />,
};

interface Props {
  onOpen: (view: Exclude<EvalView, 'menu'>) => void;
}

/**
 * EvalMenu - the Evaluate root (Figma 1721:67361): "Evaluate your AOP in one of
 * these ways" over three entry cards. Each card carries its icon, title and
 * subtitle; opening one enters its flow (the tabs stay pinned above).
 */
export default function EvalMenu({ onOpen }: Props) {
  return (
    <div className={styles.menu}>
      <h3 className={styles.heading}>Evaluate your AOP in one of these ways</h3>
      <div className={styles.cards}>
        {EVAL_ENTRIES.map((e) => (
          <button key={e.id} type="button" className={styles.card} onClick={() => onOpen(e.id)}>
            <span className={styles.text}>
              <span className={styles.icon} aria-hidden>
                {EVAL_ICONS[e.id]}
              </span>
              <span className={styles.titleSub}>
                <span className={styles.title}>{e.title}</span>
                <span className={styles.sub}>{e.sub}</span>
              </span>
            </span>
            <RiArrowRightSLine className={styles.chevron} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
