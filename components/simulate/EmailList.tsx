import type { SimEmail } from '@/data/simFixtures';
import type { EmailRun } from './useSimRun';
import EmailCard from './EmailCard';
import styles from './EmailList.module.css';

interface Props {
  emails: SimEmail[];
  /** Per-email run state, keyed by email id. */
  runs?: Record<string, EmailRun>;
}

/** EmailList — the stack of email cards inside a topic drill-down. */
export default function EmailList({ emails, runs }: Props) {
  return (
    <div className={styles.list}>
      {emails.map((e) => (
        <EmailCard key={e.id} email={e} run={runs?.[e.id]} />
      ))}
    </div>
  );
}
