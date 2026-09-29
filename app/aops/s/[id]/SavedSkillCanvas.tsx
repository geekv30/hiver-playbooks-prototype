'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import EditorCanvas from '@/components/flow01/EditorCanvas';
import { useIsClient } from '@/components/runs/useIsClient';
import { useSkillsStore } from '@/lib/skillsStore';
import styles from './page.module.css';

/**
 * A saved skill, reopened: loads its doc from the skills store (client-only -
 * it lives in localStorage) and keeps autosaving into the same record.
 */
export default function SavedSkillCanvas() {
  const { id } = useParams<{ id: string }>();
  const isClient = useIsClient();
  const skill = useSkillsStore().skills.find((s) => s.id === id);

  if (!isClient) return null;
  if (!skill) {
    return (
      <main className={styles.missing}>
        <p className={styles.missingTitle}>This skill doesn&apos;t exist</p>
        <p className={styles.missingBody}>It may have been deleted, or it was saved in another browser.</p>
        <Link href="/aops" className={styles.missingLink}>
          Back to skills
        </Link>
      </main>
    );
  }
  // Keyed by id so moving between skills mounts a fresh editor on the right doc.
  return (
    <EditorCanvas
      key={skill.id}
      companions
      initialDoc={skill.doc}
      persist={{ workspace: skill.workspace, savedId: skill.id }}
    />
  );
}
