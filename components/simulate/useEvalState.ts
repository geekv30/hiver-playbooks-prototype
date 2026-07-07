'use client';

// Eval aggregate, owned by the canvas (EditorCanvas) so Enable can read it.
// recordRun accumulates every completed run's per-email statuses; staleness
// compares the doc signature captured at the last run with the live doc.
import { useCallback, useMemo, useState } from 'react';
import type { SimStatusKind } from '@/data/simFixtures';
import type { EditorDoc } from '@/components/flow01/doc';
import { docSignature } from './docSignature';

export interface EvalAggregate {
  total: number;
  passed: number;
  failed: number;
  attention: number;
  stale: boolean;
}

const ZERO = { total: 0, passed: 0, failed: 0, attention: 0 };

export function useEvalState(doc: EditorDoc) {
  const [counts, setCounts] = useState(ZERO);
  const [sigAtRun, setSigAtRun] = useState<string | null>(null);

  const recordRun = useCallback((statuses: SimStatusKind[], docAtRun: EditorDoc) => {
    if (statuses.length === 0) return;
    // Map the new outcome kinds onto the existing aggregate shape so the shipped
    // Enable readiness engine is untouched: an 'approval' run means the AOP behaved
    // correctly (reply drafted, just gated) -> counts as passed; 'errored' -> failed.
    setCounts((prev) =>
      statuses.reduce(
        (a, s) => ({
          total: a.total + 1,
          passed: a.passed + (s === 'passed' || s === 'approval' ? 1 : 0),
          failed: a.failed + (s === 'failed' || s === 'errored' ? 1 : 0),
          attention: a.attention + (s === 'attention' ? 1 : 0),
        }),
        prev,
      ),
    );
    setSigAtRun(docSignature(docAtRun));
  }, []);

  const agg: EvalAggregate = useMemo(
    () => ({ ...counts, stale: sigAtRun !== null && sigAtRun !== docSignature(doc) }),
    [counts, sigAtRun, doc],
  );

  return { agg, recordRun };
}
