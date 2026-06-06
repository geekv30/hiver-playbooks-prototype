'use client';

import {
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import Chip from '@/components/atoms/Chip';
import type { Branch, BranchType, DocStep } from '../doc';
import BranchTypePicker from './BranchTypePicker';
import { type Anchor } from '../useAnchoredPosition';
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
  /** Editor mode: render ONE body line as a real EditorLine. Called per line so an
   *  arm can hold several action lines (the number gutter shows its 1-based index). */
  renderBody?: (branch: Branch, line: DocStep, index: number) => ReactNode;
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
  // Which tag's picker is open: a branch id, the literal 'prompt', or null - plus
  // the clicked tag's viewport rect, so the picker is fixed-positioned at the tag
  // (it escapes the doc's scroll overflow and never clips at the border).
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<Anchor | null>(null);
  const hasElse = branches.some((b) => b.type === 'else');

  const openPicker = (key: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setPickerAnchor({ left: r.left, top: r.top, bottom: r.bottom });
    setPickerFor(key);
  };
  const closePicker = () => {
    setPickerFor(null);
    setPickerAnchor(null);
  };

  const pick = (type: 'elseif' | 'else') => {
    if (pickerFor === 'prompt') onAddBranch?.(type);
    else if (pickerFor) onChangeBranchType?.(pickerFor, type);
    closePicker();
  };

  // Clicking the field's padding (not directly on the text) should still focus the
  // inner editable line - otherwise the box reads as dead everywhere there isn't a
  // glyph. Only act on a click that lands on the wrapper itself; a click on the
  // text / a token focuses itself.
  const focusFieldPadding = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    const spans = e.currentTarget.querySelectorAll<HTMLElement>('[contenteditable]');
    const last = spans[spans.length - 1];
    if (!last) return;
    last.focus();
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(last);
    range.collapse(false); // caret at the end
    sel.removeAllRanges();
    sel.addRange(range);
  };

  // Static fallback body copy (the editor injects real EditorLines via renderBody;
  // this is only the isolation-page showcase). Matches the editor's step placeholder.
  const bodyContent = () => (
    <span className={styles.bodyText}>Write in natural language, or / for actions and @ to reference</span>
  );

  const picker = (key: string) => {
    if (pickerFor !== key || !pickerAnchor) return null;
    // ELSE is only offered when it can't drop trailing arms: the new-branch
    // prompt, or a re-pick on the last decided arm.
    const allowElse = key === 'prompt' || branches[branches.length - 1]?.id === key;
    // Fixed-positioned at the tag (anchor), so no relative wrapper is needed.
    return (
      <BranchTypePicker allowElse={allowElse} anchor={pickerAnchor} onPick={pick} onClose={closePicker} />
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
                  onConditionClick={isIf ? undefined : (el) => openPicker(b.id, el)}
                />
                {picker(b.id)}
              </span>
              {!isElse &&
                (renderExpr ? (
                  <div className={styles.condField} onMouseDown={focusFieldPadding}>
                    {renderExpr(b)}
                  </div>
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
            {b.lines.map((ln, li) => (
              <div key={ln.id} className={styles.bodyLine}>
                <span className={styles.bodyNum}>{li + 1}</span>
                {renderBody ? renderBody(b, ln, li) : bodyContent()}
              </div>
            ))}
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
                onConditionClick={(el) => openPicker('prompt', el)}
              />
              {picker('prompt')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
