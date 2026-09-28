'use client';

import { useEffect, useRef } from 'react';
import ModalShell from '@/components/atoms/ModalShell';
import Button from '@/components/atoms/Button';
import styles from './DeleteSkillModal.module.css';

/**
 * The confirm step behind a Skills table row's trash button. Cancel takes focus
 * on open so a stray Enter backs out instead of deleting.
 */
export default function DeleteSkillModal({
  name,
  onConfirm,
  onClose,
}: {
  name: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  // A frame late: ModalShell records the opener in its own mount effect (which
  // runs after this child's), and it must record the trash button, not Cancel.
  useEffect(() => {
    const id = requestAnimationFrame(() => rootRef.current?.querySelector('button')?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <ModalShell ariaLabelledby="delete-skill-title" onClose={onClose} dialogClassName={styles.dialog}>
      {(requestClose) => (
        <div ref={rootRef} className={styles.root}>
          <h2 id="delete-skill-title" className={styles.title}>
            Delete this skill?
          </h2>
          <p className={styles.body}>
            <span className={styles.name}>{name}</span>
            {' will stop running and be removed, along with its run history. This can’t be undone.'}
          </p>
          <div className={styles.foot}>
            <Button variant="secondary" onClick={requestClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onConfirm();
                requestClose();
              }}
            >
              Delete skill
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
