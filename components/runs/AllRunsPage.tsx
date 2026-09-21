'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RiArrowLeftLine } from 'react-icons/ri';
import GmailBar from '@/components/flow01/GmailBar';
import { allRuns } from '@/data/runFixtures';
import RunsView from './RunsView';
import styles from './AllRunsPage.module.css';

/**
 * AllRunsPage - every skill's runs in one place.
 *
 * The same RunsView the skill page uses, in all-skills mode: rows name their
 * skill and the filter bar gains a skill picker. This is the ops read - what
 * did automation do across the inbox this week - rather than the author's read
 * of one skill they are tuning.
 */
export default function AllRunsPage() {
  const router = useRouter();
  const runs = useMemo(() => allRuns(), []);

  return (
    <div className={styles.page}>
      <GmailBar />
      <div className={styles.shell}>
        <main className={styles.main}>
          <header className={styles.header}>
            <div>
              <button type="button" className={styles.crumb} onClick={() => router.push('/aops')}>
                <RiArrowLeftLine aria-hidden />
                Skills
              </button>
              <h1 className={styles.title}>All skill runs</h1>
              <p className={styles.subtitle}>
                Everything your skills did across the shared inboxes.
              </p>
            </div>
          </header>
          <div className={styles.body}>
            <RunsView runs={runs} allSkills flush />
          </div>
        </main>
      </div>
    </div>
  );
}
