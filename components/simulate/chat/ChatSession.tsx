'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { RiInformationLine, RiStarFill, RiStarLine, RiStopCircleLine } from 'react-icons/ri';
import Spinner from '@/components/atoms/Spinner';
import type { EditorDoc } from '@/components/flow01/doc';
import { AiNote } from '@/components/flow01/copilot/CopilotPanel';
import type { TurnOutcome } from '@/lib/eval/wire';
import flowStyles from '../RecentEmails.module.css';
import ChatComposer, { AttachmentList } from './ChatComposer';
import LiveTrace from './LiveTrace';
import { type AgentItem, type ChatRun, type RatingItem } from './useChatRun';
import { chatResultLine } from './chatFlow';
import styles from './ChatSession.module.css';

// What the playground says when a message did not go as the skill intends.
// One line each, chat-worded.
const NOTICE = {
  noBranch: 'No branch matched this message. Add an ELSE branch to cover chats like it.',
  noReply: "Nothing on the skill's path replied, so the customer is left waiting.",
};

const RESULT: Record<TurnOutcome, string> = {
  passed: 'Passed',
  attention: 'Needs attention',
  errored: 'Errored',
};

interface Props {
  run: ChatRun;
  doc: EditorDoc;
  /** Who the customer is, shown over their first message. */
  customerName: string;
  /** manual = the user writes as the customer; auto = the AI customer does. */
  mode: 'manual' | 'auto';
  /** The live model's state, for the note under the composer. */
  live?: ComponentProps<typeof AiNote>['live'];
  onOpenCopilot?: () => void;
  /** What an empty manual chat says before the first message. */
  emptyHint?: string;
}

/** A line across the thread with a label in it, for something that happened
 *  rather than something anyone said: the skill starting, the chat ending. */
function Divider({ children, tone }: { children: ReactNode; tone?: 'warn' }) {
  return (
    <p className={styles.divider} data-tone={tone}>
      <span className={styles.dividerLabel}>{children}</span>
    </p>
  );
}

function Notice({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <p className={styles.notice}>
      <RiInformationLine className={styles.noticeIcon} aria-hidden />
      <span>
        {children}
        {action && <> {action}</>}
      </span>
    </p>
  );
}

