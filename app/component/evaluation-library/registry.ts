/* Every piece of the Evaluation tab, grouped by what it is for. The index the
 * library page lists; the full write-up (states, rules, how the pieces fit) is
 * docs/EVALUATION_COMPONENTS.md. `channel` says where a piece is used: email
 * pieces are paused in the app while evalChannels.EVAL_CHANNELS is chat only. */

export type LibChannel = 'email' | 'chat' | 'both';

export interface LibEntry {
  name: string;
  file: string;
  what: string;
  channel: LibChannel;
}

export interface LibGroup {
  title: string;
  entries: LibEntry[];
}

export const LIBRARY: LibGroup[] = [
  {
    title: 'Shell and menu',
    entries: [
      { name: 'SimulatePanel', file: 'components/simulate/SimulatePanel.tsx', what: 'The Evaluation tab: routes the menu to each flow and back, with the drill slide.', channel: 'both' },
      { name: 'EvalMenu + EvalCard', file: 'components/simulate/EvalMenu.tsx', what: 'The "Evaluate your skill in one of these ways" cards, and the Email | Chat switch when more than one channel is on.', channel: 'both' },
      { name: 'evalChannels', file: 'components/simulate/evalChannels.ts', what: 'Which channels the tab offers. Chat only today; add email to bring every email way back.', channel: 'both' },
      { name: 'EvalBackHeader', file: 'components/simulate/EvalBackHeader.tsx', what: 'A flow’s header: back, the flow’s icon and title, one action on the right.', channel: 'both' },
      { name: 'SimEmptyState', file: 'components/simulate/SimEmptyState.tsx', what: 'The informative empty state: dimmed real cards, then icon, headline, one action.', channel: 'both' },
    ],
  },
  {
    title: 'Chat ways',
    entries: [
      { name: 'PastChats', file: 'components/simulate/chat/PastChats.tsx', what: 'Pick a chat inbox and one real chat; the skill answers its first message, then you carry on.', channel: 'chat' },
      { name: 'ChatScenarios', file: 'components/simulate/chat/ChatScenarios.tsx', what: 'Scenarios written for this skill; the AI customer and the skill talk to the end.', channel: 'chat' },
      { name: 'ChatLive', file: 'components/simulate/chat/ChatLive.tsx', what: 'Chat as a customer: you write every customer message.', channel: 'chat' },
      { name: 'ChatSession', file: 'components/simulate/chat/ChatSession.tsx', what: 'The playground thread: ink customer bubbles, agent on the page, dividers, the pinned result.', channel: 'chat' },
      { name: 'LiveTrace', file: 'components/simulate/chat/LiveTrace.tsx', what: '"AI agent · N steps" under a reply; opens that turn’s steps in place.', channel: 'chat' },
      { name: 'ChatComposer + AttachmentList', file: 'components/simulate/chat/ChatComposer.tsx', what: 'The rounded field with paperclip, drop and paste; file chips; sent thumbnails and tiles.', channel: 'chat' },
      { name: 'ChatTranscriptModal', file: 'components/simulate/chat/ChatTranscriptModal.tsx', what: 'The real chat behind a past chat, as it happened.', channel: 'chat' },
      { name: 'useChatRun', file: 'components/simulate/chat/useChatRun.ts', what: 'One chat turn by turn: live or scripted engine, pause on error, retry, the end-of-chat review.', channel: 'chat' },
      { name: 'chatFlow', file: 'components/simulate/chat/chatFlow.ts', what: 'What every chat flow is given, and the one result line every layout shows.', channel: 'chat' },
    ],
  },
  {
    title: 'Email ways (paused in the app)',
    entries: [
      { name: 'MatchingEmails', file: 'components/simulate/MatchingEmails.tsx', what: 'Real mail from one mailbox that matches the trigger: 50 a batch, up to 200, Scan more.', channel: 'email' },
      { name: 'useTriggerScan', file: 'components/simulate/useTriggerScan.ts', what: 'The scan behind Matching emails; Copilot’s matching row reads it too.', channel: 'email' },
      { name: 'MatchReasonButton', file: 'components/simulate/MatchReasonButton.tsx', what: 'Why an email matched, on click, in the flow’s tooltip language.', channel: 'email' },
      { name: 'MatchingHowTooltip + matchingIntro', file: 'components/simulate/MatchingHowTooltip.tsx', what: '"How it works?" as a tooltip, and whether it has been read.', channel: 'email' },
      { name: 'RecentEmails', file: 'components/simulate/RecentEmails.tsx', what: 'Recent conversations: pick a mailbox, search, pick one, Evaluate.', channel: 'email' },
      { name: 'ConversationModal', file: 'components/simulate/ConversationModal.tsx', what: 'The full email behind a recent conversation.', channel: 'email' },
      { name: 'AiScenarios + ScenariosEmpty', file: 'components/simulate/AiScenarios.tsx', what: 'Scenario emails to pick from; the pick opens in an editable email.', channel: 'email' },
      { name: 'ComposeEval + CustomEval', file: 'components/simulate/ComposeEval.tsx', what: 'Edit an email (or write your own), then evaluate it.', channel: 'email' },
      { name: 'PickableEmailCard', file: 'components/simulate/PickableEmailCard.tsx', what: 'One selectable conversation row (a real radio). Past chats and chat scenarios reuse it.', channel: 'both' },
      { name: 'EmailCard', file: 'components/simulate/EmailCard.tsx', what: 'An evaluated email: its head, the outcome, the trace.', channel: 'email' },
      { name: 'RunOutcome + StatusPill', file: 'components/simulate/RunOutcome.tsx', what: 'The result pill and next step (Redo, Fix with Copilot, Retry, Approve / Decline).', channel: 'email' },
      { name: 'RunTrace + traceFixture + useSimRun', file: 'components/simulate/RunTrace.tsx', what: 'The email trace: still the scripted run, step by step.', channel: 'email' },
    ],
  },
  {
    title: 'Shared by both',
    entries: [
      { name: 'TraceStep', file: 'components/simulate/TraceStep.tsx', what: 'One trace step (reasoning, action, condition, reply); `quiet` is the chat’s log form.', channel: 'both' },
      { name: 'SimStatus', file: 'components/simulate/SimStatus.tsx', what: 'A coloured dot and label for every run status.', channel: 'both' },
      { name: 'useEvalState + docSignature', file: 'components/simulate/useEvalState.ts', what: 'The runs Enable reads, and when a result belongs to an earlier version of the skill.', channel: 'both' },
    ],
  },
  {
    title: 'Engine and API (chat)',
    entries: [
      { name: 'wire', file: 'lib/eval/wire.ts', what: 'The chat evaluation’s format and checkTurn: keeps real steps, drops model slips, sets the outcome.', channel: 'chat' },
      { name: 'scripted', file: 'lib/eval/scripted.ts', what: 'Scripted replies when live AI is off, labelled everywhere.', channel: 'chat' },
      { name: 'server prompts', file: 'lib/eval/server.ts', what: 'The skill, customer, scenarios and review prompts.', channel: 'chat' },
      { name: '/api/evaluate', file: 'app/api/evaluate/route.ts', what: 'The live model behind the passcode: kinds skill, customer, scenarios, judge.', channel: 'chat' },
    ],
  },
];
