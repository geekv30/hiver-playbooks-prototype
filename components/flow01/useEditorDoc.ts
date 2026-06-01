'use client';

import { useCallback, useMemo, useReducer, useRef } from 'react';
import type { Fragment } from '@/types/playbook';
import {
  EditorDoc,
  DocStep,
  BranchType,
  LineTarget,
  emptyDoc,
  newId,
  normalizeLine,
  lineHasContent,
  lineIsEmpty,
  isCondition,
  makeCondition,
  newBranch,
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

// Keep a trailing empty step so there is ALWAYS an "add the next step" line at
// the bottom (carrying the + affordance and the placeholder). When the last step
// gains content, a fresh empty one is appended below it.
function withTrailingEmpty(doc: EditorDoc): EditorDoc {
  const last = doc.steps[doc.steps.length - 1];
  if (last && stepHasContent(last)) {
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
          branches: s.branches.map((b) =>
            b.id !== target.branchId
              ? b
              : target.part === 'expr'
                ? { ...b, condition: body }
                : { ...b, body },
          ),
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
    return (target.part === 'expr' ? branch.condition : branch.body) ?? [];
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
  /** Insert a step after the given step id (or at end if omitted). Returns the new id. */
  addStepAfter: (afterId?: string) => string;
  /** Delete a step by id. Returns the id of the step to focus next (prev/next), or null. */
  deleteStep: (id: string) => string | null;
  /** Insert a fresh condition block after a step (or at end). Returns the condition id. */
  insertConditionAfter: (afterId?: string) => string;
  /** Swap an empty step in-place for a fresh condition block. Returns the condition id. */
  replaceWithCondition: (stepId: string) => string;
  /** Append an ELSE-IF / ELSE arm to a condition. Returns the new branch id. */
  addBranch: (condId: string, type: BranchType) => string;
  /** Re-pick a decided arm's type (else-if <-> else; else terminates the chain). */
  changeBranchType: (condId: string, branchId: string, type: BranchType) => void;
  /** Remove an arm (never the last/only one). */
  deleteBranch: (condId: string, branchId: string) => void;
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

  // Every commit guarantees a trailing empty step (the always-present "add the
  // next step" line), so structural edits like inserting a condition block keep
  // a line to type into below them.
  const commit = useCallback((next: EditorDoc, key: string | null) => {
    dispatch({ type: 'commit', next: withTrailingEmpty(next), key });
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
      return branch.id;
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
      const steps = doc.steps.map((s) =>
        s.id === condId && isCondition(s) && s.branches.length > 1
          ? { ...s, branches: s.branches.filter((b) => b.id !== branchId) }
          : s,
      );
      commit({ ...doc, steps }, null);
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
    addStepAfter,
    deleteStep,
    insertConditionAfter,
    replaceWithCondition,
    addBranch,
    changeBranchType,
    deleteBranch,
    undo,
    redo,
  };
}

// Re-exported for line components.
export { getLine, lineIsEmpty };
