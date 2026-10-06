'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RiDeleteBinLine } from 'react-icons/ri';
import OutcomeBar from '@/components/runs/OutcomeBar';
import { countBy } from '@/components/runs/runsModel';
import { NOW, RUN_SOURCES, runsForSkill, runsInLastDays } from '@/data/runFixtures';
import { mailboxName } from '@/data/mailboxes';
import { useIsClient } from '@/components/runs/useIsClient';
import Badge from '@/components/atoms/Badge';
import Table, { type TableColumn } from '@/components/atoms/Table';
import type { DeployStatus } from '@/components/flow01/doc';
import {
  type SavedSkill,
  type Workspace,
  useSkillsStore,
  deleteSkill,
  deleteSeed,
  stashPrompt,
  MAX_URL_PROMPT,
} from '@/lib/skillsStore';
import AdminShell, { shellStyles } from './AdminShell';
import DeleteSkillModal from './DeleteSkillModal';
import SkillsEmptyHero from './empty/SkillsEmptyHero';
import styles from './AopListPage.module.css';

/**
 * One row, from either source: the seeded fixtures (RUN_SOURCES - the same
 * definitions the Runs surfaces read, so a row can't disagree with its run
 * history) or a skill the user created (the skills store).
 */
interface AopRow {
  id: string;
  name: string;
  status: DeployStatus;
  mailboxes: string[];
  more?: number;
  lastUpdated: string;
  href: string;
  /** Created by the user (lives in the store), vs a seeded fixture. */
  saved: boolean;
}

/** Chips shown before the "+N" (the column has room for two). */
const MAILBOX_CHIPS = 2;

const SEED_ROWS: AopRow[] = RUN_SOURCES.map((s) => ({
  id: s.skillId,
  name: s.skillName,
  status: s.status,
  mailboxes: s.mailboxes.map(mailboxName),
  more: s.moreMailboxes,
  lastUpdated: s.lastUpdated,
  href: s.href,
  saved: false,
}));

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function savedRow(s: SavedSkill): AopRow {
  const names = s.doc.mailboxes.map(mailboxName);
  return {
    id: s.id,
    name: s.doc.title.trim() || 'Untitled skill',
    status: s.doc.status,
    mailboxes: names.slice(0, MAILBOX_CHIPS),
    more: names.length > MAILBOX_CHIPS ? names.length - MAILBOX_CHIPS : undefined,
    lastUpdated: DATE.format(s.updatedAt),
    href: `/aops/s/${s.id}`,
    saved: true,
  };
}

/** The same three lifecycle states the editor shows, on the DLS Badge. */
function StatusBadge({ status }: { status: DeployStatus }) {
  if (status === 'active') return <Badge intent="green">Active</Badge>;
  return <Badge intent="gray">{status === 'draft' ? 'Draft' : 'Inactive'}</Badge>;
}

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

/**
 * The Skills list (Figma 3535:86190) inside the Admin frame. Rows are the
 * skills this workspace has made (newest first) plus, on the demo workspace,
 * the seeded fixtures. No rows = the empty state ("What should your skill
 * do?" + templates) in the same body; deleting the last skill brings it back.
 *
 * `empty` picks the workspace that starts with no skills (/aops/empty).
 */
export default function AopListPage({ empty }: { empty?: boolean }) {
  const router = useRouter();
  const workspace: Workspace = empty ? 'empty' : 'demo';
  const store = useSkillsStore();
  // The store is client-only (localStorage) and the clock-derived cells differ
  // between build and load, so the body renders once hydrated - otherwise the
  // empty state would flash before a saved skill's row replaces it.
  const isClient = useIsClient();

  const rows: AopRow[] = [
    ...store.skills.filter((s) => s.workspace === workspace).map(savedRow),
    ...(empty ? [] : SEED_ROWS.filter((r) => !store.deletedSeeds.includes(r.id))),
  ];
  const activeCount = rows.filter((r) => r.status === 'active').length;
  const inactiveCount = rows.length - activeCount;
  const showEmpty = rows.length === 0;
  const q = empty ? '?ws=empty' : '';

  const [pendingDelete, setPendingDelete] = useState<AopRow | null>(null);
  const deleteRow = (row: AopRow) => (row.saved ? deleteSkill(row.id) : deleteSeed(row.id));

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
      cell: (row) => <StatusBadge status={row.status} />,
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
        // A draft has never been live, so it has no history to be empty of.
        // "No runs yet" only for a live or paused skill that has never run; one
        // that went quiet this month shows 0 over an empty rule, beside its real
        // last run.
        if (row.status === 'draft') return <span className={styles.soft}>Not live</span>;
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

  const bar = !isClient ? null : showEmpty ? (
    <>
      <span />
      {/* The prompt below is the AI path, so this is the manual one - a blank
          canvas, not the draft-with-AI modal again. */}
      <Link href={`/aops/new?start=blank${empty ? '&ws=empty' : ''}`} className={shellStyles.secondaryBtn}>
        Create from scratch
      </Link>
    </>
  ) : (
    <>
      <p className={styles.countLine}>
        <span>
          {rows.length} {rows.length === 1 ? 'skill' : 'skills'}
        </span>
        <span className={styles.dotActive} aria-hidden>
          •
        </span>
        <span>{activeCount} active</span>
        <span className={styles.dotInactive} aria-hidden>
          •
        </span>
        <span>{inactiveCount} inactive</span>
      </p>
      <Link href={`/aops/create${q}`} className={shellStyles.primaryBtn}>
        Create Skill
      </Link>
    </>
  );

  return (
    <>
      <AdminShell
        title="Skills"
        subtitle="Add instructions that AI Agents can follow to handle complex customer requests."
        bar={bar}
        bodyEmpty={showEmpty}
      >
        {!isClient ? null : showEmpty ? (
          <SkillsEmptyHero
            onSubmit={({ prompt, starter, fileName }) => router.push(newSkillHref(workspace, prompt, starter?.id, fileName))}
          />
        ) : (
          <Table
            ariaLabel="Skills"
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => router.push(r.href)}
          />
        )}
      </AdminShell>

      {pendingDelete && (
        <DeleteSkillModal
          name={pendingDelete.name}
          onConfirm={() => deleteRow(pendingDelete)}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </>
  );
}

/** The editor, primed with a prompt / template / SOP from the composer. */
export function newSkillHref(
  workspace: Workspace,
  prompt: string,
  templateId?: string,
  fileName?: string | null,
): string {
  const q = new URLSearchParams();
  if (prompt.length > MAX_URL_PROMPT) {
    stashPrompt(prompt);
    q.set('prompt_ref', '1');
  } else if (prompt) {
    q.set('prompt', prompt);
  }
  if (templateId) q.set('template', templateId);
  if (fileName) q.set('sop', fileName);
  if (workspace === 'empty') q.set('ws', 'empty');
  return `/aops/new?${q.toString()}`;
}
