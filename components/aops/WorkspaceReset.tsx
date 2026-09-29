'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type Workspace, resetWorkspace } from '@/lib/skillsStore';

/**
 * `?fresh` on a Skills list link resets that workspace, so each state has a
 * link that always opens the same way - /aops/empty?fresh is always the empty
 * state, /aops?fresh always the 8 seeded skills - while the plain URLs keep
 * whatever you've made. The param is dropped once applied, so a reload after
 * creating a skill doesn't wipe it.
 */
export default function WorkspaceReset({ workspace }: { workspace: Workspace }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fresh = params.has('fresh');

  useEffect(() => {
    if (!fresh) return;
    resetWorkspace(workspace);
    router.replace(pathname, { scroll: false });
  }, [fresh, workspace, router, pathname]);

  return null;
}
