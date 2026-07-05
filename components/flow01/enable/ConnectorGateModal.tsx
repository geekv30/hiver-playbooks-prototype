'use client';

import { useState } from 'react';
import { RiCloseLine, RiCheckLine, RiFunctionLine, RiInformationLine } from 'react-icons/ri';
import { CONNECTOR_ICON } from '@/components/icons/connectors';
import { CONNECTOR_META } from '@/data/connectors';
import Button from '@/components/atoms/Button';
import ModalShell from '@/components/atoms/ModalShell';
import Spinner from '@/components/atoms/Spinner';
import type { ConnectorSlug } from '@/types/playbook';
import styles from './ConnectorGateModal.module.css';

interface Props {
  /** The connectors this AOP's actions use, in canonical order. */
  connectors: ConnectorSlug[];
  /** All connectors re-authenticated -> proceed to the enable flow. */
  onContinue: () => void;
  /** Dismissed (Cancel / X / Esc / scrim) - enablement does not proceed. */
  onClose: () => void;
}

const CONNECT_MS = 1100;

/**
 * The pre-enable connector check: when the AOP uses connector actions, going
 * live first asks for a re-authentication of each connector (mocked - Connect
 * flips to Connected after a beat; no real OAuth). Continue unlocks once every
 * connector is connected. Built on the shared modal shell.
 */
export default function ConnectorGateModal({ connectors, onContinue, onClose }: Props) {
  const [connected, setConnected] = useState<ReadonlySet<ConnectorSlug>>(new Set());
  const [connecting, setConnecting] = useState<ReadonlySet<ConnectorSlug>>(new Set());
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const connect = (slug: ConnectorSlug) => {
    if (connecting.has(slug) || connected.has(slug)) return;
    setConnecting((prev) => new Set(prev).add(slug));
    window.setTimeout(() => {
      setConnecting((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
      setConnected((prev) => new Set(prev).add(slug));
    }, CONNECT_MS);
  };

  const allConnected = connectors.every((slug) => connected.has(slug));

  return (
    <ModalShell ariaLabel="Connectors" onClose={onClose} dialogClassName={styles.dialog}>
      {(requestClose) => (
        <>
          <header className={styles.head}>
            <span className={styles.headIcon} aria-hidden>
              <RiFunctionLine />
            </span>
            <h2 className={styles.headTitle}>Connectors</h2>
          </header>

          <div className={styles.body}>
            {!bannerDismissed && (
              <div className={styles.banner}>
                <RiInformationLine className={styles.bannerIco} aria-hidden />
                <span className={styles.bannerText}>
                  Re-authenticate your connectors before going live
                </span>
                <button
                  type="button"
                  className={styles.bannerClose}
                  onClick={() => setBannerDismissed(true)}
                  aria-label="Dismiss"
                >
                  <RiCloseLine />
                </button>
              </div>
            )}

            <ul className={styles.list}>
              {connectors.map((slug) => {
                const Brand = CONNECTOR_ICON[slug];
                const isOn = connected.has(slug);
                const isBusy = connecting.has(slug);
                return (
                  <li key={slug} className={styles.row}>
                    <span className={styles.brandIco} aria-hidden>
                      <Brand />
                    </span>
                    <span className={styles.rowName}>{CONNECTOR_META[slug].name}</span>
                    {isOn ? (
                      <span className={styles.connectedTag}>
                        <RiCheckLine aria-hidden />
                        Connected
                      </span>
                    ) : (
                      <Button variant="secondary" disabled={isBusy} onClick={() => connect(slug)}>
                        {isBusy ? (
                          <span className={styles.connecting}>
                            <Spinner size={14} />
                            Connecting…
                          </span>
                        ) : (
                          'Connect'
                        )}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <footer className={styles.foot}>
            <button type="button" className={styles.cancel} onClick={requestClose}>
              Cancel
            </button>
            <Button variant="accent" disabled={!allConnected} onClick={onContinue}>
              Continue
            </Button>
          </footer>
        </>
      )}
    </ModalShell>
  );
}
