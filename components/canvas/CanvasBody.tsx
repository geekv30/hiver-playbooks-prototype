'use client';
import type { Playbook, Step, Frontmatter as FM } from '@/types/playbook';
import FrontmatterCmp from './Frontmatter';
import StepRow from './StepRow';
import ConditionRow from './ConditionRow';
import ApprovalStep from './ApprovalStep';
import EndRow from './EndRow';
import ValidationStrip from './ValidationStrip';
import type { ValidationIssue } from '@/lib/validation';
import styles from './CanvasBody.module.css';

interface Props {
  playbook: Playbook;
  issues: ValidationIssue[];
  onFmChange: (patch: Partial<FM>) => void;
  onSlash: (stepId: string, body: HTMLElement) => void;
  onAt: (stepId: string, body: HTMLElement) => void;
  onChipClick: (stepId: string, chipId: string) => void;
  onRefClick?: (stepId: string, refPath: string) => void;
  onDeleteStep: (stepId: string) => void;
  onInsertBetween: (afterStepId: string | null) => void;
  onAddBranch: (condId: string, tag: 'elseif' | 'else') => void;
  onResolveIssue: (issue: ValidationIssue) => void;
}

export default function CanvasBody(p: Props) {
  return (
    <div className={styles.scrollArea}>
      <main className={styles.inner}>
        <FrontmatterCmp fm={p.playbook.frontmatter} onChange={p.onFmChange} />
        {p.playbook.steps.map((s, idx) => (
          <div key={s.id}>{renderStep(s, idx, p)}</div>
        ))}
        <EndRow onClick={() => p.onInsertBetween(lastContentStepId(p.playbook.steps))} />
      </main>
      <ValidationStrip issues={p.issues} onResolve={p.onResolveIssue} />
    </div>
  );
}

function lastContentStepId(steps: Step[]): string | null {
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    if (s && s.kind !== 'end') return s.id;
  }
  return null;
}

function renderStep(s: Step, idx: number, p: Props): React.ReactNode {
  if (s.kind === 'action') {
    return (
      <StepRow
        step={s}
        index={idx}
        onSlash={p.onSlash}
        onAt={p.onAt}
        onChipClick={p.onChipClick}
        onRefClick={p.onRefClick}
        onDelete={p.onDeleteStep}
      />
    );
  }
  if (s.kind === 'condition') {
    return (
      <ConditionRow
        cond={s}
        index={idx}
        onAddBranch={p.onAddBranch}
        onChipClick={p.onChipClick}
        onRefClick={p.onRefClick}
      />
    );
  }
  if (s.kind === 'approval') {
    return (
      <ApprovalStep
        step={s}
        index={idx}
        onSlash={p.onSlash}
        onAt={p.onAt}
        onChipClick={p.onChipClick}
        onRefClick={p.onRefClick}
      />
    );
  }
  // end step renders as a small marker (the canvas's ec-end-row equivalent)
  return (
    <div data-step-id={s.id} style={{ padding: '12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
      - end of playbook -
    </div>
  );
}
