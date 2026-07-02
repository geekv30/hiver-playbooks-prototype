'use client';

// One-line n-of-m rollup above the eval entry cards (differentiation: Fin has
// per-sim verdicts but no rollup). Plain text + status dots, no card chrome.
// The stale note appears when the doc changed after the last run.
import type { EvalAggregate } from './useEvalState';
import styles from './EvalSummary.module.css';

export default function EvalSummary({ agg }: { agg: EvalAggregate }) {
  if (agg.total === 0) return null;
  const parts: Array<{ n: number; label: string; cls: string }> = [
    { n: agg.passed, label: 'passed', cls: styles.ok ?? '' },
    { n: agg.failed, label: 'failed', cls: styles.fail ?? '' },
    { n: agg.attention, label: 'needs attention', cls: styles.warn ?? '' },
  ].filter((p) => p.n > 0);
  return (
    <div className={styles.summary} role="status">
      <span className={styles.count}>
        {agg.total} evaluation{agg.total === 1 ? '' : 's'}
      </span>
      {parts.map((p) => (
        <span key={p.label} className={styles.part}>
          <span className={`${styles.dot} ${p.cls}`} aria-hidden />
          {p.n} {p.label}
        </span>
      ))}
      {agg.stale && <span className={styles.stale}>Evaluated an earlier version of this AOP</span>}
    </div>
  );
}
