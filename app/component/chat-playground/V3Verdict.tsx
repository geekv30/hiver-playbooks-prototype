'use client';

import { useId, useState, type ReactNode } from 'react';
import { RiArrowDownSLine, RiCheckLine, RiErrorWarningLine, RiGitBranchLine, RiStarLine } from 'react-icons/ri';
import Spinner from '@/components/atoms/Spinner';
import type { EditorDoc } from '@/components/flow01/doc';
import { chatResultLine } from '@/components/simulate/chat/chatFlow';
import { itemOutcome, type AgentItem } from '@/components/simulate/chat/useChatRun';
import { CUSTOMER } from './fixture';
import { Composer, EMPTY_HINT, Frame, RESULT, Steps, StopBar, branchTaken, useFollow } from './shared';
import type { DemoRun } from './useDemoRun';
import s from './V3Verdict.module.css';

/* 03 Verdict first - after ElevenLabs' agent tests, Sierra's and Decagon's
 * simulations. The answer to "did it work?" is pinned at the top once the chat
 * ends: the result, the review's reason, and the checks it rests on. The
 * conversation below is the evidence, each reply labelled with the branch it
 * came from and a footer that opens its steps. */

function Check({ ok, children }: { ok: boolean | 'warn'; children: ReactNode }) {
  return (
    <li className={s.check} data-ok={ok === true || undefined} data-warn={ok !== true || undefined}>
      {ok === true ? <RiCheckLine aria-hidden /> : <RiErrorWarningLine aria-hidden />}
      <span>{children}</span>
    </li>
  );
}

function Summary({ run }: { run: DemoRun }) {
  const [more, setMore] = useState(false);
  const { items, phase } = run;
  const customerMsgs = items.filter((i) => i.kind === 'customer').length;
  if (items.length === 0) return null;
  if (phase !== 'ended' && phase !== 'judging') {
    return (
      <div className={s.summary} data-state="running">
        <p className={s.running}>
          <Spinner size={12} />
          <span>
            Running <span className={s.sep}>&middot;</span> message {Math.max(1, customerMsgs)}
          </span>
        </p>
      </div>
    );
  }
  if (phase === 'judging') {
    return (
      <div className={s.summary} data-state="running">
        <p className={s.running}>
          <Spinner size={12} />
          <span>Reviewing the conversation...</span>
        </p>
      </div>
    );
  }
  const agents = items.filter((i): i is AgentItem => i.kind === 'agent');
  const started = agents.some((a) => a.turn?.stage === 'run');
  const flagged = agents.filter((a) => itemOutcome(a) === 'attention').length;
  const rating = items.find((i) => i.kind === 'rating');
  return (
    <div className={s.summary} data-outcome={run.outcome ?? 'none'}>
      {run.outcome && (
        <p className={s.verdict}>
          <span className={s.dot} aria-hidden />
          {RESULT[run.outcome]}
        </p>
      )}
      <p className={s.reason} data-clamp={!more || undefined}>
        {chatResultLine(run)}
      </p>
      <button type="button" className={s.more} onClick={() => setMore((m) => !m)} aria-expanded={more}>
        {more ? 'Less' : 'Checks'}
        <RiArrowDownSLine data-open={more || undefined} aria-hidden />
      </button>
      {more && (
        <ul className={s.checks}>
          <Check ok={started}>{started ? 'The skill started once the customer said what they needed' : 'The skill never started'}</Check>
          <Check ok={flagged === 0}>{flagged === 0 ? 'Every message got a reply on the skill’s path' : `${flagged} messages need a look`}</Check>
          {run.verdict && (
            <Check ok={run.verdict.verdict !== 'unresolved'}>
              {run.verdict.verdict === 'resolved'
                ? 'The review found the customer was helped'
                : run.verdict.verdict === 'handedOff'
                  ? 'The review found the chat was handed off promptly'
                  : 'The review found the customer was not fully helped'}
            </Check>
          )}
          {rating?.kind === 'rating' && (
            <li className={s.check} data-warn={rating.score <= 3 || undefined} data-ok={rating.score > 3 || undefined}>
              <RiStarLine aria-hidden />
              <span>
                {CUSTOMER} rated the chat {rating.score} of 5
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function Footer({ doc, item }: { doc: EditorDoc; item: AgentItem }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const t = item.turn!;
  if (t.steps.length === 0) return null;
  return (
    <>
      <button type="button" className={s.footer} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {t.steps.length} steps
        <RiArrowDownSLine data-open={open || undefined} aria-hidden />
      </button>
      <div className={s.collapse} data-open={open || undefined} id={id}>
        <div className={s.inner}>
          <Steps doc={doc} turn={t} />
        </div>
      </div>
    </>
  );
}

export default function V3Verdict({ run, doc }: { run: DemoRun; doc: EditorDoc }) {
  const { items, phase } = run;
  const ref = useFollow(`${items.length}-${phase}`);
  const ended = phase === 'ended';

  return (
    <Frame run={run}>
      <Summary run={run} />
      <div className={s.thread} ref={ref} role="log" aria-live="polite">
        {items.length === 0 && run.mode === 'you' && <p className={s.empty}>{EMPTY_HINT}</p>}
        {items.map((it) => {
          if (it.kind === 'rating') return null; // in the checks
          if (it.kind === 'customer') {
            return (
              <div key={it.id} className={s.customer}>
                <div className={s.customerBubble}>{it.text}</div>
                <span className={s.tag}>{run.mode === 'ai' ? `${CUSTOMER} · AI` : 'You'}</span>
              </div>
            );
          }
          const t = it.turn;
          if (it.status === 'done' && t?.stage === 'noMatch') {
            return (
              <p key={it.id} className={s.event} data-tone="warn">
                <RiErrorWarningLine aria-hidden />
                <span>
                  <strong>The skill did not run.</strong> {t.note}
                </span>
              </p>
            );
          }
          const arm = t ? branchTaken(doc, t) : null;
          const branch = arm ? (arm === 'ELSE' ? 'Else branch' : `If ${arm}`) : null;
          const path = it.firstRun ? `Started ${doc.title}` : t?.stage === 'greet' ? 'Greeting' : t?.stage === 'close' ? 'Sign-off' : null;
          return (
            <div key={it.id} className={s.agent}>
              {(branch || path) && (
                <p className={s.path}>
                  <RiGitBranchLine aria-hidden />
                  <span>{[path, branch].filter(Boolean).join(' › ')}</span>
                </p>
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
              {t && <Footer doc={doc} item={it} />}
            </div>
          );
        })}
        {phase === 'customer' && (
          <div className={s.customer}>
            <div className={`${s.customerBubble} ${s.typing}`} aria-label="The customer is typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        {ended && items.length > 0 && <p className={s.endLine}>Chat ended</p>}
      </div>
      {run.mode === 'you' && !ended && <Composer run={run} look="card" />}
      <StopBar run={run} />
    </Frame>
  );
}
