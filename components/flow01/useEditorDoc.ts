'use client';

import { useCallback, useMemo, useReducer, useRef } from 'react';
import type { Fragment } from '@/types/playbook';
import {
  EditorDoc,
  DocStep,
  Branch,
  BranchType,
  DocPatch,
  Guardrails,
  LineTarget,
  applyDocPatch,
  cloneStep,
  emptyDoc,
  newId,
  normalizeLine,
  lineHasContent,
  lineIsEmpty,
  isCondition,
  makeCondition,
  newBranch,
  newBranchLine,
  stepHasContent,
  txt,
} from './doc';

// ---------------------------------------------------------------------------
// Editor document state + undo/redo history.
// Text typing on a single line coalesces into one history entry; structural
// edits (insert chip, add/delete step) each create a discrete entry.
// ---------------------------------------------------------------------------

interface HistoryState {
  past: EditorDoc[];
  present: EditorDoc;
  future: EditorDoc[];
  // coalesce key of the change that produced `present` (for text-typing merge)
  lastKey: string | null;
}

type Action =
  | { type: 'commit'; next: EditorDoc; key: string | null }
  | { type: 'undo' }
  | { type: 'redo' };

const LIMIT = 100;

function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case 'commit': {
      const coalesce = action.key != null && action.key === state.lastKey;
      const past = coalesce ? state.past : [...state.past, state.present].slice(-LIMIT);
      return { past, present: action.next, future: [], lastKey: action.key };
    }
    case 'undo': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1]!;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        lastKey: null,
      };
    }
    case 'redo': {
      if (state.future.length === 0) return state;
      const next = state.future[0]!;
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
        lastKey: null,
      };
    }
    default:
      return state;
  }
}

// A new step line appears ONLY when the user presses Enter - we never auto-grow
// the procedure as content is typed. The one exception is a trailing condition
// block: a condition is a structural block you can't press Enter to escape, so it
// always keeps a normal empty line below it to continue the procedure.
function withTrailingEmpty(doc: EditorDoc): EditorDoc {
  const last = doc.steps[doc.steps.length - 1];
  if (last && isCondition(last)) {
    return { ...doc, steps: [...doc.steps, { id: newId('step'), body: [txt('')] }] };
  }
  return doc;
}

function replaceLine(doc: EditorDoc, target: LineTarget, frags: Fragment[]): EditorDoc {
  const body = normalizeLine(frags);
  if (target.kind === 'trigger') return { ...doc, trigger: body };
  // A line inside a condition block: the branch's expression or its body line.
  if (target.kind === 'cond') {
    return {
      ...doc,
      steps: doc.steps.map((s) => {
        if (s.id !== target.condId || !isCondition(s)) return s;
        return {
          ...s,
          branches: s.branches.map((b) => {
            if (b.id !== target.branchId) return b;
            if (target.part === 'expr') return { ...b, condition: body };
            const lid = target.lineId ?? b.lines[0]?.id;
            return {
              ...b,
              lines: b.lines.map((ln) => (ln.id === lid ? { ...ln, body } : ln)),
            };
          }),
        };
      }),
    };
  }
  // A normal top-level step line.
  return {
    ...doc,
    steps: doc.steps.map((s) => (s.id === target.id && !isCondition(s) ? { ...s, body } : s)),
  };
}

function getLine(doc: EditorDoc, target: LineTarget): Fragment[] {
  if (target.kind === 'trigger') return doc.trigger;
  if (target.kind === 'cond') {
    const step = doc.steps.find((s) => s.id === target.condId);
    if (!step || !isCondition(step)) return [];
    const branch = step.branches.find((b) => b.id === target.branchId);
    if (!branch) return [];
    if (target.part === 'expr') return branch.condition ?? [];
    const lid = target.lineId ?? branch.lines[0]?.id;
    return branch.lines.find((ln) => ln.id === lid)?.body ?? [];
  }
  const step = doc.steps.find((s) => s.id === target.id);
  return step && !isCondition(step) ? step.body : [];
}

