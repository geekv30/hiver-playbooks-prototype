'use client';

import { useState } from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';
import { findAction } from '@/data/library';
import { isCondition, lineToText, type EditorDoc } from '@/components/flow01/doc';
import type { CheckedTurn, LiveTraceStep } from '@/lib/eval/wire';
import TraceStep from '../TraceStep';
import type { TraceStepDef } from '../traceFixture';
import styles from '../RunTrace.module.css';

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

function excerpt(text: string, max = 44): string {
  const t = text.replace(/\s+/g, ' ').trim().replace(/[.:]$/, '');
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}...` : t;
}

/** A checked live step as the shared trace renderer draws it. */
function toDef(doc: EditorDoc, s: LiveTraceStep, i: number): TraceStepDef {
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
  const action = s.actionId ? findAction(s.actionId) : undefined;
  if (s.kind === 'reply') {
    return {
      id,
      kind: 'reply',
      ms: 0,
      iconKey: 'reply',
      label: 'Reply',
      suffix: s.actionId === 'send_reply' ? 'send' : 'draft',
    };
  }
  return {
    id,
    kind: 'action',
    ms: 0,
    iconKey: action?.iconKey ?? 'extract',
    connector: action?.connectorSlug,
    label: action ? action.name : excerpt(stepText(doc, s.stepId)) || 'Step',
    output: s.text ?? undefined,
    error: s.error ?? undefined,
  };
}

interface Props {
  doc: EditorDoc;
  turn: CheckedTurn;
}

/** The trace of one skill turn: the same collapsible Trace section and step
 *  renderer email evaluation uses, fed by the checked live (or scripted) turn. */
export default function LiveTrace({ doc, turn }: Props) {
  // Closed by default: in a chat the conversation is the read, and a turn's
  // trace is one click away with its size stated.
  const [open, setOpen] = useState(false);
  if (turn.steps.length === 0) return null;
  const defs = turn.steps.map((s, i) => toDef(doc, s, i));
  const noBranch = turn.reason === 'noBranch';
  return (
    <div className={styles.trace}>
      <button type="button" className={styles.head} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={styles.title}>
          Trace &middot; {defs.length} {defs.length === 1 ? 'step' : 'steps'}
        </span>
        <RiArrowDownSLine className={styles.chev} data-open={open || undefined} aria-hidden />
      </button>
      <div className={styles.stepsWrap} data-open={open || undefined}>
        <div className={styles.steps}>
          {defs.map((d, i) => (
            <TraceStep
              key={d.id}
              step={d}
              status={turn.steps[i]!.status}
              isLast={i === defs.length - 1}
              draft={d.kind === 'reply' ? (turn.steps[i]!.text ?? '') : undefined}
              approval={d.kind === 'reply' && turn.held}
              branchWarn={d.kind === 'condition' && noBranch && turn.steps[i]!.branch === 'none'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
