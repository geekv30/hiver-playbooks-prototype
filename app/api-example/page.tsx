import EditorCanvas from '@/components/flow01/EditorCanvas';
import { EXAMPLE_DOC } from '@/components/flow01/doc';

// Stakeholder demo route - the "API error triage" example AOP, pre-built and
// ready to review with the full experience: the Copilot + Evaluation companions,
// the Enable go-live flow, etc. (the pre-built doc means no cold-start modal).
export default function ApiExamplePage() {
  return <EditorCanvas initialDoc={EXAMPLE_DOC} companions />;
}
