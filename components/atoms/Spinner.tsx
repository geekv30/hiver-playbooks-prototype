'use client';
import { RiLoader4Line } from 'react-icons/ri';
import styles from './Spinner.module.css';

interface Props {
  size?: number;
}

// Spinner — Figma 211:19472. Remix loader, rotating.
export default function Spinner({ size = 16 }: Props) {
  return (
    <RiLoader4Line
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}
