import EditorCanvas from '@/components/flow01/EditorCanvas';

// Canvas 360 - flow-01 assembly (the live AOP editor, empty state) with
// the Copilot + Evaluate companions: the floating tool-switcher rail and the two
// mutually-exclusive right-hand panels.
export default function CanvasPage() {
  return <EditorCanvas companions />;
}
