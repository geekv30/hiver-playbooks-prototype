'use client';

import { useState } from 'react';
import EnableModal from '@/components/flow01/enable/EnableModal';

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

export default function EnableComponentPage() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'commit' | 'manage'>('commit');
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>(['support', 'sales']);
  // The tag-owning mailboxes this AOP uses (pre-selected; warned if removed).
  const preEnabled = ['support', 'sales'];

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
        Enable AOP modal - commit (go-live + success) & manage modes
      </h1>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: '#6F7C90', margin: 0, maxWidth: 600 }}>
        Commit = the Enable flow: name + pick mailboxes (Support & Sales pre-selected because the
        AOP uses their tags) → &ldquo;Enable on N mailboxes&rdquo; → the success moment. Manage =
        the gear: same modal, footer &ldquo;Save changes&rdquo;, no success screen. Try unchecking a
        pre-selected mailbox to see the warning.
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
        preEnabled={preEnabled}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
}
