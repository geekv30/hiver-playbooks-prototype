import type { Playbook } from '@/types/playbook';

const KEY = 'hiver.playbooks.walkjapan.v1';

export function loadPlaybook(seed: Playbook): Playbook {
  if (typeof window === 'undefined') return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Playbook;
    if (parsed.version !== 1) return seed;
    return parsed;
  } catch {
    return seed;
  }
}

export function savePlaybook(playbook: Playbook): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(playbook));
  } catch {
    // quota or disabled - silent in v1
  }
}

export function clearPlaybook(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // silent
  }
}
