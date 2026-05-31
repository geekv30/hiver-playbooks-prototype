'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { TraceStepDef, StepStatus } from './traceFixture';
import styles from './TraceStep.module.css';

interface Props {
  step: TraceStepDef;
  status: StepStatus;
  isLast: boolean;
  /** Style the branch line as a caught gap (amber). */
  branchWarn?: boolean;
}

/**
 * TraceStep — one execution step (Figma 211:20462): a status rail (dot + the
 * connector line) + the step chip. Once resolved it springs in timing + output
 * (Motion / motion.dev); a failed step shows an error; skipped steps dim out; a
 * Condition shows its matched branch (or the caught gap when none matched).
 */
export default function TraceStep({ step, status, isLast, branchWarn }: Props) {
  const { Icon } = step;
  const done = status === 'done';
  const failed = status === 'failed';
  const reduce = useReducedMotion();

  const spring = { type: 'spring' as const, stiffness: 520, damping: 38 };
  const enter = reduce ? false : { opacity: 0, y: -3 };

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
        {(done || failed) && step.branch && (
          <motion.div
            className={styles.branch}
            data-warn={branchWarn || undefined}
            initial={enter}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
          >
            {step.branch}
          </motion.div>
        )}
        {done && (
          <motion.div className={styles.detail} initial={enter} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <div className={styles.timing}>{step.ms} ms</div>
            {step.output && <div className={styles.output}>{step.output}</div>}
          </motion.div>
        )}
        {failed && (
          <motion.div className={styles.detail} initial={enter} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <div className={styles.timing}>{step.ms} ms</div>
            <div className={styles.error}>errored - no response</div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
