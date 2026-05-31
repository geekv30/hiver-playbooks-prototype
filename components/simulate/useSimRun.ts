'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SIM_TRACE, type StepStatus } from './traceFixture';
import type { SimEmail, SimStatusKind } from '@/data/simFixtures';

export interface EmailRun {
  status: SimStatusKind; // idle | running | passed | failed | attention
  steps: Record<string, StepStatus>;
}

export type RunPhase = 'idle' | 'running' | 'done';

const STEP_IDS = SIM_TRACE.map((s) => s.id);

function freshSteps(): Record<string, StepStatus> {
  return Object.fromEntries(STEP_IDS.map((id) => [id, 'pending'])) as Record<string, StepStatus>;
}
function emptyRun(): EmailRun {
  return { status: 'idle', steps: freshSteps() };
}
// Demo timing — scale the fixture ms down so a full run is snappy but readable.
function stepDelay(i: number): number {
  return Math.max(260, Math.round(SIM_TRACE[i]!.ms * 0.55));
}

/**
 * useSimRun — sequential run engine for a topic's emails.
 *
 * Emails run ONE AT A TIME: each step goes pending -> running -> done (dot grey
 * -> green), then the next step; when the last step resolves the email passes
 * and the next email starts. Scripted/deterministic (the prototype fakes values;
 * the trace template stands in for the live playbook steps). Honours
 * prefers-reduced-motion by jumping straight to the resolved state.
 */
export function useSimRun(emails: SimEmail[]) {
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [runs, setRuns] = useState<Record<string, EmailRun>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ei = useRef(0); // email index
  const si = useRef(0); // step index

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const advance = useCallback(() => {
    const email = emails[ei.current];
    if (!email) {
      setPhase('done');
      return;
    }
    const curId = STEP_IDS[si.current]!;
    const lastStep = si.current >= STEP_IDS.length - 1;

    if (!lastStep) {
      const nextId = STEP_IDS[si.current + 1]!;
      setRuns((prev) => {
        const run = { ...(prev[email.id] ?? emptyRun()) };
        run.steps = { ...run.steps, [curId]: 'done', [nextId]: 'running' };
        return { ...prev, [email.id]: run };
      });
      si.current += 1;
      timer.current = setTimeout(advance, stepDelay(si.current));
    } else {
      const nextEmail = emails[ei.current + 1];
      setRuns((prev) => {
        const run = { ...(prev[email.id] ?? emptyRun()) };
        run.steps = { ...run.steps, [curId]: 'done' };
        run.status = 'passed';
        const out = { ...prev, [email.id]: run };
        if (nextEmail) {
          const nr = emptyRun();
          nr.status = 'running';
          nr.steps[STEP_IDS[0]!] = 'running';
          out[nextEmail.id] = nr;
        }
        return out;
      });
      if (nextEmail) {
        ei.current += 1;
        si.current = 0;
        timer.current = setTimeout(advance, stepDelay(0));
      } else {
        setPhase('done');
      }
    }
  }, [emails]);

  const start = useCallback(() => {
    clear();
    ei.current = 0;
    si.current = 0;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      const done: Record<string, EmailRun> = {};
      const allDone = Object.fromEntries(STEP_IDS.map((id) => [id, 'done'])) as Record<string, StepStatus>;
      emails.forEach((e) => {
        done[e.id] = { status: 'passed', steps: { ...allDone } };
      });
      setRuns(done);
      setPhase('done');
      return;
    }

    const init: Record<string, EmailRun> = {};
    emails.forEach((e, idx) => {
      const r = emptyRun();
      if (idx === 0) {
        r.status = 'running';
        r.steps[STEP_IDS[0]!] = 'running';
      }
      init[e.id] = r;
    });
    setRuns(init);
    setPhase('running');
    timer.current = setTimeout(advance, stepDelay(0));
  }, [emails, advance, clear]);

  const stop = useCallback(() => {
    clear();
    setPhase('idle');
  }, [clear]);

  // Reset the run when the email set changes (drilling to another topic), and
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
