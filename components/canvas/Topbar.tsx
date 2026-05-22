'use client';
import { useEffect, useState } from 'react';
import type { SaveStatus } from '@/hooks/usePlaybook';
import type { ShareMailboxBinding } from '@/types/playbook';
import { BackIcon, KebabIcon } from '@/components/icons/ui';
import styles from './Topbar.module.css';

interface Props {
  playbookName: string;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  bindings: ShareMailboxBinding[];
  onRenamePlaybook: (name: string) => void;
  onTest: () => void;
  onActivate: () => void;
  onOverflow: () => void;
  onBack: () => void;
  validationBlocking: boolean;
}

function secondsAgo(t: number): number {
  return Math.max(0, Math.floor((Date.now() - t) / 1000));
}

function saveText(status: SaveStatus, lastSavedAt: number | null): string {
  if (status === 'saving') return 'Saving...';
  if (!lastSavedAt) return 'Unsaved';
  return `Saved ${secondsAgo(lastSavedAt)}s ago`;
}

export default function Topbar({
  playbookName, saveStatus, lastSavedAt, bindings,
  onRenamePlaybook, onTest, onActivate, onOverflow, onBack, validationBlocking,
}: Props) {
  // 5s ticker re-renders the save line
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 5000);
    return () => window.clearInterval(id);
  }, []);

  const saveCls = [
    styles.save,
    saveStatus === 'saving' ? styles.saving : '',
    saveStatus === 'idle' && !lastSavedAt ? styles.unsaved : '',
  ].filter(Boolean).join(' ');

  const anyActive = bindings.some((b) => b.active);
  const statusText = bindings.length === 0
    ? 'Inactive'
    : bindings.map((b) => `${b.active ? 'Active' : 'Inactive'} in ${b.mailboxName}`).join(' · ');
  const statusCls = `${styles.statusPill} ${anyActive ? styles.active : ''}`;

  return (
    <div className={styles.topbar}>
      <div className={styles.inner}>
        <div className={styles.brand} role="button" tabIndex={0}>H</div>
        <div className={styles.back} onClick={onBack} role="button" aria-label="Back" tabIndex={0}>
          <BackIcon />
        </div>
        <div className={styles.crumb}>
          <span>Playbooks</span>
          <span className={styles.csep}>/</span>
          <span
            className={styles.name}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onRenamePlaybook(e.currentTarget.textContent ?? '')}
          >
            {playbookName}
          </span>
        </div>
        <span className={saveCls}>{saveText(saveStatus, lastSavedAt)}</span>
        <div className={styles.spacer} />
        <span className={statusCls} title={statusText}>{statusText}</span>
        <div className={styles.overflow} role="button" onClick={onOverflow} aria-label="More" tabIndex={0}>
          <KebabIcon />
        </div>
        <button className={styles.btn} onClick={onTest} type="button">Test</button>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={onActivate}
          disabled={validationBlocking}
          type="button"
        >
          Activate
        </button>
      </div>
    </div>
  );
}
