'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Playbook, Step, Chip, ConditionBranch, Frontmatter, ConnectorSlug, Fragment,
} from '@/types/playbook';
import { loadPlaybook, savePlaybook, clearPlaybook } from '@/lib/persistence';
import { useDebouncedEffect } from './useDebounce';
import { WALK_JAPAN_PLAYBOOK } from '@/data/seed';
import { newId } from '@/lib/ids';

export type SaveStatus = 'idle' | 'saving' | 'saved';

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

// Recursively walk steps, applying fn. fn returns null to remove the step.
function mapSteps(steps: Step[], fn: (s: Step) => Step | null): Step[] {
  const out: Step[] = [];
  for (const s of steps) {
    const next = fn(s);
    if (next === null) continue;
    if (next.kind === 'condition') {
      next.branches = next.branches.map((b) => ({
        ...b,
        bodyFragments: b.bodyFragments, // fragments don't have nested steps
      }));
    }
    out.push(next);
  }
  return out;
}

// Walk all chips inside a step tree
function findChipInSteps(steps: Step[], chipId: string): { step: Step; chip: Chip } | null {
  for (const step of steps) {
    if (step.kind === 'action') {
      for (const f of step.fragments) {
        if (f.kind === 'chip' && f.chip.id === chipId) return { step, chip: f.chip };
      }
    } else if (step.kind === 'condition') {
      for (const f of step.exprFragments) {
        if (f.kind === 'chip' && f.chip.id === chipId) return { step, chip: f.chip };
      }
      for (const b of step.branches) {
        for (const f of b.exprFragments) {
          if (f.kind === 'chip' && f.chip.id === chipId) return { step, chip: f.chip };
        }
        for (const f of b.bodyFragments) {
          if (f.kind === 'chip' && f.chip.id === chipId) return { step, chip: f.chip };
        }
      }
    } else if (step.kind === 'approval') {
      for (const f of step.promptFragments) {
        if (f.kind === 'chip' && f.chip.id === chipId) return { step, chip: f.chip };
      }
    }
  }
  return null;
}

// Update a chip in-place anywhere in the step tree
function updateChipInFragments(fragments: Fragment[], chipId: string, patch: Partial<Chip>): Fragment[] {
  return fragments.map((f) => {
    if (f.kind === 'chip' && f.chip.id === chipId) {
      return { ...f, chip: { ...f.chip, ...patch } };
    }
    return f;
  });
}

function updateChipInSteps(steps: Step[], chipId: string, patch: Partial<Chip>): Step[] {
  return steps.map((s) => {
    if (s.kind === 'action') {
      return { ...s, fragments: updateChipInFragments(s.fragments, chipId, patch) };
    }
    if (s.kind === 'condition') {
      return {
        ...s,
        exprFragments: updateChipInFragments(s.exprFragments, chipId, patch),
        branches: s.branches.map((b) => ({
          ...b,
          exprFragments: updateChipInFragments(b.exprFragments, chipId, patch),
          bodyFragments: updateChipInFragments(b.bodyFragments, chipId, patch),
        })),
      };
    }
    if (s.kind === 'approval') {
      return { ...s, promptFragments: updateChipInFragments(s.promptFragments, chipId, patch) };
    }
    return s;
  });
}

