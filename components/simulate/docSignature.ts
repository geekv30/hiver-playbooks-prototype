// Content signature for staleness: serializes what the doc SAYS (step order,
// text, chip actionId + config + approval gate, branch structure) while
// ignoring volatile ids - so any meaningful edit after an evaluation marks the
// results "evaluated an earlier version", and re-running clears it.
import { isCondition, type EditorDoc } from '@/components/flow01/doc';
import type { Fragment } from '@/types/playbook';

const frag = (f: Fragment): string => {
  if (f.kind === 'text') return `t:${f.text}`;
  if (f.kind === 'chip')
    return `c:${f.chip.actionId}:${JSON.stringify(f.chip.config)}:${f.chip.requiresApproval ? 1 : 0}`;
  if (f.kind === 'ref') return `r:${f.refPath}`;
  return `k:${f.code}`;
};
const line = (body: Fragment[]): string => body.map(frag).join('|');

export function docSignature(doc: EditorDoc): string {
  const steps = doc.steps.map((s) =>
    isCondition(s)
      ? `cond(${s.branches
          .map(
            (b) =>
              `${b.type}[${b.condition ? line(b.condition) : ''}]{${b.lines
                .map((ln) => line(ln.body))
                .join(';')}}`,
          )
          .join(',')})`
      : line(s.body),
  );
  return `${line(doc.trigger)}::${steps.join('::')}`;
}
