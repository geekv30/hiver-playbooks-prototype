'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { RiPlayFill, RiInboxLine, RiSearchLine, RiStopCircleLine } from 'react-icons/ri';
import Dropdown from '@/components/atoms/Dropdown';
import { useConnectorHealth } from '@/components/flow01/connectorHealth';
import { CHAT_INBOXES, chatInboxName, pastChatsForInbox, type PastChat } from '@/data/chatFixtures';
import EvalBackHeader from '../EvalBackHeader';
import { CHAT_EVAL_ICONS, CHAT_EVAL_ENTRIES } from '../EvalMenu';
import PickableEmailCard from '../PickableEmailCard';
import flow from '../RecentEmails.module.css';
import scenarioStyles from '../AiScenarios.module.css';
import ChatSession from './ChatSession';
import ChatTranscriptModal from './ChatTranscriptModal';
import { useChatRun } from './useChatRun';
import { noteLive, type ChatFlowProps } from './chatFlow';

const TITLE = CHAT_EVAL_ENTRIES.find((e) => e.id === 'pastChats')!.title;

/** A past chat in the shape the shared pickable card reads. */
function asCard(c: PastChat) {
  const first = c.messages.find((m) => m.from === 'customer')?.text ?? '';
  return {
    id: c.id,
    sender: c.customer,
    subject: first,
    preview: `${c.messages.length} messages`,
  };
}

/**
 * Past chats - real chats from a chat inbox (the chat twin of Recent
 * conversations). Pick an inbox, pick one chat, Evaluate: the skill answers
 * the customer's first message, then the user carries on as the customer.
 */
export default function PastChats({ doc, live, onExit, onRunRecorded, onOpenCopilot }: ChatFlowProps) {
  const [inbox, setInbox] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [runChat, setRunChat] = useState<PastChat | null>(null);
  const health = useConnectorHealth();
  const run = useChatRun({ doc, health, live, onRunRecorded });

  const chats = useMemo(() => pastChatsForInbox(inbox), [inbox]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) => c.customer.toLowerCase().includes(q) || c.messages.some((m) => m.text.toLowerCase().includes(q)),
    );
  }, [chats, query]);

  const canEvaluate = !!selectedId && filtered.some((c) => c.id === selectedId);
  const pickInbox = (id: string) => {
    setInbox(id);
    setQuery('');
    setSelectedId(null);
  };

  const evaluate = (chat: PastChat) => {
    const first = chat.messages.find((m) => m.from === 'customer')?.text;
    if (!first) return;
    setRunChat(chat);
    void run.start('past', first);
  };

  const back = () => {
    if (runChat) {
      run.reset();
      setRunChat(null);
    } else {
      onExit();
    }
  };

  const reviewChat = reviewId ? chats.find((c) => c.id === reviewId) ?? null : null;

  return (
    <div className={flow.recent}>
      <EvalBackHeader
        title={TITLE}
        icon={CHAT_EVAL_ICONS.pastChats}
        onBack={back}
        action={
          runChat && run.phase !== 'ended' && run.items.length > 0 ? (
            <button type="button" className={scenarioStyles.regen} onClick={run.end} disabled={run.busy}>
              <RiStopCircleLine aria-hidden />
              <span>End chat</span>
            </button>
          ) : undefined
        }
      />

      {runChat ? (
        <ChatSession
          run={run}
          doc={doc}
          customerName={runChat.customer}
          mode="manual"
          live={noteLive(live)}
          onRedo={() => evaluate(runChat)}
          onOpenCopilot={onOpenCopilot}
        />
      ) : (
        <>
          <div className={flow.controls}>
            <Dropdown
              options={CHAT_INBOXES.map((c) => ({ id: c.id, label: c.name }))}
              value={inbox}
              onChange={pickInbox}
              placeholder="Select a chat inbox"
              ariaLabel="Select a chat inbox"
            />
            {inbox && chats.length > 0 && (
              <div className={flow.searchRow}>
                <input
                  className={flow.searchInput}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chats"
                  aria-label="Search chats"
                />
                <span className={flow.searchIcon} aria-hidden>
                  <RiSearchLine />
                </span>
              </div>
            )}
          </div>

          {inbox && chats.length === 0 ? (
            <div className={flow.emptyState}>
              <RiInboxLine className={flow.emptyIcon} aria-hidden />
              <p className={flow.emptyText}>No past chats in this inbox.</p>
              <p className={flow.emptyHint}>Pick another chat inbox to see chats you can evaluate.</p>
            </div>
          ) : inbox ? (
            filtered.length === 0 ? (
              <div className={flow.noMatch}>
                <p className={flow.noMatchText}>No chats match &ldquo;{query}&rdquo;.</p>
              </div>
            ) : (
              <div className={flow.list} role="radiogroup" aria-label="Past chats">
                {filtered.map((c, i) => (
                  <div key={c.id} className={flow.cardReveal} style={{ '--i': i } as CSSProperties}>
                    <PickableEmailCard
                      email={asCard(c)}
                      selected={selectedId === c.id}
                      onSelect={() => setSelectedId(c.id)}
                      onOpen={() => setReviewId(c.id)}
                      aside={c.started}
                    />
                  </div>
                ))}
              </div>
            )
          ) : null}

          {inbox && chats.length > 0 && (
            <div className={flow.footer}>
              <button
                type="button"
                className={flow.evalBtn}
                data-ready={canEvaluate || undefined}
                disabled={!canEvaluate}
                onClick={() => {
                  const c = chats.find((x) => x.id === selectedId);
                  if (c && canEvaluate) evaluate(c);
                }}
              >
                <RiPlayFill aria-hidden />
                <span>Evaluate</span>
              </button>
            </div>
          )}
        </>
      )}

      {reviewChat && (
        <ChatTranscriptModal chat={reviewChat} inbox={chatInboxName(inbox)} onClose={() => setReviewId(null)} />
      )}
    </div>
  );
}
