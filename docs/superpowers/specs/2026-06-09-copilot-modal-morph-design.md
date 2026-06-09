# One Copilot, two shapes: morph the cold-start modal into the docked panel

Date: 2026-06-09
Surface: `/canvas` (Gmail AOP builder, `companions` variant)
Status: design approved, spec for review

## Problem

On the empty `/canvas` there are three free-text "tell us in natural language what you
want" inputs visible at once:

1. The cold-start modal "Draft your AOP with AI" (`ColdStartModal.tsx`) - describe the
   whole AOP, then Generate.
2. The builder on the canvas (`EditorCanvas.tsx`) - the "When should this run" trigger
   box and the "What should it do" body. This is the manual authoring path.
3. The docked Copilot panel on the right (`copilot/CopilotPanel.tsx`) - "Ask Copilot to
   build or change this AOP".

A first-time user cannot tell which box to use. The real redundancy is that #1 and #3 do
the **same job** - "AI, build this for me" - in two places at the same time. On an empty
canvas the modal's "Generate AOP" and Copilot's "build this AOP" are the same action.
The builder (#2) is a genuinely different job (write it yourself) and is not the problem.

## Insight

There is only **one** Copilot. It has two presentation shapes:

- A centered **hero** shape (the cold-start modal) for the first, focused moment.
- A **docked** shape (the right-hand panel) for ongoing work.

They must never be shown at the same time. The modal should not "close" and reveal a
second Copilot; it should **become** the docked Copilot through one seamless motion, so
the two read as the same window in two states.

The builder (#2) is left untouched. After this change `/canvas` has two clearly distinct
doors: write it yourself (the builder) versus ask Copilot (the one Copilot surface).

## Design

### Single-surface rule

- While the cold-start modal is open, the right-hand dock (`SidePanel` / Copilot) is
  **not rendered**. The only Copilot on screen is the modal.
- The LHS builder sits dimmed behind the scrim, as today.
- The modal never disappears outright. Every exit path morphs it into the dock.

### Exit paths (all dock)

| Action | Result |
|--------|--------|
| Generate AOP | Build the doc, morph modal -> dock (Copilot tab), LHS un-dims and fills with the generated steps. |
| Start from scratch / X / Esc / scrim click | Morph modal -> dock (empty), LHS un-dims blank for manual authoring, Copilot docked and ready. |

After a blank dismiss, the docked Copilot shows a single-line intro (a compressed
version of today's intro block), not an empty void. Suggested copy: "I can add steps,
conditions, and connector actions. Just ask."

### The morph (motion)

Choreography intent (the `transitions-dev` skill will be invoked at build time to pick
the exact tokens; adapt its techniques to our existing motion tokens, never its
`_root.css`):

- **FLIP, transform + opacity only.** Measure the modal surface rect (centered) and the
  target dock rect (right column). Animate `translate + scale` from the first to the
  last. Never animate width/height.
- **Calm spring**, not a lurch. Honor the "calm and purposeful" motion bar; no
  attention-grabbing overshoot.
- **Content cross-fade.** Hero content (large title, describe textarea, the "or" rule,
  quick-start chips, Upload SOP, the Generate / Start-from-scratch footer) fades out;
  docked content (Copilot | Evaluation tabs, message area, compact "Ask Copilot..."
  composer) fades in, lightly staggered so nothing pops.
- **Anchor continuity.** The input composer is the through-line: the describe textarea
  and the docked "Ask Copilot..." box occupy the same relative position (surface bottom),
  so the eye tracks one element across the move. This is what sells "same Copilot."
- **Scrim + builder.** The scrim fades out as the dock lands; the LHS builder un-dims on
  the same beat.
- **Reduced motion.** Skip the travel entirely; plain cross-fade swap (modal fades out,
  dock fades in). transform/opacity only throughout.

### Out of scope (v1)

- No reverse morph (re-expanding the docked Copilot back into the centered modal). Noted
  as a possible later affordance.
- The Evaluation tab content and the builder internals are unchanged.

## Components and code touchpoints

- `EditorCanvas.tsx`
  - Today `SidePanel` renders whenever `companions` is true, even behind the modal, gated
    only by `introReady: !coldStartOpen`. Change so the dock is not rendered while
    `coldStartOpen` is true, and is mounted as the morph target when the modal exits.
  - Owns the FLIP coordination: capture the modal rect on dismiss, capture the dock rect,
    drive the transition, then settle into the real `SidePanel`.
  - `handleColdStartGenerate` and `handleColdStartDismiss` both route through the same
    "morph then dock" path; Generate additionally applies the generated doc.
- `ColdStartModal.tsx`
  - Becomes the hero shape of the one Copilot. Its exit is no longer a fade-out-to-nothing
    but the start of the morph. May expose its surface ref / measured rect for the FLIP.
- `copilot/CopilotPanel.tsx` / `SidePanel`
  - The docked landing target. The first-frame state after a blank dismiss is the
    one-line intro. No change to its ongoing behavior.
- Likely a small shared coordinator (a hook or wrapper) that owns the two rects and the
  FLIP, so neither component needs to know the other's internals. Keep the boundary clean:
  the modal reports "I am leaving from rect X", the dock reports "I will land at rect Y",
  the coordinator animates between them.

## Edge cases

- **Reduced motion**: cross-fade swap, no travel.
- **Generate while typing**: the describe text is consumed by Generate before the morph;
  the docked composer lands empty.
- **Fast double dismiss** (e.g. Esc spam): the morph is idempotent; a second dismiss is a
  no-op once the dock is settling.
- **Window resize mid-morph**: acceptable to snap to the final dock layout; do not try to
  re-measure mid-flight.
- **Non-companion routes** (`/api-example`): unaffected; they never had the dock.

## Testing / verification

- Drive the real flow in the browser at `http://localhost:3000/canvas` (not a proxy):
  open cold start, confirm the RHS dock is absent while the modal is open, then exercise
  each exit path (Generate, Start from scratch, X, Esc, scrim) and watch the modal morph
  into the dock with no flash of a second panel and no layout jump.
- Verify the LHS un-dims on the same beat and, for Generate, fills with the steps.
- Toggle `prefers-reduced-motion` and confirm the plain cross-fade fallback.
- Confirm transform/opacity-only (no width/height animation) via the real render.
