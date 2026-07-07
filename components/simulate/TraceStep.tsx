'use client';

import { motion, useReducedMotion } from 'motion/react';
import { RiBrain2Line, RiContactsLine } from 'react-icons/ri';
import { ACTION_ICON } from '@/components/icons/ui/action-icon-map';
import { SIM_COPY } from '@/data/simFixtures';
import type { TraceStepDef, StepStatus } from './traceFixture';
import styles from './TraceStep.module.css';

interface Props {
  step: TraceStepDef;
  status: StepStatus;
  isLast: boolean;
  /** Actual elapsed ms for this run (drives the "Thought for Ns" label). */
  runMs?: number;
  /** Reply step: the drafted reply shown in the box. */
  draft?: string;
  /** Reply step: the reply is gated - show "Approval needed" + amber dot. */
  approval?: boolean;
  /** Condition step: no branch matched (attention) - amber note. */
  branchWarn?: boolean;
}

function StepIcon({ step }: { step: TraceStepDef }) {
  if (step.kind === 'thinking') return <RiBrain2Line />;
  if (step.iconKey === 'contact') return <RiContactsLine />;
  const key = step.kind === 'condition' ? 'condition' : step.iconKey;
  const Icon = key ? ACTION_ICON[key] : undefined;
  return Icon ? <Icon /> : null;
}

/**
 * TraceStep - one execution step in the redesigned trace (Figma 1839:34067). A
 * status rail (dot + connector) beside a label row (icon + name + optional
 * " · medium"), then the step's payload below: reasoning text for a thinking
 * step, a gray output box for an action, the matched branch for a condition, or
 * the drafted reply (with "Approval needed" when gated) for the reply step.
 */
export default function TraceStep({ step, status, isLast, runMs, draft, approval, branchWarn }: Props) {
  const reduce = useReducedMotion();
  const spring = { type: 'spring' as const, stiffness: 520, damping: 38 };
  const enter = reduce ? false : { opacity: 0, y: -3 };
  const revealed = status === 'done' || status === 'failed';

  const isThinking = step.kind === 'thinking';
  const isReply = step.kind === 'reply';
  const isCond = step.kind === 'condition';
  // The reply's dot goes amber when the reply is held for approval.
  const dotKind = isReply && approval && revealed ? 'approval' : undefined;

  // A thinking step reads "Thinking" while in flight, "Thought for Ns" once done.
  const thoughtSec = Math.max(1, Math.round((runMs ?? step.ms) / 1000));
  const label = isThinking
    ? status === 'done'
      ? `Thought for ${thoughtSec}s`
      : 'Thinking'
    : isCond
      ? 'Categorize'
      : step.label;

  return (
    <div className={styles.step} data-status={status} data-dot={dotKind}>
      <div className={styles.row}>
        <div className={styles.rail}>
          <span className={styles.dot} aria-hidden />
        </div>
        <div className={styles.label} data-thinking={isThinking || undefined}>
          <span className={styles.iconBox} aria-hidden>
            <StepIcon step={step} />
          </span>
          <span className={styles.name}>{label}</span>
          {step.suffix && (
            <>
              <span className={styles.sep} aria-hidden>
                ·
              </span>
              <span className={styles.medium}>{step.suffix}</span>
            </>
          )}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.rail}>{!isLast && <span className={styles.line} aria-hidden />}</div>
        <div className={styles.content}>
          {/* Thinking: the reasoning appears as the step runs (it IS the step). */}
          {isThinking && (status === 'running' || revealed) && (
            <motion.p className={styles.reasoning} initial={enter} animate={{ opacity: 1, y: 0 }} transition={spring}>
              {step.text}
            </motion.p>
          )}

          {isCond && revealed && (
            <motion.p
              className={styles.reasoning}
              data-warn={branchWarn || undefined}
              initial={enter}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
            >
              {branchWarn ? SIM_COPY.noBranchTrace : `Matched: ${step.branch}`}
            </motion.p>
          )}

          {step.kind === 'action' && status === 'done' && step.output && (
            <motion.div className={styles.box} initial={enter} animate={{ opacity: 1, y: 0 }} transition={spring}>
              {step.output}
            </motion.div>
          )}
          {step.kind === 'action' && status === 'failed' && (
            <motion.div className={styles.errorBox} initial={enter} animate={{ opacity: 1, y: 0 }} transition={spring}>
              {SIM_COPY.stepError}
            </motion.div>
          )}

          {isReply && revealed && (
            <motion.div
              className={styles.replyWrap}
              initial={enter}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
            >
              {approval && <p className={styles.approvalNote}>{SIM_COPY.approvalTrace}</p>}
              <div className={styles.box}>{draft}</div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
