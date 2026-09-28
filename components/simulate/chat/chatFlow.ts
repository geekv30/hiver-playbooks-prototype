import type { EditorDoc } from '@/components/flow01/doc';
import type { SimStatusKind } from '@/data/simFixtures';
import type { LiveCopilot } from '@/lib/copilot/useLiveCopilot';

/** What every chat evaluation flow is given. */
export interface ChatFlowProps {
  doc: EditorDoc;
  live: LiveCopilot;
  onExit: () => void;
  onRunRecorded?: (statuses: SimStatusKind[]) => void;
  onOpenCopilot?: () => void;
}

/** The live model's state in the shape the AI note under a composer reads. */
export function noteLive(live: LiveCopilot) {
  return {
    mode: live.mode,
    model: live.model,
    needsPasscode: live.needsPasscode,
    onUnlock: live.unlock,
    onLock: live.lock,
  };
}
