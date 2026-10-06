'use client';

import { useMemo, type ReactNode } from 'react';
import Toolbar from '@/components/flow01/Toolbar';
import RunsView from '@/components/runs/RunsView';
import type { RunsSkill } from '@/components/runs/NoRunsYet';
import { useIsClient } from '@/components/runs/useIsClient';
import { NOW, RUN_SOURCES, liveSpan, runsForSkill } from '@/data/runFixtures';
import styles from './page.module.css';

/* Every empty and not-quite-empty state of Runs, each rendered with the REAL
 * components (Toolbar, RunsView), so what is reviewed here is what ships. */

const TRIGGER = 'When a customer asks for a refund on an order placed in the last 30 days.';
const noop = () => {};

function Bar({ status, runs }: { status: 'draft' | 'active' | 'paused'; runs: 'hidden' | 'shown' }) {
  return (
    <div className={styles.frame}>
      <Toolbar
        title="Refund requests"
        onTitleChange={noop}
        status={status}
        hideSimulate
        onEnable={noop}
        onPause={noop}
        onResume={noop}
        onSettings={noop}
        onBack={noop}
        onToggleRuns={runs === 'shown' ? noop : undefined}
      />
    </div>
  );
}

function Stage({ children, tall }: { children: ReactNode; tall?: boolean }) {
  return (
    <div className={styles.stage} data-tall={tall || undefined}>
      {children}
    </div>
  );
}

interface Item {
  id: string;
  name: string;
  tag?: 'Recommended' | 'Ships' | 'Not chosen' | 'Proposed';
  note: string;
  Render: () => ReactNode;
}

