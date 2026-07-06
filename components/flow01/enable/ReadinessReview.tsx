'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { RiCheckboxCircleFill, RiErrorWarningFill, RiTimeFill } from 'react-icons/ri';
import Button from '@/components/atoms/Button';
import Spinner from '@/components/atoms/Spinner';
import type { ConnectorSlug } from '@/types/playbook';
import type { ReadinessCheck } from './readiness';
import styles from './ReadinessReview.module.css';

interface Props {
  checks: ReadinessCheck[];
  /** Groups reveal staggered on mount; fires once every group is visible. */
  onSettled: () => void;
  onConnect: (slug: ConnectorSlug) => void;
  onInvite: (person: string, mailboxes: string[]) => void;
  onEvaluate: () => void;
}

const STAGGER_MS = 260;
const SETTLE_PAD_MS = 420;
const CONNECT_MS = 1100;

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function ToneGlyph({ tone }: { tone: ReadinessCheck['tone'] }) {
  if (tone === 'warn') return <RiErrorWarningFill aria-hidden />;
  if (tone === 'pending') return <RiTimeFill aria-hidden />;
  return <RiCheckboxCircleFill aria-hidden />;
}

/** A bold-lead sentence fragment for the collapsed Ready summary. */
interface Fragment {
  lead: string;
  rest: string;
}

interface Groups {
  attention: ReadinessCheck[];
  pending: ReadinessCheck[];
  /** ok + auto checks, collapsed into summary fragments joined by " · ". */
  readySummary: Fragment[];
  readyCount: number;
}

/** Triage: warns need the user, pendings resolve elsewhere, and everything
 *  that's fine collapses into ONE green sentence - nobody reads a list of
 *  things that don't need reading. */
function groupChecks(checks: ReadinessCheck[]): Groups {
  const attention = checks.filter((c) => c.tone === 'warn');
  const pending = checks.filter((c) => c.tone === 'pending');
  const ready = checks.filter((c) => c.tone === 'ok' || c.tone === 'auto');

  const readySummary: Fragment[] = [];
  const connectorNames = ready.filter((c) => c.kind === 'connector').map((c) => c.title);
  if (connectorNames.length === 1) {
    readySummary.push({ lead: connectorNames[0]!, rest: 'is connected' });
  } else if (connectorNames.length === 2) {
    readySummary.push({
      lead: `${connectorNames[0]} and ${connectorNames[1]}`,
      rest: 'are connected',
    });
  } else if (connectorNames.length > 2) {
    readySummary.push({ lead: `${connectorNames.length} connectors`, rest: 'are connected' });
  }
  for (const c of ready) {
    if (c.kind === 'evaluation') readySummary.push({ lead: 'Evaluation', rest: 'passed' });
    if (c.kind === 'tags') {
      readySummary.push(
        c.tone === 'auto'
          ? { lead: c.title, rest: 'will be created for you at go-live' }
          : { lead: 'Tags', rest: 'are ready in every selected mailbox' },
      );
    }
    if (c.kind === 'assignment')
      readySummary.push({ lead: c.title, rest: 'can take assignments everywhere' });
  }
  return { attention, pending, readySummary, readyCount: ready.length };
}

function CheckRow({
  check,
  connecting,
  onConnectClick,
  onInvite,
  onEvaluate,
}: {
  check: ReadinessCheck;
  connecting: ReadonlySet<ConnectorSlug>;
  onConnectClick: (slug: ConnectorSlug) => void;
  onInvite: Props['onInvite'];
  onEvaluate: Props['onEvaluate'];
}) {
  const { action } = check;
  return (
    <li className={styles.row}>
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
              <Button variant="secondary" onClick={() => onConnectClick(action.slug)}>
                {action.label}
              </Button>
            ))}
          {action.type === 'invite' && (
            <Button variant="secondary" onClick={() => onInvite(action.person, action.mailboxes)}>
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
}

/**
 * The Review step's triage view (v4.3): checks grouped by what they mean to
 * the user - "Needs attention" (fix here), "Pending" (resolves elsewhere),
 * and "Ready", where everything that's fine collapses into one green sentence
 * inside a quiet inset box. Groups reveal staggered on entry; each row keeps
 * the calm grammar: one glyph, one sentence, at most one button.
 */
export default function ReadinessReview({
  checks,
  onSettled,
  onConnect,
  onInvite,
  onEvaluate,
}: Props) {
  const groups = useMemo(() => groupChecks(checks), [checks]);
  const sections: {
    key: string;
    label: string;
    tone: 'warn' | 'pending' | 'ok';
    count: number;
    body: ReadinessCheck[] | Fragment[];
  }[] = [];
  if (groups.attention.length > 0)
    sections.push({
      key: 'attention',
      label: 'Needs attention',
      tone: 'warn',
      count: groups.attention.length,
      body: groups.attention,
    });
  if (groups.pending.length > 0)
    sections.push({
      key: 'pending',
      label: 'Pending',
      tone: 'pending',
      count: groups.pending.length,
      body: groups.pending,
    });
  if (groups.readyCount > 0)
    sections.push({
      key: 'ready',
      label: 'Ready',
      tone: 'ok',
      count: groups.readyCount,
      body: groups.readySummary,
    });

  // Staggered group reveal, once per mount (per entry into the Review step).
  const [revealed, setRevealed] = useState(() => (prefersReduced() ? sections.length : 0));
  const [connecting, setConnecting] = useState<ReadonlySet<ConnectorSlug>>(new Set());
  const timers = useRef<number[]>([]);
  const settledRef = useRef(false);
  const count = sections.length;

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
    <div className={styles.groups} aria-label="Readiness checks">
      {sections.map((section, i) => (
        <section
          key={section.key}
          className={styles.group}
          data-shown={i < revealed || undefined}
          style={{ '--i': i } as CSSProperties}
          aria-hidden={i >= revealed}
        >
          <h4 className={styles.groupHead}>
            {section.label}
            <span className={styles.groupCount} data-tone={section.tone}>
              {section.count}
            </span>
          </h4>
          <div className={styles.inset}>
            {section.key === 'ready' ? (
              <ul className={styles.rows}>
                <li className={styles.row}>
                  <span className={styles.glyph} data-tone="ok">
                    <RiCheckboxCircleFill aria-hidden />
                  </span>
                  <span className={styles.sentence}>
                    {(section.body as Fragment[]).map((f, j) => (
                      <span key={f.lead}>
                        {j > 0 && <span className={styles.sep}> · </span>}
                        <strong>{f.lead}</strong> {f.rest}
                      </span>
                    ))}
                  </span>
                </li>
              </ul>
            ) : (
              <ul className={styles.rows}>
                {(section.body as ReadinessCheck[]).map((check) => (
                  <CheckRow
                    key={check.id}
                    check={check}
                    connecting={connecting}
                    onConnectClick={connect}
                    onInvite={onInvite}
                    onEvaluate={onEvaluate}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
