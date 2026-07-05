import type { ConnectorSlug } from '@/types/playbook';
import type { EvalAggregate } from '@/components/simulate/useEvalState';
import type { ConnectorHealth } from '../connectorHealth';
import { findAction } from '@/data/library';
import { CONNECTOR_META } from '@/data/connectors';
import { mailboxHasTag, mailboxHasMember, isTeamMember } from '@/data/mailboxDirectory';
import { mailboxName } from '@/data/mailboxes';
import { isCondition, lineHasContent, type EditorDoc } from '../doc';

/**
 * The Enable flow's readiness model. deriveReadinessInputs scans the doc once
 * (what the AOP depends on); computeChecks crosses that with the user's mailbox
 * selection + session state (connected / invited) into the review rows. All
 * pure - the review UI just renders the result. Frontend-only mock: "analysis"
 * here means walking the doc's chips, nothing else.
 */

export interface ReadinessInputs {
  /** Connectors the doc's actions use, with how many steps depend on each. */
  connectors: { slug: ConnectorSlug; steps: number }[];
  /** Tag names the doc applies (from Tag action values). */
  tags: string[];
  /** People the doc assigns to (Assign values that match a team member). */
  assignees: string[];
  /** Whether the doc has any evaluatable content at all. */
  hasSteps: boolean;
}

/** One review row. tone drives the icon + color; action is the inline fix. */
export type CheckTone = 'ok' | 'auto' | 'warn' | 'pending';
export type CheckKind = 'connector' | 'evaluation' | 'tags' | 'assignment';

export interface ReadinessCheck {
  id: string;
  kind: CheckKind;
  tone: CheckTone;
  title: string;
  /** One short line - structured lists go in `chips`, never in prose. */
  detail: string;
  /** Scannable entities under the detail line (tags to create, mailboxes an
   *  invite covers). label + an optional muted sub ("4 mailboxes"). */
  chips?: { label: string; sub?: string }[];
  /** The inline fix: 'connect' carries its slug + state-specific label,
   *  'invite' its person. */
  action?:
    | { type: 'connect'; slug: ConnectorSlug; label: string }
    | { type: 'invite'; person: string; mailboxes: string[] }
    | { type: 'evaluate' };
  /** Trailing status label when no action is needed/possible. */
  status?: string;
}

// ---- doc scan -----------------------------------------------------------------

interface ChipLike {
  actionId?: string;
  config?: { meta?: string };
}

export function deriveReadinessInputs(doc: EditorDoc): ReadinessInputs {
  const connectorSteps = new Map<ConnectorSlug, number>();
  const tags = new Set<string>();
  const assignees = new Set<string>();

  JSON.stringify(doc, (_k, v) => {
    const chip = v as ChipLike;
    if (chip && typeof chip === 'object' && typeof chip.actionId === 'string') {
      const { actionId } = chip;
      const meta = chip.config?.meta ?? '';
      const slug = findAction(actionId)?.connectorSlug;
      if (slug) connectorSteps.set(slug, (connectorSteps.get(slug) ?? 0) + 1);
      if (actionId === 'tag') {
        meta
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((t) => tags.add(t));
      }
      if (actionId === 'assign') {
        meta
          .split(',')
          .map((p) => p.trim())
          .filter((p) => isTeamMember(p))
          .forEach((p) => assignees.add(p));
      }
    }
    return v;
  });

  return {
    connectors: [...connectorSteps.entries()].map(([slug, steps]) => ({ slug, steps })),
    tags: [...tags],
    assignees: [...assignees],
    hasSteps: doc.steps.some((s) => isCondition(s) || lineHasContent(s.body)),
  };
}

// ---- checks -------------------------------------------------------------------

export interface ReadinessSession {
  /** Connector health from the shared store (the Connectors hub). */
  connectorHealth: Record<ConnectorSlug, ConnectorHealth>;
  /** Invites sent this session, keyed `${person}|${mailboxId}`. */
  invited: ReadonlySet<string>;
}

export const inviteKey = (person: string, mailboxId: string) => `${person}|${mailboxId}`;

