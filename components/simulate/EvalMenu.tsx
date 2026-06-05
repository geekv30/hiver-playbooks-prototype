'use client';

import { RiArrowRightSLine } from 'react-icons/ri';
import styles from './EvalMenu.module.css';

export type EvalView = 'menu' | 'recent' | 'scenarios' | 'custom';

// The three ways to evaluate (Figma 647:43211). Generic, reusable entries - the
// copy is the only per-entry content (no case-specific data). Names are also used
// for the back-header title when a flow is entered.
export const EVAL_ENTRIES: { id: Exclude<EvalView, 'menu'>; title: string; sub: string }[] = [
  { id: 'recent', title: 'Recent conversations', sub: 'Recent emails from your shared inbox' },
  { id: 'scenarios', title: 'AI scenarios', sub: 'Tailored AI test scenarios' },
  { id: 'custom', title: 'Custom email', sub: 'Compose your own test email' },
];

// Back-header titles for each flow (Figma 695:15007 etc.).
export const EVAL_TITLES: Record<Exclude<EvalView, 'menu'>, string> = {
  recent: 'Recent conversations',
  scenarios: 'AI scenarios',
  custom: 'Custom email',
};

interface Props {
  onOpen: (view: Exclude<EvalView, 'menu'>) => void;
}

/**
 * EvalMenu - the Evaluate root (Figma 647:43211): "How do you want to evaluate?"
 * over three entry cards. Each card opens its flow; the panel then swaps the
 * Copilot | Evaluation tabs for a `‹ {name}` back-header.
 */
export default function EvalMenu({ onOpen }: Props) {
  return (
    <div className={styles.menu}>
      <h3 className={styles.heading}>How do you want to evaluate?</h3>
      <div className={styles.cards}>
        {EVAL_ENTRIES.map((e) => (
          <button key={e.id} type="button" className={styles.card} onClick={() => onOpen(e.id)}>
            <span className={styles.text}>
              <span className={styles.title}>{e.title}</span>
              <span className={styles.sub}>{e.sub}</span>
            </span>
            <RiArrowRightSLine className={styles.chevron} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
