'use client';

import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { RiArrowUpLine, RiRestartLine, RiSparkling2Line, RiStopCircleLine } from 'react-icons/ri';
import { SparkleIcon } from '@/components/icons/ui';
import type { EditorDoc } from '@/components/flow01/doc';
import { AiNote } from '@/components/flow01/copilot/CopilotPanel';
import copilot from '@/components/flow01/copilot/CopilotPanel.module.css';
import type { OutcomeReason } from '@/lib/eval/wire';
import StatusPill from '../StatusPill';
import outcomeStyles from '../RunOutcome.module.css';
import flowStyles from '../RecentEmails.module.css';
import LiveTrace from './LiveTrace';
import { itemOutcome, type ChatItem, type ChatRun } from './useChatRun';
import styles from './ChatSession.module.css';

type SkillItem = Extract<ChatItem, { kind: 'skill' }>;

// One line under a turn that did not simply pass. Chat-worded on purpose: the
// email flows' copy says "email".
const REASON: Record<Exclude<OutcomeReason, 'ok' | 'gated' | 'draft'>, string> = {
  trigger: 'This chat is not what the trigger describes, so the skill would not run on it.',
  noBranch: 'This chat did not match any branch in the skill. Add an ELSE branch to handle chats like it.',
  noReply: "Nothing on the skill's path replied to this message, so the customer would be left waiting.",
  failedStep: 'A step could not run.',
  invalid: 'The steps that came back did not match the skill, so this turn is not trusted.',
};

const HELD: Record<'gated' | 'draft', string> = {
  gated: "An action in this skill needs a teammate's approval, so this reply waits for one.",
  draft: 'The skill drafts its replies, so on chat a teammate sends this one.',
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
  /** Start this evaluation over from the top. */
  onRedo: () => void;
  onOpenCopilot?: () => void;
  /** What an empty manual chat says before the first message. */
  emptyHint?: string;
}

