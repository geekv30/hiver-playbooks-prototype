'use client';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { Playbook, Chip, ChipStatus, TraceEntry, AnyStep, Step, Frag } from './data';
import { WALK_JAPAN_SEED, MOCK_TRACE_OUTPUTS, findAction } from './data';
import { insertChipAtTextOffset } from './dom-parse';

export type CanvasMode =
  | 'edit'
  | 'test-idle'
  | 'test-running'
  | 'test-done'
  | 'run'
  | 'clean-wipe';

export type ActivationState =
  | { status: 'draft' }
  | { status: 'publishing'; mailboxes: string[] }
  | { status: 'live'; mailboxes: string[] };

export interface SlashState {
  stepId: string;
  anchor: { top: number; left: number };
  textOffset: number;
  query: string;
}

export interface RefPickerState {
  /** "trigger" or a step id */
  target: 'trigger' | string;
  anchor: { top: number; left: number };
  textOffset: number;
  query: string;
}

export interface CanvasState {
  playbook: Playbook;
  mode: CanvasMode;
  trace: TraceEntry[];
  history: { past: Playbook[]; future: Playbook[] };
  cleanWipeSnapshot: Playbook | null;
  activation: ActivationState;
  configChipId: string | null;
  tagPickerChipId: string | null;
  paletteCollapsed: boolean;
  testOutcome: 'pending' | 'pass' | 'fail' | 'cancelled' | null;
  chipStatusOverride: Record<string, ChipStatus>;
  autosaveTick: number;
  slash: SlashState | null;
  refPicker: RefPickerState | null;
}

const HISTORY_CAP = 50;

type Action =
  | { type: 'mutate'; updater: (pb: Playbook) => Playbook }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'setMode'; mode: CanvasMode }
  | { type: 'setTrace'; trace: TraceEntry[] }
  | { type: 'appendTrace'; entry: TraceEntry }
  | { type: 'setChipStatus'; chipId: string; status: ChipStatus }
  | { type: 'resetChipStatuses' }
  | { type: 'setTestOutcome'; outcome: CanvasState['testOutcome'] }
  | { type: 'enterCleanWipe' }
  | { type: 'exitCleanWipe' }
  | { type: 'setConfigChipId'; id: string | null }
  | { type: 'setTagPickerChipId'; id: string | null }
  | { type: 'togglePalette' }
  | { type: 'setActivation'; activation: ActivationState }
  | { type: 'autosaveBump' }
  | { type: 'openSlash'; payload: SlashState }
  | { type: 'updateSlashQuery'; query: string }
  | { type: 'closeSlash' }
  | { type: 'openRef'; payload: RefPickerState }
  | { type: 'updateRefQuery'; query: string }
  | { type: 'closeRef' };

