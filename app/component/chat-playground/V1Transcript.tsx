'use client';

import { useId, useState } from 'react';
import { RiArrowRightSLine, RiFlashlightLine, RiInformationLine } from 'react-icons/ri';
import Spinner from '@/components/atoms/Spinner';
import type { EditorDoc } from '@/components/flow01/doc';
import { chatResultLine } from '@/components/simulate/chat/chatFlow';
import type { AgentItem } from '@/components/simulate/chat/useChatRun';
import { CUSTOMER } from './fixture';
import { Composer, EMPTY_HINT, Frame, RESULT, Stars, StopBar, Steps, stepSummary, useFollow } from './shared';
import type { DemoRun } from './useDemoRun';
import s from './V1Transcript.module.css';

/* 01 Transcript - after Linear's agent, Claude and Notion AI's side panel.
 * The agent writes on the page, no bubble and no avatar; the customer is a
 * soft grey block on the right. Under each reply, one quiet line says what the
 * skill did (the actions by name) and opens the steps in place. Events and
 * the result sit on the left edge with the text, not centred. */

function Trace({ doc, item }: { doc: EditorDoc; item: AgentItem }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const t = item.turn!;
  if (t.steps.length === 0) return null;
  return (
    <div className={s.trace}>
      <button type="button" className={s.traceRow} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <RiArrowRightSLine className={s.chev} data-open={open || undefined} aria-hidden />
        <span className={s.traceCount}>{t.steps.length} steps</span>
        <span className={s.traceSep} aria-hidden>
          &middot;
        </span>
        <span className={s.traceSummary}>{stepSummary(t)}</span>
      </button>
      <div className={s.collapse} data-open={open || undefined} id={id}>
        <div className={s.inner}>
          <Steps doc={doc} turn={t} />
        </div>
      </div>
    </div>
  );
}

export default function V1Transcript({ run, doc }: { run: DemoRun; doc: EditorDoc }) {
  const { items, phase } = run;
  const ref = useFollow(`${items.length}-${phase}`);
  const ended = phase === 'ended';
  const who = run.mode === 'ai' ? `${CUSTOMER} · AI customer` : 'You, as the customer';
  const firstCustomer = items.find((i) => i.kind === 'customer')?.id;

  return (
    <Frame run={run}>
      <div className={s.thread} ref={ref} role="log" aria-live="polite">
        {items.length === 0 && run.mode === 'you' && <p className={s.empty}>{EMPTY_HINT}</p>}

        {items.map((it, i) => {
          if (it.kind === 'customer') {
            const grouped = items[i - 1]?.kind === 'customer';
            return (
              <div key={it.id} className={s.customer} data-grouped={grouped || undefined}>
                {it.id === firstCustomer && <span className={s.who}>{who}</span>}
                <div className={s.customerText}>{it.text}</div>
              </div>
            );
          }
          if (it.kind === 'rating') {
            return (
              <div key={it.id} className={s.rating}>
                <p className={s.ratingHead}>
                  <Stars score={it.score} />
                  <span>
                    {CUSTOMER} rated the chat {it.score} out of 5
                  </span>
                </p>
                {it.comment && <p className={s.ratingComment}>&ldquo;{it.comment}&rdquo;</p>}
              </div>
            );
          }
          const t = it.turn;
          if (it.status === 'done' && t?.stage === 'noMatch') {
            return (
              <p key={it.id} className={s.event} data-tone="warn">
                <RiInformationLine aria-hidden />
                <span>
                  <strong>The skill did not run.</strong> {t.note}
                </span>
              </p>
            );
          }
          return (
            <div key={it.id} className={s.agentBlock}>
              {it.firstRun && (
                <p className={s.event}>
                  <RiFlashlightLine aria-hidden />
                  <span>
                    Skill started <span className={s.sep}>&middot;</span> <strong>{doc.title}</strong>
                  </span>
                </p>
              )}
              <div className={s.agent}>
                <span className={s.agentName}>AI agent</span>
                {it.status === 'running' ? (
                  <span className={s.working}>Working on a reply...</span>
                ) : (
                  <>
                    {t?.reply && <p className={s.agentText}>{t.reply}</p>}
                    {t && <Trace doc={doc} item={it} />}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {phase === 'customer' && <span className={`${s.working} ${s.workingRight}`}>{CUSTOMER} is typing...</span>}

        {(ended || phase === 'judging') && items.length > 0 && (
          <div className={s.end}>
            <div className={s.endRule}>Chat ended</div>
            {phase === 'judging' ? (
              <p className={s.result}>
                <Spinner size={12} />
                <span className={s.resultText}>Reviewing the conversation...</span>
              </p>
            ) : (
              <div className={s.result} data-outcome={run.outcome ?? 'none'}>
                {run.outcome && (
                  <p className={s.resultHead}>
                    <span className={s.dot} aria-hidden />
                    {RESULT[run.outcome]}
                  </p>
                )}
                <p className={s.resultText}>{chatResultLine(run)}</p>
              </div>
            )}
          </div>
        )}
      </div>
      {run.mode === 'you' && !ended && <Composer run={run} look="card" />}
      <StopBar run={run} />
    </Frame>
  );
}
