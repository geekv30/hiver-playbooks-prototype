import type { Playbook, Step, Chip } from '@/types/playbook';
import { findAction } from '@/data/library';

export interface ValidationIssue {
  rule: 'name-empty' | 'summary-empty' | 'chip-unconfigured' | 'connector-unauthed';
  message: string;
  targetId?: string;
}

function walkChips(steps: Step[]): Chip[] {
  const out: Chip[] = [];
  for (const step of steps) {
    if (step.kind === 'action') {
      for (const f of step.fragments) {
        if (f.kind === 'chip') out.push(f.chip);
      }
    } else if (step.kind === 'condition') {
      for (const branch of step.branches) {
        for (const f of branch.exprFragments) if (f.kind === 'chip') out.push(f.chip);
        for (const f of branch.bodyFragments) if (f.kind === 'chip') out.push(f.chip);
      }
      for (const f of step.exprFragments) if (f.kind === 'chip') out.push(f.chip);
    } else if (step.kind === 'approval') {
      for (const f of step.promptFragments) if (f.kind === 'chip') out.push(f.chip);
    }
  }
  return out;
}

export function validate(playbook: Playbook): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (playbook.frontmatter.name.trim() === '') {
    issues.push({ rule: 'name-empty', message: 'Playbook name is required' });
  }
  if (playbook.frontmatter.summary.trim() === '') {
    issues.push({ rule: 'summary-empty', message: 'Summary is required' });
  }

  const allChips = walkChips(playbook.steps);

  const drafts = allChips.filter((c) => c.status === 'draft');
  if (drafts.length > 0) {
    const firstDraft = drafts[0];
    issues.push({
      rule: 'chip-unconfigured',
      message: `${drafts.length} step${drafts.length === 1 ? '' : 's'} need configuration`,
      targetId: firstDraft ? firstDraft.id : undefined,
    });
  }

  const unauthedConnectors = new Set<string>();
  for (const chip of allChips) {
    const action = findAction(chip.actionId);
    if (!action || !action.connectorSlug) continue;
    const conn = playbook.connectors.find((c) => c.slug === action.connectorSlug);
    if (conn && !conn.authed) unauthedConnectors.add(conn.slug);
  }
  if (unauthedConnectors.size > 0) {
    issues.push({
      rule: 'connector-unauthed',
      message: `${unauthedConnectors.size} connector${unauthedConnectors.size === 1 ? '' : 's'} not connected`,
    });
  }

  return issues;
}