function SkillTurn({
  anchor,
  item,
  doc,
  mode,
  busy,
  ended,
  onDecide,
  onRetry,
  onOpenCopilot,
}: {
  anchor: string;
  item: SkillItem;
  doc: EditorDoc;
  mode: 'manual' | 'auto';
  busy: boolean;
  /** The chat is over: a held reply can no longer be sent. */
  ended: boolean;
  onDecide: (d: 'sent' | 'declined') => void;
  onRetry: () => void;
  onOpenCopilot?: () => void;
}) {
  const name = doc.title.trim() || 'Skill';
  const head = (
    <div className={styles.skillHead}>
      <SparkleIcon className={styles.skillMark} aria-hidden />
      <span className={styles.skillName}>{name}</span>
    </div>
  );

  if (item.status === 'running') {
    return (
      <div className={styles.skill} data-item={anchor}>
        {head}
        <div className={styles.pillRow}>
          <StatusPill status="running" />
        </div>
      </div>
    );
  }

  if (item.status === 'error' || !item.turn) {
    return (
      <div className={styles.skill} data-item={anchor}>
        {head}
        <div className={outcomeStyles.outcome}>
          <StatusPill status="errored" />
          <div className={outcomeStyles.box}>
            <p className={outcomeStyles.boxText}>{item.error ?? 'Something went wrong, please retry the evaluation.'}</p>
          </div>
          <button type="button" className={outcomeStyles.strokeBtn} onClick={onRetry} disabled={busy}>
            <RiRestartLine aria-hidden />
            <span>Retry this turn</span>
          </button>
        </div>
      </div>
    );
  }

  const t = item.turn;
  const outcome = itemOutcome(item);
  const failedError = t.steps.find((s) => s.status === 'failed')?.error;
  const reasonLine =
    t.reason === 'failedStep'
      ? (failedError ?? REASON.failedStep)
      : t.reason === 'invalid'
        ? `${REASON.invalid}${t.problems[0] ? ` It named ${t.problems[0]}.` : ''}`
        : t.reason === 'ok' || t.reason === 'gated' || t.reason === 'draft'
          ? null
          : REASON[t.reason];
  // A held reply waits for a decision while the chat is open; once it ends,
  // the reply simply was not sent.
  const heldOpen = t.held && !item.decision && !item.autoDelivered;
  const canDecide = heldOpen && !ended;

  return (
    <div className={styles.skill} data-item={anchor}>
      {head}

      {t.reply &&
        (heldOpen ? (
          <div className={outcomeStyles.outcome}>
            <StatusPill status="approval" />
            <div className={styles.held}>
              <p className={styles.heldNote}>
                {canDecide ? HELD[t.heldBy ?? 'draft'] : 'Held for a teammate. The chat ended before anyone sent it.'}
              </p>
              <p className={styles.replyText}>{t.reply}</p>
              {canDecide && (
                <div className={outcomeStyles.approvalRow}>
                  <button type="button" className={outcomeStyles.primaryBtn} onClick={() => onDecide('sent')}>
                    Send reply
                  </button>
                  <button type="button" className={outcomeStyles.tertiaryBtn} onClick={() => onDecide('declined')}>
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : item.decision === 'declined' ? (
          <div className={styles.declined}>
            <p className={styles.declinedNote}>Reply declined. The customer did not see it.</p>
            <p className={styles.declinedText}>{t.reply}</p>
          </div>
        ) : (
          <div className={styles.replyWrap}>
            <p className={styles.replyText}>{t.reply}</p>
            {t.held && (
              <p className={styles.replyMeta}>
                {item.decision === 'sent'
                  ? 'Sent by you, as the teammate'
                  : 'Held for a teammate - delivered here so the test can go on'}
              </p>
            )}
          </div>
        ))}

      {outcome && outcome !== 'passed' && !(outcome === 'approval' && heldOpen) && (
        <div className={outcomeStyles.outcome}>
          <StatusPill status={outcome} />
          {reasonLine && (
            <div className={outcomeStyles.box}>
              <p className={outcomeStyles.boxText}>{reasonLine}</p>
            </div>
          )}
          {/* Only a turn that can come out differently gets a retry: a
              connector that needs fixing fails the same way again. */}
          {t.reason === 'invalid' && mode === 'manual' && !ended && (
            <button type="button" className={outcomeStyles.strokeBtn} onClick={onRetry} disabled={busy}>
              <RiRestartLine aria-hidden />
              <span>Retry this turn</span>
            </button>
          )}
          {(t.reason === 'noBranch' || t.reason === 'noReply') && onOpenCopilot && (
            <button type="button" className={outcomeStyles.strokeBtn} onClick={onOpenCopilot}>
              <RiSparkling2Line className={outcomeStyles.sparkle} aria-hidden />
              <span>Fix with Copilot</span>
            </button>
          )}
        </div>
      )}

      <LiveTrace doc={doc} turn={t} />
    </div>
  );
}

/**
 * ChatSession - one chat evaluation as a conversation: the customer on the
 * right (as in Copilot, the person typing), the skill on the left with its
 * outcome and trace under each turn, then a composer while the user plays the
 * customer. Shared by Past chats, AI scenarios and Chat as a customer.
 */
export default function ChatSession({ run, doc, customerName, mode, live, onRedo, onOpenCopilot, emptyHint }: Props) {
  const [value, setValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { items, phase, busy, engine, outcome } = run;
  const ended = phase === 'ended';
  const started = items.length > 0;
  const skillTurns = items.filter((i) => i.kind === 'skill').length;

  // Keep the newest turn in view as the chat grows. A finished skill turn can
  // be taller than the pane, so it is brought in by its TOP - the reply is
  // what to read first, not the end of its trace.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior = reduce ? 'auto' : 'smooth';
    const last = items[items.length - 1];
    if (last?.kind === 'skill' && last.status !== 'running' && phase !== 'ended') {
      const node = el.querySelector<HTMLElement>(`[data-item="${last.id}"]`);
      if (node) {
        el.scrollTo({ top: Math.max(0, node.offsetTop - 12), behavior });
        return;
      }
    }
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, [items, phase]);

  useEffect(() => {
    if (mode === 'manual' && !busy && !ended) inputRef.current?.focus({ preventScroll: true });
  }, [mode, busy, ended]);

  const submit = () => {
    const t = value.trim();
    if (!t || busy || ended) return;
    void run.send(t);
    setValue('');
  };

  const firstCustomerId = items.find((i) => i.kind === 'customer')?.id;

  return (
    <div className={styles.session}>
      <div className={styles.scroll} ref={scrollRef} role="log" aria-live="polite" aria-relevant="additions">
        {!started && mode === 'manual' && emptyHint && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>{emptyHint}</p>
          </div>
        )}

        {items.map((it) => {
          if (it.kind === 'customer') {
            const showName = it.id === firstCustomerId;
            return (
              <div key={it.id} className={styles.customer} data-item={it.id}>
                {showName && <span className={styles.customerName}>{customerName}</span>}
                <div className={copilot.bubbleUser}>{it.text}</div>
              </div>
            );
          }
          return (
            <SkillTurn
              key={it.id}
              anchor={it.id}
              item={it}
              doc={doc}
              mode={mode}
              busy={busy}
              ended={ended}
              onDecide={(d) => run.decide(it.id, d)}
              onRetry={() => void run.retry(it.id)}
              onOpenCopilot={onOpenCopilot}
            />
          );
        })}

        {phase === 'customer' && (
          <div className={styles.customer} aria-label="The customer is typing">
            <div className={`${copilot.bubbleUser} ${styles.typing}`}>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {ended && skillTurns > 0 && (
          <div className={styles.summary}>
            <div className={styles.summaryHead}>
              <span className={styles.summaryTitle}>Conversation ended</span>
              {outcome && <StatusPill status={outcome} />}
            </div>
            <p className={styles.summaryMeta}>
              {skillTurns} {skillTurns === 1 ? 'turn' : 'turns'} &middot;{' '}
              {engine === 'live' ? 'Live AI' : 'Scripted demo replies'}
            </p>
            <button type="button" className={outcomeStyles.strokeBtn} onClick={onRedo}>
              <RiRestartLine aria-hidden />
              <span>Redo evaluation</span>
            </button>
          </div>
        )}
      </div>

      {mode === 'manual' && !ended && (
        <div className={styles.composerWrap}>
          <div className={copilot.composer}>
            <textarea
              ref={inputRef}
              className={copilot.input}
              rows={1}
              value={value}
              placeholder={started ? 'Reply as the customer...' : 'Write as the customer...'}
              aria-label="Message as the customer"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <div className={copilot.composerRow}>
              <span aria-hidden />
              <button
                type="button"
                className={copilot.send}
                aria-label="Send as the customer"
                data-ready={(!busy && value.trim().length > 0) || undefined}
                disabled={busy || value.trim().length === 0}
                onClick={submit}
              >
                <RiArrowUpLine />
              </button>
            </div>
          </div>
          <AiNote live={live} />
        </div>
      )}

      {/* The AI customer runs on its own, so it gets a real Stop. A manual chat
          ends from the header (End chat), which keeps the composer close to
          the conversation. */}
      {mode === 'auto' && started && !ended && (
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
