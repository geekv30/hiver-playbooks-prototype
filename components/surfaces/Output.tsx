'use client';
import styles from './Output.module.css';

interface Props {
  data: unknown;
  emptyHint?: string;
}

export default function Output({ data, emptyHint = 'No output yet' }: Props) {
  if (data === null || data === undefined) {
    return <div className={styles.empty}>{emptyHint}</div>;
  }
  if (typeof data !== 'object') {
    return <div className={styles.scalar}>{String(data)}</div>;
  }
  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length === 0) {
    return <div className={styles.empty}>{emptyHint}</div>;
  }
  return (
    <dl className={styles.list}>
      {entries.map(([k, v]) => (
        <div key={k} className={styles.row}>
          <dt className={styles.key}>{k}</dt>
          <dd className={styles.value}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}
