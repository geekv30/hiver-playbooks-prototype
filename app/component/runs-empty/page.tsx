'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import Toolbar from '@/components/flow01/Toolbar';
import RunsView from '@/components/runs/RunsView';
import type { RunsSkill } from '@/components/runs/NoRunsYet';
import { useIsClient } from '@/components/runs/useIsClient';
import { startOfDay } from '@/components/runs/runsModel';
import { NOW, RUN_SOURCES, liveSpan, runsForSkill, type SkillRun } from '@/data/runFixtures';
import styles from './page.module.css';

/* Runs, when there is not much to show - every case as a short document:
 * when it happens, what it did before, what it does now, the copy, and the
 * REAL components rendering it (Toolbar, RunsView), so what is reviewed here
 * is what ships. Each case links to the same state in the app. */

const TRIGGER = 'When a customer asks for a refund on an order placed in the last 30 days.';
const DAY = 86_400_000;
const noop = () => {};

function Bar({ status, runs }: { status: 'draft' | 'active' | 'paused'; runs: boolean }) {
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
        onToggleRuns={runs ? noop : undefined}
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

type Tag = 'Ships' | 'Decision';

interface Case {
  area: string;
  title: string;
  tag: Tag;
  when: string;
  before: string;
  now: string;
  copy?: [string, string][];
  /** The case, rendered. Absent when it lives on another screen (see `tries`). */
  Render?: () => ReactNode;
  tries: [string, string][];
  note?: string;
}

export default function RunsEmptyDoc() {
  const isClient = useIsClient();

  const quietRuns = useMemo(() => runsForSkill('api-error-triage').filter((r) => r.startedAt < NOW - 10 * DAY), []);
  const noFailsThisWeek = useMemo(
    () => runsForSkill('api-error-triage').filter((r) => !(r.state === 'failed' && r.startedAt >= NOW - 8 * DAY)),
    [],
  );
  const neverFails = useMemo(() => runsForSkill('refund-requests'), []);

  const seeded = (id: string): { runs: SkillRun[]; skill: RunsSkill } => {
    const src = RUN_SOURCES.find((x) => x.skillId === id)!;
    return {
      runs: runsForSkill(id),
      skill: { status: src.status, mailboxes: src.mailboxes, trigger: src.trigger, ...liveSpan(id) },
    };
  };

  const live: RunsSkill = { status: 'active', mailboxes: ['billing', 'refunds'], trigger: TRIGGER, liveSince: NOW - 47 * 60_000 };
  const pausedZero: RunsSkill = { status: 'paused', mailboxes: ['billing'], trigger: TRIGGER, liveSince: NOW - 3 * DAY, pausedAt: NOW - 26 * 3_600_000 };
  const draft: RunsSkill = { status: 'draft', mailboxes: [], trigger: TRIGGER };
  // Live for longer than any window, so no day is hatched.
  const settled: RunsSkill = { status: 'active', mailboxes: ['support', 'sales'], trigger: TRIGGER };

  const CASES: Case[] = [
    {
      area: 'Runs button',
      title: 'A skill that is still a draft',
      tag: 'Ships',
      when: 'You just created a skill and have not enabled it.',
      before: 'No Runs button on any skill you created, even after Enable. On the Skills list a draft read "No runs yet" and "Never", as if it could have run.',
      now: 'No Runs button on a draft; it appears the moment the skill goes live, in the same slot, and stays when paused, with no number until there is one. On the Skills list a draft\'s Skill history and Last run show a quiet dash: the status column already says Draft.',
      Render: () => (
        <div className={styles.bars}>
          <p className={styles.frameLabel}>Draft</p>
          <Bar status="draft" runs={false} />
          <p className={styles.frameLabel}>Live or paused</p>
          <Bar status="active" runs />
        </div>
      ),
      tries: [['Draft skill', '/aops/seed/nps-followups'], ['Live skill', '/aops/seed/contract-renewals'], ['NPS follow-ups row on the Skills list', '/aops']],
    },
    {
      area: 'Before the first run',
      title: 'Live, but nothing has matched yet',
      tag: 'Ships',
      when: 'The skill is enabled and waiting. The most common state right after Enable.',
      before: 'A skill you created had no Runs page. Had one opened, it would have been an empty chart, an empty list and an empty detail: three ways of saying nothing.',
      now: 'One card: where it is listening and since when, and a way to check what would match instead of waiting. The dot breathes because the skill is doing something.',
      copy: [['All ears, no emails yet', 'Watching Billing and Refunds since 12:27 PM. The first match lands here.']],
      Render: () => (
        <Stage>
          <RunsView runs={[]} skill={live} onCheckMatches={noop} />
        </Stage>
      ),
      tries: [['Contract renewal reminders', '/aops/seed/contract-renewals/runs']],
    },
    {
      area: 'Before the first run',
      title: 'Paused before anything matched',
      tag: 'Ships',
      when: 'Someone enabled the skill, nothing matched, and they paused it.',
      before: 'No Runs page, same gap as case 02.',
      now: 'Says it never ran, so "paused" is not read as "paused and lost its history".',
      copy: [['Clocked out before its first shift', 'Paused yesterday at 9:30 AM. Nothing matched while it was on.']],
      Render: () => (
        <Stage>
          <RunsView runs={[]} skill={pausedZero} />
        </Stage>
      ),
      tries: [],
    },
    {
      area: 'Before the first run',
      title: 'A draft opened by a link',
      tag: 'Ships',
      when: 'Only by URL, since drafts have no Runs button (case 01).',
      before: 'No such page.',
      now: 'One line on why there is nothing. The breadcrumb leads back to the editor.',
      copy: [['Nothing to see. Yet.', 'Enable this skill and its runs show up here.']],
      Render: () => (
        <Stage>
          <RunsView runs={[]} skill={draft} />
        </Stage>
      ),
      tries: [['NPS follow-ups (draft)', '/aops/seed/nps-followups/runs']],
    },
    {
      area: 'The chart',
      title: 'Days before the skill was live',
      tag: 'Ships',
      when: 'A skill enabled recently, viewed over a range longer than it has existed.',
      before: 'Those days were drawn as empty days, which reads as a quiet skill. Nothing could have run on them.',
      now: 'The days before Enable are hatched and labeled "Not live yet". Hovering one says the same.',
      Render: () => {
        const { runs, skill } = seeded('welcome-onboarding');
        return (
          <Stage tall>
            <RunsView runs={runs} skill={skill} initialFilter={{ days: 30 }} />
          </Stage>
        );
      },
      tries: [['Onboarding welcome', '/aops/seed/welcome-onboarding/runs']],
    },
    {
      area: 'The chart',
      title: 'Days since the skill was paused',
      tag: 'Ships',
      when: 'A paused skill with history.',
      before: 'Runs simply stopped, with nothing to say why. It looked like a skill that broke.',
      now: 'The days since the pause are hatched and labeled "Paused". Runs from before it stay fully readable.',
      Render: () => {
        const { runs, skill } = seeded('feature-requests');
        return (
          <Stage tall>
            <RunsView runs={runs} skill={skill} initialFilter={{ days: 30 }} />
          </Stage>
        );
      },
      tries: [['Feature request routing (switch to 30d)', '/aops/seed/feature-requests/runs']],
    },
    {
      area: 'Health',
      title: 'Live, but gone quiet',
      tag: 'Ships',
      when: 'Still switched on, but no run in 7 days or more. Usually a trigger that stopped matching, or a mailbox that came loose.',
      before: 'Nothing. The row said Active and "11 days ago", and no one would notice.',
      now: 'One line above the chart, with the way to check. On the Skills list the row gets an amber Quiet badge beside its last run. It names the date, not "N days", so it can never disagree with the list.',
      copy: [['Suspiciously quiet.', 'Still on, but nothing since Sep 26. Check the trigger or the mailbox.']],
      Render: () => {
        const { runs, skill } = seeded('invoice-disputes');
        return (
          <Stage tall>
            <RunsView runs={runs} skill={skill} initialFilter={{ days: 30 }} onCheckMatches={noop} />
          </Stage>
        );
      },
      tries: [['Invoice disputes', '/aops/seed/invoice-disputes/runs'], ['The Quiet badge on the Skills list', '/aops']],
    },
    {
      area: 'Filters',
      title: 'A filter that matches nothing, with some further back',
      tag: 'Ships',
      when: 'An outcome is picked, then the range or mailbox changes under it and its count drops to 0. Your screenshot.',
      before: '"No conversations match these filters" in the list beside "Runs of this Skill will show up here" in the detail: two panes, two different empty things. And the picked chip went disabled at 0, so it could not be turned off.',
      now: 'One statement across the log: what it looked for, a line about the runs that are there, and at most two ways out, with counts. The picked chip stays clickable and readable at 0.',
      copy: [
        ['Nothing failed in the last 7 days', 'Not one of the 23 runs here tripped.'],
        ["Nobody's waiting on approval in the last 7 days", 'Approvals: inbox zero.'],
        ['No drafts turned down in the last 7 days', 'Nobody said no to a single draft.'],
        ['Nothing completed in the last 7 days', 'None of the 23 runs here made it to the end. Worth a look.'],
      ],
      Render: () => (
        <Stage tall>
          <RunsView runs={noFailsThisWeek} skill={settled} initialFilter={{ state: 'failed' }} />
        </Stage>
      ),
      tries: [['API error triage: pick 30d, then Failed, then 7d', '/api-example/runs']],
      note: '"Completed" stays serious on purpose: zero completed runs is a real problem. Scroll the frame to reach the log.',
    },
    {
      area: 'Filters',
      title: 'A filter that matches nothing at all',
      tag: 'Ships',
      when: 'No range on offer holds the picked outcome either.',
      before: 'Same as case 08.',
      now: 'Only the way out that shows something: "Show all N runs".',
      copy: [['Nothing failed in the last 90 days', 'Not one of the 216 runs here tripped.']],
      Render: () => (
        <Stage tall>
          <RunsView runs={neverFails} skill={settled} initialFilter={{ state: 'failed', days: 90 }} />
        </Stage>
      ),
      tries: [],
    },
    {
      area: 'Filters',
      title: 'A picked day or mailbox with no runs',
      tag: 'Ships',
      when: 'Clicking an empty day on the chart, or a mailbox with nothing in the range.',
      before: '"No runs match these filters. Try a wider time range, or clear a filter above."',
      now: 'Names the day or the mailbox, one short line, and Clear filters.',
      copy: [
        ['No runs on Oct 3', 'A quiet day off.'],
        ['No runs in Billing in the last 7 days', 'Not a peep from this one.'],
      ],
      Render: () => (
        <Stage tall>
          <RunsView
            runs={quietRuns}
            skill={{ ...settled, status: 'paused' }}
            initialFilter={{ day: startOfDay(NOW - 3 * DAY) }}
          />
        </Stage>
      ),
      tries: [['Click an empty day on the chart', '/aops/seed/shipping-delays/runs']],
    },
    {
      area: 'Range',
      title: 'Has run, just not lately',
      tag: 'Ships',
      when: 'Runs opens on 7 days, and the last run is older than that.',
      before: '"No runs yet". False, and alarming.',
      now: 'The date of the last run, and the range that reaches it. On a live skill this comes with the "Suspiciously quiet" line (case 07); a paused skill, as here, gets it alone.',
      copy: [['Crickets for 7 days', 'Last run: Sep 25.']],
      Render: () => (
        <Stage tall>
          <RunsView runs={quietRuns} skill={{ ...settled, status: 'paused' }} />
        </Stage>
      ),
      tries: [['Invoice disputes', '/aops/seed/invoice-disputes/runs']],
    },
    {
      area: 'Skills list',
      title: 'Seeded rows opened a blank editor',
      tag: 'Ships',
      when: 'Clicking any demo skill on the Skills list other than API error triage.',
      before: 'Every one opened the same blank /canvas. "Contract renewal reminders" opened an empty editor that was not it.',
      now: 'Each opens its own skill (name, status, mailboxes, trigger, steps) at /aops/seed/<id>, with its own Runs at /runs. The Skill history cell opens that skill\'s Runs too.',
      tries: [['Skills list', '/aops'], ['Contract renewal reminders', '/aops/seed/contract-renewals']],
      note: '"All skill runs" (/aops/runs) is now reachable only by URL; its last way in was the history cell.',
    },
  ];

  const DECISIONS: [string, string, string?][] = [
    ['Drafts', 'No Runs button; a quiet dash in the run columns on the Skills list.', '01'],
    ['No trigger on empty states', 'Live and paused say what happened in a headline and a line. The live one keeps "See what would match".', '02'],
    ['Matching-emails tooltip', 'Left as it is when arriving from Runs.'],
    ['Quiet threshold', 'A flat 7 days.', '07'],
    ['The copy', 'As written above.'],
  ];

  const num = (i: number) => String(i + 1).padStart(2, '0');

  return (
    <main className={styles.page}>
      <header className={styles.mast}>
        <p className={styles.kicker}>Skill runs · empty states</p>
        <h1 className={styles.h1}>Runs, when there is not much to show</h1>
        <p className={styles.standfirst}>
          Every case where Runs has little or nothing to show: when it happens, what it did before, and what it
          does now. Each frame is the real component.
        </p>
      </header>

      <section className={styles.block}>
        <h2 className={styles.h2}>The cases</h2>
        <ol className={styles.index}>
          {CASES.map((c, i) => (
            <li key={c.title}>
              <span className={styles.indexN}>{num(i)}</span>
              <a href={`#case-${num(i)}`}>{c.title}</a>
              <span className={styles.indexArea}>{c.area}</span>
            </li>
          ))}
        </ol>
      </section>

      {!isClient ? (
        <div className={styles.pending} aria-hidden />
      ) : (
        CASES.map((c, i) => (
          <section key={c.title} id={`case-${num(i)}`} className={styles.case}>
            <div className={styles.text}>
              <p className={styles.qual}>
                Case {num(i)} · {c.area}
                <span className={styles.tag} data-tone={c.tag}>
                  {c.tag}
                </span>
              </p>
              <h2 className={styles.h2}>{c.title}</h2>
              <p className={styles.when}>{c.when}</p>
              <div className={styles.bn}>
                <div>
                  <span className={styles.bnLabel}>Before</span>
                  <p>{c.before}</p>
                </div>
                <div data-now>
                  <span className={styles.bnLabel}>Now</span>
                  <p>{c.now}</p>
                </div>
              </div>
              {c.copy && (
                <ul className={styles.copy}>
                  {c.copy.map(([h, l]) => (
                    <li key={h}>
                      <span className={styles.copyH}>{h}</span>
                      <span className={styles.copyL}>{l}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {c.Render && <c.Render />}

            {(c.tries.length > 0 || c.note) && (
              <div className={styles.text}>
                {c.tries.length > 0 && (
                  <p className={styles.try}>
                    <span>Try it in the app:</span>
                    {c.tries.map(([label, href]) => (
                      <Link key={href + label} href={href}>
                        {label}
                      </Link>
                    ))}
                  </p>
                )}
                {c.note && (
                  <p className={styles.aside}>
                    <b>Note</b>
                    {c.note}
                  </p>
                )}
              </div>
            )}
          </section>
        ))
      )}

      <section className={styles.block}>
        <h2 className={styles.h2}>All the copy in one place</h2>
        <p className={styles.when}>A headline and one line, never a paragraph. The jokes stay on empty states; chart labels stay plain.</p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Case</th>
              <th>Headline</th>
              <th>Line</th>
            </tr>
          </thead>
          <tbody>
            {CASES.flatMap((c, i) =>
              (c.copy ?? []).map(([h, l]) => (
                <tr key={h}>
                  <td className={styles.tdN}>{num(i)}</td>
                  <td className={styles.tdH}>{h}</td>
                  <td className={styles.tdL}>{l}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Decided on Oct 6</h2>
        <ul className={styles.dec}>
          {DECISIONS.map(([t, d, ref]) => (
            <li key={t}>
              <span className={styles.decT}>
                {t}
                {ref && <span className={styles.decRef}>case {ref}</span>}
              </span>
              <span className={styles.decD}>{d}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
