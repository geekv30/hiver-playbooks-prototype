'use client';

import { useId, useState } from 'react';
import { findAction } from '@/data/library';
import { isCondition, lineToText, type EditorDoc } from '@/components/flow01/doc';
import type { CheckedTurn, LiveTraceStep } from '@/lib/eval/wire';
import TraceStep from '../TraceStep';
import type { TraceStepDef } from '../traceFixture';
import styles from './LiveTrace.module.css';

/** The plain text of a skill step or branch line, for a prose step's label. */
function stepText(doc: EditorDoc, id: string | null): string {
  if (!id) return '';
  for (const s of doc.steps) {
    if (isCondition(s)) {
      for (const b of s.branches) for (const l of b.lines) if (l.id === id) return lineToText(l.body);
    } else if (s.id === id) return lineToText(s.body);
  }
  return '';
}

function excerpt(text: string, max = 48): string {
  const t = text.replace(/\s+/g, ' ').trim().replace(/[.:]$/, '');
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}...` : t;
}

/** A checked step as the shared trace renderer draws it. */
export function toDef(doc: EditorDoc, s: LiveTraceStep, i: number, gated: Set<string>): TraceStepDef {
  const id = `${s.kind}-${i}`;
  if (s.kind === 'thinking') return { id, kind: 'thinking', ms: 0, text: s.text ?? '', label: 'Reasoning' };
  if (s.kind === 'condition') {
    const cond = doc.steps.find((x) => x.id === s.stepId);
    const arm = cond && isCondition(cond) ? cond.branches.find((b) => b.id === s.branch) : undefined;
    return {
      id,
      kind: 'condition',
      ms: 0,
      label: 'Condition',
      condType: arm?.type,
      branch: arm ? (arm.type === 'else' ? 'ELSE' : lineToText(arm.condition ?? [])) : undefined,
    };
  }
  // In the playground a gated action runs; the trace says it would wait live.
  const later = s.stepId && gated.has(s.stepId) ? 'needs approval when live' : undefined;
  if (s.kind === 'reply') {
    return { id, kind: 'reply', ms: 0, iconKey: 'reply', label: 'Reply', suffix: later };
  }
  const action = s.actionId ? findAction(s.actionId) : undefined;
  return {
    id,
    kind: 'action',
    ms: 0,
    iconKey: action?.iconKey ?? 'extract',
    connector: action?.connectorSlug,
    label: action ? action.name : excerpt(stepText(doc, s.stepId)) || 'Step',
    suffix: later,
    output: s.text ?? undefined,
  };
}

/**
 * LiveTrace - who wrote a reply and what the skill did for it: the meta line
 * under the agent's message ("AI agent · 9 steps", the widget's own
 * convention), where "9 steps" opens the trace right there in the thread. The
 * trace is the step renderer the email evaluation uses, in its quiet form, so
 * nothing under a reply reads as another message.
 */
export default function LiveTrace({ doc, turn, name = 'AI agent' }: { doc: EditorDoc; turn?: CheckedTurn; name?: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const steps = turn?.steps ?? [];
  const gated = new Set(turn?.gatedSteps ?? []);
  const defs = steps.map((s, i) => toDef(doc, s, i, gated));
  return (
    <div className={styles.wrap}>
      <p className={styles.meta}>
        <span>{name}</span>
        {defs.length > 0 && (
          <>
            <span className={styles.sep} aria-hidden>
              &middot;
            </span>
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={panelId}
            >
              {defs.length} {defs.length === 1 ? 'step' : 'steps'}
            </button>
          </>
        )}
      </p>
      {defs.length > 0 && (
        <div className={styles.collapse} data-open={open || undefined} id={panelId}>
          <div className={styles.inner}>
            <div className={styles.panel}>
              {defs.map((d, i) => (
                <TraceStep
                  key={d.id}
                  step={d}
                  status={steps[i]!.status}
                  isLast={i === defs.length - 1}
                  branchWarn={d.kind === 'condition' && steps[i]!.branch === 'none'}
                  quiet
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
