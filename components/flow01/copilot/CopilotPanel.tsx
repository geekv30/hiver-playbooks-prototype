'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  RiCloseLine,
  RiAddLine,
  RiArrowUpLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiFileCopyLine,
  RiRefreshLine,
  RiStopFill,
  RiGitBranchLine,
  RiFlashlightLine,
  RiMailLine,
  RiShieldCheckLine,
  RiChatNewLine,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import Spinner from '@/components/atoms/Spinner';
import ThumbsRating, { type Verdict } from '@/components/atoms/ThumbsRating';
import CopilotSparkle from './CopilotSparkle';
import CopilotProposal, { type ProposalState } from './CopilotProposal';
import type { DocPatch } from '../doc';
import styles from './CopilotPanel.module.css';

// Generic starter chips (reusability rule: no case-specific content) - an icon +
// a short verb. Clicking one PREFILLS the composer with an editable prompt (the
// ChatGPT pattern), so nothing is sent without the user's consent.
const STARTERS: { label: string; prompt: string; icon: IconType }[] = [
  { label: 'Add a step', prompt: 'Add a step that ', icon: RiAddLine },
  {
    label: 'Add a condition',
    prompt: 'Add a condition that branches when ',
    icon: RiGitBranchLine,
  },
  { label: 'Refine the trigger', prompt: 'Refine the trigger so it ', icon: RiFlashlightLine },
  { label: 'Draft a reply', prompt: 'Draft a reply that ', icon: RiMailLine },
  { label: 'Make it foolproof', prompt: 'Make this AOP foolproof', icon: RiShieldCheckLine },
];

// Generic follow-up quick-replies shown under the latest settled reply - they
// keep the thread moving and surface the apply flow (the first two resolve to a
// proposal in EditorCanvas). Config-driven; no case-specific content.
const FOLLOWUPS = ['Make it foolproof', 'Add a fallback branch', 'Explain this step'];

/** A reviewable change the Copilot proposes; applied only on the user's consent. */
export interface CopilotProposalData {
  title: string;
  summary: string[];
  patch: DocPatch;
}

export interface CopilotMessage {
  role: 'user' | 'assistant';
  text: string;
  /** The labeled working steps (cold-start handoff + follow-up reasoning). */
  steps?: string[];
  stepIdx?: number;
  /** Live thinking phase: the working steps animate (driven by stepIdx). */
  thinking?: boolean;
  /** Stored reasoning - once thinking ends, the steps collapse into an expandable
   *  "Thought for Ns" above the reply (the ChatGPT reasoning pattern). */
  thought?: { ms: number };
  /** Follow-up: the assistant is thinking before its reply streams. */
  pending?: boolean;
  /** The assistant reply is still streaming in. */
  streaming?: boolean;
  /** A reviewable change the user can apply to the AOP. */
  proposal?: CopilotProposalData;
  /** Resolution of the proposal card (defaults to 'open' when a proposal exists). */
  proposalState?: ProposalState;
  /** The user's thumbs verdict on this reply. */
  verdict?: Verdict;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Rendered inside the docked SidePanel: drop the floating slot/header chrome
   *  (the SidePanel provides the card + the Copilot|Simulate tab header). */
  docked?: boolean;
  /** Controlled conversation (owned by EditorCanvas so cold-start can seed it). */
  messages: CopilotMessage[];
  /** Send a composer message. */
  onSend: (text: string) => void;
  /** Re-stream the most recent assistant reply. */
  onRegenerate?: () => void;
  /** Clear the conversation and start fresh (the "New chat" affordance). */
  onClear?: () => void;
  /** True once the composer is actually visible to the user (e.g. the cold-start
   *  modal has closed). Gates the ONE-SHOT brand-gradient border intro so it runs
   *  when the field is on screen, not hidden behind the modal. Defaults to true. */
  introReady?: boolean;
  /** Interrupt an in-flight reply or the cold-start build. */
  onStop: () => void;
  /** A reply is in flight - while busy the Send button becomes Stop. */
  busy?: boolean;
  /** The "+" attach affordance (no real upload in this prototype). */
  onAttach?: () => void;
  /** Apply / dismiss / undo a proposal (index = its message index). */
  onApplyProposal: (index: number) => void;
  onDismissProposal: (index: number) => void;
  onUndoProposal: (index: number) => void;
  /** Thumbs verdict on an assistant reply. */
  onVerdict: (index: number, v: Verdict) => void;
}

/** Copy-to-clipboard affordance on an assistant message (icon swaps to a check). */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* clipboard may be unavailable - the visual confirm still fires */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button
      type="button"
      className={styles.iconBtn}
      onClick={onCopy}
      aria-label={copied ? 'Copied' : 'Copy reply'}
      title={copied ? 'Copied' : 'Copy'}
    >
      <span className={styles.copyIco} data-copied={copied || undefined} aria-hidden>
        {copied ? <RiCheckLine /> : <RiFileCopyLine />}
      </span>
    </button>
  );
}

