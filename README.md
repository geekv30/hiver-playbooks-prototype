# Hiver Playbooks Prototype

Workflow editor canvas prototype for Hiver Playbooks. Production-grade React port of `../lhs/PLAYBOOKS_EDITOR_CANVAS.html`. Built for Rhys (Walk Japan) to drive and understand the Playbooks feature.

The design contract is the source of truth. If this app and the canvas disagree, the canvas wins.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. The editor needs a viewport of at least 1316px wide.

## What's here

The seeded Walk Japan tour-enquiry playbook loads on first open. Every edit autosaves to `localStorage` on a 600ms debounce. Refresh restores your last state. The overflow kebab menu in the topbar resets to the seeded state.

- `/` in any step body opens the slash menu at the caret (30 actions across 6 buckets).
- `@` opens the ref picker (12 default refs across 3 groups).
- `Cmd+K` (or `Ctrl+K`) opens the global palette centered with a dim backdrop.
- Click a chip to configure it in the right rail Config tab. Unauthed connectors open Setup mode.
- Connect button mocks a 1.5s OAuth flash, then validation re-runs.
- Activate is disabled while any validation rule fails.

## Stack

- Next.js (App Router) on Vercel
- React 19, TypeScript 5.x strict
- CSS Modules with global tokens (no Tailwind, no shadcn)
- `next/font` for Inter + JetBrains Mono
- `localStorage` persistence (no backend)
- No auth, no real connectors, no real action execution

## Project layout

```
app/                Next.js App Router
  page.tsx          Wires every hook to every component
  layout.tsx        Font + metadata shell
  globals.css       Design tokens (canvas, hairlines, type scale)
  fonts.ts          next/font config

components/
  atoms/            Chip, FieldRef, ConnectorTile, Kbd, SectionEyebrow, Toast
  surfaces/         Picker (unified slash/@/Cmd+K), FieldInput, Output
  canvas/           EditorShell, Topbar, LeftNav, RightRail (+ 4 tabs + Setup),
                    CanvasBody, Frontmatter, StepRow, ConditionRow,
                    ApprovalStep, Inserter, EndRow, Jumplist, ValidationStrip,
                    Fragments (shared text/chip/ref/code renderer)
  icons/            connectors/ (5), fields/ (9), ui/ (~35)

data/               seed (Walk Japan), library (actions), refs, connectors, solved
hooks/              usePlaybook, usePicker, useCaretAnchor, useRail, useToast,
                    useGlobalShortcut, useDebounce
lib/                ids, persistence (localStorage), caret, validation
types/              playbook (Playbook, Step, Chip, Fragment, etc.)
```

## Deploy

The app deploys to Vercel from this Git repo.

- Push to `main` → production deploy.
- Push to any branch → preview URL.

To set up Vercel for the first time:

```bash
vercel login
vercel link        # interactive
vercel --prod      # first production deploy
```

## Reset state

In the editor, click the kebab menu in the topbar → confirm the reset. Clears `localStorage` and restores the seeded Walk Japan playbook.

## Source of truth

The design contract for every UI element and interaction lives in the parent `ai-playbooks/` repo:

- `lhs/PLAYBOOKS_EDITOR_CANVAS.html` — the canvas being ported (1752 lines)
- `lhs/PLAYBOOKS_PRODUCTION_TRD.md` — engineering spec for this port
- `lhs/PLAYBOOKS_PRODUCTION_PLAN.md` — 47-task implementation plan that built this
- `lhs/PLAYBOOKS_COMPONENT_*.html` — per-component specs (15 components)

If this app and the design contract disagree, the design contract wins.

## What's NOT here (intentionally)

- Real Hiver SSO / auth
- Real Shopify / HubSpot / Slack / Salesforce / ClickUp OAuth
- Real action execution (no API calls to connector services)
- Multiple playbooks / list page / templates page
- Test workspace / dry-run simulator
- Mobile / tablet (below 1316px shows a desktop-only notice)
- Backend persistence (localStorage only)
- Analytics beyond Vercel's defaults

These are listed in the TRD's "Future work" section.
