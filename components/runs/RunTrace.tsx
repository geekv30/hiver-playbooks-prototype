'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { RiBrain2Line, RiInformationLine } from 'react-icons/ri';
import { ACTION_ICON } from '@/components/icons/ui/action-icon-map';
import { HubSpotIcon, ClickUpIcon } from '@/components/icons/connectors';
import type { RunStep, SkillRun } from '@/data/runFixtures';
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



/** A payload clamped to two lines, with "Show more" only when it actually
 *  overflows - a long tag list or a drafted reply stays one glance tall until
 *  someone asks for the rest. */
function Clamp({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    setOver(el.scrollHeight > el.clientHeight + 1);
  }, [children, open]);
  return (
    <div className={className}>
      <p ref={ref} className={styles.clampText} data-open={open || undefined}>
        {children}
      </p>
      {(over || open) && (
        <button type="button" className={styles.more} onClick={() => setOpen((o) => !o)}>
          {open ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

/**
 * RunTrace - the ordered steps this run walked, with what each one produced.
 *
 * The same rail-and-payload grammar as the Evaluation trace, so one execution
 * vocabulary covers both surfaces. What a live run adds is the error payload on
 * the step that threw - the only place a failure explains itself.
 *
 * No per-step timings. A millisecond figure beside every row is noise on the
 * question this answers ("what did it do"), and the run's total is one line away
 * in the facts rail.
 */
export default function RunTrace({ run }: { run: SkillRun }) {
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
          <div
            key={step.id}
            className={styles.step}
            data-status={step.status}
            data-kind={step.kind}
          >
            <div className={styles.row}>
              <div className={styles.rail}>
                <span className={styles.dot} aria-hidden />
              </div>
              <div className={styles.label}>
                <span className={styles.iconBox} aria-hidden>
                  <StepIcon step={step} />
                </span>
                <span className={styles.name}>{stepName(step)}</span>
                {step.suffix && (
                  <>
                    <span className={styles.sep} aria-hidden>
                      &middot;
                    </span>
                    <span className={styles.medium}>{step.suffix}</span>
                  </>
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
                      <Clamp className={styles.box}>{step.output}</Clamp>
                    )}

                    {step.status === 'failed' && (
                      <div className={styles.errorBox}>
                        {run.error && <span className={styles.errorCode}>{run.error.code}</span>}
                        {step.error ?? 'This step failed.'}
                      </div>
                    )}

                    {step.kind === 'reply' && step.status === 'done' && (
                      <div className={styles.reply}>
                        {/* Who holds it is in the outcome card above; here the
                            step only says what state the draft is in. Acting on
                            it happens on the conversation. */}
                        {run.state === 'awaiting' && (
                          <span className={styles.chip} data-tone="awaiting">
                            <RiInformationLine aria-hidden />
                            Approval required
                          </span>
                        )}
                        {run.state === 'declined' && (
                          <span className={styles.chip} data-tone="declined">
                            <RiInformationLine aria-hidden />
                            Declined - this reply never sent
                          </span>
                        )}
                        {step.draft && <Clamp className={styles.box}>{step.draft}</Clamp>}
                      </div>
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
