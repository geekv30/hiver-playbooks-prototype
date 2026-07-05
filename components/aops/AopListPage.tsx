'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RiCloseLine,
  RiLayoutGridLine,
  RiInboxLine,
  RiBook2Line,
  RiPriceTag3Line,
  RiBox3Line,
  RiPlug2Line,
  RiGroupLine,
  RiSettings3Line,
  RiArrowDownSLine,
  RiAddLine,
  RiPlugLine,
} from 'react-icons/ri';
import GmailBar from '@/components/flow01/GmailBar';
import Button from '@/components/atoms/Button';
import Toggle from '@/components/atoms/Toggle';
import ConnectorHubModal from '@/components/flow01/enable/ConnectorHubModal';
import { useConnectorHealth, hasConnectorIssues } from '@/components/flow01/connectorHealth';
import { SparkleIcon } from '@/components/icons/ui';
import styles from './AopListPage.module.css';

/** Seeded rows (Figma 1816:18620). Row 1 opens the full API-error journey;
 *  the others link to the remaining demo journeys. */
interface AopRow {
  id: string;
  name: string;
  desc: string;
  active: boolean;
  /** Mailbox chip labels; null = unassigned. */
  mailboxes: string[] | null;
  /** How many more beyond the shown chips (the "+N" chip). */
  more?: number;
  lastRun: string;
  lastUpdated: string;
  href: string;
}

const SEED_ROWS: AopRow[] = [
  {
    id: 'api-error-triage',
    name: 'API error triage',
    desc: 'Runs when an API error is reported',
    active: true,
    mailboxes: ['Support', 'Sales'],
    more: 9,
    lastRun: '2 hrs ago',
    lastUpdated: 'Jul 3, 2026',
    href: '/api-example',
  },
  {
    id: 'refund-handling',
    name: 'Refund handling',
    desc: 'Checks order context before drafting refund replies',
    active: false,
    mailboxes: ['Billing'],
    lastRun: '2 mins ago',
    lastUpdated: 'Jul 3, 2026',
    href: '/canvas',
  },
  {
    id: 'refund-handling-draft',
    name: 'Refund handling',
    desc: 'Checks order context before drafting refund replies',
    active: false,
    mailboxes: null,
    lastRun: '-',
    lastUpdated: 'Jul 3, 2026',
    href: '/connector-setup',
  },
];

const MAIN_NAV = [
  { label: 'Dashboard', icon: RiLayoutGridLine },
  { label: 'Shared Inboxes', icon: RiInboxLine },
  { label: 'Knowledge Base', icon: RiBook2Line },
  { label: 'Hiver AI', icon: SparkleIcon, active: true },
  { label: 'Shared Labels', icon: RiPriceTag3Line },
  { label: 'Custom Objects', icon: RiBox3Line },
  { label: 'Integrations', icon: RiPlug2Line, chevron: true },
  { label: 'Users & Roles', icon: RiGroupLine },
  { label: 'Settings', icon: RiSettings3Line },
];

const AI_NAV = [
  'AI Agents',
  'AI Operating Procedures',
  'AI Tools',
  'Knowledge Sources',
  'AI Insights',
  'AI Usage',
  'Opportunities',
];

/**
 * The AOP entry point (Figma 1312:14506): the Admin Panel list of AI Operating
 * Procedures inside the Hiver Admin chrome (Gmail bar + main nav + Hiver AI
 * nav). Two states, one renderer: `empty` shows the meet-AOP banner + the
 * create-first shell; otherwise the live table. The Connectors button (with a
 * needs-attention dot) is this page's consistent connector-settings placement -
 * the same hub the editor toolbar opens.
 */
