'use client';

import { useId, type ComponentType, type ReactNode, type SVGProps } from 'react';
import {
  RiDraftLine,
  RiShieldCheckLine,
  RiSendPlane2Line,
  RiChatOffLine,
  RiCheckLine,
} from 'react-icons/ri';
import type { ConnectorSlug } from '@/types/playbook';
import { CONNECTOR_ICON } from '@/components/icons/connectors';
import { CONNECTOR_META } from '@/data/connectors';
import {
  type StarterSpec,
  type ReplyMode,
  starterConnectors,
  starterReplyMode,
  starterStepCount,
} from '@/components/flow01/coldStart';
import { type ConnectorHealth, useConnectorHealth } from '@/components/flow01/connectorHealth';
import styles from './TemplateCard.module.css';

export type TemplateCardVariant =
  | 'footer'
  | 'tools-first'
  | 'readiness'
  | 'library'
  | 'library-ready'
  | 'avatars';

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

interface Tool {
  key: string;
  name: string;
  Icon: IconCmp;
  slug: ConnectorSlug;
}

/** The external connectors a template needs, as brand marks. Hiver-native steps
 *  (tags, the Knowledge Hub, replies) need no setup, so they aren't listed. */
function toolsFor(spec: StarterSpec): Tool[] {
  return starterConnectors(spec).map((slug) => ({
    key: slug,
    name: CONNECTOR_META[slug].name,
    Icon: CONNECTOR_ICON[slug],
    slug,
  }));
}

const REPLY: Record<ReplyMode, { label: string; Icon: IconCmp; tone: PillTone }> = {
  drafts: { label: 'Drafts replies', Icon: RiDraftLine, tone: 'blue' },
  approval: { label: 'Asks for approval', Icon: RiShieldCheckLine, tone: 'violet' },
  sends: { label: 'Sends replies', Icon: RiSendPlane2Line, tone: 'gray' },
  none: { label: "Doesn't reply", Icon: RiChatOffLine, tone: 'gray' },
};

type PillTone = 'blue' | 'violet' | 'gray' | 'green' | 'amber';

function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span className={styles.pill} data-tone={tone}>
      {children}
    </span>
  );
}

/** Round, overlapping marks (after Dugong): the connectors a template calls.
 *  A template that needs none shows the Hiver mark alone - it runs entirely
 *  inside Hiver - rather than an empty slot. */
