'use client';
import styles from './ArtifactPane.module.css';
import type { Chip, TraceEntry } from '../data';
import { findAction } from '../data';

interface Props {
  chip: Chip | null;
  entry: TraceEntry;
}

/**
 * Renders a chip-specific "artifact" view of the trace entry's output.
 * Prose-first: type hierarchy carries it, no card chrome / background fills /
 * chunky borders. A draft reply reads like a compose preview; a note reads
 * like an inline note; an http call reads like two flush request/response lines.
 */
export function ArtifactPane({ chip, entry }: Props) {
  if (!chip) return <div className={styles.empty}>No artifact for this step.</div>;
  const action = findAction(chip.actionId);
  if (!action) return <div className={styles.empty}>Unknown action.</div>;

  switch (action.id) {
    case 'draft_reply':
    case 'send_reply':
      return <EmailArtifact entry={entry} sent={action.id === 'send_reply'} />;
    case 'tag':
      return <TagArtifact entry={entry} />;
    case 'note':
      return <NoteArtifact entry={entry} />;
    case 'assign':
      return <AssignArtifact entry={entry} />;
    case 'http':
    case 'shopify_get_order':
    case 'shopify_refund':
    case 'hubspot_find':
    case 'hubspot_create_ticket':
    case 'salesforce_get':
    case 'slack_send':
    case 'clickup_create':
    case 'sheets_get':
      return <HttpArtifact entry={entry} brand={action.brand ?? null} verb={action.verb} />;
    case 'approval':
      return <ApprovalArtifact entry={entry} />;
    case 'wait':
    case 'wait_for_reply':
    case 'wait_until':
      return <WaitArtifact entry={entry} verb={action.verb} />;
    default:
      return <DataArtifact entry={entry} />;
  }
}

/* ============================================================ */
function EmailArtifact({ entry, sent }: { entry: TraceEntry; sent: boolean }) {
  const out = entry.output ?? '';
  const subj = guessField(out, /subject[:=]?\s*"?([^"\n,}]+)"?/i) || 'Re: your enquiry';
  const body = guessField(out, /body[:=]?\s*"?([^"\n}]+)"?/i) || out;
  return (
    <div className={styles.email}>
      <span className={styles.eyebrow}>{sent ? 'Sent reply' : 'Draft reply'}</span>
      <div className={styles.emailMeta}>To customer</div>
      <div className={styles.emailSubject}>{subj}</div>
      <div className={styles.emailBody}>{body || '(empty)'}</div>
    </div>
  );
}

/* ============================================================ */
function TagArtifact({ entry }: { entry: TraceEntry }) {
  const out = entry.output ?? entry.input ?? '';
  const tags = parseTags(out);
  return (
    <div>
      <span className={styles.eyebrow}>Tagged</span>
      <div className={styles.tagPills}>
        {tags.length === 0
          ? <span className={styles.tagPill}>{out || '—'}</span>
          : tags.map((t, i) => <span key={i} className={styles.tagPill}>{t}</span>)}
      </div>
    </div>
  );
}

/* ============================================================ */
function NoteArtifact({ entry }: { entry: TraceEntry }) {
  const out = entry.output ?? entry.input ?? '';
  return (
    <div>
      <span className={styles.eyebrow}>Internal note</span>
      <div className={styles.noteBody}>{out || '(empty)'}</div>
    </div>
  );
}

/* ============================================================ */
function AssignArtifact({ entry }: { entry: TraceEntry }) {
  const out = entry.output ?? entry.input ?? '';
  return (
    <div>
      <span className={styles.eyebrow}>Assigned to</span>
      <div className={styles.assignTo}>{out || '—'}</div>
    </div>
  );
}

/* ============================================================ */
function HttpArtifact({ entry, brand, verb }: { entry: TraceEntry; brand: string | null; verb: string }) {
  return (
    <div>
      <span className={styles.eyebrow}>{brand ? `${brand} · ${verb}` : verb}</span>
      <div className={styles.httpLine}>
        <span className={styles.httpDir}>req</span>
        <span className={styles.httpVal}>{entry.input || '—'}</span>
      </div>
      <div className={styles.httpLine}>
        <span className={styles.httpDir}>res</span>
        <span className={styles.httpVal}>{entry.output || '—'}</span>
      </div>
    </div>
  );
}

/* ============================================================ */
function ApprovalArtifact({ entry }: { entry: TraceEntry }) {
  return (
    <div>
      <span className={styles.eyebrow}>Approval</span>
      <div className={styles.approvalLine}>
        <span className={styles.approvalStatus}>Requested</span>
        <span className={styles.approvalMeta}>manager · 24h SLA</span>
      </div>
      {entry.input && <div className={styles.approvalContext}>{entry.input}</div>}
    </div>
  );
}

/* ============================================================ */
function WaitArtifact({ entry, verb }: { entry: TraceEntry; verb: string }) {
  return (
    <div>
      <span className={styles.eyebrow}>{verb}</span>
      <div className={styles.waitLine}>
        <span className={styles.waitDuration}>{entry.input || '1 business day'}</span>
        {' '}<span className={styles.waitMuted}>· skipped in test</span>
      </div>
    </div>
  );
}

/* ============================================================ */
function DataArtifact({ entry }: { entry: TraceEntry }) {
  const out = entry.output ?? '';
  const fields = parseFields(out);
  if (fields.length === 0) {
    return (
      <div>
        <span className={styles.eyebrow}>Output</span>
        <div className={styles.dataValue}>{out || '—'}</div>
      </div>
    );
  }
  return (
    <div>
      <span className={styles.eyebrow}>Extracted</span>
      {fields.map((f, i) => (
        <div key={i} className={styles.dataRow}>
          <span className={styles.dataKey}>{f.key}</span>
          <span className={styles.dataVal}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================ */
/* Parsers                                                        */
/* ============================================================ */
function guessField(s: string, re: RegExp): string | null {
  const m = s.match(re);
  return m && m[1] ? m[1].trim() : null;
}

function parseTags(s: string): string[] {
  if (s.includes(',')) {
    return s.split(',').map((p) => p.trim().replace(/^[@\['"\s]+|[\]\s'"]+$/g, '')).filter(Boolean);
  }
  return [s.replace(/^[@\['"\s]+|[\]\s'"]+$/g, '')].filter(Boolean);
}

function parseFields(s: string): Array<{ key: string; value: string }> {
  if (s.includes(' · ')) {
    return s.split(' · ').map((part, i) => ({ key: `field ${i + 1}`, value: part }));
  }
  const matches = s.match(/(\w+)\s*[:=]\s*"?([^",}]+)"?/g);
  if (matches && matches.length) {
    return matches.map((m) => {
      const i = m.search(/[:=]/);
      const key = m.slice(0, i).trim();
      const value = m.slice(i + 1).replace(/^["\s]+|["\s,]+$/g, '');
      return { key, value };
    });
  }
  return [];
}
