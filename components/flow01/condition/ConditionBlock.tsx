'use client';

import {
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
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
  /** Editor mode: render the branch's condition expression as a real EditorLine. */
  renderExpr?: (branch: Branch) => ReactNode;
  /** Editor mode: render the branch's body as a real EditorLine. */
  renderBody?: (branch: Branch) => ReactNode;
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
  renderExpr,
  renderBody,
}: Props) {
  // Which tag's picker is open: a branch id, the literal 'prompt', or null.
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const hasElse = branches.some((b) => b.type === 'else');

  const pick = (type: 'elseif' | 'else') => {
    if (pickerFor === 'prompt') onAddBranch?.(type);
    else if (pickerFor) onChangeBranchType?.(pickerFor, type);
    setPickerFor(null);
  };

  // Static fallback body copy (the editor injects real EditorLines via renderBody;
  // this is only the isolation-page showcase). Matches the editor's step placeholder.
  const bodyContent = () => (
    <span className={styles.bodyText}>Write in natural language, or / for actions and @ to reference</span>
  );

  const picker = (key: string) => {
    if (pickerFor !== key) return null;
    // ELSE is only offered when it can't drop trailing arms: the new-branch
    // prompt, or a re-pick on the last decided arm.
    const allowElse = key === 'prompt' || branches[branches.length - 1]?.id === key;
    return (
      <div className={styles.pickerAnchor}>
        <BranchTypePicker allowElse={allowElse} onPick={pick} onClose={() => setPickerFor(null)} />
      </div>
    );
  };

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
              <span className={styles.tagWrap}>
                <Chip
                  mode="condition"
                  label={TYPE_LABEL[b.type]}
                  onConditionClick={isIf ? undefined : () => setPickerFor(b.id)}
                />
                {picker(b.id)}
              </span>
              {!isElse &&
                (renderExpr ? (
                  <div className={styles.condField}>{renderExpr(b)}</div>
                ) : (
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
                ))}
            </div>
            <div className={styles.bodyLine}>
              <span className={styles.bodyNum}>1</span>
              {renderBody ? renderBody(b) : bodyContent()}
            </div>
          </div>
        );
      })}

      {!hasElse && (
        // The undecided prompt is a pure affordance: just the subtle tag that
        // opens the picker. No fake condition field / numbered body (those appear
        // only once a real arm is added) - integrity by construction.
        <div className={`${styles.arm} ${styles.relative}`}>
          <div className={styles.head}>
            <span className={styles.tagWrap}>
              <Chip
                mode="condition"
                label="ELSE-IF / ELSE"
                subtle
                onConditionClick={() => setPickerFor('prompt')}
              />
              {picker('prompt')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