export function usePlaybook() {
  // Initial state matches SSR exactly: always the seed. After mount we swap to
  // localStorage if it has a stored value. Reading localStorage in the useState
  // initializer causes hydration mismatches because SSR has no localStorage.
  const [playbook, setPlaybook] = useState<Playbook>(WALK_JAPAN_PLAYBOOK);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const dirtyRef = useRef(false);
  const hydratedRef = useRef(false);

  // Post-mount: hydrate from localStorage if present. This intentionally runs
  // once and swaps state, which causes one re-render. The hydratedRef gate
  // prevents the debounced-save effect from writing the seed back over the
  // stored value on the very first render.
  useEffect(() => {
    const stored = loadPlaybook(WALK_JAPAN_PLAYBOOK);
    if (stored !== WALK_JAPAN_PLAYBOOK) {
      setPlaybook(stored);
      setLastSavedAt(stored.updatedAt || Date.now());
    }
    hydratedRef.current = true;
  }, []);

  const commit = useCallback((next: Playbook) => {
    dirtyRef.current = true;
    setSaveStatus('saving');
    setPlaybook({ ...next, updatedAt: Date.now() });
  }, []);

  useDebouncedEffect(() => {
    if (!hydratedRef.current) return;
    if (!dirtyRef.current) return;
    savePlaybook(playbook);
    setLastSavedAt(Date.now());
    setSaveStatus('saved');
    dirtyRef.current = false;
  }, [playbook], 600);

  // 5s ticker so the topbar's "Saved Xs ago" updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 5000);
    return () => window.clearInterval(id);
  }, []);

  const setFrontmatter = useCallback((patch: Partial<Frontmatter>) => {
    commit({ ...playbook, frontmatter: { ...playbook.frontmatter, ...patch } });
  }, [playbook, commit]);

  const insertStep = useCallback((afterId: string | null, step: Step) => {
    const steps = clone(playbook.steps);
    if (afterId === null) {
      steps.unshift(step);
    } else {
      const idx = steps.findIndex((s) => s.id === afterId);
      if (idx === -1) steps.push(step);
      else steps.splice(idx + 1, 0, step);
    }
    commit({ ...playbook, steps });
  }, [playbook, commit]);

  const removeStep = useCallback((stepId: string) => {
    commit({ ...playbook, steps: playbook.steps.filter((s) => s.id !== stepId) });
  }, [playbook, commit]);

  const updateChip = useCallback((chipId: string, patch: Partial<Chip>) => {
    commit({ ...playbook, steps: updateChipInSteps(clone(playbook.steps), chipId, patch) });
  }, [playbook, commit]);

  const findChip = useCallback((chipId: string): Chip | null => {
    const res = findChipInSteps(playbook.steps, chipId);
    return res ? res.chip : null;
  }, [playbook]);

  const setCondExpr = useCallback((condId: string, exprFragments: Fragment[]) => {
    commit({
      ...playbook,
      steps: playbook.steps.map((s) => {
        if (s.kind !== 'condition' || s.id !== condId) return s;
        return { ...s, exprFragments };
      }),
    });
  }, [playbook, commit]);

  const setBranchExpression = useCallback((condId: string, branchId: string, exprFragments: Fragment[]) => {
    commit({
      ...playbook,
      steps: playbook.steps.map((s) => {
        if (s.kind !== 'condition' || s.id !== condId) return s;
        return { ...s, branches: s.branches.map((b) => b.id === branchId ? { ...b, exprFragments } : b) };
      }),
    });
  }, [playbook, commit]);

  const addBranch = useCallback((condId: string, tag: 'elseif' | 'else') => {
    commit({
      ...playbook,
      steps: playbook.steps.map((s) => {
        if (s.kind !== 'condition' || s.id !== condId) return s;
        const newBranch: ConditionBranch = {
          id: newId('br'),
          tag,
          exprFragments: tag === 'elseif' ? [{ kind: 'text', text: '' }] : [],
          bodyFragments: [],
        };
        // ELSE always last; ELSE IF positions before any ELSE
        const elseIdx = s.branches.findIndex((b) => b.tag === 'else');
        const branches = [...s.branches];
        if (tag === 'else') {
          branches.push(newBranch);
        } else if (elseIdx === -1) {
          branches.push(newBranch);
        } else {
          branches.splice(elseIdx, 0, newBranch);
        }
        return { ...s, branches };
      }),
    });
  }, [playbook, commit]);

  const removeBranch = useCallback((condId: string, branchId: string) => {
    commit({
      ...playbook,
      steps: playbook.steps.map((s) => {
        if (s.kind !== 'condition' || s.id !== condId) return s;
        return { ...s, branches: s.branches.filter((b) => b.id !== branchId) };
      }),
    });
  }, [playbook, commit]);

  const setApprovalPrompt = useCallback((stepId: string, promptFragments: Fragment[]) => {
    commit({
      ...playbook,
      steps: playbook.steps.map((s) => {
        if (s.kind !== 'approval' || s.id !== stepId) return s;
        return { ...s, promptFragments };
      }),
    });
  }, [playbook, commit]);

  const setConnectorAuth = useCallback((slug: ConnectorSlug, authed: boolean, label?: string) => {
    commit({
      ...playbook,
      connectors: playbook.connectors.map((c) =>
        c.slug === slug ? { ...c, authed, accountLabel: label } : c,
      ),
    });
  }, [playbook, commit]);

  const setBindingActive = useCallback((mailboxId: string, active: boolean) => {
    commit({
      ...playbook,
      bindings: playbook.bindings.map((b) => b.mailboxId === mailboxId ? { ...b, active } : b),
    });
  }, [playbook, commit]);

  const reset = useCallback(() => {
    clearPlaybook();
    setPlaybook({ ...WALK_JAPAN_PLAYBOOK, updatedAt: Date.now() });
    setSaveStatus('saved');
    setLastSavedAt(Date.now());
    dirtyRef.current = false;
  }, []);

  return {
    playbook,
    saveStatus,
    lastSavedAt,
    setFrontmatter,
    insertStep,
    removeStep,
    updateChip,
    findChip,
    setCondExpr,
    setBranchExpression,
    addBranch,
    removeBranch,
    setApprovalPrompt,
    setConnectorAuth,
    setBindingActive,
    reset,
  };
}