export function computeChecks(
  inputs: ReadinessInputs,
  selected: string[],
  evalAgg: EvalAggregate,
  session: ReadinessSession,
): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [];

  // Connectors - doc-level; the AOP cannot run those steps until the connector
  // is healthy. Reads the shared health store, so a connector fixed in the
  // Connectors hub is already green here - never an enablement step.
  for (const { slug, steps } of inputs.connectors) {
    const name = CONNECTOR_META[slug].name;
    const state = session.connectorHealth[slug] ?? 'connected';
    const stepsPhrase = `${steps} ${steps === 1 ? 'step' : 'steps'}`;
    if (state === 'connected') {
      checks.push({
        id: `connector-${slug}`,
        kind: 'connector',
        tone: 'ok',
        title: name,
        detail: `Connected - ${stepsPhrase} ${steps === 1 ? 'is' : 'are'} ready to run.`,
        status: 'Connected',
      });
    } else {
      const reason =
        state === 'reauth'
          ? `${stepsPhrase} won't run until ${name} is re-authenticated.`
          : state === 'error'
            ? `The ${name} connection is broken - ${stepsPhrase} won't run until it's fixed.`
            : `${stepsPhrase} won't run until ${name} is connected.`;
      checks.push({
        id: `connector-${slug}`,
        kind: 'connector',
        tone: 'warn',
        title: name,
        detail: reason,
        action: {
          type: 'connect',
          slug,
          label:
            state === 'reauth' ? 'Re-authenticate' : state === 'error' ? 'Fix connection' : 'Connect',
        },
      });
    }
  }

  // Evaluation - never blocks (always skippable), but the state is spelled out.
  if (inputs.hasSteps) {
    if (evalAgg.total === 0) {
      checks.push({
        id: 'evaluation',
        kind: 'evaluation',
        tone: 'pending',
        title: 'Evaluation',
        detail: 'Never evaluated - a quick run on past emails catches broken steps early.',
        action: { type: 'evaluate' },
      });
    } else if (evalAgg.failed > 0) {
      checks.push({
        id: 'evaluation',
        kind: 'evaluation',
        tone: 'warn',
        title: 'Evaluation',
        detail: `${evalAgg.failed} of ${evalAgg.total} ${evalAgg.total === 1 ? 'run' : 'runs'} failed - review them before going live.`,
        action: { type: 'evaluate' },
      });
    } else {
      checks.push({
        id: 'evaluation',
        kind: 'evaluation',
        tone: 'ok',
        title: 'Evaluation',
        detail: `${evalAgg.total} ${evalAgg.total === 1 ? 'run' : 'runs'}, all passed.`,
        status: 'Passed',
      });
    }
  }

  // Tags - fixable on the user's behalf, so it's information, never a blocker.
  if (inputs.tags.length > 0 && selected.length > 0) {
    const missing = inputs.tags
      .map((tag) => ({
        tag,
        mailboxes: selected.filter((id) => !mailboxHasTag(id, tag)),
      }))
      .filter((m) => m.mailboxes.length > 0);
    if (missing.length === 0) {
      checks.push({
        id: 'tags',
        kind: 'tags',
        tone: 'ok',
        title: 'Tags',
        detail: 'Every tag this AOP applies exists in all selected mailboxes.',
        status: 'Ready',
      });
    } else {
      checks.push({
        id: 'tags',
        kind: 'tags',
        tone: 'auto',
        title: 'Tags',
        detail: `Missing in some selected mailboxes - we'll create ${missing.length === 1 ? 'this tag' : 'these tags'} when this AOP goes live.`,
        chips: missing.map((m) => ({
          label: m.tag,
          sub: `${m.mailboxes.length} ${m.mailboxes.length === 1 ? 'mailbox' : 'mailboxes'}`,
        })),
        status: 'Done for you',
      });
    }
  }

  // Assignment - NOT fixable on the user's behalf: membership needs an accepted
  // invite. One row per person; Send invite flips it to an honest pending state.
  for (const person of inputs.assignees) {
    const missing = selected.filter((id) => !mailboxHasMember(id, person));
    if (selected.length === 0) continue;
    if (missing.length === 0) {
      checks.push({
        id: `assign-${person}`,
        kind: 'assignment',
        tone: 'ok',
        title: person,
        detail: `A member of all selected mailboxes - assignments will land normally.`,
        status: 'Ready',
      });
      continue;
    }
    const uninvited = missing.filter((id) => !session.invited.has(inviteKey(person, id)));
    const missingChips = missing.map((id) => ({ label: mailboxName(id) }));
    if (uninvited.length > 0) {
      checks.push({
        id: `assign-${person}`,
        kind: 'assignment',
        tone: 'warn',
        title: person,
        detail: `This AOP assigns to ${person}, who hasn't joined ${missing.length === 1 ? 'this mailbox' : 'these mailboxes'} - assignment pauses there until they do:`,
        chips: missingChips,
        action: { type: 'invite', person, mailboxes: missing },
      });
    } else {
      checks.push({
        id: `assign-${person}`,
        kind: 'assignment',
        tone: 'pending',
        title: person,
        detail: `Invite sent - assignment pauses in ${missing.length === 1 ? 'this mailbox' : 'these mailboxes'} until ${person} accepts:`,
        chips: missingChips,
        status: 'Invite sent',
      });
    }
  }

  return checks;
}
