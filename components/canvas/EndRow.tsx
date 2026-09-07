'use client';
import styles from './EndRow.module.css';

interface Props {
  onClick: () => void;
  label?: string;
}

export default function EndRow({ onClick, label = '+ end of skill · add step' }: Props) {
  return (
    <div className={styles.endCta} onClick={onClick} role="button" tabIndex={0}>
      {label}
    </div>
  );
}
