import { RiMailLine } from 'react-icons/ri';
import type { SimEmail } from '@/data/simFixtures';
import styles from './EmailCard.module.css';

interface Props {
  email: SimEmail;
}

/**
 * EmailCard (idle) — Figma 211:20104: bordered card (radius 10, padding 20/16/14)
 * with the sender (mail icon + name), subject, and a single-line preview. The
 * run pill + trace mount onto this card from M4/M5.
 */
export default function EmailCard({ email }: Props) {
  return (
    <article className={styles.card}>
      <div className={styles.sender}>
        <RiMailLine className={styles.mail} aria-hidden />
        <span className={styles.name}>{email.sender}</span>
      </div>
      <div className={styles.body}>
        <div className={styles.subject}>{email.subject}</div>
        <div className={styles.preview}>{email.preview}</div>
      </div>
    </article>
  );
}
