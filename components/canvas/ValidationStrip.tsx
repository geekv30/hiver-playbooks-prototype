'use client';
import type { ValidationIssue } from '@/lib/validation';
import styles from './ValidationStrip.module.css';

interface Props {
  issues: ValidationIssue[];
  onResolve: (issue: ValidationIssue) => void;
}

export default function ValidationStrip({ issues, onResolve }: Props) {
  if (issues.length === 0) return null;
  const first = issues[0];
  if (!first) return null;
  const extra = issues.length - 1;

  return (
    <div className={styles.strip} role="status" aria-live="polite">
      <span className={styles.message}>{first.message}</span>
      {extra > 0 && <span className={styles.more}>+ {extra} more</span>}
      <span
        className={styles.resolve}
        onClick={() => onResolve(first)}
        role="button"
        tabIndex={0}
      >
        Resolve
      </span>
    </div>
  );
}
