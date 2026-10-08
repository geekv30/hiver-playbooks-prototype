'use client';

import { normalizeLine, txt } from '@/components/flow01/doc';
import { StateFrame, changeLine, type FrameSeed } from './TriggerSection';
import { DEFAULT_START, EDITED_MAILBOXES, EDITED_NAME, EDITED_TRIGGER, type Direction, type StartConfig } from './model';
import styles from './TriggerStates.module.css';

const T = () => normalizeLine([txt(EDITED_TRIGGER)]);
const EMPTY = () => [txt('')];

const BOTH: StartConfig = DEFAULT_START.a;
const SLASH_ONLY: StartConfig = { ...BOTH, auto: false };
const AUTO_ONLY: StartConfig = { ...BOTH, slash: false };
const NONE: StartConfig = { ...BOTH, auto: false, slash: false };

const live = (over: Partial<FrameSeed> = {}): FrameSeed => ({
  title: EDITED_NAME,
  status: 'active',
  trigger: T(),
  config: BOTH,
  mailboxes: EDITED_MAILBOXES,
  ...over,
});

interface StateDoc {
  id: string;
  title: string;
  when: string;
  /** What it shows, where it differs by direction. */
  shows: string | Partial<Record<Direction, string>>;
  /** A call to make before this ships. */
  decision?: string;
  /** The state, or null when it cannot happen in this direction. */
  seed: (d: Direction) => FrameSeed | null;
  /** Why it cannot happen, per direction. */
  na?: Partial<Record<Direction, string>>;
}

const STATES: StateDoc[] = [
  {
    id: 'empty',
    title: 'New skill, nothing written',
    when: 'Someone clicks New skill and starts from scratch.',
    shows: {
      a: 'Both switches are on from the start. The / row waits for a name, and both lines say mailboxes come at Enable.',
      b: '"Either way" is picked from the start. The line under it waits for a name and for mailboxes.',
      c: 'Both doors are open from the start. The People row waits for a name.',
    },
    decision: 'Show the start control before there is a trigger, or only once one is written?',
    seed: () => ({ title: 'Untitled skill', status: 'draft', trigger: EMPTY(), config: BOTH, mailboxes: EDITED_MAILBOXES }),
  },
  {
    id: 'draft',
    title: 'Written, not live yet',
    when: 'The trigger and steps are in, Enable has not been clicked.',
    shows: 'The / command comes from the name; rename the skill and it follows. Mailboxes are picked at Enable, so the lines say that instead of naming them.',
    seed: () => ({ ...live(), status: 'draft' }),
  },
  {
    id: 'live',
    title: 'Live, the default',
    when: 'Enabled with nothing changed: it runs on its own and with /.',
    shows: 'The mailboxes picked at Enable, by name.',
    seed: () => live(),
  },
  {
    id: 'slash-only',
    title: 'Live, only with /',
    when: 'The author turns off starting on its own.',
    shows: {
      a: 'The trigger stops starting anything. A quiet line says it now only tells people when to use the skill.',
      b: 'The section is renamed "When to use". The line under it says it needs no mailboxes.',
      c: 'Hiver AI goes grey. A quiet line says the trigger now only tells people when to use the skill.',
    },
    seed: () => live({ config: SLASH_ONLY }),
  },
  {
    id: 'auto-only',
    title: 'Live, only on its own',
    when: 'The author keeps it out of Copilot.',
    shows: {
      a: 'The / switch is off. Nothing else changes.',
      b: '"On its own" picked; the line says it is not in the / menu.',
      c: 'People goes grey and its Who picker hides.',
    },
    seed: () => live({ config: AUTO_ONLY }),
  },
  {
    id: 'both-off',
    title: 'Both off',
    when: 'The author turns off both ways in.',
    shows: 'An amber line: with both off, this skill never runs.',
    decision: 'Allow it with a warning (as here), or stop the last switch from turning off and point to Pause?',
    seed: (d) => (d === 'b' ? null : live({ config: NONE })),
    na: { b: 'Cannot happen in B: one of the three is always picked.' },
  },
  {
    id: 'just-changed',
    title: 'Just changed on a live skill',
    when: 'The author flips a switch while the skill is live.',
    shows: 'It applies at once and says what changed, with Undo, the way Pause does. Try the switches in any live state.',
    decision: 'Apply at once with Undo (as here), or hold changes until a Save?',
    seed: () =>
      live({
        config: SLASH_ONLY,
        toast: { line: changeLine(BOTH, SLASH_ONLY, 'refund-requests', EDITED_MAILBOXES), undo: BOTH },
      }),
  },
  {
    id: 'paused',
    title: 'Paused',
    when: 'Someone clicks Pause.',
    shows: 'A quiet line: nothing starts, on its own or with /, until it resumes. The settings stay editable. Resume in the toolbar.',
    decision: 'Should Pause also take the skill out of the / menu? Here it does.',
    seed: () => live({ status: 'paused' }),
  },
  {
    id: 'slash-empty',
    title: 'Only with /, nothing written',
    when: 'A new skill set to run only with /, before its line is written.',
    shows: {
      a: 'An amber line asks for a trigger: it is what people read in the / menu. Enable stays off.',
      b: 'An amber line asks when to use it: it is what people read in the / menu. Enable stays off.',
      c: 'An amber line asks for a trigger: it is what people read in the / menu. Enable stays off.',
    },
    seed: () => ({ ...live(), status: 'draft', trigger: EMPTY(), config: SLASH_ONLY }),
  },
  {
    id: 'clash',
    title: 'Its / command is taken',
    when: 'The name gives a command another skill already has.',
    shows: 'The command turns red with one line on how to fix it. Rename the skill in the toolbar and it clears.',
    decision: 'Ask for a rename (as here), or quietly add a number, like /api-error-triage-2?',
    seed: () => ({
      title: 'API error triage',
      status: 'draft',
      trigger: normalizeLine([txt('When a customer says an API call is failing.')]),
      config: BOTH,
      mailboxes: EDITED_MAILBOXES,
      clash: true,
    }),
  },
  {
    id: 'only-me',
    title: 'Only the author can use /',
    when: 'The author is trying it out before sharing it.',
    shows: 'Who reads "Only me", with a line on sharing it when it is ready.',
    seed: (d) => (d === 'c' ? live({ config: { ...BOTH, reach: 'me' } }) : null),
    na: {
      a: 'Not in A: / follows the skill’s mailboxes, so there is no per-person setting.',
      b: 'Not in B: / works for everyone.',
    },
  },
];

/* Every state the trigger section can be in, for one direction: when it
   happens, what it shows, the call to make, and the state itself, live. */
export default function TriggerStates({ direction }: { direction: Direction }) {
  return (
    <ol className={styles.list}>
      {STATES.map((s, i) => {
        const seed = s.seed(direction);
        const shows = typeof s.shows === 'string' ? s.shows : s.shows[direction];
        return (
          <li key={s.id} id={`state-${s.id}`} className={styles.state}>
            <div className={styles.text}>
              <p className={styles.n}>{String(i + 1).padStart(2, '0')}</p>
              <h3 className={styles.title}>{s.title}</h3>
              <p className={styles.when}>{s.when}</p>
              {seed && shows && <p className={styles.shows}>{shows}</p>}
              {seed && s.decision && (
                <p className={styles.decision}>
                  <span className={styles.tag}>Decision</span>
                  {s.decision}
                </p>
              )}
            </div>
            {seed ? (
              <StateFrame key={`${direction}-${s.id}`} direction={direction} seed={seed} />
            ) : (
              <p className={styles.na}>{s.na?.[direction]}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
