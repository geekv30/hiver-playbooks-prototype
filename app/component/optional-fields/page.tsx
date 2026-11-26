'use client';

import CustomEval from '@/components/simulate/CustomEval';
import type { OptionalCue } from '@/components/simulate/ComposeEval';
import styles from './page.module.css';

/* How the Custom email card says From and Subject are optional. Every frame
 * is the real CustomEval at the panel's width, with one prop changed, so each
 * option can be typed into, run, and compared as it would ship. */

interface Option {
  key: string;
  cue: OptionalCue;
  name: string;
  how: string;
  tradeoff: string;
  pick?: boolean;
}

const OPTIONS: Option[] = [
  {
    key: 'Today',
    cue: 'none',
    name: 'No cue',
    how: 'What is live now. Only the body is required, but nothing on the card says so.',
    tradeoff: 'From and Subject read as fields you must fill.',
  },
  {
    key: 'A',
    cue: 'tag',
    name: '"Optional" at the end of the row',
    how: 'A quiet grey word at the right of each empty row. When you type, the word goes and the text gets the full width.',
    tradeoff: 'Easy to scan before you type. Unlike B, the hint for what to type stays.',
    pick: true,
  },
  {
    key: 'B',
    cue: 'placeholder',
    name: '"Optional" as the placeholder',
    how: 'The label says what the field is; the empty field says "Optional". iOS forms use this.',
    tradeoff: 'The cleanest card. The cue goes away once you type, and the hint for what to type goes.',
  },
  {
    key: 'C',
    cue: 'reveal',
    name: 'Hidden until asked for',
    how: 'The card starts with only the body. "Sender and subject" in the toolbar shows the rows. Click it again to hide them.',
    tradeoff: 'The strongest signal that they are extra. Fewer people will find them.',
  },
  {
    key: 'D',
    cue: 'note',
    name: 'One line under the card',
    how: 'The rows stay as they are. A caption under the card says they are optional.',
    tradeoff: 'No change to the card. The line is easy to miss, far from the fields.',
  },
];

export default function OptionalFieldsReview() {
  return (
    <main className={styles.page}>
      <header className={styles.mast}>
        <p className={styles.kicker}>Evaluation · Custom email</p>
        <h1 className={styles.h1}>Show that From and Subject are optional</h1>
        <p className={styles.standfirst}>
          Only the body is required to start an evaluation. Four ways to say so, next to the card as it is today. Each
          frame is the real component: type in it, attach files, run it.
        </p>
      </header>

      <div className={styles.grid}>
        {OPTIONS.map((o) => (
          <section key={o.key} className={styles.option} aria-labelledby={`opt-${o.key}`}>
            <div className={styles.meta}>
              <div className={styles.titleRow}>
                <span className={styles.key}>{o.key}</span>
                <h2 id={`opt-${o.key}`} className={styles.h2}>
                  {o.name}
                </h2>
                {o.pick && <span className={styles.pick}>Recommended</span>}
              </div>
              <p className={styles.how}>{o.how}</p>
              <p className={styles.tradeoff}>{o.tradeoff}</p>
            </div>
            <div className={styles.frame}>
              <CustomEval optionalCue={o.cue} />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
