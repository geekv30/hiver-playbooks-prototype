import EditorCanvas from '@/components/flow01/EditorCanvas';
import { EXAMPLE_DOC } from '@/components/flow01/doc';

// Stakeholder demo route — the "API error triage" example playbook, pre-built
// and ready to Simulate. /canvas stays the clean empty editor.
export default function ApiExamplePage() {
  return <EditorCanvas initialDoc={EXAMPLE_DOC} />;
}
