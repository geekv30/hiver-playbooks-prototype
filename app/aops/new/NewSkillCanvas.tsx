'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import EditorCanvas, { type EditorHandoff } from '@/components/flow01/EditorCanvas';
import { type Workspace, takeStashedPrompt } from '@/lib/skillsStore';
import SavedSkillEditor from '../s/[id]/SavedSkillEditor';

/**
 * Reads the handoff off the URL and hands it to the editor:
 * `?prompt=&template=&sop=` (the composer) or `?start=blank` ("Create from
 * scratch"), plus `ws=empty` for the empty workspace. Kept here, not in
 * EditorCanvas, so the other routes that mount the editor don't take a
 * search-params dependency.
 *
 * With no handoff there's nothing to draft from, so it goes to the New skill
 * page - the one entry point (the old draft-with-AI modal is retired here).
 */
export default function NewSkillCanvas() {
  const router = useRouter();
  const params = useSearchParams();
  // The route this mounted on. Browser Back/Forward onto a skill's address
  // (/aops/s/<id> - set in place by the first autosave) restores this route's
  // tree; that's a saved skill, so it opens it - whatever query the router
  // still holds - instead of drafting a duplicate or redirecting. Captured at
  // mount: the in-place URL change mid-draft must not swap the editor out.
  const pathname = usePathname();
  const [mountedOn] = useState(pathname);
  const savedId = mountedOn.match(/^\/aops\/s\/([^/]+)/)?.[1];
  // Captured once: the editor cleans the URL after it consumes the handoff.
  const [workspace] = useState<Workspace>(() => (params.get('ws') === 'empty' ? 'empty' : 'demo'));
  const [handoff] = useState<EditorHandoff | undefined>(() => {
    if (savedId) return undefined;
    const raw = params.get('prompt_ref') ? takeStashedPrompt() : params.get('prompt');
    const prompt = raw?.trim() || undefined;
    const sopName = params.get('sop')?.trim() || undefined;
    if (params.get('start') === 'blank') return { blank: true };
    if (prompt || sopName) return { prompt, sopName, templateId: params.get('template') ?? undefined };
    return undefined;
  });
  const [persist] = useState(() => ({ workspace }));

  useEffect(() => {
    if (!handoff && !savedId) router.replace(`/aops/create${workspace === 'empty' ? '?ws=empty' : ''}`);
  }, [handoff, savedId, workspace, router]);

  if (savedId) return <SavedSkillEditor id={savedId} />;
  if (!handoff) return null;
  return <EditorCanvas companions handoff={handoff} persist={persist} />;
}
