# Pre-enable evaluation nudge + honest evaluation loop

Design spec - 2026-07-02. Requirement #3 of the approval-tags session, scoped per
`05-benchmark/WORKFLOW_BENCHMARK.md` Part D (P1-4 "Tests that test THIS doc").

## Problem

The evaluation panel produces confidence without information: every run replays one
canned 6-step API-error trace (`traceFixture.tsx` `SIM_TRACE`) regardless of what the
document says, "Passed" is undefined, there is no summary rollup, and nothing connects
evaluation to Enable. An admin can take an untested AOP live without ever being told
that testing exists.

## Goal

1. Traces walk the real document, so a run is evidence about THIS AOP.
2. A plain-language n-of-m rollup summarizes the runs (Fin has per-sim verdicts but no
   rollup - this is differentiation).
3. Recent conversations becomes a true backtest: the doc runs against a real past
   thread and the result is compared with what the team actually did (Pylon's pattern,
   email-native).
4. Enable is evaluation-aware: a skippable nudge before the EnableModal when the AOP
   was never evaluated, a caution variant when evaluations failed, a quiet status row
   when everything passed.

## Decisions locked with Varun (2026-07-02)

- Scope = honest loop + backtest. Post-live Runs surface stays OUT (Agent View brief).
- Nudge shows ONLY when the AOP has never been evaluated (plus a caution variant on
  failures). Once evaluated, Enable never re-nags.
- Enable flow is status-aware: eval aggregate state lifts up to the canvas.
- Derived traces are branch-aware: the trace enters the taken condition arm and walks
  its action lines; untaken arms are absent.
- Stale handling = note only: structural doc edits after a run mark the rollup
  "evaluated an earlier version"; no re-nudge; re-running clears it.

## Out of scope (explicit)

- Post-live Runs surface, failure inbox, run-to-step links (PRD Section 9 / Agent View).
- Author-set success criteria (Fin's four assertion types) - the ceiling to grow
  toward, not this pass.
- The full P0 readiness engine (red blocks / amber warns strip in EnableModal).
- Create-from-history (P0-1).
- Real model calls: outcomes remain scripted per fixture email. The honesty fix is
  that scripted outcomes land on real steps of the real doc.

## Design

### 1. `deriveTrace(doc, email)` - components/simulate/deriveTrace.ts (new)

Pure function: `(doc: EditorDoc, email: SimEmail) -> TraceStep[]` in the existing
`TraceStep` shape, so the shipped `RunTrace` renderer is reused untouched (one
renderer per pattern).

Walk order:
- Trigger: one step - "Matched trigger" with the trigger's text as detail.
- Each plain step, in order:
  - Chip fragments -> one action step per chip: icon from the action library, label =
    the chip's verb + its real configured value (a `Tag · api-error, support` chip
    produces exactly that step). A chip with `requiresApproval` renders a
    "pauses for a teammate's approval" marker on its step (purple state family) -
    evaluation is where the req #1 gate becomes visible.
  - Text-only steps -> one reasoning step carrying the instruction text.
- Condition steps (branch-aware): one step "Checked: <if-expression>" naming the arm
  taken, then the taken arm's body lines walked as above. The arm taken is scripted:
  the email fixture may carry `branchTaken` (index or arm id); default = first arm.
- Outcome mapping: fixture emails keep scripted `outcome` (passed / failed /
  attention), but `failAt` becomes semantic - fail at the first connector step if one
  exists, else at the LAST action step (there is always at least one on a runnable
  doc) - resolved by `deriveTrace` against THIS doc so the failure always names a
  real step.
- Draft reply: the `SIM_DRAFT` reply card shows only when the doc actually contains a
  draft-reply action.
- Empty doc edge: no trigger or no steps -> existing empty states (`ScenariosEmpty`)
  already gate entry; `deriveTrace` still returns a defensive minimal trace (trigger
  step only) if reached.

`SIM_TRACE` in `traceFixture.tsx` is deleted once all three flows consume the deriver.

### 2. Eval aggregate lifted to the canvas

New hook `useEvalState` (module under components/simulate/), owned by `EditorCanvas`:

- Shape: `{ total, passed, failed, attention, staleSig: string | null }` plus
  `recordRun(results)` and a doc structure signature captured at run time.
