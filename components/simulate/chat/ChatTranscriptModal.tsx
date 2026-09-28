'use client';

import { useEffect, useRef } from 'react';
import { useIsClient } from '@/components/runs/useIsClient';
import { createPortal } from 'react-dom';
import { RiCloseLine } from 'react-icons/ri';
import ModalShell from '@/components/atoms/ModalShell';
import type { PastChat } from '@/data/chatFixtures';
import modal from '../ConversationModal.module.css';
import styles from './ChatTranscriptModal.module.css';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return ((parts[0]![0] ?? '') + (parts[parts.length - 1]![0] ?? '')).toUpperCase();
}

/**
 * ChatTranscriptModal - the real chat behind a past chat, as it happened: the
 * customer and the teammate who answered. The chat twin of ConversationModal,
 * on its chrome, so the two read as one family.
 */
export default function ChatTranscriptModal({ chat, inbox, onClose }: { chat: PastChat; inbox: string; onClose: () => void }) {
  // Portalled: the panel is a transformed, clipped container (see ConversationModal).
  const mounted = useIsClient();
  const innerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mounted) innerRef.current?.focus({ preventScroll: true });
  }, [mounted]);
  if (!mounted) return null;

  return createPortal(
    <ModalShell ariaLabel={`Chat with ${chat.customer}`} onClose={onClose} dialogClassName={modal.dialog}>
      {(requestClose) => (
        <div className={modal.inner} ref={innerRef} tabIndex={-1}>
          <header className={modal.header}>
            <div className={modal.who}>
              <span className={modal.avatar} aria-hidden>
                {initials(chat.customer)}
              </span>
              <div className={modal.whoText}>
                <span className={modal.name}>{chat.customer}</span>
                <span className={modal.addr}>
                  {inbox} &middot; {chat.started}
                </span>
              </div>
            </div>
            <button type="button" className={modal.close} aria-label="Close chat" onClick={requestClose}>
              <RiCloseLine aria-hidden />
            </button>
          </header>

          <ol className={styles.lines}>
            {chat.messages.map((m, i) => (
              <li key={i} className={styles.line} data-from={m.from}>
                <span className={styles.who}>{m.from === 'customer' ? chat.customer : 'Teammate'}</span>
                <p className={styles.text}>{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </ModalShell>,
    document.body,
  );
}
