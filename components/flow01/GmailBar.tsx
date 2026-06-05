'use client';

import { RiMenuLine } from 'react-icons/ri';
import { GmailLogo } from '@/components/icons/ui/GmailLogo';
import styles from './GmailBar.module.css';

// Gmail top-bar chrome (flow-01 256:3080). Presentational - this is the host
// Gmail surface that wraps the AOP editor, not our product UI.
// Stripped to the brand-left only (search + right-cluster removed per review).
export default function GmailBar() {
  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <button className={styles.iconBtn} aria-label="Main menu" tabIndex={-1}>
          <RiMenuLine />
        </button>
        <span className={styles.logo}>
          <GmailLogo className={styles.logoMark} />
          <span className={styles.logoWord}>Gmail</span>
        </span>
      </div>
    </header>
  );
}
