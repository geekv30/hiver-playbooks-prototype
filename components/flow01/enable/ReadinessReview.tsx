'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { RiCheckLine, RiTimeLine } from 'react-icons/ri';
import { CONNECTOR_ICON } from '@/components/icons/connectors';
import { PlayIcon, TagIcon } from '@/components/icons/ui';
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
/** Entity chips shown per row before collapsing into "+N more". */
const MAX_CHIPS = 4;

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** The leading kind icon: brand mark for connectors, avatar initial for people,
 *  UI glyphs for evaluation/tags. Tone tints the tile, not the glyph shape. */
function KindIcon({ check }: { check: ReadinessCheck }): ReactNode {
  if (check.kind === 'connector') {
    const slug = check.id.replace('connector-', '') as ConnectorSlug;
    const Brand = CONNECTOR_ICON[slug];
    return Brand ? <Brand /> : null;
  }
  if (check.kind === 'evaluation') return <PlayIcon />;
  if (check.kind === 'tags') return <TagIcon />;
  return <span className={styles.avatarInitial}>{check.title.slice(0, 1)}</span>;
}

/**
 * The Review step's check list: every readiness item as one row - leading kind
 * icon, title + consequence copy, and the fix inline on the right (Connect /
 * Send invite / Evaluate) or an honest status when there's nothing to click
 * (Done for you / Invite sent / Connected). Rows reveal staggered on entry
 * (transitions.dev texts-reveal on our tokens); reduced motion shows all at once.
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
            <span className={styles.kindIcon} data-tone={check.tone} data-kind={check.kind}>
              <KindIcon check={check} />
            </span>
            <span className={styles.rowText}>
              <span className={styles.rowTitle}>{check.title}</span>
              <span className={styles.rowDetail}>{check.detail}</span>
              {check.chips && check.chips.length > 0 && (
                <span className={styles.chipRow}>
                  {check.chips.slice(0, MAX_CHIPS).map((c) => (
                    <span key={c.label} className={styles.chip}>
                      {c.label}
                      {c.sub && <span className={styles.chipSub}>{c.sub}</span>}
                    </span>
                  ))}
                  {check.chips.length > MAX_CHIPS && (
                    <span className={styles.chip} data-more>
                      +{check.chips.length - MAX_CHIPS} more
                    </span>
                  )}
                </span>
              )}
            </span>
            <span className={styles.rowEnd}>
              {action?.type === 'connect' &&
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
              {action?.type === 'invite' && (
                <Button
                  variant="secondary"
                  onClick={() => onInvite(action.person, action.mailboxes)}
                >
                  Send invite
                </Button>
              )}
              {action?.type === 'evaluate' && (
                <Button variant="secondary" onClick={onEvaluate}>
                  Evaluate
                </Button>
              )}
              {!action && check.status && (
                <span className={styles.status} data-tone={check.tone}>
                  {check.tone === 'pending' ? <RiTimeLine aria-hidden /> : <RiCheckLine aria-hidden />}
                  {check.status}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