export interface EditorApi {
  doc: EditorDoc;
  canUndo: boolean;
  canRedo: boolean;
  isValid: boolean;
  /** Replace a line's fragments. `coalesceKey` merges consecutive edits into one undo. */
  setLine: (target: LineTarget, frags: Fragment[], coalesceKey?: string) => void;
  setTitle: (title: string) => void;
  /** Update the playbook's guardrails (tone / custom instructions). Coalesces. */
  setGuardrails: (patch: Partial<Guardrails>) => void;
  /** Set the shared mailboxes the playbook will be enabled on. */
  setMailboxes: (ids: string[]) => void;
  /** Set how the playbook is triggered (automatic vs manual). */
  setTriggerMode: (mode: EditorDoc['triggerMode']) => void;
  /** Go live: status -> 'active'. */
  enable: () => void;
  /** Stop: status -> 'paused' (instant; undoable). */
  pause: () => void;
  /** Replace the WHOLE document (used by the cold-start "draft with AI" flow to
   *  seed a generated playbook into the blank canvas). Undoable back to the blank. */
  loadDoc: (doc: EditorDoc) => void;
  /** Apply a Copilot-proposed change as ONE undo entry (so a single undo reverts
   *  the whole applied change). The doc only changes when the user clicks Apply. */
  applyPatch: (patch: DocPatch) => void;
  /** Insert a step after the given step id (or at end if omitted). Returns the new id. */
  addStepAfter: (afterId?: string) => string;
  /** Delete a step by id. Returns the id of the step to focus next (prev/next), or null. */
  deleteStep: (id: string) => string | null;
  /** Duplicate a step (deep clone, fresh ids) below it. Returns the new id. */
  duplicateStep: (id: string) => string | null;
  /** Move a step to a gap index (0..N) in the current order - drag-and-drop reorder. */
  moveStep: (id: string, toIndex: number) => void;
  /** Nudge a step up (-1) or down (+1) - the row menu's Move up / Move down. */
  moveStepBy: (id: string, delta: number) => void;
  /** Insert a fresh condition block after a step (or at end). Returns the condition id. */
  insertConditionAfter: (afterId?: string) => string;
  /** Swap an empty step in-place for a fresh condition block. Returns the condition id. */
  replaceWithCondition: (stepId: string) => string;
  /** Append an ELSE-IF / ELSE arm to a condition. Returns the new branch. */
  addBranch: (condId: string, type: BranchType) => Branch;
  /** Re-pick a decided arm's type (else-if <-> else; else terminates the chain). */
  changeBranchType: (condId: string, branchId: string, type: BranchType) => void;
  /** Remove an arm (never the last/only one). */
  deleteBranch: (condId: string, branchId: string) => void;
  /** Add an empty action line after a line in a branch body. Returns the new line id. */
  addBranchLine: (condId: string, branchId: string, afterLineId: string) => string;
  /** Remove a body line (never the last one). Returns the id of the line to focus. */
  removeBranchLine: (condId: string, branchId: string, lineId: string) => string | null;
  undo: () => void;
  redo: () => void;
}

