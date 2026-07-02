# Pre-enable Evaluation Nudge + Honest Evaluation Loop - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evaluation runs walk the real document (branch-aware, per-email), roll up into an n-of-m aggregate that makes Enable evaluation-aware (skippable nudge / caution / status row), and Recent conversations becomes a backtest comparing the AOP against what the team actually did.

**Architecture:** A pure `deriveTrace(doc, email)` replaces the hardcoded `SIM_TRACE` fixture inside the shared `useSimRun` engine (each email carries its own derived trace). A `useEvalState` hook in `EditorCanvas` accumulates run results (with a content-signature staleness check) and feeds a summary strip, a new `EvalNudgeModal`, and a status row in `EnableModal`. Backtest = `teamDid` fixture data + a pure compare + a compare block on the result card.

**Tech Stack:** Next.js 16 (see AGENTS.md - read `node_modules/next/dist/docs/` before writing Next-specific code), React 19, TypeScript 5, CSS modules, motion (motion.dev), react-icons/ri, vitest (added by Task 1) for the pure modules.

**Spec:** `docs/superpowers/specs/2026-07-02-eval-nudge-loop-design.md` - read it first.

## Global Constraints

- Working repo: `/Users/varunkelkar/Desktop/ai/ai-playbooks/prototype` (repo `geekv30/hiver-playbooks-prototype`). All paths below are relative to it.
- Branch: all work on `feat/eval-loop` (Task 1 creates it). NEVER merge to main without Varun's explicit go-ahead.
- Scripted outcomes only - NO real model/API calls. The honesty fix is scripted outcomes landing on real steps of the real doc.
- Reusability rule: NO case-specific content in components. Copy templates generic; all case content flows from fixtures or the doc. Any doc (wipe-canvas test) must produce a correct trace.
- One renderer per pattern: extend `RunTrace`/`TraceStep`/`RunOutcome`/`StatusPill`/`Chip`, never fork them.
- Icons: `react-icons/ri` only. No emoji anywhere (UI or code).
- Motion: transform+opacity springs, reduced-motion aware (follow the existing patterns in `TraceStep.tsx` / `EnableModal.tsx`).
- UI copy: American spelling, no en/em dashes (use `-`), no `§`, proper product names.
- Chip CSS is UNSCOPED (see `components/atoms/Chip.module.css` header) - never qualify `.chip` by parent.
- CSS gotcha: the `border:` shorthand with a `var()` color mis-compiles under Turbopack - author border longhands explicitly.
- Do not use localStorage inside useState initializers (SSR).
- Gates before every commit: `npx tsc --noEmit` clean, `npx eslint <changed files>` no NEW errors (EditorCanvas has 9 pre-existing errors at lines ~218-390 - do not add more), `npm test` green.
- UI tasks additionally require the playwright-core screenshot loop (see "Verification loop recipe" at the bottom) - drive the real flow, Read the PNG, then DELETE all PNGs.
- Dev-server gotcha: background `npm run dev` started by the agent gets reaped between turns. Ask Varun to run `cd prototype && npm run dev` himself, or re-start it within the same turn as the screenshots.

---

### Task 1: Branch + vitest setup

**Files:**
- Modify: `package.json` (add vitest + test script)
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: branch `feat/eval-loop`; `npm test` runs vitest on `**/*.test.ts`; `@/` alias resolves in tests.

- [ ] **Step 1: Commit the pending approval-tags work on its own branch**

The working tree has uncommitted req #1/#2 work that req #3 builds on (`requiresApproval` on `Chip`). Commit it on `feat/approval-tags` (commit only - do NOT push, do NOT merge):

```bash
cd /Users/varunkelkar/Desktop/ai/ai-playbooks/prototype
git status   # confirm current branch is feat/approval-tags and the changes match the approval-tags scope
git add -A
git commit -m "feat: per-action approval gate + hover remove on action chips"
```

- [ ] **Step 2: Create the feature branch**

```bash
git checkout -b feat/eval-loop
```

- [ ] **Step 3: Add vitest**

```bash
npm install -D vitest
```

Add to `package.json` scripts (keep the existing scripts untouched):

```json
"test": "vitest run"
```

Create `vitest.config.ts` at the repo root:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname) } },
  test: { include: ['**/*.test.ts'], environment: 'node' },
});
```

- [ ] **Step 4: Verify the runner works**

```bash
npm test
```

Expected: vitest exits 0 with "no test files found" (or equivalent) - the runner boots.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for pure-module tests"
```

---

### Task 2: Trace types + deriveTrace (pure, TDD)

**Files:**
- Create: `components/simulate/trace.ts`
- Create: `components/simulate/deriveTrace.ts`
- Test: `components/simulate/deriveTrace.test.ts`
- Modify: `data/simFixtures.ts` (add `branchTaken?: number` to `SimEmail`)

**Interfaces:**
- Consumes: `EditorDoc`, `isCondition`, `lineIsEmpty`, `lineToText`, `PENDING_ACTION`, `EXAMPLE_DOC` from `@/components/flow01/doc`; `findAction` from `@/data/library`; `SimEmail` from `@/data/simFixtures`.
- Produces (later tasks rely on these exact names):
  - `trace.ts`: `type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped'`; `interface TraceStepDef { id: string; kind: 'action' | 'reasoning' | 'condition'; actionId?: string; meta?: string; label?: string; ms: number; output?: string; condType?: 'if' | 'elseif' | 'else'; branch?: string; requiresApproval?: boolean }`.
  - `deriveTrace.ts`: `deriveTrace(doc: EditorDoc, email: SimEmail): TraceStepDef[]`; `failIndexFor(trace: TraceStepDef[]): number`; `conditionIndex(trace: TraceStepDef[]): number`; `traceHasReply(trace: TraceStepDef[]): boolean`; `traceBranchText(trace: TraceStepDef[]): string | undefined`.
  - `SimEmail.branchTaken?: number` (index of the condition arm this email takes; default 0).

- [ ] **Step 1: Add `branchTaken` to the fixture type**

In `data/simFixtures.ts`, inside `interface SimEmail` after the `outcome` field, add:

```ts
  /** Which condition arm this email takes in a derived trace (index; default 0 = IF). */
  branchTaken?: number;
```

(Leave `failAt` in place for now - Task 4 deletes it with its last consumer.)

- [ ] **Step 2: Create `components/simulate/trace.ts`** (types only - shared by the deriver, the engine, and the renderers)

```ts
// Trace model - one derived execution step. Replaces the old fixed SIM_TRACE
// template (traceFixture.tsx): traces are now DERIVED from the real document by
// deriveTrace, so a run is evidence about THIS AOP, not theater.

// Per-step status during a run. gray dot -> green as each step succeeds.
export type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export interface TraceStepDef {
  id: string;
  /** action = a chip on the canvas; reasoning = a prose-only instruction line
   *  (and the trigger); condition = a condition block naming the arm taken. */
  kind: 'action' | 'reasoning' | 'condition';
  /** Library action id (kind 'action' only) - the trace renders it through the
   *  shared Chip atom, identical to the editor's tags. */
  actionId?: string;
  /** Mono detail after the " · " (the chip's real configured value). */
  meta?: string;
  /** Reasoning text (kind 'reasoning' only). */
  label?: string;
  /** Base duration (ms). The run engine jitters it per run. */
  ms: number;
  /** Result line shown once the step is done. */
  output?: string;
  /** Condition: which arm fired. */
  condType?: 'if' | 'elseif' | 'else';
  /** Condition: the matched branch expression (or the no-branch note). */
  branch?: string;
  /** The chip's per-action approval gate - renders the "pauses for approval" marker. */
  requiresApproval?: boolean;
}
```

