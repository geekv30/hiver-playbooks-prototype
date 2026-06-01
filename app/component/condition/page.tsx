'use client';

import { useState } from 'react';
import ConditionBlock from '@/components/flow01/condition/ConditionBlock';
import type { Branch } from '@/components/flow01/doc';

let seq = 0;
const nid = () => `b-${(seq += 1)}`;

export default function ConditionComponentPage() {
  const [branches, setBranches] = useState<Branch[]>([{ id: 'if', type: 'if', condition: [], body: [] }]);

  const addBranch = (type: 'elseif' | 'else') =>
    setBranches((bs) => [
      ...bs,
      { id: nid(), type, condition: type === 'else' ? undefined : [], body: [] },
    ]);

  const deleteBranch = (id: string) => setBranches((bs) => bs.filter((b) => b.id !== id));

  return (
    <div style={{ padding: 40, maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 15, fontWeight: 600, color: '#343C45', letterSpacing: '-0.01em' }}>
        Condition block (IF / ELSE-IF / ELSE) - interactive (Figma flow 4a-4b)
      </h1>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: '#6F7C90', margin: 0, maxWidth: 620 }}>
        Type the IF condition, then click the subtle <strong style={{ color: '#3E4C5A' }}>ELSE-IF / ELSE</strong> tag
        to pick a branch type. Else-if chains (a fresh prompt appears each time); Else ends the chain (no prompt
        after). Backspace an empty else-if condition to remove it.
      </p>
      <div style={{ marginTop: 8 }}>
        <ConditionBlock
          branches={branches}
          onAddBranch={addBranch}
          onEditCondition={() => {}}
          onDeleteBranch={deleteBranch}
        />
      </div>
    </div>
  );
}
