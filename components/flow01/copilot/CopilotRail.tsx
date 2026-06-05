'use client';

import { RiPlayFill } from 'react-icons/ri';
import CopilotSparkle from './CopilotSparkle';
import styles from './CopilotRail.module.css';

interface Props {
  /** Copilot panel open -> the sparkle tab reads active. */
  copilotOpen: boolean;
  onToggleCopilot: () => void;
  /** Evaluate panel open -> the play tab reads active. */
  evaluating: boolean;
  onToggleEvaluate: () => void;
}

/**
 * The /canvas tool-switcher (Figma 520:17882 = Copilot active, 536:34810 = Eval
 * active). A vertical 2-tab segmented control - Copilot (purple sparkle) over
 * Evaluate (Gray-1 play) - on a Gray-6a track. The ACTIVE tab lifts as a white
 * slot (Shadows/sm); the icons keep their own color, so the active read comes
 * from the slot, not an icon recolor. It floats, pinned to the canvas-card top,
 * so an idle workspace reserves no rail column and the editor sits centered.
 */
export default function CopilotRail({
  copilotOpen,
  onToggleCopilot,
  evaluating,
  onToggleEvaluate,
}: Props) {
  return (
    <div className={styles.rail}>
      <div className={styles.switcher}>
        <button
          type="button"
          className={styles.tab}
          data-active={copilotOpen || undefined}
          aria-pressed={copilotOpen}
          aria-label={copilotOpen ? 'Close Copilot' : 'Open Copilot'}
          onClick={onToggleCopilot}
        >
          <span className={styles.iconBtn}>
            <CopilotSparkle size={20} tone="flat" />
          </span>
        </button>
        <button
          type="button"
          className={styles.tab}
          data-active={evaluating || undefined}
          aria-pressed={evaluating}
          aria-label={evaluating ? 'Close Evaluate' : 'Run an evaluation'}
          onClick={onToggleEvaluate}
        >
          <span className={styles.iconBtn}>
            <RiPlayFill className={styles.playIcon} />
          </span>
        </button>
      </div>
    </div>
  );
}