- [ ] **Step 3: Write the failing tests** - `components/simulate/deriveTrace.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { EXAMPLE_DOC, emptyDoc, txt, normalizeLine, type EditorDoc } from '@/components/flow01/doc';
import type { SimEmail } from '@/data/simFixtures';
import {
  deriveTrace,
  failIndexFor,
  conditionIndex,
  traceHasReply,
  traceBranchText,
} from './deriveTrace';

const email = (over: Partial<SimEmail> = {}): SimEmail => ({
  id: 'e-test',
  sender: 'Test Sender',
  subject: 'Test subject',
  preview: 'Test preview',
  ...over,
});

// A minimal doc: one gated tag chip + one prose step. Fixed ids, no condition.
function smallDoc(): EditorDoc {
  const d = emptyDoc();
  d.trigger = normalizeLine([txt('When a billing email arrives.')]);
  d.steps = [
    {
      id: 's-1',
      body: normalizeLine([
        txt('Tag it '),
        {
          kind: 'chip',
          chip: { id: 'c-1', actionId: 'tag', status: 'ok', config: { meta: 'billing' }, requiresApproval: true },
        },
        txt('.'),
      ]),
    },
    { id: 's-2', body: normalizeLine([txt('Summarize the request for the team.')]) },
  ];
  return d;
}

describe('deriveTrace', () => {
  it('walks the example doc: trigger, reasoning, chips, condition arm, arm body', () => {
    const t = deriveTrace(EXAMPLE_DOC, email());
    // trigger + summarize-prose + tag + hubspot + kb + categorize-prose + condition + draft_reply
    expect(t.map((s) => s.kind)).toEqual([
      'reasoning', 'reasoning', 'action', 'action', 'action', 'reasoning', 'condition', 'action',
    ]);
    expect(t[0]!.label).toContain('Matched trigger');
    expect(t[2]!.actionId).toBe('tag');
    expect(t[2]!.meta).toBe('api-error, support');
    expect(t[6]!.condType).toBe('if');
    expect(t[6]!.branch).toBe('the error is a 4xx client error');
    expect(t[7]!.actionId).toBe('draft_reply');
  });

  it('is branch-aware: branchTaken picks the arm and its body', () => {
    const t = deriveTrace(EXAMPLE_DOC, email({ branchTaken: 2 }));
    const cond = t[conditionIndex(t)]!;
    expect(cond.condType).toBe('else');
    // the ELSE arm still drafts a reply
    expect(t[conditionIndex(t) + 1]!.actionId).toBe('draft_reply');
  });

  it('carries the approval gate onto the chip step', () => {
    const t = deriveTrace(smallDoc(), email());
    const tag = t.find((s) => s.actionId === 'tag')!;
    expect(tag.requiresApproval).toBe(true);
  });

  it('renders prose-only lines as reasoning steps with the instruction text', () => {
    const t = deriveTrace(smallDoc(), email());
    expect(t[2]!.kind).toBe('reasoning');
    expect(t[2]!.label).toBe('Summarize the request for the team.');
  });

  it('empty doc degrades to a defensive trigger-only trace', () => {
    const t = deriveTrace(emptyDoc(), email());
    expect(t).toHaveLength(1);
    expect(t[0]!.kind).toBe('reasoning');
  });
});

describe('trace helpers', () => {
  it('failIndexFor prefers the first connector step, else the last action', () => {
    const ex = deriveTrace(EXAMPLE_DOC, email());
    expect(ex[failIndexFor(ex)]!.actionId).toBe('hubspot_get_contact');
    const small = deriveTrace(smallDoc(), email());
    expect(small[failIndexFor(small)]!.actionId).toBe('tag'); // no connector -> last action
  });

  it('traceHasReply and traceBranchText read the derived trace', () => {
    const ex = deriveTrace(EXAMPLE_DOC, email());
    expect(traceHasReply(ex)).toBe(true);
    expect(traceBranchText(ex)).toBe('the error is a 4xx client error');
    const small = deriveTrace(smallDoc(), email());
    expect(traceHasReply(small)).toBe(false);
    expect(traceBranchText(small)).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL - `deriveTrace.ts` does not exist / exports missing.

- [ ] **Step 5: Implement `components/simulate/deriveTrace.ts`**

```ts
// deriveTrace - the honesty fix. Walks the REAL document and produces the trace
// a run animates: one action step per chip (real configured values), reasoning
// steps for prose-only lines, and a branch-aware condition step that enters the
// taken arm. Outcomes stay scripted per fixture email (no model calls) - but a
// scripted failure now lands on a real step of THIS doc (failIndexFor).
import { findAction } from '@/data/library';
import {
  isCondition,
  lineIsEmpty,
  lineToText,
  PENDING_ACTION,
  type DocStep,
  type EditorDoc,
} from '@/components/flow01/doc';
import type { SimEmail } from '@/data/simFixtures';
import type { TraceStepDef } from './trace';

// Believable base durations by action bucket: an external call lingers, a local
// ticket write is near-instant. Reply drafting is the long pole.
const MS_BY_BUCKET: Record<string, number> = {
  read: 700,
  ticket: 160,
  external: 950,
  human: 420,
  wait: 300,
  flow: 90,
};
const REASONING_MS = 520;

function msFor(actionId: string): number {
  if (actionId === 'draft_reply' || actionId === 'send_reply') return 1300;
  const bucket = findAction(actionId)?.bucket;
  return (bucket && MS_BY_BUCKET[bucket]) || 300;
}

// Generic per-step result line, templated from the action + its configured
// value (reusability rule: no case-specific strings in code paths).
function stepOutput(actionId: string, meta?: string): string {
  if (actionId === 'tag' && meta) return `ticket tagged: ${meta}`;
  if (actionId === 'draft_reply') return 'drafted reply ready';
  if (actionId === 'send_reply') return 'reply sent';
  if (actionId === 'assign' && meta) return `assigned to ${meta}`;
  const a = findAction(actionId);
  if (a?.connectorSlug) return 'response received';
  return 'completed';
}

// One line -> trace steps. Chips present: one action step per finalized chip
// (the surrounding prose is that chip's context, not a separate step). No chips:
// one reasoning step carrying the instruction text. Empty line: nothing.
function lineSteps(line: DocStep, prefix: string): TraceStepDef[] {
  const chips = line.body.filter(
    (f) => f.kind === 'chip' && f.chip.actionId !== PENDING_ACTION,
  );
  if (chips.length === 0) {
    if (lineIsEmpty(line.body)) return [];
    return [{ id: `${prefix}-r`, kind: 'reasoning', label: lineToText(line.body).trim(), ms: REASONING_MS }];
  }
  return chips.map((f, i) => {
    const chip = (f as Extract<typeof f, { kind: 'chip' }>).chip;
    const meta =
      typeof chip.config.meta === 'string' ? chip.config.meta : findAction(chip.actionId)?.meta;
    return {
      id: `${prefix}-c${i}`,
      kind: 'action' as const,
      actionId: chip.actionId,
      meta,
      ms: msFor(chip.actionId),
      output: stepOutput(chip.actionId, meta),
      requiresApproval: chip.requiresApproval || undefined,
    };
  });
}

export function deriveTrace(doc: EditorDoc, email: SimEmail): TraceStepDef[] {
  const out: TraceStepDef[] = [
    {
      id: 't-trigger',
      kind: 'reasoning',
      label: `Matched trigger: ${lineToText(doc.trigger).trim()}`.trim(),
      ms: 300,
    },
  ];
  for (const step of doc.steps) {
    if (isCondition(step)) {
      const idx = Math.min(Math.max(email.branchTaken ?? 0, 0), step.branches.length - 1);
      const arm = step.branches[idx]!;
      out.push({
        id: `t-${step.id}`,
        kind: 'condition',
        ms: 90,
        condType: arm.type,
        branch: arm.condition ? lineToText(arm.condition).trim() : 'no earlier branch matched',
      });
      for (const ln of arm.lines) out.push(...lineSteps(ln, `t-${ln.id}`));
    } else {
      out.push(...lineSteps(step, `t-${step.id}`));
    }
  }
  return out;
}

/** The step a scripted failure lands on: the first connector step (a network
 *  call is the believable failure point), else the last action step. */
export function failIndexFor(trace: TraceStepDef[]): number {
  const conn = trace.findIndex(
    (s) => s.kind === 'action' && !!findAction(s.actionId!)?.connectorSlug,
  );
  if (conn >= 0) return conn;
  for (let i = trace.length - 1; i >= 0; i -= 1) if (trace[i]!.kind === 'action') return i;
  return trace.length - 1;
}

export function conditionIndex(trace: TraceStepDef[]): number {
  return trace.findIndex((s) => s.kind === 'condition');
}

/** Whether this doc's run drafts/sends a reply - gates the RunOutcome draft card. */
export function traceHasReply(trace: TraceStepDef[]): boolean {
  return trace.some(
    (s) => s.kind === 'action' && (s.actionId === 'draft_reply' || s.actionId === 'send_reply'),
  );
}

