'use client';
import styles from './Inserter.module.css';

interface Props {
  onClick: () => void;
  label?: string;
}

export default function Inserter({ onClick, label = '+ step' }: Props) {
  return (
    <div className={styles.inserter} onClick={onClick} role="button" tabIndex={0}>
      {label}
    </div>
  );
}
