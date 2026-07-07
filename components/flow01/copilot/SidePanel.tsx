'use client';

import PanelTabs, { type SideTab } from './PanelTabs';
import CopilotPanel, { type CopilotMessage } from './CopilotPanel';
import SimulatePanel from '@/components/simulate/SimulatePanel';
import type { SimStatusKind } from '@/data/simFixtures';
import type { Verdict } from '@/components/atoms/ThumbsRating';
import styles from './SidePanel.module.css';

export type { SideTab };

interface CopilotProps {
  messages: CopilotMessage[];
  onSend: (text: string) => void;
  onRegenerate?: () => void;
  onClear?: () => void;
  introReady?: boolean;
  onStop: () => void;
  busy?: boolean;
  onAttach?: () => void;
  onApplyProposal: (i: number) => void;
  onDismissProposal: (i: number) => void;
  onUndoProposal: (i: number) => void;
  onVerdict: (i: number, v: Verdict) => void;
}

interface SimProps {
  hasScenarios?: boolean;
  hasTrigger?: boolean;
  onAddTrigger?: () => void;
  /** Completed-run statuses reported up to the canvas (the eval aggregate). */
  onRunRecorded?: (statuses: SimStatusKind[]) => void;
  /** Open the Copilot tab (Fix with Copilot on a caught gap). */
  onOpenCopilot?: () => void;
}

interface Props {
  tab: SideTab;
  onTab: (t: SideTab) => void;
  copilot: CopilotProps;
  sim: SimProps;
}

/**
 * The docked side panel (Figma 647:40108): a fixed-height card, the same height
 * as the canvas window, holding the Copilot | Simulate tab header over two
 * cross-fading panes. Both panes stay mounted so their state (the conversation,
 * a sim run) survives a tab switch.
 */
export default function SidePanel({ tab, onTab, copilot, sim }: Props) {
  // The Copilot | Evaluation tabs stay pinned across every Evaluate flow; each flow
  // renders its own `‹` back-header as a row BELOW the tabs (Figma 1745:67909).
  return (
    <aside className={styles.panel} aria-label="Copilot and Evaluation">
      <PanelTabs active={tab} onChange={onTab} />
      <div className={styles.body}>
        <div
          className={styles.pane}
          role="tabpanel"
          data-active={tab === 'copilot' || undefined}
          inert={tab !== 'copilot' || undefined}
        >
          <CopilotPanel
            docked
            open={tab === 'copilot'}
            onClose={() => onTab('copilot')}
            {...copilot}
          />
        </div>
        <div
          className={styles.pane}
          role="tabpanel"
          data-active={tab === 'simulate' || undefined}
          inert={tab !== 'simulate' || undefined}
        >
          <SimulatePanel docked open={tab === 'simulate'} {...sim} />
        </div>
      </div>
    </aside>
  );
}