- `SimulatePanel` gains `onRunRecorded` (called when a run set completes with the
  per-email statuses) and consumes the doc via a new `doc` prop (it needs the real
  document for `deriveTrace` anyway). Topic-level `results` / thumbs `verdicts`
  stay local to the panel - nothing above consumes them.
- Staleness: `EditorCanvas` compares the doc's current content signature with the one
  captured at the last run; a mismatch sets a `stale` flag on the aggregate. The
  signature serializes doc content (step order, text, chip actionId + config,
  branches) while ignoring volatile ids - so ANY meaningful edit marks results stale,
  and re-running clears it.

Summary strip (new small component, eval panel): once `total > 0`, a one-line rollup
above the entry cards - "4 evaluations · 3 passed · 1 failed", with "Evaluated an
earlier version of this AOP" appended when stale. Plain text + status dots, no card
chrome (design restraint).

### 3. Pre-enable nudge - components/flow01/enable/EvalNudgeModal.tsx (new)

`openEnable('commit')` in `EditorCanvas` branches on the aggregate:

- `total === 0` -> nudge, untested variant:
  - Copy: heading "Test it before it goes live"; body "Run this AOP on a few real
    emails first and see exactly what it would do. Evaluations never email anyone."
  - Primary "Evaluate first" -> close, `setPanelTab('sim')` (both routes are docked
    companions; the floating branch is dormant).
  - Ghost "Enable anyway" -> continue to `EnableModal` as today.
  - Esc / x -> close, nothing happens. The nudge is skippable, never blocking.
- `failed > 0` -> caution variant: "1 of 4 evaluations failed" + body naming the count;
  primary "Review results" -> opens the sim tab; ghost "Enable anyway".
- else -> no nudge; `EnableModal` opens directly and gains one quiet status row under
  the name field: check dot + "3 of 3 evaluations passed" (with the stale note when
  applicable). Row absent when `total === 0` and the user chose Enable anyway.

Chrome: same overlay/card family as `EnableModal`, calm fade (no morphs), reduced-
motion aware. `manage` mode (settings gear) never nudges.

### 4. Backtest - Recent conversations flow

- Fixtures: each recent-email fixture in `data/simFixtures.ts` gains
  `teamDid: { tags?: string[], replied?: string, assignedTo?: string,
  escalatedTo?: string }` - what the team actually did on that thread.
- After a run, the email's result card adds a compare block:
  - Two columns: "AOP would have" (key actions distilled from the derived trace:
    tags, reply, assignment - rendered with the Chip atom in plain mode) vs
    "Your team did" (from `teamDid`).
  - Row-per-aspect match markers: match / differs (existing status pill language).
  - One plain-language verdict line: "Matches what your team did" or "Differs - your
    team also escalated to Billing."
- On differs: text action "Adjust the AOP for this case" pre-fills the Copilot
  composer ("On emails like '<subject>', the AOP missed <difference>. Suggest a
  change.") and switches to the Copilot tab. Pre-fill only - the user sends.
- AI scenarios and Custom email flows keep their current result presentation (trace +
  outcome), now derived.

### 5. Reuse contracts

- `RunTrace` / `TraceStep` / `StatusPill` / `RunOutcome` render derived data
  unchanged; any new visual state (approval marker, compare rows) extends them, never
  forks them.
- Chip atom renders action references in the compare block (plain mode, no new chip
  renderer).
- Modal chrome shared with EnableModal's overlay pattern.
- No case-specific content in components: all copy templates generic, all
  case content from fixtures/doc (wipe-canvas rule).

## Verification plan

Playwright-core screenshot loop against localhost (the established gate): drive
/api-example - author a doc with a tag chip + approval gate + a condition, run all
three eval flows, verify the trace mirrors the doc (including the approval pause step
and branch entry), fail an email and check the rollup + caution nudge, clear evals
(fresh /canvas doc) and check the untested nudge, pass everything and check the
EnableModal status row, edit the doc and check the stale note. Copy pass per the gate
(American spelling, proper names, no dashes/section glyphs). tsc + lint clean. PNGs
deleted after use.

## Build order (for the implementation plan)

1. `deriveTrace` + swap into `useSimRun` (all three flows honest).
2. Eval aggregate lift + summary strip.
3. Nudge modal + EnableModal status row + wiring.
4. Backtest fixtures + compare block + Copilot pre-fill.
Each lands as its own reviewable commit on a feature branch, PR after adversarial
self-review, merge only on Varun's go-ahead.
