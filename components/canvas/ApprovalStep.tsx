'use client';
import { useRef } from 'react';
import type { ApprovalStep as Model } from '@/types/playbook';
import { Fragments } from './Fragments';
import FieldRef from '@/components/atoms/FieldRef';
import styles from './ApprovalStep.module.css';

interface Props {
  step: Model;
  index: number;
  onSlash: (stepId: string, body: HTMLElement) => void;
  onAt: (stepId: string, body: HTMLElement) => void;
  onChipClick: (stepId: string, chipId: string) => void;
  onRefClick?: (stepId: string, refPath: string) => void;
}

export default function ApprovalStep({ step, index, onSlash, onAt, onChipClick, onRefClick }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '/') {
      e.preventDefault();
      if (bodyRef.current) onSlash(step.id, bodyRef.current);
    } else if (e.key === '@') {
      e.preventDefault();
      if (bodyRef.current) onAt(step.id, bodyRef.current);
    }
  };

  return (
    <div className={styles.appr} data-step-id={step.id}>
      <span className={styles.apprNum}>{String(index + 1).padStart(2, '0')}</span>
      <div className={styles.apprBody}>
        <div className={styles.apprHead}>
          <span className={styles.apprTag}>APPROVAL</span>
          <span>FROM</span>
          <FieldRef refPath={step.approverRefPath} onClick={(rp) => onRefClick?.(step.id, rp)} />
        </div>
        <div
          ref={bodyRef}
          className={styles.apprPrompt}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={onKeyDown}
        >
          <Fragments
            fragments={step.promptFragments}
            onChipClick={(cid) => onChipClick(step.id, cid)}
            onRefClick={(rp) => onRefClick?.(step.id, rp)}
          />
        </div>
      </div>
    </div>
  );
}
