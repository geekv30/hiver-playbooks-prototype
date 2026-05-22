'use client';
import { useState } from 'react';
import type { ConnectorSlug } from '@/types/playbook';
import { CONNECTOR_META } from '@/data/connectors';
import ConnectorTile from '@/components/atoms/ConnectorTile';
import styles from './rail.module.css';

interface Props {
  slug: ConnectorSlug;
  authed: boolean;
  authedLabel?: string;
  onConnect: (label: string) => void;
  onClose: () => void;
}

export default function SetupMode({ slug, authed, authedLabel, onConnect, onClose }: Props) {
  const [pending, setPending] = useState(false);
  const meta = CONNECTOR_META[slug];

  const handleConnect = () => {
    setPending(true);
    window.setTimeout(() => {
      onConnect(meta.fakeAuthedLabel);
      setPending(false);
    }, 1500);
  };

  return (
    <div>
      <div className={styles.setupHead}>
        <ConnectorTile slug={slug} size="lg" />
        <h3 className={styles.setupTitle}>Connect {meta.name}</h3>
        <p className={styles.setupSub}>
          Authenticate your {meta.name} account to use this action. We will mock the OAuth flow for the prototype.
        </p>
      </div>
      {authed ? (
        <div className={styles.setupConnected}>
          Connected as <code>{authedLabel ?? meta.fakeAuthedLabel}</code>
        </div>
      ) : (
        <button
          className={styles.setupBtn}
          onClick={handleConnect}
          disabled={pending}
          type="button"
        >
          {pending ? 'Connecting...' : `Connect ${meta.name}`}
        </button>
      )}
      <button className={styles.setupBack} onClick={onClose} type="button">← Back to rail</button>
    </div>
  );
}
