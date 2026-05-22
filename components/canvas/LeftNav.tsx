'use client';
import { InboxIcon, HistoryIcon, SparkleIcon, SettingsIcon } from '@/components/icons/ui';
import styles from './LeftNav.module.css';

type NavItem = 'inbox' | 'recent' | 'tools' | 'settings' | 'avatar';

interface Props {
  onItem: (item: NavItem) => void;
}

export default function LeftNav({ onItem }: Props) {
  return (
    <aside className={styles.nav} aria-label="Primary navigation">
      <div className={styles.inner}>
        <div
          className={`${styles.item} ${styles.active}`}
          role="button"
          tabIndex={0}
          aria-current="page"
          onClick={() => onItem('inbox')}
        >
          <InboxIcon />
          <span className={styles.tip}>Playbooks</span>
        </div>
        <div className={styles.item} role="button" tabIndex={0} onClick={() => onItem('recent')}>
          <HistoryIcon />
          <span className={styles.tip}>Recent</span>
        </div>
        <div className={styles.item} role="button" tabIndex={0} onClick={() => onItem('tools')}>
          <SparkleIcon />
          <span className={styles.tip}>Tools</span>
        </div>
        <div className={styles.spacer} />
        <div className={styles.item} role="button" tabIndex={0} onClick={() => onItem('settings')}>
          <SettingsIcon />
          <span className={styles.tip}>Settings</span>
        </div>
        <div
          className={styles.avatar}
          role="button"
          tabIndex={0}
          onClick={() => onItem('avatar')}
          aria-label="Account"
        >
          V
        </div>
      </div>
    </aside>
  );
}
