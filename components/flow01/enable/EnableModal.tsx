'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  RiSearchLine,
  RiRobot2Line,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiInformationFill,
} from 'react-icons/ri';
import { SparkleIcon } from '@/components/icons/ui';
import Checkbox from '@/components/atoms/Checkbox';
import Button from '@/components/atoms/Button';
import ModalShell from '@/components/atoms/ModalShell';
import Spinner from '@/components/atoms/Spinner';
import { MAILBOXES, mailboxName, mailboxSummary } from '@/data/mailboxes';
import type { ConnectorSlug } from '@/types/playbook';
import type { EvalAggregate } from '@/components/simulate/useEvalState';
import type { ConnectorHealth } from '../connectorHealth';
import { computeChecks, type ReadinessInputs, type ReadinessCheck } from './readiness';
import ReadinessReview from './ReadinessReview';
import styles from './EnableModal.module.css';

type Phase = 'form' | 'enabling' | 'success';
/** commit mode is a two-step flow: setup (name / surface / mailboxes) then
 *  review (readiness checks against that selection). manage stays single-step. */
type Step = 'setup' | 'review';
/** The go-live surface tabs (Figma 1854:14203): AI Agents = the AOP runs
 *  autonomously; AI Copilot = it assists teammates. Directional - both tabs
 *  pick over the same shared-mailbox selection for now. */
type Surface = 'agents' | 'copilot';

interface Props {
  open: boolean;
  /** commit = the go-live flow (Enable button) -> review -> success moment;
   *  manage = edit a live AOP's name + mailboxes (the settings gear) -> Save. */
  mode: 'commit' | 'manage';
  name: string;
  onNameChange: (s: string) => void;
  /** Selected mailbox ids. */
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  /** What the AOP depends on (doc scan) - feeds the Review step's checks. */
  readiness: ReadinessInputs;
  evalAgg: EvalAggregate;
  /** Connector health from the shared store (the Connectors hub). */
  connectorHealth: Record<ConnectorSlug, ConnectorHealth>;
  onConnect: (slug: ConnectorSlug) => void;
  invited: ReadonlySet<string>;
  onInvite: (person: string, mailboxIds: string[]) => void;
  /** Leave the modal and open the evaluation panel. */
  onEvaluate: () => void;
  onClose: () => void;
  /** commit: go live (fired after the success moment). manage: save changes. */
  onConfirm: () => void;
}

const ENABLING_MS = 720;
const SUCCESS_HOLD_MS = 1700;

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** The go-live success moment: a check that draws in, the AOP name, and the
 *  mailbox chips it went live on (staggered). Motion is the transitions.dev
 *  success-check + texts-reveal on our tokens. */
function SuccessView({ name, mailboxes }: { name: string; mailboxes: string[] }) {
  const shown = mailboxes.slice(0, 6);
  return (
    <div className={styles.success}>
      <svg className={styles.checkSvg} viewBox="0 0 52 52" aria-hidden>
        <circle className={styles.checkCircle} cx="26" cy="26" r="24" />
        <path className={styles.checkMark} d="M15 27 l7.5 7.5 L37 19" />
      </svg>
      <h2 className={styles.successTitle}>
        <span className={styles.successName}>{name}</span> is live
      </h2>
      <p className={styles.successSub}>Now running on {mailboxSummary(mailboxes)}.</p>
      <div className={styles.successChips}>
        {shown.map((id, i) => (
          <span key={id} className={styles.mbChip} style={{ '--i': i } as CSSProperties}>
            <span className={styles.mbAvatar}>{mailboxName(id).slice(0, 1)}</span>
            {mailboxName(id)}
          </span>
        ))}
        {mailboxes.length > shown.length && (
          <span className={styles.mbChip} style={{ '--i': shown.length } as CSSProperties}>
            +{mailboxes.length - shown.length}
          </span>
        )}
      </div>
    </div>
  );
}

/** The Review step's live verdict: reviewing spinner while rows reveal, then a
 *  one-line summary that tracks the checks as the user fixes things. */
function Verdict({ checks, settled }: { checks: ReadinessCheck[]; settled: boolean }) {
  if (!settled) {
    return (
      <div className={styles.verdict} data-tone="checking">
        <Spinner size={15} />
        <span>Reviewing this AOP against your selection…</span>
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
          {warns === 1 ? '1 thing needs' : `${warns} things need`} attention before this AOP can
          run cleanly.
        </span>
      </div>
    );
  }
  if (pendings > 0) {
    return (
      <div className={styles.verdict} data-tone="pending">
        <RiInformationFill aria-hidden />
        <span>You can go live - the items below are pending, not blocking.</span>
      </div>
    );
  }
  return (
    <div className={styles.verdict} data-tone="ok">
      <RiCheckboxCircleFill aria-hidden />
      <span>All checks passed - this AOP is ready to go live.</span>
    </div>
  );
}

