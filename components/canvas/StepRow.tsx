'use client';
import { useCallback, useRef } from 'react';
import type { ActionStep } from '@/types/playbook';
import { Fragments } from './Fragments';
import { XIcon } from '@/components/icons/ui';
import styles from './StepRow.module.css';

interface Props {
  step: ActionStep;
  index: number;
  onSlash: (stepId: string, stepBody: HTMLElement) => void;
  onAt: (stepId: string, stepBody: HTMLElement) => void;
  onChipClick: (stepId: string, chipId: string) => void;
  onRefClick?: (stepId: string, refPath: string) => void;
  onDelete: (stepId: string) => void;
}

export default function StepRow({ step, index, onSlash, onAt, onChipClick, onRefClick, onDelete }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '/') {
      e.preventDefault();
      if (bodyRef.current) onSlash(step.id, bodyRef.current);
    } else if (e.key === '@') {
      e.preventDefault();
      if (bodyRef.current) onAt(step.id, bodyRef.current);
    }
  }, [step.id, onSlash, onAt]);

  return (
    <div className={styles.step} data-step-id={step.id}>
      <span className={styles.stepNum}>{String(index + 1).padStart(2, '0')}</span>
      <div
        ref={bodyRef}
        className={styles.stepBody}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={onKeyDown}
      >
        <Fragments
          fragments={step.fragments}
          onChipClick={(chipId) => onChipClick(step.id, chipId)}
          onRefClick={(refPath) => onRefClick?.(step.id, refPath)}
        />
      </div>
      <div className={styles.stepTail}>
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(step.id)}
          aria-label="Delete step"
          type="button"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}
