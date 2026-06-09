# Copilot Modal-to-Dock Morph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the cold-start "Draft your AOP with AI" modal and the docked Copilot panel one Copilot in two shapes: the dock is not rendered while the modal is open, and every modal exit morphs (FLIP) into the dock.

**Architecture:** Replace the `coldStartOpen` boolean in `EditorCanvas` with a 3-phase machine (`'hero' | 'morphing' | 'docked'`). In `hero` the modal shows and the dock is unmounted. On any exit (Generate / Start from scratch / X / Esc / scrim) we capture the modal surface rect, mount the dock hidden to measure its rect, run a fixed-position FLIP morph layer from modal-rect to dock-rect (transform + opacity, calm spring), then settle into the real dock. Reduced motion skips the travel and does a plain cross-fade swap. The LHS builder is untouched.

**Tech Stack:** Next.js (see `AGENTS.md`: read `node_modules/next/dist/docs/` before coding), React, CSS modules with existing motion tokens (`--d-enter`, `--d-exit`, `--d-crossfade`, `--ease-snap`), `react-icons/ri`. Motion technique finalized with the `transitions-dev` skill.

**Verification model:** This prototype has no unit-test harness (scripts are `dev`/`build`/`lint`/`start`) and the deliverable is motion + render, so each task is verified by driving the real flow in the browser at `http://localhost:3000/canvas` plus `tsc`/`build` green, per the project's craft bar. No fake unit tests.

**Pre-work (do once before Task 1):**
- Read `node_modules/next/dist/docs/` for anything touching client components / effects / refs that differs from stock Next.
- Invoke the `transitions-dev` skill before Task 3 (the motion task); adapt its FLIP / graceful-close / cross-fade techniques to OUR tokens, never its `_root.css`.
- Confirm dev server is running (`npm run dev`) and `/canvas` returns 200.

---

### Task 1: Stop rendering two Copilots (the core redundancy fix)

The smallest independently-shippable win: while the modal is open, do not render the RHS dock at all. This alone removes the "which box?" trap; the morph (Tasks 2-4) makes the hand-off seamless.

**Files:**
- Modify: `components/flow01/EditorCanvas.tsx` (around `coldStartOpen` state line 253; the `companions ? <SidePanel .../>` block lines 1351-1374)

- [ ] **Step 1: Introduce the phase state, derived from the existing flag**

Replace the boolean with a phase enum (keep `coldStartOpen` as a derived const so existing reads keep working this task):

```tsx
type ColdStartPhase = 'hero' | 'morphing' | 'docked';
const [coldPhase, setColdPhase] = useState<ColdStartPhase>(initialDoc ? 'docked' : 'hero');
const coldStartOpen = coldPhase === 'hero'; // existing reads (introReady, modal mount) unchanged
```

- [ ] **Step 2: Gate the dock so it does not render during `hero`**

In the `companions ?` branch, only mount `SidePanel` when not in the hero phase:

```tsx
{companions ? (
  coldPhase !== 'hero' && (
    <SidePanel
      tab={panelTab}
      onTab={setPanelTab}
      copilot={{ /* ...unchanged... */ introReady: coldPhase === 'docked', /* ... */ }}
      sim={{ /* ...unchanged... */ }}
    />
  )
) : (
  <SimulatePanel /* ...unchanged... */ />
)}
```

- [ ] **Step 3: Browser-verify**

Run: open `http://localhost:3000/canvas` in Playwright.
Expected: the "Draft your AOP with AI" modal is open AND the right-hand Copilot/Evaluation panel is absent (the stage is just the dimmed builder + the modal). Click "Start from scratch": the dock appears (phase -> docked via existing `handleColdStartDismiss`, which we make set `coldPhase` in the next step). For this task it is acceptable that the dock simply pops in; the morph comes later.

- [ ] **Step 4: Point the existing handlers at the phase**

Update both handlers to drive the phase instead of the boolean:

```tsx
const handleColdStartGenerate = useCallback((genDoc, query) => {
  setColdPhase('docked');
  setPanelTab('copilot');
  setCopilotMessages([
    { role: 'user', text: query },
    { role: 'assistant', text: '', thinking: true, steps: COPILOT_THINK_STEPS, stepIdx: 0 },
  ]);
  pendingDoc.current = genDoc;
  setThinkIdx(0);
}, []);
const handleColdStartDismiss = useCallback(() => {
  setColdPhase('docked');
  requestFocus('trigger', false);
}, [requestFocus]);
```

- [ ] **Step 5: tsc + commit**

