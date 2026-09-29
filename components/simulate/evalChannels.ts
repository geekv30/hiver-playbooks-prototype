import type { ChatEvalView, EvalChannel } from './EvalMenu';

/**
 * What the Evaluation tab offers.
 *
 * Both channels, email and chat, with the Email | Chat switch. On chat, only
 * Chat as a customer for now (2026-09-29). Past chats and chat AI scenarios
 * were paused, not removed: add them back to CHAT_WAYS and their cards return.
 * Every flow stays usable at /component/evaluation-library, and the written
 * reference is docs/EVALUATION_COMPONENTS.md.
 */
export const EVAL_CHANNELS: readonly EvalChannel[] = ['email', 'chat'];

/** The chat ways on offer, in menu order. All three: pastChats, chatScenarios, chatLive. */
export const CHAT_WAYS: readonly ChatEvalView[] = ['chatLive'];

/** Everything the evaluation code supports, for the library page. */
export const ALL_EVAL_CHANNELS: readonly EvalChannel[] = ['email', 'chat'];
export const ALL_CHAT_WAYS: readonly ChatEvalView[] = ['pastChats', 'chatScenarios', 'chatLive'];

export const channelOn = (c: EvalChannel, channels: readonly EvalChannel[] = EVAL_CHANNELS) => channels.includes(c);
