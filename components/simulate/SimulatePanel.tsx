'use client';

import { useState } from 'react';
import { RiPlayFill, RiCloseLine } from 'react-icons/ri';
import type { SimStatusKind } from '@/data/simFixtures';
import EvalMenu, { type ChatEvalView, type EvalChannel, type EvalView, EVAL_TITLES, EVAL_ICONS } from './EvalMenu';
import PastChats from './chat/PastChats';
import ChatScenarios from './chat/ChatScenarios';
import ChatLive from './chat/ChatLive';
import type { EditorDoc } from '@/components/flow01/doc';
import type { LiveCopilot } from '@/lib/copilot/useLiveCopilot';
import EvalBackHeader from './EvalBackHeader';
import MatchingEmails from './MatchingEmails';
import RecentEmails from './RecentEmails';
import AiScenarios from './AiScenarios';
import CustomEval from './CustomEval';
import type { TriggerScan } from './useTriggerScan';
import { CHAT_WAYS } from './evalChannels';
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
  /** The skill itself - chat evaluation runs it turn by turn. */
  doc?: EditorDoc;
  /** The live model (chat evaluation runs on it when it is on). */
  live?: LiveCopilot;
  /** The menu's channel, owned above so Copilot can point at email. */
  channel?: EvalChannel;
  onChannel?: (c: EvalChannel) => void;
  /** The chat ways on offer; the app's are evalChannels.CHAT_WAYS. */
  chatWays?: readonly ChatEvalView[];
  /** Bump to jump straight into Matching emails (Runs' "See what would
   *  match"). A counter rather than a flag, so asking twice works twice. */
  openMatching?: number;
}

/**
 * SimulatePanel - the Evaluate surface (Figma 1721:67361).
 *
 * A thin router: the root offers the entry cards for the picked channel
 * (EvalMenu - Email: Matching emails / Recent conversations / AI scenarios /
 * Custom email; Chat: Past chats / AI scenarios / Chat as a customer). Entering one opens its flow, which
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
  doc,
  live,
  channel: channelProp,
  onChannel,
  chatWays = CHAT_WAYS,
  openMatching = 0,
}: Props) {
  const [view, setView] = useState<EvalView>('menu');
  // Controlled when the canvas owns it; a local fallback keeps the panel whole.
  const [localChannel, setLocalChannel] = useState<EvalChannel>('email');
  const channel = channelProp ?? localChannel;
  const setChannel = onChannel ?? setLocalChannel;
  // Drill direction for the slide (forward = into a flow, back = out to the menu).
  const [dir, setDir] = useState<'fwd' | 'back' | null>(null);
  // A request to open Matching emails, adopted during render (React's
  // "adjust state when a prop changes"), so it lands in the same paint.
  const [seenMatching, setSeenMatching] = useState(0);
  if (openMatching !== seenMatching) {
    setSeenMatching(openMatching);
    if (openMatching > 0 && scan) {
      setDir('fwd');
      setView('matching');
    }
  }

  const openFlow = (v: Exclude<EvalView, 'menu'>) => {
    // Matching emails needs the canvas-level scan; without it the card would
    // open an empty view, so it stays put instead.
    if (v === 'matching' && !scan) return;
    // A chat flow runs the skill itself; without it there is nothing to run.
    if ((v === 'pastChats' || v === 'chatScenarios' || v === 'chatLive') && (!doc || !live)) return;
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
            <EvalMenu
              onOpen={openFlow}
              channel={channel}
              onChannel={setChannel}
              chatWays={chatWays}
              matchFresh={scan?.fresh}
              matchIsNew={matchingIsNew}
            />
          )}

          {view === 'pastChats' && doc && live && (
            <PastChats doc={doc} live={live} onExit={toMenu} onRunRecorded={onRunRecorded} onOpenCopilot={onOpenCopilot} />
          )}
          {view === 'chatScenarios' && doc && live && (
            <ChatScenarios doc={doc} live={live} onExit={toMenu} onRunRecorded={onRunRecorded} onOpenCopilot={onOpenCopilot} />
          )}
          {view === 'chatLive' && doc && live && (
            <ChatLive doc={doc} live={live} onExit={toMenu} onRunRecorded={onRunRecorded} onOpenCopilot={onOpenCopilot} />
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
