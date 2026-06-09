import EditorCanvas from '@/components/flow01/EditorCanvas';
import { CONNECTOR_SETUP_DEMO_DOC } from './seed';

// Canvas variant where every connector starts unauthenticated: adding one inserts
// a "{connector} . setup needed" tag, and clicking it runs the connection flow
// (intro -> token auth -> success -> select action).
export default function ConnectionNotSetupYetPage() {
  return <EditorCanvas initialDoc={CONNECTOR_SETUP_DEMO_DOC} companions connectorsStartUnauthed />;
}
