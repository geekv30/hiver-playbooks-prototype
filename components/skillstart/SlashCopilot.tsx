'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiCheckLine,
  RiCloseLine,
  RiCornerDownLeftLine,
  RiErrorWarningLine,
  RiSlashCommands2,
} from 'react-icons/ri';
import CopilotSparkle from '@/components/flow01/copilot/CopilotSparkle';
import pal from '@/components/flow01/CommandPalette.module.css';
import { runScript, type Conversation, type Direction, type MenuEntry, type RunScript, type Skill } from './model';
import styles from './SlashCopilot.module.css';

type Msg =
  | { id: number; kind: 'user'; skill: Skill | null; text: string }
  | { id: number; kind: 'text'; text: string }
  | { id: number; kind: 'confirm'; skill: Skill; answered: 'run' | 'cancel' | null }
  | { id: number; kind: 'run'; skill: Skill; script: RunScript; offTrigger: boolean };

// Omit across each member of the union, so push() takes any message shape.
type NewMsg = Msg extends infer M ? (M extends Msg ? Omit<M, 'id'> : never) : never;

interface Props {
  direction: Direction;
  entries: MenuEntry[];
  /** The open email, or null where there is none (the admin panel). */
  conv: Conversation | null;
}

const STEP_MS = 420;

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** One run in the thread: its steps land one at a time, then the outcome. */
function RunCard({ skill, script, offTrigger, direction }: { skill: Skill; script: RunScript; offTrigger: boolean; direction: Direction }) {
  const total = script.steps.length;
  const [shown, setShown] = useState(() => (reducedMotion() ? total : 0));
  const [used, setUsed] = useState(false);
  useEffect(() => {
    if (shown >= total) return;
    const t = window.setTimeout(() => setShown((n) => n + 1), STEP_MS);
    return () => window.clearTimeout(t);
  }, [shown, total]);
  const done = shown >= total;
  return (
    <div className={styles.run}>
      <p className={styles.runHead}>
        <span className={styles.runName}>{skill.name}</span>
        <span className={styles.runState}>{done ? 'Done' : 'Running'}</span>
      </p>
      {/* A: the person is the trigger, but Copilot says when the email does not fit. */}
      {offTrigger && direction === 'a' && (
        <p className={styles.offNote}>
          <RiErrorWarningLine aria-hidden />
          This email does not fit this skill&apos;s trigger. Ran it anyway.
        </p>
      )}
      <ol className={styles.steps}>
        {script.steps.slice(0, shown).map((s) => (
          <li key={s} className={styles.step}>
            <RiCheckLine aria-hidden />
            {s}
          </li>
        ))}
      </ol>
      {done && script.reply && (
        <div className={styles.draft}>
          <p className={styles.draftLabel}>Draft reply</p>
          <p className={styles.draftText}>{script.reply}</p>
          <button type="button" className={styles.use} data-used={used || undefined} onClick={() => setUsed(true)} disabled={used}>
            {used ? 'Added to your reply' : 'Use this reply'}
          </button>
        </div>
      )}
      {done && !script.reply && script.outcome && <p className={styles.outcome}>{script.outcome}</p>}
    </div>
  );
}

