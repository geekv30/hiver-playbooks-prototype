'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SIM_TRACE, type StepStatus } from './traceFixture';
import type { SimEmail, SimStatusKind } from '@/data/simFixtures';

export interface EmailRun {
  status: SimStatusKind; // idle | running | passed | failed | attention
  steps: Record<string, StepStatus>;
  durations: Record<string, number>; // actual per-step run duration (ms) THIS run
}

export type RunPhase = 'idle' | 'running' | 'done';

const STEP_IDS = SIM_TRACE.map((s) => s.id);
const LAST = STEP_IDS.length - 1;

function freshSteps(): Record<string, StepStatus> {
  return Object.fromEntries(STEP_IDS.map((id) => [id, 'pending'])) as Record<string, StepStatus>;
}
function emptyRun(): EmailRun {
  return { status: 'idle', steps: freshSteps(), durations: {} };
}
// The duration step i runs for THIS pass: the op's realistic base, jittered
// 0.8x-1.25x so no two runs are identical - a network call to HubSpot can
// linger, a local tag write is near-instant. The trace displays this exact
// value, so the number shown matches how long the step actually pulsed.
function stepDuration(i: number): number {
  const base = SIM_TRACE[i]!.ms;
  const jitter = 0.8 + Math.random() * 0.45; // 0.80x - 1.25x
  return Math.max(70, Math.round(base * jitter));
}

// Resolve an email's run UP FRONT: the final per-step status, the email's final
// status, and the last step the animation should walk to (after which the rest
// are filled in as their final state - e.g. skipped).
interface Resolved {
  finalStatus: SimStatusKind;
  stepFinal: Record<string, StepStatus>;
  lastIdx: number;
}
function resolveEmail(email: SimEmail): Resolved {
  const outcome = email.outcome ?? 'passed';
  const stepFinal: Record<string, StepStatus> = {};
  if (outcome === 'failed') {
    const failAt = email.failAt ?? LAST;
    STEP_IDS.forEach((id, i) => {
      stepFinal[id] = i < failAt ? 'done' : i === failAt ? 'failed' : 'skipped';
    });
    return { finalStatus: 'failed', stepFinal, lastIdx: failAt };
  }
  if (outcome === 'attention') {
    // Runs through the condition; the matched-branch step (last) is skipped.
    STEP_IDS.forEach((id, i) => {
      stepFinal[id] = i === LAST ? 'skipped' : 'done';
    });
    return { finalStatus: 'attention', stepFinal, lastIdx: Math.max(0, LAST - 1) };
  }
  STEP_IDS.forEach((id) => {
    stepFinal[id] = 'done';
  });
  return { finalStatus: 'passed', stepFinal, lastIdx: LAST };
}

/**
 * useSimRun - sequential run engine for a topic's emails.
 *
 * Emails run ONE AT A TIME: each step pending -> running -> its final state (done
 * / failed), then the next step; the email resolves to passed / failed / needs-
 * attention (scripted per the fixture), then the next email starts. Honours
 * prefers-reduced-motion (jump to resolved) and resets when the topic changes.
 */
export function useSimRun(
  emails: SimEmail[],
  /** Fired once when a run completes (never on stop): the per-email final
   *  statuses, in order - feeds the eval aggregate (useEvalState.recordRun). */
  onComplete?: (statuses: SimStatusKind[]) => void,
) {
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [runs, setRuns] = useState<Record<string, EmailRun>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ei = useRef(0); // email index
  const si = useRef(0); // step index
  // Latest-ref for the completion callback so a parent re-render mid-run never
  // resets the engine (the callbacks stay out of the hook deps).
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    setPhase('done');
    if (emails.length > 0) {
      onCompleteRef.current?.(emails.map((e) => resolveEmail(e).finalStatus));
    }
  }, [emails]);

  const advance = useCallback(() => {
    const email = emails[ei.current];
    if (!email) {
      finish();
      return;
    }
    const res = resolveEmail(email);
    const idx = si.current;
    const curId = STEP_IDS[idx]!;
    const curFinal = res.stepFinal[curId]!; // 'done' | 'failed'
    const atLast = idx >= res.lastIdx;

    if (!atLast) {
      const nextId = STEP_IDS[idx + 1]!;
      const nextDur = stepDuration(idx + 1);
      setRuns((prev) => {
        const run = { ...(prev[email.id] ?? emptyRun()) };
        run.steps = { ...run.steps, [curId]: curFinal, [nextId]: 'running' };
        run.durations = { ...run.durations, [nextId]: nextDur };
        return { ...prev, [email.id]: run };
      });
      si.current = idx + 1;
      timer.current = setTimeout(advance, nextDur);
    } else {
      const nextEmail = emails[ei.current + 1];
      const nextDur0 = nextEmail ? stepDuration(0) : 0;
      setRuns((prev) => {
        const run = { ...(prev[email.id] ?? emptyRun()) };
        run.steps = { ...run.steps, ...res.stepFinal }; // apply finals incl. skipped
        run.status = res.finalStatus;
        const out = { ...prev, [email.id]: run };
        if (nextEmail) {
          const nr = emptyRun();
          nr.status = 'running';
          nr.steps[STEP_IDS[0]!] = 'running';
          nr.durations[STEP_IDS[0]!] = nextDur0;
          out[nextEmail.id] = nr;
        }
        return out;
      });
      if (nextEmail) {
        ei.current += 1;
        si.current = 0;
        timer.current = setTimeout(advance, nextDur0);
      } else {
        finish();
      }
    }
  }, [emails, finish]);

  const start = useCallback(() => {
    clear();
    ei.current = 0;
    si.current = 0;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      const done: Record<string, EmailRun> = {};
      emails.forEach((e) => {
        const res = resolveEmail(e);
        done[e.id] = { status: res.finalStatus, steps: { ...res.stepFinal }, durations: {} };
      });
      setRuns(done);
      finish();
      return;
    }

    const dur0 = stepDuration(0);
    const init: Record<string, EmailRun> = {};
    emails.forEach((e, idx) => {
      const r = emptyRun();
      if (idx === 0) {
        r.status = 'running';
        r.steps[STEP_IDS[0]!] = 'running';
        r.durations[STEP_IDS[0]!] = dur0;
      }
      init[e.id] = r;
    });
    setRuns(init);
    setPhase('running');
    timer.current = setTimeout(advance, dur0);
  }, [emails, advance, clear, finish]);

  const stop = useCallback(() => {
    clear();
    setPhase('idle');
  }, [clear]);

  // Reset the run when the email set changes (drilling to another topic) and
  // clean up the timer on unmount.
  useEffect(() => {
    clear();
    setRuns({});
    setPhase('idle');
    ei.current = 0;
    si.current = 0;
    return () => clear();
  }, [emails, clear]);

  return { phase, runs, start, stop };
}
