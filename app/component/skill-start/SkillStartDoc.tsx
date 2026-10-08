'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import Dropdown from '@/components/atoms/Dropdown';
import EditorPane from '@/components/skillstart/EditorPane';
import HiverSurface from '@/components/skillstart/HiverSurface';
import TriggerStates from '@/components/skillstart/TriggerStates';
import { lineToText, normalizeLine, txt } from '@/components/flow01/doc';
import type { Fragment } from '@/types/playbook';
import {
  DEFAULT_START,
  EDITED_ID,
  EDITED_MAILBOXES,
  EDITED_NAME,
  EDITED_SLUG,
  EDITED_TRIGGER,
  OTHER_SKILLS,
  PEOPLE,
  type Direction,
  type Person,
  type Skill,
  type StartConfig,
  type Surface,
} from '@/components/skillstart/model';
import styles from './page.module.css';

/* How a skill starts - three directions for one question: should a skill start
   on its own, with /skill-name in Copilot, or both, and who decides. Each
   direction is live: change the control on the skill editor/skill details page
   on the left, and Copilot on the right follows. */

interface DirectionDoc {
  id: Direction;
  tab: string;
  name: string;
  pitch: string;
  answers: [string, string][];
  tries: string[];
}

const DIRECTIONS: DirectionDoc[] = [
  {
    id: 'a',
    tab: 'A. Two switches',
    name: 'Two switches',
    pitch:
      'Starting on its own and starting with / are separate, and both are on by default. The trigger does both jobs: it decides when the skill runs on its own, and it is the line people read in the / menu.',
    answers: [
      ['Choices', 'Two switches, both on by default. Both off is allowed, with a warning that the skill never runs.'],
      ['On an email that does not fit', 'Runs, and says the email does not fit the trigger.'],
      ['Where / works', 'On emails and chats in the skill’s mailboxes, the same places it runs on its own.'],
    ],
    tries: [
      'Open Lena’s email about her billing address, type /refund and press Enter twice. It runs, finds nothing to refund, and says the email does not fit.',
      'Open Marco’s email. It is in Support, so Refund requests is not in the / menu.',
      'Turn off "Runs on its own". Priya’s email no longer shows a run, and /refund-requests still works there.',
    ],
  },
  {
    id: 'b',
    tab: 'B. One choice',
    name: 'One choice',
    pitch:
      'One question with three answers: on its own, either way (on its own or with /), or only with /. A skill that only runs with / has no trigger. It has a "When to use" line instead, which is what the / menu shows.',
    answers: [
      ['Choices', 'Three, and one is always picked, so a skill can never be set to never run. Default: either way.'],
      ['On an email that does not fit', 'Runs, no check. The person who typed / is the trigger.'],
      ['Where / works', 'Anywhere Copilot is. Mailboxes only limit where it runs on its own.'],
    ],
    tries: [
      'Pick "Only with /". Trigger becomes "When to use", and editing that line changes the / menu.',
      'Open Marco’s email in Support. Refund requests is in the menu: / works anywhere.',
      'Run it on Lena’s email. It runs without a word about the fit.',
    ],
  },
  {
    id: 'c',
    tab: 'C. Two doors',
    name: 'Two doors',
    pitch:
      'Each way in has its own reach. On its own reaches mailboxes; / reaches people (everyone, a team, or only the author). Copilot checks the open email against each trigger, lists the skills that fit first, and asks before running one that does not.',
    answers: [
      ['Choices', 'Two switches, each with its own reach: effectively three modes, and the author picks who can type it.'],
      ['On an email that does not fit', 'Asks first: "This email does not look like that. Run it anyway?"'],
      ['Where / works', 'Anywhere Copilot is, for the people it is shared with.'],
    ],
    tries: [
      'Type / on Priya’s email. Refund requests is listed under "Fits this email".',
      'Run it on Lena’s email. Copilot asks before it runs.',
      'Set Who to Billing team, then view as Sam from Support. It is gone from his menu.',
    ],
  },
];

