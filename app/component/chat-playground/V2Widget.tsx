'use client';

import { useEffect, useRef, useState } from 'react';
import Spinner from '@/components/atoms/Spinner';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import type { EditorDoc } from '@/components/flow01/doc';
import { chatResultLine } from '@/components/simulate/chat/chatFlow';
import { CUSTOMER } from './fixture';
import { Composer, EMPTY_HINT, Frame, RESULT, Stars, StopBar, Steps, useFollow } from './shared';
import type { DemoRun } from './useDemoRun';
import s from './V2Widget.module.css';

/* 02 Widget + steps - after Intercom's Fin Preview (Customer view | Event
 * log). "Conversation" is the chat exactly as the customer sees it in the
 * widget: nothing but messages, the skill starting, and the end. "Steps" is
 * the same chat with what the skill did laid in under each reply. A reply's
 * "N steps" link jumps from one to the other, at that reply. */

type View = 'chat' | 'steps';

export default function V2Widget({ run, doc }: { run: DemoRun; doc: EditorDoc }) {
  const [view, setView] = useState<View>('chat');
  const [focus, setFocus] = useState<string | null>(null);
  const { items, phase } = run;
  const ref = useFollow(`${items.length}-${phase}-${view}`);
  const ended = phase === 'ended';
  const who = run.mode === 'ai' ? `${CUSTOMER} · AI customer` : 'You, as the customer';
  const firstCustomer = items.find((i) => i.kind === 'customer')?.id;
  const pending = useRef<string | null>(null);

  // "N steps" on a reply: open Steps at that reply.
  useEffect(() => {
    if (view !== 'steps' || !pending.current) return;
    const el = ref.current?.querySelector<HTMLElement>(`[data-turn="${pending.current}"]`);
    pending.current = null;
    if (el && ref.current) ref.current.scrollTo({ top: el.offsetTop - 12 });
  }, [view, ref]);

  const jump = (id: string) => {
    pending.current = id;
    setFocus(id);
    setView('steps');
  };

  return (
    <Frame run={run}>
      <div className={s.switch}>
        <SegmentedControl
          size="sm"
          tabs={[
            { id: 'chat', label: 'Conversation' },
            { id: 'steps', label: 'Steps' },
          ]}
          active={view}
          onChange={setView}
          ariaLabel="View"
        />
      </div>
      <div className={s.thread} ref={ref} role="log" aria-live="polite" data-view={view}>
        {items.length === 0 && run.mode === 'you' && <p className={s.empty}>{EMPTY_HINT}</p>}

        {items.map((it, i) => {
          const next = items[i + 1];
          if (it.kind === 'customer') {
            return (
              <div key={it.id} className={s.customer}>
                {it.id === firstCustomer && <span className={s.who}>{who}</span>}
                <div className={s.customerBubble}>{it.text}</div>
              </div>
            );
          }
          if (it.kind === 'rating') {
            return null; // the rating sits in the result card
          }
          const t = it.turn;
          const lastOfRun = next?.kind !== 'agent';
          return (
            <div key={it.id} className={s.agentBlock} data-turn={it.id}>
              {it.firstRun && (
                <p className={s.divider}>
                  <span>
                    Skill started <span className={s.sep}>&middot;</span> <strong>{doc.title}</strong>
                  </span>
                </p>
              )}
              {t?.stage === 'noMatch' && (
                <p className={s.divider} data-tone="warn">
                  <span>
                    <strong>The skill did not run.</strong> {t.note}
                  </span>
                </p>
              )}
              {view === 'steps' && t && t.steps.length > 0 && (
                <div className={s.log} data-focus={focus === it.id || undefined}>
                  <Steps doc={doc} turn={t} />
                </div>
              )}
              {it.status === 'running' ? (
                <div className={`${s.agentBubble} ${s.typing}`} aria-label="The agent is typing">
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                t?.reply && <div className={s.agentBubble}>{t.reply}</div>
              )}
              {lastOfRun && it.status === 'done' && t?.stage !== 'noMatch' && (
                <p className={s.meta}>
                  <span>AI agent</span>
                  {view === 'chat' && t && t.steps.length > 0 && (
                    <>
                      <span className={s.sep}>&middot;</span>
                      <button type="button" className={s.metaLink} onClick={() => jump(it.id)}>
                        {t.steps.length} steps
                      </button>
                    </>
                  )}
                </p>
              )}
            </div>
          );
        })}

        {phase === 'customer' && (
          <div className={s.customer} aria-label="The customer is typing">
            <div className={`${s.customerBubble} ${s.typing}`}>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {(ended || phase === 'judging') && items.length > 0 && (
          <div className={s.end}>
            <p className={s.divider}>
              <span>Chat ended</span>
            </p>
            <div className={s.card} data-outcome={run.outcome ?? 'none'}>
              {phase === 'judging' ? (
                <p className={s.cardHead}>
                  <Spinner size={12} />
                  <span className={s.cardMuted}>Reviewing the conversation...</span>
                </p>
              ) : (
                <>
                  {run.outcome && (
                    <p className={s.cardHead}>
                      <span className={s.dot} aria-hidden />
                      {RESULT[run.outcome]}
                    </p>
                  )}
                  <p className={s.cardText}>{chatResultLine(run)}</p>
                  {items.map((r) =>
                    r.kind === 'rating' ? (
                      <p key={r.id} className={s.cardRating}>
                        <Stars score={r.score} />
                        <span>
                          Rated {r.score} of 5{r.comment && <> &middot; &ldquo;{r.comment}&rdquo;</>}
                        </span>
                      </p>
                    ) : null,
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {run.mode === 'you' && !ended && <Composer run={run} look="pill" />}
      <StopBar run={run} />
    </Frame>
  );
}
