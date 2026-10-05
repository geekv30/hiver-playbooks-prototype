# Evaluation components

The written reference for the Evaluation tab: every piece, what it does, the states it has, the rules it follows, and how to bring a paused way back. Live companion: **`/component/evaluation-library`**, which runs every flow of both channels in the real panel next to an index of these pieces (`app/component/evaluation-library/registry.ts`).

Last updated 2026-09-29.

## Status: both channels; on chat, only Chat as a customer

A skill is written once and runs on email and on chat. The Evaluation tab offers **both channels** with the **Email | Chat** switch. Email offers all four ways. Chat offers only **Chat as a customer** for now: **Past chats** and chat **AI scenarios** are paused, not removed. Their components, fixtures and engine are still in the repo and still work (try them at `/component/evaluation-library`).

**The switch:** `CHAT_WAYS` in `components/simulate/evalChannels.ts`, today `['chatLive']`. To bring all three back:

```ts
export const CHAT_WAYS: readonly ChatEvalView[] = ['pastChats', 'chatScenarios', 'chatLive'];
```

`CHAT_WAYS` filters the chat cards in `EvalMenu.tsx` (passed through `SimulatePanel` as `chatWays`). With no chat ways at all, the menu drops the Chat tab rather than show an empty list.

## How the tab is put together

```
SidePanel (Copilot | Evaluation tabs, always pinned)
  SimulatePanel            router: menu <-> one flow, with the drill slide
    EvalMenu               "Evaluate your skill in one of these ways" + EvalCard per way
    chat ways              PastChats | ChatScenarios | ChatLive  ->  ChatSession
    email ways             MatchingEmails | RecentEmails | AiScenarios | CustomEval
```

- Each flow draws its own `EvalBackHeader` (back, icon, title, one action) under the pinned tabs.
- Every completed run reports up through `onRunRecorded`, into `useEvalState`, which Enable's readiness review reads (`components/flow01/enable/readiness.ts`). `docSignature` marks results "evaluated an earlier version" after a meaningful edit.
- Entry copy and icons live in `EvalMenu.tsx`: `EVAL_ENTRIES` / `EVAL_ICONS` (email), `CHAT_EVAL_ENTRIES` / `CHAT_EVAL_ICONS` (chat). Names double as back-header titles.

| Way | Channel | Card subtitle |
|---|---|---|
| Past chats (paused) | chat | Real chats from your chat inbox |
| AI scenarios (paused) | chat | AI plays the customer, start to finish |
| Chat as a customer | chat | You play the customer, live |
| Matching emails | email | Real emails your trigger would fire on |
| Recent conversations | email | Recent emails from your shared inbox |
| AI scenarios | email | Tailor-made AI test scenarios |
| Custom email | email | Write your own test email |

## Chat evaluation (Chat as a customer live in the app; the other two paused)

### The playground rules (locked with Geeky, 2026-09-28)

