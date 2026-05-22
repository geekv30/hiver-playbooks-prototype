'use client';
import { useState } from 'react';
import type { Step } from '@/types/playbook';
import { findAction } from '@/data/library';
import styles from './Jumplist.module.css';

interface Props {
  steps: Step[];
  onJump: (stepId: string) => void;
}

function labelOf(s: Step): string {
  if (s.kind === 'action') {
    // The first chip in the fragments tells us what this step does.
    for (const f of s.fragments) {
      if (f.kind === 'chip') {
        const a = findAction(f.chip.actionId);
        return a?.name ?? 'Action';
      }
    }
    return 'Action';
  }
  if (s.kind === 'condition') return 'Condition';
  if (s.kind === 'approval') return 'Approval';
  return 'End';
}

export default function Jumplist({ steps, onJump }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <aside
      className={`${styles.list} ${open ? styles.open : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      aria-label="Step jump list"
    >
      <div className={styles.row} onClick={() => onJump('__frontmatter__')} role="button" tabIndex={0}>
        <span className={styles.num}>FM</span>
        <span className={styles.title}>Setup</span>
      </div>
      {steps.map((s, idx) => (
        <div key={s.id} className={styles.row} onClick={() => onJump(s.id)} role="button" tabIndex={0}>
          <span className={styles.num}>{String(idx + 1).padStart(2, '0')}</span>
          <span className={styles.title}>{labelOf(s)}</span>
        </div>
      ))}
    </aside>
  );
}
