'use client';

import { useMemo, type ReactNode } from 'react';
import Toolbar from '@/components/flow01/Toolbar';
import RunsView from '@/components/runs/RunsView';
import type { RunsSkill } from '@/components/runs/NoRunsYet';
import { useIsClient } from '@/components/runs/useIsClient';
import { NOW, runsForSkill } from '@/data/runFixtures';
import styles from './page.module.css';

/* Runs before there is any history, and the states around it - every one
 * rendered with the REAL components (Toolbar, RunsView), so what is reviewed
 * here is what ships. */

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
  // A skill whose last run is older than the opening 7-day window: the
  // flagship's history, cut off ten days back.
  const quietRuns = useMemo(
    () => runsForSkill('api-error-triage').filter((r) => r.startedAt < NOW - 10 * 86_400_000),
    [],
  );

  // The flagship with this week's failures taken out: failures exist further
  // back, so the filtered-empty state has a wider range to offer.
  const noFailsThisWeek = useMemo(
    () =>
      runsForSkill('api-error-triage').filter(
        (r) => !(r.state === 'failed' && r.startedAt >= NOW - 8 * 86_400_000),
      ),
    [],
  );
  const neverFails = useMemo(() => runsForSkill('refund-requests'), []);

  // Stamps relative to the Runs clock, so the copy reads the way
  // it does for someone who just enabled the skill.
  const live: RunsSkill = {
    status: 'active',
    mailboxes: ['billing', 'refunds'],
    trigger: TRIGGER,
    liveSince: NOW - 47 * 60_000,
  };
  const paused: RunsSkill = {
    status: 'paused',
    mailboxes: ['billing'],
    trigger: TRIGGER,
    liveSince: NOW - 3 * 86_400_000,
    pausedAt: NOW - 26 * 3_600_000,
  };
  const draft: RunsSkill = { status: 'draft', mailboxes: [], trigger: TRIGGER };

  const SECTIONS: { title: string; lede: string; items: Item[] }[] = [
    {
      title: 'Is the Runs button there?',
      lede: 'Runs used to appear only for the one seeded skill with history, so a skill you created never got the button, even after you enabled it.',
      items: [
        {
          id: 'draft-hidden',
          name: 'Draft: no Runs button',
          tag: 'Recommended',
          note: 'A draft has never been live, so it cannot have runs. The bar keeps one job: get the skill to Enable. Runs appears the moment the skill goes live, in the same slot.',
          Render: () => <Bar status="draft" runs="hidden" />,
        },
        {
          id: 'draft-shown',
          name: 'Draft: Runs button opens an explanation',
          tag: 'Not chosen',
          note: 'Same position in every state, but for the whole of authoring it leads to a page that only says "not live yet". The state below exists for a pasted /runs link on a draft, not as a destination.',
          Render: () => <Bar status="draft" runs="shown" />,
        },
        {
          id: 'live-shown',
          name: 'Live or paused, never run: Runs, no count',
          tag: 'Ships',
          note: 'Offered from the moment it is enabled, with no number until there is one - "Runs 0" reads as a count of something gone wrong. Paused keeps it too: a paused skill still has a history, or the fact that it has none.',
          Render: () => <Bar status="active" runs="shown" />,
        },
      ],
    },
    {
      title: 'What Runs shows before the first run',
      lede: 'One island in place of the chart and the log. An empty chart, an empty list and an empty detail would be three ways of saying nothing; this says which of three reasons applies.',
      items: [
        {
          id: 'live',
          name: 'Live, waiting for the first match',
          tag: 'Ships',
          note: 'The most common case right after Enable. Says where it is listening and since when, and shows the trigger it is waiting on - if nothing comes in, the trigger is the first thing to check. The dot breathes because the skill is genuinely doing something.',
          Render: () => (
            <Stage>
              <RunsView runs={[]} skill={live} />
            </Stage>
          ),
        },
        {
          id: 'paused',
          name: 'Paused before anything matched',
          tag: 'Ships',
          note: 'Says it never ran while it was on, so "paused" is not mistaken for "paused and lost its history". The way back is Resume, which sits on the editor.',
          Render: () => (
            <Stage>
              <RunsView runs={[]} skill={paused} />
            </Stage>
          ),
        },
        {
          id: 'draft',
          name: 'Draft, reached by a link',
          tag: 'Ships',
          note: 'Only reachable by URL, since the button is not offered. One sentence on why there is nothing, and the breadcrumb leads back.',
          Render: () => (
            <Stage>
              <RunsView runs={[]} skill={draft} />
            </Stage>
          ),
        },
      ],
    },
    {
      title: 'A filter that matches nothing',
      lede: 'An outcome is picked and nothing in view has it - usually because the range or mailbox changed under it. Two panes saying two different empty things ("No conversations match" beside "Runs will show up here") read as a broken page. The whole log says one thing: what it looked for, what is there instead, and the way out.',
      items: [
        {
          id: 'failed-wider',
          name: 'None this week, some further back',
          tag: 'Ships',
          note: 'The sentence is about the runs that ARE here ("None of the 31 runs here failed"), so zero reads as the fact it is. Two ways out: drop the outcome, or widen to the range that holds some - with how many, so the click is not a guess. The picked chip stays clickable at 0; before this it went disabled and could not be turned off.',
          Render: () => (
            <Stage tall>
              <RunsView runs={noFailsThisWeek} skill={live} initialFilter={{ state: 'failed' }} />
            </Stage>
          ),
        },
        {
          id: 'failed-never',
          name: 'None at all in reach',
          tag: 'Ships',
          note: 'No wider range holds one either, so the only way out offered is the one that shows something. No celebration copy - a skill that never fails is the expectation, not news.',
          Render: () => (
            <Stage tall>
              <RunsView runs={neverFails} skill={live} initialFilter={{ state: 'failed', days: 90 }} />
            </Stage>
          ),
        },
      ],
    },
    {
      title: 'Has run, but not in this window',
      lede: 'A case we were getting wrong: Runs opens on 7 days, and a skill whose last run is older than that said "No runs yet" - false, and alarming.',
      items: [
        {
          id: 'quiet',
          name: 'Quiet week',
          tag: 'Ships',
          note: 'The list says when the last run was and offers the range that reaches it. The chart still draws the empty week, because the skill was live through it and the quiet is real.',
          Render: () => (
            <Stage tall>
              <RunsView runs={quietRuns} skill={{ ...live, liveSince: undefined }} />
            </Stage>
          ),
        },
      ],
    },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <p className={styles.eyebrow}>Runs · before the first run</p>
        <h1 className={styles.h1}>A new skill on the Runs page</h1>
        <p className={styles.lede}>
          Every state a skill can be in before it has history, and the one quiet-window case next to
          them. Each frame renders the real Toolbar and RunsView.
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
