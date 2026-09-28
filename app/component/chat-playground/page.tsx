'use client';

import { useMemo, useState } from 'react';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import { exampleDoc } from '@/components/flow01/doc';
import exhibit from '../eval-channels/page.module.css';
import { useDemoRun, type DemoMode } from './useDemoRun';
import V1Transcript from './V1Transcript';
import V2Widget from './V2Widget';
import V3Verdict from './V3Verdict';
import styles from './page.module.css';

/* Three ways to draw the chat playground. Every panel is the real side panel
 * at its real size, reading the same chat through the same engine, and the
 * steps inside use the trace renderer the email evaluation uses. Only the
 * layout differs. */

const VARIANTS = [
  {
    id: 'v1',
    name: 'Transcript',
    after: 'Linear Agent, Claude, Notion AI',
    note: 'The agent writes on the page with no bubble and no avatar, and the customer sits in a soft grey block on the right. Under each reply, one quiet line names what the skill did ("9 steps · Tag, HubSpot +2") and opens the steps in place. Events and the result share the text’s left edge. The calmest of the three, and the closest to Copilot next door. The cost: it reads less like the chat widget the customer will actually see.',
    Render: V1Transcript,
  },
  {
    id: 'v2',
    name: 'Widget + steps',
    after: 'Intercom Fin Preview',
    note: 'Conversation is the chat exactly as the widget shows it: ink customer bubbles, pale agent bubbles, and nothing else in the thread. Steps is the same chat with each reply’s steps laid in above it, and a reply’s "N steps" link jumps straight there. The result is the one bordered card. The most faithful to the customer’s view. The cost: checking the steps takes a switch instead of a glance.',
    Render: V2Widget,
  },
  {
    id: 'v3',
    name: 'Verdict first',
    after: 'ElevenLabs tests, Sierra and Decagon simulations',
    note: 'Once the chat ends, the answer is pinned at the top: the result, the review’s reason, and the checks it rests on (skill started, every message answered, the review, the rating). Below it, the conversation is the evidence: each reply is labelled with the branch it came from and footed with its steps. Built for judging a run at a glance. The cost: a pinned block takes about 100px from the chat.',
    Render: V3Verdict,
  },
] as const;

function Column({ v, i, mode }: { v: (typeof VARIANTS)[number]; i: number; mode: DemoMode }) {
  const doc = useMemo(() => exampleDoc(), []);
  const run = useDemoRun(mode, doc);
  const { Render } = v;
  return (
    <section className={exhibit.col}>
      <div className={exhibit.sectionHead}>
        <h2 className={exhibit.h2}>
          <span className={exhibit.num}>{String(i + 1).padStart(2, '0')}</span>
          {v.name}
        </h2>
        <span className={exhibit.tag}>After {v.after}</span>
      </div>
      <p className={exhibit.note}>{v.note}</p>
      <p className={exhibit.fit} />
      <Render run={run} doc={doc} />
    </section>
  );
}

export default function ChatPlaygroundExhibit() {
  const [mode, setMode] = useState<DemoMode>('ai');
  return (
    <main className={exhibit.page}>
      <header className={exhibit.pageHead}>
        <p className={exhibit.eyebrow}>Evaluation · chat playground</p>
        <h1 className={exhibit.h1}>Three ways to draw the chat playground</h1>
        <p className={exhibit.lede}>
          Each panel is the real side panel at its real size in a 1440 &times; 900 window. All three show the same
          chat: a live run of the example skill against the AI customer, with its real steps and the live
          review&rsquo;s own reason. Run again replays it beat by beat, so you can see the typing, reviewing and
          ended states. Switch to <strong>You as the customer</strong> to type into each panel yourself (the
          scripted engine replies). The steps inside every panel use the renderer the email evaluation uses, so
          only the layout differs.
        </p>
        <div className={styles.mode}>
          <SegmentedControl
            tabs={[
              { id: 'ai', label: 'AI customer' },
              { id: 'you', label: 'You as the customer' },
            ]}
            active={mode}
            onChange={setMode}
            ariaLabel="Who plays the customer"
          />
        </div>
      </header>

      <div className={`${exhibit.grid} ${styles.grid}`}>
        {VARIANTS.map((v, i) => (
          <Column key={`${v.id}-${mode}`} v={v} i={i} mode={mode} />
        ))}
      </div>
    </main>
  );
}
