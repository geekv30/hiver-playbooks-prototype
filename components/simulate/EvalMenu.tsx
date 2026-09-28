'use client';

import type { ReactNode } from 'react';
import {
  RiArrowRightSLine,
  RiTimeLine,
  RiMailAiLine,
  RiHashtag,
  RiChatHistoryLine,
  RiChatSmileAiLine,
  RiUserVoiceLine,
} from 'react-icons/ri';
import { SearchAiIcon } from '@/components/icons/ui';
import NewTag from '@/components/atoms/NewTag';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import styles from './EvalMenu.module.css';

export type EvalView = 'menu' | 'matching' | 'recent' | 'scenarios' | 'custom' | ChatEvalView;

/** The channel a skill is being evaluated on. A skill runs on both. */
export type EvalChannel = 'email' | 'chat';

// The ways to evaluate. Generic, reusable entries - copy is the only per-entry
// content, and the names double as the back-header titles. Matching emails leads:
// it is the only type that tests the skill against mail it would really fire on.
export const EVAL_ENTRIES: { id: EmailEvalView; title: string; sub: string }[] = [
  { id: 'matching', title: 'Matching emails', sub: 'Real emails your trigger would fire on' },
  { id: 'recent', title: 'Recent conversations', sub: 'Recent emails from your shared inbox' },
  { id: 'scenarios', title: 'AI scenarios', sub: 'Tailor-made AI test scenarios' },
  { id: 'custom', title: 'Custom email', sub: 'Write your own test email' },
];

// Back-header titles for each flow (sentence case throughout).
export type EmailEvalView = 'matching' | 'recent' | 'scenarios' | 'custom';

export const EVAL_TITLES: Record<EmailEvalView, string> = {
  matching: 'Matching emails',
  recent: 'Recent conversations',
  scenarios: 'AI scenarios',
  custom: 'Custom email',
};

// One icon per flow - shared by the entry card and the flow's back-header so the
// two always match (Figma 1721:67361: time-line / mail-ai-line / hashtag).
export const EVAL_ICONS: Record<EmailEvalView, ReactNode> = {
  matching: <SearchAiIcon />,
  recent: <RiTimeLine />,
  scenarios: <RiMailAiLine />,
  custom: <RiHashtag />,
};

// The chat ways to evaluate. A skill is written once and runs on email and on
// chat, so the channel belongs to the test, not to the skill: the menu's
// Email | Chat switch picks which set of cards it shows.
export type ChatEvalView = 'pastChats' | 'chatScenarios' | 'chatLive';

export const CHAT_EVAL_ENTRIES: { id: ChatEvalView; title: string; sub: string }[] = [
  { id: 'pastChats', title: 'Past chats', sub: 'Real chats from your chat inbox' },
  { id: 'chatScenarios', title: 'AI scenarios', sub: 'AI plays the customer, start to finish' },
  { id: 'chatLive', title: 'Chat as a customer', sub: 'You play the customer, live' },
];

export const CHAT_EVAL_ICONS: Record<ChatEvalView, ReactNode> = {
  pastChats: <RiChatHistoryLine />,
  chatScenarios: <RiChatSmileAiLine />,
  chatLive: <RiUserVoiceLine />,
};

interface CardProps {
  icon: ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
  /** The one-time NEW tag beside the chevron. */
  isNew?: boolean;
  /** A fresh result: the card breathes its fill, then settles. */
  fresh?: boolean;
}

/** One entry card (Figma 1721:67654): icon on top, title + sub, chevron right.
 *  The one renderer for every way to evaluate, on either channel. */
export function EvalCard({ icon, title, sub, onClick, isNew, fresh }: CardProps) {
  return (
    <button type="button" className={styles.card} data-fresh={fresh || undefined} onClick={onClick}>
      <span className={styles.text}>
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
        <span className={styles.titleSub}>
          <span className={styles.title}>{title}</span>
          <span className={styles.sub}>{sub}</span>
        </span>
      </span>
      {isNew && <NewTag />}
      <RiArrowRightSLine className={styles.chevron} aria-hidden />
    </button>
  );
}

/** The menu's layout pieces, so a composition of cards spaces them as the menu does. */
export const evalMenuStyles = styles;

const CHANNEL_TABS: { id: EvalChannel; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'chat', label: 'Chat' },
];

interface Props {
  onOpen: (view: Exclude<EvalView, 'menu'>) => void;
  /** Which channel's ways the menu shows. */
  channel: EvalChannel;
  onChannel: (c: EvalChannel) => void;
  /** True while a fresh scan result is still news: the card carries a fill for
   *  that window and then settles back to plain (Figma 3344:20223 / 3345:28443). */
  matchFresh?: boolean;
  /** True until the user has opened Matching emails once (the NEW tag). */
  matchIsNew?: boolean;
}

/**
 * EvalMenu - the Evaluate root (Figma 1721:67361): "Evaluate your skill in one of
 * these ways" over the entry cards. Each card carries its icon, title and
 * subtitle; opening one enters its flow (the tabs stay pinned above).
 *
 * The Matching emails card says the same thing whatever the scan found - the
 * count is Copilot's row to report. What the scan changes here is temporary: a
 * fill while the result is still news, then plain again.
 */
export default function EvalMenu({ onOpen, channel, onChannel, matchFresh, matchIsNew }: Props) {
  return (
    <div className={styles.menu}>
      <h3 className={styles.heading}>Evaluate your skill in one of these ways</h3>
      <SegmentedControl tabs={CHANNEL_TABS} active={channel} onChange={onChannel} ariaLabel="Channel to evaluate on" />
      <div className={styles.cards} key={channel} data-channel={channel}>
        {channel === 'email'
          ? EVAL_ENTRIES.map((e) => (
              <EvalCard
                key={e.id}
                icon={EVAL_ICONS[e.id]}
                title={e.title}
                sub={e.sub}
                onClick={() => onOpen(e.id)}
                isNew={e.id === 'matching' && matchIsNew}
                fresh={e.id === 'matching' && matchFresh}
              />
            ))
          : CHAT_EVAL_ENTRIES.map((e) => (
              <EvalCard key={e.id} icon={CHAT_EVAL_ICONS[e.id]} title={e.title} sub={e.sub} onClick={() => onOpen(e.id)} />
            ))}
      </div>
    </div>
  );
}
