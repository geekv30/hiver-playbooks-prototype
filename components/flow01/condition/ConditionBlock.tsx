'use client';

import { useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
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
  /** Re-pick a decided arm's type (else-if <-> else). */
  onChangeBranchType?: (branchId: string, type: 'elseif' | 'else') => void;
  /** Live condition text for an arm (if / else-if). */
  onEditCondition?: (branchId: string, text: string) => void;
  /** Remove an arm (else-if). */
  onDeleteBranch?: (branchId: string) => void;
}

/**
 * ConditionBlock - the IF / ELSE-IF / ELSE authoring block (Figma 334:35590 /
 * 334:36607). IF and ELSE-IF: tag + resizable condition field, body on a
 * numbered line below. ELSE: tag + body INLINE (no condition field, no number).
 * Every ELSE-IF / ELSE tag (decided or the trailing prompt) opens the two-option
 * picker; ELSE terminates the chain.
 */
export default function ConditionBlock({
  branches,
  onAddBranch,
  onChangeBranchType,
  onEditCondition,
  onDeleteBranch,
}: Props) {
  // Which tag's picker is open: a branch id, the literal 'prompt', or null.
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const hasElse = branches.some((b) => b.type === 'else');

  const pick = (type: 'elseif' | 'else') => {
    if (pickerFor === 'prompt') onAddBranch?.(type);
    else if (pickerFor) onChangeBranchType?.(pickerFor, type);
    setPickerFor(null);
  };

  const bodyContent = () => (
    <span className={styles.bodyText}>
      Write in natural language what this procedure should do or use
      <span className={styles.atChip} aria-hidden>
        <RiAtLine />
      </span>
      for an action
    </span>
  );

  const picker = (key: string) =>
    pickerFor === key ? (
      <div className={styles.pickerAnchor}>
        <BranchTypePicker onPick={pick} onClose={() => setPickerFor(null)} />
      </div>
    ) : null;

  return (
    <div className={styles.block}>
      {branches.map((b) => {
        const isElse = b.type === 'else';
        const isIf = b.type === 'if';
        return (
          <div key={b.id} className={`${styles.arm} ${styles.relative}`}>
            {/* Every arm is a tag row + a numbered body line below. ELSE is the
                same construction minus the condition field (Figma 334:36705). */}
            <div className={styles.head}>
              <Chip
                mode="condition"
                label={TYPE_LABEL[b.type]}
                onConditionClick={isIf ? undefined : () => setPickerFor(b.id)}
              />
              {!isElse && (
                <div
                  className={styles.condField}
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-label={`${TYPE_LABEL[b.type]} condition`}
                  data-placeholder="condition"
                  onInput={(e: FormEvent<HTMLDivElement>) =>
                    onEditCondition?.(b.id, e.currentTarget.textContent ?? '')
                  }
                  onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
                    if (!isIf && e.key === 'Backspace' && (e.currentTarget.textContent ?? '') === '') {
                      e.preventDefault();
                      onDeleteBranch?.(b.id);
                    }
                  }}
                />
              )}
            </div>
            <div className={styles.bodyLine}>
              <span className={styles.bodyNum}>1</span>
              {bodyContent()}
            </div>
            {picker(b.id)}
          </div>
        );
      })}

      {!hasElse && (
        <div className={`${styles.arm} ${styles.relative}`}>
          <div className={styles.head}>
            <Chip
              mode="condition"
              label="ELSE-IF / ELSE"
              subtle
              onConditionClick={() => setPickerFor('prompt')}
            />
            <div className={styles.condField} data-placeholder="condition" aria-hidden />
          </div>
          <div className={styles.bodyLine}>
            <span className={styles.bodyNum}>1</span>
            {bodyContent()}
          </div>
          {picker('prompt')}
        </div>
      )}
    </div>
  );
}
