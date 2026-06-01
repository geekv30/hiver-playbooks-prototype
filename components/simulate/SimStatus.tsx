import type { SimStatusKind } from '@/data/simFixtures';
import styles from './SimStatus.module.css';

interface Props {
  status: SimStatusKind;
  /** The text shown next to the dot (e.g. "no runs yet", "Passed", "1 run"). */
  label: string;
}

/**
 * SimStatus - a colored dot + label. The ONE renderer for every simulate status
 * (topic card, topic header, ...). Dot + label colour are driven by `status`, so
 * the same component covers idle / running / passed / failed / needs-attention.
 */
export default function SimStatus({ status, label }: Props) {
  return (
    <span className={styles.status} data-status={status}>
      <span className={styles.dot} aria-hidden />
      <span className={styles.label}>{label}</span>
    </span>
  );
}
