'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { RiFlaskLine, RiPlayFill, RiRefreshLine, RiRestartLine } from 'react-icons/ri';
import Spinner from '@/components/atoms/Spinner';
import Button from '@/components/atoms/Button';
import { lineHasContent } from '@/components/flow01/doc';
import { CHAT_SCENARIOS } from '@/data/chatFixtures';
import type { ChatScenario } from '@/lib/eval/wire';
import { LiveCopilotError } from '@/lib/copilot/useLiveCopilot';
import EvalBackHeader from '../EvalBackHeader';
import { CHAT_EVAL_ENTRIES, CHAT_EVAL_ICONS } from '../EvalMenu';
import PickableEmailCard from '../PickableEmailCard';
import SimEmptyState from '../SimEmptyState';
import { docSignature } from '../docSignature';
import styles from '../AiScenarios.module.css';
import flow from '../RecentEmails.module.css';
import ChatSession from './ChatSession';
import { useChatRun } from './useChatRun';
import { noteLive, type ChatFlowProps } from './chatFlow';

const TITLE = CHAT_EVAL_ENTRIES.find((e) => e.id === 'chatScenarios')!.title;

// Scenarios the live model wrote, per version of the skill - so leaving the
// flow and coming back does not spend another call or reshuffle the list.
const written = new Map<string, ChatScenario[]>();
// Versions the model could not write for: they fall back to the standard set
// and are not retried on their own (Regenerate still asks again).
const failedWrites = new Set<string>();

const asCard = (s: ChatScenario) => ({ id: s.id, sender: s.persona, subject: s.goal, preview: s.opening });

/**
 * AI scenarios (chat) - AI plays the customer, start to finish. With the live
 * model on, the scenarios are written for THIS skill (two it is built for, one
 * missing a detail, one edge case); without it, the generic set. Pick one and
 * the AI customer and the skill talk until the customer is done.
 */
