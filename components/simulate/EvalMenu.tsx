'use client';

import type { ReactNode } from 'react';
import {
  RiArrowRightSLine,
  RiTimeLine,
  RiMailAiLine,
  RiHashtag,
  RiSearchEyeLine,
} from 'react-icons/ri';
import styles from './EvalMenu.module.css';

export type EvalView = 'menu' | 'matching' | 'recent' | 'scenarios' | 'custom';

// The ways to evaluate. Generic, reusable entries - copy is the only per-entry
// content, and the names double as the back-header titles. Matching emails leads:
// it is the only type that tests the skill against mail it would really fire on.
export const EVAL_ENTRIES: { id: Exclude<EvalView, 'menu'>; title: string; sub: string }[] = [
  { id: 'matching', title: 'Matching emails', sub: 'Real emails your trigger would fire on' },
  { id: 'recent', title: 'Recent conversations', sub: 'Recent emails from your shared inbox' },
  { id: 'scenarios', title: 'AI scenarios', sub: 'Tailor-made AI test scenarios' },
  { id: 'custom', title: 'Custom email', sub: 'Write your own test email' },
];

// Back-header titles for each flow (sentence case throughout).
export const EVAL_TITLES: Record<Exclude<EvalView, 'menu'>, string> = {
  matching: 'Matching emails',
  recent: 'Recent conversations',
  scenarios: 'AI scenarios',
  custom: 'Custom email',
};

// One icon per flow - shared by the entry card and the flow's back-header so the
// two always match (Figma 1721:67361: time-line / mail-ai-line / hashtag).
export const EVAL_ICONS: Record<Exclude<EvalView, 'menu'>, ReactNode> = {
  matching: <RiSearchEyeLine />,
  recent: <RiTimeLine />,
  scenarios: <RiMailAiLine />,
  custom: <RiHashtag />,
};

interface Props {
  onOpen: (view: Exclude<EvalView, 'menu'>) => void;
  /** Matched-email count once a scan has settled - replaces that card's subtitle. */
  matchCount?: number | null;
  /** Where the scan looked, for the matched subtitle ("6 in Support"). */
  matchMailbox?: string;
  /** True until the user has opened Matching emails once (the New pill). */
  matchIsNew?: boolean;
}

/**
 * EvalMenu - the Evaluate root (Figma 1721:67361): "Evaluate your skill in one of
 * these ways" over the entry cards. Each card carries its icon, title and
 * subtitle; opening one enters its flow (the tabs stay pinned above). The
 * Matching emails card also carries what the scan found, so the offer is on the
 * card itself rather than in a banner.
 */
export default function EvalMenu({ onOpen, matchCount, matchMailbox, matchIsNew }: Props) {
  const matchedSub =
    matchCount != null && matchCount > 0
      ? `${matchCount} ${matchCount === 1 ? 'email matches' : 'emails match'} your trigger${
          matchMailbox ? ` in ${matchMailbox}` : ''
        }`
      : null;

  return (
    <div className={styles.menu}>
      <h3 className={styles.heading}>Evaluate your skill in one of these ways</h3>
      <div className={styles.cards}>
        {EVAL_ENTRIES.map((e) => {
          const sub = e.id === 'matching' && matchedSub ? matchedSub : e.sub;
          const highlight = e.id === 'matching' && matchedSub != null;
          return (
            <button
              key={e.id}
              type="button"
              className={styles.card}
              data-highlight={highlight || undefined}
              onClick={() => onOpen(e.id)}
            >
              <span className={styles.text}>
                <span className={styles.icon} aria-hidden>
                  {EVAL_ICONS[e.id]}
                </span>
                <span className={styles.titleSub}>
                  <span className={styles.title}>
                    {e.title}
                    {e.id === 'matching' && matchIsNew && <span className={styles.new}>New</span>}
                  </span>
                  <span className={styles.sub}>{sub}</span>
                </span>
              </span>
              <RiArrowRightSLine className={styles.chevron} aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}
