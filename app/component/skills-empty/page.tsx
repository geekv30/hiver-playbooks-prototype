import type { Metadata } from 'next';
import { RiArrowUpLine } from 'react-icons/ri';
import SkillMark, { type SkillMarkVariant } from '@/components/aops/empty/SkillMark';
import type { TemplateCardVariant } from '@/components/aops/empty/TemplateCard';
import TemplateGrid from '@/components/aops/empty/TemplateGrid';
import SkillsEmptyHero from '@/components/aops/empty/SkillsEmptyHero';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Skills empty state · options',
  description: 'Mark and template-card options for the Skills empty state, side by side.',
};

const ROUND_TWO: { card: TemplateCardVariant; name: string; note: string; pick?: boolean }[] = [
  {
    card: 'library',
    name: '2a. Pill = how it replies',
    note: 'Top-right pill says how far the skill goes on its own (drafts, asks for approval, or doesn\'t reply), the way Dugong\'s says "App event" or "Scheduled". Footer: step count and category.',
    pick: true,
  },
  {
    card: 'library-ready',
    name: '2b. Pill = ready in this workspace',
    note: 'Top-right pill says whether it works here today, or the one connector to fix (live connector health). How it replies moves into the footer beside the step count.',
  },
];

const MARKS: { variant: SkillMarkVariant; name: string; note: string; pick?: boolean }[] = [
  {
    variant: 'notebook',
    name: 'A. Notebook + sparkle',
    note: 'The Figma asset as drawn. Reads as "a document", less as "Skills".',
  },
  {
    variant: 'open-book',
    name: 'B. Open book + sparkle',
    note: 'The same open book as the Skills item in the Hiver AI nav, so the empty state echoes the nav. The sparkle settles in once.',
    pick: true,
  },
  {
    variant: 'steps',
    name: 'C. Checklist + sparkle',
    note: 'Says "step-by-step instructions" literally. Clear, but reads closer to a to-do list.',
  },
];

const CARDS: { variant: TemplateCardVariant; name: string; note: string; pick?: boolean }[] = [
  {
    variant: 'footer',
    name: '1. Tools + reply mode in a footer',
    note: 'The Figma card, plus one quiet footer line: the tools it calls on the left, how it replies on the right. Smallest change.',
  },
  {
    variant: 'tools-first',
    name: '2. Tools lead (Zapier / n8n style)',
    note: 'The tool stack replaces the generic glyph, and the footer names them. Strongest "what does this touch" read, but loses the per-template glyph.',
  },
  {
    variant: 'readiness',
    name: '3. Tools + readiness for this workspace',
    note: 'Same layout as 1, but the right side says whether it will work here today: "Ready to use", or the one connector to fix. Reads live connector health (HubSpot needs reauth, Slack is broken in the demo).',
    pick: true,
  },
];

function Hero({ variant }: { variant: SkillMarkVariant }) {
  return (
    <div className={styles.hero}>
      <SkillMark variant={variant} />
      <p className={styles.heroTitle}>What should your skill do?</p>
      <div className={styles.prompt}>
        <span className={styles.promptText}>Describe the workflow in plain English</span>
        <span className={styles.send}>
          <RiArrowUpLine aria-hidden />
        </span>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Skills empty state: options</h1>
        <p className={styles.pageSub}>
          Figma 3038:24511. Every fact on a card is read off the template&apos;s own steps, so no
          card can claim a tool its skill doesn&apos;t use.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Round 2: after Sarvam and Dugong</h2>
        <p className={styles.sectionSub}>
          Clickable. A larger solid mark that fades out behind a 24px heading, a sparkle inside the
          prompt, category filters, and Dugong-shaped cards. Pick a card to fill the prompt with
          its description. Try the filters.
        </p>
        <div className={styles.cardStack}>
          {ROUND_TWO.map((r) => (
            <figure key={r.card} className={styles.cell}>
              <figcaption className={styles.caption}>
                <span className={styles.captionName}>
                  {r.name}
                  {r.pick && <span className={styles.pick}>Recommended</span>}
                </span>
                <span className={styles.captionNote}>{r.note}</span>
              </figcaption>
              <div className={`${styles.frame} ${styles.frameTall}`}>
                <SkillsEmptyHero mark="solid" card={r.card} />
              </div>
            </figure>
          ))}
        </div>
      </section>

      <h2 className={styles.roundTitle}>Round 1</h2>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The faded mark</h2>
        <div className={styles.markGrid}>
          {MARKS.map((m) => (
            <figure key={m.variant} className={styles.cell}>
              <div className={styles.frame}>
                <Hero variant={m.variant} />
              </div>
              <figcaption className={styles.caption}>
                <span className={styles.captionName}>
                  {m.name}
                  {m.pick && <span className={styles.pick}>Recommended</span>}
                </span>
                <span className={styles.captionNote}>{m.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The template card</h2>
        <div className={styles.cardStack}>
          {CARDS.map((c) => (
            <figure key={c.variant} className={styles.cell}>
              <figcaption className={styles.caption}>
                <span className={styles.captionName}>
                  {c.name}
                  {c.pick && <span className={styles.pick}>Recommended</span>}
                </span>
                <span className={styles.captionNote}>{c.note}</span>
              </figcaption>
              <div className={styles.frame}>
                <p className={styles.gridLabel}>Start with a template</p>
                <TemplateGrid variant={c.variant} className={styles.cards} />
              </div>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