/** The matched-branch caption for the outcome card (undefined = no condition). */
export function traceBranchText(trace: TraceStepDef[]): string | undefined {
  const i = conditionIndex(trace);
  return i >= 0 ? trace[i]!.branch : undefined;
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS (7 tests). Also run `npx tsc --noEmit` - clean.

- [ ] **Step 7: Commit**

```bash
git add components/simulate/trace.ts components/simulate/deriveTrace.ts components/simulate/deriveTrace.test.ts data/simFixtures.ts
git commit -m "feat: derive evaluation traces from the real document"
```

---

### Task 3: docSignature + useEvalState (pure + hook, TDD)

**Files:**
- Create: `components/simulate/docSignature.ts`
- Create: `components/simulate/useEvalState.ts`
- Test: `components/simulate/docSignature.test.ts`

**Interfaces:**
- Consumes: `EditorDoc`, `isCondition` from `@/components/flow01/doc`; `SimStatusKind` from `@/data/simFixtures`.
- Produces:
  - `docSignature(doc: EditorDoc): string` - content signature ignoring volatile ids.
  - `useEvalState.ts`: `interface EvalAggregate { total: number; passed: number; failed: number; attention: number; stale: boolean }`; `useEvalState(doc: EditorDoc): { agg: EvalAggregate; recordRun: (statuses: SimStatusKind[], docAtRun: EditorDoc) => void }`.

- [ ] **Step 1: Write the failing tests** - `components/simulate/docSignature.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { exampleDoc, emptyDoc, txt, normalizeLine } from '@/components/flow01/doc';
import { docSignature } from './docSignature';

describe('docSignature', () => {
  it('same content, different volatile ids -> equal signatures', () => {
    const a = exampleDoc();
    const b = exampleDoc();
    b.steps = b.steps.map((s) => ({ ...s, id: `renamed-${s.id}` }));
    expect(docSignature(a)).toBe(docSignature(b));
  });

  it('a text edit changes the signature', () => {
    const a = exampleDoc();
    const b = exampleDoc();
    b.trigger = normalizeLine([txt('When something else happens.')]);
    expect(docSignature(a)).not.toBe(docSignature(b));
  });

  it('a chip config change (incl. requiresApproval) changes the signature', () => {
    const a = exampleDoc();
    const b = exampleDoc();
    const step = b.steps.find((s) => 'body' in s && s.body.some((f) => f.kind === 'chip'))!;
    if ('body' in step) {
      step.body = step.body.map((f) =>
        f.kind === 'chip' ? { ...f, chip: { ...f.chip, requiresApproval: true } } : f,
      );
    }
    expect(docSignature(a)).not.toBe(docSignature(b));
  });

  it('empty docs are stable', () => {
    expect(docSignature(emptyDoc())).toBe(docSignature(emptyDoc()));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL - `docSignature.ts` does not exist.

- [ ] **Step 3: Implement `components/simulate/docSignature.ts`**

```ts
// Content signature for staleness: serializes what the doc SAYS (step order,
// text, chip actionId + config + approval gate, branch structure) while
// ignoring volatile ids - so any meaningful edit after an evaluation marks the
// results "evaluated an earlier version", and re-running clears it.
import { isCondition, type EditorDoc } from '@/components/flow01/doc';
import type { Fragment } from '@/types/playbook';

const frag = (f: Fragment): string => {
  if (f.kind === 'text') return `t:${f.text}`;
  if (f.kind === 'chip')
    return `c:${f.chip.actionId}:${JSON.stringify(f.chip.config)}:${f.chip.requiresApproval ? 1 : 0}`;
  if (f.kind === 'ref') return `r:${f.refPath}`;
  return `k:${f.code}`;
};
const line = (body: Fragment[]): string => body.map(frag).join('|');

export function docSignature(doc: EditorDoc): string {
  const steps = doc.steps.map((s) =>
    isCondition(s)
      ? `cond(${s.branches
          .map(
            (b) =>
              `${b.type}[${b.condition ? line(b.condition) : ''}]{${b.lines
                .map((ln) => line(ln.body))
                .join(';')}}`,
          )
          .join(',')})`
      : line(s.body),
  );
  return `${line(doc.trigger)}::${steps.join('::')}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Implement `components/simulate/useEvalState.ts`** (hook - exercised through the UI, no unit test)

```ts
'use client';

// Eval aggregate, owned by the canvas (EditorCanvas) so Enable can read it.
// recordRun accumulates every completed run's per-email statuses; staleness
// compares the doc signature captured at the last run with the live doc.
import { useCallback, useMemo, useState } from 'react';
import type { SimStatusKind } from '@/data/simFixtures';
import type { EditorDoc } from '@/components/flow01/doc';
import { docSignature } from './docSignature';

export interface EvalAggregate {
  total: number;
  passed: number;
  failed: number;
  attention: number;
  stale: boolean;
}

const ZERO = { total: 0, passed: 0, failed: 0, attention: 0 };

export function useEvalState(doc: EditorDoc) {
  const [counts, setCounts] = useState(ZERO);
  const [sigAtRun, setSigAtRun] = useState<string | null>(null);

  const recordRun = useCallback((statuses: SimStatusKind[], docAtRun: EditorDoc) => {
    if (statuses.length === 0) return;
    setCounts((prev) =>
      statuses.reduce(
        (a, s) => ({
          total: a.total + 1,
          passed: a.passed + (s === 'passed' ? 1 : 0),
          failed: a.failed + (s === 'failed' ? 1 : 0),
          attention: a.attention + (s === 'attention' ? 1 : 0),
        }),
        prev,
      ),
    );
    setSigAtRun(docSignature(docAtRun));
  }, []);

  const agg: EvalAggregate = useMemo(
    () => ({ ...counts, stale: sigAtRun !== null && sigAtRun !== docSignature(doc) }),
    [counts, sigAtRun, doc],
  );

  return { agg, recordRun };
}
```

- [ ] **Step 6: Gates + commit**

```bash
npm test && npx tsc --noEmit
git add components/simulate/docSignature.ts components/simulate/docSignature.test.ts components/simulate/useEvalState.ts
git commit -m "feat: eval aggregate state with content-signature staleness"
```

---

### Task 4: Swap the run engine + renderers to derived traces

The big honesty swap: `useSimRun` consumes per-email derived traces; `RunTrace`/`TraceStep` render them (incl. reasoning steps + the approval marker); `EmailCard` gates the draft card; `traceFixture.tsx` is deleted; the `doc` threads down from `EditorCanvas`.

**Files:**
- Modify: `components/simulate/useSimRun.ts` (rewrite internals)
- Modify: `components/simulate/RunTrace.tsx` (take `trace` prop)
- Modify: `components/simulate/TraceStep.tsx` (reasoning + approval marker)
- Modify: `components/simulate/TraceStep.module.css`
- Modify: `components/simulate/RunOutcome.tsx` (drop fixture defaults)
- Modify: `components/simulate/EmailCard.tsx` (draft gating, pass trace)
- Modify: `components/simulate/SimulatePanel.tsx`, `components/simulate/RecentEmails.tsx`, `components/simulate/CustomEval.tsx` (accept + thread `doc`)
- Modify: `components/flow01/copilot/SidePanel.tsx` (SimProps gains `doc`)
- Modify: `components/flow01/EditorCanvas.tsx` (pass `doc` to both SidePanel sim and the floating SimulatePanel)
- Modify: `data/simFixtures.ts` (delete `failAt` field + its two fixture usages)
- Delete: `components/simulate/traceFixture.tsx`

**Interfaces:**
- Consumes: `deriveTrace`, `failIndexFor`, `conditionIndex`, `traceHasReply`, `traceBranchText` (Task 2); `TraceStepDef`, `StepStatus` from `./trace`.
- Produces:
  - `useSimRun(emails: SimEmail[], doc: EditorDoc, onComplete?: (statuses: SimStatusKind[]) => void)` returning `{ phase, runs, start, stop }` (unchanged return shape) where `EmailRun` gains `trace: TraceStepDef[]`.
  - `RunTrace` props: `{ trace: TraceStepDef[]; stepStatus; stepMs?; outcome? }`.
  - `SimulatePanel`, `RecentEmails`, `CustomEval` each accept `doc: EditorDoc`; `SidePanel` `SimProps` gains `doc: EditorDoc`.

- [ ] **Step 1: Rewrite `components/simulate/useSimRun.ts`**

Replace the whole file:

```ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SimEmail, SimStatusKind } from '@/data/simFixtures';
import type { EditorDoc } from '@/components/flow01/doc';
import type { StepStatus, TraceStepDef } from './trace';
import { conditionIndex, deriveTrace, failIndexFor } from './deriveTrace';

export interface EmailRun {
  status: SimStatusKind; // idle | running | passed | failed | attention
  steps: Record<string, StepStatus>;
  durations: Record<string, number>; // actual per-step run duration (ms) THIS run
  /** This email's derived trace (the doc walked for THIS email). */
  trace: TraceStepDef[];
}

export type RunPhase = 'idle' | 'running' | 'done';

function freshSteps(trace: TraceStepDef[]): Record<string, StepStatus> {
  return Object.fromEntries(trace.map((s) => [s.id, 'pending'])) as Record<string, StepStatus>;
}
function emptyRun(trace: TraceStepDef[]): EmailRun {
  return { status: 'idle', steps: freshSteps(trace), durations: {}, trace };
}
// The duration step i runs for THIS pass: the step's base, jittered 0.8x-1.25x.
function stepDuration(trace: TraceStepDef[], i: number): number {
  const base = trace[i]?.ms ?? 300;
  const jitter = 0.8 + Math.random() * 0.45;
  return Math.max(70, Math.round(base * jitter));
}

// Resolve an email's run UP FRONT against ITS derived trace: scripted outcome
// mapped onto real steps. failed -> failIndexFor (first connector, else last
// action); attention -> everything after the condition is skipped (no matching
// branch); a doc with NO condition can't have a caught gap -> passes.
interface Resolved {
  finalStatus: SimStatusKind;
  stepFinal: Record<string, StepStatus>;
  lastIdx: number;
}
function resolveEmail(email: SimEmail, trace: TraceStepDef[]): Resolved {
  const last = trace.length - 1;
  let outcome = email.outcome ?? 'passed';
  const ci = conditionIndex(trace);
  if (outcome === 'attention' && ci === -1) outcome = 'passed';

  const stepFinal: Record<string, StepStatus> = {};
  if (outcome === 'failed') {
    const failAt = failIndexFor(trace);
    trace.forEach((s, i) => {
      stepFinal[s.id] = i < failAt ? 'done' : i === failAt ? 'failed' : 'skipped';
    });
    return { finalStatus: 'failed', stepFinal, lastIdx: failAt };
  }
  if (outcome === 'attention') {
    trace.forEach((s, i) => {
      stepFinal[s.id] = i <= ci ? 'done' : 'skipped';
    });
    return { finalStatus: 'attention', stepFinal, lastIdx: ci };
  }
  trace.forEach((s) => {
    stepFinal[s.id] = 'done';
  });
  return { finalStatus: 'passed', stepFinal, lastIdx: last };
}

/**
 * useSimRun - sequential run engine. Emails run ONE AT A TIME, each walking its
 * OWN derived trace (pending -> running -> done/failed per step). Honors
 * prefers-reduced-motion (jump to resolved), resets when the email set or doc
 * changes, and reports the completed run's statuses via onComplete (the eval
 * aggregate). Outcomes are scripted per fixture; steps are real.
 */
export function useSimRun(
  emails: SimEmail[],
  doc: EditorDoc,
  onComplete?: (statuses: SimStatusKind[]) => void,
) {
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [runs, setRuns] = useState<Record<string, EmailRun>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ei = useRef(0); // email index
  const si = useRef(0); // step index
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const traces = useMemo(
    () => Object.fromEntries(emails.map((e) => [e.id, deriveTrace(doc, e)])),
    [emails, doc],
  );
  const traceFor = useCallback((e: SimEmail) => traces[e.id]!, [traces]);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    setPhase('done');
    if (emails.length > 0) {
      onCompleteRef.current?.(emails.map((e) => resolveEmail(e, traces[e.id]!).finalStatus));
    }
  }, [emails, traces]);

  const advance = useCallback(() => {
    const email = emails[ei.current];
    if (!email) {
      finish();
      return;
    }
    const trace = traceFor(email);
    const res = resolveEmail(email, trace);
    const idx = si.current;
    const curId = trace[idx]!.id;
    const curFinal = res.stepFinal[curId]!;
    const atLast = idx >= res.lastIdx;

    if (!atLast) {
      const nextId = trace[idx + 1]!.id;
      const nextDur = stepDuration(trace, idx + 1);
      setRuns((prev) => {
        const run = { ...(prev[email.id] ?? emptyRun(trace)) };
        run.steps = { ...run.steps, [curId]: curFinal, [nextId]: 'running' };
        run.durations = { ...run.durations, [nextId]: nextDur };
        return { ...prev, [email.id]: run };
      });
      si.current = idx + 1;
      timer.current = setTimeout(advance, nextDur);
    } else {
      const nextEmail = emails[ei.current + 1];
      const nextTrace = nextEmail ? traceFor(nextEmail) : null;
      const nextDur0 = nextTrace ? stepDuration(nextTrace, 0) : 0;
      setRuns((prev) => {
        const run = { ...(prev[email.id] ?? emptyRun(trace)) };
        run.steps = { ...run.steps, ...res.stepFinal };
        run.status = res.finalStatus;
        const out = { ...prev, [email.id]: run };
        if (nextEmail && nextTrace) {
          const nr = emptyRun(nextTrace);
          nr.status = 'running';
          nr.steps[nextTrace[0]!.id] = 'running';
          nr.durations[nextTrace[0]!.id] = nextDur0;
          out[nextEmail.id] = nr;
        }
        return out;
      });
      if (nextEmail) {
        ei.current += 1;
        si.current = 0;
        timer.current = setTimeout(advance, nextDur0);
      } else {
        finish();
      }
    }
  }, [emails, traceFor, finish]);

  const start = useCallback(() => {
    clear();
    ei.current = 0;
    si.current = 0;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      const done: Record<string, EmailRun> = {};
      emails.forEach((e) => {
        const trace = traceFor(e);
        const res = resolveEmail(e, trace);
        done[e.id] = { status: res.finalStatus, steps: { ...res.stepFinal }, durations: {}, trace };
      });
      setRuns(done);
      finish();
      return;
    }

    const first = emails[0];
    if (!first) {
      finish();
      return;
    }
    const firstTrace = traceFor(first);
    const dur0 = stepDuration(firstTrace, 0);
    const init: Record<string, EmailRun> = {};
    emails.forEach((e, idx) => {
      const r = emptyRun(traceFor(e));
      if (idx === 0) {
        r.status = 'running';
        r.steps[firstTrace[0]!.id] = 'running';
        r.durations[firstTrace[0]!.id] = dur0;
      }
      init[e.id] = r;
    });
    setRuns(init);
    setPhase('running');
    timer.current = setTimeout(advance, dur0);
  }, [emails, traceFor, advance, clear, finish]);

  const stop = useCallback(() => {
    clear();
    setPhase('idle');
  }, [clear]);

  // Reset when the email set (or the doc) changes; clean up on unmount.
  useEffect(() => {
    clear();
    setRuns({});
    setPhase('idle');
    ei.current = 0;
    si.current = 0;
    return () => clear();
  }, [traces, clear]);

  return { phase, runs, start, stop };
}
```

Note: `finish()` fires `onComplete` only for non-empty runs; `stop()` mid-run never records (the run did not complete).

- [ ] **Step 2: Update `RunTrace.tsx`** - render the passed trace

Replace the import of `SIM_TRACE`/types and the map:

```ts
import { SIM_COPY, type SimStatusKind } from '@/data/simFixtures';
import type { StepStatus, TraceStepDef } from './trace';

