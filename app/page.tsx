import Link from 'next/link';
import { RiSparkling2Line, RiFileList3Line, RiPlugLine, RiArrowRightLine } from 'react-icons/ri';
import styles from './page.module.css';

// The three prototype experiences. Generic, config-driven - one card renderer.
const PROTOTYPES = [
  {
    href: '/canvas',
    tag: 'Cold start',
    name: 'Draft with AI',
    desc: 'Begin on an empty canvas. Describe the procedure in plain language and Copilot drafts the trigger, the steps, and the reply.',
    Icon: RiSparkling2Line,
  },
  {
    href: '/api-example',
    tag: 'Pre-built',
    name: 'Worked example',
    desc: 'A finished API-error-triage AOP with the Copilot and Evaluation panels live - the quickest way to see the whole experience.',
    Icon: RiFileList3Line,
  },
  {
    href: '/connector-setup',
    tag: 'Connector flow',
    name: 'Connector setup',
    desc: 'Add a connector that still needs setting up, then walk the connect flow end to end - auth, tools, and the action picker.',
    Icon: RiPlugLine,
  },
] as const;

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <span className={styles.eyebrow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hiver-mark.png" alt="" className={styles.mark} />
            Hiver
          </span>
          <h1 className={styles.title}>AOP</h1>
          <p className={styles.sub}>
            AI Operating Procedures. Three prototypes to explore - the AI builder, a worked
            example, and the connector setup flow.
          </p>
        </header>

        <ul className={styles.grid}>
          {PROTOTYPES.map((p) => (
            <li key={p.href} className={styles.cell}>
              <Link href={p.href} className={styles.card}>
                <span className={styles.cardTop}>
                  <span className={styles.cardIco}>
                    <p.Icon aria-hidden />
                  </span>
                  <span className={styles.cardTag}>{p.tag}</span>
                </span>
                <span className={styles.cardName}>{p.name}</span>
                <span className={styles.cardDesc}>{p.desc}</span>
                <span className={styles.cardCta}>
                  Open
                  <RiArrowRightLine aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <footer className={styles.foot}>
          <Link href="/atoms" className={styles.footLink}>
            Component library
            <RiArrowRightLine aria-hidden />
          </Link>
        </footer>
      </div>
    </main>
  );
}
