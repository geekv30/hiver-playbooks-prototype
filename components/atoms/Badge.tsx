import type { ReactNode } from 'react';
import styles from './Badge.module.css';

type Intent =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'running'
  | 'draft'
  | 'active'
  | 'paused'
  | 'gray'
  | 'green';

interface Props {
  children: ReactNode;
  intent?: Intent;
}

// Badge - Figma 258:21962. Count / status pill. `gray` / `green` are the
// Skills-ai DLS Badge (Figma 5785:9659): bordered 22px pill, 12 medium.
export default function Badge({ children, intent = 'neutral' }: Props) {
  return <span className={`${styles.badge} ${styles[intent]}`}>{children}</span>;
}