```bash
npx tsc --noEmit
git add components/flow01/EditorCanvas.tsx
git commit -m "fix(canvas): do not render the dock while the cold-start modal is open"
```

---

### Task 2: Capture both rects + add the morphing phase scaffold

To FLIP, the coordinator needs the modal surface rect (source) and the dock slot rect (target). The modal already keeps `dialogRef`; expose it. The dock rect is measured by mounting the dock hidden during `morphing`.

**Files:**
- Modify: `components/flow01/ColdStartModal.tsx` (props + `dialogRef`)
- Modify: `components/flow01/EditorCanvas.tsx` (morph refs/state, dock-mount during morphing)

- [ ] **Step 1: Let the modal report its surface rect at exit**

Add a `beforeExit` prop the modal calls (with its measured rect) the instant an exit is requested, before any close animation. In `ColdStartModal.tsx`:

```tsx
interface Props {
  onGenerate: (doc: EditorDoc, query: string) => void;
  onDismiss: () => void;
  /** Reports the dialog surface rect at the moment an exit begins, so the host
   *  can morph it into the dock. Called before onGenerate/onDismiss. */
  beforeExit?: (rect: DOMRect) => void;
}
```

In `requestClose` and in the generate path, call `beforeExit?.(dialogRef.current!.getBoundingClientRect())` first. When `beforeExit` is provided, skip the modal's own `dialogOut` travel (the host morph owns the visual) but keep the reduced-motion branch:

```tsx
const requestClose = useCallback(() => {
  if (closing) return;
  const reduce = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (dialogRef.current) beforeExit?.(dialogRef.current.getBoundingClientRect());
  if (reduce || beforeExit) { onDismiss(); return; } // host handles motion (or none)
  setClosing(true);
  window.setTimeout(onDismiss, 150);
}, [onDismiss, closing, beforeExit]);
```

(Mirror the same `beforeExit?.(...)` call at the top of the generate submit path, before `onGenerate`.)

- [ ] **Step 2: Add morph refs + state in EditorCanvas**

```tsx
const morphSrcRect = useRef<DOMRect | null>(null);   // modal surface rect at exit
const dockRef = useRef<HTMLDivElement | null>(null); // wraps SidePanel, for target rect
const [morphRects, setMorphRects] = useState<{ from: DOMRect; to: DOMRect } | null>(null);
```

- [ ] **Step 3: Mount the dock (hidden) during `morphing` so it can be measured and landed into**

Change the gate so the dock is in the tree for both `morphing` and `docked`, wrapped in `dockRef`, and visually hidden while morphing:

```tsx
{companions ? (
  coldPhase !== 'hero' && (
    <div ref={dockRef} data-morphing={coldPhase === 'morphing' || undefined} className={styles.dockSlot}>
      <SidePanel /* ...unchanged props... */ />
    </div>
  )
) : ( /* SimulatePanel unchanged */ )}
```

Add to `EditorCanvas.module.css`:

```css
.dockSlot { display: contents; }
.dockSlot[data-morphing] { visibility: hidden; } /* measurable, not painted; morph layer paints instead */
```

- [ ] **Step 4: Wire `beforeExit` to capture the source rect**

```tsx
<ColdStartModal
  beforeExit={(r) => { morphSrcRect.current = r; }}
  onGenerate={handleColdStartGenerate}
  onDismiss={handleColdStartDismiss}
/>
```

- [ ] **Step 5: tsc + commit**

```bash
npx tsc --noEmit
git add components/flow01/ColdStartModal.tsx components/flow01/EditorCanvas.tsx components/flow01/EditorCanvas.module.css
git commit -m "feat(canvas): capture modal + dock rects, scaffold the morphing phase"
```

---

### Task 3: Build the FLIP morph layer (invoke transitions-dev here)

A fixed-position overlay that visually travels from the modal rect to the dock rect, transform + opacity only, while hero content fades out and dock content fades in. Tune timing/easing in the browser via the `transitions-dev` skill.

**Files:**
- Create: `components/flow01/copilot/CopilotMorph.tsx`
- Create: `components/flow01/copilot/CopilotMorph.module.css`
- Modify: `components/flow01/EditorCanvas.tsx` (render the morph during `morphing`)

- [ ] **Step 1: Invoke the transitions-dev skill** for the FLIP + cross-fade technique; map its approach onto our tokens (`--ease-snap`, `--d-enter`/`--d-exit`). Do not import its `_root.css`.

- [ ] **Step 2: Create the morph component (FLIP from `from` rect to `to` rect)**

