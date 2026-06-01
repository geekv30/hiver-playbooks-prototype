'use client';

import { useCallback, useMemo, useReducer, useRef } from 'react';
import type { Fragment } from '@/types/playbook';
import {
  EditorDoc,
  DocStep,
  LineTarget,
  emptyDoc,
  newId,
  normalizeLine,
  lineHasContent,
  lineIsEmpty,
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
  if (last && lineHasContent(last.body)) {
    return { ...doc, steps: [...doc.steps, { id: newId('step'), body: [txt('')] }] };
  }
  return doc;
}

function replaceLine(doc: EditorDoc, target: LineTarget, frags: Fragment[]): EditorDoc {
  const body = normalizeLine(frags);
  if (target.kind === 'trigger') return { ...doc, trigger: body };
  return {
    ...doc,
    steps: doc.steps.map((s) => (s.id === target.id ? { ...s, body } : s)),
  };
}

function getLine(doc: EditorDoc, target: LineTarget): Fragment[] {
  return target.kind === 'trigger'
    ? doc.trigger
    : doc.steps.find((s) => s.id === target.id)?.body ?? [];
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
  undo: () => void;
  redo: () => void;
}

export function useEditorDoc(initial?: EditorDoc): EditorApi {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    past: [],
    present: initial ?? emptyDoc(),
    future: [],
    lastKey: null,
  }));

  const docRef = useRef(state.present);
  docRef.current = state.present;

  const commit = useCallback((next: EditorDoc, key: string | null) => {
    dispatch({ type: 'commit', next, key });
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

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  const isValid = useMemo(() => {
    const triggerOk = lineHasContent(state.present.trigger);
    const aStepOk = state.present.steps.some((s) => lineHasContent(s.body));
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
    undo,
    redo,
  };
}

// Re-exported for line components.
export { getLine, lineIsEmpty };
