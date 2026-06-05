'use client';

import { useState } from 'react';
import CopilotPanel, { type CopilotMessage } from '@/components/flow01/copilot/CopilotPanel';

// A seeded conversation (generic, no case-specific content) to verify the
// message styling - user pill (right) + bubble-less assistant (left) + actions.
const SEED: CopilotMessage[] = [
  { role: 'user', text: 'Make this AOP foolproof' },
  {
    role: 'assistant',
    text: "Here's how I'd make it more robust: add a condition that checks the request priority, then a fallback branch so nothing slips through unhandled. Want me to add that?",
    // a stored thought (collapsed "Thought for Ns", expandable)
    thought: { ms: 2460 },
    steps: ['Reading your AOP', 'Planning the change'],
  },
];

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '6px 12px',
  borderRadius: 8,
  border: `1px solid ${active ? '#506DFF' : '#D6DDE8'}`,
  background: active ? 'rgba(80,109,255,.08)' : '#fff',
  color: active ? '#3F57E6' : '#4D596C',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
});

export default function CopilotComponentPage() {
  const [mode, setMode] = useState<'empty' | 'convo'>('empty');
  const [messages, setMessages] = useState<CopilotMessage[]>([]);

  const onSend = (text: string) => {
    setMode('convo');
    setMessages((m) => [
      ...m,
      { role: 'user', text },
      {
        role: 'assistant',
        text: 'Got it - I can help with that (demo reply in the isolated specimen).',
      },
    ]);
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
        Copilot panel - ChatGPT-clone rebuild (empty + conversation)
      </h1>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: '#6F7C90', margin: 0, maxWidth: 560 }}>
        Empty state = a centered hero (flat mark + greeting) + a clean two-row composer (no
        gradient) + starter pill-chips that prefill the composer. Conversation = right-aligned user
        pill, bubble-less full-width assistant, quiet ghost action row.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          style={tabBtn(mode === 'empty')}
          onClick={() => {
            setMode('empty');
            setMessages([]);
          }}
        >
          Empty state
        </button>
        <button
          style={tabBtn(mode === 'convo')}
          onClick={() => {
            setMode('convo');
            setMessages(SEED);
          }}
        >
          Conversation
        </button>
      </div>
      <div
        style={{
          width: 452,
          height: 720,
          border: '1px solid #ECEFF6',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 2px rgba(52,60,69,.05), 0 8px 24px rgba(52,60,69,.08)',
        }}
      >
        <CopilotPanel
          docked
          open
          onClose={() => {}}
          messages={messages}
          onSend={onSend}
          onRegenerate={() => {}}
          onClear={() => setMessages([])}
          onStop={() => {}}
          onAttach={() => {}}
          onApplyProposal={() => {}}
          onDismissProposal={() => {}}
          onUndoProposal={() => {}}
          onVerdict={() => {}}
        />
      </div>
    </div>
  );
}
