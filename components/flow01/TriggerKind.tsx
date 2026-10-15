'use client';

import { RiHand, RiSparkling2Line } from 'react-icons/ri';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import InfoButton from '@/components/simulate/MatchReasonButton';
import type { TriggerMode } from './doc';
import styles from './TriggerKind.module.css';

/* How a skill starts, set on its Trigger: Automatic or Manual.
   Automatic ('automatic'): Hiver AI runs the skill when a conversation
   matches the trigger text, and people can also type its / command in the
   Assist Agent. Manual: the skill runs only with its / command, so there is
   no trigger to write. The text is hidden, not deleted: it comes back when
   the author switches to Automatic again. */

/** The / command a name gives a skill: "Refund requests" -> "refund-requests". */
export function slugFor(title: string): string | null {
  const t = title.trim();
  if (!t || t === 'Untitled skill') return null;
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || null;
}

const KINDS: { id: TriggerMode; label: string; icon: React.ReactNode }[] = [
  { id: 'automatic', label: 'Automatic', icon: <RiSparkling2Line /> },
  { id: 'manual', label: 'Manual', icon: <RiHand /> },
];

export const TRIGGER_PLACEHOLDER = 'e.g. when an email reports an API error';

/* The control, with an info icon beside it. The icon opens (on click) what
   each option does, so the trigger itself carries no extra lines. */
export function TriggerKindControl({
  mode,
  onMode,
  slug,
}: {
  mode: TriggerMode;
  onMode: (m: TriggerMode) => void;
  slug: string | null;
}) {
  const cmd = slug ? <code className={styles.cmd}>/{slug}</code> : '/ and the skill name';
  return (
    <div className={styles.row}>
      <div className={styles.control}>
        <SegmentedControl tabs={KINDS} active={mode} onChange={onMode} ariaLabel="How this skill starts" />
      </div>
      <InfoButton title="How this skill starts" ariaLabel="How Automatic and Manual work" wide>
        <dl className={styles.defs}>
          <div>
            <dt>Automatic</dt>
            <dd>
              Hiver AI runs this skill when an email or chat matches the trigger. People can also type {cmd} in the
              Assist Agent.
            </dd>
          </div>
          <div>
            <dt>Manual</dt>
            <dd>
              This skill runs only when someone types {cmd} in the Assist Agent. There is no trigger to write.
            </dd>
          </div>
        </dl>
      </InfoButton>
    </div>
  );
}

/** In Manual, the one line that takes the trigger text's place. */
export function TriggerManualLine({ slug }: { slug: string | null }) {
  return (
    <p className={styles.manual}>
      {slug ? (
        <>
          This skill runs only when someone types <code className={styles.slug}>/{slug}</code> in the Assist Agent.
        </>
      ) : (
        <>This skill runs only when someone types / and the skill name in the Assist Agent.</>
      )}
    </p>
  );
}

/** The toast line after a change on a live skill. */
export function modeChangeLine(mode: TriggerMode, slug: string | null): string {
  return mode === 'manual'
    ? `This skill now runs only with ${slug ? `/${slug}` : 'its / command'} in the Assist Agent.`
    : 'This skill runs on its own again.';
}
