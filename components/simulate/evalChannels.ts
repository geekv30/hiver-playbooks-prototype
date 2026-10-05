import type { ChatEvalView } from './EvalMenu';

/**
 * The chat ways the Evaluation tab offers, in menu order.
 *
 * Both channels stay, with the Email | Chat switch, and email offers all four
 * ways. On chat, only Chat as a customer for now (2026-09-29). Past chats and
 * chat AI scenarios are paused, not removed: add 'pastChats' and
 * 'chatScenarios' back here and their cards return. Every way stays usable at
 * /component/evaluation-library; the written reference is
 * docs/EVALUATION_COMPONENTS.md.
 */
export const CHAT_WAYS: readonly ChatEvalView[] = ['chatLive'];
