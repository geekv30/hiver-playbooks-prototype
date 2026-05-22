'use client';
import Chip from '@/components/atoms/Chip';
import type { Chip as ChipModel } from '@/types/playbook';

const ok: ChipModel = { id: 'demo-ok', actionId: 'shopify_get_order', status: 'ok', config: {} };
const draft: ChipModel = { id: 'demo-draft', actionId: 'http', status: 'draft', config: {} };
const noConnector: ChipModel = { id: 'demo-tag', actionId: 'tag', status: 'ok', config: {} };
const approval: ChipModel = { id: 'demo-appr', actionId: 'approval', status: 'ok', config: {} };

export default function Home() {
  return (
    <main style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontFamily: 'var(--font)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.012em' }}>Chip atom showcase</h1>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip chip={ok} onClick={() => alert('clicked ok')} />
        <Chip chip={draft} />
        <Chip chip={noConnector} metaText="@tour.name" />
        <Chip chip={approval} />
      </div>
      <p style={{ color: 'var(--body)', fontSize: 13 }}>Expect: 4 chips with brand/sep/verb hierarchy, meta on right of those that have it, mint dot for OK, peach dot + dashed border for draft.</p>
    </main>
  );
}
