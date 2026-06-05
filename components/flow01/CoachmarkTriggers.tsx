'use client';

import { useEffect, useState } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import styles from './CoachmarkTriggers.module.css';

// One-time teach for the two triggers. Shown once per user, then never again.
// Especially needed because the trigger changed: earlier testers learned
// '@' = actions; this corrects that at peak attention.
const SEEN_KEY = 'hiver.playbooks.coach.triggers.v1';

export default function CoachmarkTriggers() {
  // SSR-safe: default hidden (matches server markup), reveal after hydration if
  // the user has not seen it. Reading localStorage in useEffect, not useState.
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setShow(true);
    } catch {
      /* private mode / no storage - just skip */
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* noop */
    }
    setShow(false);
  };

  return (
    <div className={styles.coach} role="status">
      <p className={styles.text}>
        <span className={styles.lead}>Two ways to build.</span> Type{' '}
        <kbd className={styles.key}>/</kbd> to run an action (tag, assign, search the KB...) and{' '}
        <kbd className={styles.key}>@</kbd> to reference ticket data or an earlier step.
      </p>
      <button type="button" className={styles.dismiss} onClick={dismiss} aria-label="Dismiss">
        Got it
        <RiCloseLine />
      </button>
    </div>
  );
}
