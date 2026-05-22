'use client';
import type { Chip } from '@/types/playbook';
import { solvedFor } from '@/data/solved';
import Output from '@/components/surfaces/Output';
import { findAction } from '@/data/library';
import styles from './rail.module.css';

interface Props {
  chip: Chip | null;
}

export default function OutputTab({ chip }: Props) {
  if (!chip) {
    return <div className={styles.configEmpty}>Click a chip to see its output.</div>;
  }
  const action = findAction(chip.actionId);
  if (!action) return null;

  const data = solvedFor(chip.actionId);

  return (
    <div>
      <div className={styles.section}>
        <div className={styles.label}>{action.name} output</div>
        <Output data={data} />
      </div>
    </div>
  );
}
