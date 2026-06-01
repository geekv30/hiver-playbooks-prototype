'use client';

import ConditionBlock from '@/components/flow01/condition/ConditionBlock';
import type { Branch } from '@/components/flow01/doc';

const ifOnly: Branch[] = [{ id: 'b1', type: 'if', condition: [], body: [] }];

const ifElseif: Branch[] = [
  { id: 'b1', type: 'if', condition: [], body: [] },
  { id: 'b2', type: 'elseif', condition: [], body: [] },
];

const full: Branch[] = [
  { id: 'b1', type: 'if', condition: [], body: [] },
  { id: 'b2', type: 'elseif', condition: [], body: [] },
  { id: 'b3', type: 'else', body: [] },
];

export default function ConditionComponentPage() {
  return (
    <div style={{ padding: 40, maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 40 }}>
      <h1 style={{ fontSize: 15, fontWeight: 600, color: '#343C45', letterSpacing: '-0.01em' }}>
        Condition block (IF / ELSE-IF / ELSE) - Figma 334:35590
      </h1>
      <Section title="Default: IF + ELSE-IF / ELSE prompt" branches={ifOnly} />
      <Section title="IF + ELSE-IF + prompt (chaining)" branches={ifElseif} />
      <Section title="IF + ELSE-IF + ELSE (terminal, no prompt)" branches={full} />
    </div>
  );
}

function Section({ title, branches }: { title: string; branches: Branch[] }) {
  return (
    <div>
      <h2 style={{ fontSize: 13, color: '#6F7C90', marginBottom: 12, fontWeight: 500 }}>{title}</h2>
      <ConditionBlock branches={branches} onAddBranch={() => {}} />
    </div>
  );
}
