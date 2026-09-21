'use client';

import { RiArrowLeftLine, RiPlayLine, RiSettings3Line, RiPulseLine } from 'react-icons/ri';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import TitleField from './TitleField';
import type { DeployStatus } from './doc';
import styles from './Toolbar.module.css';

// Lowercase to match the Figma status chip (518:16607: "draft").
const STATUS_LABEL: Record<DeployStatus, string> = {
  draft: 'draft',
  active: 'active',
  paused: 'paused',
};

interface Props {
  title: string;
  onTitleChange: (t: string) => void;
  /** Lifecycle status - drives the pill and the primary control's label. */
  status: DeployStatus;
  onSimulate?: () => void;
  /** Open the Enable go-live modal (commit mode). */
  onEnable?: () => void;
  /** False when the skill has no trigger/steps yet - Enable renders muted+disabled
   *  (Figma 647:39849). */
  canEnable?: boolean;
  /** Stop a live Skill - instant, no modal (a toast confirms + offers Undo). */
  onPause?: () => void;
  /** Restart a paused Skill - instant, no modal. */
  onResume?: () => void;
  /** The gear (active/paused only): open the Enable modal in manage mode. */
  onSettings?: () => void;
  onBack?: () => void;
  /** Whether the simulate panel is open (toggles the Simulate button's pressed state). */
  simulating?: boolean;
  /** Hide the top-bar Simulate button (the companion model moves "Evaluate" onto the canvas). */
  hideSimulate?: boolean;
  /** Hide the title + status here (when the skill identity moves onto a canvas
   *  header). The Back button stays. */
  hideIdentity?: boolean;
  /** Runs in the last 30 days. Undefined hides the control entirely (a skill
   *  that has never been live has no history to offer). */
  runCount?: number;
  /** Whether the page is currently showing Runs instead of the editor. */
  runsOpen?: boolean;
  /** Toggle the Runs mode. */
  onToggleRuns?: () => void;
}

// Editor toolbar. Left = back + the skill identity (title + status pill).
// Right = an optional Simulate check + one state-driven primary control: "Enable"
// (draft/paused) -> opens the Guardrails commit flow; "Pause" (active) -> instant
// stop. Undo/redo are keyboard-only (Cmd+Z / Cmd+Shift+Z), so the bar stays clean.
export default function Toolbar({
  title,
  onTitleChange,
  status,
  onSimulate,
  onEnable,
  canEnable = true,
  onPause,
  onResume,
  onSettings,
  onBack,
  simulating,
  hideSimulate,
  hideIdentity,
  runCount,
  runsOpen,
  onToggleRuns,
}: Props) {
  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        {/* ONE back affordance, always. In Runs the arrow steps back to the
            editor rather than out of the skill, and the breadcrumb says where
            you are - two arrows side by side meaning different things is not a
            navigation model. */}
        <Button
          variant="secondary"
          iconOnly={<RiArrowLeftLine />}
          ariaLabel={runsOpen ? 'Back to editing' : 'Back to skills'}
          onClick={runsOpen ? onToggleRuns : onBack}
        />
        {!hideIdentity && (
          <>
            {runsOpen ? (
              <span className={styles.crumbs}>
                <button type="button" className={styles.crumbLink} onClick={onToggleRuns}>
                  {title || 'Untitled skill'}
                </button>
                <span className={styles.crumbSep} aria-hidden>
                  /
                </span>
                <span className={styles.crumbHere}>Runs</span>
              </span>
            ) : (
              <TitleField value={title} onChange={onTitleChange} className={styles.title} />
            )}
            <Badge intent={status}>{STATUS_LABEL[status]}</Badge>
          </>
        )}
      </div>

      <div className={styles.right}>
        {!runsOpen && runCount !== undefined && onToggleRuns && (
          <button type="button" className={styles.runs} onClick={onToggleRuns}>
            <RiPulseLine className={styles.runsIcon} aria-hidden />
            Runs
            <span className={styles.runsN}>{runCount}</span>
          </button>
        )}
        {!runsOpen && !hideSimulate && (
          <Button
            variant="secondary"
            iconLeft={<RiPlayLine />}
            onClick={onSimulate}
            ariaPressed={simulating}
          >
            Simulate
          </Button>
        )}
        {!runsOpen && status !== 'draft' && (
          <Button
            variant="secondary"
            iconOnly={<RiSettings3Line />}
            ariaLabel="Skill settings"
            onClick={onSettings}
          />
        )}
        {runsOpen ? null : status === 'active' ? (
          <Button variant="secondary" onClick={onPause}>
            Pause
          </Button>
        ) : status === 'paused' ? (
          <Button variant="accent" onClick={onResume}>
            Resume
          </Button>
        ) : (
          <Button variant="accent" onClick={onEnable} disabled={!canEnable}>
            Enable
          </Button>
        )}
      </div>
    </div>
  );
}