export default function EnableModal({
  open,
  mode,
  name,
  onNameChange,
  selected,
  onSelectedChange,
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
  const [step, setStep] = useState<Step>('setup');
  // Slide direction for the keyed step transition (fwd = enter review, back =
  // return to setup). transitions.dev keyed directional slide on our tokens.
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  const [settled, setSettled] = useState(false);
  const [query, setQuery] = useState('');
  const [surface, setSurface] = useState<Surface>('agents');
  const nameRef = useRef<HTMLInputElement>(null);
  const stepBodyRef = useRef<HTMLDivElement>(null);
  const dialogEl = useRef<HTMLElement | null>(null);
  const timers = useRef<number[]>([]);

  // Reset transient state each time the modal opens and move focus into the
  // dialog. (Scrim/Esc/close mechanics + focus restore live on ModalShell.)
  useEffect(() => {
    if (!open) return;
    setPhase('form');
    setStep('setup');
    setDir('fwd');
    setSettled(false);
    setQuery('');
    setSurface('agents');
    requestAnimationFrame(() => nameRef.current?.focus());
  }, [open]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const checks = useMemo(
    () => computeChecks(readiness, selected, evalAgg, { connectorHealth, invited }),
    [readiness, selected, evalAgg, connectorHealth, invited],
  );

  // Card-resize (transitions.dev): the setup step wants the tall fixed dialog
  // (its mailbox list scrolls); the review step sizes to its checks. Measure
  // the natural height on step/content change and animate the dialog to it -
  // never leave a dead void under a short check list. The dialog node is the
  // step body's parent (ModalShell owns it).
  useLayoutEffect(() => {
    if (phase === 'success') {
      // Success sizes itself via CSS (height: auto) - drop the inline override.
      if (dialogEl.current) dialogEl.current.style.height = '';
      return;
    }
    const d = stepBodyRef.current?.parentElement;
    if (!d) return;
    dialogEl.current = d;
    const from = d.offsetHeight;
    d.style.height = 'auto';
    const to = d.offsetHeight; // natural height, capped by the CSS max-height
    if (prefersReduced() || Math.abs(to - from) < 2) {
      d.style.height = `${to}px`;
      return;
    }
    d.style.height = `${from}px`;
    void d.offsetHeight; /* commit the start height so the transition runs */
    d.style.height = `${to}px`;
  }, [phase, step, checks, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MAILBOXES;
    return MAILBOXES.filter(
      (m) => m.name.toLowerCase().includes(q) || m.address.toLowerCase().includes(q),
    );
  }, [query]);

  const toggle = (id: string) =>
    onSelectedChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const warns = checks.filter((c) => c.tone === 'warn').length;

  const canContinue = name.trim().length > 0 && selected.length > 0;
  const liveName = name.trim() || 'Untitled AOP';

  const goReview = () => {
    if (!canContinue) return;
    setDir('fwd');
    setSettled(false);
    setStep('review');
  };
  const goBack = () => {
    setDir('back');
    setStep('setup');
  };

  const confirm = () => {
    if (!canContinue || phase !== 'form') return;
    if (mode === 'manage' || prefersReduced()) {
      onConfirm();
      return;
    }
    setPhase('enabling');
    timers.current.push(window.setTimeout(() => setPhase('success'), ENABLING_MS));
    timers.current.push(window.setTimeout(() => onConfirm(), ENABLING_MS + SUCCESS_HOLD_MS));
  };

  if (!open) return null;

  const onReview = mode === 'commit' && step === 'review';
  const title = mode === 'manage' ? 'AOP settings' : onReview ? 'Review & go live' : 'Enable AOP';
  const goLiveLabel =
    warns > 0
      ? 'Go live anyway'
      : `Go live on ${selected.length} ${selected.length === 1 ? 'mailbox' : 'mailboxes'}`;

  return (
    <ModalShell
      ariaLabel={title}
      onClose={onClose}
      locked={phase !== 'form'} /* never bail mid go-live anim */
      phase={phase}
      dialogClassName={styles.dialog}
    >
      {(requestClose) => (
        <>
        {phase === 'success' ? (
          <SuccessView name={liveName} mailboxes={selected} />
        ) : (
          <>
            <header className={styles.head}>
              <span className={styles.headIcon} aria-hidden>
                <SparkleIcon />
              </span>
              <h2 className={styles.headTitle}>{title}</h2>
              {mode === 'commit' && (
                <span className={styles.stepCrumb}>Step {onReview ? 2 : 1} of 2</span>
              )}
            </header>

            {onReview ? (
              /* ---- Step 2: readiness review ---- */
              <div key="review" ref={stepBodyRef} className={styles.body} data-slide={dir} data-step="review">
                <Verdict checks={checks} settled={settled} />
                <span className={styles.reviewScope}>
                  Checked against {mailboxSummary(selected)} ·{' '}
                  {surface === 'agents' ? 'AI Agents' : 'AI Copilot'}
                </span>
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
            ) : (
              /* ---- Step 1: setup ---- */
              <div
                key="setup"
                ref={stepBodyRef}
                className={styles.body}
                data-slide={dir === 'back' ? 'back' : undefined}
              >
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="aop-name">
                    Name your AOP
                  </label>
                  <input
                    id="aop-name"
                    ref={nameRef}
                    className={styles.nameInput}
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="e.g. Error handler"
                    disabled={phase !== 'form'}
                    autoComplete="off"
                  />
                </div>

                <div className={styles.section}>
                  <span className={styles.label}>Go live on</span>
                </div>

                <div className={styles.tabs} role="tablist" aria-label="Go live on">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={surface === 'agents'}
                    className={styles.tab}
                    data-active={surface === 'agents' || undefined}
                    onClick={() => setSurface('agents')}
                  >
                    <span className={styles.tabIcon} aria-hidden>
                      <RiRobot2Line />
                    </span>
                    AI Agents
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={surface === 'copilot'}
                    className={styles.tab}
                    data-active={surface === 'copilot' || undefined}
                    onClick={() => setSurface('copilot')}
                  >
                    <span className={styles.tabIcon} aria-hidden>
                      <SparkleIcon />
                    </span>
                    AI Copilot
                  </button>
                  {/* Sliding active-tab underline: two equal tabs, offset = one width. */}
                  <span
                    className={styles.tabUnderline}
                    style={{
                      transform: surface === 'agents' ? 'translateX(0)' : 'translateX(100%)',
                    }}
                    aria-hidden
                  />
                </div>

                <span className={styles.sublabel}>
                  {surface === 'agents'
                    ? 'Select the shared mailboxes this AOP runs on'
                    : 'Select the shared mailboxes where this AOP assists your team'}
                </span>

                <div className={styles.search}>
                  <RiSearchLine className={styles.searchIco} aria-hidden />
                  <input
                    className={styles.searchInput}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                    aria-label="Search mailboxes"
                    autoComplete="off"
                  />
                </div>

                <ul className={styles.list}>
                  {filtered.map((m) => {
                    const on = selected.includes(m.id);
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          className={styles.row}
                          data-on={on || undefined}
                          onClick={() => toggle(m.id)}
                          aria-pressed={on}
                        >
                          <Checkbox checked={on} presentational size={16} />
                          <span className={styles.rowName}>{m.name}</span>
                          <span className={styles.rowAddr}>{m.address}</span>
                        </button>
                      </li>
                    );
                  })}
                  {filtered.length === 0 && (
                    <li className={styles.emptyRow}>No mailboxes match &ldquo;{query}&rdquo;.</li>
                  )}
                </ul>
              </div>
            )}

            <footer className={styles.foot}>
              {onReview ? (
                <>
                  <button
                    type="button"
                    className={styles.cancel}
                    onClick={goBack}
                    disabled={phase !== 'form'}
                  >
                    Back
                  </button>
                  <Button variant="accent" onClick={confirm} disabled={!settled || phase !== 'form'}>
                    {phase === 'enabling' ? (
                      <span className={styles.enabling}>
                        <Spinner size={16} />
                        Enabling…
                      </span>
                    ) : settled ? (
                      goLiveLabel
                    ) : (
                      'Reviewing…'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <button type="button" className={styles.cancel} onClick={requestClose}>
                    Cancel
                  </button>
                  {mode === 'commit' ? (
                    <Button variant="accent" onClick={goReview} disabled={!canContinue}>
                      Continue
                    </Button>
                  ) : (
                    <Button variant="accent" onClick={confirm} disabled={!canContinue}>
                      Save changes
                    </Button>
                  )}
                </>
              )}
            </footer>
          </>
        )}
        </>
      )}
    </ModalShell>
  );
}
