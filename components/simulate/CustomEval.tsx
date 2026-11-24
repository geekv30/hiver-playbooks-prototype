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
 * Custom email (Figma 1769:19480): a blank test email (From, Subject, body, files) + Start Evaluation.
 * A thin wrapper over the shared ComposeEval - the "Custom email" back-header is
 * provided by SimulatePanel above it.
 */
export default function CustomEval({ onRunRecorded, onOpenCopilot }: Props) {
  return (
    <ComposeEval
      placeholder="Write the email you want to test"
      onRunRecorded={onRunRecorded}
      onOpenCopilot={onOpenCopilot}
    />
  );
}
