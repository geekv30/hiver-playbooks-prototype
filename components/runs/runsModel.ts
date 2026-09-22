// Derived state for the Runs surface. Pure selectors over SkillRun[] - the
// components render the result and compute nothing themselves.

import { NOW, type RunState, type SkillRun, type RevisionMark } from '@/data/runFixtures';

export const RUN_STATES: RunState[] = ['completed', 'awaiting', 'failed', 'declined'];

/** Labels, in one place, so the pill, the filter chip and the summary agree. */
export const RUN_STATE_LABEL: Record<RunState, string> = {
  completed: 'Completed',
  awaiting: 'Awaiting approval',
  failed: 'Failed',
  declined: 'Approval declined',
};

/** The short form, for tight spots (filter chips, the outcome bar legend). */
export const RUN_STATE_SHORT: Record<RunState, string> = {
  completed: 'Completed',
  awaiting: 'Awaiting',
  failed: 'Failed',
  declined: 'Declined',
};

export type RangeDays = 7 | 30 | 90;

export interface RunFilter {
  /** null = every state. */
  state: RunState | null;
  days: RangeDays;
  query: string;
  /** A single day (start-of-day ms) picked off the activity strip. */
  day: number | null;
  /** All-skills mode: narrow to one skill. */
  skillId: string | null;
}

export const DEFAULT_FILTER: RunFilter = {
  state: null,
  days: 30,
  query: '',
  day: null,
  skillId: null,
};

const DAY = 86_400_000;

