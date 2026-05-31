import type { TraceStepDef, StepStatus } from './traceFixture';
import styles from './TraceStep.module.css';

interface Props {
  step: TraceStepDef;
  status: StepStatus;
  isLast: boolean;
}

/**
 * TraceStep — one execution step (Figma 211:20462): a status rail (dot + the
 * connector line to the next step) + the step chip (icon · label · mono meta).
 * Timing + output appear once the step resolves; a Condition shows its matched
 * branch (matched-path-only).
 */
export default function TraceStep({ step, status, isLast }: Props) {
  const { Icon } = step;
  const resolved = status === 'done' || status === 'failed';
  return (
    <div className={styles.step} data-status={status}>
      <div className={styles.rail}>
        <span className={styles.dot} aria-hidden />
        {!isLast && <span className={styles.line} aria-hidden />}
      </div>
      <div className={styles.content}>
        <div className={styles.chip}>
          <span className={styles.icon} data-brand={step.brand || undefined}>
            <Icon width={14} height={14} />
          </span>
          <span className={styles.label}>{step.label}</span>
          {step.meta && (
            <>
              <span className={styles.sep}>·</span>
              <span className={styles.meta}>{step.meta}</span>
            </>
          )}
        </div>
        {resolved && step.branch && <div className={styles.branch}>{step.branch}</div>}
        {resolved && (
          <div className={styles.detail}>
            <div className={styles.timing}>{step.ms} ms</div>
            {step.output && <div className={styles.output}>{step.output}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
