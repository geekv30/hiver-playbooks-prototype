'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { RiAddLine, RiCheckLine, RiErrorWarningLine } from 'react-icons/ri';
import Radio from '@/components/atoms/Radio';
import InfoButton from '@/components/simulate/MatchReasonButton';
import type { TriggerMode } from './doc';
import { TriggerKindControl, TriggerManualLine } from './TriggerKind';
import kind from './TriggerKind.module.css';
import styles from './TriggerStart.module.css';

/* The Trigger section of the skill editor, in one of four layouts for the same
   choice (how a skill starts). The editor ships 'tabs'; the other three are
   the options on /component/skill-start, each live in the full editor:
     tabs   - today: Automatic / Manual tabs under the Trigger label.
     blocks - option 1: two choices, the trigger lives inside Automatic.
     radio  - option 2: Automatic / Manual radio buttons under the label.
     chips  - option 3: the trigger first, then on/off chips for each way in.
   The caller builds the trigger line (its EditorLine) and passes it in, so the
   editor and the review frames keep their own editing wiring. */

import type { StartUi } from './startUi';
export type { StartUi } from './startUi';

interface Props {
  ui: StartUi;
  mode: TriggerMode;
  onMode: (m: TriggerMode) => void;
  /** People can start it with / (chips can turn this off). */
  slash: boolean;
  onSlash: (on: boolean) => void;
  slug: string | null;
  /** The trigger text field, built by the caller. */
  line: ReactNode;
  /** The editor's section-label class (the "Trigger" heading). */
  labelClass?: string;
}

export default function TriggerStart(p: Props) {
  if (p.ui === 'blocks') return <Blocks {...p} />;
  if (p.ui === 'radio') return <Radios {...p} />;
  if (p.ui === 'chips') return <Chips {...p} />;
  return (
    <>
      <h2 className={p.labelClass}>Trigger</h2>
      <TriggerKindControl mode={p.mode} onMode={p.onMode} slug={p.slug} />
      {p.mode === 'manual' ? <TriggerManualLine slug={p.slug} /> : p.line}
    </>
  );
}

/** The / command inside a sentence: the slug, or a stand-in before a name.
 *  `onDark` for the info bubble; the page style everywhere else. */
function Cmd({ slug, onDark }: { slug: string | null; onDark?: boolean }) {
  return slug ? <code className={onDark ? kind.cmd : kind.slug}>/{slug}</code> : <>/ and the skill name</>;
}

/* ---------- A radio group: roving focus, arrow keys, one always picked ------ */

interface RadioItem {
  id: TriggerMode;
  label: string;
  /** What shows under the label while it is picked (blocks only). */
  body?: ReactNode;
}

function RadioGroup({
  items,
  value,
  onChange,
  layout,
}: {
  items: RadioItem[];
  value: TriggerMode;
  onChange: (m: TriggerMode) => void;
  layout: 'row' | 'stack';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = items.findIndex((it) => it.id === value);
    let next = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % items.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + items.length) % items.length;
    else return;
    e.preventDefault();
    onChange(items[next]!.id);
    ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };
  return (
    <div ref={ref} role="radiogroup" aria-label="How this skill starts" className={styles.group} data-layout={layout} onKeyDown={onKey}>
      {items.map((it) => {
        const on = it.id === value;
        return (
          <div key={it.id} className={styles.item} data-on={on || undefined}>
            <button
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              className={styles.choice}
              onClick={() => onChange(it.id)}
            >
              <Radio checked={on} presentational />
              <span className={styles.choiceLabel}>{it.label}</span>
            </button>
            {on && it.body && <div className={styles.body}>{it.body}</div>}
          </div>
        );
      })}
    </div>
  );
}

/** The click-open explanation of both ways in, shared by tabs and radio. */
export function StartInfo({ slug }: { slug: string | null }) {
  return (
    <InfoButton title="How this skill starts" ariaLabel="How Automatic and Manual work" wide>
      <dl className={kind.defs}>
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

/* ---------- Option 1: blocks ----------------------------------------------- */

function Blocks({ mode, onMode, slug, line }: Props) {
  return (
    <RadioGroup
      layout="stack"
      value={mode}
      onChange={onMode}
      items={[
        {
          id: 'automatic',
          label: 'Automatic',
          body: (
            <>
              <p className={styles.subLabel}>Trigger</p>
              {line}
            </>
          ),
        },
        { id: 'manual', label: 'Manual with /', body: <TriggerManualLine slug={slug} /> },
      ]}
    />
  );
}

/* ---------- Option 2: radio buttons ---------------------------------------- */

function Radios({ mode, onMode, slug, line, labelClass }: Props) {
  return (
    <>
      <h2 className={labelClass}>Trigger</h2>
      <div className={styles.radioRow}>
        <RadioGroup
          layout="row"
          value={mode}
          onChange={onMode}
          items={[
            { id: 'automatic', label: 'Automatic' },
            { id: 'manual', label: 'Manual' },
          ]}
        />
        <StartInfo slug={slug} />
      </div>
      {mode === 'manual' ? <TriggerManualLine slug={slug} /> : line}
    </>
  );
}

/* ---------- Option 3: chips ------------------------------------------------ */

function ToggleChip({ on, onToggle, label, mono }: { on: boolean; onToggle: () => void; label: ReactNode; mono?: boolean }) {
  return (
    <button type="button" className={styles.chip} aria-pressed={on} data-on={on || undefined} onClick={onToggle}>
      <span className={styles.chipIco} aria-hidden>
        {on ? <RiCheckLine /> : <RiAddLine />}
      </span>
      <span className={mono ? styles.chipMono : undefined}>{label}</span>
    </button>
  );
}

function Chips({ mode, onMode, slash, onSlash, slug, line, labelClass }: Props) {
  const auto = mode === 'automatic';
  const both = !auto && !slash;
  return (
    <>
      <h2 className={labelClass}>Trigger</h2>
      {/* With Automatic off, the trigger stays: it is the line people see in
          the / menu. It dims so it does not read as a live rule. */}
      <div className={styles.chipsLine} data-off={!auto || undefined}>
        {line}
      </div>
      <div className={styles.chipRow}>
        <ToggleChip on={auto} onToggle={() => onMode(auto ? 'manual' : 'automatic')} label="Automatic" />
        <ToggleChip
          on={slash}
          onToggle={() => onSlash(!slash)}
          label={slug ? `/${slug}` : '/ command'}
          mono={Boolean(slug)}
        />
        <InfoButton title="How this skill starts" ariaLabel="How the chips work" wide>
          <dl className={kind.defs}>
            <div>
              <dt>Automatic</dt>
              <dd>Hiver AI runs this skill when an email or chat matches the trigger.</dd>
            </div>
            <div>
              <dt>{slug ? `/${slug}` : '/ command'}</dt>
              <dd>People can start this skill with this command in the Assist Agent.</dd>
            </div>
          </dl>
        </InfoButton>
      </div>
      {both && (
        <p className={styles.warn} role="status">
          <RiErrorWarningLine aria-hidden />
          <span>
            This skill does not run. Turn on Automatic or <Cmd slug={slug} />.
          </span>
        </p>
      )}
    </>
  );
}