export default function SlashCopilot({ direction, entries, conv }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<Skill | null>(null);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const seq = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const query = !picked && text.startsWith('/') ? text.slice(1).trim().toLowerCase() : null;
  const menuOpen = query !== null && !dismissed;
  const shown = useMemo(
    () =>
      query === null
        ? []
        : entries.filter((e) => !query || e.skill.name.toLowerCase().includes(query) || e.skill.slug.includes(query)),
    [entries, query],
  );
  const fitting = shown.filter((e) => e.fits && !e.disabled);
  const others = shown.filter((e) => !(e.fits && !e.disabled));
  // C lists fitting skills under their own heading; A and B keep one list.
  const grouped = direction === 'c' && fitting.length > 0;
  const ordered = grouped ? [...fitting, ...others] : shown;
  const activeIdx = Math.min(active, Math.max(0, ordered.length - 1));

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [msgs]);

  const push = (...m: NewMsg[]) =>
    setMsgs((prev) => [...prev, ...m.map((x) => ({ ...x, id: ++seq.current }) as Msg)]);

  const pick = (e: MenuEntry | undefined) => {
    if (!e || e.disabled) return;
    setPicked(e.skill);
    setText('');
    setActive(0);
    inputRef.current?.focus();
  };

  const runOn = (skill: Skill) => {
    if (!conv) return;
    push({ kind: 'run', skill, script: runScript(skill, conv), offTrigger: conv.fits !== skill.id });
  };

  const send = () => {
    const extra = text.trim();
    if (picked) {
      push({ kind: 'user', skill: picked, text: extra });
      const offTrigger = !conv || conv.fits !== picked.id;
      // C asks before running a skill on an email that does not fit; A and B just run.
      if (direction === 'c' && offTrigger) push({ kind: 'confirm', skill: picked, answered: null });
      else runOn(picked);
      setPicked(null);
      setText('');
      return;
    }
    if (!extra) return;
    push({ kind: 'user', skill: null, text: extra }, { kind: 'text', text: 'Type / to pick a skill. In this prototype, Copilot only runs skills.' });
    setText('');
  };

  const answer = (id: number, choice: 'run' | 'cancel') => {
    const m = msgs.find((x) => x.id === id);
    if (!m || m.kind !== 'confirm' || m.answered) return;
    setMsgs((prev) => prev.map((x) => (x.id === id && x.kind === 'confirm' ? { ...x, answered: choice } : x)));
    if (choice === 'run') runOn(m.skill);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (menuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, ordered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        pick(ordered[activeIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setDismissed(true);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      send();
      return;
    }
    if (e.key === 'Backspace' && picked && text === '') {
      e.preventDefault();
      setPicked(null);
      setText('/' + picked.slug);
    }
  };

  const row = (e: MenuEntry) => {
    const i = ordered.indexOf(e);
    return (
      <button
        key={e.skill.id}
        type="button"
        role="option"
        aria-selected={i === activeIdx}
        aria-disabled={e.disabled ? true : undefined}
        className={`${pal.row}${i === activeIdx ? ` ${pal.rowActive}` : ''} ${styles.menuRow}`}
        data-disabled={e.disabled ? '' : undefined}
        onMouseEnter={() => setActive(i)}
        onMouseDown={(ev) => ev.preventDefault()}
        onClick={() => pick(e)}
      >
        <span className={pal.rowIco} aria-hidden>
          <RiSlashCommands2 />
        </span>
        <span className={pal.rowText}>
          <span className={`${pal.rowLabel}${e.disabled ? ` ${styles.labelOff}` : ''}`}>
            {e.skill.name} <span className={styles.menuSlug}>/{e.skill.slug}</span>
          </span>
          <span className={pal.rowSub}>{e.disabled ?? e.skill.trigger}</span>
        </span>
      </button>
    );
  };

  return (
    <aside className={styles.panel} aria-label="Copilot">
      <header className={styles.head}>
        <CopilotSparkle size={16} />
        <span>Copilot</span>
      </header>

      <div className={styles.thread}>
        {msgs.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>{conv ? `Working on: ${conv.subject}` : 'Admin panel'}</p>
            <p className={styles.emptySub}>
              Type <kbd className={styles.kbd}>/</kbd> to run a skill{conv ? ' on this email' : ''}.
            </p>
          </div>
        ) : (
          msgs.map((m) => {
            if (m.kind === 'user')
              return (
                <div key={m.id} className={styles.user}>
                  {m.skill && <span className={styles.chip}>/{m.skill.slug}</span>}
                  {m.text && <span>{m.text}</span>}
                </div>
              );
            if (m.kind === 'text')
              return (
                <p key={m.id} className={styles.say}>
                  {m.text}
                </p>
              );
            if (m.kind === 'confirm')
              return (
                <div key={m.id} className={styles.confirm}>
                  <p className={styles.confirmText}>
                    <strong>{m.skill.name}</strong> is for: &ldquo;{m.skill.trigger}&rdquo; This email does not look like
                    that. Run it anyway?
                  </p>
                  {m.answered === null ? (
                    <div className={styles.confirmActions}>
                      <button type="button" className={styles.btnPrimary} onClick={() => answer(m.id, 'run')}>
                        Run anyway
                      </button>
                      <button type="button" className={styles.btnGhost} onClick={() => answer(m.id, 'cancel')}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className={styles.confirmDone}>{m.answered === 'run' ? 'You chose to run it.' : 'Cancelled. Nothing ran.'}</p>
                  )}
                </div>
              );
            return <RunCard key={m.id} skill={m.skill} script={m.script} offTrigger={m.offTrigger} direction={direction} />;
          })
        )}
        <div ref={endRef} />
      </div>

      <div className={styles.composerWrap}>
        {menuOpen && (
          <div className={`${pal.pop} ${pal.popStatic} ${styles.menu}`} role="listbox" aria-label="Skills">
            <div className={pal.card}>
              {ordered.length === 0 ? (
                <p className={pal.empty}>{entries.length === 0 ? 'No skills you can run here' : 'No skills match'}</p>
              ) : grouped ? (
                <>
                  <div className={pal.group}>
                    <p className={pal.groupLabel}>Fits this email</p>
                    <div className={pal.rows}>{fitting.map(row)}</div>
                  </div>
                  {others.length > 0 && (
                    <div className={pal.group}>
                      <p className={pal.groupLabel}>Other skills</p>
                      <div className={pal.rows}>{others.map(row)}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className={pal.group}>
                  <p className={pal.groupLabel}>Skills</p>
                  <div className={pal.rows}>{ordered.map(row)}</div>
                </div>
              )}
            </div>
            <div className={pal.footer}>
              <span className={pal.hint}>
                <span className={pal.keys}>
                  <kbd className={pal.cap}>
                    <RiArrowUpLine />
                  </kbd>
                  <kbd className={pal.cap}>
                    <RiArrowDownLine />
                  </kbd>
                </span>
                navigate
              </span>
              <span className={pal.hint}>
                <kbd className={pal.cap}>
                  <RiCornerDownLeftLine />
                </kbd>
                pick
              </span>
            </div>
          </div>
        )}
        <div className={styles.composer}>
          {picked && (
            <span className={styles.chip}>
              /{picked.slug}
              <button type="button" className={styles.chipX} aria-label="Remove skill" onClick={() => setPicked(null)}>
                <RiCloseLine />
              </button>
            </span>
          )}
          <input
            ref={inputRef}
            className={styles.input}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setActive(0);
              setDismissed(false);
            }}
            onKeyDown={onKey}
            placeholder={picked ? 'Add a note, or press Enter to run' : 'Ask Copilot, or type / for skills'}
            aria-label="Message Copilot"
          />
          <button
            type="button"
            className={styles.send}
            data-ready={picked || text.trim() ? '' : undefined}
            onClick={send}
            aria-label={picked ? `Run ${picked.name}` : 'Send'}
          >
            <RiArrowUpLine />
          </button>
        </div>
      </div>
    </aside>
  );
}
