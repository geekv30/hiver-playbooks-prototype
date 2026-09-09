'use client';

import { useState } from 'react';
import { RiPlayFill, RiCloseLine } from 'react-icons/ri';
import type { SimStatusKind } from '@/data/simFixtures';
import EvalMenu, { type EvalView, EVAL_TITLES, EVAL_ICONS } from './EvalMenu';
import EvalBackHeader from './EvalBackHeader';
import MatchingEmails from './MatchingEmails';
import RecentEmails from './RecentEmails';
import AiScenarios from './AiScenarios';
import CustomEval from './CustomEval';
import type { TriggerScan } from './useTriggerScan';
import styles from './SimulatePanel.module.css';

interface Props {
  /** Whether the panel is open (the canvas makes space for it). */
  open: boolean;
  /** Close the panel (the floating header X; docked has no close). */
  onClose?: () => void;
  /** Whether this skill has generated scenarios; false shows the informative empty state. */
  hasScenarios?: boolean;
  /** Whether the live Skill has a trigger (drives the empty-state action). */
  hasTrigger?: boolean;
  /** Focus the trigger line in the editor (the empty-state action). */
  onAddTrigger?: () => void;
  /** Render as a floating rounded card (matching CopilotPanel) - /api-example. */
  floating?: boolean;
  /** Rendered inside the docked SidePanel - drop the panel chrome; the SidePanel
   *  provides the card + the persistent Copilot | Evaluation tabs above. */
  docked?: boolean;
  /** Report a completed run's per-email statuses up to the canvas (the eval
   *  aggregate that makes Enable evaluation-aware). */
  onRunRecorded?: (statuses: SimStatusKind[]) => void;
  /** Open the Copilot tab (Fix with Copilot on a caught gap). */
  onOpenCopilot?: () => void;
  /** The live trigger text - what Matching emails matches against. */
  trigger?: string;
  /** The shared mailboxes this skill runs on (ids). */
  mailboxes?: string[];
  /** The canvas-level trigger scan (shared with Copilot's matching row). */
  scan?: TriggerScan;
  /** Called the first time the user opens Matching emails (retires the New pill). */
  onMatchingSeen?: () => void;
  /** Whether the Matching emails card still carries its New pill. */
  matchingIsNew?: boolean;
}

/**
 * SimulatePanel - the Evaluate surface (Figma 1721:67361).
 *
 * A thin router: the root offers three entry cards (EvalMenu - Recent
 * conversations / AI scenarios / Custom email). Entering one opens its flow, which
 * renders its OWN `‹` back-header BELOW the persistent Copilot | Evaluation tabs
 * (the tabs no longer swap out). Each flow owns its navigation and its single-email
 * run; they converge on the shared trace primitives.
 */
export default function SimulatePanel({
  open,
  onClose,
  hasScenarios = true,
  hasTrigger = false,
  onAddTrigger,
  floating,
  docked,
  onRunRecorded,
  onOpenCopilot,
  trigger = '',
  mailboxes = [],
  scan,
  onMatchingSeen,
  matchingIsNew,
}: Props) {
  const [view, setView] = useState<EvalView>('menu');
  // Drill direction for the slide (forward = into a flow, back = out to the menu).
  const [dir, setDir] = useState<'fwd' | 'back' | null>(null);

  const openFlow = (v: Exclude<EvalView, 'menu'>) => {
    // Matching emails needs the canvas-level scan; without it the card would
    // open an empty view, so it stays put instead.
    if (v === 'matching' && !scan) return;
    if (v === 'matching') onMatchingSeen?.();
    setDir('fwd');
    setView(v);
  };
  const toMenu = () => {
    setDir('back');
    setView('menu');
  };

  return (
    <aside
      className={styles.panel}
      data-open={open || undefined}
      data-floating={floating || undefined}
      data-docked={docked || undefined}
      aria-label="Evaluation"
      aria-hidden={!open}
      inert={!open}
    >
      <div className={styles.inner}>
        {/* Floating-only "Evaluate" header on the menu (the docked panel uses the
            SidePanel's persistent Copilot | Evaluation tabs instead). */}
        {view === 'menu' && !docked && (
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <RiPlayFill className={styles.headerIcon} />
              <span className={styles.headerText}>Evaluate</span>
            </div>
            <button type="button" className={styles.headerClose} aria-label="Close Evaluate" onClick={onClose}>
              <RiCloseLine />
            </button>
          </header>
        )}

        <div className={styles.viewWrap} data-dir={dir ?? undefined} key={view}>
          {view === 'menu' && (
            <EvalMenu onOpen={openFlow} matchFresh={scan?.fresh} matchIsNew={matchingIsNew} />
          )}

          {view === 'matching' && scan && (
            <MatchingEmails
              trigger={trigger}
              mailboxes={mailboxes}
              scan={scan}
              onExit={toMenu}
              onRunRecorded={onRunRecorded}
              onOpenCopilot={onOpenCopilot}
              onAddTrigger={onAddTrigger}
              onTryScenarios={() => openFlow('scenarios')}
            />
          )}

          {view === 'recent' && (
            <RecentEmails onExit={toMenu} onRunRecorded={onRunRecorded} onOpenCopilot={onOpenCopilot} />
          )}

          {view === 'scenarios' && (
            <AiScenarios
              hasScenarios={hasScenarios}
              hasTrigger={hasTrigger}
              onAddTrigger={onAddTrigger}
              onExit={toMenu}
              onRunRecorded={onRunRecorded}
              onOpenCopilot={onOpenCopilot}
            />
          )}

          {view === 'custom' && (
            <div className={styles.flow}>
              <EvalBackHeader title={EVAL_TITLES.custom} icon={EVAL_ICONS.custom} onBack={toMenu} />
              <CustomEval onRunRecorded={onRunRecorded} onOpenCopilot={onOpenCopilot} />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
