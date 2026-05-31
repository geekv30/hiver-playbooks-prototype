'use client';

import { useCallback, useRef, useState } from 'react';
import { RiAddLine } from 'react-icons/ri';
import type { Fragment } from '@/types/playbook';
import GutterMarker from '@/components/atoms/GutterMarker';
import GmailBar from './GmailBar';
import Toolbar from './Toolbar';
import ChatBar from './ChatBar';
import CoachmarkTriggers from './CoachmarkTriggers';
import EditorLine, { PaletteRequest } from './EditorLine';
import CommandPalette from './CommandPalette';
import SimulatePanel from '@/components/simulate/SimulatePanel';
import { REFERENCE_ID } from './paletteCatalog';
import { useEditorDoc } from './useEditorDoc';
import { LineTarget, makeChip, makeRef, txt, normalizeLine, lineIsEmpty } from './doc';
import styles from './EditorCanvas.module.css';

interface PaletteState {
  target: LineTarget;
  req: PaletteRequest;
}

interface FocusReq {
  key: string;
  atStart: boolean;
  token: number;
}

const TRIGGER_PLACEHOLDER = 'Describe briefly when this procedure is to be run';
// Step placeholder — teaches BOTH triggers as small keys (the disappearing-
// placeholder fix). '/' for actions, '@' to reference. Recurs on every empty line.
const STEP_PLACEHOLDER = (
  <>
    Write in natural language, or
    <span className={styles.keyPill} aria-hidden>/</span>
    for actions and
    <span className={styles.keyPill} aria-hidden>@</span>
    to reference
  </>
);

