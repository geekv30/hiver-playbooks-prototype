'use client';
import type { Playbook, ConnectorSlug } from '@/types/playbook';
import { CONNECTOR_META } from '@/data/connectors';
import ConnectorTile from '@/components/atoms/ConnectorTile';
import styles from './rail.module.css';

interface Props {
  playbook: Playbook;
  onSetBindingActive: (mailboxId: string, active: boolean) => void;
  onOpenSetup: (slug: ConnectorSlug) => void;
}

export default function PlaybookTab({ playbook, onSetBindingActive, onOpenSetup }: Props) {
  return (
    <div>
      <div className={styles.section}>
        <div className={styles.label}>Status</div>
        <div className={styles.row}>
          <span className={styles.key}>State</span>
          <span className={`${styles.pill} ${playbook.bindings.some((b) => b.active) ? '' : styles.off}`}>
            {playbook.bindings.some((b) => b.active) ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>Steps</span>
          <span className={`${styles.val} ${styles.mono}`}>{playbook.steps.length}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>Last edited</span>
          <span className={`${styles.val} ${styles.muted}`}>{relativeTime(playbook.updatedAt)}</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>Shared mailboxes</div>
        {playbook.bindings.map((b) => (
          <div key={b.mailboxId} className={styles.row}>
            <span className={styles.key}>{b.mailboxName}</span>
            <button
              type="button"
              className={`${styles.toggle} ${b.active ? styles.on : ''}`}
              onClick={() => onSetBindingActive(b.mailboxId, !b.active)}
              aria-label={`Toggle ${b.mailboxName}`}
            />
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.label}>Connectors</div>
        {playbook.connectors.map((c) => (
          <div key={c.slug} className={styles.connRow}>
            <ConnectorTile slug={c.slug} />
            <div className={styles.connInfo}>
              <span className={styles.connName}>{CONNECTOR_META[c.slug].name}</span>
              <span className={styles.connSub}>
                {c.authed ? (c.accountLabel ?? 'Connected') : 'Not connected'}
              </span>
            </div>
            <span
              className={`${styles.pill} ${c.authed ? '' : styles.draft}`}
              onClick={() => onOpenSetup(c.slug)}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              {c.authed ? 'Ready' : 'Connect'}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.label}>Recent runs</div>
        <div className={styles.placeholder}>
          No runs yet
          <span className={styles.phHint}>activate the AOP to start tracking</span>
        </div>
      </div>
    </div>
  );
}

function relativeTime(t: number): string {
  if (!t) return 'never';
  const diff = Date.now() - t;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