interface Props {
  trace: TraceStepDef[];
  stepStatus: Record<string, StepStatus>;
  stepMs?: Record<string, number>;
  outcome?: SimStatusKind;
}
```

Inside the component, replace `SIM_TRACE.map(...)` with `trace.map(...)` and `const LAST = SIM_TRACE.length - 1;` (module scope) with `const last = trace.length - 1;` (component scope); `isLast={i === last}`. The `noBranch` line is unchanged (`s.kind === 'condition' && outcome === 'attention'`).

- [ ] **Step 3: Update `TraceStep.tsx`** - reasoning steps + approval marker

Change the type import to `import type { TraceStepDef, StepStatus } from './trace';` and add `import { ShieldUserIcon } from '@/components/icons/ui';`.

The chip row becomes a three-way branch, and the approval marker renders beside the tag (`isCond`/`condLabel` stay as they are):

```tsx
        <div className={styles.chipRow}>
          {step.kind === 'reasoning' ? (
            <span className={styles.reason}>{step.label}</span>
          ) : isCond ? (
            <Chip mode="condition" label={condLabel} subtle={branchWarn} plain />
          ) : (
            <Chip chip={chipModel} metaText={step.meta} plain />
          )}
          {step.requiresApproval && (
            <span className={styles.gate}>
              <ShieldUserIcon aria-hidden />
              pauses for approval
            </span>
          )}
        </div>
```

`chipModel` needs `actionId: step.actionId ?? ''` (the field is optional now; reasoning/condition never reach the action branch).

Add to `TraceStep.module.css`:

```css
/* Prose-only instruction line ("reasoning") - quiet text, no chip chrome. */
.reason {
  font-size: var(--fs-small);
  line-height: var(--lh-small);
  color: var(--body);
}

/* Per-action approval gate marker: this step pauses for a teammate at runtime.
   The purple human/review family (--state-running), tint + text - no chunky border. */
