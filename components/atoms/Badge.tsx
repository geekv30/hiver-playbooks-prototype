import type { ReactNode } from 'react';
import styles from './Badge.module.css';

type Intent = 'neutral' | 'success' | 'warning' | 'error' | 'running' | 'draft' | 'active' | 'paused';

interface Props {
  children: ReactNode;
  intent?: Intent;
}

// Badge — Figma 258:21962. Count / status pill.
export default function Badge({ children, intent = 'neutral' }: Props) {
  return <span className={`${styles.badge} ${styles[intent]}`}>{children}</span>;
}
