'use client';

import Link from 'next/link';
import TriggerStates, { EMPTY, live, type StateDoc } from '@/components/skillstart/TriggerStates';
import { changeLine } from '@/components/skillstart/TriggerSection';
import { DEFAULT_START, EDITED_MAILBOXES, type StartConfig } from '@/components/skillstart/model';
import styles from '../skill-start/page.module.css';

/* Trigger: Describe it or Manual - the simple version of how a skill starts.
   One control under the Trigger label. Describe it runs on its own when a
   conversation matches, and / works too. Manual runs only with /. */

const DESCRIBE: StartConfig = DEFAULT_START.d;
const MANUAL: StartConfig = { ...DESCRIBE, auto: false };

const STATES: StateDoc[] = [
  {
    id: 'empty',
    title: 'New skill, nothing written',
    when: 'Someone clicks New skill and starts from scratch.',
    shows: 'Describe it is picked. The / command comes from the name.',
    seed: () => ({ title: 'Untitled skill', status: 'draft', trigger: EMPTY(), config: DESCRIBE, mailboxes: EDITED_MAILBOXES }),
  },
  {
    id: 'describe',
    title: 'Live, Describe it',
    when: 'Enabled with nothing changed.',
    shows: 'Hiver AI runs the skill when a conversation matches. People can also type the / command.',
    seed: () => live({ config: DESCRIBE }),
  },
  {
    id: 'manual',
    title: 'Live, Manual',
    when: 'The author picks Manual.',
    shows: 'The skill runs only with /. The text stays, and Copilot shows the text in the / menu.',
    seed: () => live({ config: MANUAL }),
  },
  {
    id: 'manual-empty',
    title: 'Manual, nothing written',
    when: 'A new skill set to Manual, before its text is written.',
    shows: 'Enable stays off until the text is written.',
    seed: () => ({ ...live(), status: 'draft', trigger: EMPTY(), config: MANUAL }),
  },
  {
    id: 'just-changed',
    title: 'Just changed on a live skill',
    when: 'The author picks Manual while the skill is live.',
    shows: 'The change applies at once. A message shows what changed, with Undo.',
    decision: 'Apply at once with Undo (as here), or hold changes until a Save?',
    seed: () =>
      live({ config: MANUAL, toast: { line: changeLine(DESCRIBE, MANUAL, 'refund-requests'), undo: DESCRIBE } }),
  },
  {
    id: 'paused',
    title: 'Paused',
    when: 'Someone clicks Pause.',
    shows: 'The toolbar shows Paused. Click Resume to start the skill again.',
    decision: 'Should Pause also take the skill out of the / menu?',
    seed: () => live({ status: 'paused' }),
  },
];

const LEFT_OUT: [string, string][] = [
  ['On its own, never with /', 'Every skill that runs on its own is also in the / menu. Claude Code and Front also start with both on.'],
  ['Both off', 'One option is always picked. To stop a skill, click Pause.'],
  ['A Who menu for /', 'There is no setting per person. Question 2 below decides where / works.'],
];

const QUESTIONS = [
  'If someone types /refund on an email that does not match, should the skill run anyway, warn them first, or not run?',
  'Does a Manual skill still need mailboxes, or can any agent or admin use it anywhere in Hiver once it is published?',
];

export default function SkillTriggerDoc() {
  return (
    <main className={styles.page}>
      <header className={styles.mast}>
        <p className={styles.kicker}>Skill editor/skill details</p>
        <h1 className={styles.h1}>Trigger: Describe it or Manual</h1>
        <p className={styles.standfirst}>
          One control under Trigger. With Describe it, Hiver AI runs the skill when an email or chat matches the text. People can also
          type the / command in Copilot. With Manual, the skill runs only when someone types its / command.
        </p>
        <p className={styles.para}>
          Try it in the full editor:{' '}
          <Link href="/aops/seed/refund-requests" className={styles.peerName}>
            Refund requests (live)
          </Link>{' '}
          or{' '}
          <Link href="/aops/new" className={styles.peerName}>
            a new skill
          </Link>
          . Directions A, B and C are on{' '}
          <Link href="/component/skill-start" className={styles.peerName}>
            How a skill starts
          </Link>
          .
        </p>
      </header>

      <section className={styles.states} aria-label="States">
        <div className={styles.statesHead}>
          <h2 className={styles.h2}>Every state of the trigger</h2>
          <p className={styles.para}>
            Each frame opens in its state and then works: pick Describe it or Manual, type the text, rename the skill in the toolbar,
            Enable, Pause and Resume.
          </p>
        </div>
        <TriggerStates direction="d" states={STATES} />
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>What this leaves out</h2>
        <dl className={styles.answers}>
          {LEFT_OUT.map(([k, v]) => (
            <div key={k} className={styles.answer}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Still open for the PM</h2>
        <ol className={styles.questions}>
          {QUESTIONS.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
