'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EditorCanvas, { type EditorHandoff } from '@/components/flow01/EditorCanvas';
import type { Workspace } from '@/lib/skillsStore';

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
  // Captured once: the editor cleans the URL after it consumes the handoff.
  const [workspace] = useState<Workspace>(() => (params.get('ws') === 'empty' ? 'empty' : 'demo'));
  const [handoff] = useState<EditorHandoff | undefined>(() => {
    const prompt = params.get('prompt')?.trim() || undefined;
    const sopName = params.get('sop')?.trim() || undefined;
    if (params.get('start') === 'blank') return { blank: true };
    if (prompt || sopName) return { prompt, sopName, templateId: params.get('template') ?? undefined };
    return undefined;
  });
  const [persist] = useState(() => ({ workspace }));

  useEffect(() => {
    if (!handoff) router.replace(`/aops/create${workspace === 'empty' ? '?ws=empty' : ''}`);
  }, [handoff, workspace, router]);

  if (!handoff) return null;
  return <EditorCanvas companions handoff={handoff} persist={persist} />;
}
