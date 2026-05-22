'use client';
import { useEffect, useState } from 'react';
import styles from './EditorShell.module.css';

interface Props {
  topbar: React.ReactNode;
  nav: React.ReactNode;
  canvas: React.ReactNode;
  rail: React.ReactNode;
}

export default function EditorShell({ topbar, nav, canvas, rail }: Props) {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const check = () => setWide(window.innerWidth >= 1316);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!wide) {
    return (
      <div className={styles.gateNotice}>
        <div>
          <h1 className={styles.gateTitle}>Editor is desktop-only</h1>
          <p>Please open on a screen at least 1316px wide.</p>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.shell}>
      {topbar}
      {nav}
      {canvas}
      {rail}
    </div>
  );
}