const COMPARE: { row: string; a: string; b: string; c: string }[] = [
  {
    row: 'What the author sets',
    a: 'Two switches',
    b: 'One choice of three',
    c: 'Two switches, each with a reach',
  },
  {
    row: 'Default',
    a: 'Both on',
    b: 'Either way',
    c: 'Both on, / for everyone',
  },
  {
    row: 'Trigger of a skill that only runs with /',
    a: 'Stays the trigger, shown in the / menu',
    b: 'Becomes "When to use", shown in the / menu',
    c: 'Stays the trigger, used to suggest it',
  },
  {
    row: '/ on an email that does not fit',
    a: 'Runs, then says so',
    b: 'Runs, no check',
    c: 'Asks first',
  },
  {
    row: 'Where / works',
    a: 'The skill’s mailboxes',
    b: 'Anywhere',
    c: 'Anywhere, for chosen people',
  },
  {
    row: 'Closest to',
    a: 'Front Copilot skills, Claude Code',
    b: 'Cursor rules, Slack workflows',
    c: 'Pylon skills, Intercom Fin',
  },
];

const PEERS: { name: string; does: string; href: string }[] = [
  {
    name: 'Claude Code',
    does: 'Two settings per skill: one stops it from starting on its own, one hides it from the / menu. Both ways are on by default, and the skill’s description is the line the / menu shows.',
    href: 'https://code.claude.com/docs/en/skills',
  },
  {
    name: 'Front',
    does: 'Copilot’s New skill dialog has two checkboxes: "Pin as quick action" and "Use automatically".',
    href: 'https://help.front.com/en/articles/4848832',
  },
  {
    name: 'Pylon',
    does: 'Skills are "Reusable and shareable AI workflows that humans or agents can run": with / in its Assist agent, or on their own. Scoped to the org, teams or people.',
    href: 'https://docs.usepylon.com/pylon-docs/llms-full.txt',
  },
  {
    name: 'Intercom Fin',
    does: 'A procedure starts from what the customer says, from an event, or by a teammate in the Inbox. Teammate-started workflows skip audience rules.',
    href: 'https://www.intercom.com/help/en/articles/13449439-building-fin-procedures',
  },
  {
    name: 'Cursor',
    does: 'One choice per rule: "Always Apply", "Apply Intelligently", "Apply to Specific Files" or "Apply Manually".',
    href: 'https://cursor.com/docs/context/rules',
  },
  {
    name: 'Zendesk, Ada, Gorgias, Decagon',
    does: 'Automatic only. The AI picks the procedure; agents cannot start one by name.',
    href: 'https://support.zendesk.com/hc/en-us/articles/9041911005850',
  },
];

const QUESTIONS = [
  'Should the author get two options (on its own and with /, or with / only) or three (adding "on its own only, never with /")?',
  'If someone types /refund on an email that does not look like a refund case, should the skill run anyway, warn them first, or not run? And for a skill that only runs with /, is its trigger a check before it runs, or just a short description that helps people pick it from the / list?',
  'Does a skill that only runs with / still need to be turned on for specific mailboxes, or can any agent or admin use it anywhere in Hiver once it is published?',
];

const SURFACES: { id: Surface; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'admin', label: 'Admin panel' },
];
const PERSON_OPTIONS = PEOPLE.map((p) => ({ id: p.id, label: `${p.name}, ${p.team}` }));

const isDirection = (v: string | null): v is Direction => v === 'a' || v === 'b' || v === 'c';

