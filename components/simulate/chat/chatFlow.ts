import type { EditorDoc } from '@/components/flow01/doc';
import type { SimStatusKind } from '@/data/simFixtures';
import type { LiveCopilot } from '@/lib/copilot/useLiveCopilot';
import { itemOutcome, type AgentItem, type ChatRun } from './useChatRun';

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

/** What a finished chat's result line says: the review's own words when there
 *  is one - whether the customer was actually helped, not just whether every
 *  message got a reply. A turn that needed attention leads the line, so the
 *  reason always matches the label; the review's sentence follows it. */
export function chatResultLine(
  run: Pick<ChatRun, 'items' | 'outcome' | 'verdict' | 'engine'>,
): string {
  const { items, outcome, verdict } = run;
  const flagged = items.filter((i): i is AgentItem => i.kind === 'agent' && itemOutcome(i) === 'attention').length;
  const skillRan = items.some((i) => i.kind === 'agent' && i.turn?.stage === 'run');
  const turnLine = flagged > 0 ? `${flagged} ${flagged === 1 ? 'message needs' : 'messages need'} a look.` : '';
  if (outcome === 'errored') return 'The evaluation could not finish. Start over to try again.';
  if (verdict) return verdict.verdict !== 'unresolved' && turnLine ? `${turnLine} ${verdict.reason}` : verdict.reason;
  if (!skillRan) return 'The skill never started: the customer did not say what they needed.';
  if (outcome === 'attention') return turnLine;
  return run.engine === 'scripted'
    ? 'Every message got a reply. Scripted replies are not reviewed for quality.'
    : 'Every message got a reply.';
}
