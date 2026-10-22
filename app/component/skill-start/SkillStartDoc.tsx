'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RiExternalLinkLine } from 'react-icons/ri';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import { normalizeLine, txt } from '@/components/flow01/doc';
import { modeChangeLine, slashChangeLine } from '@/components/flow01/TriggerKind';
import { isStartUi, type StartUi } from '@/components/flow01/startUi';
import StartFrame, { type StartSeed } from '@/components/skillstart/StartFrame';
import { LONG_TRIGGERS } from '@/components/skillstart/longTriggers';
import list from '@/components/skillstart/TriggerStates.module.css';
import styles from './page.module.css';

/* How a skill starts - the options review. One choice (does the skill start on
   its own, or only when someone types its / command in the Assist Agent), four
   layouts for it: today's tabs and three options. Every option is live in the
   full editor and in the frames below; all of them share one renderer
   (components/flow01/TriggerStart). */

const TRIGGER = LONG_TRIGGERS['refund-requests']!;
const SLUG = 'refund-requests';

const live = (over: Partial<StartSeed> = {}): StartSeed => ({
  title: 'Refund requests',
  status: 'active',
  trigger: normalizeLine([txt(TRIGGER)]),
  mode: 'automatic',
  ...over,
});

interface StateDoc {
  id: string;
  title: string;
  when: string;
  seed: StartSeed;
  decision?: string;
}

const COMMON: StateDoc[] = [
  { id: 'automatic', title: 'Live, Automatic', when: 'Enabled with nothing changed.', seed: live() },
  { id: 'manual', title: 'Live, Manual', when: 'The author picks Manual.', seed: live({ mode: 'manual' }) },
  {
    id: 'new',
    title: 'New skill',
    when: 'Someone starts a skill from scratch.',
    seed: { title: 'Untitled skill', status: 'draft', trigger: [txt('')], mode: 'automatic' },
  },
  {
    id: 'changed',
    title: 'Just changed on a live skill',
    when: 'The author picks Manual while the skill is live.',
    seed: live({ mode: 'manual', toast: modeChangeLine('manual', SLUG) }),
    decision: 'Apply at once with Undo (as here), or hold changes until a Save?',
  },
];

const CHIP_STATES: StateDoc[] = [
  { id: 'automatic', title: 'Live, both on', when: 'Enabled with nothing changed.', seed: live() },
  {
    id: 'manual',
    title: 'Live, / only',
    when: 'The author turns off Automatic. The trigger stays and dims.',
    seed: live({ mode: 'manual' }),
  },
  {
    id: 'auto-only',
    title: 'Live, Automatic only',
    when: 'The author keeps the skill out of the Assist Agent.',
    seed: live({ slash: false }),
  },
  {
    id: 'none',
    title: 'Both off',
    when: 'The author turns off both chips.',
    seed: live({ mode: 'manual', slash: false }),
    decision: 'Allow it with a warning (as here), or stop the last chip from turning off and point to Pause?',
  },
  {
    id: 'new',
    title: 'New skill',
    when: 'Someone starts a skill from scratch.',
    seed: { title: 'Untitled skill', status: 'draft', trigger: [txt('')], mode: 'automatic' },
  },
  {
    id: 'changed',
    title: 'Just changed on a live skill',
    when: 'The author turns off the / chip while the skill is live.',
    seed: live({ slash: false, toast: slashChangeLine(false, SLUG, true) }),
  },
];

interface OptionDoc {
  id: StartUi;
  tab: string;
  name: string;
  pitch: string;
  good: string[];
  watch: string[];
  closest: string;
  states: StateDoc[];
}

