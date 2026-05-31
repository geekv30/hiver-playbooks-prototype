import type { SimEmail } from '@/data/simFixtures';
import EmailCard from './EmailCard';
import styles from './EmailList.module.css';

interface Props {
  emails: SimEmail[];
}

/** EmailList — the stack of email cards inside a topic drill-down. */
export default function EmailList({ emails }: Props) {
  return (
    <div className={styles.list}>
      {emails.map((e) => (
        <EmailCard key={e.id} email={e} />
      ))}
    </div>
  );
}