function reducer(state: CanvasState, action: Action): CanvasState {
  switch (action.type) {
    case 'mutate': {
      const next = action.updater(state.playbook);
      if (next === state.playbook) return state;
      const past = [...state.history.past, state.playbook].slice(-HISTORY_CAP);
      return {
        ...state,
        playbook: next,
        history: { past, future: [] },
        autosaveTick: state.autosaveTick + 1,
      };
    }
    case 'undo': {
      const past = state.history.past;
      if (!past.length) return state;
      const prev = past[past.length - 1]!;
      return {
        ...state,
        playbook: prev,
        history: {
          past: past.slice(0, -1),
          future: [state.playbook, ...state.history.future],
        },
        autosaveTick: state.autosaveTick + 1,
      };
    }
    case 'redo': {
      const future = state.history.future;
      if (!future.length) return state;
      const next = future[0]!;
      return {
        ...state,
        playbook: next,
        history: {
          past: [...state.history.past, state.playbook].slice(-HISTORY_CAP),
          future: future.slice(1),
        },
        autosaveTick: state.autosaveTick + 1,
      };
    }
    case 'setMode':            return { ...state, mode: action.mode };
    case 'setTrace':           return { ...state, trace: action.trace };
    case 'appendTrace':        return { ...state, trace: [...state.trace, action.entry] };
    case 'setChipStatus':
      return { ...state, chipStatusOverride: { ...state.chipStatusOverride, [action.chipId]: action.status } };
    case 'resetChipStatuses':  return { ...state, chipStatusOverride: {} };
    case 'setTestOutcome':     return { ...state, testOutcome: action.outcome };
    case 'enterCleanWipe': {
      const snapshot = state.playbook;
      const wiped: Playbook = {
        ...state.playbook,
        steps: [{ id: 'cw-1', kind: 'action', fragments: [{ kind: 'text', text: '' }] }],
      };
      return { ...state, mode: 'clean-wipe', cleanWipeSnapshot: snapshot, playbook: wiped };
    }
    case 'exitCleanWipe': {
      if (!state.cleanWipeSnapshot) return state;
      return { ...state, mode: 'edit', playbook: state.cleanWipeSnapshot, cleanWipeSnapshot: null };
    }
    case 'setConfigChipId':    return { ...state, configChipId: action.id };
    case 'setTagPickerChipId': return { ...state, tagPickerChipId: action.id };
    case 'togglePalette':      return { ...state, paletteCollapsed: !state.paletteCollapsed };
    case 'setActivation':      return { ...state, activation: action.activation };
    case 'autosaveBump':       return { ...state, autosaveTick: state.autosaveTick + 1 };
    case 'openSlash':          return { ...state, slash: action.payload };
    case 'updateSlashQuery':   return { ...state, slash: state.slash ? { ...state.slash, query: action.query } : null };
    case 'closeSlash':         return { ...state, slash: null };
    case 'openRef':            return { ...state, refPicker: action.payload };
    case 'updateRefQuery':     return { ...state, refPicker: state.refPicker ? { ...state.refPicker, query: action.query } : null };
    case 'closeRef':           return { ...state, refPicker: null };
    default:                   return state;
  }
}

const INITIAL_STATE: CanvasState = {
  playbook: WALK_JAPAN_SEED,
  mode: 'edit',
  trace: [],
  history: { past: [], future: [] },
  cleanWipeSnapshot: null,
  activation: { status: 'draft' },
  configChipId: null,
  tagPickerChipId: null,
  paletteCollapsed: false,
  testOutcome: null,
  chipStatusOverride: {},
  autosaveTick: 0,
  slash: null,
  refPicker: null,
};

/* ============================================================ */
/* Helpers — walk steps                                           */
/* ============================================================ */
export function flattenActionSteps(steps: AnyStep[]): { stepId: string; chipIds: string[] }[] {
  const out: { stepId: string; chipIds: string[] }[] = [];
  const visit = (s: AnyStep) => {
    if (s.kind === 'action') {
      const chipIds = s.fragments.filter((f) => f.kind === 'chip').map((f) => (f as { kind: 'chip'; chip: Chip }).chip.id);
      if (chipIds.length) out.push({ stepId: s.id, chipIds });
    } else if (s.kind === 'condition') {
      for (const b of s.branches) for (const bs of b.steps) visit(bs);
    }
  };
  for (const s of steps) visit(s);
  return out;
}

export function findChip(steps: AnyStep[], chipId: string): Chip | null {
  for (const s of steps) {
    if (s.kind === 'action') {
      for (const f of s.fragments) {
        if (f.kind === 'chip' && f.chip.id === chipId) return f.chip;
      }
    } else if (s.kind === 'condition') {
      for (const b of s.branches) {
        for (const bs of b.steps) {
          if (bs.kind === 'action') {
            for (const f of bs.fragments) if (f.kind === 'chip' && f.chip.id === chipId) return f.chip;
          }
        }
      }
    }
  }
  return null;
}