1. **It is a simulation.** No approvals, no Send / Decline; every reply reaches the customer. A gated action runs, and its step says "needs approval when live".
2. **Model slips are the engine's problem.** `checkTurn` drops steps that do not name real parts of the skill (logged server side); the author never sees "trace did not match".
3. **Greet before judging the trigger.** "hello" gets "What can I help you with?"; the trigger is judged once the customer states a need. Off-trigger: a divider "The skill did not run." plus the reason, and the chat stays open. Off-trigger is **neutral**, never flagged.
4. **Every connector counts as connected.** Connector health is its own flow.
5. **No noisy cards.** Start over / Run again live in the header.
6. **Layout** (Geeky's mix of the three variants in `/component/chat-playground`, 2026-09-29):
   - customer: ink bubbles on the right, name over the first message
   - AI agent: plain text on the page, no bubble, no avatar
   - under each reply: **AI agent · N steps**; "N steps" opens that turn's trace **in place** (never a view switch)
   - **Skill started · <skill>** and **Chat ended**: centered labeled hairline dividers
   - once the chat ends: the result **pinned at the top** (dot + Passed / Needs attention / Errored, the review's reason clamped to 2 lines with Show more, then the rating)
   - markdown stripped from every model string

### Components

| Component | File | What it does, and its states |
|---|---|---|
| PastChats (paused) | `components/simulate/chat/PastChats.tsx` | Pick a chat inbox, search, pick one real chat, Evaluate. The skill answers the chat's first message, then you carry on as the customer (composer on). The transcript icon opens `ChatTranscriptModal`. States: no inbox picked, list, empty search, running, ended. |
| ChatScenarios (paused) | `components/simulate/chat/ChatScenarios.tsx` | Live: the model writes scenarios for this skill (two it is built for, one missing a detail, one edge case), cached per skill version. Scripted or failed write: the standard set (`CHAT_SCENARIOS`), with a note when the write failed. Regenerate in the header. No trigger: `SimEmptyState` with ghost cards. Pick one, Evaluate: the AI customer and the skill talk to the end; Run again in the header. |
| ChatLive | `components/simulate/chat/ChatLive.tsx` | Chat as a customer: empty hint, then you write every message. Header: End chat while open, Start over once ended. |
| ChatSession | `components/simulate/chat/ChatSession.tsx` | The thread shared by all three ways. Pieces: `Divider`, `Notice` (a turn that went wrong, with Fix with Copilot / Retry / Use scripted replies), `AgentTurn`, `Verdict` (the pinned result; "Reviewing the conversation..." while judged), the customer typing dots, the agent's "Working on a reply..." shimmer, Stop evaluation for AI scenarios. The thread fades under the pinned result. |
| LiveTrace | `components/simulate/chat/LiveTrace.tsx` | The "AI agent · N steps" line and the inline trace (`TraceStep` in its `quiet` form). `toDef` turns a checked step into the shared trace step. |
| ChatComposer, AttachmentList | `components/simulate/chat/ChatComposer.tsx` | Rounded field that grows to 4 lines; paperclip, drop or paste; up to 5 files of 10 MB; chips (thumbnail or file glyph, name, size, remove) before sending; errors for over-limit files. Sent: image thumbnails (open in a new tab) and file tiles, right-aligned above the bubble. A message can be files only. UI only: the agent is told the file names (`transcriptOf`), not the contents. Also drives the AI note ("Live AI, please verify results · Turn off"). |
| ChatTranscriptModal | `components/simulate/chat/ChatTranscriptModal.tsx` | The real chat behind a past chat (customer and teammate), on `ConversationModal`'s chrome. |
| useChatRun | `components/simulate/chat/useChatRun.ts` | One chat, turn by turn. Phases: idle, agent, customer, judging, ended. Engine picked per chat (live if the model is on for this browser, else scripted) and never switched halfway, except by "Use scripted replies". An error **pauses** an AI scenario on its notice; Retry resumes it (asks the AI customer again if its turn failed); Stop ends it. End-of-chat review (`judge`) is aborted with its chat. Cap: 8 customer messages ("stopped there" note). Off-trigger and greeting / sign-off turns carry no outcome. |
| chatFlow | `components/simulate/chat/chatFlow.ts` | `ChatFlowProps` (what every chat way is given), `noteLive`, and `chatResultLine`, the one result sentence every layout shows. |

### Engine and API

| Piece | File | Notes |
|---|---|---|
| Wire format + checker | `lib/eval/wire.ts` | Stages greet / run / noMatch / close. `checkTurn(doc, turn, skillStarted)` keeps real steps, drops slips, derives the outcome (passed / attention / errored) from the trace. `SKILL_TURN_SCHEMA`, `CUSTOMER_TURN_SCHEMA`, `JUDGE_SCHEMA`, `SCENARIOS_SCHEMA`. |
| Scripted engine | `lib/eval/scripted.ts` | Walks the skill as written; greeting and sign-off detection (the whole message must be the sign-off). Labeled "Scripted demo" everywhere. |
| Prompts | `lib/eval/server.ts` | Skill turn, AI customer, scenario writer, end-of-chat review. Never put a test case in a prompt. |
| Route | `app/api/evaluate/route.ts` | `POST` kinds `skill`, `customer`, `scenarios`, `judge`. Same key, passcode and gate as Copilot. Every upstream call capped at 25s (Vercel kills at 60s); budget 300 calls per 10 min; 402 means out of credits, which the UI turns into "Use scripted replies". |
| Fixtures | `data/chatFixtures.ts` | `CHAT_INBOXES`, `PAST_CHATS`, `pastChatsForInbox`, `CHAT_SCENARIOS` (the standard set). |

The review (`judge`) decides the result line: resolved / handed off promptly / unresolved. A rating of 2 or less is never a pass. A full AI scenario spends about 18 model calls.

## Email evaluation (live in the app)

| Component | File | What it does, and its states |
|---|---|---|
| MatchingEmails | `components/simulate/MatchingEmails.tsx` | Real inbound mail from ONE of the skill's mailboxes that matches the trigger. 50 per batch; no matches means the next 50, up to 200; stops at the first batch with matches; "Scan the next 50" is always offered after a scan. Mailbox switcher when the skill has several (each switch is a fresh scan). "How it works?" in every state. No trigger: ghost rows. |
| useTriggerScan | `components/simulate/useTriggerScan.ts` | The scan engine. Lives on the canvas because Copilot's matching row and the menu card's fresh fill read it. `cleared` stops the open-on-load scan from restarting after the user clears it. |
| matchPool | `data/matchPool.ts` | The matcher as config: a topic lexicon, specific topics decide, word-overlap fallback; a deterministic 200-email pool per mailbox. `matchReason` returns why an email matched. |
| MatchReasonButton | `components/simulate/MatchReasonButton.tsx` | Info icon on a matched card; click opens the reason in the dark tooltip style, portalled into `.app-scale`. |
| MatchingHowTooltip, matchingIntro | `components/simulate/MatchingHowTooltip.tsx`, `matchingIntro.ts` | "How it works?" as a tooltip; whether it has been read (module store, SSR-safe). |
| RecentEmails | `components/simulate/RecentEmails.tsx` | Pick a shared mailbox, search, pick one recent conversation, Evaluate; the hover redirect opens `ConversationModal`. |
| ConversationModal | `components/simulate/ConversationModal.tsx` | The full email: sender, received time, subject, body; portalled `ModalShell`. |
| AiScenarios, ScenariosEmpty | `components/simulate/AiScenarios.tsx`, `ScenariosEmpty.tsx` | A flat list of scenario emails with Regenerate; the pick opens in an editable email. Empty: ghost rows plus "add a trigger". |
| ComposeEval, CustomEval | `components/simulate/ComposeEval.tsx`, `CustomEval.tsx` | Edit an email (a scenario's, or your own for Custom email), Start Evaluation, then the streamed trace and outcome. |
| EmailCard | `components/simulate/EmailCard.tsx` | An evaluated email: head, outcome, trace. |
| RunOutcome, StatusPill | `components/simulate/RunOutcome.tsx`, `StatusPill.tsx` | Outcomes: passed, attention, errored, approval, declined. Actions: Redo, Fix with Copilot, Retry, Approve / Decline. |
| RunTrace, traceFixture, useSimRun | `components/simulate/RunTrace.tsx`, `traceFixture.tsx`, `useSimRun.ts` | The email trace. **Still the scripted illustrative run** (`SIM_TRACE`), not live: live email traces are the next phase for email. |
| Fixtures | `data/simFixtures.ts` | `RECENT_EMAILS`, `SIM_TOPICS` / `SIM_SCENARIOS`, `SIM_COPY` (`SIM_DRAFT`, the fallback reply, is in `traceFixture.tsx`). |

Copilot pieces that belong to email: `CopilotScanNote` (the matching row and in-thread note) and the scan that follows `CopilotMailboxAsk`, in `components/flow01/copilot/`.

## Shared by both channels

| Component | File | Notes |
|---|---|---|
| TraceStep | `components/simulate/TraceStep.tsx` | One step: reasoning, action (output), condition (matched branch), reply. `quiet` = the chat's log form (muted one-line results, no boxes, no reply body). |
| PickableEmailCard | `components/simulate/PickableEmailCard.tsx` | A selectable row with a real radio; the chat ways reuse it for past chats and scenarios. |
| SimEmptyState | `components/simulate/SimEmptyState.tsx` | The informative empty state (dimmed real cards, then icon, headline, one action). Never a blank panel. |
| SimStatus | `components/simulate/SimStatus.tsx` | Dot and label for every run status. |
| EvalBackHeader, EvalMenu / EvalCard | `components/simulate/EvalBackHeader.tsx`, `EvalMenu.tsx` | Flow header; entry cards (one renderer for every way on every channel). |
| useEvalState, docSignature | `components/simulate/useEvalState.ts`, `docSignature.ts` | The run aggregate Enable reads; staleness. |

## Design exhibits

- `/component/eval-channels` (`app/component/eval-channels/`): three ways to offer both channels. 01 channel switch shipped; 03 channel first is kept for when a third channel (voice) lands.
- `/component/chat-playground` (`app/component/chat-playground/`): the three playground layouts (Transcript, Widget + steps, Verdict first) the shipped mix came from, on one recorded live chat.
- `/component/evaluation-library` (`app/component/evaluation-library/`): the live library.

## Testing notes

- Test on a production build, then again on the deployed preview (a Vercel function has a 60s limit that local does not).
- Live runs cost OpenAI credits. The Playwright profile may hold the passcode, so localhost and the preview can run live by default: click "Turn off" first, or mock the model with `page.route('**/api/evaluate', ...)` and run `COPILOT_PASSCODE=test-pass next start` (without a passcode a production build reports live AI as unavailable). Mocks make error paths testable for free.
- Scope test locators to `aside[aria-label="Evaluation"]` (the Copilot pane stays mounted).
- The app renders inside `.app-scale` (0.9 CSS zoom): measure with `offsetHeight`, not `getBoundingClientRect`.

## Open questions

- Should a skill that hands the chat off (`CheckedTurn.ended`) end the chat? Today it keeps running; ending there would cut the example skill's scripted chats after one reply.
- Live traces for email (the email trace is still the fixture), streamed replies, insights (M2), Enable on chat inboxes.
