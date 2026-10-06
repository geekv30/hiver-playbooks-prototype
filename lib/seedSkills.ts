import { RUN_SOURCES, liveSpan } from '@/data/runFixtures';
import {
  type EditorDoc,
  defaultGuardrails,
  normalizeLine,
  txt,
} from '@/components/flow01/doc';

/**
 * The seeded Skills-list rows as editable skills. Each row used to open the
 * same blank /canvas, so "Contract renewal reminders" opened an empty editor
 * that was not it. Now every seeded row opens its own skill - its title,
 * status, mailboxes, trigger and steps - and its own Runs beside it.
 *
 * Built from RUN_SOURCES, the same definitions the list and Runs read, so the
 * three can never disagree about a skill. Fixed ids keep it hydration-stable.
 */
export function seedDoc(id: string): EditorDoc | null {
  const src = RUN_SOURCES.find((s) => s.skillId === id);
  if (!src) return null;
  return {
    title: src.skillName,
    trigger: normalizeLine([txt(src.trigger)]),
    steps: src.steps.map((text, i) => ({ id: `${id}-s${i + 1}`, body: normalizeLine([txt(text)]) })),
    status: src.status,
    triggerMode: 'automatic',
    mailboxes: src.mailboxes,
    guardrails: defaultGuardrails(),
    ...liveSpan(src),
  };
}

/** Every seeded skill with its own page (the flagship keeps /api-example). */
export const SEED_PAGE_IDS = RUN_SOURCES.filter((s) => s.href.startsWith('/aops/seed/')).map(
  (s) => s.skillId,
);
