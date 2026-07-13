'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  RiAddLine,
  RiSubtractLine,
  RiPencilLine,
  RiArrowUpDownLine,
  RiSettings3Line,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiInformationFill,
} from 'react-icons/ri';
import { SparkleIcon } from '@/components/icons/ui';
import Button from '@/components/atoms/Button';
import ModalShell from '@/components/atoms/ModalShell';
import Spinner from '@/components/atoms/Spinner';
import { mailboxSummary } from '@/data/mailboxes';
import type { ConnectorSlug } from '@/types/playbook';
import type { EvalAggregate } from '@/components/simulate/useEvalState';
import type { ConnectorHealth } from '../connectorHealth';
import { computeChecks, type ReadinessInputs, type ReadinessCheck } from '../enable/readiness';
import ReadinessReview from '../enable/ReadinessReview';
import type { DocChange, ChangeKind } from './diff';
import styles from './PublishModal.module.css';

type Phase = 'form' | 'publishing';

interface Props {
  open: boolean;
  /** What changed vs the published snapshot - the review's headline content. */
  changes: DocChange[];
  /** The mailboxes the AOP is (or will be) live on - scopes the readiness run. */
  selected: string[];
  /** What the doc depends on (doc scan) - feeds the readiness checks. */
  readiness: ReadinessInputs;
  evalAgg: EvalAggregate;
  connectorHealth: Record<ConnectorSlug, ConnectorHealth>;
  onConnect: (slug: ConnectorSlug) => void;
  invited: ReadonlySet<string>;
  onInvite: (person: string, mailboxIds: string[]) => void;
  /** Leave the modal and open the evaluation panel. */
  onEvaluate: () => void;
  onClose: () => void;
  /** Publish: the working doc becomes the running version. */
  onConfirm: () => void;
}

const PUBLISHING_MS = 680;

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const CHANGE_GLYPH: Record<ChangeKind, ReactNode> = {
  added: <RiAddLine aria-hidden />,
  removed: <RiSubtractLine aria-hidden />,
  edited: <RiPencilLine aria-hidden />,
  moved: <RiArrowUpDownLine aria-hidden />,
  setting: <RiSettings3Line aria-hidden />,
};

/** The publish verdict: reviewing spinner while rows reveal, then a one-line
 *  summary. Same anatomy as the Enable review's verdict, publish-flavored copy. */
function Verdict({ checks, settled }: { checks: ReadinessCheck[]; settled: boolean }) {
  if (!settled) {
    return (
      <div className={styles.verdict} data-tone="checking">
        <Spinner size={15} />
        <span>Reviewing your changes…</span>
      </div>
    );
  }
  const warns = checks.filter((c) => c.tone === 'warn').length;
  const pendings = checks.filter((c) => c.tone === 'pending').length;
  if (warns > 0) {
    return (
      <div className={styles.verdict} data-tone="warn">
        <RiErrorWarningFill aria-hidden />
        <span>
          {warns === 1 ? '1 thing needs' : `${warns} things need`} attention - the AOP may not run
          cleanly after publishing.
        </span>
      </div>
    );
  }
  if (pendings > 0) {
    return (
      <div className={styles.verdict} data-tone="pending">
        <RiInformationFill aria-hidden />
        <span>You can publish - the items below are pending, not blocking.</span>
      </div>
    );
  }
  return (
    <div className={styles.verdict} data-tone="ok">
      <RiCheckboxCircleFill aria-hidden />
      <span>All checks passed - your changes are ready to go live.</span>
    </div>
  );
}

// The publish review (draft-and-publish model): one step - what changed since
// the published version, plus a readiness re-run against the live mailboxes.
// Publishing swaps the running AOP onto the new version; the parent toasts it.
export default function PublishModal({
  open,
  changes,
  selected,
  readiness,
  evalAgg,
  connectorHealth,
  onConnect,
  invited,
  onInvite,
  onEvaluate,
  onClose,
  onConfirm,
}: Props) {
  const [phase, setPhase] = useState<Phase>('form');
  const [settled, setSettled] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!open) return;
    setPhase('form');
    setSettled(false);
  }, [open]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const checks = useMemo(
    () => computeChecks(readiness, selected, evalAgg, { connectorHealth, invited }),
    [readiness, selected, evalAgg, connectorHealth, invited],
  );
  const warns = checks.filter((c) => c.tone === 'warn').length;

  const confirm = () => {
    if (phase !== 'form' || !settled) return;
    if (prefersReduced()) {
      onConfirm();
      return;
    }
    setPhase('publishing');
    timers.current.push(window.setTimeout(() => onConfirm(), PUBLISHING_MS));
  };

  if (!open) return null;

  return (
    <ModalShell
      ariaLabel="Review and publish changes"
      onClose={onClose}
      locked={phase !== 'form'}
      phase={phase}
      dialogClassName={styles.dialog}
    >
      {(requestClose) => (
        <>
          <header className={styles.head}>
            <span className={styles.headIcon} aria-hidden>
              <SparkleIcon />
            </span>
            <h2 className={styles.headTitle}>Review &amp; publish</h2>
          </header>

          <div className={styles.body}>
            <Verdict checks={checks} settled={settled} />
            <span className={styles.scope}>
              The live version keeps running on {mailboxSummary(selected)} until you publish.
            </span>

            <span className={styles.sectionLabel}>What changed</span>
            <ul className={styles.changes}>
              {changes.map((c, i) => (
                <li key={`${c.kind}-${c.label}-${i}`} className={styles.changeRow}>
                  <span className={styles.changeGlyph} data-kind={c.kind}>
                    {CHANGE_GLYPH[c.kind]}
                  </span>
                  <span className={styles.changeLabel}>{c.label}</span>
                  <span className={styles.changeDetail}>{c.detail}</span>
                </li>
              ))}
              {changes.length === 0 && (
                <li className={styles.changeEmpty}>No changes since the published version.</li>
              )}
            </ul>

            <span className={styles.sectionLabel}>Readiness</span>
            <div className={styles.reviewList}>
              <ReadinessReview
                checks={checks}
                onSettled={() => setSettled(true)}
                onConnect={onConnect}
                onInvite={onInvite}
                onEvaluate={onEvaluate}
              />
            </div>
          </div>

          <footer className={styles.foot}>
            <button
              type="button"
              className={styles.cancel}
              onClick={requestClose}
              disabled={phase !== 'form'}
            >
              Keep editing
            </button>
            <Button
              variant="accent"
              onClick={confirm}
              disabled={!settled || phase !== 'form' || changes.length === 0}
            >
              {phase === 'publishing' ? (
                <span className={styles.publishing}>
                  <Spinner size={16} />
                  Publishing…
                </span>
              ) : settled ? (
                warns > 0 ? (
                  'Publish anyway'
                ) : (
                  'Publish changes'
                )
              ) : (
                'Reviewing…'
              )}
            </Button>
          </footer>
        </>
      )}
    </ModalShell>
  );
}
