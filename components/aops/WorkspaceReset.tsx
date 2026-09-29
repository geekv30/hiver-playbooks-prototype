'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type Workspace, listHref, resetWorkspace } from '@/lib/skillsStore';

/**
 * A reset link for a demo workspace: /aops/empty/fresh always opens the empty
 * state, /aops/fresh always the 8 seeded skills. It resets the workspace, then
 * replaces itself with the list, so the list's own URL stays plain and keeps
 * whatever you make from there on.
 *
 * A route, not a `?fresh` flag on the list: the production router caches a
 * page under the URL it was first opened with, so a later in-app trip back to
 * the list restored `?fresh` and reset it again - wiping a skill just made.
 */
export default function WorkspaceReset({ workspace }: { workspace: Workspace }) {
  const router = useRouter();

  useEffect(() => {
    resetWorkspace(workspace);
    router.replace(listHref(workspace));
  }, [workspace, router]);

  return null;
}
