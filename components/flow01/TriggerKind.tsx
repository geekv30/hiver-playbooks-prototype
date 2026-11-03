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

/** The / command inside a sentence: the slug, or a stand-in before a name.
 *  `onDark` for the info bubble; the page style everywhere else. */
export function Cmd({ slug, onDark }: { slug: string | null; onDark?: boolean }) {
  return slug ? <code className={onDark ? styles.cmd : styles.slug}>/{slug}</code> : <>/ and the skill name</>;
}

/** The click-open explanation of both ways in. One copy, shared by every
 *  layout that shows Automatic / Manual (tabs and radio). */
export function StartInfo({ slug }: { slug: string | null }) {
  return (
    <InfoButton title="How this skill starts" ariaLabel="How Automatic and Manual work" wide>
      <dl className={styles.defs}>
        <div>
          <dt>Automatic</dt>
          <dd>
            Hiver AI runs this skill when an email or chat matches the trigger. People can also type <Cmd slug={slug} onDark /> in the
            Assist Agent.
          </dd>
        </div>
        <div>
          <dt>Manual</dt>
          <dd>
            This skill runs only when someone types <Cmd slug={slug} onDark /> in the Assist Agent. There is no trigger to write.
          </dd>
        </div>
      </dl>
    </InfoButton>
  );
}

/* The tabs control (the layout before option 2), with the info icon beside it. */
export function TriggerKindControl({
  mode,
  onMode,
  slug,
}: {
  mode: TriggerMode;
  onMode: (m: TriggerMode) => void;
  slug: string | null;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.control}>
        <SegmentedControl tabs={KINDS} active={mode} onChange={onMode} ariaLabel="How this skill starts" />
      </div>
      <StartInfo slug={slug} />
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

/** The toast line after a change on a live skill. `slash` false = the chips
 *  layout has / turned off too, so Manual means the skill does not run. */
export function modeChangeLine(mode: TriggerMode, slug: string | null, slash = true): string {
  if (mode === 'manual')
    return slash ? `This skill now runs only with ${slug ? `/${slug}` : 'its / command'} in the Assist Agent.` : 'This skill does not run now.';
  return 'This skill runs on its own again.';
}

/** The toast line after turning / on or off (chips layout). */
export function slashChangeLine(on: boolean, slug: string | null, auto: boolean): string {
  const cmd = slug ? `/${slug}` : 'The / command';
  if (!on && !auto) return 'This skill does not run now.';
  return on ? `${cmd} is on in the Assist Agent.` : `${cmd} is off in the Assist Agent.`;
}
