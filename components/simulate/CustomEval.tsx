'use client';

import type { SimStatusKind } from '@/data/simFixtures';
import ComposeEval from './ComposeEval';

interface Props {
  /** Report a completed run's status up to the canvas (the eval aggregate). */
  onRunRecorded?: (statuses: SimStatusKind[]) => void;
  /** Open the Copilot tab (Fix with Copilot on a caught gap). */
  onOpenCopilot?: () => void;
}

/**
 * Custom email (Figma 1769:19480): a blank editable email body + Start Evaluation.
 * A thin wrapper over the shared ComposeEval - the "Custom email" back-header is
 * provided by SimulatePanel above it.
 */
export default function CustomEval({ onRunRecorded, onOpenCopilot }: Props) {
  return (
    <ComposeEval
      placeholder="Write a custom email body to start"
      onRunRecorded={onRunRecorded}
      onOpenCopilot={onOpenCopilot}
    />
  );
}
