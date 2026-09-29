'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import EditorCanvas from '@/components/flow01/EditorCanvas';
import { getSkill, useSkillExists } from '@/lib/skillsStore';
import styles from './page.module.css';

/**
 * A saved skill, reopened: its doc is read from the skills store once (the
 * editor owns it from there and autosaves back). It subscribes only to whether
 * the skill exists, so a save doesn't re-render the editor a second time.
 */
export default function SavedSkillEditor({ id }: { id: string }) {
  const exists = useSkillExists(id);
  const skill = useMemo(() => (exists ? getSkill(id) : undefined), [id, exists]);
  const persist = useMemo(
    () => (skill ? { workspace: skill.workspace, savedId: skill.id } : undefined),
    [skill],
  );

  if (exists === null) return null; // server render: the store is client-only
  if (!skill || !persist) {
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
  return <EditorCanvas key={skill.id} companions initialDoc={skill.doc} persist={persist} />;
}
