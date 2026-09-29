'use client';

import { useSyncExternalStore } from 'react';
import { type EditorDoc, lineHasContent, stepHasContent } from '@/components/flow01/doc';

/**
 * The skills a user creates, kept across pages and reloads. Frontend-only mock
 * (like connectorHealth): in memory + localStorage, one source of truth for the
 * Skills list and the editor.
 *
 * Two demo workspaces share the store: `demo` (/aops, which also lists the
 * seeded fixtures) and `empty` (/aops/empty, a workspace that starts with no
 * skills). A skill remembers which one it was made in, so the list and the
 * editor's Back agree on where it lives.
 */
export type Workspace = 'demo' | 'empty';

export interface SavedSkill {
  id: string;
  workspace: Workspace;
  doc: EditorDoc;
  createdAt: number;
  updatedAt: number;
}

interface State {
  skills: SavedSkill[];
  /** Seeded fixture rows the user deleted from the demo list. */
  deletedSeeds: string[];
}

const STORAGE_KEY = 'hiver.playbooks.skills.v1';
const EMPTY: State = { skills: [], deletedSeeds: [] };

let state: State = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as State) };
  } catch {
    /* corrupted or blocked storage - start clean */
  }
}

function commit(next: State) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable - the in-memory copy still works this session */
  }
  listeners.forEach((l) => l());
}

// Hydrate at module load on the client, so the first client snapshot is final.
if (typeof window !== 'undefined') hydrate();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => state;
const getServerSnapshot = () => EMPTY;

/** Live store (re-renders on any change). The server render sees it empty. */
export function useSkillsStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function getSkill(id: string): SavedSkill | undefined {
  hydrate();
  return state.skills.find((s) => s.id === id);
}

/** Worth saving: a title, a trigger, or any step. An untouched canvas is not. */
export function docHasContent(doc: EditorDoc): boolean {
  return (
    (doc.title.trim() !== '' && doc.title !== 'Untitled skill') ||
    lineHasContent(doc.trigger) ||
    doc.steps.some(stepHasContent)
  );
}

export function createSkill(workspace: Workspace, doc: EditorDoc): SavedSkill {
  hydrate();
  const now = Date.now();
  const skill: SavedSkill = {
    id: `sk-${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    workspace,
    doc,
    createdAt: now,
    updatedAt: now,
  };
  commit({ ...state, skills: [skill, ...state.skills] });
  return skill;
}

export function saveSkill(id: string, doc: EditorDoc) {
  hydrate();
  const cur = state.skills.find((s) => s.id === id);
  if (!cur || cur.doc === doc) return;
  commit({
    ...state,
    skills: state.skills.map((s) => (s.id === id ? { ...s, doc, updatedAt: Date.now() } : s)),
  });
}

export function deleteSkill(id: string) {
  hydrate();
  commit({ ...state, skills: state.skills.filter((s) => s.id !== id) });
}

export function deleteSeed(id: string) {
  hydrate();
  if (state.deletedSeeds.includes(id)) return;
  commit({ ...state, deletedSeeds: [...state.deletedSeeds, id] });
}

/** Where a workspace's list lives. */
export function listHref(workspace: Workspace): string {
  return workspace === 'empty' ? '/aops/empty' : '/aops';
}

/** Back to how the workspace ships: the empty one with no skills, the demo one
 *  with just its seeded fixtures (deleted seeds restored). */
export function resetWorkspace(workspace: Workspace) {
  hydrate();
  commit({
    skills: state.skills.filter((s) => s.workspace !== workspace),
    deletedSeeds: workspace === 'demo' ? [] : state.deletedSeeds,
  });
}
