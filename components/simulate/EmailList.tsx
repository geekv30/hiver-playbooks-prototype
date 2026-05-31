import type { SimEmail } from '@/data/simFixtures';
import type { EmailRun } from './useSimRun';
import type { Verdict } from './RunOutcome';
import EmailCard from './EmailCard';
import styles from './EmailList.module.css';

interface Props {
  emails: SimEmail[];
  /** Per-email run state, keyed by email id. */
  runs?: Record<string, EmailRun>;
  /** Persisted human verdicts, keyed by email id. */
  verdicts?: Record<string, Verdict>;
  onVerdict?: (emailId: string, v: Verdict) => void;
}

/** EmailList — the stack of email cards inside a topic drill-down. */
export default function EmailList({ emails, runs, verdicts, onVerdict }: Props) {
  return (
    <div className={styles.list}>
      {emails.map((e) => (
        <EmailCard
          key={e.id}
          email={e}
          run={runs?.[e.id]}
          verdict={verdicts?.[e.id]}
          onVerdict={onVerdict ? (v) => onVerdict(e.id, v) : undefined}
        />
      ))}
    </div>
  );
}