export function updateChip(pb: Playbook, chipId: string, patch: Partial<Chip>): Playbook {
  const mapSteps = (steps: AnyStep[]): AnyStep[] => steps.map((s) => {
    if (s.kind === 'action') {
      return {
        ...s,
        fragments: s.fragments.map((f) =>
          f.kind === 'chip' && f.chip.id === chipId ? { ...f, chip: { ...f.chip, ...patch } } : f
        ),
      };
    }
    if (s.kind === 'condition') {
      return {
        ...s,
        branches: s.branches.map((b) => ({ ...b, steps: mapSteps(b.steps) as Step[] })),
      };
    }
    return s;
  });
  return { ...pb, steps: mapSteps(pb.steps) };
}

/* ============================================================ */
/* Hook                                                            */
/* ============================================================ */
export function useCanvasState() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const testTimerRef = useRef<number | null>(null);

  const mutate = useCallback((updater: (pb: Playbook) => Playbook) => {
    dispatch({ type: 'mutate', updater });
  }, []);

  const setName = useCallback((name: string) => {
    mutate((pb) => ({ ...pb, frontmatter: { ...pb.frontmatter, name } }));
  }, [mutate]);

  const setSummary = useCallback((summary: string) => {
    mutate((pb) => ({ ...pb, frontmatter: { ...pb.frontmatter, summary } }));
  }, [mutate]);

  const updateChipById = useCallback((chipId: string, patch: Partial<Chip>) => {
    mutate((pb) => updateChip(pb, chipId, patch));
  }, [mutate]);

  const insertAction = useCallback((actionId: string, afterStepId?: string) => {
    const action = findAction(actionId);
    if (!action) return;
    mutate((pb) => {
      const chipId = `c-${Date.now()}`;
      const stepId = `step-${Date.now()}`;
      const newChip: Chip = { id: chipId, actionId, status: 'idle', meta: action.defaultMeta };
      const newStep: Step = {
        id: stepId,
        kind: 'action',
        fragments: [{ kind: 'chip', chip: newChip }],
      };

      // T1.4 — if there's an empty action step, REPLACE it instead of adding alongside
      const emptyIdx = pb.steps.findIndex((s) =>
        s.kind === 'action' &&
        !s.fragments.some((f) => f.kind === 'chip') &&
        !s.fragments.some((f) => f.kind === 'text' && f.text.trim().length > 0) &&
        !s.fragments.some((f) => f.kind === 'ref' || f.kind === 'code')
      );
      if (emptyIdx >= 0 && !afterStepId) {
        const arr = [...pb.steps];
        arr[emptyIdx] = { ...newStep, id: pb.steps[emptyIdx]!.id };
        return { ...pb, steps: arr };
      }

      if (afterStepId) {
        const idx = pb.steps.findIndex((s) => s.id === afterStepId);
        if (idx >= 0) {
          return { ...pb, steps: [...pb.steps.slice(0, idx + 1), newStep, ...pb.steps.slice(idx + 1)] };
        }
      }
      // default: insert before the trailing end step if present
      const lastIdx = pb.steps.length - 1;
      const last = pb.steps[lastIdx];
      if (last && last.kind === 'end') {
        return { ...pb, steps: [...pb.steps.slice(0, lastIdx), newStep, last] };
      }
      return { ...pb, steps: [...pb.steps, newStep] };
    });
  }, [mutate]);

  const insertEmptyStep = useCallback((afterStepId?: string) => {
    mutate((pb) => {
      const stepId = `step-${Date.now()}`;
      const newStep: Step = {
        id: stepId,
        kind: 'action',
        fragments: [{ kind: 'text', text: '' }],
      };
      if (afterStepId) {
        const idx = pb.steps.findIndex((s) => s.id === afterStepId);
        if (idx >= 0) {
          return { ...pb, steps: [...pb.steps.slice(0, idx + 1), newStep, ...pb.steps.slice(idx + 1)] };
        }
      }
      const lastIdx = pb.steps.length - 1;
      const last = pb.steps[lastIdx];
      if (last && last.kind === 'end') {
        return { ...pb, steps: [...pb.steps.slice(0, lastIdx), newStep, last] };
      }
      return { ...pb, steps: [...pb.steps, newStep] };
    });
  }, [mutate]);

  const removeStep = useCallback((stepId: string) => {
    mutate((pb) => ({ ...pb, steps: pb.steps.filter((s) => s.id !== stepId) }));
  }, [mutate]);

  const moveStepUp = useCallback((stepId: string) => {
    mutate((pb) => {
      const idx = pb.steps.findIndex((s) => s.id === stepId);
      if (idx <= 0) return pb;
      const arr = [...pb.steps];
      const prev = arr[idx - 1]!;
      const cur = arr[idx]!;
      arr[idx - 1] = cur;
      arr[idx] = prev;
      return { ...pb, steps: arr };
    });
  }, [mutate]);

  /**
   * Move a step to a specific index in the steps array.
   * Used by drag-and-drop.
   * The targetIndex is the index where the step should land AFTER removal.
   * If null, places before the trailing End marker (or at end).
   */
  const moveStepToIndex = useCallback((stepId: string, targetIndex: number | null) => {
    mutate((pb) => {
      const fromIdx = pb.steps.findIndex((s) => s.id === stepId);
      if (fromIdx < 0) return pb;
      const arr = pb.steps.filter((s) => s.id !== stepId);
      const movedStep = pb.steps[fromIdx]!;
      // Cap targetIndex so it can't land after End
      const lastIdx = arr.length;
      const last = arr[arr.length - 1];
      const ceiling = last && last.kind === 'end' ? lastIdx - 1 : lastIdx;
      let dropAt = targetIndex == null ? ceiling : targetIndex;
      if (fromIdx < (targetIndex ?? Infinity)) {
        // when removing an item BEFORE the target index, the target shifts down by 1
        dropAt = Math.max(0, dropAt - 1);
      }
      dropAt = Math.min(Math.max(0, dropAt), ceiling);
      arr.splice(dropAt, 0, movedStep);
      return { ...pb, steps: arr };
    });
  }, [mutate]);

  const moveStepDown = useCallback((stepId: string) => {
    mutate((pb) => {
      const idx = pb.steps.findIndex((s) => s.id === stepId);
      if (idx < 0) return pb;
      // cannot move past the trailing end marker
      const lastIdx = pb.steps.length - 1;
      const last = pb.steps[lastIdx];
      const stopAt = last && last.kind === 'end' ? lastIdx - 1 : lastIdx;
      if (idx >= stopAt) return pb;
      const arr = [...pb.steps];
      const cur = arr[idx]!;
      const next = arr[idx + 1]!;
      arr[idx] = next;
      arr[idx + 1] = cur;
      return { ...pb, steps: arr };
    });
  }, [mutate]);

  const setStepFragments = useCallback((stepId: string, fragments: Frag[]) => {
    mutate((pb) => ({
      ...pb,
      steps: pb.steps.map((s) =>
        s.id === stepId && s.kind === 'action' ? { ...s, fragments } : s
      ),
    }));
  }, [mutate]);

  const setTriggerFragments = useCallback((fragments: Frag[]) => {
    mutate((pb) => ({
      ...pb,
      frontmatter: { ...pb.frontmatter, triggerFragments: fragments },
    }));
  }, [mutate]);

  const insertChipInStepAtOffset = useCallback((stepId: string, actionId: string, textOffset: number) => {
    const action = findAction(actionId);
    if (!action) return;
    const chip: Chip = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actionId,
      status: 'idle',
      meta: action.defaultMeta,
    };
    mutate((pb) => ({
      ...pb,
      steps: pb.steps.map((s) => {
        if (s.id !== stepId || s.kind !== 'action') return s;
        const fragmentTextLen = (f: Frag) => {
          if (f.kind === 'text') return f.text.length;
          if (f.kind === 'chip') {
            const a = findAction(f.chip.actionId);
            const brand = a?.brand ? `${a.brand} · ` : '';
            return `${brand}${a?.verb ?? ''}${f.chip.meta ?? ''}`.length;
          }
          if (f.kind === 'ref')  return f.refPath.length;
          if (f.kind === 'code') return f.code.length;
          return 0;
        };
        return { ...s, fragments: insertChipAtTextOffset(s.fragments, chip, textOffset, fragmentTextLen) };
      }),
    }));
  }, [mutate]);

  const openSlash = useCallback((payload: SlashState) => dispatch({ type: 'openSlash', payload }), []);
  const updateSlashQuery = useCallback((query: string) => dispatch({ type: 'updateSlashQuery', query }), []);
  const closeSlash = useCallback(() => dispatch({ type: 'closeSlash' }), []);

  const openRef = useCallback((payload: RefPickerState) => dispatch({ type: 'openRef', payload }), []);
  const updateRefQuery = useCallback((query: string) => dispatch({ type: 'updateRefQuery', query }), []);
  const closeRef = useCallback(() => dispatch({ type: 'closeRef' }), []);

  const insertRefInStepAtOffset = useCallback((stepId: string, refPath: string, textOffset: number) => {
    mutate((pb) => ({
      ...pb,
      steps: pb.steps.map((s) => {
        if (s.id !== stepId || s.kind !== 'action') return s;
        const fragmentTextLen = (f: Frag) => {
          if (f.kind === 'text') return f.text.length;
          if (f.kind === 'ref')  return f.refPath.length;
          if (f.kind === 'code') return f.code.length;
          if (f.kind === 'chip') {
            const a = findAction(f.chip.actionId);
            const brand = a?.brand ? `${a.brand} · ` : '';
            return `${brand}${a?.verb ?? ''}${f.chip.meta ?? ''}`.length;
          }
          return 0;
        };
        // Walk fragments and insert ref at the offset, splitting any text fragment
        const next: Frag[] = [];
        let running = 0;
        let inserted = false;
        for (const f of s.fragments) {
          const flen = fragmentTextLen(f);
          if (!inserted && textOffset <= running + flen) {
            if (f.kind === 'text') {
              const splitAt = Math.max(0, textOffset - running);
              const left = f.text.slice(0, splitAt);
              const right = f.text.slice(splitAt);
              if (left) next.push({ kind: 'text', text: left });
              next.push({ kind: 'ref', refPath });
              if (right) next.push({ kind: 'text', text: right });
            } else {
              next.push({ kind: 'ref', refPath });
              next.push(f);
            }
            inserted = true;
          } else {
            next.push(f);
            running += flen;
          }
        }
        if (!inserted) next.push({ kind: 'ref', refPath });
        return { ...s, fragments: next };
      }),
    }));
  }, [mutate]);

  const insertRefInTriggerAtOffset = useCallback((refPath: string, textOffset: number) => {
    mutate((pb) => {
      const fragmentTextLen = (f: Frag) => {
        if (f.kind === 'text') return f.text.length;
        if (f.kind === 'ref')  return f.refPath.length;
        if (f.kind === 'code') return f.code.length;
        return 0;
      };
      const next: Frag[] = [];
      let running = 0;
      let inserted = false;
      for (const f of pb.frontmatter.triggerFragments) {
        const flen = fragmentTextLen(f);
        if (!inserted && textOffset <= running + flen) {
          if (f.kind === 'text') {
            const splitAt = Math.max(0, textOffset - running);
            const left = f.text.slice(0, splitAt);
            const right = f.text.slice(splitAt);
            if (left) next.push({ kind: 'text', text: left });
            next.push({ kind: 'ref', refPath });
            if (right) next.push({ kind: 'text', text: right });
          } else {
            next.push({ kind: 'ref', refPath });
            next.push(f);
          }
          inserted = true;
        } else {
          next.push(f);
          running += flen;
        }
      }
      if (!inserted) next.push({ kind: 'ref', refPath });
      return { ...pb, frontmatter: { ...pb.frontmatter, triggerFragments: next } };
    });
  }, [mutate]);

  /* ============================================================ */
  /* Condition branch + sub-step mutations                          */
  /* ============================================================ */

  const addBranch = useCallback((condStepId: string) => {
    mutate((pb) => ({
      ...pb,
      steps: pb.steps.map((s) => {
        if (s.id !== condStepId || s.kind !== 'condition') return s;
        const newBranch = {
          id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label: 'else if',
          predicate: 'new_field == "value"',
          steps: [] as Step[],
        };
        // Insert new branch BEFORE the existing default ("else") branch if present
        const branches = [...s.branches];
        const elseIdx = branches.findIndex((b) => b.label === 'else' || !b.predicate);
        if (elseIdx >= 0) {
          branches.splice(elseIdx, 0, newBranch);
        } else {
          branches.push(newBranch);
        }
        return { ...s, branches };
      }),
    }));
  }, [mutate]);

  const removeBranch = useCallback((condStepId: string, branchId: string) => {
    mutate((pb) => ({
      ...pb,
      steps: pb.steps.map((s) => {
        if (s.id !== condStepId || s.kind !== 'condition') return s;
        // can't remove default branch
        const branch = s.branches.find((b) => b.id === branchId);
        if (!branch || branch.label === 'else') return s;
        return { ...s, branches: s.branches.filter((b) => b.id !== branchId) };
      }),
    }));
  }, [mutate]);

  const addStepInBranch = useCallback((condStepId: string, branchId: string) => {
    mutate((pb) => ({
      ...pb,
      steps: pb.steps.map((s) => {
        if (s.id !== condStepId || s.kind !== 'condition') return s;
        return {
          ...s,
          branches: s.branches.map((b) => {
            if (b.id !== branchId) return b;
            const newStep: Step = {
              id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              kind: 'action',
              fragments: [{ kind: 'text', text: '' }],
            };
            return { ...b, steps: [...b.steps, newStep] };
          }),
        };
      }),
    }));
  }, [mutate]);

  const removeStepInBranch = useCallback((condStepId: string, branchId: string, stepId: string) => {
    mutate((pb) => ({
      ...pb,
      steps: pb.steps.map((s) => {
        if (s.id !== condStepId || s.kind !== 'condition') return s;
        return {
          ...s,
          branches: s.branches.map((b) =>
            b.id !== branchId ? b : { ...b, steps: b.steps.filter((bs) => bs.id !== stepId) }
          ),
        };
      }),
    }));
  }, [mutate]);

  const moveStepInBranch = useCallback((condStepId: string, branchId: string, stepId: string, dir: -1 | 1) => {
    mutate((pb) => ({
      ...pb,
      steps: pb.steps.map((s) => {
        if (s.id !== condStepId || s.kind !== 'condition') return s;
        return {
          ...s,
          branches: s.branches.map((b) => {
            if (b.id !== branchId) return b;
            const idx = b.steps.findIndex((bs) => bs.id === stepId);
            if (idx < 0) return b;
            const next = idx + dir;
            if (next < 0 || next >= b.steps.length) return b;
            const arr = [...b.steps];
            const a = arr[idx]!;
            const c = arr[next]!;
            arr[idx] = c;
            arr[next] = a;
            return { ...b, steps: arr };
          }),
        };
      }),
    }));
  }, [mutate]);

  const setStepFragmentsInBranch = useCallback((condStepId: string, branchId: string, stepId: string, fragments: Frag[]) => {
    mutate((pb) => ({
      ...pb,
      steps: pb.steps.map((s) => {
        if (s.id !== condStepId || s.kind !== 'condition') return s;
        return {
          ...s,
          branches: s.branches.map((b) =>
            b.id !== branchId ? b : { ...b, steps: b.steps.map((bs) => bs.id === stepId ? { ...bs, fragments } : bs) }
          ),
        };
      }),
    }));
  }, [mutate]);

  const duplicateStep = useCallback((stepId: string) => {
    mutate((pb) => {
      const idx = pb.steps.findIndex((s) => s.id === stepId);
      if (idx < 0) return pb;
      const source = pb.steps[idx]!;
      if (source.kind === 'end') return pb;
      // clone with new ids
      const newId = `step-${Date.now()}`;
      let clone: AnyStep;
      if (source.kind === 'action') {
        clone = {
          ...source,
          id: newId,
          fragments: source.fragments.map((f) => {
            if (f.kind === 'chip') {
              return { kind: 'chip', chip: { ...f.chip, id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, status: 'idle' } };
            }
            return f;
          }),
        };
      } else {
        // condition
        clone = {
          ...source,
          id: newId,
          branches: source.branches.map((b) => ({
            ...b,
            id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            steps: b.steps.map((bs) => ({
              ...bs,
              id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              fragments: bs.fragments.map((f) =>
                f.kind === 'chip'
                  ? { kind: 'chip' as const, chip: { ...f.chip, id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, status: 'idle' as const } }
                  : f
              ),
            })),
          })),
        };
      }
      return { ...pb, steps: [...pb.steps.slice(0, idx + 1), clone, ...pb.steps.slice(idx + 1)] };
    });
  }, [mutate]);

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const setMode = useCallback((mode: CanvasMode) => dispatch({ type: 'setMode', mode }), []);
  const setConfigChipId = useCallback((id: string | null) => dispatch({ type: 'setConfigChipId', id }), []);
  const setTagPickerChipId = useCallback((id: string | null) => dispatch({ type: 'setTagPickerChipId', id }), []);
  const togglePalette = useCallback(() => dispatch({ type: 'togglePalette' }), []);

  const stopTest = useCallback(() => {
    if (testTimerRef.current) {
      window.clearTimeout(testTimerRef.current);
      testTimerRef.current = null;
    }
    dispatch({ type: 'setMode', mode: 'test-done' });
    dispatch({ type: 'setTestOutcome', outcome: 'cancelled' });
  }, []);

  const runTest = useCallback(() => {
    dispatch({ type: 'setTrace', trace: [] });
    dispatch({ type: 'resetChipStatuses' });
    dispatch({ type: 'setTestOutcome', outcome: 'pending' });
    dispatch({ type: 'setMode', mode: 'test-running' });

    // Walk steps sequentially. For Condition steps, simulate taking the YES branch (Walk Japan happy path).
    // For Wait/End: status reaches `ok` instantly (mocked).
    // We use a flat ordered list of (stepId, chipId) pairs for simplicity.
    const order: { stepId: string; chipId: string; isElseSkipped?: boolean }[] = [];
    const collect = (steps: AnyStep[]) => {
      for (const s of steps) {
        if (s.kind === 'action') {
          const chipFrag = s.fragments.find((f) => f.kind === 'chip');
          if (chipFrag && chipFrag.kind === 'chip') {
            order.push({ stepId: s.id, chipId: chipFrag.chip.id });
          }
        } else if (s.kind === 'condition') {
          const yes = s.branches.find((b) => b.label === 'yes' || b.label === 'true');
          const no  = s.branches.find((b) => b.label === 'no'  || b.label === 'false');
          if (yes) collect(yes.steps);
          if (no) {
            for (const ns of no.steps) {
              if (ns.kind === 'action') {
                const cf = ns.fragments.find((f) => f.kind === 'chip');
                if (cf && cf.kind === 'chip') order.push({ stepId: ns.id, chipId: cf.chip.id, isElseSkipped: true });
              }
            }
          }
        }
      }
    };
    collect(INITIAL_STATE.playbook.steps); // use snapshot pattern — execute against current playbook
    // Actually walk the LIVE playbook, not the initial seed
    order.length = 0;
    collect(state.playbook.steps);

    let i = 0;
    const STEP_MS = 500;
    const tick = () => {
      if (i >= order.length) {
        dispatch({ type: 'setMode', mode: 'test-done' });
        dispatch({ type: 'setTestOutcome', outcome: 'pass' });
        return;
      }
      const cur = order[i]!;
      if (cur.isElseSkipped) {
        dispatch({ type: 'setChipStatus', chipId: cur.chipId, status: 'skipped' });
        dispatch({ type: 'appendTrace', entry: {
          stepId: cur.stepId, chipId: cur.chipId, status: 'skipped',
          input: '(branch not taken)', output: '(skipped)',
        }});
        i++;
        testTimerRef.current = window.setTimeout(tick, 100);
        return;
      }
      dispatch({ type: 'setChipStatus', chipId: cur.chipId, status: 'running' });
      testTimerRef.current = window.setTimeout(() => {
        // 10% chance of seeded error on step-08 (Airtable HTTP) for realism
        const isError = cur.chipId === 'c-08' && Math.random() < 0.0; // disabled by default; flip to 0.15 to seed errors
        const finalStatus: ChipStatus = isError ? 'error' : 'ok';
        dispatch({ type: 'setChipStatus', chipId: cur.chipId, status: finalStatus });
        const mock = MOCK_TRACE_OUTPUTS[cur.chipId] || { input: '—', output: '—' };
        dispatch({ type: 'appendTrace', entry: {
          stepId: cur.stepId, chipId: cur.chipId, status: finalStatus,
          durationMs: STEP_MS - 50,
          input: mock.input, output: mock.output,
          ...(isError ? { errorMessage: 'mock error: connection timeout' } : {}),
        }});
        if (isError) {
          dispatch({ type: 'setMode', mode: 'test-done' });
          dispatch({ type: 'setTestOutcome', outcome: 'fail' });
          return;
        }
        i++;
        testTimerRef.current = window.setTimeout(tick, 100);
      }, STEP_MS);
    };
    testTimerRef.current = window.setTimeout(tick, 200);
  }, [state.playbook.steps]);

  const replayTest = useCallback(() => {
    dispatch({ type: 'resetChipStatuses' });
    dispatch({ type: 'setTrace', trace: [] });
    runTest();
  }, [runTest]);

  const exitTest = useCallback(() => {
    if (testTimerRef.current) {
      window.clearTimeout(testTimerRef.current);
      testTimerRef.current = null;
    }
    dispatch({ type: 'resetChipStatuses' });
    dispatch({ type: 'setTrace', trace: [] });
    dispatch({ type: 'setTestOutcome', outcome: null });
    dispatch({ type: 'setMode', mode: 'edit' });
  }, []);

  const enterCleanWipe = useCallback(() => dispatch({ type: 'enterCleanWipe' }), []);
  const exitCleanWipe  = useCallback(() => dispatch({ type: 'exitCleanWipe' }), []);

  const setActivation = useCallback((activation: ActivationState) => dispatch({ type: 'setActivation', activation }), []);

  // Cleanup test timer on unmount
  useEffect(() => () => {
    if (testTimerRef.current) window.clearTimeout(testTimerRef.current);
  }, []);

  return {
    ...state,
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
    setName,
    setSummary,
    updateChipById,
    insertAction,
    insertEmptyStep,
    removeStep,
    moveStepUp,
    moveStepDown,
    moveStepToIndex,
    duplicateStep,
    setStepFragments,
    setTriggerFragments,
    addBranch,
    removeBranch,
    addStepInBranch,
    removeStepInBranch,
    moveStepInBranch,
    setStepFragmentsInBranch,
    insertChipInStepAtOffset,
    insertRefInStepAtOffset,
    insertRefInTriggerAtOffset,
    openSlash,
    updateSlashQuery,
    closeSlash,
    openRef,
    updateRefQuery,
    closeRef,
    undo,
    redo,
    setMode,
    setConfigChipId,
    setTagPickerChipId,
    togglePalette,
    runTest,
    stopTest,
    replayTest,
    exitTest,
    enterCleanWipe,
    exitCleanWipe,
    setActivation,
  };
}

export function getChipStatus(state: CanvasState, chip: Chip): ChipStatus {
  return state.chipStatusOverride[chip.id] ?? chip.status;
}
