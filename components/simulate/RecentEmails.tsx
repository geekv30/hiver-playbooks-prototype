'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { RiPlayFill, RiStopCircleLine, RiInboxLine, RiSearchLine } from 'react-icons/ri';
import { MAILBOXES } from '@/data/mailboxes';
import { recentForMailbox, type SimEmail, type SimStatusKind } from '@/data/simFixtures';
import Dropdown from '@/components/atoms/Dropdown';
import EvalBackHeader from './EvalBackHeader';
import { EVAL_ICONS, EVAL_TITLES } from './EvalMenu';
import PickableEmailCard from './PickableEmailCard';
import ConversationModal from './ConversationModal';
import EmailCard from './EmailCard';
import { useSimRun } from './useSimRun';
import styles from './RecentEmails.module.css';

interface Props {
  /** Leave this flow back to the Evaluate menu (the top-left back control). */
  onExit: () => void;
  /** Report a completed run's status up to the canvas (the eval aggregate). */
  onRunRecorded?: (statuses: SimStatusKind[]) => void;
  /** Open the Copilot tab (Fix with Copilot on a caught gap). */
  onOpenCopilot?: () => void;
}

const NO_EMAILS: SimEmail[] = [];

/**
 * Recent conversations (Figma 1745:67909 / 68080 / 68759). Pick a shared mailbox
 * -> search + single-select ONE recent conversation (radio) -> Evaluate it against
 * the AOP. Each card's hover redirect opens the full email in a modal. The
 * Copilot | Evaluation tabs stay pinned above this flow's back-header.
 */
export default function RecentEmails({ onExit, onRunRecorded, onOpenCopilot }: Props) {
  const [mailbox, setMailbox] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const mailboxOptions = useMemo(() => MAILBOXES.map((m) => ({ id: m.id, label: m.name })), []);
  const emails = useMemo(() => recentForMailbox(mailbox), [mailbox]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return emails;
    return emails.filter(
      (e) =>
        e.sender.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.preview.toLowerCase().includes(q),
    );
  }, [emails, query]);

  // A new mailbox brings a different inbox - clear selection, search, any run.
  useEffect(() => {
    setSelectedId(null);
    setQuery('');
    setRunId(null);
  }, [mailbox]);

  const runEmail = useMemo(() => emails.find((e) => e.id === runId) ?? null, [emails, runId]);
  const runEmails = useMemo(() => (runEmail ? [runEmail] : NO_EMAILS), [runEmail]);
  const { phase, runs, start, stop } = useSimRun(runEmails, onRunRecorded);

  // Start the run once we've entered run mode (after runEmails updates).
  useEffect(() => {
    if (runId) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const running = runId !== null;
  // Only evaluable when the selected conversation is actually visible - a search
  // that filters the selection out must not leave Evaluate armed on a hidden email.
  const canEvaluate = !!selectedId && filtered.some((e) => e.id === selectedId);
  const evaluate = () => {
    if (canEvaluate) setRunId(selectedId);
  };
  // Top-back: from the result -> back to the conversation list; from the list -> menu.
  const back = () => {
    if (running) {
      stop();
      setRunId(null);
    } else {
      onExit();
    }
  };

  const reviewEmail = reviewId ? emails.find((e) => e.id === reviewId) ?? null : null;

  const showPicker = !running;
  const showSearch = !running && !!mailbox && emails.length > 0;
  // Footer: Evaluate (list) / Stop (running); hidden once a run has finished.
  const showFooter = (!!mailbox || running) && emails.length > 0 && (!running || phase !== 'done');

  return (
    <div className={styles.recent}>
      <EvalBackHeader title={EVAL_TITLES.recent} icon={EVAL_ICONS.recent} onBack={back} />

      {showPicker && (
        <div className={styles.controls}>
          <Dropdown
            options={mailboxOptions}
            value={mailbox}
            onChange={setMailbox}
            placeholder="Select a shared mailbox"
            ariaLabel="Select a shared mailbox"
          />
          {showSearch && (
            <div className={styles.searchRow}>
              <input
                className={styles.searchInput}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search email"
                aria-label="Search conversations"
              />
              <span className={styles.searchIcon} aria-hidden>
                <RiSearchLine />
              </span>
            </div>
          )}
        </div>
      )}

      {running ? (
        <div className={styles.list} data-running>
          {runEmail && (
            <EmailCard email={runEmail} run={runs[runEmail.id]} onRerun={start} onFix={onOpenCopilot} />
          )}
        </div>
      ) : mailbox && emails.length === 0 ? (
        <div className={styles.emptyState}>
          <RiInboxLine className={styles.emptyIcon} aria-hidden />
          <p className={styles.emptyText}>No recent conversations in this mailbox.</p>
          <p className={styles.emptyHint}>Pick another mailbox to see conversations you can evaluate.</p>
        </div>
      ) : mailbox ? (
        filtered.length === 0 ? (
          <div className={styles.noMatch}>
            <p className={styles.noMatchText}>No conversations match &ldquo;{query}&rdquo;.</p>
          </div>
        ) : (
          <div className={styles.list} role="radiogroup" aria-label="Recent conversations">
            {filtered.map((e, i) => (
              <div key={e.id} className={styles.cardReveal} style={{ '--i': i } as CSSProperties}>
                <PickableEmailCard
                  email={e}
                  selected={selectedId === e.id}
                  onSelect={() => setSelectedId(e.id)}
                  onOpen={() => setReviewId(e.id)}
                />
              </div>
            ))}
          </div>
        )
      ) : null}

      {showFooter && (
        <div className={styles.footer}>
          {running ? (
            <button type="button" className={styles.stopBtn} onClick={back}>
              <RiStopCircleLine aria-hidden />
              <span>Stop evaluation</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.evalBtn}
              data-ready={canEvaluate || undefined}
              disabled={!canEvaluate}
              onClick={evaluate}
            >
              <RiPlayFill aria-hidden />
              <span>Evaluate</span>
            </button>
          )}
        </div>
      )}

      {reviewEmail && <ConversationModal email={reviewEmail} onClose={() => setReviewId(null)} />}
    </div>
  );
}
