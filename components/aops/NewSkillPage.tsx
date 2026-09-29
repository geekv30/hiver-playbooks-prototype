'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type Workspace, listHref } from '@/lib/skillsStore';
import AdminShell, { shellStyles } from './AdminShell';
import SkillsEmptyHero from './empty/SkillsEmptyHero';
import { newSkillHref } from './AopListPage';

/**
 * "Create Skill" once a workspace has skills: the empty state's composer and
 * templates on their own page, in the same Admin frame - one entry design,
 * whether it's your first skill or your tenth.
 */
export default function NewSkillPage() {
  const router = useRouter();
  const params = useSearchParams();
  const workspace: Workspace = params.get('ws') === 'empty' ? 'empty' : 'demo';

  return (
    <AdminShell
      title="New skill"
      onBack={() => router.push(listHref(workspace))}
      actions={
        <Link
          href={`/aops/new?start=blank${workspace === 'empty' ? '&ws=empty' : ''}`}
          className={shellStyles.secondaryBtn}
        >
          Create from scratch
        </Link>
      }
    >
      <SkillsEmptyHero
        onSubmit={({ prompt, starter, fileName }) =>
          router.push(newSkillHref(workspace, prompt, starter?.id, fileName))
        }
      />
    </AdminShell>
  );
}
