'use client';

import { useState } from 'react';
import { RiCheckLine, RiErrorWarningFill, RiAlertFill, RiPlugLine } from 'react-icons/ri';
import { CONNECTOR_ICON } from '@/components/icons/connectors';
import { CONNECTOR_META } from '@/data/connectors';
import Button from '@/components/atoms/Button';
import ModalShell from '@/components/atoms/ModalShell';
import Spinner from '@/components/atoms/Spinner';
import type { ConnectorSlug } from '@/types/playbook';
import {
  useConnectorHealth,
  setConnectorHealth,
  type ConnectorHealth,
} from '../connectorHealth';
import styles from './ConnectorHubModal.module.css';

const ALL_SLUGS: ConnectorSlug[] = ['shopify', 'hubspot', 'clickup', 'slack', 'salesforce'];
const CONNECT_MS = 1100;

interface Props {
  onClose: () => void;
  /** Scope the hub to these connectors (the editor passes the AOP's own
   *  connectors so the surface stays accurate to the doc); omit for all. */
  only?: ConnectorSlug[];
}

/** Per-state presentation: the status line under the connector name and the
 *  action that resolves it. 'connected' has no action - just the green status. */
const STATE_COPY: Record<
  Exclude<ConnectorHealth, 'connected'>,
  { line: string; action: string }
> = {
  reauth: {
    line: "Session expired - AOPs can't use this connector until you reconnect",
    action: 'Re-authenticate',
  },
  error: {
    line: "Connection is broken - we can't reach this account",
    action: 'Fix connection',
  },
  disconnected: {
    line: 'Not connected',
    action: 'Connect',
  },
};

/**
 * The Connectors hub - the ONE place connector accounts are managed, opened
 * from the same spot on every surface (the AOP list header and the editor
 * toolbar). Fixing a connector here fixes it everywhere: the Enable flow's
 * readiness review reads the same store, so a healthy connector never becomes
 * an enablement step. All actions are mocked (spinner -> connected).
 */
export default function ConnectorHubModal({ onClose, only }: Props) {
  const health = useConnectorHealth();
  const [busy, setBusy] = useState<ReadonlySet<ConnectorSlug>>(new Set());

  const slugs = only && only.length > 0 ? ALL_SLUGS.filter((s) => only.includes(s)) : ALL_SLUGS;
  const issues = slugs.filter((s) => health[s] === 'reauth' || health[s] === 'error').length;

  const resolve = (slug: ConnectorSlug) => {
    if (busy.has(slug)) return;
    setBusy((prev) => new Set(prev).add(slug));
    window.setTimeout(() => {
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
      setConnectorHealth(slug, 'connected');
    }, CONNECT_MS);
  };

  return (
    <ModalShell ariaLabel="Connectors" onClose={onClose} dialogClassName={styles.dialog}>
      {(requestClose) => (
        <>
          <header className={styles.head}>
            <span className={styles.headIcon} aria-hidden>
              <RiPlugLine />
            </span>
            <div className={styles.headText}>
              <h2 className={styles.headTitle}>Connectors</h2>
              <p className={styles.headSub}>
                {issues > 0
                  ? `${issues} ${issues === 1 ? 'connector needs' : 'connectors need'} attention - ${only ? 'this AOP' : 'AOPs that use ' + (issues === 1 ? 'it' : 'them')} can't run those steps.`
                  : only
                    ? "Every connector this AOP uses is healthy - it's clear to run."
                    : 'All connectors are healthy. AOPs can use every connected account.'}
              </p>
            </div>
          </header>

          <ul className={styles.list}>
            {slugs.map((slug) => {
              const Brand = CONNECTOR_ICON[slug];
              const meta = CONNECTOR_META[slug];
              const state = health[slug];
              const isBusy = busy.has(slug);
              return (
                <li key={slug} className={styles.row} data-state={state}>
                  <span className={styles.brandIco} aria-hidden>
                    <Brand />
                  </span>
                  <span className={styles.rowText}>
                    <span className={styles.rowName}>
                      {meta.name}
                      {state === 'reauth' && (
                        <span className={styles.stateTag} data-tone="warn">
                          <RiErrorWarningFill aria-hidden />
                          Needs re-authentication
                        </span>
                      )}
                      {state === 'error' && (
                        <span className={styles.stateTag} data-tone="error">
                          <RiAlertFill aria-hidden />
                          Connection broken
                        </span>
                      )}
                    </span>
                    <span className={styles.rowSub}>
                      {state === 'connected' ? meta.fakeAuthedLabel : STATE_COPY[state].line}
                    </span>
                  </span>
                  <span className={styles.rowEnd}>
                    {state === 'connected' ? (
                      <span className={styles.connected}>
                        <RiCheckLine aria-hidden />
                        Connected
                      </span>
                    ) : isBusy ? (
                      <span className={styles.busy}>
                        <Spinner size={14} />
                        Connecting…
                      </span>
                    ) : (
                      <Button variant="secondary" onClick={() => resolve(slug)}>
                        {STATE_COPY[state].action}
                      </Button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          <footer className={styles.foot}>
            <span className={styles.footNote}>
              Connecting here means AOPs never stop for a connector at enable time.
            </span>
            <Button variant="secondary" onClick={requestClose}>
              Done
            </Button>
          </footer>
        </>
      )}
    </ModalShell>
  );
}