/**
 * The Copilot "thinking" affordance. While a reply is being prepared it shows a
 * live, animated working list; once the reasoning ends it collapses into a stored
 * "Thought for Ns" the user can expand to see what it worked through (the ChatGPT
 * reasoning pattern - the thought is not always open). The collapse uses the
 * transitions.dev card-resize technique (grid 0fr<->1fr) on our motion tokens.
 */
function ThinkingBlock({
  steps,
  stepIdx = 0,
  ms,
  live,
}: {
  steps: string[];
  stepIdx?: number;
  ms?: number;
  live?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (live) {
    return (
      <ul className={styles.thinking}>
        {steps.map((s, si) => {
          const state = si < stepIdx ? 'done' : si === stepIdx ? 'active' : 'pending';
          return (
            <li key={s} className={styles.thinkStep} data-state={state}>
              <span className={styles.thinkIco} aria-hidden>
                {state === 'done' ? (
                  <RiCheckLine />
                ) : state === 'active' ? (
                  <Spinner size={14} />
                ) : (
                  <span className={styles.thinkDot} />
                )}
              </span>
              <span className={styles.thinkLabel}>{s}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  const secs = Math.max(1, Math.round((ms ?? 0) / 1000));
  return (
    <div className={styles.thought}>
      <button
        type="button"
        className={styles.thoughtToggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <RiArrowRightSLine
          className={styles.thoughtCaret}
          data-open={open || undefined}
          aria-hidden
        />
        Thought for {secs}s
      </button>
      <div className={styles.thoughtBody} data-open={open || undefined}>
        <ul className={styles.thoughtSteps}>
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * The Copilot side panel - a ChatGPT-faithful chat. Empty state = a centered hero
 * (brand mark + greeting) + composer + starter chips. With a conversation: a
 * "New chat" affordance, right-aligned user pills, bubble-less full-width
 * assistant replies, a live "thinking" beat that collapses into a stored "Thought
 * for Ns", copy/regenerate/thumbs, reviewable apply cards, and follow-up chips.
 * The composer's Send turns into Stop while a reply is in flight.
 */
export default function CopilotPanel({
  open,
  onClose,
  docked,
  messages,
  onSend,
  onRegenerate,
  onClear,
  introReady = true,
  onStop,
  busy,
  onAttach,
  onApplyProposal,
  onDismissProposal,
  onUndoProposal,
  onVerdict,
}: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const convoRef = useRef<HTMLDivElement>(null);
  // One-shot brand-gradient border intro (see introReady).
  const [intro, setIntro] = useState(false);
  const introDone = useRef(false);

  const hasConvo = messages.length > 0;
  const lastAssistantIdx = messages.map((m) => m.role).lastIndexOf('assistant');

  // Keep the latest message / streamed text / applied result in view.
  useEffect(() => {
    if (convoRef.current) convoRef.current.scrollTop = convoRef.current.scrollHeight;
  }, [messages]);

  // Focus the composer when the panel opens (after the reveal).
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Auto-grow the composer up to its max-height, then scroll.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  // Run the brand-gradient border sweep ONCE, when the composer first becomes
  // visible (introReady) - not on every focus, and not while hidden behind the
  // cold-start modal. A short delay lets the modal-close + panel reveal settle.
  useEffect(() => {
    if (!open || !introReady || introDone.current) return;
    introDone.current = true;
    const t = window.setTimeout(() => setIntro(true), 340);
    return () => window.clearTimeout(t);
  }, [open, introReady]);

  // Clicking a starter chip prefills the composer (editable) and focuses it with
  // the caret at the end - the ChatGPT pattern: a suggestion seeds the prompt,
  // the user sends on consent (never auto-sent).
  const prefill = (text: string) => {
    setValue(text);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  };
  const submit = () => {
    const t = value.trim();
    if (!t || busy) return;
    onSend(t);
    setValue('');
  };

  // The composer is rendered ONCE and placed in two spots (the empty hero group
  // and the conversation) so the input element is byte-identical across states.
  const composer = (
    <div className={styles.composer} data-intro={intro || undefined}>
      <textarea
        ref={inputRef}
        className={styles.input}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask Copilot to build or change this AOP…"
        aria-label="Ask Copilot"
      />
      <div className={styles.composerRow}>
        <button type="button" className={styles.add} aria-label="Attach a file" onClick={onAttach}>
          <RiAddLine />
        </button>
        <button
          type="button"
          className={styles.send}
          aria-label={busy ? 'Stop generating' : 'Send'}
          data-ready={busy || value.trim().length > 0 || undefined}
          data-stop={busy || undefined}
          disabled={!busy && value.trim().length === 0}
          onClick={busy ? onStop : submit}
        >
          {busy ? <RiStopFill /> : <RiArrowUpLine />}
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.slot} data-open={open || undefined} data-docked={docked || undefined}>
      <aside
        className={styles.panel}
        data-open={open || undefined}
        data-docked={docked || undefined}
        aria-label="Copilot"
        inert={!open || undefined}
      >
        {!docked && (
          <header className={styles.header}>
            <div className={styles.title}>
              <CopilotSparkle size={20} tone="flat" />
              <span className={styles.titleText}>Copilot</span>
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label="Close Copilot"
              onClick={onClose}
            >
              <RiCloseLine />
            </button>
          </header>
        )}

        <div className={styles.body} data-empty={!hasConvo || undefined}>
          {hasConvo ? (
            <>
              <div className={styles.convoHead}>
                <button
                  type="button"
                  className={styles.newChat}
                  onClick={onClear}
                  disabled={!onClear || busy}
                  aria-label="New chat"
                  title="New chat"
                >
                  <RiChatNewLine aria-hidden />
                  New chat
                </button>
              </div>
              <div
                className={styles.convo}
                ref={convoRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions text"
              >
                {messages.map((m, i) => {
                  if (m.role === 'user') {
                    return (
                      <div key={i} className={`${styles.msg} ${styles.msgUser}`}>
                        <div className={styles.bubbleUser}>{m.text}</div>
                      </div>
                    );
                  }
                  const thinking = !!m.thinking;
                  const settled = !thinking && !m.streaming;
                  const proposalState: ProposalState = m.proposalState ?? 'open';
                  const isLast = i === lastAssistantIdx;
                  const showFollowups =
                    isLast && settled && !!m.text && (!m.proposal || proposalState !== 'open');
                  return (
                    <div key={i} className={`${styles.msg} ${styles.msgAssistant}`}>
                      <div className={styles.assistantWrap} data-last={isLast || undefined}>
                        {thinking ? (
                          <ThinkingBlock steps={m.steps ?? []} stepIdx={m.stepIdx ?? 0} live />
                        ) : (
                          <>
                            {m.thought && !!m.steps?.length && (
                              <ThinkingBlock steps={m.steps} ms={m.thought.ms} />
                            )}
                            {!!m.text && (
                              <div className={styles.bubbleAssistant}>
                                {m.text}
                                {m.streaming && <span className={styles.caret} aria-hidden />}
                              </div>
                            )}

                            {settled && m.proposal && (
                              <CopilotProposal
                                title={m.proposal.title}
                                summary={m.proposal.summary}
                                state={proposalState}
                                onApply={() => onApplyProposal(i)}
                                onDismiss={() => onDismissProposal(i)}
                                onUndo={() => onUndoProposal(i)}
                              />
                            )}

                            {settled && m.text && (
                              <div
                                className={styles.actionsRow}
                                data-has-verdict={m.verdict || undefined}
                              >
                                <CopyButton text={m.text} />
                                {isLast && onRegenerate && (
                                  <button
                                    type="button"
                                    className={styles.iconBtn}
                                    onClick={onRegenerate}
                                    aria-label="Regenerate reply"
                                    title="Regenerate"
                                  >
                                    <RiRefreshLine aria-hidden />
                                  </button>
                                )}
                                <ThumbsRating
                                  verdict={m.verdict}
                                  onVerdict={(v) => onVerdict(i, v)}
                                />
                              </div>
                            )}

                            {showFollowups && (
                              <ul className={styles.followups}>
                                {FOLLOWUPS.map((f, fi) => (
                                  <li
                                    key={f}
                                    className={styles.followReveal}
                                    style={{ '--i': fi } as CSSProperties}
                                  >
                                    <button
                                      type="button"
                                      className={styles.followChip}
                                      onClick={() => !busy && onSend(f)}
                                    >
                                      {f}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {composer}
            </>
          ) : (
            <div className={styles.empty}>
              <div className={styles.hero}>
                <span className={styles.heroMark}>
                  <CopilotSparkle size={30} />
                </span>
                <h2 className={styles.heroTitle}>What should this AOP do?</h2>
                <p className={styles.heroSub}>
                  Ask Copilot to build or change it - add steps, conditions, and connector actions.
                </p>
              </div>
              <ul className={styles.starters}>
                {STARTERS.map((s, i) => (
                  <li
                    key={s.label}
                    className={styles.starterReveal}
                    style={{ '--i': i } as CSSProperties}
                  >
                    <button
                      type="button"
                      className={styles.starter}
                      onClick={() => prefill(s.prompt)}
                    >
                      <span className={styles.starterIco}>
                        <s.icon />
                      </span>
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
              {composer}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
