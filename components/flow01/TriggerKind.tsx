'use client';

import { RiHand, RiSparkling2Line } from 'react-icons/ri';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import type { TriggerMode } from './doc';
import styles from './TriggerKind.module.css';

/* How a skill starts, set on its Trigger: Describe it or Manual.
   Describe it ('automatic'): Hiver AI runs the skill when a conversation
   matches the text, and people can also type its / command in Copilot.
   Manual: the skill runs only with its / command, and the text is what
   Copilot shows in the / menu. */

/** The / command a name gives a skill: "Refund requests" -> "refund-requests". */
export function slugFor(title: string): string | null {
  const t = title.trim();
  if (!t || t === 'Untitled skill') return null;
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || null;
}

const KINDS: { id: TriggerMode; label: string; icon: React.ReactNode }[] = [
  { id: 'automatic', label: 'Describe it', icon: <RiSparkling2Line /> },
  { id: 'manual', label: 'Manual', icon: <RiHand /> },
];

export const TRIGGER_PLACEHOLDER: Record<TriggerMode, string> = {
  automatic: 'e.g. when an email reports an API error',
  manual: 'e.g. use for emails that report an API error',
};

export const TRIGGER_ARIA: Record<TriggerMode, string> = {
  automatic: 'When should this skill run',
  manual: 'When to use this skill',
};

export function TriggerKindControl({ mode, onMode }: { mode: TriggerMode; onMode: (m: TriggerMode) => void }) {
  return (
    <div className={styles.control}>
      <SegmentedControl tabs={KINDS} active={mode} onChange={onMode} ariaLabel="How this skill starts" />
    </div>
  );
}

/** The one line under the trigger text: what the picked option does. */
export function TriggerKindHint({ mode, slug }: { mode: TriggerMode; slug: string | null }) {
  const cmd = slug ? <code className={styles.slug}>/{slug}</code> : 'its / command';
  return (
    <p className={styles.hint}>
      {mode === 'automatic' ? (
        <>Hiver AI runs this skill when an email or chat matches. People can also type {cmd} in Copilot.</>
      ) : (
        <>This skill runs only when someone types {cmd} in Copilot.</>
      )}
    </p>
  );
}

/** The toast line after a change on a live skill. */
export function modeChangeLine(mode: TriggerMode, slug: string | null): string {
  return mode === 'manual'
    ? `This skill now runs only with ${slug ? `/${slug}` : 'its / command'}.`
    : 'This skill runs on its own again.';
}
