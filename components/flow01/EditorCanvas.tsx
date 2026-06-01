'use client';

import { useCallback, useRef, useState } from 'react';
import { RiAddLine, RiSlashCommands, RiAtLine } from 'react-icons/ri';
import type { Fragment } from '@/types/playbook';
import GutterMarker from '@/components/atoms/GutterMarker';
import GmailBar from './GmailBar';
import Toolbar from './Toolbar';
import ChatBar from './ChatBar';
import CoachmarkTriggers from './CoachmarkTriggers';
import EditorLine, { PaletteRequest } from './EditorLine';
import CommandPalette from './CommandPalette';
import ConditionBlock from './condition/ConditionBlock';
import SimulatePanel from '@/components/simulate/SimulatePanel';
import { REFERENCE_ID } from './paletteCatalog';
import { useEditorDoc } from './useEditorDoc';
import {
  LineTarget,
  makeChip,
  makeRef,
  txt,
  normalizeLine,
  lineIsEmpty,
  isCondition,
  type EditorDoc,
} from './doc';
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

const TRIGGER_PLACEHOLDER = 'e.g. When an email reports an API error';
// Step placeholder - teaches BOTH triggers as small keys (the disappearing-
// placeholder fix). '/' for actions, '@' to reference. Recurs on every empty line.
const STEP_PLACEHOLDER = (
  <>
    Write in natural language, or
    <span className={styles.keyPill} aria-hidden><RiSlashCommands /></span>
    for actions and
    <span className={styles.keyPill} aria-hidden><RiAtLine /></span>
    to reference
  </>
);

interface Props {
  /** Optional starting document. Omit for a fresh empty playbook (/canvas);
   *  /api-example passes the seeded example. */
  initialDoc?: EditorDoc;
}

export default function EditorCanvas({ initialDoc }: Props) {
  const api = useEditorDoc(initialDoc);
  const { doc } = api;

  const [palette, setPalette] = useState<PaletteState | null>(null);
  const [focusReq, setFocusReq] = useState<FocusReq | null>(null);
  const [simOpen, setSimOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const tokenRef = useRef(0);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lineKey = (t: LineTarget) =>
    t.kind === 'trigger'
      ? 'trigger'
      : t.kind === 'cond'
        ? `cond:${t.condId}:${t.branchId}:${t.part}`
        : `step:${t.id}`;

  // Ask a line to take the caret. The matching line focuses itself (mount or
  // update), so this works even for a step that was just created.
  const requestFocus = useCallback((key: string, atStart: boolean) => {
    tokenRef.current += 1;
    setFocusReq({ key, atStart, token: tokenRef.current });
  }, []);

  // Ephemeral "coming soon" toast for chrome actions not wired in this prototype
  // (Activate / Back / Docs) so a click registers as intentional, not a no-op.
  const showHint = useCallback((msg: string) => {
    setHint(msg);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), 2600);
  }, []);

  const focusFor = (key: string): { token: number; atStart: boolean } | null =>
    focusReq && focusReq.key === key ? { token: focusReq.token, atStart: focusReq.atStart } : null;

  const lineFrags = (t: LineTarget): Fragment[] => {
    if (t.kind === 'trigger') return doc.trigger;
    if (t.kind === 'cond') {
      const step = doc.steps.find((s) => s.id === t.condId);
      if (!step || !isCondition(step)) return [];
      const b = step.branches.find((br) => br.id === t.branchId);
      if (!b) return [];
      return (t.part === 'expr' ? b.condition : b.body) ?? [];
    }
    const step = doc.steps.find((s) => s.id === t.id);
    return step && !isCondition(step) ? step.body : [];
  };

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
    if (t.kind === 'cond') return; // lines inside a condition block don't add steps on Enter
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
  // keystroke (NN/g - never make the key the only path). Inserts at line end.
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
    // "Condition" is a block, not an inline chip: swap an empty line in-place,
    // otherwise insert the block after the current step.
    if (actionId === 'condition') {
      setPalette(null);
      if (target.kind === 'step') {
        const src = doc.steps.find((s) => s.id === target.id);
        if (src && !isCondition(src) && lineIsEmpty(src.body)) api.replaceWithCondition(target.id);
        else api.insertConditionAfter(target.id);
      } else if (target.kind === 'cond') {
        api.insertConditionAfter(target.condId);
      } else {
        api.insertConditionAfter();
      }
      return;
    }
    // 'reference' inserts an @-reference token (meta = the ref path); everything
    // else an action chip, with the picked value (if any) as the chip's meta.
    const inserted = actionId === REFERENCE_ID ? makeRef(meta ?? '') : makeChip(actionId, meta);
    const frags = lineFrags(target);
    const out: Fragment[] = [];
    frags.forEach((f, i) => {
      if (i === req.fragIndex && f.kind === 'text') {
        // Split the text at the caret and drop the chip between the halves.
        // NO inserted space characters - gap before/after a chip is owned by the
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
        onActivate={() => showHint('Activation is coming soon.')}
        onBack={() => showHint('Your playbook list is coming soon.')}
        onManual={() => showHint('Documentation is coming soon.')}
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
                  <h2 className={styles.label}>When should this run?</h2>
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
                  <h2 className={styles.label}>What should it do?</h2>
                </div>
              </div>

              <ol className={styles.steps}>
                {doc.steps.map((step, i) => {
                  // Condition block: rendered by ConditionBlock, with each branch's
                  // expression + body line as real EditorLines wired to 'cond' targets.
                  if (isCondition(step)) {
                    return (
                      <li key={step.id} className={styles.row}>
                        <span className={styles.gutter}>
                          <GutterMarker n={i + 1} />
                        </span>
                        <div className={styles.content}>
                          <ConditionBlock
                            branches={step.branches}
                            onAddBranch={(type) => {
                              const bid = api.addBranch(step.id, type);
                              requestFocus(
                                lineKey({
                                  kind: 'cond',
                                  condId: step.id,
                                  branchId: bid,
                                  part: type === 'else' ? 'body' : 'expr',
                                }),
                                true,
                              );
                            }}
                            onChangeBranchType={(branchId, type) => api.changeBranchType(step.id, branchId, type)}
                            onDeleteBranch={(branchId) => api.deleteBranch(step.id, branchId)}
                            renderExpr={(b) => {
                              const ct: LineTarget = { kind: 'cond', condId: step.id, branchId: b.id, part: 'expr' };
                              return (
                                <EditorLine
                                  fragments={b.condition ?? []}
                                  placeholder="condition"
                                  onChange={handleChange(ct)}
                                  onRequestPalette={openPalette(ct)}
                                  onBackspaceEmpty={b.type === 'if' ? undefined : () => api.deleteBranch(step.id, b.id)}
                                  autoFocus={focusFor(lineKey(ct))}
                                  ariaLabel={`${b.type} condition`}
                                />
                              );
                            }}
                            renderBody={(b) => {
                              const bt: LineTarget = { kind: 'cond', condId: step.id, branchId: b.id, part: 'body' };
                              return (
                                <EditorLine
                                  fragments={b.body}
                                  placeholder={STEP_PLACEHOLDER}
                                  onChange={handleChange(bt)}
                                  onRequestPalette={openPalette(bt)}
                                  autoFocus={focusFor(lineKey(bt))}
                                  ariaLabel={`${b.type} action`}
                                />
                              );
                            }}
                          />
                        </div>
                      </li>
                    );
                  }

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

      {hint && (
        <div className={styles.toast} role="status">
          {hint}
        </div>
      )}
    </div>
  );
}