.gate {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--state-running);
  background: rgba(124, 58, 237, 0.08);
  border-radius: 999px;
  padding: 2px 8px;
  white-space: nowrap;
}
.gate svg {
  width: 12px;
  height: 12px;
}
```

(Check `.chipRow` in the same file - if it isn't already `display: flex; align-items: center;`, make it so the marker sits beside the tag.)

- [ ] **Step 4: Update `RunOutcome.tsx`** - drop the fixture defaults

Remove `import { SIM_BRANCH, SIM_DRAFT } from './traceFixture';`. Change the signature so nothing defaults to the API-error story:

```ts
export default function RunOutcome({ kind, branch, draft, verdict, onVerdict }: Props) {
```

In the passed-branch JSX, render the caption only when present:

```tsx
      {branch && <span className={styles.branchCaption}>Matched branch: {branch}</span>}
```

- [ ] **Step 5: Update `EmailCard.tsx`** - gate the draft card + pass the trace

Add the import: `import { traceHasReply, traceBranchText } from './deriveTrace';`

Replace the run block's outcome + trace wiring:

```tsx
          {run!.status === 'passed' &&
            (traceHasReply(run!.trace) ? (
              <RunOutcome
                kind="passed"
                branch={traceBranchText(run!.trace)}
                draft={email.draft ?? 'Drafted reply ready for review.'}
                verdict={verdict}
                onVerdict={onVerdict}
              />
            ) : null)}
          {run!.status === 'attention' && <RunOutcome kind="attention" />}
          {run!.status === 'failed' && <RunOutcome kind="failed" />}
          <div className={styles.divider} aria-hidden />
          <RunTrace trace={run!.trace} stepStatus={run!.steps} stepMs={run!.durations} outcome={run!.status} />
```

- [ ] **Step 6: Thread `doc` down**

- `SimulatePanel.tsx`: add to `Props` - `/** The live document - evaluation walks THIS doc. */ doc: EditorDoc;` (import `type { EditorDoc } from '@/components/flow01/doc'`). Destructure `doc`; change the hook call to `useSimRun(topic?.emails ?? NO_EMAILS, doc)`; pass `doc={doc}` to `<RecentEmails onExit={toMenu} doc={doc} />` and `<CustomEval doc={doc} />`.
- `RecentEmails.tsx`: `interface Props { onExit: () => void; doc: EditorDoc; }`; `useSimRun(runEmails, doc)`.
- `CustomEval.tsx`: `interface Props { doc: EditorDoc; }` -> `export default function CustomEval({ doc }: Props)`; `useSimRun(emails, doc)`.
- `SidePanel.tsx`: `SimProps` gains `doc: EditorDoc;` (already spread onto `<SimulatePanel docked ... {...sim} />` - no other change).
- `EditorCanvas.tsx`: in the companions `<SidePanel ... sim={{ ... }}>` add `doc,` to the sim object; in the non-companions `<SimulatePanel ...>` add `doc={doc}`.
- `data/simFixtures.ts`: delete the `failAt?: number;` field from `SimEmail` and the two fixture lines `failAt: 3, // KB lookup times out` (topic-2/e4) and `failAt: 3,` (re6).

- [ ] **Step 7: Delete the fixture + sweep imports**

```bash
rm components/simulate/traceFixture.tsx
grep -rn "traceFixture\|SIM_TRACE\|SIM_DRAFT\|SIM_BRANCH" components/ app/ data/
```

Expected: no matches (if any remain, fix them to the new modules).

- [ ] **Step 8: Gates**

```bash
npm test && npx tsc --noEmit && npx eslint components/simulate components/flow01/copilot/SidePanel.tsx components/flow01/EditorCanvas.tsx
```

Expected: tests pass, tsc clean, no NEW lint errors.

- [ ] **Step 9: Drive the real flow (playwright loop - see recipe)**

With the dev server on :3000, drive `/api-example`: switch the side panel to Evaluation -> AI scenarios -> open "404 errors" -> Test all emails. Screenshot the finished card. Verify against `EXAMPLE_DOC`: trace opens with "Matched trigger:", shows the Summarize prose as a reasoning line, `Tag · api-error, support`, `HubSpot · Get contact`, `Search Knowledge Hub`, the IF condition ("the error is a 4xx client error"), and Reply - NOT the old fixed fixture. Then run Custom email once and confirm the same doc-derived trace. Delete the PNGs.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: evaluation runs walk the real document (derived traces)"
```

---

### Task 5: Rollup wiring + summary strip

**Files:**
- Create: `components/simulate/EvalSummary.tsx`
- Create: `components/simulate/EvalSummary.module.css`
- Modify: `components/simulate/SimulatePanel.tsx`, `components/simulate/RecentEmails.tsx`, `components/simulate/CustomEval.tsx` (accept + wire `onRunRecorded`)
- Modify: `components/flow01/copilot/SidePanel.tsx` (SimProps gains `onRunRecorded`, `evalSummary`)
- Modify: `components/flow01/EditorCanvas.tsx` (own `useEvalState`, pass down)

**Interfaces:**
- Consumes: `useEvalState`, `EvalAggregate` (Task 3); `useSimRun`'s `onComplete` (Task 4).
- Produces:
  - `EvalSummary` props: `{ agg: EvalAggregate }` (renders null when `agg.total === 0`).
  - `SimulatePanel`/`RecentEmails`/`CustomEval` prop: `onRunRecorded?: (statuses: SimStatusKind[]) => void`.
  - `SidePanel` `SimProps` gains `onRunRecorded?` and `evalSummary?: EvalAggregate`.
  - `EditorCanvas` owns `const { agg: evalAgg, recordRun } = useEvalState(doc)` - Task 6 reads `evalAgg`.

- [ ] **Step 1: Create `EvalSummary.tsx`**

```tsx
'use client';

// One-line n-of-m rollup above the eval entry cards (differentiation: Fin has
// per-sim verdicts but no rollup). Plain text + status dots, no card chrome.
// The stale note appears when the doc changed after the last run.
import type { EvalAggregate } from './useEvalState';
import styles from './EvalSummary.module.css';

export default function EvalSummary({ agg }: { agg: EvalAggregate }) {
  if (agg.total === 0) return null;
  const parts: Array<{ n: number; label: string; cls: string }> = [
    { n: agg.passed, label: 'passed', cls: styles.ok ?? '' },
    { n: agg.failed, label: 'failed', cls: styles.fail ?? '' },
    { n: agg.attention, label: 'needs attention', cls: styles.warn ?? '' },
  ].filter((p) => p.n > 0);
  return (
    <div className={styles.summary} role="status">
      <span className={styles.count}>
        {agg.total} evaluation{agg.total === 1 ? '' : 's'}
      </span>
      {parts.map((p) => (
        <span key={p.label} className={styles.part}>
          <span className={`${styles.dot} ${p.cls}`} aria-hidden />
          {p.n} {p.label}
        </span>
      ))}
      {agg.stale && <span className={styles.stale}>Evaluated an earlier version of this AOP</span>}
    </div>
  );
}
```

`EvalSummary.module.css`:

```css
/* Rollup strip - one quiet line, hairline-separated from the entry cards. */
.summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--hairline-soft);
  font-size: var(--fs-small);
  color: var(--body);
}
.count {
  font-weight: 500;
  color: var(--ink-soft);
}
.part {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.ok { background: var(--state-ok); }
.fail { background: #cd3746; }
.warn { background: #b7791f; }
.stale {
  flex-basis: 100%;
  color: var(--muted);
  font-size: 12px;
}
```

(Verify `--state-ok` exists in the global tokens - it is used by `Chip.module.css:207`; if the fail/warn hexes have token equivalents in `app/globals.css`, use the tokens.)

- [ ] **Step 2: Wire `onRunRecorded` through the flows**

- `SimulatePanel.tsx` Props: add `onRunRecorded?: (statuses: SimStatusKind[]) => void;` and `evalSummary?: EvalAggregate;` (import `type { EvalAggregate } from './useEvalState'`). Hook call becomes `useSimRun(topic?.emails ?? NO_EMAILS, doc, onRunRecorded)`. Pass `onRunRecorded={onRunRecorded}` to `RecentEmails` and `CustomEval`. In the menu view render the strip directly above `<EvalMenu ...>`:

```tsx
          {view === 'menu' && (
            <>
              {evalSummary && <EvalSummary agg={evalSummary} />}
              <EvalMenu onOpen={openFlow} />
            </>
          )}
```

- `RecentEmails.tsx`: Props gains `onRunRecorded?: (statuses: SimStatusKind[]) => void;`; hook call `useSimRun(runEmails, doc, onRunRecorded)`.
- `CustomEval.tsx`: same prop; `useSimRun(emails, doc, onRunRecorded)`.
- `SidePanel.tsx` `SimProps`: add both `onRunRecorded?: (statuses: SimStatusKind[]) => void;` and `evalSummary?: EvalAggregate;` (spread passes them through).

- [ ] **Step 3: Own the aggregate in `EditorCanvas.tsx`**

Imports: `import { useEvalState } from '@/components/simulate/useEvalState';` and add `SimStatusKind` type import from `@/data/simFixtures`.

Near the top of the component (after `docRef` is set up):

```ts
  // Evaluation aggregate (req #3): accumulated run results + staleness vs the
  // live doc. Feeds the eval summary strip and the evaluation-aware Enable.
  const { agg: evalAgg, recordRun } = useEvalState(doc);
  const onRunRecorded = useCallback(
    (statuses: SimStatusKind[]) => recordRun(statuses, docRef.current),
    [recordRun],
  );
```

Pass `onRunRecorded` and `evalSummary: evalAgg` in the SidePanel `sim={{ ... }}` object, and `onRunRecorded={onRunRecorded}` + `evalSummary={evalAgg}` on the floating `<SimulatePanel>`.

- [ ] **Step 4: Gates + drive**

```bash
npm test && npx tsc --noEmit && npx eslint components/simulate components/flow01/copilot/SidePanel.tsx
```

Drive `/api-example`: run the "404 errors" topic (2 emails, both pass), back out to the eval menu - the strip reads "2 evaluations · 2 passed". Run "Server errors" (1 pass + 1 fail) - strip updates to "4 evaluations · 3 passed · 1 failed". Type one character into a step, return to the menu - the stale line appears. Screenshot each state, verify, delete PNGs.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: eval rollup summary strip wired to the canvas aggregate"
```

---

### Task 6: EvalNudgeModal + EnableModal status row + Enable wiring

**Files:**
- Create: `components/flow01/enable/EvalNudgeModal.tsx`
- Create: `components/flow01/enable/EvalNudgeModal.module.css`
- Modify: `components/flow01/enable/EnableModal.tsx` + `EnableModal.module.css` (status row)
- Modify: `components/flow01/EditorCanvas.tsx` (branch on the aggregate)

**Interfaces:**
- Consumes: `EvalAggregate` (Task 3); `evalAgg` in EditorCanvas (Task 5); `Button` atom; `EnableModal`'s scrim/dialog pattern.
- Produces:
  - `EvalNudgeModal` props: `{ variant: 'untested' | 'failures'; agg: EvalAggregate; onEvaluate: () => void; onEnableAnyway: () => void; onClose: () => void }`.
  - `EnableModal` gains optional prop `evalStatus?: EvalAggregate | null`.

- [ ] **Step 1: Create `EvalNudgeModal.tsx`**

```tsx
'use client';

// Pre-enable evaluation nudge (spec 2026-07-02). Shows ONLY when this AOP has
// never been evaluated (untested) or has failing evaluations (failures). Always
// skippable - Esc / scrim / x close it, "Enable anyway" proceeds. Same calm
// scrim/dialog family as EnableModal (no morphs), reduced-motion aware via CSS.
import { useEffect, useRef } from 'react';
import { RiCloseLine, RiPlayCircleLine } from 'react-icons/ri';
import Button from '@/components/atoms/Button';
import type { EvalAggregate } from '@/components/simulate/useEvalState';
import styles from './EvalNudgeModal.module.css';

interface Props {
  variant: 'untested' | 'failures';
  agg: EvalAggregate;
  /** Primary: open the Evaluation panel (untested: start; failures: review). */
  onEvaluate: () => void;
  /** Ghost: skip the nudge and continue to the Enable modal. */
  onEnableAnyway: () => void;
  onClose: () => void;
}

export default function EvalNudgeModal({ variant, agg, onEvaluate, onEnableAnyway, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLButtonElement>('button[data-primary]')?.focus();
  }, []);

  const failures = variant === 'failures';
  const title = failures
    ? `${agg.failed} of ${agg.total} evaluations failed`
    : 'Test it before it goes live';
  const body = failures
    ? 'Some evaluation runs did not pass. Review what went wrong before this AOP starts running on real conversations.'
    : 'Run this AOP on a few real emails first and see exactly what it would do. Evaluations never email anyone.';
  const primaryLabel = failures ? 'Review results' : 'Evaluate first';

  return (
    <div
      className={styles.scrim}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-variant={variant}
      >
        <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          <RiCloseLine />
        </button>
        <span className={styles.icon} data-warn={failures || undefined} aria-hidden>
          <RiPlayCircleLine />
        </span>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={onEnableAnyway}>
            Enable anyway
          </button>
          <Button variant="accent" data-primary onClick={onEvaluate}>
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

(If the `Button` atom does not forward `data-primary`, put the attribute on a wrapping check inside `useEffect` instead: focus `querySelectorAll('button')[last]`. Check `components/atoms/Button.tsx` first - it likely spreads rest props.)

`EvalNudgeModal.module.css` - reuse the EnableModal scrim/dialog values (same family; check `EnableModal.module.css` and copy its scrim rgba + radius + shadow tokens exactly so the two modals match):

```css
.scrim {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  background: rgba(26, 32, 39, 0.4); /* MATCH EnableModal.module.css .scrim */
  animation: nudgeFade 160ms ease-out;
}
.dialog {
  position: relative;
  width: 400px;
  max-width: calc(100vw - 48px);
  background: var(--card);
  border-radius: 14px; /* MATCH EnableModal dialog radius */
  box-shadow: 0 12px 40px rgba(26, 32, 39, 0.18); /* MATCH EnableModal */
  padding: 28px 28px 24px;
  animation: nudgeIn 180ms ease-out;
}
.close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.close:hover { background: var(--surface-soft); color: var(--ink-soft); }
.icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--info-subtle);
  color: var(--accent);
  margin-bottom: 14px;
}
.icon[data-warn] { color: #b7791f; background: rgba(183, 121, 31, 0.08); }
.icon svg { width: 20px; height: 20px; }
.title {
  margin: 0 0 6px;
  font-size: var(--fs-h5);
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.011em;
}
.body {
  margin: 0 0 20px;
  font-size: var(--fs-body);
  line-height: 1.5;
  color: var(--body);
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.ghost {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: var(--fs-body);
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.ghost:hover { background: var(--surface-soft); color: var(--ink-soft); }
@keyframes nudgeFade { from { opacity: 0; } }
@keyframes nudgeIn { from { opacity: 0; transform: translateY(4px); } }
@media (prefers-reduced-motion: reduce) {
  .scrim, .dialog { animation: none; }
}
```

Before committing, verify every `var(--...)` used exists in `app/globals.css` and the MATCH comments were reconciled against the real EnableModal values.

- [ ] **Step 2: EnableModal status row**

`EnableModal.tsx`: add to Props - `/** Evaluation aggregate; renders the quiet status row when runs exist. */ evalStatus?: EvalAggregate | null;` (import the type from `@/components/simulate/useEvalState`). Under the name `</div>` (the `.field` block, after line ~242), insert:

```tsx
              {evalStatus && evalStatus.total > 0 && (
                <div
                  className={styles.evalRow}
                  data-ok={(evalStatus.passed === evalStatus.total) || undefined}
                >
                  <span className={styles.evalDot} aria-hidden />
                  <span>
                    {evalStatus.passed} of {evalStatus.total} evaluation
                    {evalStatus.total === 1 ? '' : 's'} passed
                    {evalStatus.stale ? ' - evaluated an earlier version' : ''}
                  </span>
                </div>
              )}
```

`EnableModal.module.css` additions:

```css
/* Quiet evaluation status row under the name field (spec 2026-07-02): the
   lightweight readiness signal, not the full P0 readiness engine. */
.evalRow {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: -6px 0 14px;
  font-size: var(--fs-small);
  color: var(--body);
}
.evalDot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #b7791f; /* not-all-passed = amber */
  flex: none;
}
.evalRow[data-ok] .evalDot { background: var(--state-ok); }
```

- [ ] **Step 3: Branch Enable in `EditorCanvas.tsx`**

Add state + import:

```ts
import EvalNudgeModal from './enable/EvalNudgeModal';
// ...
  // The pre-enable evaluation nudge (only in 'commit' mode; 'manage' never nudges).
  const [nudge, setNudge] = useState<null | 'untested' | 'failures'>(null);
```

`openEnable` currently seeds the modal for both modes. Split it: keep `openEnable` as-is (rename nothing - it becomes the "proceed" path) and route the Toolbar through a new gate:

```ts
  // Enable click gate (spec 2026-07-02): never evaluated -> nudge; failures ->
  // caution nudge; else straight to the Enable modal. Always skippable.
  const requestEnable = useCallback(() => {
    if (evalAgg.total === 0) setNudge('untested');
    else if (evalAgg.failed > 0) setNudge('failures');
    else openEnable('commit');
  }, [evalAgg.total, evalAgg.failed, openEnable]);
```

Change the Toolbar prop: `onEnable={requestEnable}` (was `() => openEnable('commit')`). The settings gear stays `() => openEnable('manage')`.

Render the nudge (next to the EnableModal mount):

```tsx
      {nudge && (
        <EvalNudgeModal
          variant={nudge}
          agg={evalAgg}
          onClose={() => setNudge(null)}
          onEvaluate={() => {
            setNudge(null);
            if (companions) setPanelTab('simulate');
            else setSimOpen(true);
          }}
          onEnableAnyway={() => {
            setNudge(null);
            openEnable('commit');
          }}
        />
      )}
```

Pass the aggregate to the EnableModal mount: `evalStatus={evalAgg}`.

- [ ] **Step 4: Gates + drive all three states**

```bash
npm test && npx tsc --noEmit && npx eslint components/flow01/enable components/flow01/EditorCanvas.tsx
```

Drive `/api-example` (never evaluated): click Enable -> untested nudge appears; "Evaluate first" lands on the Evaluation tab; Enable again -> "Enable anyway" -> EnableModal (no status row). Reload; run a topic containing the failing email (Server errors); Enable -> caution nudge with the real counts; "Review results" -> eval panel. Reload; run only "404 errors" (all pass); Enable -> straight to EnableModal with the green "2 of 2 evaluations passed" row. Edit a step after running -> Enable -> row shows the stale suffix. Also confirm Esc and scrim-click close the nudge, and the settings gear on a live AOP never nudges. Screenshot the nudge variants + the status row, verify against the design language (no chunky borders, calm fade), delete PNGs.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: pre-enable evaluation nudge + evaluation-aware Enable modal"
```

---

### Task 7: Backtest - teamDid fixtures, compare, Copilot pre-fill

**Files:**
- Modify: `data/simFixtures.ts` (add `teamDid` to `SimEmail` + fixture data)
- Create: `components/simulate/backtest.ts`
- Test: `components/simulate/backtest.test.ts`
- Create: `components/simulate/BacktestCompare.tsx` + `BacktestCompare.module.css`
- Modify: `components/simulate/EmailCard.tsx` (render the compare block)
- Modify: `components/simulate/RecentEmails.tsx` (build compare per email, thread `onAdjustCase`)
- Modify: `components/simulate/SimulatePanel.tsx`, `components/flow01/copilot/SidePanel.tsx` (thread `onAdjustCase`)
- Modify: `components/flow01/copilot/CopilotPanel.tsx` (composer `seed` prop)
- Modify: `components/flow01/EditorCanvas.tsx` (seed state + tab switch)

**Interfaces:**
- Consumes: `TraceStepDef` (Task 2), `EmailRun.trace` (Task 4).
- Produces:
  - `SimEmail.teamDid?: { tags?: string[]; replied?: boolean; assignedTo?: string }`.
  - `backtest.ts`: `interface CaseActions { tags?: string[]; replied?: boolean; assignedTo?: string }`; `aopWould(trace: TraceStepDef[]): CaseActions`; `interface CompareRow { aspect: string; would: string; did: string; match: boolean }`; `compareCase(would: CaseActions, did: CaseActions): { rows: CompareRow[]; differs: string[] }`.
  - `BacktestCompare` props: `{ rows: CompareRow[]; differs: string[]; onAdjust?: () => void }`.
  - `onAdjustCase?: (subject: string, differs: string[]) => void` threaded RecentEmails -> SimulatePanel -> SidePanel SimProps -> EditorCanvas.
  - `CopilotPanel` gains `seed?: { text: string; token: number } | null` (sets the composer value when `token` changes).

- [ ] **Step 1: Fixture data**

`data/simFixtures.ts` - add to `SimEmail`:

```ts
  /** Backtest ground truth: what the team ACTUALLY did on this thread. Emails
   *  without it show a plain result (no compare block). */
  teamDid?: { tags?: string[]; replied?: boolean; assignedTo?: string };
```

Add `teamDid` to six RECENT_EMAILS entries (generic, coherent with each email's story; entries chosen to produce a mix of matches and differences against typical docs):

```ts
// re1  (login)        teamDid: { tags: ['account-access'], replied: true },
// re2  (billing)      teamDid: { tags: ['billing'], replied: true, assignedTo: 'Billing' },
// re4  (dark mode)    teamDid: { tags: ['feature-request'], replied: true },
// re6  (500 export)   teamDid: { tags: ['api-error', 'support'], replied: true, assignedTo: 'Escalations' },
// re10 (webhooks 404) teamDid: { tags: ['api-error', 'support'], replied: true },
// re11 (cancel)       teamDid: { tags: ['billing'], replied: true, assignedTo: 'Billing' },
```

(Write them as real object fields on those entries, not comments.)

- [ ] **Step 2: Failing tests** - `components/simulate/backtest.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { EXAMPLE_DOC } from '@/components/flow01/doc';
import { deriveTrace } from './deriveTrace';
import { aopWould, compareCase } from './backtest';

const email = { id: 'x', sender: 's', subject: 'sub', preview: 'p' };

describe('aopWould', () => {
  it('distills tags + reply from the derived trace', () => {
    const w = aopWould(deriveTrace(EXAMPLE_DOC, email));
    expect(w.tags).toEqual(['api-error', 'support']);
    expect(w.replied).toBe(true);
    expect(w.assignedTo).toBeUndefined();
  });
});

describe('compareCase', () => {
  it('matches when both sides agree', () => {
    const { rows, differs } = compareCase(
      { tags: ['api-error', 'support'], replied: true },
      { tags: ['support', 'api-error'], replied: true }, // order-insensitive
    );
    expect(rows.every((r) => r.match)).toBe(true);
    expect(differs).toEqual([]);
  });

  it('names each difference in plain language', () => {
    const { rows, differs } = compareCase(
      { tags: ['api-error', 'support'], replied: true },
      { tags: ['api-error', 'support'], replied: true, assignedTo: 'Escalations' },
    );
    expect(rows.find((r) => r.aspect === 'Assignment')!.match).toBe(false);
    expect(differs.join(' ')).toContain('Escalations');
  });

  it('skips aspects absent on both sides', () => {
    const { rows } = compareCase({ replied: true }, { replied: true });
    expect(rows.map((r) => r.aspect)).toEqual(['Reply']);
  });
});
```

Run `npm test` - expected: FAIL (`backtest.ts` missing).

- [ ] **Step 3: Implement `components/simulate/backtest.ts`**

```ts
// Backtest compare (Pylon's pattern, email-native): what the AOP WOULD do on a
// real past thread vs what the team ACTUALLY did. Pure - UI renders the rows.
import type { TraceStepDef } from './trace';

export interface CaseActions {
  tags?: string[];
  replied?: boolean;
  assignedTo?: string;
}

/** Distill the doc's key case actions from a derived trace. */
export function aopWould(trace: TraceStepDef[]): CaseActions {
  const tags = trace
    .filter((s) => s.kind === 'action' && s.actionId === 'tag' && s.meta)
    .flatMap((s) => s.meta!.split(',').map((t) => t.trim()))
    .filter(Boolean);
  const replied = trace.some(
    (s) => s.kind === 'action' && (s.actionId === 'draft_reply' || s.actionId === 'send_reply'),
  );
  const assignedTo = trace.find((s) => s.kind === 'action' && s.actionId === 'assign')?.meta;
  return {
    tags: tags.length ? tags : undefined,
    replied: replied || undefined,
    assignedTo,
  };
}

export interface CompareRow {
  aspect: string;
  would: string;
  did: string;
  match: boolean;
}

const sameTags = (a: string[] = [], b: string[] = []) =>
  a.length === b.length && [...a].sort().every((t, i) => t === [...b].sort()[i]);

/** Row-per-aspect comparison + plain-language difference phrases. Aspects absent
 *  on BOTH sides are omitted. '-' marks "did nothing" on one side. */
export function compareCase(
  would: CaseActions,
  did: CaseActions,
): { rows: CompareRow[]; differs: string[] } {
  const rows: CompareRow[] = [];
  const differs: string[] = [];

  if (would.tags || did.tags) {
    const match = sameTags(would.tags, did.tags);
    rows.push({
      aspect: 'Tags',
      would: would.tags?.join(', ') ?? '-',
      did: did.tags?.join(', ') ?? '-',
      match,
    });
    if (!match) differs.push(`tagged differently (team: ${did.tags?.join(', ') ?? 'none'})`);
  }
  if (would.replied || did.replied) {
    const match = !!would.replied === !!did.replied;
    rows.push({
      aspect: 'Reply',
      would: would.replied ? 'drafts a reply' : '-',
      did: did.replied ? 'replied' : '-',
      match,
    });
    if (!match) differs.push(did.replied ? 'the team also replied' : 'the team did not reply');
  }
  if (would.assignedTo || did.assignedTo) {
    const match = (would.assignedTo ?? '') === (did.assignedTo ?? '');
    rows.push({
      aspect: 'Assignment',
      would: would.assignedTo ?? '-',
      did: did.assignedTo ?? '-',
      match,
    });
    if (!match)
      differs.push(
        did.assignedTo
          ? `the team also assigned it to ${did.assignedTo}`
          : 'the team left it unassigned',
      );
  }
  return { rows, differs };
}
```

Run `npm test` - expected: PASS.

- [ ] **Step 4: `BacktestCompare.tsx`**

```tsx
'use client';

// "AOP would have" vs "Your team did" - the backtest payoff on a recent-email
// result card. Row-per-aspect match/differs markers + one plain-language verdict;
// a difference offers "Adjust the AOP for this case" (pre-fills the Copilot).
import { RiCheckLine, RiArrowLeftRightLine } from 'react-icons/ri';
import type { CompareRow } from './backtest';
import styles from './BacktestCompare.module.css';

interface Props {
  rows: CompareRow[];
  differs: string[];
  onAdjust?: () => void;
}

export default function BacktestCompare({ rows, differs, onAdjust }: Props) {
  if (rows.length === 0) return null;
  const clean = differs.length === 0;
  return (
    <div className={styles.compare}>
      <div className={styles.grid}>
        <span className={styles.colHead}>AOP would have</span>
        <span className={styles.colHead}>Your team did</span>
        <span aria-hidden />
        {rows.map((r) => (
          <Row key={r.aspect} row={r} />
        ))}
      </div>
      <p className={styles.verdict} data-clean={clean || undefined}>
        {clean
          ? 'Matches what your team did.'
          : `Differs - ${differs.join('; ')}.`}
      </p>
      {!clean && onAdjust && (
        <button type="button" className={styles.adjust} onClick={onAdjust}>
          Adjust the AOP for this case
        </button>
      )}
    </div>
  );
}

function Row({ row }: { row: CompareRow }) {
  return (
    <>
      <span className={styles.cell}>
        <span className={styles.aspect}>{row.aspect}</span>
        {row.would}
      </span>
      <span className={styles.cell}>
        <span className={styles.aspect}>{row.aspect}</span>
        {row.did}
      </span>
      <span className={styles.mark} data-match={row.match || undefined} aria-label={row.match ? 'Match' : 'Differs'}>
        {row.match ? <RiCheckLine aria-hidden /> : <RiArrowLeftRightLine aria-hidden />}
      </span>
    </>
  );
}
```

`BacktestCompare.module.css`:

```css
/* Two-column compare + a trailing match marker per row. Quiet card - hairline,
   no chunky borders. */
.compare {
  margin-top: 10px;
  border: 1px solid var(--hairline-soft);
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--card);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 22px;
  gap: 6px 12px;
  align-items: start;
}
.colHead {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}
.cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: var(--fs-small);
  color: var(--ink-soft);
}
.aspect {
  font-size: 11px;
  color: var(--muted);
}
.mark {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-top: 12px;
  color: #b7791f;
  background: rgba(183, 121, 31, 0.1);
}
.mark[data-match] {
  color: var(--state-ok);
  background: rgba(31, 157, 97, 0.1);
}
.mark svg { width: 12px; height: 12px; }
.verdict {
  margin: 10px 0 0;
  font-size: var(--fs-small);
  color: #b7791f;
}
.verdict[data-clean] { color: var(--state-ok); }
.adjust {
  margin-top: 8px;
  border: none;
  background: transparent;
  padding: 0;
  font-size: var(--fs-small);
  font-weight: 500;
  color: var(--accent);
  cursor: pointer;
}
.adjust:hover { text-decoration: underline; }
```

- [ ] **Step 5: Render it on the result card**

`EmailCard.tsx`: add prop `backtest?: { rows: CompareRow[]; differs: string[]; onAdjust?: () => void };` (import the type from `./backtest`, the component from `./BacktestCompare`). Render it right after the RunOutcome block (before the divider), only when the run resolved:

```tsx
          {run!.status !== 'running' && backtest && (
            <BacktestCompare rows={backtest.rows} differs={backtest.differs} onAdjust={backtest.onAdjust} />
          )}
```

`RecentEmails.tsx`: props gains `onAdjustCase?: (subject: string, differs: string[]) => void;`. Where the result cards render (the `running` branch), build the compare:

```tsx
                {(() => {
                  const run = running ? runs[e.id] : undefined;
                  const cmp =
                    run && run.status !== 'idle' && run.status !== 'running' && e.teamDid
                      ? compareCase(aopWould(run.trace), e.teamDid)
                      : null;
                  return (
                    <EmailCard
                      email={e}
                      run={run}
                      selectable={!running}
                      selected={!!selected[e.id]}
                      onToggleSelect={() => toggle(e.id)}
                      verdict={verdicts[e.id]}
                      onVerdict={(v) => setVerdicts((p) => ({ ...p, [e.id]: v }))}
                      backtest={
                        cmp
                          ? {
                              ...cmp,
                              onAdjust:
                                cmp.differs.length > 0 && onAdjustCase
                                  ? () => onAdjustCase(e.subject, cmp.differs)
                                  : undefined,
                            }
                          : undefined
                      }
                    />
                  );
                })()}
```

(Imports: `import { aopWould, compareCase } from './backtest';`.)

Thread the callback: `SimulatePanel` Props + `onAdjustCase?: (subject: string, differs: string[]) => void;` -> pass to `<RecentEmails ... onAdjustCase={onAdjustCase} />`; `SidePanel` `SimProps` + same.

- [ ] **Step 6: Copilot pre-fill**

`CopilotPanel.tsx`: add to its props interface - `/** Seed the composer (token change applies it): the backtest "Adjust for this case" hook. */ seed?: { text: string; token: number } | null;`. In the component that owns `const [value, setValue] = useState('')` (line ~230), add:

```ts
  useEffect(() => {
    if (seed && seed.text) setValue(seed.text);
  }, [seed?.token]); // eslint-disable-line react-hooks/exhaustive-deps
```

(Pre-fill only - the user sends. If `CopilotPanel` is split into inner components, put the effect in the one owning `value`; pass `seed` down.)

`SidePanel.tsx` `CopilotProps`: add `seed?: { text: string; token: number } | null;` (spread passes it).

`EditorCanvas.tsx`:

```ts
  const [copilotSeed, setCopilotSeed] = useState<{ text: string; token: number } | null>(null);
  const adjustCase = useCallback(
    (subject: string, differs: string[]) => {
      setCopilotSeed((prev) => ({
        text: `On emails like "${subject}", the AOP ${differs.join('; ')}. Suggest a change to handle this case.`,
        token: (prev?.token ?? 0) + 1,
      }));
      setPanelTab('copilot');
    },
    [],
  );
```

Add `seed: copilotSeed` to the SidePanel `copilot={{ ... }}` object and `onAdjustCase: adjustCase` to the `sim={{ ... }}` object (and `onAdjustCase={adjustCase}` on the floating SimulatePanel - it has no Copilot, so there pass `undefined` instead; keep the floating panel without the adjust hook).

- [ ] **Step 7: Gates + drive**

```bash
npm test && npx tsc --noEmit && npx eslint components/simulate components/flow01/copilot
```

Drive `/api-example`: Evaluation -> Recent conversations -> pick a mailbox surfacing re6/re2 (try "Support") -> select 2+ emails incl. one with `teamDid` -> Evaluate. Verify: the compare block renders under the outcome with real rows (Tags row matching `api-error, support` for re6 against the example doc, Assignment differing -> amber marker + "Differs - the team also assigned it to Escalations."), "Adjust the AOP for this case" switches to Copilot with the composer pre-filled (not sent). An email without `teamDid` shows no compare block. Screenshot, verify, delete PNGs.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: recent-conversations backtest with team-did compare + Copilot handoff"
```

---

### Task 8: Full verification pass + PR

**Files:** none new - this is the pre-show gate (see `feedback-craft-depth-bar`: drive the EXACT flows, verify the REAL render).

- [ ] **Step 1: Full driven pass per the spec's verification plan**

On `/canvas` (fresh doc): author a doc with a tag chip + an approval-gated chip + a condition; run all three eval flows; verify the trace mirrors the doc (approval "pauses for approval" marker, branch entry, reasoning lines); fail nothing yet -> Enable shows the untested nudge -> Evaluate first lands on the eval tab. On `/api-example`: fail an email (Server errors topic) -> rollup + caution nudge; pass everything (404 errors only, fresh reload) -> EnableModal status row; edit the doc after a run -> stale note in strip + row. Confirm reduced-motion (emulate via playwright `page.emulateMedia({ reducedMotion: 'reduce' })`) jumps runs to resolved without breaking the rollup.

- [ ] **Step 2: Copy pass**

Every new string: American spelling, no en/em dashes (`-` only), no `§`, proper names (HubSpot, Copilot, AOP). Check the nudge, summary strip, status row, compare block, trace outputs, seed text.

- [ ] **Step 3: Housekeeping**

```bash
find . ~/.playwright-mcp /private/tmp/claude-502 -name "*.png" -newer package.json 2>/dev/null   # then rm each verification PNG
npm test && npx tsc --noEmit && npx eslint components/ app/ data/
git status   # tree clean except intended changes
```

- [ ] **Step 4: Push + PR (auth gotcha)**

The repo + Vercel are owned by `geekv30`; the active `varunk-pd` account cannot push (403):

```bash
gh auth switch --user geekv30
git push -u origin feat/eval-loop
gh pr create --title "Evaluation loop: derived traces, rollup, pre-enable nudge, backtest" --body "$(cat <<'EOF'
Implements the 2026-07-02 spec (docs/superpowers/specs/2026-07-02-eval-nudge-loop-design.md):
- deriveTrace: evaluation runs walk the real document (branch-aware; approval-gated chips show the pause marker; scripted failures land on real steps)
- Eval aggregate + n-of-m summary strip with content-signature staleness
- Pre-enable nudge (untested / failures variants, always skippable) + EnableModal status row
- Recent-conversations backtest: AOP-would-have vs your-team-did compare + Copilot pre-fill

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
gh auth switch --user varunk-pd   # restore
```

- [ ] **Step 5: Adversarial self-review on the PR** (per `feedback-self-review-prs`)

Review the full diff as a hostile reviewer: reusability (wipe-canvas: does a doc with ONLY prose steps produce a sane trace? only chips? condition-only?), stale-closure risks in the run engine, SSR safety (no window at module scope), copy, dead code (any `SIM_TRACE` remnants). Post findings as PR comments, fix them, re-run gates. Then STOP - merge only on Varun's go-ahead.

---

## Verification loop recipe (playwright-core, local)

The Design QA MCP browser is remote and cannot reach localhost. Recreate the local loop (session scratchpad dies on /clear):

```bash
cd <scratchpad> && npm init -y && npm i playwright-core
CHROME_EXE="/Users/varunkelkar/Library/Caches/ms-playwright/chromium_headless_shell-1148/chrome-mac/headless_shell"
```

Node script pattern: `chromium.launch({ executablePath: CHROME_EXE, headless: true })` -> `browser.newPage({ deviceScaleFactor: 2 })` -> `goto('http://localhost:3000/api-example')` -> `waitForTimeout(1500)` -> click through the real flow (`page.click`, `page.getByRole`) -> `page.screenshot({ clip })` -> Read the PNG (the Read tool renders images) -> **delete the PNGs when done**. Dev server: ask Varun to run `cd prototype && npm run dev` (agent-started background servers get reaped between turns).
