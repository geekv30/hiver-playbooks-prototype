'use client';

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import {
  RiArrowUpLine,
  RiFlashlightLine,
  RiInformationLine,
  RiStarFill,
  RiStarLine,
  RiStopCircleLine,
} from 'react-icons/ri';
import Spinner from '@/components/atoms/Spinner';
import { SparkleIcon } from '@/components/icons/ui';
import type { EditorDoc } from '@/components/flow01/doc';
import { AiNote } from '@/components/flow01/copilot/CopilotPanel';
import type { TurnOutcome } from '@/lib/eval/wire';
import flowStyles from '../RecentEmails.module.css';
import LiveTrace from './LiveTrace';
import { itemOutcome, type AgentItem, type ChatRun, type RatingItem } from './useChatRun';
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

/** A centred line in the thread for something that happened, not something
 *  anyone said (the skill starting, the skill not fitting). */
function Event({ icon, children, tone }: { icon?: ReactNode; children: ReactNode; tone?: 'warn' }) {
  return (
    <p className={styles.event} data-tone={tone}>
      {icon && (
        <span className={styles.eventIcon} aria-hidden>
          {icon}
        </span>
      )}
      {children}
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

function AgentTurn({
  item,
  doc,
  showName,
  onRetry,
  onOpenCopilot,
  onScripted,
}: {
  item: AgentItem;
  doc: EditorDoc;
  showName: boolean;
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
        <Event icon={<RiInformationLine />} tone="warn">
          <strong>The skill did not run.</strong> {t.note ?? 'This chat is not what the trigger describes.'}
        </Event>
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
        <Event icon={<RiFlashlightLine />}>
          Skill started <span className={styles.eventSep}>&middot;</span>{' '}
          <strong>{doc.title.trim() || 'Untitled skill'}</strong>
        </Event>
      )}
      <div className={styles.agent}>
        <span className={styles.avatar} aria-hidden>
          <SparkleIcon />
        </span>
        <div className={styles.agentCol}>
          {showName && <span className={styles.author}>AI agent</span>}

          {item.status === 'running' ? (
            <div className={`${styles.bubbleAgent} ${styles.typing}`} aria-label="The agent is typing">
              <span />
              <span />
              <span />
            </div>
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
              {t.reply ? <div className={styles.bubbleAgent}>{t.reply}</div> : null}
              {t.reason === 'noReply' && <Notice action={fix}>{NOTICE.noReply}</Notice>}
              {t.reason === 'noBranch' && <Notice action={fix}>{NOTICE.noBranch}</Notice>}
              <LiveTrace doc={doc} turn={t} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** The customer's rating, as the widget collects it at the end of a chat. */
function Rating({ item, who }: { item: RatingItem; who: string }) {
  return (
    <div className={styles.rating} data-item={item.id}>
      <p className={styles.ratingHead}>
        <span className={styles.stars} aria-hidden>
          {[1, 2, 3, 4, 5].map((n) => (n <= item.score ? <RiStarFill key={n} /> : <RiStarLine key={n} />))}
        </span>
        <span>
          <strong>{who}</strong> rated the chat {item.score} out of 5
        </span>
      </p>
      {item.comment && <p className={styles.ratingComment}>&ldquo;{item.comment}&rdquo;</p>}
    </div>
  );
}

/**
 * ChatSession - one playground chat, laid out like the chat widget it
 * simulates: the customer on the right in the brand color, the AI agent on
 * the left in grey with its avatar and name, and what the skill did behind
 * "View steps" under each reply. Events (the skill starting or not fitting)
 * are centred lines. Shared by Past chats, AI scenarios and Chat as a customer.
 */
export default function ChatSession({ run, doc, customerName, mode, live, onOpenCopilot, emptyHint }: Props) {
  const [value, setValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { items, phase, busy, outcome, verdict, capped } = run;
  const ended = phase === 'ended';
  const judging = phase === 'judging';
  const started = items.length > 0;

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

  useEffect(() => {
    if (mode === 'manual' && !busy && !ended) inputRef.current?.focus({ preventScroll: true });
  }, [mode, busy, ended]);

  // Auto-grow the composer to four lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
  }, [value]);

  const submit = () => {
    const t = value.trim();
    if (!t || busy || ended) return;
    void run.send(t);
    setValue('');
  };

  const firstCustomerId = items.find((i) => i.kind === 'customer')?.id;
  const flagged = items.filter((i): i is AgentItem => i.kind === 'agent' && itemOutcome(i) === 'attention').length;
  const skillRan = items.some((i) => i.kind === 'agent' && i.turn?.stage === 'run');
  // The review's own words when there is one: whether the customer was
  // actually helped, not just whether every message got a reply.
  // A turn that needed attention leads the line, so the reason always
  // matches the label; the review's sentence follows it.
  const turnLine = flagged > 0 ? `${flagged} ${flagged === 1 ? 'message needs' : 'messages need'} a look.` : '';
  const resultLine =
    outcome === 'errored'
      ? 'The evaluation could not finish. Start over to try again.'
      : verdict
        ? verdict.verdict !== 'unresolved' && turnLine
          ? `${turnLine} ${verdict.reason}`
          : verdict.reason
        : !skillRan
          ? 'The skill never started: the customer did not say what they needed.'
          : outcome === 'attention'
            ? `${flagged} ${flagged === 1 ? 'message needs' : 'messages need'} a look.`
            : run.engine === 'scripted'
              ? 'Every message got a reply. Scripted replies are not reviewed for quality.'
              : 'Every message got a reply.';

  return (
    <div className={styles.session}>
      <div className={styles.thread} ref={scrollRef} role="log" aria-live="polite" aria-relevant="additions">
        {!started && mode === 'manual' && emptyHint && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>{emptyHint}</p>
          </div>
        )}

        {items.map((it, i) => {
          const prev = items[i - 1];
          if (it.kind === 'rating') {
            return <Rating key={it.id} item={it} who={customerName.split(' \u00b7 ')[0] ?? customerName} />;
          }
          if (it.kind === 'customer') {
            return (
              <div
                key={it.id}
                className={styles.customer}
                data-item={it.id}
                data-grouped={prev?.kind === 'customer' || undefined}
              >
                {it.id === firstCustomerId && <span className={styles.author}>{customerName}</span>}
                <div className={styles.bubbleCustomer}>{it.text}</div>
              </div>
            );
          }
          // The agent's name heads each run of its messages, as in the widget.
          const showName = !(prev?.kind === 'agent' && prev.turn?.stage !== 'noMatch');
          if (it.kind !== 'agent') return null;
          return (
            <AgentTurn
              key={it.id}
              item={it}
              doc={doc}
              showName={showName}
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

        {(ended || judging) && started && (
          <div className={styles.end}>
            <div className={styles.endRule}>
              <span>Chat ended</span>
            </div>
            {judging ? (
              <p className={styles.result}>
                <Spinner size={12} />
                <span>Reviewing the conversation...</span>
              </p>
            ) : (
            <p className={styles.result} data-outcome={outcome ?? 'none'}>
              {outcome && <span className={styles.resultDot} aria-hidden />}
              {outcome && <strong>{RESULT[outcome]}</strong>}
              {outcome && <span className={styles.eventSep}>&middot;</span>}
              <span>{resultLine}</span>
            </p>
            )}
          </div>
        )}
      </div>

      {mode === 'manual' && !ended && !judging && (
        <div className={styles.composerWrap}>
          <div className={styles.composer}>
            <textarea
              ref={inputRef}
              className={styles.input}
              rows={1}
              value={value}
              placeholder="Message as the customer..."
              aria-label="Message as the customer"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button
              type="button"
              className={styles.send}
              aria-label="Send as the customer"
              data-ready={(!busy && value.trim().length > 0) || undefined}
              disabled={busy || value.trim().length === 0}
              onClick={submit}
            >
              <RiArrowUpLine />
            </button>
          </div>
          <AiNote live={live} />
        </div>
      )}

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
