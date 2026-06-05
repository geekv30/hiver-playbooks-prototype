'use client';

import { RiArrowLeftLine, RiPlayLine, RiSettings3Line } from 'react-icons/ri';
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
  /** False when the AOP has no trigger/steps yet - Enable renders muted+disabled
   *  (Figma 647:39849). */
  canEnable?: boolean;
  /** Stop a live AOP - instant, no modal (a toast confirms + offers Undo). */
  onPause?: () => void;
  /** Restart a paused AOP - instant, no modal. */
  onResume?: () => void;
  /** The gear (active/paused only): open the Enable modal in manage mode. */
  onSettings?: () => void;
  onBack?: () => void;
  /** Whether the simulate panel is open (toggles the Simulate button's pressed state). */
  simulating?: boolean;
  /** Hide the top-bar Simulate button (the companion model moves "Evaluate" onto the canvas). */
  hideSimulate?: boolean;
  /** Hide the title + status here (when the playbook identity moves onto a canvas
   *  header). The Back button stays. */
  hideIdentity?: boolean;
}

// Editor toolbar. Left = back + the playbook identity (title + status pill).
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
}: Props) {
  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <Button
          variant="secondary"
          iconOnly={<RiArrowLeftLine />}
          ariaLabel="Back"
          onClick={onBack}
        />
        {!hideIdentity && (
          <TitleField value={title} onChange={onTitleChange} className={styles.title} />
        )}
        {!hideIdentity && <Badge intent={status}>{STATUS_LABEL[status]}</Badge>}
      </div>

      <div className={styles.right}>
        {!hideSimulate && (
          <Button
            variant="secondary"
            iconLeft={<RiPlayLine />}
            onClick={onSimulate}
            ariaPressed={simulating}
          >
            Simulate
          </Button>
        )}
        {status !== 'draft' && (
          <Button
            variant="secondary"
            iconOnly={<RiSettings3Line />}
            ariaLabel="AOP settings"
            onClick={onSettings}
          />
        )}
        {status === 'active' ? (
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
