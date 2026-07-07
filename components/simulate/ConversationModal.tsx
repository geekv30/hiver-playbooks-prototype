'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RiCloseLine } from 'react-icons/ri';
import ModalShell from '@/components/atoms/ModalShell';
import type { SimEmail } from '@/data/simFixtures';
import styles from './ConversationModal.module.css';

interface Props {
  email: SimEmail;
  onClose: () => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return ((parts[0]![0] ?? '') + (parts[parts.length - 1]![0] ?? '')).toUpperCase();
}

// Derive a plausible from-address (mock inbox - no real customer data).
function emailAddress(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).join('.');
  return `${slug}@example.com`;
}

// A stable, plausible "received" line derived from the id (mock data). Uses the
// American date format the app standardises on (Jul 3, 2026, 9:12 AM).
function receivedLabel(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const day = 1 + (h % 5); // Jul 1-5
  const hour24 = 8 + (h % 9); // 08:00 - 16:00
  const minute = (h % 12) * 5; // :00 - :55
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
  return `Jul ${day}, 2026, ${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

/**
 * ConversationModal - reads the full email behind a recent conversation
 * (Figma 1745:68080 redirect target). A focused dialog through the shared
 * ModalShell: sender identity + received time, subject, then the full body.
 */
export default function ConversationModal({ email, onClose }: Props) {
  const body = email.body ?? email.preview;
  const paragraphs = body.split('\n\n');

  // Portal to the body: the Evaluate panel is a transformed/clipped container, so a
  // position:fixed modal rendered inside it gets contained + clipped (the earlier
  // "modal not rendering" bug). Portalling escapes the panel's containing block.
  const [mounted, setMounted] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  // Move focus into the dialog on open (ModalShell traps Tab + restores focus on
  // close, but nothing moved focus in). preventScroll so the panel behind holds.
  useEffect(() => {
    if (mounted) innerRef.current?.focus({ preventScroll: true });
  }, [mounted]);
  if (!mounted) return null;

  return createPortal(
    <ModalShell ariaLabel={`Conversation from ${email.sender}`} onClose={onClose} dialogClassName={styles.dialog}>
      {(requestClose) => (
        <div className={styles.inner} ref={innerRef} tabIndex={-1}>
          <header className={styles.header}>
            <div className={styles.who}>
              <span className={styles.avatar} aria-hidden>
                {initials(email.sender)}
              </span>
              <div className={styles.whoText}>
                <span className={styles.name}>{email.sender}</span>
                <span className={styles.addr}>{emailAddress(email.sender)}</span>
              </div>
            </div>
            <button type="button" className={styles.close} aria-label="Close conversation" onClick={requestClose}>
              <RiCloseLine aria-hidden />
            </button>
          </header>

          <div className={styles.subjectRow}>
            <h2 className={styles.subject}>{email.subject}</h2>
            <span className={styles.received}>{receivedLabel(email.id)}</span>
          </div>

          <div className={styles.body}>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      )}
    </ModalShell>,
    document.body,
  );
}