function Avatars({ tools }: { tools: Tool[] }) {
  return (
    <span className={styles.avatars}>
      {tools.length === 0 ? (
        <span className={styles.avatar} role="img" aria-label="Hiver">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hiver-yellow-mark.svg" alt="" />
        </span>
      ) : (
        tools.map(({ key, name, Icon }) => (
          <span key={key} className={styles.avatar} role="img" aria-label={name}>
            <Icon aria-hidden />
          </span>
        ))
      )}
    </span>
  );
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

const FIX_VERB: Record<Exclude<ConnectorHealth, 'connected'>, string> = {
  reauth: 'Reconnect',
  error: 'Fix',
  disconnected: 'Connect',
};

/** What stands between this template and a working skill, in this workspace. */
function readiness(
  tools: Tool[],
  health: Record<ConnectorSlug, ConnectorHealth>,
): { tone: 'ok' | 'warn'; label: string } {
  const blocked = tools.flatMap((t) =>
    health[t.slug] !== 'connected' ? [{ name: t.name, state: health[t.slug] }] : [],
  );
  const [first] = blocked;
  if (!first) return { tone: 'ok', label: 'Ready to use' };
  if (blocked.length > 1) return { tone: 'warn', label: `Fix ${blocked.length} connections` };
  const state = first.state as Exclude<ConnectorHealth, 'connected'>;
  return { tone: 'warn', label: `${FIX_VERB[state]} ${first.name}` };
}

function ToolMarks({ tools, stacked }: { tools: Tool[]; stacked?: boolean }) {
  return (
    <span className={stacked ? styles.stack : styles.marks}>
      {tools.map(({ key, name, Icon }) => (
        <span key={key} className={stacked ? styles.tile : styles.mark} role="img" aria-label={name}>
          <Icon aria-hidden />
        </span>
      ))}
    </span>
  );
}

function ReplyMeta({ mode }: { mode: ReplyMode }) {
  const { label, Icon } = REPLY[mode];
  return (
    <span className={styles.meta}>
      <Icon aria-hidden />
      {label}
    </span>
  );
}

/**
 * A template card on the Skills empty state (Figma 3038:24575). Every fact on it
 * - the connectors, the reply mode, the readiness - is read
 * off the starter's own steps, so a card can never claim a tool its skill
 * doesn't call. Layouts under review share this one renderer.
 */
export default function TemplateCard({
  spec,
  variant,
  onPick,
}: {
  spec: StarterSpec;
  variant: TemplateCardVariant;
  onPick?: (spec: StarterSpec) => void;
}) {
  const health = useConnectorHealth();
  const descId = useId();
  // Every layout reads the same to a screen reader: the action, then the summary.
  const a11y = {
    'aria-label': `Use template: ${spec.label}`,
    'aria-describedby': descId,
    onClick: () => onPick?.(spec),
  };
  const tools = toolsFor(spec);
  const mode = starterReplyMode(spec);
  const Icon = spec.Icon;

  // Round 2 (Dugong-shaped): connectors top-left, one classifying pill
  // top-right, then title, summary, and a steps + category footer.
  if (variant === 'library' || variant === 'library-ready') {
    const steps = starterStepCount(spec);
    const reply = REPLY[mode];
    const ready = readiness(tools, health);
    return (
      <button
        type="button"
        className={`${styles.card} ${styles.library}`}
        {...a11y}
      >
        <span className={styles.top}>
          <Avatars tools={tools} />
          {variant === 'library' ? (
            <Pill tone={reply.tone}>{reply.label}</Pill>
          ) : (
            <Pill tone={ready.tone === 'ok' ? 'green' : 'amber'}>{ready.label}</Pill>
          )}
        </span>
        <span className={styles.libTitle}>{spec.label}</span>
        <span id={descId} className={styles.libDesc}>
          {spec.blurb}
        </span>
        <span className={styles.footer}>
          <span className={`${styles.soft} ${styles.clip}`}>
            {steps} steps
            {variant === 'library-ready' && ` · ${reply.label}`}
          </span>
          <span className={styles.category}>{spec.category}</span>
        </span>
      </button>
    );
  }

  if (variant === 'tools-first') {
    const names = tools.map((t) => t.name);
    return (
      <button type="button" className={styles.card} {...a11y}>
        {tools.length > 0 ? (
          <ToolMarks tools={tools} stacked />
        ) : (
          <span className={styles.stack}>
            <span className={styles.tile}>
              <Icon aria-hidden />
            </span>
          </span>
        )}
        <span className={styles.title}>{spec.label}</span>
        <span id={descId} className={styles.desc}>
          {spec.blurb}
        </span>
        <span className={styles.footer}>
          <span className={`${styles.soft} ${styles.clip}`}>
            {names.length > 0 ? `Uses ${joinNames(names)}` : 'Works inside Hiver'}
          </span>
          <ReplyMeta mode={mode} />
        </span>
      </button>
    );
  }

  // Final (after review): the template's own icon leads with the title, and the
  // connectors it needs sit below as an overlapping avatar group. No pills, no
  // readiness line - the card says what it does and what it touches, nothing else.
  if (variant === 'avatars') {
    return (
      <button type="button" className={styles.card} {...a11y}>
        <span className={styles.head}>
          <Icon className={styles.headIcon} aria-hidden />
          <span className={styles.title}>{spec.label}</span>
        </span>
        <span id={descId} className={styles.desc}>
          {spec.blurb}
        </span>
        <span className={styles.footer}>
          <Avatars tools={tools} />
        </span>
      </button>
    );
  }

  const ready = variant === 'readiness' ? readiness(tools, health) : null;

  return (
    <button type="button" className={styles.card} {...a11y}>
      <span className={styles.head}>
        <Icon className={styles.headIcon} aria-hidden />
        <span className={styles.title}>{spec.label}</span>
      </span>
      <span id={descId} className={styles.desc}>
        {spec.blurb}
      </span>
      <span className={styles.footer}>
        {tools.length > 0 ? (
          <ToolMarks tools={tools} />
        ) : (
          <span className={styles.soft}>Works inside Hiver</span>
        )}
        {ready ? (
          <span className={styles.ready} data-tone={ready.tone}>
            {ready.tone === 'ok' ? <RiCheckLine aria-hidden /> : <span className={styles.dot} aria-hidden />}
            {ready.label}
          </span>
        ) : (
          <ReplyMeta mode={mode} />
        )}
      </span>
    </button>
  );
}
