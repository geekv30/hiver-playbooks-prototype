'use client';

import { RiStopCircleLine } from 'react-icons/ri';
import { useConnectorHealth } from '@/components/flow01/connectorHealth';
import EvalBackHeader from '../EvalBackHeader';
import { CHAT_EVAL_ENTRIES, CHAT_EVAL_ICONS } from '../EvalMenu';
import scenarioStyles from '../AiScenarios.module.css';
import flow from '../RecentEmails.module.css';
import ChatSession from './ChatSession';
import { useChatRun } from './useChatRun';
import { noteLive, type ChatFlowProps } from './chatFlow';

const TITLE = CHAT_EVAL_ENTRIES.find((e) => e.id === 'chatLive')!.title;

/**
 * Chat as a customer - the user plays the customer, live. They write the first
 * message the way a customer would in the chat widget, and every reply after
 * it; the skill answers each one with its trace. The most direct read of how
 * the skill will sound on chat.
 */
export default function ChatLive({ doc, live, onExit, onRunRecorded, onOpenCopilot }: ChatFlowProps) {
  const health = useConnectorHealth();
  const run = useChatRun({ doc, health, live, onRunRecorded });
  const inProgress = run.items.length > 0 && run.phase !== 'ended';

  return (
    <div className={flow.recent}>
      <EvalBackHeader
        title={TITLE}
        icon={CHAT_EVAL_ICONS.chatLive}
        onBack={() => {
          run.reset();
          onExit();
        }}
        action={
          inProgress ? (
            <button type="button" className={scenarioStyles.regen} onClick={run.end} disabled={run.busy}>
              <RiStopCircleLine aria-hidden />
              <span>End chat</span>
            </button>
          ) : undefined
        }
      />
      <ChatSession
        run={run}
        doc={doc}
        customerName="You, as the customer"
        mode="manual"
        live={noteLive(live)}
        onRedo={run.reset}
        onOpenCopilot={onOpenCopilot}
        emptyHint="Write the first message the way a customer would in your chat widget. The skill answers each message as it would on your chat inbox."
      />
    </div>
  );
}
