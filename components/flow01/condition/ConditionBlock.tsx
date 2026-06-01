'use client';

import { RiAtLine } from 'react-icons/ri';
import Chip from '@/components/atoms/Chip';
import type { Branch, BranchType } from '../doc';
import styles from './ConditionBlock.module.css';

const TYPE_LABEL: Record<BranchType, string> = {
  if: 'IF',
  elseif: 'ELSE-IF',
  else: 'ELSE',
};

interface Props {
  /** The decided arms (always at least an IF). */
  branches: Branch[];
  /** Open the branch-type picker (Else if / Else) from the trailing prompt. */
  onAddBranch?: () => void;
}

/**
 * ConditionBlock - the IF / ELSE-IF / ELSE authoring block (Figma 334:35590).
 * Each arm: the condition tag (shared Chip, condition mode) + a resizable NL
 * condition field (omitted for ELSE) + a body line renumbered from 1. A subtle,
 * clickable "ELSE-IF / ELSE" prompt trails the arms until an ELSE terminates it.
 *
 * This pass renders the structure/visual; live editing of the condition + body
 * and the type picker wire in with the editor reducer integration.
 */
export default function ConditionBlock({ branches, onAddBranch }: Props) {
  const hasElse = branches.some((b) => b.type === 'else');
  return (
    <div className={styles.block}>
      {branches.map((b) => (
        <Arm key={b.id} type={b.type} />
      ))}
      {!hasElse && <Arm type="prompt" onTagClick={onAddBranch} />}
    </div>
  );
}

function Arm({ type, onTagClick }: { type: BranchType | 'prompt'; onTagClick?: () => void }) {
  const isPrompt = type === 'prompt';
  const isElse = type === 'else';
  const label = isPrompt ? 'ELSE-IF / ELSE' : TYPE_LABEL[type];
  return (
    <div className={styles.arm}>
      <div className={styles.head}>
        <Chip
          mode="condition"
          label={label}
          subtle={isPrompt}
          onConditionClick={isPrompt ? onTagClick : undefined}
        />
        {!isElse && (
          <div
            className={styles.condField}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label={isPrompt ? 'Else-if condition' : `${label} condition`}
            data-placeholder="condition"
          />
        )}
      </div>
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
    </div>
  );
}