const OPTIONS: OptionDoc[] = [
  {
    id: 'tabs',
    tab: 'Today',
    name: 'Today: tabs',
    pitch:
      'Automatic and Manual are two tabs under the Trigger label. Manual hides the trigger. This is what ships. People did not understand what the tabs mean.',
    good: ['Small. It adds one row to the editor.', 'Manual hides what does not apply.'],
    watch: ['Tabs usually switch between views, not settings, so the choice does not read as a setting.'],
    closest: 'Cursor rule types (one choice of several).',
    states: COMMON,
  },
  {
    id: 'blocks',
    tab: 'Option 1',
    name: 'Option 1: two blocks',
    pitch:
      'Two choices, and each one holds its own content. Automatic holds the trigger. Manual with / holds the / command. Only the picked choice opens.',
    good: [
      'The trigger sits inside Automatic, so it is clear that the trigger is what Automatic runs on.',
      'The label "Manual with /" says how people start it.',
    ],
    watch: [
      'The section starts with a choice, not with the trigger.',
      'Automatic does not say that people can also type the / command.',
    ],
    closest: 'Cursor rules: each rule type opens its own fields.',
    states: COMMON,
  },
  {
    id: 'radio',
    tab: 'Option 2',
    name: 'Option 2: radio buttons',
    pitch:
      'Automatic and Manual are two radio buttons under the Trigger label. The trigger shows only for Automatic. The i explains both.',
    good: [
      'Radio buttons are the standard control for "pick one of two".',
      'The layout is the same as today, so nothing else on the page moves.',
    ],
    watch: ['The two words must carry the meaning. The i holds the rest.'],
    closest: 'Standard form pattern. Cursor uses the same one-of-several choice.',
    states: COMMON,
  },
  {
    id: 'chips',
    tab: 'Option 3',
    name: 'Option 3: chips',
    pitch:
      'The trigger comes first. Under it, one small chip for each way in: Automatic and the / command. Each chip turns on and off on its own.',
    good: [
      'The trigger stays the first thing in the section.',
      'A skill can run on its own, with /, or both, and the chips show which.',
    ],
    watch: [
      'Both chips can be off. Then the skill does not run, and a warning line says so.',
      'With Automatic off, the trigger stays on screen but does not start the skill.',
    ],
    closest: 'Intercom Fin procedures (the text first, its limits under it). Front (two separate checkboxes).',
    states: CHIP_STATES,
  },
];

const COMPARE: { row: string; cells: Record<StartUi, string> }[] = [
  {
    row: 'What the author sees first',
    cells: { tabs: 'The tabs', blocks: 'The Automatic choice', radio: 'The radio buttons', chips: 'The trigger text' },
  },
  {
    row: 'What the author can set',
    cells: {
      tabs: 'Automatic (also /) or Manual',
      blocks: 'Automatic (also /) or Manual',
      radio: 'Automatic (also /) or Manual',
      chips: 'Automatic, /, both, or neither',
    },
  },
  {
    row: 'The trigger in Manual',
    cells: { tabs: 'Hidden', blocks: 'Hidden in the closed Automatic block', radio: 'Hidden', chips: 'Stays, dimmed' },
  },
  {
    row: 'Control',
    cells: { tabs: 'Tabs', blocks: 'Radio rows', radio: 'Radio buttons', chips: 'On/off chips' },
  },
  {
    row: 'Can it end up not running?',
    cells: { tabs: 'No', blocks: 'No', radio: 'No', chips: 'Yes, with a warning' },
  },
];

const PEERS: { name: string; does: string; href: string }[] = [
  {
    name: 'Intercom Fin',
    does: '"When to use this procedure" is a text field (256 characters). Under it, "Audience targeting" limits the procedure by Channels and Audiences. A newer "When to trigger" section adds event triggers: "Website element click" and "API call".',
    href: 'https://www.intercom.com/help/en/articles/13449439-building-fin-procedures',
  },
  {
    name: 'Front',
    does: 'Copilot\'s New skill dialog has two separate checkboxes: "Use automatically" and "Pin as quick action".',
    href: 'https://help.front.com/en/articles/4848832',
  },
  {
    name: 'Claude Code',
    does: 'Two separate settings per skill: one stops the model from starting it, one hides it from the / menu. Both ways are on by default.',
    href: 'https://code.claude.com/docs/en/skills',
  },
  {
    name: 'Cursor',
    does: 'One choice per rule: "Always Apply", "Apply Intelligently", "Apply to Specific Files" or "Apply Manually". Each choice shows its own fields.',
    href: 'https://cursor.com/docs/context/rules',
  },
  {
    name: 'Zendesk, Ada, Gorgias, Decagon',
    does: 'Automatic only. The AI picks the procedure. Agents cannot start one by name.',
    href: 'https://support.zendesk.com/hc/en-us/articles/9041911005850',
  },
];

const QUESTIONS = [
  'If someone types /refund on an email that does not match, should the skill run anyway, warn them first, or not run?',
  'Does a Manual skill still need mailboxes, or can any agent or admin use it anywhere in Hiver once it is published?',
  'With no trigger, the / menu shows only skill names. Is that enough, or does a Manual skill need a short "When to use" line?',
  'Option 3 only: should a skill be allowed to run on its own but never with / ?',
];

