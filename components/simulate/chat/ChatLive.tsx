'use client';

import { RiRestartLine, RiStopCircleLine } from 'react-icons/ri';
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
  const run = useChatRun({ doc, live, onRunRecorded });
  const started = run.items.length > 0;

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
          !started ? undefined : run.phase === 'ended' ? (
            <button type="button" className={scenarioStyles.regen} onClick={run.reset}>
              <RiRestartLine aria-hidden />
              <span>Start over</span>
            </button>
          ) : (
            <button type="button" className={scenarioStyles.regen} onClick={run.end} disabled={run.busy}>
              <RiStopCircleLine aria-hidden />
              <span>End chat</span>
            </button>
          )
        }
      />
      <ChatSession
        run={run}
        doc={doc}
        customerName="You, as the customer"
        mode="manual"
        live={noteLive(live)}
        onOpenCopilot={onOpenCopilot}
        emptyHint="Write the first message the way a customer would in your chat widget. The AI agent answers as it would on your chat inbox, and the skill starts once the customer says what they need."
      />
    </div>
  );
}
