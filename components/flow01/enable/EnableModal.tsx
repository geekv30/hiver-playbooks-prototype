'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { RiCloseLine, RiSearchLine, RiInformationLine } from 'react-icons/ri';
import { SparkleIcon } from '@/components/icons/ui';
import Checkbox from '@/components/atoms/Checkbox';
import Button from '@/components/atoms/Button';
import ModalShell from '@/components/atoms/ModalShell';
import Spinner from '@/components/atoms/Spinner';
import { MAILBOXES, mailboxName, mailboxList, mailboxSummary } from '@/data/mailboxes';
import type { EvalAggregate } from '@/components/simulate/useEvalState';
import styles from './EnableModal.module.css';

type Phase = 'form' | 'enabling' | 'success';

interface Props {
  open: boolean;
  /** commit = the go-live flow (Enable button) -> success moment; manage = edit a
   *  live AOP's name + mailboxes (the settings gear) -> Save changes. One renderer. */
  mode: 'commit' | 'manage';
  name: string;
  onNameChange: (s: string) => void;
  /** Selected mailbox ids. */
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  /** Tag-owning mailboxes, pre-selected for this AOP (the banner explains why; a
   *  warning shows if any is removed). */
  preEnabled: string[];
  onClose: () => void;
  /** commit: go live (fired after the success moment). manage: save changes. */
  onConfirm: () => void;
  /** Evaluation aggregate - renders the quiet status row when runs exist. */
  evalStatus?: EvalAggregate | null;
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

export default function EnableModal({
  open,
  mode,
  name,
  onNameChange,
  selected,
  onSelectedChange,
  preEnabled,
  onClose,
  onConfirm,
  evalStatus,
}: Props) {
  const [phase, setPhase] = useState<Phase>('form');
  const [query, setQuery] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  // Reset transient state each time the modal opens and move focus into the
  // dialog. (Scrim/Esc/close mechanics + focus restore live on ModalShell.)
  useEffect(() => {
    if (!open) return;
    setPhase('form');
    setQuery('');
    setBannerDismissed(false);
    requestAnimationFrame(() => nameRef.current?.focus());
  }, [open]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MAILBOXES;
    return MAILBOXES.filter(
      (m) => m.name.toLowerCase().includes(q) || m.address.toLowerCase().includes(q),
    );
  }, [query]);

  const toggle = (id: string) =>
    onSelectedChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const removedPre = preEnabled.filter((id) => !selected.includes(id));
  const warn = removedPre.length > 0;
  const canConfirm = name.trim().length > 0 && selected.length > 0;
  const liveName = name.trim() || 'Untitled AOP';

  const confirm = () => {
    if (!canConfirm || phase !== 'form') return;
    if (mode === 'manage') {
      onConfirm();
      return;
    }
    if (prefersReduced()) {
      onConfirm();
      return;
    }
    setPhase('enabling');
    timers.current.push(window.setTimeout(() => setPhase('success'), ENABLING_MS));
    timers.current.push(window.setTimeout(() => onConfirm(), ENABLING_MS + SUCCESS_HOLD_MS));
  };

  if (!open) return null;

  // The warn variant (a tag-owning mailbox was removed) can't be dismissed - it's
  // a "this may break your steps" safety notice, not an FYI.
  const showBanner = preEnabled.length > 0 && phase === 'form' && (warn || !bannerDismissed);
  const primaryLabel =
    mode === 'commit'
      ? `Enable on ${selected.length} ${selected.length === 1 ? 'mailbox' : 'mailboxes'}`
      : 'Save changes';

  return (
    <ModalShell
      ariaLabel={mode === 'commit' ? 'Enable AOP' : 'AOP settings'}
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
              <h2 className={styles.headTitle}>
                {mode === 'commit' ? 'Enable AOP' : 'AOP settings'}
              </h2>
            </header>

            <div className={styles.body}>
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

              {evalStatus && evalStatus.total > 0 && (
                <div
                  className={styles.evalRow}
                  data-ok={evalStatus.passed === evalStatus.total || undefined}
                >
                  <span className={styles.evalDot} aria-hidden />
                  <span>
                    {evalStatus.passed} of {evalStatus.total} evaluation
                    {evalStatus.total === 1 ? '' : 's'} passed
                    {evalStatus.stale ? ' - evaluated an earlier version' : ''}
                  </span>
                </div>
              )}

              <div className={styles.section}>
                <span className={styles.label}>Go live on</span>
                <span className={styles.sublabel}>
                  Select the shared mailboxes this AOP runs on
                </span>
              </div>

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

              {showBanner && (
                <div className={styles.banner} data-warn={warn || undefined}>
                  <RiInformationLine className={styles.bannerIco} aria-hidden />
                  <span className={styles.bannerText}>
                    {warn
                      ? `${mailboxList(removedPre)} own${removedPre.length === 1 ? 's' : ''} tags this AOP uses. Removing ${removedPre.length === 1 ? 'it' : 'them'} may break those steps.`
                      : `${mailboxList(preEnabled)} ${preEnabled.length === 1 ? 'is' : 'are'} pre-selected because this AOP uses tags that live in ${preEnabled.length === 1 ? 'it' : 'them'}.`}
                  </span>
                  {!warn && (
                    <button
                      type="button"
                      className={styles.bannerClose}
                      onClick={() => setBannerDismissed(true)}
                      aria-label="Dismiss"
                    >
                      <RiCloseLine />
                    </button>
                  )}
                </div>
              )}

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

            <footer className={styles.foot}>
              <button type="button" className={styles.cancel} onClick={requestClose}>
                Cancel
              </button>
              <Button variant="accent" onClick={confirm} disabled={!canConfirm || phase !== 'form'}>
                {phase === 'enabling' ? (
                  <span className={styles.enabling}>
                    <Spinner size={16} />
                    Enabling…
                  </span>
                ) : (
                  primaryLabel
                )}
              </Button>
            </footer>
          </>
        )}
        </>
      )}
    </ModalShell>
  );
}
