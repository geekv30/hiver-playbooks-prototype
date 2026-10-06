'use client';

import { useParams } from 'next/navigation';
import SavedSkillEditor from './SavedSkillEditor';

/** /aops/s/[id]: the saved skill named in the URL (its Runs at /runs). */
export default function SavedSkillCanvas({ runsMode }: { runsMode?: boolean }) {
  const { id } = useParams<{ id: string }>();
  return <SavedSkillEditor id={id} runsMode={runsMode} />;
}