export default function RunsEmptyExhibit() {
  const isClient = useIsClient();
  const DAY = 86_400_000;

  // The flagship's history, cut off ten days back: older runs, none this week.
  const quietRuns = useMemo(() => runsForSkill('api-error-triage').filter((r) => r.startedAt < NOW - 10 * DAY), []);
  // The flagship with this week's failures taken out, so a wider range has some.
  const noFailsThisWeek = useMemo(
    () => runsForSkill('api-error-triage').filter((r) => !(r.state === 'failed' && r.startedAt >= NOW - 8 * DAY)),
    [],
  );
  const neverFails = useMemo(() => runsForSkill('refund-requests'), []);

  /** A seeded skill as Runs sees it: its runs, and its status/span/trigger. */
  const seeded = (id: string) => {
    const src = RUN_SOURCES.find((x) => x.skillId === id)!;
    const skill: RunsSkill = { status: src.status, mailboxes: src.mailboxes, trigger: src.trigger, ...liveSpan(src) };
    return { runs: runsForSkill(id), skill };
  };

  const live: RunsSkill = { status: 'active', mailboxes: ['billing', 'refunds'], trigger: TRIGGER, liveSince: NOW - 47 * 60_000 };
  const paused: RunsSkill = {
    status: 'paused',
    mailboxes: ['billing'],
    trigger: TRIGGER,
    liveSince: NOW - 3 * DAY,
    pausedAt: NOW - 26 * 3_600_000,
  };
  const draft: RunsSkill = { status: 'draft', mailboxes: [], trigger: TRIGGER };
  // Live for longer than any window, so no day is hatched.
  const settled: RunsSkill = { status: 'active', mailboxes: ['support', 'sales'], trigger: TRIGGER };

  const SECTIONS: { title: string; lede: string; items: Item[] }[] = [
    {
      title: 'Is the Runs button there?',
      lede: 'Drafts: no. Live or paused: yes, with no count until there is one.',
      items: [
        {
          id: 'draft-hidden',
          name: 'Draft: no Runs button',
          tag: 'Recommended',
          note: 'A draft cannot have run. The bar keeps one job: Enable.',
          Render: () => <Bar status="draft" runs="hidden" />,
        },
        {
          id: 'draft-shown',
          name: 'Draft: Runs button anyway',
          tag: 'Not chosen',
          note: 'Same slot in every state, but it leads to "nothing yet" for the whole of authoring.',
          Render: () => <Bar status="draft" runs="shown" />,
        },
        {
          id: 'live-shown',
          name: 'Live or paused: Runs, no count',
          tag: 'Ships',
          note: '"Runs 0" reads like an error count. The number appears with the first run.',
          Render: () => <Bar status="active" runs="shown" />,
        },
      ],
    },
    {
      title: 'Before the first run',
      lede: 'One island instead of an empty chart, an empty list and an empty detail.',
      items: [
        {
          id: 'live',
          name: 'Live, nothing matched yet',
          tag: 'Ships',
          note: 'Where it listens, since when, the trigger it waits on, and a way to check what would match instead of waiting.',
          Render: () => (
            <Stage>
              <RunsView runs={[]} skill={live} onCheckMatches={noop} />
            </Stage>
          ),
        },
        {
          id: 'paused',
          name: 'Paused before anything matched',
          tag: 'Ships',
          note: 'Says it never ran, so "paused" is not read as "lost its history".',
          Render: () => (
            <Stage>
              <RunsView runs={[]} skill={paused} />
            </Stage>
          ),
        },
        {
          id: 'draft',
          name: 'Draft, opened by a link',
          tag: 'Ships',
          note: 'Only reachable by URL.',
          Render: () => (
            <Stage>
              <RunsView runs={[]} skill={draft} />
            </Stage>
          ),
        },
      ],
    },
    {
      title: 'Days it could not have run',
      lede: 'Before Enable and after Pause, empty days are not quiet days. The chart hatches them and says why.',
      items: [
        {
          id: 'pre-live',
          name: 'Enabled five days ago',
          tag: 'Ships',
          note: 'Onboarding welcome, at 30 days. Hover a hatched day: "Not live yet".',
          Render: () => {
            const { runs, skill } = seeded('welcome-onboarding');
            return (
              <Stage tall>
                <RunsView runs={runs} skill={skill} initialFilter={{ days: 30 }} />
              </Stage>
            );
          },
        },
        {
          id: 'paused-history',
          name: 'Paused six days ago',
          tag: 'Ships',
          note: 'Feature request routing, at 30 days. Runs stop where the hatch starts.',
          Render: () => {
            const { runs, skill } = seeded('feature-requests');
            return (
              <Stage tall>
                <RunsView runs={runs} skill={skill} initialFilter={{ days: 30 }} />
              </Stage>
            );
          },
        },
      ],
    },
    {
      title: 'Live, but gone quiet',
      lede: 'Still switched on, no runs in a week or more. Usually a trigger that stopped matching or a mailbox that came loose.',
      items: [
        {
          id: 'stalled',
          name: 'Suspiciously quiet',
          tag: 'Ships',
          note: 'Invoice disputes: busy until nine days ago. One line above the chart, and a Quiet badge on its Skills list row.',
          Render: () => {
            const { runs, skill } = seeded('invoice-disputes');
            return (
              <Stage tall>
                <RunsView runs={runs} skill={skill} initialFilter={{ days: 30 }} onCheckMatches={noop} />
              </Stage>
            );
          },
        },
      ],
    },
    {
      title: 'A filter that matches nothing',
      lede: 'One statement across the log, not two panes saying two different empty things.',
      items: [
        {
          id: 'failed-wider',
          name: 'None this week, some further back',
          tag: 'Ships',
          note: 'Two ways out, with counts. The picked chip stays clickable at 0.',
          Render: () => (
            <Stage tall>
              <RunsView runs={noFailsThisWeek} skill={settled} initialFilter={{ state: 'failed' }} />
            </Stage>
          ),
        },
        {
          id: 'failed-never',
          name: 'None at all in reach',
          tag: 'Ships',
          note: 'Only the way out that shows something.',
          Render: () => (
            <Stage tall>
              <RunsView runs={neverFails} skill={settled} initialFilter={{ state: 'failed', days: 90 }} />
            </Stage>
          ),
        },
      ],
    },
    {
      title: 'Has run, just not lately',
      lede: 'It used to say "No runs yet" here. It had.',
      items: [
        {
          id: 'quiet',
          name: 'Crickets this week',
          tag: 'Ships',
          note: 'A skill paused a while back: the last run date, and the range that reaches it. On a live skill this comes with the "Suspiciously quiet" line above.',
          Render: () => (
            <Stage tall>
              <RunsView runs={quietRuns} skill={{ ...settled, status: 'paused' }} />
            </Stage>
          ),
        },
      ],
    },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <p className={styles.eyebrow}>Runs · empty and almost-empty</p>
        <h1 className={styles.h1}>Runs, when there is not much to show</h1>
        <p className={styles.lede}>
          Every frame is the real Toolbar and RunsView. Each seeded row on{' '}
          <a href="/aops">the Skills list</a> now opens its own skill and its own Runs, so all of
          these are also reachable in the app.
        </p>
      </header>

      {!isClient ? (
        <div className={styles.pending} aria-hidden />
      ) : (
        SECTIONS.map((sec) => (
          <section key={sec.title} className={styles.group}>
            <h2 className={styles.groupTitle}>{sec.title}</h2>
            <p className={styles.groupLede}>{sec.lede}</p>
            {sec.items.map(({ id, name, tag, note, Render }) => (
              <div key={id} className={styles.item}>
                <div className={styles.itemHead}>
                  <h3 className={styles.itemName}>{name}</h3>
                  {tag && (
                    <span className={styles.tag} data-tone={tag}>
                      {tag}
                    </span>
                  )}
                </div>
                <p className={styles.note}>{note}</p>
                <Render />
              </div>
            ))}
          </section>
        ))
      )}
    </main>
  );
}
