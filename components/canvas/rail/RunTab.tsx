'use client';
import type { Playbook } from '@/types/playbook';
import styles from './rail.module.css';

interface Props {
  playbook: Playbook;
}

export default function RunTab({ playbook }: Props) {
  return (
    <div>
      <div className={styles.section}>
        <div className={styles.label}>Recent runs</div>
        <div className={styles.placeholder}>
          No runs yet
          <span className={styles.phHint}>activate the AOP to start tracking runs</span>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.label}>Estimated</div>
        <div className={styles.row}>
          <span className={styles.key}>Steps</span>
          <span className={`${styles.val} ${styles.mono}`}>{playbook.steps.length}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>Avg run time</span>
          <span className={`${styles.val} ${styles.muted}`}>~12s</span>
        </div>
      </div>
    </div>
  );
}