function Stars({ score }: { score: number }) {
  return (
    <span className={styles.stars} aria-label={`${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (n <= score ? <RiStarFill key={n} aria-hidden /> : <RiStarLine key={n} aria-hidden />))}
    </span>
  );
}

function AgentTurn({
  item,
  doc,
  onRetry,
  onOpenCopilot,
  onScripted,
}: {
  item: AgentItem;
  doc: EditorDoc;
  onRetry: (scripted?: boolean) => void;
  onOpenCopilot?: () => void;
  /** Switch this browser to the scripted replies (the out-of-credits fix). */
  onScripted?: () => void;
}) {
  const t = item.turn;

  // The skill does not fit this chat: that is an event in the chat, not a
  // message from anyone.
  if (item.status === 'done' && t?.stage === 'noMatch') {
    return (
      <div data-item={item.id}>
        <Divider tone="warn">
          <strong>The skill did not run.</strong> {t.note ?? 'This chat is not what the trigger describes.'}
        </Divider>
      </div>
    );
  }

  const fix = onOpenCopilot ? (
    <button type="button" className={styles.link} onClick={onOpenCopilot}>
      Fix with Copilot
    </button>
  ) : undefined;

  return (
    <div className={styles.agentBlock} data-item={item.id}>
      {item.firstRun && (
        <Divider>
          Skill started <span className={styles.sep}>&middot;</span> <strong>{doc.title.trim() || 'Untitled skill'}</strong>
        </Divider>
      )}
      <div className={styles.agent}>
        {item.status === 'running' ? (
          <span className={styles.working} aria-label="The agent is typing">
            Working on a reply...
          </span>
        ) : item.status === 'error' || !t ? (
          <Notice
            action={
              item.quota && onScripted ? (
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => {
                    onScripted();
                    onRetry(true);
                  }}
                >
                  Use scripted replies
                </button>
              ) : (
                <button type="button" className={styles.link} onClick={() => onRetry()}>
                  Retry
                </button>
              )
            }
          >
            {item.error ?? 'The model could not be reached.'}
          </Notice>
        ) : (
          <>
            {t.reply ? <p className={styles.agentText}>{t.reply}</p> : null}
            {t.reason === 'noReply' && <Notice action={fix}>{NOTICE.noReply}</Notice>}
            {t.reason === 'noBranch' && <Notice action={fix}>{NOTICE.noBranch}</Notice>}
            <LiveTrace doc={doc} turn={t} />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Verdict - the answer to "did it work?", pinned under the header once the
 * chat ends (verdict first: the thread below is the evidence). The result, the
 * review's reason clamped to two lines, and the customer's rating.
 */
function Verdict({ run, who }: { run: ChatRun; who: string }) {
  const [more, setMore] = useState(false);
  const [clamped, setClamped] = useState(false);
  const reasonRef = useRef<HTMLParagraphElement>(null);
  const reason = chatResultLine(run);
  const rating = run.items.find((i): i is RatingItem => i.kind === 'rating');

  // Offer "Show more" only when the reason is actually cut off.
  useLayoutEffect(() => {
    const el = reasonRef.current;
    if (!el || more) return;
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [reason, more, run.phase]);

  if (run.phase === 'judging') {
    return (
      <div className={styles.verdict} data-state="busy">
        <p className={styles.busy}>
          <Spinner size={12} />
          <span>Reviewing the conversation...</span>
        </p>
      </div>
    );
  }
  const outcome = run.outcome;
  return (
    <div className={styles.verdict} data-outcome={outcome ?? 'none'}>
      {outcome && (
        <p className={styles.verdictHead}>
          <span className={styles.dot} aria-hidden />
          {RESULT[outcome]}
        </p>
      )}
      <p ref={reasonRef} className={styles.reason} data-clamp={!more || undefined}>
        {reason}
      </p>
      {(clamped || more) && (
        <button type="button" className={styles.more} onClick={() => setMore((m) => !m)} aria-expanded={more}>
          {more ? 'Show less' : 'Show more'}
        </button>
      )}
      {rating && (
        <p className={styles.rating}>
          <Stars score={rating.score} />
          <span>
            {who} rated it {rating.score} of 5
            {rating.comment && <> &middot; &ldquo;{rating.comment}&rdquo;</>}
          </span>
        </p>
      )}
    </div>
  );
}

/**
 * ChatSession - one playground chat. The customer writes in dark bubbles on
 * the right, as in the chat widget; the AI agent writes on the page, with
 * "AI agent · N steps" under each reply opening what the skill did in place.
 * The skill starting and the chat ending are labelled lines across the
 * thread, and the result is pinned at the top once the chat is over. Shared
 * by Past chats, AI scenarios and Chat as a customer.
 */
export default function ChatSession({ run, doc, customerName, mode, live, onOpenCopilot, emptyHint }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { items, phase, capped } = run;
  const ended = phase === 'ended';
  const judging = phase === 'judging';
  const started = items.length > 0;
  const who = customerName.split(' · ')[0] ?? customerName;

  // Keep the newest turn in view. A tall finished agent turn is brought in by
  // its top, so the reply is what shows first.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior = reduce ? 'auto' : 'smooth';
    const last = items[items.length - 1];
    if (last?.kind === 'agent' && last.status !== 'running' && !ended) {
      const node = el.querySelector<HTMLElement>(`[data-item="${last.id}"]`);
      if (node && node.offsetHeight > el.clientHeight * 0.6) {
        el.scrollTo({ top: Math.max(0, node.offsetTop - 12), behavior });
        return;
      }
    }
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, [items, phase, ended]);

  const firstCustomerId = items.find((i) => i.kind === 'customer')?.id;

  return (
    <div className={styles.session} data-pinned={((ended || judging) && started) || undefined}>
      {(ended || judging) && started && <Verdict run={run} who={who} />}

      <div className={styles.thread} ref={scrollRef} role="log" aria-live="polite" aria-relevant="additions">
        {!started && mode === 'manual' && emptyHint && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>{emptyHint}</p>
          </div>
        )}

        {items.map((it, i) => {
          const prev = items[i - 1];
          if (it.kind === 'rating') return null; // it sits in the pinned result
          if (it.kind === 'customer') {
            return (
              <div
                key={it.id}
                className={styles.customer}
                data-item={it.id}
                data-grouped={prev?.kind === 'customer' || undefined}
              >
                {it.id === firstCustomerId && <span className={styles.author}>{customerName}</span>}
                {it.attachments && it.attachments.length > 0 && <AttachmentList files={it.attachments} />}
                {it.text && <div className={styles.bubbleCustomer}>{it.text}</div>}
              </div>
            );
          }
          return (
            <AgentTurn
              key={it.id}
              item={it}
              doc={doc}
              onRetry={(scripted) => void run.retry(it.id, scripted)}
              onOpenCopilot={onOpenCopilot}
              onScripted={live?.onLock}
            />
          );
        })}

        {phase === 'customer' && (
          <div className={styles.customer} aria-label="The customer is typing">
            <div className={`${styles.bubbleCustomer} ${styles.typing}`}>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {capped && (ended || judging) && (
          <p className={styles.event}>The chat reached 8 customer messages without wrapping up, so it was stopped there.</p>
        )}

        {(ended || judging) && started && <Divider>Chat ended</Divider>}
      </div>

      {mode === 'manual' && !ended && !judging && <ChatComposer run={run} live={live} />}

      {mode === 'auto' && started && !ended && !judging && (
        <div className={flowStyles.footer}>
          <button type="button" className={flowStyles.stopBtn} onClick={run.end}>
            <RiStopCircleLine aria-hidden />
            <span>Stop evaluation</span>
          </button>
        </div>
      )}

      {mode === 'auto' && (
        <div className={styles.autoNote}>
          <AiNote live={live} />
        </div>
      )}
    </div>
  );
}