export function useEditorDoc(initial?: EditorDoc): EditorApi {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    past: [],
    present: withTrailingEmpty(initial ?? emptyDoc()),
    future: [],
    lastKey: null,
  }));

  const docRef = useRef(state.present);
  docRef.current = state.present;

  // Every commit normalizes the trailing line: a condition block always keeps an
  // empty line below it to type into (it can't be escaped with Enter); normal
  // steps do not auto-append - a new line appears only on Enter.
  // We also mirror the committed doc into docRef SYNCHRONOUSLY (not just on the
  // next render), so two commits fired back-to-back in one tick chain correctly -
  // the second reads the first's result instead of the stale pre-commit doc.
  const commit = useCallback((next: EditorDoc, key: string | null) => {
    const wrapped = withTrailingEmpty(next);
    docRef.current = wrapped;
    dispatch({ type: 'commit', next: wrapped, key });
  }, []);

  const setLine = useCallback(
    (target: LineTarget, frags: Fragment[], coalesceKey?: string) => {
      commit(replaceLine(docRef.current, target, frags), coalesceKey ?? null);
    },
    [commit],
  );

  const setTitle = useCallback(
    (title: string) => {
      commit({ ...docRef.current, title }, 'title');
    },
    [commit],
  );

  const setGuardrails = useCallback(
    (patch: Partial<Guardrails>) => {
      const doc = docRef.current;
      commit({ ...doc, guardrails: { ...doc.guardrails, ...patch } }, 'guardrails');
    },
    [commit],
  );

  const setMailboxes = useCallback(
    (ids: string[]) => {
      commit({ ...docRef.current, mailboxes: ids }, null);
    },
    [commit],
  );

  const setTriggerMode = useCallback(
    (mode: EditorDoc['triggerMode']) => {
      commit({ ...docRef.current, triggerMode: mode }, null);
    },
    [commit],
  );

  const enable = useCallback(() => {
    commit({ ...docRef.current, status: 'active' }, null);
  }, [commit]);

  const pause = useCallback(() => {
    commit({ ...docRef.current, status: 'paused' }, null);
  }, [commit]);

  const loadDoc = useCallback(
    (next: EditorDoc) => {
      // Discrete history entry: the prior (blank) doc lands in `past`, so undo
      // returns the user to an empty canvas if they don't want the draft.
      commit(next, null);
    },
    [commit],
  );

  // A Copilot-proposed patch, applied as a single discrete history entry so one
  // undo reverts the whole change (the patch is append-only, so it is safe on any
  // doc state). A patch ending in a condition keeps an empty line below it.
  const applyPatch = useCallback(
    (patch: DocPatch) => {
      commit(applyDocPatch(docRef.current, patch), null);
    },
    [commit],
  );

  const addStepAfter = useCallback(
    (afterId?: string) => {
      const id = newId('step');
      const step: DocStep = { id, body: [txt('')] };
      const doc = docRef.current;
      const idx = afterId ? doc.steps.findIndex((s) => s.id === afterId) : doc.steps.length - 1;
      const steps = [...doc.steps];
      steps.splice(idx + 1, 0, step);
      commit({ ...doc, steps }, null);
      return id;
    },
    [commit],
  );

  const deleteStep = useCallback(
    (id: string) => {
      const doc = docRef.current;
      if (doc.steps.length <= 1) return null; // never drop the last step
      const idx = doc.steps.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      const steps = doc.steps.filter((s) => s.id !== id);
      commit({ ...doc, steps }, null);
      const focusIdx = idx > 0 ? idx - 1 : 0;
      return steps[focusIdx]?.id ?? null;
    },
    [commit],
  );

  // Duplicate a step (deep clone with fresh ids) directly below it. Returns the
  // new id. Used by the row 3-dot menu.
  const duplicateStep = useCallback(
    (id: string) => {
      const doc = docRef.current;
      const idx = doc.steps.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      const clone = cloneStep(doc.steps[idx]!);
      const steps = [...doc.steps];
      steps.splice(idx + 1, 0, clone);
      commit({ ...doc, steps }, null);
      return clone.id;
    },
    [commit],
  );

  // Reorder: move a step to `toIndex` (the gap index 0..N in the CURRENT order).
  // Drag-and-drop uses this; the standard remove-then-insert index adjustment
  // keeps it correct whether the step moves up or down. No-op if it lands in place.
  const moveStep = useCallback(
    (id: string, toIndex: number) => {
      const doc = docRef.current;
      const from = doc.steps.findIndex((s) => s.id === id);
      if (from === -1) return;
      if (toIndex === from || toIndex === from + 1) return; // dropped where it already is
      const arr = [...doc.steps];
      const [item] = arr.splice(from, 1);
      const insertAt = Math.max(0, Math.min(toIndex > from ? toIndex - 1 : toIndex, arr.length));
      arr.splice(insertAt, 0, item!);
      commit({ ...doc, steps: arr }, null);
    },
    [commit],
  );

  // Nudge a step up or down by one (the 3-dot menu's Move up / Move down).
  const moveStepBy = useCallback(
    (id: string, delta: number) => {
      const doc = docRef.current;
      const from = doc.steps.findIndex((s) => s.id === id);
      const to = from + delta;
      if (from === -1 || to < 0 || to >= doc.steps.length) return;
      const arr = [...doc.steps];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item!);
      commit({ ...doc, steps: arr }, null);
    },
    [commit],
  );

  const insertConditionAfter = useCallback(
    (afterId?: string) => {
      const cond = makeCondition();
      const doc = docRef.current;
      const idx = afterId ? doc.steps.findIndex((s) => s.id === afterId) : doc.steps.length - 1;
      const steps = [...doc.steps];
      steps.splice(idx + 1, 0, cond);
      commit({ ...doc, steps }, null);
      return cond.id;
    },
    [commit],
  );

  // Swap an (empty) normal step in-place for a fresh condition block - used when
  // the palette's "Condition" is picked on an empty line, in one commit.
  const replaceWithCondition = useCallback(
    (stepId: string) => {
      const cond = makeCondition();
      const doc = docRef.current;
      const steps = doc.steps.map((s) => (s.id === stepId ? cond : s));
      commit({ ...doc, steps }, null);
      return cond.id;
    },
    [commit],
  );

  const addBranch = useCallback(
    (condId: string, type: BranchType) => {
      const branch = newBranch(type);
      const doc = docRef.current;
      const steps = doc.steps.map((s) =>
        s.id === condId && isCondition(s) ? { ...s, branches: [...s.branches, branch] } : s,
      );
      commit({ ...doc, steps }, null);
      return branch;
    },
    [commit],
  );

  const changeBranchType = useCallback(
    (condId: string, branchId: string, type: BranchType) => {
      const doc = docRef.current;
      const steps = doc.steps.map((s) => {
        if (s.id !== condId || !isCondition(s)) return s;
        const idx = s.branches.findIndex((b) => b.id === branchId);
        if (idx < 0) return s;
        let branches = s.branches.map((b, i) =>
          i === idx
            ? { ...b, type, condition: type === 'else' ? undefined : b.condition ?? [txt('')] }
            : b,
        );
        if (type === 'else') branches = branches.slice(0, idx + 1); // else terminates
        return { ...s, branches };
      });
      commit({ ...doc, steps }, null);
    },
    [commit],
  );

  const deleteBranch = useCallback(
    (condId: string, branchId: string) => {
      const doc = docRef.current;
      const steps = doc.steps.map((s) => {
        if (s.id !== condId || !isCondition(s) || s.branches.length <= 1) return s;
        const target = s.branches.find((b) => b.id === branchId);
        // Never strand the block without an IF - it is the anchor arm.
        if (!target || target.type === 'if') return s;
        return { ...s, branches: s.branches.filter((b) => b.id !== branchId) };
      });
      commit({ ...doc, steps }, null);
    },
    [commit],
  );

  // Add an empty action line after `afterLineId` in a branch body (Enter on a body
  // line). Returns the new line id so the caller can focus it. Arms hold plain
  // step lines only - never a nested condition.
  const addBranchLine = useCallback(
    (condId: string, branchId: string, afterLineId: string): string => {
      const line = newBranchLine();
      const doc = docRef.current;
      const steps = doc.steps.map((s) => {
        if (s.id !== condId || !isCondition(s)) return s;
        return {
          ...s,
          branches: s.branches.map((b) => {
            if (b.id !== branchId) return b;
            const idx = b.lines.findIndex((ln) => ln.id === afterLineId);
            const at = idx === -1 ? b.lines.length : idx + 1;
            const lines = [...b.lines];
            lines.splice(at, 0, line);
            return { ...b, lines };
          }),
        };
      });
      commit({ ...doc, steps }, null);
      return line.id;
    },
    [commit],
  );

  // Remove a body line from a branch (Backspace on an empty body line when the arm
  // has more than one). Never removes the arm's last line. Returns the id of the
  // line to focus next (the previous, else the next), or null if nothing changed.
  const removeBranchLine = useCallback(
    (condId: string, branchId: string, lineId: string): string | null => {
      let focusId: string | null = null;
      const doc = docRef.current;
      const steps = doc.steps.map((s) => {
        if (s.id !== condId || !isCondition(s)) return s;
        return {
          ...s,
          branches: s.branches.map((b) => {
            if (b.id !== branchId || b.lines.length <= 1) return b;
            const idx = b.lines.findIndex((ln) => ln.id === lineId);
            if (idx === -1) return b;
            focusId = (b.lines[idx - 1] ?? b.lines[idx + 1])?.id ?? null;
            return { ...b, lines: b.lines.filter((ln) => ln.id !== lineId) };
          }),
        };
      });
      if (focusId) commit({ ...doc, steps }, null);
      return focusId;
    },
    [commit],
  );

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  const isValid = useMemo(() => {
    const triggerOk = lineHasContent(state.present.trigger);
    const aStepOk = state.present.steps.some((s) => stepHasContent(s));
    return triggerOk && aStepOk;
  }, [state.present]);

  return {
    doc: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    isValid,
    setLine,
    setTitle,
    setGuardrails,
    setMailboxes,
    setTriggerMode,
    enable,
    pause,
    loadDoc,
    applyPatch,
    addStepAfter,
    deleteStep,
    duplicateStep,
    moveStep,
    moveStepBy,
    insertConditionAfter,
    replaceWithCondition,
    addBranch,
    changeBranchType,
    deleteBranch,
    addBranchLine,
    removeBranchLine,
    undo,
    redo,
  };
}

// Re-exported for line components.
export { getLine, lineIsEmpty };