export default function ChatScenarios({ doc, live, onExit, onRunRecorded, onOpenCopilot }: ChatFlowProps) {
  const run = useChatRun({ doc, live, onRunRecorded });
  const isLive = live.mode === 'live';
  const hasTrigger = lineHasContent(doc.trigger);
  const sig = docSignature(doc);

  // A version the model could not write for opens on the standard set.
  const [list, setList] = useState<ChatScenario[]>(() => written.get(sig) ?? (failedWrites.has(sig) ? CHAT_SCENARIOS : []));
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(() =>
    !written.has(sig) && failedWrites.has(sig) ? 'The scenarios could not be written. Showing the standard set instead.' : null,
  );
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [active, setActive] = useState<ChatScenario | null>(null);
  const [turn, setTurn] = useState(0); // scripted regenerate: rotates the set
  const ctrl = useRef<AbortController | null>(null);
  const docRef = useRef(doc);
  useEffect(() => {
    docRef.current = doc;
  }, [doc]);
  useEffect(() => () => ctrl.current?.abort(), []);

  // Ask the model for scenarios. Nothing here sets state before the request
  // goes out, so the effect that starts the first write stays a pure trigger;
  // the loading state is derived (autoPending) or set by the user's click.
  const fetchScenarios = useCallback(async () => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    try {
      const res = await live.post<{ scenarios: ChatScenario[] }>(
        '/api/evaluate',
        { kind: 'scenarios', doc: docRef.current },
        c.signal,
      );
      if (c.signal.aborted) return;
      written.set(sig, res.scenarios);
      failedWrites.delete(sig);
      setList(res.scenarios);
    } catch (e) {
      if (c.signal.aborted) return;
      // What the note says is what shows: the standard set, not the last
      // list the model wrote.
      written.delete(sig);
      failedWrites.add(sig);
      setList(CHAT_SCENARIOS);
      setNote(
        `${e instanceof LiveCopilotError ? e.message : 'The scenarios could not be written.'} Showing the standard set instead.`,
      );
    } finally {
      if (!c.signal.aborted) setLoading(false);
    }
  }, [live, sig]);

  const write = () => {
    setLoading(true);
    setNote(null);
    setChosenId(null);
    void fetchScenarios();
  };

  // Live: write scenarios for this skill the first time the flow opens on it.
  const autoPending = isLive && hasTrigger && !written.has(sig) && !failedWrites.has(sig);
  useEffect(() => {
    if (autoPending) void fetchScenarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPending]);
  const busyWriting = loading || autoPending;

  const regenerate = () => {
    if (busyWriting) return;
    if (isLive) write();
    else {
      setChosenId(null);
      setTurn((t) => t + 1);
    }
  };

  const k = turn % CHAT_SCENARIOS.length;
  const liveList = written.get(sig) ?? list;
  const shown = isLive ? liveList : [...CHAT_SCENARIOS.slice(k), ...CHAT_SCENARIOS.slice(0, k)];
  const chosen = shown.find((s) => s.id === chosenId) ?? null;

  const begin = (s: ChatScenario) => {
    setActive(s);
    void run.start(s.opening, s);
  };

  const back = () => {
    if (active) {
      run.reset();
      setActive(null);
    } else {
      onExit();
    }
  };

  const header = (
    <EvalBackHeader
      title={TITLE}
      icon={CHAT_EVAL_ICONS.chatScenarios}
      onBack={back}
      action={
        active ? (
          run.phase === 'ended' ? (
            <button type="button" className={styles.regen} onClick={() => begin(active)}>
              <RiRestartLine aria-hidden />
              <span>Run again</span>
            </button>
          ) : undefined
        ) : hasTrigger ? (
          <button type="button" className={styles.regen} onClick={regenerate} disabled={busyWriting}>
            <RiRefreshLine aria-hidden data-spin={busyWriting || undefined} />
            <span>Regenerate</span>
          </button>
        ) : undefined
      }
    />
  );

  if (!hasTrigger) {
    return (
      <div className={styles.scenarios}>
        {header}
        <div className={styles.scroll}>
          <SimEmptyState
            ghosts={CHAT_SCENARIOS.slice(0, 3).map((s) => (
              <PickableEmailCard key={s.id} email={asCard(s)} selected={false} onSelect={() => {}} />
            ))}
            icon={RiFlaskLine}
            title="No scenarios to test yet"
            body="Once your skill has a trigger, AI writes chats a customer could start, then plays the customer from start to finish."
            action={undefined}
          />
        </div>
      </div>
    );
  }

  if (active) {
    return (
      <div className={styles.scenarios}>
        {header}
        <ChatSession
          run={run}
          doc={doc}
          customerName={`${active.persona} · AI customer`}
          mode="auto"
          live={noteLive(live)}
          onOpenCopilot={onOpenCopilot}
        />
      </div>
    );
  }

  return (
    <div className={styles.scenarios}>
      {header}

      {busyWriting ? (
        <div className={styles.loading}>
          <Spinner size={18} />
          <p className={styles.loadingText}>Writing chat scenarios for this skill...</p>
        </div>
      ) : (
        <div className={styles.list} role="radiogroup" aria-label="AI chat scenarios" key={`${turn}-${list.length}`}>
          {note && <p className={flow.emptyHint}>{note}</p>}
          {shown.map((s, i) => (
            <div key={s.id} className={styles.cardReveal} style={{ '--i': i } as CSSProperties}>
              <PickableEmailCard email={asCard(s)} selected={chosenId === s.id} onSelect={() => setChosenId(s.id)} />
            </div>
          ))}
          {shown.length === 0 && (
            <Button variant="secondary" onClick={write}>
              Write scenarios
            </Button>
          )}
        </div>
      )}

      <div className={flow.footer}>
        <button
          type="button"
          className={flow.evalBtn}
          data-ready={(!!chosen && !busyWriting) || undefined}
          disabled={!chosen || busyWriting}
          onClick={() => chosen && begin(chosen)}
        >
          <RiPlayFill aria-hidden />
          <span>Evaluate</span>
        </button>
      </div>
    </div>
  );
}
