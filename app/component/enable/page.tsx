'use client';

import { useState } from 'react';
import EnableModal from '@/components/flow01/enable/EnableModal';
import type { ReadinessInputs } from '@/components/flow01/enable/readiness';
import type { ConnectorSlug } from '@/types/playbook';

const btn: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #D6DDE8',
  background: '#fff',
  color: '#3E4C5A',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

// What the demo "AOP" depends on - exercises every check kind in the Review
// step: a connector, tags that are missing somewhere, and a person assignee.
const DEMO_READINESS: ReadinessInputs = {
  connectors: [{ slug: 'hubspot', steps: 2 }],
  tags: ['api-error', 'support'],
  assignees: ['Varun'],
  hasSteps: true,
};
const ZERO_AGG = { total: 0, passed: 0, failed: 0, attention: 0, stale: false };

export default function EnableComponentPage() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'commit' | 'manage'>('commit');
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>(['support', 'sales']);
  const [connected, setConnected] = useState<ReadonlySet<ConnectorSlug>>(new Set());
  const [invited, setInvited] = useState<ReadonlySet<string>>(new Set());

  const openCommit = () => {
    setMode('commit');
    setName('');
    setSelected(['support', 'sales']);
    setOpen(true);
  };
  const openManage = () => {
    setMode('manage');
    setName('Error handler');
    setSelected(['support', 'sales', 'billing']);
    setOpen(true);
  };

  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#343C45',
          letterSpacing: '-0.01em',
          margin: 0,
        }}
      >
        Enable AOP modal - two-step commit (setup, readiness review, success) & manage mode
      </h1>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: '#6F7C90', margin: 0, maxWidth: 640 }}>
        Commit = the Enable flow: name + go-live surface (AI Agents / AI Copilot) + mailboxes →
        Continue → the readiness review (connector re-auth, evaluation, tags created for you,
        membership invites) → &ldquo;Go live on N mailboxes&rdquo; → the success moment. Pick Sales
        or Marketing to see missing tags and the Varun invite. Manage = the gear: single step,
        footer &ldquo;Save changes&rdquo;.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={btn} onClick={openCommit}>
          Open: Enable (commit)
        </button>
        <button style={btn} onClick={openManage}>
          Open: Settings (manage)
        </button>
      </div>

      <EnableModal
        open={open}
        mode={mode}
        name={name}
        onNameChange={setName}
        selected={selected}
        onSelectedChange={setSelected}
        readiness={DEMO_READINESS}
        evalAgg={ZERO_AGG}
        connected={connected}
        onConnect={(slug) => setConnected((prev) => new Set(prev).add(slug))}
        invited={invited}
        onInvite={(person, ids) =>
          setInvited((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.add(`${person}|${id}`));
            return next;
          })
        }
        onEvaluate={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
}