```tsx
'use client';
import { useLayoutEffect, useRef } from 'react';
import styles from './CopilotMorph.module.css';

interface Props { from: DOMRect; to: DOMRect; onDone: () => void; }

/** A throwaway fixed surface that animates from the modal rect to the dock rect.
 *  Transform + opacity only (FLIP): we lay it out AT the destination, then invert
 *  to the source on the first frame and release to identity so it springs home. */
export default function CopilotMorph({ from, to, onDone }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current!;
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const sx = from.width / to.width;
    const sy = from.height / to.height;
    el.style.transformOrigin = 'top left';
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    el.getBoundingClientRect(); // force the inverted first frame
    requestAnimationFrame(() => {
      el.style.transform = 'translate(0,0) scale(1,1)';
    });
    const onEnd = (e: TransitionEvent) => { if (e.propertyName === 'transform') onDone(); };
    el.addEventListener('transitionend', onEnd);
    return () => el.removeEventListener('transitionend', onEnd);
  }, [from, to, onDone]);

  return (
    <div
      ref={ref}
      className={styles.surface}
      style={{ left: to.left, top: to.top, width: to.width, height: to.height }}
      aria-hidden
    >
      <div className={styles.heroLayer} />  {/* fades out: title + describe + chips */}
      <div className={styles.dockLayer} />  {/* fades in: tabs + composer */}
    </div>
  );
}
```

- [ ] **Step 3: Morph CSS (starting point; tune values via transitions-dev in-browser)**

```css
.surface {
  position: fixed;
  z-index: 60; /* above scrim, below toasts */
  background: var(--card);
  border: 1px solid var(--hairline-soft);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(52,60,69,0.04), 0 4px 14px rgba(52,60,69,0.05);
  transition: transform var(--d-enter, 320ms) var(--ease-snap);
  will-change: transform;
}
.heroLayer, .dockLayer { position: absolute; inset: 0; }
.heroLayer { opacity: 1; transition: opacity var(--d-exit, 160ms) var(--ease-snap); }
.dockLayer { opacity: 0; transition: opacity var(--d-crossfade, 180ms) var(--ease-snap) 80ms; }
.surface[data-landing] .heroLayer { opacity: 0; }
.surface[data-landing] .dockLayer { opacity: 1; }
```

(Set `data-landing` on the same `requestAnimationFrame` that releases the transform, so content cross-fades while the surface travels. The hero/dock layers are lightweight visual stand-ins, not the live components; keep them cheap.)

- [ ] **Step 4: Render the morph during `morphing`, then settle**

In `EditorCanvas`, after the modal calls `beforeExit` and a handler sets `coldPhase('morphing')`, measure the dock target in a layout effect and create `morphRects`; render the morph when both rects exist:

```tsx
useLayoutEffect(() => {
  if (coldPhase !== 'morphing') return;
  const to = dockRef.current?.firstElementChild?.getBoundingClientRect();
  const from = morphSrcRect.current;
  if (from && to) setMorphRects({ from, to });
}, [coldPhase]);

{coldPhase === 'morphing' && morphRects && (
  <CopilotMorph
    from={morphRects.from}
    to={morphRects.to}
    onDone={() => { setColdPhase('docked'); setMorphRects(null); }}
  />
)}
```

- [ ] **Step 5: Browser-verify the travel**

Run: open `/canvas`, click the X on the modal.
Expected: the surface glides + shrinks from center to the right dock slot (no width/height jank, transform only), hero content fades out as dock content fades in, and it lands exactly on the real dock with no visible jump or double-panel flash. Confirm transform-only via DevTools (no layout thrash). Iterate timing with transitions-dev until calm (no overshoot).

- [ ] **Step 6: tsc + commit**

```bash
npx tsc --noEmit
git add components/flow01/copilot/CopilotMorph.tsx components/flow01/copilot/CopilotMorph.module.css components/flow01/EditorCanvas.tsx
git commit -m "feat(canvas): FLIP morph the cold-start modal into the dock"
```

---

### Task 4: Route every exit through the morph + reduced-motion + docked intro

**Files:**
- Modify: `components/flow01/EditorCanvas.tsx` (handlers set `morphing`; reduced-motion bypass)
- Modify: `components/flow01/copilot/CopilotPanel.tsx` (one-line intro after blank dismiss; verify existing intro copy is the compact version)

- [ ] **Step 1: Both handlers enter `morphing` (not straight to `docked`)**

