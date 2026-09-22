'use client';

import { useMemo, useState } from 'react';
import { RiRadioButtonLine } from 'react-icons/ri';
import type { RunState } from '@/data/runFixtures';
import { runsForSkill } from '@/data/runFixtures';
import ActivityStrip, { peakOf } from '@/components/runs/ActivityStrip';
import RunStateFilter from '@/components/runs/RunStateFilter';
import { useIsClient } from '@/components/runs/useIsClient';
import {
  DEFAULT_FILTER,
  applyFilter,
  bucketByDay,
  countBy,
  formatDayShort,
  leadState,
} from '@/components/runs/runsModel';
import styles from './page.module.css';

/* Three arrangements of the Runs lead band, same data, same copy, same chart.
 *
 * The shipped band puts a sentence in a left column and the chart in a right
 * one, each with its own label, so the two read as separate widgets sharing a
 * border rather than one statement about the window. These are the ways out.
 *
 * Everything here renders the REAL components (ActivityStrip, RunStateFilter)
 * and the REAL copy (runsModel.leadState) - only the arrangement differs, so
 * the comparison cannot be a comparison of two different sentences. */

const DAYS = 30;

function useWindow() {
  const runs = useMemo(() => runsForSkill('api-error-triage'), []);
  return useMemo(() => {
    const windowRuns = applyFilter(runs, { ...DEFAULT_FILTER, days: DAYS });
    const buckets = bucketByDay(windowRuns, DAYS);
    const counts = countBy(windowRuns);
    return { buckets, counts, lead: leadState(counts, DAYS), peak: peakOf(buckets) };
  }, [runs]);
}

/** The chips row as it ships, so each arrangement is judged with its neighbor. */
function Controls({ counts }: { counts: ReturnType<typeof countBy> }) {
  const [state, setState] = useState<RunState | null>(null);
  return (
    <div className={styles.controls}>
      <RunStateFilter counts={counts} value={state} onChange={setState} />
    </div>
  );
}

function Mark() {
  return <RiRadioButtonLine className={styles.mark} aria-hidden />;
}

/* V1 - one statement, three tiers: state, detail, shape. The mark hangs in the
   gutter (the editor's own idiom) so the title, the sentence, the chart and the
   date axis all start on one content rail. The eyebrow goes - the sentence
   already says what is counted - and the peak stays with the plot, sitting on
   the gridline it labels. */
function V1() {
  const { buckets, counts, lead } = useWindow();
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className={styles.band}>
      <div className={styles.v1}>
        <div className={styles.headRow}>
          <Mark />
          <h3 className={styles.title}>{lead.title}</h3>
        </div>
        <div className={styles.rail}>
          <p className={styles.body}>{lead.body}</p>
          <div className={styles.plot}>
            <ActivityStrip buckets={buckets} picked={picked} onPick={setPicked} caption="peak" />
          </div>
        </div>
      </div>
      <Controls counts={counts} />
    </div>
  );
}

/* V2 - the two columns kept, but bound: one header spans the whole band, so the
   sentence and the chart sit under a single statement instead of facing each
   other. Cheapest to ship and the shortest of the three. */
function V2() {
  const { buckets, counts, lead, peak } = useWindow();
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className={styles.band}>
      <div className={styles.v2}>
        <div className={styles.headRow}>
          <Mark />
          <h3 className={styles.title}>{lead.title}</h3>
          <span className={styles.annot}>
            last {DAYS} days &middot; peak {peak.peak} on {formatDayShort(peak.day)}
          </span>
        </div>
        <div className={styles.v2Cols}>
          <p className={styles.body}>{lead.body}</p>
          <div className={styles.plot}>
            <ActivityStrip buckets={buckets} picked={picked} onPick={setPicked} caption="none" />
          </div>
        </div>
      </div>
      <Controls counts={counts} />
    </div>
  );
}

/* V3 - chart-led: the shape comes first with its own caption, and the sentence
   closes the band as its summary. Two tiers, no bold title at all, so the state
   stops being scannable and becomes something you read. */
function V3() {
  const { buckets, counts, lead } = useWindow();
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className={styles.band}>
      <div className={styles.v3}>
        <ActivityStrip buckets={buckets} picked={picked} onPick={setPicked} />
        <p className={styles.v3Summary}>
          <Mark />
          <span>{lead.body}</span>
        </p>
      </div>
      <Controls counts={counts} />
    </div>
  );
}

const VARIANTS = [
  {
    id: 'v1',
    name: 'One statement, three tiers',
    verdict: 'Text-led',
    note: 'State, then detail, then shape, all on one content rail with the mark hanging in the gutter. The RUNS PER DAY eyebrow goes, because the sentence above it already says what is being counted; the peak stays on the gridline it labels. Tallest of the three at 181px, and 18 of those are the peak row on its own line.',
    Render: V1,
  },
  {
    id: 'v2',
    name: 'Bound columns',
    verdict: 'Shortest',
    note: 'Keeps the side-by-side, but a single header spans the band so the columns hang off one statement rather than opposing each other. Cheapest of the three at 139px against the shipped 137 - and it does not really work: the sentence still wraps in a narrow column, and the space under the title is the same void, now with a header drawn over it. Shown because it is the conservative option and you should see it fail.',
    Render: V2,
  },
  {
    id: 'v3',
    name: 'Chart-led, sentence as the footer',
    verdict: 'Live',
    note: 'The shape leads with its own caption and the sentence closes the band. Tight and genuinely one object: one column, one left edge, and the chart owns the labels it needs. The trade taken knowingly is the headline - there is no bold state line to scan, so the mark carries the state on its own and a tick appears only for a genuinely clean window. This is what ships.',
    Render: V3,
  },
];

export default function RunsLeadIterations() {
  const isClient = useIsClient();

  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <p className={styles.eyebrow}>Runs · lead band</p>
        <h1 className={styles.h1}>Three ways to make the state and the chart one system</h1>
        <p className={styles.lede}>
          The band used to be a sentence in a left column and a chart in a right one, each with its
          own label, separated by a gap: two widgets sharing a border. These are the three ways out
          that were considered, on the same window, the same copy and the same chart, with the
          outcome chips underneath so each arrangement is judged against its neighbor.{' '}
          <strong>03 is live</strong> - the record of the other two is kept here on purpose.
        </p>
      </header>

      {!isClient ? (
        <div className={styles.pending} aria-hidden />
      ) : (
        VARIANTS.map(({ id, name, verdict, note, Render }, i) => (
          <section key={id} className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.h2}>
                <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                {name}
              </h2>
              <span className={styles.tag} data-live={verdict === 'Live' || undefined}>
                {verdict}
              </span>
            </div>
            <p className={styles.note}>{note}</p>
            <Render />
          </section>
        ))
      )}
    </main>
  );
}
