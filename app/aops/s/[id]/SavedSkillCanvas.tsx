'use client';

import { useParams } from 'next/navigation';
import SavedSkillEditor from './SavedSkillEditor';

/** /aops/s/[id]: the saved skill named in the URL. */
export default function SavedSkillCanvas() {
  const { id } = useParams<{ id: string }>();
  return <SavedSkillEditor id={id} />;
}