export default function SkillStartDoc() {
  // The direction lives in the URL (?d=b) so a link opens on it. replaceState
  // is picked up by useSearchParams, so the URL is the only copy.
  const params = useSearchParams();
  const d = params.get('d');
  const direction: Direction = isDirection(d) ? d : 'a';
  const [configs, setConfigs] = useState<Record<Direction, StartConfig>>(DEFAULT_START);
  const [trigger, setTrigger] = useState<Fragment[]>(() => normalizeLine([txt(EDITED_TRIGGER)]));
  const [surface, setSurface] = useState<Surface>('email');
  const [convId, setConvId] = useState('refund');
  const [personId, setPersonId] = useState<Person['id']>('maya');

  const choose = (next: Direction) => {
    const url = new URL(window.location.href);
    url.searchParams.set('d', next);
    window.history.replaceState(null, '', url);
  };

  const config = configs[direction];
  const triggerText = lineToText(trigger).trim();
  const skills: Skill[] = useMemo(
    () => [
      { id: EDITED_ID, name: EDITED_NAME, slug: EDITED_SLUG, trigger: triggerText || 'No trigger yet', mailboxes: EDITED_MAILBOXES, start: config },
      ...OTHER_SKILLS,
    ],
    [triggerText, config],
  );
  const person = PEOPLE.find((p) => p.id === personId)!;
  const doc = DIRECTIONS.find((d) => d.id === direction)!;

  return (
    <main className={styles.page}>
      <header className={styles.mast}>
        <p className={styles.kicker}>Skill editor/skill details</p>
        <h1 className={styles.h1}>How a skill starts</h1>
        <p className={styles.standfirst}>
          A skill can start in two ways: on its own, when Hiver AI finds an email or chat that fits its trigger, or by hand, when an
          agent or admin types /skill-name in Copilot anywhere in Hiver. Three directions for how the author controls that in the
          trigger, and every state the trigger can be in under each one.
        </p>
      </header>

      <section className={styles.picker} aria-label="Direction">
        <SegmentedControl tabs={DIRECTIONS.map((d) => ({ id: d.id, label: d.tab }))} active={direction} onChange={choose} ariaLabel="Direction" />
        <div className={styles.brief} key={direction}>
          <p className={styles.pitch}>{doc.pitch}</p>
          <dl className={styles.answers}>
            {doc.answers.map(([k, v]) => (
              <div key={k} className={styles.answer}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={styles.states} aria-label="States">
        <div className={styles.statesHead}>
          <h2 className={styles.h2}>Every state of the trigger</h2>
          <p className={styles.para}>
            Each frame opens in its state and then works: flip the switches, type the trigger, rename the skill in the toolbar,
            Enable, Pause and Resume.
          </p>
        </div>
        <TriggerStates direction={direction} />
      </section>

      <details className={styles.copilot}>
        <summary className={styles.copilotSummary}>
          <span className={styles.copilotTitle}>What / does in Copilot</span>
          <span className={styles.copilotSub}>The same setting, seen from an email in Hiver and the admin panel.</span>
        </summary>
      <section className={styles.play} aria-label="Try it">
        <div className={styles.playBar}>
          <p className={styles.paneLabel}>Skill editor/skill details</p>
          <div className={styles.playControls}>
            {direction === 'c' && (
              <Dropdown variant="pill" prefix="Viewing as" options={PERSON_OPTIONS} value={personId} onChange={(id) => setPersonId(id as Person['id'])} ariaLabel="Viewing as" />
            )}
            <div className={styles.surfaceSwitch}>
              <SegmentedControl size="sm" tabs={SURFACES} active={surface} onChange={setSurface} ariaLabel="Where Copilot is" />
            </div>
          </div>
        </div>
        <div className={styles.panes}>
          <EditorPane
            direction={direction}
            config={config}
            onConfig={(next) => setConfigs((prev) => ({ ...prev, [direction]: next }))}
            trigger={trigger}
            onTrigger={setTrigger}
          />
          <HiverSurface direction={direction} surface={surface} convId={convId} onConv={setConvId} skills={skills} person={person} />
        </div>
        <div className={styles.tries}>
          <p className={styles.triesHead}>Try this</p>
          <ol className={styles.triesList}>
            {doc.tries.map((t) => (
              <li key={t}>{t}</li>
            ))}
            <li>Switch to Admin panel. There is no conversation there, so every skill is listed but cannot run. That is the same in all three directions, and a question of its own.</li>
          </ol>
          <p className={styles.note}>Matching is scripted in this prototype: each email fits one skill, whatever the trigger says.</p>
        </div>
      </section>
      </details>

      <section className={styles.block}>
        <h2 className={styles.h2}>Side by side</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                {DIRECTIONS.map((d) => (
                  <th key={d.id} data-current={d.id === direction || undefined}>
                    {d.tab}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r) => (
                <tr key={r.row}>
                  <th scope="row">{r.row}</th>
                  <td data-current={direction === 'a' || undefined}>{r.a}</td>
                  <td data-current={direction === 'b' || undefined}>{r.b}</td>
                  <td data-current={direction === 'c' || undefined}>{r.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>What the peer set does</h2>
        <p className={styles.para}>
          The products closest to this (Claude Code, Front, Pylon) treat &ldquo;can the AI start it&rdquo; and &ldquo;can a person start
          it&rdquo; as two separate settings, both on by default. None of them warns or asks when a person starts a skill on something
          it does not fit: the person counts as the trigger. So C&apos;s confirm, and A&apos;s note, are our own proposals.
        </p>
        <ul className={styles.peers}>
          {PEERS.map((p) => (
            <li key={p.name}>
              <a href={p.href} target="_blank" rel="noreferrer" className={styles.peerName}>
                {p.name}
              </a>
              <span>{p.does}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Open questions for the PM</h2>
        <ol className={styles.questions}>
          {QUESTIONS.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
