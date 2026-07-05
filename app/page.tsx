import Link from 'next/link';
import {
  RiSparkling2Line,
  RiFileList3Line,
  RiPlugLine,
  RiArrowRightLine,
  RiListCheck2,
  RiInboxArchiveLine,
} from 'react-icons/ri';
import styles from './page.module.css';

// The prototype experiences. Generic, config-driven - one card renderer.
const PROTOTYPES = [
  {
    href: '/aops',
    tag: 'Entry point',
    name: 'AOP list',
    desc: 'Where AOP begins in the Admin Panel: every procedure with its status, mailboxes, and run history - plus the Connectors hub.',
    Icon: RiListCheck2,
  },
  {
    href: '/aops/empty',
    tag: 'First run',
    name: 'AOP list - empty',
    desc: 'The same entry point before the first AOP exists: the meet-AOP banner and the create-first moment.',
    Icon: RiInboxArchiveLine,
  },
  {
    href: '/api-example',
    tag: 'Pre-built',
    name: 'Worked example',
    desc: 'A finished API-error-triage AOP with the Copilot and Evaluation panels live, plus the full Enable flow with its readiness review.',
    Icon: RiFileList3Line,
  },
  {
    href: '/canvas',
    tag: 'Cold start',
    name: 'Draft with AI',
    desc: 'Begin on an empty canvas. Describe the procedure in plain language and Copilot drafts the trigger, the steps, and the reply.',
    Icon: RiSparkling2Line,
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
            AI Operating Procedures. Every flow at a glance - the list entry point, the AI
            builder, a worked example, and the connector journeys.
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
