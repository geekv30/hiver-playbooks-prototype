'use client';

import { useState, type KeyboardEvent as ReactKeyboardEvent, type FormEvent } from 'react';
import { RiAtLine } from 'react-icons/ri';
import Chip from '@/components/atoms/Chip';
import type { Branch, BranchType } from '../doc';
import BranchTypePicker from './BranchTypePicker';
import styles from './ConditionBlock.module.css';

const TYPE_LABEL: Record<BranchType, string> = {
  if: 'IF',
  elseif: 'ELSE-IF',
  else: 'ELSE',
};

interface Props {
  /** The decided arms (always at least an IF). */
  branches: Branch[];
  /** Pick a type from the ELSE-IF / ELSE prompt -> append that arm. */
  onAddBranch?: (type: 'elseif' | 'else') => void;
  /** Live condition text for an arm (if / else-if). */
  onEditCondition?: (branchId: string, text: string) => void;
  /** Remove an arm (else-if / else). */
  onDeleteBranch?: (branchId: string) => void;
}

/**
 * ConditionBlock - the IF / ELSE-IF / ELSE authoring block (Figma 334:35590).
 * Each arm: the condition tag (shared Chip, condition mode) + a resizable NL
 * condition field (omitted for ELSE) + a body line. A subtle, clickable
 * "ELSE-IF / ELSE" prompt trails the arms and opens the two-option picker;
 * picking ELSE terminates the chain (no prompt after).
 */
export default function ConditionBlock({ branches, onAddBranch, onEditCondition, onDeleteBranch }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasElse = branches.some((b) => b.type === 'else');

  return (
    <div className={styles.block}>
      {branches.map((b) => (
        <Arm
          key={b.id}
          branch={b}
          deletable={b.type !== 'if'}
          onEdit={(text) => onEditCondition?.(b.id, text)}
          onDelete={() => onDeleteBranch?.(b.id)}
        />
      ))}

      {!hasElse && (
        <div className={`${styles.arm} ${styles.promptArm}`}>
          <div className={styles.head}>
            <Chip
              mode="condition"
              label="ELSE-IF / ELSE"
              subtle
              onConditionClick={() => setPickerOpen(true)}
            />
            <div className={styles.condField} data-placeholder="condition" aria-hidden />
          </div>
          <BodyLine />
          {pickerOpen && (
            <div className={styles.pickerAnchor}>
              <BranchTypePicker
                onPick={(type) => {
                  setPickerOpen(false);
                  onAddBranch?.(type);
                }}
                onClose={() => setPickerOpen(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Arm({
  branch,
  deletable,
  onEdit,
  onDelete,
}: {
  branch: Branch;
  deletable: boolean;
  onEdit: (text: string) => void;
  onDelete: () => void;
}) {
  const isElse = branch.type === 'else';

  const handleInput = (e: FormEvent<HTMLDivElement>) => onEdit(e.currentTarget.textContent ?? '');
  const handleKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // Backspace on an empty condition removes the arm (else-if). The IF arm is
    // the anchor and is not deletable here (removing the whole block lives at
    // the step level).
    if (deletable && e.key === 'Backspace' && (e.currentTarget.textContent ?? '') === '') {
      e.preventDefault();
      onDelete();
    }
  };

  return (
    <div className={styles.arm}>
      <div className={styles.head}>
        <Chip mode="condition" label={TYPE_LABEL[branch.type]} />
        {!isElse && (
          <div
            className={styles.condField}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label={`${TYPE_LABEL[branch.type]} condition`}
            data-placeholder="condition"
            onInput={handleInput}
            onKeyDown={handleKey}
          />
        )}
      </div>
      <BodyLine />
    </div>
  );
}

function BodyLine() {
  return (
    <div className={styles.bodyLine}>
      <span className={styles.bodyNum}>1</span>
      <span className={styles.bodyText}>
        Write in natural language what this procedure should do or use
        <span className={styles.atChip} aria-hidden>
          <RiAtLine />
        </span>
        for an action
      </span>
    </div>
  );
}
