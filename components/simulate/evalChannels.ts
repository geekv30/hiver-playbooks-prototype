import type { EvalChannel } from './EvalMenu';

/**
 * The channels the Evaluation tab offers, in menu order.
 *
 * Chat only for now (2026-09-29): chat is the focus, so the menu shows the chat
 * ways and no Email | Chat switch. Nothing on the email side was removed - add
 * 'email' back here and the switch, the four email ways, Copilot's matching
 * row and the background mailbox scan all return. Every flow of both channels
 * stays usable at /component/evaluation-library, and the written reference is
 * docs/EVALUATION_COMPONENTS.md.
 */
export const EVAL_CHANNELS: readonly EvalChannel[] = ['chat'];

/** Every channel the evaluation code supports, for the library page. */
export const ALL_EVAL_CHANNELS: readonly EvalChannel[] = ['email', 'chat'];

export const channelOn = (c: EvalChannel, channels: readonly EvalChannel[] = EVAL_CHANNELS) => channels.includes(c);
