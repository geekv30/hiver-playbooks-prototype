'use client';

// useTriggerScan - the scan behind the "Matching emails" evaluation type.
//
// The backend contract this models, surfaced honestly in the UI:
//   - scope is ONE shared mailbox at a time,
//   - a batch reads the 50 most recent unscanned emails,
//   - AI compares each one against the trigger,
//   - no matches means the next batch, up to a ceiling of 200,
//   - the scan stops at the first batch that produces matches.
// `more()` is how the user goes deeper by hand: exactly one further batch,
// offered after every scan, matches or not, until the ceiling.
//
// The hook lives at canvas level (not inside the flow) because two other
// surfaces read it: the count badge on the Evaluation tab, and Copilot's
// handoff message after it drafts a skill.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SimEmail } from '@/data/simFixtures';
import { SCAN_BATCH, SCAN_CEILING, matchesTrigger, poolForMailbox } from '@/data/matchPool';

export type ScanPhase = 'idle' | 'scanning' | 'settled';

export interface ScanState {
  phase: ScanPhase;
  /** The mailbox this scan covers (one at a time). */
  mailboxId: string | null;
  /** How many emails have been read so far, of the ceiling. */
  scanned: number;
  /** Matches found so far, newest first. */
  matches: SimEmail[];
  /** The trigger text this scan ran against - a later edit makes it stale. */
  triggerAtScan: string;
  /** True once the ceiling is reached: there is nothing deeper to read. */
  exhausted: boolean;
  /** The user cleared this scan on purpose (to pick a different mailbox), so
   *  nothing may start another one for them - only an explicit `start`. */
  cleared: boolean;
}

const IDLE: ScanState = {
  phase: 'idle',
  mailboxId: null,
  scanned: 0,
  matches: [],
  triggerAtScan: '',
  exhausted: false,
  cleared: false,
};

// Emails read per animation step, and the step interval. 10 every 90ms fills a
// 50-email batch in about half a second: fast enough not to stall the user,
// slow enough that the progress readout is legible rather than decorative.
const STEP = 10;
const STEP_MS = 90;

export interface TriggerScan {
  state: ScanState;
  /** Whether the live trigger has moved on since the scan ran. */
  stale: boolean;
  /** Matched-email count once a scan has settled, else null (for the badge). */
  badge: number | null;
  /** Scan a mailbox from the top. Restarts any scan in flight. */
  start: (mailboxId: string) => void;
  /** Read one more batch of 50, up to the ceiling. */
  more: () => void;
  /** Abandon a scan in flight, keeping what it found. */
  cancel: () => void;
  /** Clear everything (leaving the flow, or a mailbox change). */
  reset: () => void;
}

export function useTriggerScan(trigger: string): TriggerScan {
  const [state, setState] = useState<ScanState>(IDLE);
  // Latest-refs, written after commit (never during render) so the interval
  // callback and `more()` always read the freshest state and trigger.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pool = useRef<SimEmail[]>([]);
  const endAt = useRef(0); // where this run must stop reading
  const auto = useRef(true); // true = walk batches until a hit; false = one batch
  const batchHits = useRef(0); // matches found in the batch being read
  const triggerRef = useRef(trigger);
  useEffect(() => {
    triggerRef.current = trigger;
  }, [trigger]);

  const clear = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);
  useEffect(() => clear, [clear]);

  const reduced = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  const matchesIn = useCallback(
    (from: number, to: number) =>
      pool.current.slice(from, to).filter((e) => matchesTrigger(e, triggerRef.current)),
    [],
  );

  const run = useCallback(
    (mailboxId: string, from: number, until: number, keep: SimEmail[], continuous: boolean) => {
      clear();
      pool.current = poolForMailbox(mailboxId);
      endAt.current = until;
      auto.current = continuous;
      batchHits.current = 0;

      if (reduced()) {
        let scanned = from;
        const found = [...keep];
        while (scanned < until) {
          const next = Math.min(scanned + SCAN_BATCH, until);
          const hits = matchesIn(scanned, next);
          found.push(...hits);
          scanned = next;
          if (hits.length > 0) break;
        }
        setState({
          phase: 'settled',
          mailboxId,
          scanned,
          matches: found,
          triggerAtScan: triggerRef.current,
          exhausted: scanned >= SCAN_CEILING,
          cleared: false,
        });
        return;
      }

      setState({
        phase: 'scanning',
        mailboxId,
        scanned: from,
        matches: keep,
        triggerAtScan: triggerRef.current,
        exhausted: false,
        cleared: false,
      });

      timer.current = setInterval(() => {
        setState((prev) => {
          if (prev.phase !== 'scanning') return prev;
          const next = Math.min(prev.scanned + STEP, endAt.current);
          const hits = matchesIn(prev.scanned, next);
          batchHits.current += hits.length;
          const matches = hits.length > 0 ? [...prev.matches, ...hits] : prev.matches;
          const atBatchEnd = next % SCAN_BATCH === 0 || next >= endAt.current;
          // Settle when this run's window is done, or at the end of a batch
          // that found something. Otherwise roll into the next batch.
          const settle = next >= endAt.current || (atBatchEnd && batchHits.current > 0);
          if (settle) {
            clear();
            return {
              ...prev,
              phase: 'settled',
              scanned: next,
              matches,
              exhausted: next >= SCAN_CEILING,
            };
          }
          if (atBatchEnd) batchHits.current = 0;
          return { ...prev, scanned: next, matches };
        });
      }, STEP_MS);
    },
    [clear, matchesIn],
  );

  const start = useCallback(
    (mailboxId: string) => {
      if (!mailboxId || !triggerRef.current.trim()) return;
      // Continuous: batch after batch until one produces matches, or the ceiling.
      run(mailboxId, 0, SCAN_CEILING, [], true);
    },
    [run],
  );

  const more = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'scanning' || !s.mailboxId || s.scanned >= SCAN_CEILING) return;
    const until = Math.min(s.scanned + SCAN_BATCH, SCAN_CEILING);
    run(s.mailboxId, s.scanned, until, s.matches, false);
  }, [run]);

  const cancel = useCallback(() => {
    clear();
    setState((prev) =>
      prev.phase === 'scanning'
        ? { ...prev, phase: 'settled', exhausted: prev.scanned >= SCAN_CEILING }
        : prev,
    );
  }, [clear]);

  const reset = useCallback(() => {
    clear();
    setState({ ...IDLE, cleared: true });
  }, [clear]);

  const stale = state.phase === 'settled' && state.triggerAtScan.trim() !== trigger.trim();
  const badge = state.phase === 'settled' && !stale ? state.matches.length : null;

  return { state, stale, badge, start, more, cancel, reset };
}