export default function AopListPage({ empty }: { empty?: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState<AopRow[]>(empty ? [] : SEED_ROWS);
  const [hubOpen, setHubOpen] = useState(false);
  const health = useConnectorHealth();

  const activeCount = rows.filter((r) => r.active).length;
  const inactiveCount = rows.length - activeCount;
  const showEmpty = rows.length === 0;

  const toggleRow = (id: string, next: boolean) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, active: next } : r)));

  return (
    <div className={styles.page}>
      <GmailBar />
      <div className={styles.shell}>
        {/* ---- Admin Panel main nav ---- */}
        <aside className={styles.mainNav}>
          <div className={styles.mainNavHead}>
            <span className={styles.hiverMark} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hiver-yellow-mark.svg" alt="" />
            </span>
            <span className={styles.mainNavHeadText}>
              <span className={styles.mainNavOverline}>Hiver</span>
              <span className={styles.mainNavTitle}>Admin Panel</span>
            </span>
            <button type="button" className={styles.mainNavClose} aria-label="Close admin panel" tabIndex={-1}>
              <RiCloseLine />
            </button>
          </div>
          <nav className={styles.mainNavMenu} aria-label="Admin panel">
            {MAIN_NAV.map(({ label, icon: Icon, active, chevron }) => (
              <button
                key={label}
                type="button"
                className={styles.mainNavItem}
                data-active={active || undefined}
                data-chevron={chevron || undefined}
              >
                {chevron && <RiArrowDownSLine className={styles.mainNavChevron} aria-hidden />}
                <Icon className={styles.mainNavIcon} aria-hidden />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ---- Hiver AI section nav ---- */}
        <aside className={styles.aiNav}>
          <div className={styles.aiNavHead}>
            <SparkleIcon className={styles.aiNavHeadIcon} aria-hidden />
            <span>Hiver AI</span>
          </div>
          <nav className={styles.aiNavMenu} aria-label="Hiver AI">
            {AI_NAV.map((label) => (
              <button
                key={label}
                type="button"
                className={styles.aiNavItem}
                data-active={label === 'AI Operating Procedures' || undefined}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ---- Page ---- */}
        <main className={styles.main}>
          <header className={styles.header}>
            <div className={styles.titleRow}>
              <div className={styles.titleBlock}>
                <h1 className={styles.title}>AI Operating Procedures</h1>
                <p className={styles.subtitle}>
                  Automate complex workflows with step-by-step instructions for Hiver.
                </p>
              </div>
              <div className={styles.headerActions}>
                <span className={styles.connectorsWrap}>
                  <Button
                    variant="secondary"
                    iconLeft={<RiPlugLine />}
                    onClick={() => setHubOpen(true)}
                  >
                    Connectors
                  </Button>
                  {hasConnectorIssues(health) && <span className={styles.issueDot} aria-hidden />}
                </span>
                <Link href="/aops/new" className={styles.newBtn}>
                  <RiAddLine aria-hidden />
                  New AOP
                </Link>
              </div>
            </div>
            {!showEmpty && (
              <p className={styles.countLine}>
                <span>
                  {rows.length} {rows.length === 1 ? 'procedure' : 'procedures'}
                </span>
                <span className={styles.dotActive} aria-hidden>
                  •
                </span>
                <span>
                  {activeCount} active
                </span>
                <span className={styles.dotInactive} aria-hidden>
                  •
                </span>
                <span>
                  {inactiveCount} inactive
                </span>
              </p>
            )}
          </header>

          {showEmpty ? (
            <>
              <section className={styles.banner}>
                <div className={styles.bannerText}>
                  <h2 className={styles.bannerTitle}>Meet AOP - AI Operating Procedures</h2>
                  <p className={styles.bannerBody}>
                    Enhance your workflow with AI Operating Procedures. Automate tasks like email
                    tagging and reply drafting to boost productivity. Join our early access program
                    for free, and upgrade to the paid add-on whenever you&apos;re ready.{' '}
                    <a href="#" onClick={(e) => e.preventDefault()} className={styles.bannerLink}>
                      Learn more
                    </a>
                    .
                  </p>
                </div>
                <span className={styles.bannerArt} aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/aop-banner-art.svg" alt="" />
                </span>
              </section>

              <section className={styles.table}>
                <div className={styles.tableHead}>
                  <span className={styles.colMain}>AOP</span>
                  <span className={styles.colMain}>Mapped to</span>
                  <span className={styles.colEnd}>Last run</span>
                  <span className={styles.colEnd}>Last updated</span>
                </div>
                <div className={styles.emptyBody}>
                  <span className={styles.emptyArt} aria-hidden>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/aop-empty-illustration.png" alt="" />
                  </span>
                  <p className={styles.emptyTitle}>Create your first AOP</p>
                  <Link href="/aops/new" className={styles.newBtn}>
                    <RiAddLine aria-hidden />
                    Create New
                  </Link>
                </div>
              </section>
            </>
          ) : (
            <section className={styles.table}>
              <div className={styles.tableHead}>
                <span className={styles.colMain}>AOP</span>
                <span className={styles.colMain}>Mapped to</span>
                <span className={styles.colEnd}>Last run</span>
                <span className={styles.colEnd}>Last updated</span>
              </div>
              <ul className={styles.rows}>
                {rows.map((row) => (
                  <li key={row.id}>
                    <div
                      className={styles.row}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(row.href)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(row.href);
                        }
                      }}
                    >
                      <div className={`${styles.colMain} ${styles.cellAop}`}>
                        <Toggle
                          checked={row.active}
                          onChange={(next) => toggleRow(row.id, next)}
                          ariaLabel={`${row.active ? 'Deactivate' : 'Activate'} ${row.name}`}
                        />
                        <span className={styles.aopText}>
                          <span className={styles.aopName}>{row.name}</span>
                          <span className={styles.aopDesc}>{row.desc}</span>
                        </span>
                      </div>
                      <div className={`${styles.colMain} ${styles.cellMapped}`}>
                        {row.mailboxes ? (
                          <>
                            {row.mailboxes.map((mb) => (
                              <span key={mb} className={styles.mbChip}>
                                <span className={styles.mbChipAvatar}>{mb.slice(0, 1)}</span>
                                {mb}
                              </span>
                            ))}
                            {row.more ? <span className={styles.mbChipMore}>+{row.more}</span> : null}
                          </>
                        ) : (
                          <span className={styles.unassigned}>unassigned</span>
                        )}
                      </div>
                      <span className={`${styles.colEnd} ${styles.cellTime}`} data-muted={row.lastRun === '-' || undefined}>
                        {row.lastRun}
                      </span>
                      <span className={`${styles.colEnd} ${styles.cellTime}`}>{row.lastUpdated}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>

      {hubOpen && <ConnectorHubModal onClose={() => setHubOpen(false)} />}
    </div>
  );
}
