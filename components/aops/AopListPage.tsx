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
  RiDeleteBinLine,
} from 'react-icons/ri';
import GmailBar from '@/components/flow01/GmailBar';
import OutcomeBar from '@/components/runs/OutcomeBar';
import { countBy } from '@/components/runs/runsModel';
import { NOW, RUN_SOURCES, runsForSkill, runsInLastDays } from '@/data/runFixtures';
import { mailboxName } from '@/data/mailboxes';
import { useIsClient } from '@/components/runs/useIsClient';
import Badge from '@/components/atoms/Badge';
import Table, { type TableColumn } from '@/components/atoms/Table';
import DeleteSkillModal from './DeleteSkillModal';
import { SparkleIcon } from '@/components/icons/ui';
import styles from './AopListPage.module.css';

/**
 * The rows come from RUN_SOURCES - the same definitions the Runs surfaces read.
 * They used to be a separate hardcoded list, which let this page claim mailboxes
 * and last-run times that the run history disagreed with.
 */
interface AopRow {
  id: string;
  name: string;
  active: boolean;
  mailboxes: string[];
  more?: number;
  lastUpdated: string;
  href: string;
}

const SEED_ROWS: AopRow[] = RUN_SOURCES.map((s) => ({
  id: s.skillId,
  name: s.skillName,
  active: s.status === 'active',
  mailboxes: s.mailboxes.map(mailboxName),
  more: s.moreMailboxes,
  lastUpdated: s.lastUpdated,
  href: s.href,
}));

/** "2 hrs ago" for the newest run - read off the history rather than stored on
 *  the row, so the count and the time can never disagree. */
function sinceLabel(t: number): string {
  const mins = Math.max(1, Math.round((NOW - t) / 60_000));
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

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
  'Skills',
  'AI Tools',
  'Knowledge Sources',
  'AI Insights',
  'AI Usage',
  'Opportunities',
];

/**
 * The skill entry point (Figma 1312:14506): the Admin Panel list of AI Operating
 * Procedures inside the Hiver Admin chrome (Gmail bar + main nav + Hiver AI
 * nav). Two states, one renderer: `empty` shows the meet-Skills banner + the
 * create-first shell; otherwise the live table. Connector health surfaces only
 * inside the Enable / Publish review flows (inline fixes) - no standalone
 * Connectors entry point.
 */
export default function AopListPage({ empty }: { empty?: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState<AopRow[]>(empty ? [] : SEED_ROWS);
  // "12 mins ago" is computed from the clock, and this page is prerendered -
  // the server would bake a build-time answer the browser then contradicts.
  const isClient = useIsClient();

  const activeCount = rows.filter((r) => r.active).length;
  const inactiveCount = rows.length - activeCount;
  const showEmpty = rows.length === 0;

  const [pendingDelete, setPendingDelete] = useState<AopRow | null>(null);
  const deleteRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const columns: TableColumn<AopRow>[] = [
    {
      id: 'skill',
      header: 'Skills',
      grow: true,
      cell: (row) => (
        <Link href={row.href} className={styles.skillName}>
          {row.name}
        </Link>
      ),
    },
    {
      id: 'status',
      header: 'Deployment status',
      cell: (row) =>
        row.active ? <Badge intent="green">Active</Badge> : <Badge intent="gray">Inactive</Badge>,
    },
    {
      id: 'mapped',
      header: 'Mapped to',
      cell: (row) =>
        row.mailboxes.length > 0 ? (
          <span className={styles.tags}>
            {row.mailboxes.map((mb) => (
              <span key={mb} className={styles.tag} title={mb}>
                <span className={styles.tagText}>{mb}</span>
              </span>
            ))}
            {row.more ? <Badge intent="gray">+{row.more}</Badge> : null}
          </span>
        ) : (
          <span className={styles.soft}>Unassigned</span>
        ),
    },
    {
      id: 'history',
      header: 'Skill history · 30d',
      cell: (row) => {
        // Client-only: the counts are read off the clock (see isClient).
        if (!isClient) return <span className={styles.history} />;
        // "No runs yet" only for a skill that has never run; one that went quiet
        // this month shows 0 over an empty rule, beside its real last run.
        if (runsForSkill(row.id).length === 0) return <span className={styles.soft}>No runs yet</span>;
        const runs = runsInLastDays(row.id, 30);
        return (
          <button
            type="button"
            className={`${styles.history} ${styles.historyBtn}`}
            onClick={() =>
              router.push(row.id === 'api-error-triage' ? `${row.href}/runs` : `/aops/runs?skill=${row.id}`)
            }
            aria-label={`${runs.length} runs in the last 30 days for ${row.name}`}
          >
            <span className={styles.historyN}>{runs.length}</span>
            <OutcomeBar counts={countBy(runs)} />
          </button>
        );
      },
    },
    {
      id: 'lastRun',
      header: 'Last run',
      cell: (row) => {
        if (!isClient) return null;
        const last = runsForSkill(row.id)[0];
        return last ? (
          <span className={styles.default}>{sinceLabel(last.startedAt)}</span>
        ) : (
          <span className={styles.soft}>Never</span>
        );
      },
    },
    { id: 'updated', header: 'Last updated', cell: (row) => row.lastUpdated },
    {
      id: 'actions',
      srHeader: 'Actions',
      actions: true,
      cell: (row) => (
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setPendingDelete(row)}
          aria-label={`Delete ${row.name}`}
        >
          <RiDeleteBinLine aria-hidden />
        </button>
      ),
    },
  ];

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
                data-active={label === 'Skills' || undefined}
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
                <h1 className={styles.title}>Skills</h1>
                <p className={styles.subtitle}>
                  Automate complex workflows with step-by-step instructions for Hiver.
                </p>
              </div>
              <div className={styles.headerActions}>
                <Link href="/aops/new" className={styles.newBtn}>
                  <RiAddLine aria-hidden />
                  New skill
                </Link>
              </div>
            </div>
            {!showEmpty && (
              <p className={styles.countLine}>
                <span>
                  {rows.length} {rows.length === 1 ? 'skill' : 'skills'}
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
                  <h2 className={styles.bannerTitle}>Meet Skills</h2>
                  <p className={styles.bannerBody}>
                    Enhance your workflow with Skills. Automate tasks like email
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

              <Table
                ariaLabel="Skills"
                columns={columns}
                rows={rows}
                rowKey={(r) => r.id}
                empty={
                  <div className={styles.emptyBody}>
                    <span className={styles.emptyArt} aria-hidden>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/aop-empty-illustration.png" alt="" />
                    </span>
                    <p className={styles.emptyTitle}>Create your first skill</p>
                    <Link href="/aops/new" className={styles.newBtn}>
                      <RiAddLine aria-hidden />
                      Create New
                    </Link>
                  </div>
                }
              />
            </>
          ) : (
            <Table
              ariaLabel="Skills"
              columns={columns}
              rows={rows}
              rowKey={(r) => r.id}
              onRowClick={(r) => router.push(r.href)}
            />
          )}
        </main>
      </div>

      {pendingDelete && (
        <DeleteSkillModal
          name={pendingDelete.name}
          onConfirm={() => deleteRow(pendingDelete.id)}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
