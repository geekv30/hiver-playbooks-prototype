import { RiBrain2Line } from 'react-icons/ri';
import { ACTION_ICON } from '@/components/icons/ui/action-icon-map';
import { HubSpotIcon, ClickUpIcon } from '@/components/icons/connectors';
import type { RunStep, SkillRun } from '@/data/runFixtures';
import { formatDuration } from './runsModel';
import styles from './RunTrace.module.css';

/** Icon for a step. Connector steps carry their real brand mark - on a live
 *  run, "which system did this touch" is part of reading the trace. */
function StepIcon({ step }: { step: RunStep }) {
  if (step.kind === 'thinking') return <RiBrain2Line />;
  if (step.iconKey === 'contact') return <HubSpotIcon />;
  if (step.iconKey === 'clickup') return <ClickUpIcon />;
  const key = step.kind === 'condition' ? 'condition' : step.iconKey;
  const Icon = key ? ACTION_ICON[key] : undefined;
  return Icon ? <Icon /> : null;
}

/** The step's name, independent of its status - shared by the rows and by the
 *  collapsed tail, so one step never has two names in the same trace. */
function stepName(step: RunStep): string {
  if (step.kind === 'thinking') return 'Reasoning';
  if (step.kind === 'condition') return 'Categorize';
  return step.label ?? 'Step';
}

/** The row label. A thinking step states its own duration, in whole seconds to
 *  match the Evaluation trace - its duration bar is suppressed below so the
 *  rounding cannot contradict a millisecond figure beside it. */
function stepLabel(step: RunStep): string {
  if (step.kind === 'thinking' && step.status === 'done') {
    return `Thought for ${Math.max(1, Math.round(step.ms / 1000))}s`;
  }
  return stepName(step);
}

/**
 * RunTrace - the ordered steps this run walked, with what each one produced.
 *
 * The same rail-and-payload grammar as the Evaluation trace, so one execution
 * vocabulary covers both surfaces. Two things are specific to a live run: a
 * duration bar per step, scaled against the slowest step in the run, and the
 * error payload on the step that threw - the only place a failure explains
 * itself.
 */
export default function RunTrace({ run }: { run: SkillRun }) {
  const slowest = Math.max(1, ...run.steps.filter((s) => s.status !== 'skipped').map((s) => s.ms));
  // Once a run stops, every remaining step carries the same reason. Repeating
  // that sentence per row turns the end of a failed trace into four identical
  // lines, so the tail collapses into one.
  const ran = run.steps.filter((s) => s.status !== 'skipped');
  const skippedTail = run.steps.filter((s) => s.status === 'skipped');
  const last = ran.length - 1;

  return (
    <div className={styles.trace}>
      {ran.map((step, i) => {
        const skipped = false;
        return (
          <div key={step.id} className={styles.step} data-status={step.status}>
            <div className={styles.row}>
              <div className={styles.rail}>
                <span className={styles.dot} aria-hidden />
              </div>
              <div className={styles.label}>
                <span className={styles.iconBox} aria-hidden>
                  <StepIcon step={step} />
                </span>
                <span className={styles.name}>{stepLabel(step)}</span>
                {step.suffix && (
                  <>
                    <span className={styles.sep} aria-hidden>
                      &middot;
                    </span>
                    <span className={styles.medium}>{step.suffix}</span>
                  </>
                )}
                {/* A thinking step already states its duration in its label;
                    repeating it as a bar would say the same thing twice. */}
                {!skipped && step.kind !== 'thinking' && (
                  <span className={styles.timing}>
                    <span className={styles.bar} aria-hidden>
                      <span
                        className={styles.barFill}
                        style={{ width: `${Math.max(4, (step.ms / slowest) * 100)}%` }}
                      />
                    </span>
                    <span className={styles.ms}>{formatDuration(step.ms)}</span>
                  </span>
                )}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rail}>{i !== last && <span className={styles.line} aria-hidden />}</div>
              <div className={styles.content}>
                {skipped ? (
                  <p className={styles.skippedNote}>Skipped - the run ended before this step.</p>
                ) : (
                  <>
                    {step.kind === 'thinking' && step.text && (
                      <p className={styles.reasoning}>{step.text}</p>
                    )}

                    {step.kind === 'condition' && step.branch && (
                      <p className={styles.reasoning}>Matched: {step.branch}</p>
                    )}

                    {step.kind === 'action' && step.status === 'done' && step.output && (
                      <div className={styles.box}>{step.output}</div>
                    )}

                    {step.status === 'failed' && (
                      <div className={styles.errorBox}>
                        {run.error && <span className={styles.errorCode}>{run.error.code}</span>}
                        {step.error ?? 'This step failed.'}
                      </div>
                    )}

                    {step.kind === 'reply' && step.status === 'done' && (
                      <>
                        {run.state === 'awaiting' && (
                          <p className={styles.approvalNote}>
                            Held for approval by {run.assignee ?? 'a teammate'}
                          </p>
                        )}
                        {run.state === 'declined' && (
                          <p className={styles.approvalNote}>
                            Declined by {run.assignee ?? 'a teammate'} - this reply never sent
                          </p>
                        )}
                        <div className={styles.box}>{step.draft}</div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {skippedTail.length > 0 && (
        <div className={styles.step} data-status="skipped">
          <div className={styles.row}>
            <div className={styles.rail}>
              <span className={styles.dot} aria-hidden />
            </div>
            <div className={styles.skippedTail}>
              <span className={styles.skippedCount}>
                {skippedTail.length} {skippedTail.length === 1 ? 'step' : 'steps'} did not run
              </span>
              <span className={styles.skippedNames}>
                {/* Same naming as the rows above - reading the fallback
                    "Step" here for a condition was the trace contradicting
                    itself two lines apart. */}
                {skippedTail.map((s) => stepName(s)).join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
