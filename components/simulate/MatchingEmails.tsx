'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  RiPlayFill,
  RiStopCircleLine,
  RiSearchEyeLine,
  RiInboxUnarchiveLine,
  RiRefreshLine,
  RiFlaskLine,
  RiQuestionLine,
} from 'react-icons/ri';
import MatchingHowTooltip from './MatchingHowTooltip';
import { MAILBOXES, mailboxName } from '@/data/mailboxes';
import { SCAN_CEILING, poolForMailbox } from '@/data/matchPool';
import type { SimEmail, SimStatusKind } from '@/data/simFixtures';
import Dropdown from '@/components/atoms/Dropdown';
import Button from '@/components/atoms/Button';
import EvalBackHeader from './EvalBackHeader';
import { EVAL_ICONS, EVAL_TITLES } from './EvalMenu';
import PickableEmailCard from './PickableEmailCard';
import ConversationModal from './ConversationModal';
import EmailCard from './EmailCard';
import SimEmptyState from './SimEmptyState';
import { useSimRun } from './useSimRun';
import { markMatchingIntroSeen, useMatchingIntroSeen } from './matchingIntro';
import type { TriggerScan } from './useTriggerScan';
import styles from './MatchingEmails.module.css';

interface Props {
  /** The live trigger text - what every email is matched against. */
  trigger: string;
  /** The shared mailboxes this skill runs on (ids). Empty until it has any. */
  mailboxes: string[];
  /** The canvas-level scan (shared with the tab badge and Copilot's handoff). */
  scan: TriggerScan;
  /** Leave this flow back to the Evaluate menu. */
  onExit: () => void;
  /** Report a completed run's status up to the canvas (the eval aggregate). */
  onRunRecorded?: (statuses: SimStatusKind[]) => void;
  /** Open the Copilot tab (Fix with Copilot on a caught gap). */
  onOpenCopilot?: () => void;
  /** Focus the trigger line in the editor (the no-trigger empty state). */
  onAddTrigger?: () => void;
  /** Switch to the AI scenarios flow (offered when nothing matched). */
  onTryScenarios?: () => void;
}

const NO_EMAILS: SimEmail[] = [];

// Ghost rows for the no-trigger state: the real card renderer, dimmed, over
// generic pool content (no skill-specific data - reusability rule).
const GHOSTS = poolForMailbox('support', 3);

/**
 * MatchingEmails - the "Matching emails" evaluation type.
 *
 * Real inbound mail from ONE of the skill's shared mailboxes that matches the
 * skill's trigger. The scan reads 50 at a time and stops at the first batch with
 * matches; `Scan more` reads the next 50, up to 200. Everything the scan did is
 * stated on the header, so the depth of the sample is never implied.
 */