export default function SkillStartDoc() {
  // The option lives in the URL (?o=chips) so a link opens on it.
  const params = useSearchParams();
  const o = params.get('o');
  const active: StartUi = isStartUi(o) ? o : 'tabs';
  const doc = OPTIONS.find((x) => x.id === active)!;
  const choose = (next: StartUi) => {
    const url = new URL(window.location.href);
    url.searchParams.set('o', next);
    window.history.replaceState(null, '', url);
  };

  return (
    <main className={styles.page}>
      <header className={styles.mast}>
        <p className={styles.kicker}>Skill editor/skill details</p>
        <h1 className={styles.h1}>How a skill starts</h1>
        <p className={styles.standfirst}>
          A skill starts in one of two ways. Automatic: Hiver AI runs the skill when an email or chat matches its trigger.
          Manual: the skill runs only when someone types its / command in the Assist Agent. Today the editor shows this choice
          as tabs, and people did not understand them. Here are three other layouts for the same choice. Each one works: open it
          in the full editor, or try its states below.
        </p>
      </header>

      <section className={styles.picker} aria-label="Option">
        <SegmentedControl tabs={OPTIONS.map((x) => ({ id: x.id, label: x.tab }))} active={active} onChange={choose} ariaLabel="Option" />
        <div className={styles.brief} key={active}>
          <h2 className={styles.h2}>{doc.name}</h2>
          <p className={styles.pitch}>{doc.pitch}</p>
          <div className={styles.openRow}>
            <Link className={styles.openLink} href={`/component/skill-start/editor/${active}/refund-requests`} target="_blank">
              Open a live skill in the full editor
              <RiExternalLinkLine aria-hidden />
            </Link>
            <Link className={styles.openLink} href={`/component/skill-start/editor/${active}/nps-followups`} target="_blank">
              Open a draft
              <RiExternalLinkLine aria-hidden />
            </Link>
          </div>
          <dl className={styles.answers}>
            <div className={styles.answer}>
              <dt>What works</dt>
              <dd>
                {doc.good.map((g) => (
                  <span key={g} className={styles.point}>
                    {g}
                  </span>
                ))}
              </dd>
            </div>
            <div className={styles.answer}>
              <dt>What to watch</dt>
              <dd>
                {doc.watch.map((g) => (
                  <span key={g} className={styles.point}>
                    {g}
                  </span>
                ))}
              </dd>
            </div>
            <div className={styles.answer}>
              <dt>Closest to</dt>
              <dd>{doc.closest}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className={styles.states} aria-label="States">
        <div className={styles.statesHead}>
          <h2 className={styles.h2}>States</h2>
          <p className={styles.para}>
            Each frame opens in its state and then works: change the choice, type the trigger, rename the skill, Enable, Pause
            and Resume.
          </p>
        </div>
        <ol className={list.list} key={active}>
          {doc.states.map((s, i) => (
            <li key={s.id} id={`state-${s.id}`} className={list.state}>
              <div className={list.text}>
                <p className={list.n}>{String(i + 1).padStart(2, '0')}</p>
                <h3 className={list.title}>{s.title}</h3>
                <p className={list.when}>{s.when}</p>
                {s.decision && (
                  <p className={list.decision}>
                    <span className={list.tag}>Decision</span>
                    {s.decision}
                  </p>
                )}
              </div>
              <StartFrame ui={active} seed={s.seed} />
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Side by side</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                {OPTIONS.map((x) => (
                  <th key={x.id} data-current={x.id === active || undefined}>
                    {x.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r) => (
                <tr key={r.row}>
                  <th scope="row">{r.row}</th>
                  {OPTIONS.map((x) => (
                    <td key={x.id} data-current={x.id === active || undefined}>
                      {r.cells[x.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>What the peer set does</h2>
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
        <p className={styles.para}>
          Earlier directions (A, B and C) are on{' '}
          <Link href="/component/skill-start/earlier" className={styles.peerName}>
            How a skill starts, earlier directions
          </Link>
          . Every state of today&apos;s tabs is on{' '}
          <Link href="/component/skill-trigger" className={styles.peerName}>
            Trigger: Automatic or Manual
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
