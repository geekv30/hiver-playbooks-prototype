'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { RiCloseLine, RiInformationLine, RiHashtag } from 'react-icons/ri';
import { LuRefreshCcw } from 'react-icons/lu';
import { CONNECTOR_ICON } from '@/components/icons/connectors';
import { CONNECTOR_META } from '@/data/connectors';
import { connectorTools } from '../paletteCatalog';
import Button from '@/components/atoms/Button';
import ModalShell from '@/components/atoms/ModalShell';
import type { ConnectorSlug } from '@/types/playbook';
import styles from './ConnectorSetupModal.module.css';

type Phase = 'intro' | 'auth' | 'success';

interface Props {
  connector: ConnectorSlug;
  /** Connected (Done): the parent marks the connector authed and moves the tag to
   *  "select action". */
  onConnected: () => void;
  /** Dismissed before connecting (Cancel / X / Esc / scrim) - the tag stays "setup needed". */
  onClose: () => void;
}

/**
 * The connector connection flow, one modal, three phases:
 *   intro   - what the connector is + the tools the AI agent can use (Figma 844:20826)
 *   auth    - paste a token, with a redirect note (Figma 848:20685 / 848:21300)
 *   success - "You're Connected" + the guarantees (Figma 848:30953)
 * Built on the shared modal shell (scrim + dialog + graceful close + Esc/scrim).
 */
export default function ConnectorSetupModal({ connector, onConnected, onClose }: Props) {
  const meta = CONNECTOR_META[connector];
  const Brand = CONNECTOR_ICON[connector];
  const tools = connectorTools(connector);

  const [phase, setPhase] = useState<Phase>('intro');
  const [token, setToken] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  // Card-resize: keep the width fixed and animate the height to the new phase's
  // content (so the modal grows/shrinks smoothly instead of jumping). The dialog
  // node is the content's parent (ModalShell owns it; scrim/Esc/close live there).
  useLayoutEffect(() => {
    const c = contentRef.current;
    const d = c?.parentElement;
    if (d && c) d.style.height = `${c.offsetHeight}px`;
  }, [phase]);

  // Success "tools enabled" summary: a few verb labels + a remainder count.
  const toolSummary =
    tools
      .slice(0, 3)
      .map((t) => t.label)
      .join(', ') + (tools.length > 3 ? ` +${tools.length - 3}` : '');

  return (
    <ModalShell
      ariaLabel={`Connect ${meta.name}`}
      onClose={onClose}
      phase={phase}
      dialogClassName={styles.dialog}
    >
      {(requestClose) => (
      <div ref={contentRef} className={styles.content}>
        {phase === 'intro' && (
          <>
            <header className={styles.introHead}>
              <span className={styles.brandIco}>
                <Brand />
              </span>
              <div className={styles.introHeadText}>
                <h2 className={styles.brandName}>{meta.name}</h2>
                <p className={styles.tagline}>{meta.tagline}</p>
              </div>
            </header>
            <div className={styles.introBody}>
              <p className={styles.blurb}>{meta.blurb}</p>
              <div className={styles.toolsHead}>
                <span className={styles.toolsLabel}>What the AI agent can show</span>
                <span className={styles.toolsCount}>{tools.length} tools</span>
              </div>
              <div className={styles.toolGrid}>
                {tools.map((t) => (
                  <div key={t.label} className={styles.toolCard}>
                    <span className={styles.toolTitle}>{t.label}</span>
                    <span className={styles.toolDesc}>{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <footer className={styles.footer}>
              <button type="button" className={styles.cancel} onClick={requestClose}>
                Cancel
              </button>
              <Button variant="accent" onClick={() => setPhase('auth')}>
                Connect
              </Button>
            </footer>
          </>
        )}

        {phase === 'auth' && (
          <>
            <header className={styles.authHead}>
              <h2 className={styles.authTitle}>Connect {meta.name}</h2>
              <button
                type="button"
                className={styles.close}
                aria-label="Close"
                onClick={requestClose}
              >
                <RiCloseLine />
              </button>
            </header>
            <div className={styles.authBody}>
              <div className={styles.logoPair} aria-hidden>
                <span className={styles.hiverIco}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/hiver-mark.png" alt="Hiver" />
                </span>
                <span className={styles.swapIco}>
                  <LuRefreshCcw />
                </span>
                <span className={styles.connectorIco}>
                  <Brand />
                </span>
              </div>
              <h3 className={styles.authConnect}>Connect your {meta.name} account</h3>
              <label className={styles.fieldLabel} htmlFor="connector-token">
                {meta.name} token
              </label>
              <div className={styles.tokenField}>
                <span className={styles.tokenHash} aria-hidden>
                  <RiHashtag />
                </span>
                <input
                  id="connector-token"
                  className={styles.tokenInput}
                  value={token}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder={meta.tokenPlaceholder}
                  onChange={(e) => setToken(e.target.value)}
                  autoFocus
                />
              </div>
              <a
                className={styles.tokenLink}
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                Where to find your {meta.name} token?
              </a>
              <div className={styles.infoBanner}>
                <RiInformationLine className={styles.infoIco} aria-hidden />
                <span>
                  You&apos;ll be redirected to {meta.name} in a new window to approve the
                  connection.
                </span>
              </div>
            </div>
            <footer className={styles.footer}>
              <button type="button" className={styles.cancel} onClick={requestClose}>
                Cancel
              </button>
              <Button variant="accent" disabled={!token.trim()} onClick={() => setPhase('success')}>
                Connect
              </Button>
            </footer>
          </>
        )}

        {phase === 'success' && (
          <>
            <div className={styles.success}>
              {/* The connection success moment: the same drawing check + staggered
                  reveal as the AOP go-live (EnableModal). */}
              <svg className={styles.checkSvg} viewBox="0 0 52 52" aria-hidden>
                <circle className={styles.checkCircle} cx="26" cy="26" r="24" />
                <path className={styles.checkMark} d="M15 27 l7.5 7.5 L37 19" />
              </svg>
              <h2 className={styles.successTitle}>You&apos;re connected!</h2>
              <p className={styles.successSub}>
                Hiver is now authorized to read from {meta.fakeAuthedLabel}.
              </p>
              <div className={styles.checksRow}>
                <div className={styles.checkCol} style={{ '--i': 0 } as CSSProperties}>
                  <span className={styles.checkColTitle}>{tools.length} tools enabled</span>
                  <span className={styles.checkColSub}>{toolSummary}</span>
                </div>
                <div className={styles.checkCol} style={{ '--i': 1 } as CSSProperties}>
                  <span className={styles.checkColTitle}>Read-only</span>
                  <span className={styles.checkColSub}>Hiver can&apos;t edit your data</span>
                </div>
                <div className={styles.checkCol} style={{ '--i': 2 } as CSSProperties}>
                  <span className={styles.checkColTitle}>Secured</span>
                  <span className={styles.checkColSub}>Token encrypted</span>
                </div>
              </div>
            </div>
            <footer className={styles.footer}>
              <button type="button" className={styles.cancel} onClick={requestClose}>
                Cancel
              </button>
              <Button variant="accent" onClick={onConnected}>
                Done
              </Button>
            </footer>
          </>
        )}
      </div>
      )}
    </ModalShell>
  );
}