```tsx
const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const handleColdStartGenerate = useCallback((genDoc, query) => {
  setPanelTab('copilot');
  setCopilotMessages([
    { role: 'user', text: query },
    { role: 'assistant', text: '', thinking: true, steps: COPILOT_THINK_STEPS, stepIdx: 0 },
  ]);
  pendingDoc.current = genDoc;
  setThinkIdx(0);
  setColdPhase(reduceMotion() ? 'docked' : 'morphing'); // reduced motion = instant swap
}, []);

const handleColdStartDismiss = useCallback(() => {
  setColdPhase(reduceMotion() ? 'docked' : 'morphing');
  requestFocus('trigger', false);
}, [requestFocus]);
```

Note: in reduced motion the dock mounts visible immediately (Task 2's `data-morphing` only hides during the `morphing` phase, which we skip), giving the plain cross-fade swap the spec calls for.

- [ ] **Step 2: Confirm the docked Copilot shows a one-line intro after a blank dismiss**

Read `CopilotPanel.tsx` around the intro block (the "Ask Copilot to build or change it..." copy at line ~477). Ensure that when there are no messages and `introReady`, it renders a single compact line, e.g. "I can add steps, conditions, and connector actions. Just ask." If the current intro is the larger centered block, compress it to one line for the post-dismiss empty state. Keep existing copy if it is already a single line.

- [ ] **Step 3: Browser-verify all five exits**

Run: for each of Generate AOP, Start from scratch, X, Esc, scrim-click - open `/canvas` fresh and trigger the exit.
Expected: each morphs the surface into the dock (Generate then runs the existing thinking animation + fills the builder; the other four land on an empty dock with the one-line intro). No path leaves a blank RHS or a hard-popped panel.

- [ ] **Step 4: Browser-verify reduced motion**

Run: enable `prefers-reduced-motion: reduce` (Playwright `emulateMedia`), repeat one Generate and one dismiss.
Expected: no travel; modal disappears and the dock cross-fades in immediately. No layout jump.

- [ ] **Step 5: tsc + commit**

```bash
npx tsc --noEmit
git add components/flow01/EditorCanvas.tsx components/flow01/copilot/CopilotPanel.tsx
git commit -m "feat(canvas): route all cold-start exits through the morph; reduced-motion + docked intro"
```

---

### Task 5: Full verification, cleanup, PR

**Files:** none (verification + hygiene)

- [ ] **Step 1: Production build green**

Run: `npm run build`
Expected: build succeeds, no type/lint errors.

- [ ] **Step 2: Adversarial browser pass at real zoom**

Drive `/canvas` end to end: cold start -> each exit -> confirm the dock is fully interactive afterward (send a Copilot message, switch to Evaluation tab, author a step in the builder). Confirm no `getComputedStyle`-vs-render discrepancy (verify the actual paint, per the craft bar). Resize the window mid-morph once and confirm it settles to the final dock layout without breaking.

- [ ] **Step 3: Sweep stray screenshots**

Run: remove any `*.png` from the working dir and `.playwright-mcp/` created during verification.

- [ ] **Step 4: Open PR (do not merge without go-ahead)**

```bash
git push -u origin feat/copilot-modal-morph
gh pr create --title "One Copilot: morph the cold-start modal into the docked panel" --body "<self-review summary + before/after + verification notes>"
```

Then run a thorough adversarial self-review of the full diff (per the self-review-every-PR rule) and post it on the PR. Merge to main only with Varun's explicit go-ahead.

---

## Self-Review (against the spec)

- **Single-surface rule** (dock unmounted while modal open) -> Task 1.
- **All exits dock** (Generate / Start from scratch / X / Esc / scrim) -> Task 4 Step 3 (handlers in Task 1/4; X/Esc/scrim already funnel through `requestClose`/`onDismiss` in the modal).
- **FLIP, transform+opacity, calm spring** -> Task 3 (CopilotMorph) + transitions-dev tuning.
- **Content cross-fade + anchor continuity** -> Task 3 Step 3 (hero/dock layers; composer kept at surface bottom in both layouts).
- **Scrim fade + builder un-dim on same beat** -> the modal scrim unmounts with the modal at exit; the builder un-dims because `coldPhase !== 'hero'` removes the dim. Verify timing in Task 3 Step 5; if the scrim cuts too early, fade it on the morph layer's first frame.
- **Reduced motion = cross-fade swap** -> Task 4 Steps 1, 4.
- **One-line docked intro after blank dismiss** -> Task 4 Step 2.
- **Builder untouched / no reverse morph** -> respected; not in any task.

Open risk to watch during build: measuring the dock target rect requires the dock to have laid out at final size while hidden (Task 2 uses `visibility: hidden`, which preserves layout, not `display:none`). If `display:contents` on `.dockSlot` interferes with measuring `firstElementChild`, measure the `SidePanel`'s own root instead.