export const startOfDay = (t: number): number => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function applyFilter(runs: SkillRun[], f: RunFilter): SkillRun[] {
  const cutoff = startOfDay(NOW) - (f.days - 1) * DAY;
  const q = f.query.trim().toLowerCase();
  return runs.filter((r) => {
    if (r.startedAt < cutoff) return false;
    if (f.skillId && r.skillId !== f.skillId) return false;
    if (f.state && r.state !== f.state) return false;
    if (f.day !== null && startOfDay(r.startedAt) !== f.day) return false;
    if (q) {
      const hay = `${r.subject} ${r.sender} ${r.senderEmail} ${r.conversationId} ${r.error?.code ?? ''}`;
      if (!hay.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export interface RunCounts {
  total: number;
  completed: number;
  awaiting: number;
  failed: number;
  declined: number;
}

export function countBy(runs: SkillRun[]): RunCounts {
  return runs.reduce<RunCounts>(
    (a, r) => ({ ...a, total: a.total + 1, [r.state]: a[r.state] + 1 }),
    { total: 0, completed: 0, awaiting: 0, failed: 0, declined: 0 },
  );
}

export interface DayBucket {
  day: number;
  counts: RunCounts;
}

/** One bucket per day across the window, including empty days - a gap in the
 *  strip is information, so days are never dropped. */
export function bucketByDay(runs: SkillRun[], days: number): DayBucket[] {
  const today = startOfDay(NOW);
  const out: DayBucket[] = [];
  const index = new Map<number, SkillRun[]>();
  for (const r of runs) {
    const d = startOfDay(r.startedAt);
    const list = index.get(d);
    if (list) list.push(r);
    else index.set(d, [r]);
  }
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = today - i * DAY;
    out.push({ day, counts: countBy(index.get(day) ?? []) });
  }
  return out;
}

/** A row in the list: a run, or the moment the skill changed. */
export type DayItem =
  | { kind: 'run'; at: number; run: SkillRun }
  | { kind: 'mark'; at: number; mark: RevisionMark };

export interface DayGroup {
  day: number;
  runs: SkillRun[];
  /** Runs and revision marks in one time-ordered sequence. */
  items: DayItem[];
}

/**
 * The run list, grouped by day (newest first), with revision marks placed by
 * time rather than pinned to the top of the day.
 *
 * The placement is the whole claim the marker makes - "runs below this ran on
 * the earlier version" is only true if the marker sits between the runs that
 * straddle the edit, not merely on the right date.
 */
export function groupByDay(runs: SkillRun[], marks: RevisionMark[] = []): DayGroup[] {
  const order: number[] = [];
  const index = new Map<number, SkillRun[]>();
  for (const r of runs) {
    const d = startOfDay(r.startedAt);
    const list = index.get(d);
    if (list) list.push(r);
    else {
      index.set(d, [r]);
      order.push(d);
    }
  }
  return order.map((day) => {
    const dayRuns = index.get(day)!;
    const items: DayItem[] = [
      ...dayRuns.map((run) => ({ kind: 'run' as const, at: run.startedAt, run })),
      ...marks
        .filter((m) => startOfDay(m.at) === day)
        .map((mark) => ({ kind: 'mark' as const, at: mark.at, mark })),
    ].sort((a, b) => b.at - a.at);
    return { day, runs: dayRuns, items };
  });
}

/** The dominant failure cause, when there is one worth naming. Drives the
 *  "3 failures, all HUBSPOT_401" line - the most actionable thing on the page. */
export function failureLead(
  runs: SkillRun[],
): { code: string; count: number; total: number } | null {
  const failed = runs.filter((r) => r.state === 'failed' && r.error);
  if (failed.length === 0) return null;
  const tally = new Map<string, number>();
  for (const r of failed) tally.set(r.error!.code, (tally.get(r.error!.code) ?? 0) + 1);
  const [code, count] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]!;
  return { code, count, total: failed.length };
}

/** How long the oldest pending approval has been waiting, in ms. */
export function oldestWait(runs: SkillRun[]): number | null {
  const waiting = runs.filter((r) => r.state === 'awaiting');
  if (waiting.length === 0) return null;
  return NOW - Math.min(...waiting.map((r) => r.startedAt));
}

/** Change against the preceding window of equal length. null when there is no
 *  prior window to compare with. */
export function trendPct(runs: SkillRun[], days: number): number | null {
  const today = startOfDay(NOW);
  const start = today - (days - 1) * DAY;
  const prevStart = start - days * DAY;
  const now = runs.filter((r) => r.startedAt >= start).length;
  const prev = runs.filter((r) => r.startedAt >= prevStart && r.startedAt < start).length;
  if (prev === 0) return null;
  return Math.round(((now - prev) / prev) * 100);
}

// --- Formatting -------------------------------------------------------------

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  return s < 10 ? `${s.toFixed(1)}s` : `${Math.round(s)}s`;
}

export function formatWait(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return 'under an hour';
  if (h < 24) return `${h} ${h === 1 ? 'hour' : 'hours'}`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? 'day' : 'days'}`;
}

export function formatTime(t: number): string {
  return new Date(t).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDayLabel(day: number): string {
  const today = startOfDay(NOW);
  if (day === today) return 'Today';
  if (day === today - DAY) return 'Yesterday';
  return new Date(day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDayShort(day: number): string {
  return new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(t: number): string {
  return `${new Date(t).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} at ${formatTime(t)}`;
}


// --- The lead line ----------------------------------------------------------
// One sentence for the window. It states what happened rather than ranking it:
// the outcome filters below carry the counts, and the run that matters is found
// by filtering to it, not by being named up here.

export interface LeadState {
  kind: 'idle' | 'clean' | 'unclean';
  title: string;
  body: string;
}

/**
 * The band's copy, in one place.
 *
 * The renderer and the design gallery read the same strings from here, so a
 * comparison of arrangements can never be a comparison of two different
 * sentences.
 */
export function leadState(counts: RunCounts, days: number): LeadState {
  if (counts.total === 0) {
    return {
      kind: 'idle',
      title: 'No runs yet',
      body: 'Runs appear here as soon as this skill fires on an email in one of its mailboxes.',
    };
  }
  if (counts.failed === 0 && counts.awaiting === 0) {
    return {
      kind: 'clean',
      title: 'Running normally',
      body: `${summaryLine(counts, days)} Nothing needs your attention.`,
    };
  }
  // A green tick over "Running normally" on a window with failures in it would
  // claim something the skill has not done.
  return { kind: 'unclean', title: 'Not everything ran cleanly', body: summaryLine(counts, days) };
}

/** The one-line summary of the window - what ran, and what did not land cleanly. */
export function summaryLine(counts: RunCounts, days: number): string {
  if (counts.total === 0) return `No runs in the last ${days} days.`;
  const ran = `${counts.completed} of ${counts.total} runs completed cleanly over the last ${days} days.`;
  const rest: string[] = [];
  if (counts.failed > 0) rest.push(`${counts.failed} failed`);
  if (counts.awaiting > 0) {
    rest.push(
      `${counts.awaiting} ${counts.awaiting === 1 ? 'reply is' : 'replies are'} waiting for approval`,
    );
  }
  return rest.length === 0 ? ran : `${ran} ${rest.join(', and ')}.`;
}