export default function EditorCanvas() {
  const api = useEditorDoc();
  const { doc } = api;

  const [palette, setPalette] = useState<PaletteState | null>(null);
  const [focusReq, setFocusReq] = useState<FocusReq | null>(null);
  const [simOpen, setSimOpen] = useState(false);
  const tokenRef = useRef(0);

  const lineKey = (t: LineTarget) => (t.kind === 'trigger' ? 'trigger' : `step:${t.id}`);

  // Ask a line to take the caret. The matching line focuses itself (mount or
  // update), so this works even for a step that was just created.
  const requestFocus = useCallback((key: string, atStart: boolean) => {
    tokenRef.current += 1;
    setFocusReq({ key, atStart, token: tokenRef.current });
  }, []);

  const focusFor = (key: string): { token: number; atStart: boolean } | null =>
    focusReq && focusReq.key === key ? { token: focusReq.token, atStart: focusReq.atStart } : null;

  const lineFrags = (t: LineTarget): Fragment[] =>
    t.kind === 'trigger' ? doc.trigger : doc.steps.find((s) => s.id === t.id)?.body ?? [];

  const handleChange = (t: LineTarget) => (frags: Fragment[]) => {
    api.setLine(t, frags, `text:${lineKey(t)}`);
  };

  const handleEnter = (t: LineTarget) => () => {
    if (t.kind === 'trigger') {
      // From the trigger, Enter drops into the first step.
      const first = doc.steps[0];
      if (first) requestFocus(`step:${first.id}`, true);
      return;
    }
    const newId = api.addStepAfter(t.id);
    requestFocus(`step:${newId}`, true);
  };

  const handleBackspaceEmpty = (t: LineTarget) => () => {
    if (t.kind !== 'step') return;
    const prevId = api.deleteStep(t.id);
    if (prevId) requestFocus(`step:${prevId}`, false);
  };

  const openPalette = (target: LineTarget) => (req: PaletteRequest) => {
    setPalette({ target, req });
  };

  // The line-start '+' affordance: open the Actions palette for a line with no
  // keystroke (NN/g — never make the key the only path). Inserts at line end.
  const openActionsFromPlus = (target: LineTarget, el: HTMLElement) => {
    const frags = lineFrags(target);
    const idx = Math.max(0, frags.length - 1);
    const last = frags[idx];
    const caretOffset = last && last.kind === 'text' ? last.text.length : 0;
    const r = el.getBoundingClientRect();
    setPalette({
      target,
      req: { scope: 'actions', fragIndex: idx, caretOffset, rect: { left: r.left, top: r.top, bottom: r.bottom } },
    });
  };

  const insertChip = (actionId: string, meta?: string) => {
    if (!palette) return;
    const { target, req } = palette;
    // 'reference' inserts an @-reference token (meta = the ref path); everything
    // else an action chip, with the picked value (if any) as the chip's meta.
    const inserted = actionId === REFERENCE_ID ? makeRef(meta ?? '') : makeChip(actionId, meta);
    const frags = lineFrags(target);
    const out: Fragment[] = [];
    frags.forEach((f, i) => {
      if (i === req.fragIndex && f.kind === 'text') {
        // Split the text at the caret and drop the chip between the halves.
        // NO inserted space characters — gap before/after a chip is owned by the
        // token's CSS margin, so it is always consistent and the user can't
        // backspace it away (the chip is atomic).
        const before = f.text.slice(0, req.caretOffset);
        const after = f.text.slice(req.caretOffset);
        out.push(txt(before), inserted, txt(after));
      } else {
        out.push(f);
      }
    });
    api.setLine(target, normalizeLine(out));
    requestFocus(lineKey(target), false);
    setPalette(null);
  };

  return (
    <div className={styles.canvas}>
      <GmailBar />
      <Toolbar
        title={doc.title}
        onTitleChange={api.setTitle}
        canUndo={api.canUndo}
        canRedo={api.canRedo}
        onUndo={api.undo}
        onRedo={api.redo}
        isValid={api.isValid}
        onSimulate={() => setSimOpen((o) => !o)}
        simulating={simOpen}
      />

      <div className={styles.stage}>
        <div className={styles.area}>
        <div className={styles.docScroll}>
          <div className={styles.doc}>
            <CoachmarkTriggers />

            {/* Frontmatter / Trigger */}
            <section className={styles.block}>
              <div className={styles.row}>
                <span className={styles.gutter} aria-hidden />
                <div className={styles.content}>
                  <h2 className={styles.label}>When should this procedure be ran :</h2>
                  <div className={styles.triggerField}>
                    <EditorLine
                      fragments={doc.trigger}
                      placeholder={TRIGGER_PLACEHOLDER}
                      onChange={handleChange({ kind: 'trigger' })}
                      onEnter={handleEnter({ kind: 'trigger' })}
                      onRequestPalette={openPalette({ kind: 'trigger' })}
                      autoFocus={focusFor('trigger')}
                      ariaLabel="When should this procedure be run"
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className={styles.divider} />

            {/* Describe Procedure */}
            <section className={styles.block}>
              <div className={styles.row}>
                <span className={styles.gutter} aria-hidden />
                <div className={styles.content}>
                  <h2 className={styles.label}>Describe Procedure :</h2>
                </div>
              </div>

              <ol className={styles.steps}>
                {doc.steps.map((step, i) => {
                  const t: LineTarget = { kind: 'step', id: step.id };
                  return (
                    <li key={step.id} className={styles.row} data-empty={lineIsEmpty(step.body) || undefined}>
                      <span className={styles.gutter}>
                        <GutterMarker n={i + 1} />
                        <button
                          type="button"
                          className={styles.gutterPlus}
                          aria-label="Insert action"
                          onClick={(e) => openActionsFromPlus(t, e.currentTarget)}
                        >
                          <RiAddLine />
                        </button>
                      </span>
                      <div className={styles.content}>
                        <EditorLine
                          fragments={step.body}
                          placeholder={STEP_PLACEHOLDER}
                          onChange={handleChange(t)}
                          onEnter={handleEnter(t)}
                          onBackspaceEmpty={handleBackspaceEmpty(t)}
                          onRequestPalette={openPalette(t)}
                          autoFocus={focusFor(`step:${step.id}`)}
                          ariaLabel={`Step ${i + 1}`}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        </div>

        <div className={styles.chatDock}>
          <div className={styles.chatInner}>
            <ChatBar />
          </div>
        </div>
        </div>
        <SimulatePanel open={simOpen} />
      </div>

      {palette && (
        <CommandPalette
          anchor={palette.req.rect}
          initialScope={palette.req.scope}
          onSelect={insertChip}
          onClose={() => setPalette(null)}
        />
      )}
    </div>
  );
}
