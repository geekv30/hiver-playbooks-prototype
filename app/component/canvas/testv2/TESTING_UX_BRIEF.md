# Playbooks - Testing UX (testv2)

Handoff note for whoever picks up the testing surface next.

Route: `/component/canvas/testv2` (the Next.js prototype, `prototype/app/component/canvas/testv2/`).

---

## The problem

A Playbook is automation that runs unattended on real customer email. Before a support manager flips it on, they have to trust it does the right thing across the messy variety of real inbound - the refund that is over policy, the group enquiry with dietary needs, the date that is sold out. "It looks right in the editor" is not that trust.

The testing UX we inherited did not earn it:

- **Inputs were hardcoded.** You picked one of four fixed mock tickets. You could not write your own edge-case email, and you could not run the playbook against a real past conversation.
- **Testing was throwaway.** A run was a transient thing inside the editor. Exit the mode and it was gone. No saved test cases, no history.
- **No verdict.** You eyeballed a trace in the rail. There was no pass / fail outcome, so "did this work?" was a judgement call every time.
- **No version awareness.** Nothing tied a result to the version of the playbook that produced it, so you could not answer "did my last edit change the behaviour?"
- **It was a mode bolted onto the editor**, not a place you would actually do QA.

Net: you could sanity-check one canned input, once. You could not build a regression suite, replay reality, or catch a change that broke a path that used to pass.

## The solution: a scenario-based test workspace

testv2 turns testing from a one-shot sanity check into a real QA surface. Five moves:

### 1. Scenarios are saved, first-class objects
A `Scenario` is a named, persisted test case (localStorage, keyed `hiver.playbooks.walkjapan.v1.testv2`). You build a library of them down the left of the test rail; each carries its input and its own run history. Seeded with three Walk Japan cases (default enquiry, group-with-dietary, sold-out date). A scenario row shows its last-run status at rest - passing / failing / cancelled / never run - as a status dot, no hover needed.

### 2. Two ways to supply input, both real-feeling
- **Custom** - compose a synthetic email (from, subject, body, labels). For edge cases you design deliberately.
- **From inbox** - pick a real past conversation from a fixture mailbox (10 Walk Japan threads) through a searchable, filterable picker (free-text search, date range, label chips). For testing against the messy shape of actual inbound.

Switching a scenario between the two modes warns before discarding the current input.

### 3. Run -> trace -> artifact
Running a scenario executes the playbook step by step. Chips animate on the canvas, a trace fills, and each step renders a chip-specific **artifact** in its own pane: a draft reply reads like a compose preview, an HTTP call as flush request / response lines, a note as an inline note, a tag as pills. Prose-first, no card chrome. The run ends with a clear **pass / fail / cancelled** outcome, not a trace you have to interpret.

### 4. Run history + version awareness
Every run is saved against its scenario with the **versionHash** of the playbook it ran against, the **branch path** it took, the outcome, and timing. Capped at 50 runs per scenario. This is what lets you answer "which version produced this, and did my edit change it?"

### 5. Compare two runs
Pick two runs of the same scenario and **diff** them. This is the core regression question - did this edit change behaviour? - made answerable in one gesture.

Plus a **Batch tab** (UI shipped, runner stubbed in v1): select saved scenarios or filter the fixture mailbox, then run many at once. The progressive results table, branch coverage, and drill-down trace land in v2.1.

## How it is structured

Test is a set of canvas **modes**, not a modal: `test-idle`, `test-running`, `test-done`, `test-diff`. The canvas itself becomes the live trace surface; the right rail carries the Scenarios / Batch tabs; the footer carries the run controls (Run / Stop / Replay / Compare).

| File | Role |
|---|---|
| `TestPanel.tsx` | The test rail - scenario list, input editor (custom + past), batch tab, run footer |
| `PastConversationPicker.tsx` | The "pick a real thread" modal (search / date / label filters) |
| `ArtifactPane.tsx` | Per-step, chip-specific output rendering |
| `test-fixtures.ts` | Types (Scenario / Run / FixtureThread), the 10-thread fixture mailbox, 3 seed scenarios, the versionHash util |
| `state.ts` | The run machinery (runTest / stopTest / replayTest / enterDiff), modes, persistence |
| `page.tsx` | Canvas + test composition |

## What is mocked or deferred (read before trusting a result)

- **Runs are simulated.** Outputs are plausible fakes generated from each action's declared output types. No real execution, no API calls.
- **Wait steps are skipped** in test ("skipped in test").
- **The Batch runner is a stub** - it alerts instead of running. v2.1.
- **The inbox is a fixture** - 10 Walk Japan threads, not a live mailbox.
- **Persistence is localStorage only.** No backend.

All intentional - this is a design prototype proving the testing model, not a working integration.

## Run it

```
cd prototype
npm run dev
# open http://localhost:3000/component/canvas/testv2
```
