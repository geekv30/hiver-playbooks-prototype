'use client';
import type { ConditionStep, ConditionBranch, Fragment } from '@/types/playbook';
import { Fragments } from './Fragments';
import styles from './ConditionRow.module.css';

interface Props {
  cond: ConditionStep;
  index: number;
  onAddBranch: (condId: string, tag: 'elseif' | 'else') => void;
  onChipClick: (stepId: string, chipId: string) => void;
  onRefClick?: (stepId: string, refPath: string) => void;
}

const TAG_LABEL: Record<ConditionBranch['tag'], string> = {
  if: 'IF',
  elseif: 'ELSE IF',
  else: 'ELSE',
};

export default function ConditionRow({ cond, index, onAddBranch, onChipClick, onRefClick }: Props) {
  const hasElse = cond.branches.some((b) => b.tag === 'else');

  return (
    <div className={styles.cond} data-step-id={cond.id}>
      <div className={styles.condHead}>
        <span className={styles.condNum}>{String(index + 1).padStart(2, '0')}</span>
        <div className={styles.condExpr}>
          <span className={styles.checkLabel}>CHECK</span>
          <Fragments
            fragments={cond.exprFragments}
            onChipClick={(cid) => onChipClick(cond.id, cid)}
            onRefClick={(rp) => onRefClick?.(cond.id, rp)}
          />
        </div>
      </div>

      <div className={styles.branches}>
        {cond.branches.map((b) => (
          <div key={b.id} className={styles.branch} data-branch-id={b.id}>
            <div className={styles.branchLabel}>
              <span className={styles.bTag}>{TAG_LABEL[b.tag]}</span>
              {b.tag !== 'else' && b.exprFragments.length > 0 && (
                <span className={styles.bExpr}>
                  <Fragments
                    fragments={b.exprFragments}
                    onChipClick={(cid) => onChipClick(cond.id, cid)}
                    onRefClick={(rp) => onRefClick?.(cond.id, rp)}
                  />
                </span>
              )}
              {b.tag === 'else' && b.exprFragments.length > 0 && (
                <span className={styles.bExpr}>
                  <Fragments
                    fragments={b.exprFragments}
                    onChipClick={(cid) => onChipClick(cond.id, cid)}
                    onRefClick={(rp) => onRefClick?.(cond.id, rp)}
                  />
                </span>
              )}
            </div>
            <div className={styles.branchBody}>
              <Fragments
                fragments={b.bodyFragments}
                onChipClick={(cid) => onChipClick(cond.id, cid)}
                onRefClick={(rp) => onRefClick?.(cond.id, rp)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.branchActions}>
        <button
          className={styles.branchBtn}
          onClick={() => onAddBranch(cond.id, 'elseif')}
          type="button"
        >
          + Else if
        </button>
        {!hasElse && (
          <button
            className={styles.branchBtn}
            onClick={() => onAddBranch(cond.id, 'else')}
            type="button"
          >
            + Else
          </button>
        )}
      </div>
    </div>
  );
}