export default function MatchingEmails({
  trigger,
  mailboxes,
  scan,
  onExit,
  onRunRecorded,
  onOpenCopilot,
  onAddTrigger,
  onTryScenarios,
}: Props) {
  const { state, stale } = scan;
  const hasTrigger = trigger.trim().length > 0;

  // Which mailbox this flow is looking at: what the scan covers, else the
  // skill's first, else nothing until the user picks one.
  const [picked, setPicked] = useState<string>('');
  const mailbox = state.mailboxId ?? picked ?? '';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  // The explainer auto-shows until it has been read once (remembered across
  // reloads by a module store). Reading it never puts it out of reach: the
  // header's "How it works" reopens it whenever someone wants it back.
  const introSeen = useMatchingIntroSeen();
  const [introReopened, setIntroReopened] = useState(false);
  const showIntro = !introSeen || introReopened;

  // Entering the flow with a mailbox but no scan yet: start one. (Journey B
  // starts it on open at canvas level; this covers entering from a cold panel.)
  useEffect(() => {
    if (hasTrigger && mailbox && state.phase === 'idle') scan.start(mailbox);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTrigger, mailbox, state.phase]);

  const switchMailbox = (id: string) => {
    setPicked(id);
    setSelectedId(null);
    setRunId(null);
    scan.start(id);
  };

  const matches = state.matches;
  const runEmail = useMemo(() => matches.find((e) => e.id === runId) ?? null, [matches, runId]);
  const runEmails = useMemo(() => (runEmail ? [runEmail] : NO_EMAILS), [runEmail]);
  const { phase: runPhase, runs, start: startRun, stop: stopRun } = useSimRun(runEmails, onRunRecorded);

  useEffect(() => {
    if (runId) startRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const running = runId !== null;
  const scanning = state.phase === 'scanning';
  const canEvaluate = !!selectedId && !stale && matches.some((e) => e.id === selectedId);

  const back = () => {
    if (running) {
      stopRun();
      setRunId(null);
    } else {
      onExit();
    }
  };

  const reviewEmail = reviewId ? matches.find((e) => e.id === reviewId) ?? null : null;
  const mailboxOptions = useMemo(
    () =>
      (mailboxes.length > 0 ? mailboxes : MAILBOXES.map((m) => m.id)).map((id) => ({
        id,
        label: mailboxName(id),
      })),
    [mailboxes],
  );

  // ---- no trigger: nothing can be matched yet -----------------------------
  if (!hasTrigger) {
    return (
      <div className={styles.flow}>
        <EvalBackHeader title={EVAL_TITLES.matching} icon={EVAL_ICONS.matching} onBack={onExit} />
        <div className={styles.scroll}>
          <SimEmptyState
            ghosts={GHOSTS.map((e) => (
              <PickableEmailCard key={e.id} email={e} selected={false} onSelect={() => {}} />
            ))}
            icon={RiSearchEyeLine}
            title="No trigger to match against"
            body="Matching emails reads the recent mail in a shared mailbox and keeps the ones your trigger would fire on. Write the trigger first and they will show up here."
            action={
              onAddTrigger ? (
                <Button variant="text" onClick={onAddTrigger}>
                  Add a trigger to get started
                </Button>
              ) : undefined
            }
          />
        </div>
      </div>
    );
  }

  // ---- no mailbox chosen yet ---------------------------------------------
  if (!mailbox) {
    return (
      <div className={styles.flow}>
        <EvalBackHeader title={EVAL_TITLES.matching} icon={EVAL_ICONS.matching} onBack={onExit} />
        <div className={styles.controls}>
          <Dropdown
            options={mailboxOptions}
            value=""
            onChange={switchMailbox}
            placeholder="Select a shared mailbox"
            ariaLabel="Select a shared mailbox"
          />
        </div>
      </div>
    );
  }

  const settled = state.phase === 'settled';
  const zero = settled && matches.length === 0;
  const showScanMore = settled && !state.exhausted && !running && !stale;
  // The footer holds Evaluate until a run finishes, then gets out of the way.
  const showFooter = !zero && (!running || runPhase !== 'done');
  // Zero after the ceiling is a finding; zero after a cancelled scan is just as
  // far as we read, so the copy and the actions differ.
  const zeroAtCeiling = zero && state.exhausted;

  return (
    <div className={styles.flow}>
      <EvalBackHeader
        title={EVAL_TITLES.matching}
        icon={EVAL_ICONS.matching}
        onBack={back}
        action={
          running ? undefined : (
            <span className={styles.howWrap}>
              <button
                type="button"
                className={styles.howBtn}
                aria-expanded={showIntro}
                onClick={() => {
                  if (showIntro) {
                    markMatchingIntroSeen();
                    setIntroReopened(false);
                  } else {
                    setIntroReopened(true);
                  }
                }}
              >
                <RiQuestionLine aria-hidden />
                How it works?
              </button>
              {showIntro && (
                <MatchingHowTooltip
                  onDismiss={() => {
                    markMatchingIntroSeen();
                    setIntroReopened(false);
                  }}
                />
              )}
            </span>
          )
        }
      />

      {!running && (
        <div className={styles.scope}>
          {mailboxOptions.length > 1 ? (
            <Dropdown
              options={mailboxOptions}
              value={mailbox}
              onChange={switchMailbox}
              placeholder="Select a shared mailbox"
              ariaLabel="Mailbox being scanned"
            />
          ) : (
            <span className={styles.scopeName}>
              <RiInboxUnarchiveLine aria-hidden />
              {mailboxName(mailbox)}
            </span>
          )}

          <div className={styles.depthRow}>
            {/* Announced when it settles, silent while the count ticks. */}
            <p className={styles.depth} aria-live={scanning ? 'off' : 'polite'}>
              {scanning ? (
                <>
                  Scanning {mailboxName(mailbox)}
                  <span className={styles.count}>
                    {state.scanned} of {SCAN_CEILING}
                  </span>
                </>
              ) : (
                <>
                  Scanned {state.scanned} of {SCAN_CEILING}
                  <span className={styles.count}>
                    {matches.length} matched
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {stale && !running && (
        <div className={styles.stale}>
          <span>Your trigger changed since this scan.</span>
          <button type="button" className={styles.staleBtn} onClick={() => scan.start(mailbox)}>
            <RiRefreshLine aria-hidden />
            Rematch
          </button>
        </div>
      )}

      {running ? (
        <div className={styles.list} data-running>
          {runEmail && (
            <EmailCard email={runEmail} run={runs[runEmail.id]} onRerun={startRun} onFix={onOpenCopilot} />
          )}
        </div>
      ) : zero ? (
        <div className={styles.zero}>
          <RiSearchEyeLine className={styles.zeroIcon} aria-hidden />
          <p className={styles.zeroTitle}>
            {zeroAtCeiling
              ? `No matches in the ${SCAN_CEILING} most recent emails`
              : `No matches in the first ${state.scanned} emails`}
          </p>
          <p className={styles.zeroBody}>
            {zeroAtCeiling
              ? `Nothing in ${mailboxName(mailbox)} looks like what your trigger describes. A narrow trigger, or a quiet mailbox, both read this way.`
              : `That is as far as this scan read. There are ${SCAN_CEILING - state.scanned} more recent emails in ${mailboxName(mailbox)} to look through.`}
          </p>
          <div className={styles.zeroActions}>
            {showScanMore && (
              <Button variant="secondary" onClick={scan.more}>
                Scan more
              </Button>
            )}
            {onTryScenarios && (
              <Button
                variant={showScanMore ? 'text' : 'secondary'}
                iconLeft={showScanMore ? undefined : <RiFlaskLine />}
                onClick={onTryScenarios}
              >
                Try AI scenarios
              </Button>
            )}
            {mailboxOptions.length > 1 && (
              <Button
                variant="text"
                onClick={() => {
                  // Clear the scan AND the pick, so the flow returns to its
                  // mailbox picker instead of staying on the scanned one.
                  scan.reset();
                  setPicked('');
                  setSelectedId(null);
                }}
              >
                Try another mailbox
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={styles.list}
          role="radiogroup"
          aria-label="Matching emails"
          // A stale scan's rows are dimmed and inert: they were matched against
          // a trigger that no longer exists, so Rematch is the only move.
          data-stale={stale || undefined}
          inert={stale || undefined}
        >
          {matches.map((e, i) => (
            <div key={e.id} className={styles.cardReveal} style={{ '--i': i % 6 } as CSSProperties}>
              <PickableEmailCard
                email={e}
                selected={selectedId === e.id}
                onSelect={() => setSelectedId(e.id)}
                onOpen={() => setReviewId(e.id)}
                aside={e.received}
              />
            </div>
          ))}

          {showScanMore && (
            <button type="button" className={styles.moreBtn} onClick={scan.more}>
              Scan more
            </button>
          )}

          {scanning && (
            <div className={styles.skeletons} aria-hidden>
              {[0, 1, 2].map((i) => (
                <div key={i} className={styles.skeleton} style={{ '--i': i } as CSSProperties}>
                  <span className={styles.skLine} data-w="short" />
                  <span className={styles.skLine} data-w="long" />
                  <span className={styles.skLine} data-w="mid" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showFooter && (
        <div className={styles.footer}>
          {running ? (
            <button type="button" className={styles.stopBtn} onClick={back}>
              <RiStopCircleLine aria-hidden />
              <span>Stop evaluation</span>
            </button>
          ) : scanning ? (
            <button type="button" className={styles.stopBtn} onClick={scan.cancel}>
              <RiStopCircleLine aria-hidden />
              <span>Stop scanning</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.evalBtn}
              data-ready={canEvaluate || undefined}
              disabled={!canEvaluate}
              onClick={() => canEvaluate && setRunId(selectedId)}
            >
              <RiPlayFill aria-hidden />
              <span>Evaluate</span>
            </button>
          )}
        </div>
      )}

      {reviewEmail && <ConversationModal email={reviewEmail} onClose={() => setReviewId(null)} />}
    </div>
  );
}
