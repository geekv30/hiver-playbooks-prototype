'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RiArrowLeftLine } from 'react-icons/ri';
import GmailBar from '@/components/flow01/GmailBar';
import { allRuns, revisionMarks, sourceFor } from '@/data/runFixtures';
import RunsView from './RunsView';
import { useIsClient } from './useIsClient';
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
  // Arriving from a skill's Runs cell lands pre-filtered to it. Read after the
  // client takes over, like every other clock- or URL-derived value here.
  const isClient = useIsClient();
  const skillId = isClient
    ? new URLSearchParams(window.location.search).get('skill')
    : null;
  const marks = useMemo(() => {
    const src = skillId ? sourceFor(skillId) : undefined;
    return src ? revisionMarks(src) : [];
  }, [skillId]);

  return (
    <div className={styles.page}>
      <GmailBar />
      <div className={styles.shell}>
        <main className={styles.main}>
          <header className={styles.header}>
            <div className={styles.headRow}>
              <button
                type="button"
                className={styles.back}
                onClick={() => router.push('/aops')}
                aria-label="Back to Skills"
              >
                <RiArrowLeftLine aria-hidden />
              </button>
              <div>
                <h1 className={styles.title}>All skill runs</h1>
                <p className={styles.subtitle}>
                  Everything your skills did across the shared inboxes.
                </p>
              </div>
            </div>
          </header>
          <div className={styles.body}>
            <RunsView key={skillId ?? 'all'} runs={runs} marks={marks} allSkills initialSkillId={skillId} />
          </div>
        </main>
      </div>
    </div>
  );
}
