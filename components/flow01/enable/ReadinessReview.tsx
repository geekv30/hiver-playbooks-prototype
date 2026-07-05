'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { RiCheckboxCircleFill, RiErrorWarningFill, RiTimeFill } from 'react-icons/ri';
import Button from '@/components/atoms/Button';
import Spinner from '@/components/atoms/Spinner';
import type { ConnectorSlug } from '@/types/playbook';
import type { ReadinessCheck } from './readiness';
import styles from './ReadinessReview.module.css';

interface Props {
  checks: ReadinessCheck[];
  /** Rows appear staggered on mount; fires once every row is visible. */
  onSettled: () => void;
  onConnect: (slug: ConnectorSlug) => void;
  onInvite: (person: string, mailboxes: string[]) => void;
  onEvaluate: () => void;
}

const STAGGER_MS = 240;
const SETTLE_PAD_MS = 420;
const CONNECT_MS = 1100;

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** One status glyph per tone, same position and size on every row - the ONLY
 *  place state color appears. ok and auto are both green (nothing for the user
 *  to do); pending is the blue clock (resolves outside this flow). */
function ToneGlyph({ tone }: { tone: ReadinessCheck['tone'] }) {
  if (tone === 'warn') return <RiErrorWarningFill aria-hidden />;
  if (tone === 'pending') return <RiTimeFill aria-hidden />;
  return <RiCheckboxCircleFill aria-hidden />;
}

/**
 * The Review step's check list, one calm grammar per row: a status glyph, ONE
 * sentence (bold lead + consequence), and at most one action button. State
 * lives only in the glyph; lists live inside the sentence as counts or short
 * names - no tiles, no chips, no trailing status labels. Rows reveal staggered
 * on entry (reduced motion shows all at once).
 */
export default function ReadinessReview({
  checks,
  onSettled,
  onConnect,
  onInvite,
  onEvaluate,
}: Props) {
  // Staggered reveal runs once per mount (per entry into the Review step).
  const [revealed, setRevealed] = useState(() => (prefersReduced() ? checks.length : 0));
  const [connecting, setConnecting] = useState<ReadonlySet<ConnectorSlug>>(new Set());
  const timers = useRef<number[]>([]);
  const settledRef = useRef(false);
  const count = checks.length;

  useEffect(() => {
    if (settledRef.current) return;
    if (revealed >= count) {
      settledRef.current = true;
      onSettled();
      return;
    }
    const t = window.setTimeout(
      () => setRevealed((r) => r + 1),
      revealed === 0 ? SETTLE_PAD_MS : STAGGER_MS,
    );
    timers.current.push(t);
    return () => window.clearTimeout(t);
  }, [revealed, count, onSettled]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const connect = (slug: ConnectorSlug) => {
    if (connecting.has(slug)) return;
    setConnecting((prev) => new Set(prev).add(slug));
    timers.current.push(
      window.setTimeout(() => {
        setConnecting((prev) => {
          const next = new Set(prev);
          next.delete(slug);
          return next;
        });
        onConnect(slug);
      }, CONNECT_MS),
    );
  };

  return (
    <ul className={styles.list} aria-label="Readiness checks">
      {checks.map((check, i) => {
        const shown = i < revealed;
        const { action } = check;
        return (
          <li
            key={check.id}
            className={styles.row}
            data-shown={shown || undefined}
            style={{ '--i': i } as CSSProperties}
            aria-hidden={!shown}
          >
            <span className={styles.glyph} data-tone={check.tone}>
              <ToneGlyph tone={check.tone} />
            </span>
            <span className={styles.sentence}>
              <strong>{check.title}</strong> {check.detail}
            </span>
            {action && (
              <span className={styles.rowEnd}>
                {action.type === 'connect' &&
                  (connecting.has(action.slug) ? (
                    <span className={styles.busy}>
                      <Spinner size={14} />
                      Connecting…
                    </span>
                  ) : (
                    <Button variant="secondary" onClick={() => connect(action.slug)}>
                      {action.label}
                    </Button>
                  ))}
                {action.type === 'invite' && (
                  <Button
                    variant="secondary"
                    onClick={() => onInvite(action.person, action.mailboxes)}
                  >
                    Send invite
                  </Button>
                )}
                {action.type === 'evaluate' && (
                  <Button variant="secondary" onClick={onEvaluate}>
                    Evaluate
                  </Button>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
