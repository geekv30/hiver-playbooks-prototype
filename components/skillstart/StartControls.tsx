'use client';

import { RiErrorWarningLine, RiFlashlightLine, RiSlashCommands2 } from 'react-icons/ri';
import Toggle from '@/components/atoms/Toggle';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import Dropdown from '@/components/atoms/Dropdown';
import { mailboxList } from '@/data/mailboxes';
import { REACH_LABEL, choiceOf, fromChoice, type Choice, type Reach, type StartConfig } from './model';
import styles from './StartControls.module.css';

interface Props {
  config: StartConfig;
  onChange: (next: StartConfig) => void;
  mailboxes: string[];
  slug: string;
}

function Slug({ slug }: { slug: string }) {
  return <code className={styles.slug}>/{slug}</code>;
}

function NeverRuns() {
  return (
    <p className={styles.never} role="status">
      <RiErrorWarningLine aria-hidden />
      With both off, this skill never runs.
    </p>
  );
}

/* A - Two switches. Starting on its own and starting with / are independent,
   both on by default. / follows the skill's mailboxes. */
export function TwoSwitches({ config, onChange, mailboxes, slug }: Props) {
  const where = mailboxList(mailboxes);
  return (
    <div className={styles.switches}>
      <div className={styles.switchRow}>
        <div className={styles.switchText}>
          <span className={styles.switchTitle}>Runs on its own</span>
          <span className={styles.switchSub}>When an email or chat in {where} fits the trigger.</span>
        </div>
        <Toggle checked={config.auto} onChange={(auto) => onChange({ ...config, auto })} ariaLabel="Runs on its own" />
      </div>
      <div className={styles.switchRow}>
        <div className={styles.switchText}>
          <span className={styles.switchTitle}>
            Runs with <Slug slug={slug} />
          </span>
          <span className={styles.switchSub}>When an agent or admin types it in Copilot, on an email or chat in {where}.</span>
        </div>
        <Toggle checked={config.slash} onChange={(slash) => onChange({ ...config, slash })} ariaLabel={`Runs with /${slug}`} />
      </div>
      {!config.auto && !config.slash && <NeverRuns />}
    </div>
  );
}

const CHOICES: { id: Choice; label: string }[] = [
  { id: 'auto', label: 'On its own' },
  { id: 'both', label: 'Either way' },
  { id: 'slash', label: 'Only with /' },
];

/* B - One choice of three, above the trigger. "Only with /" turns the trigger
   into a "When to use" line for the / menu, and / works anywhere. */
export function OneChoice({ config, onChange }: Pick<Props, 'config' | 'onChange'>) {
  return (
    <div className={styles.choice}>
      <span className={styles.choiceLabel} aria-hidden>
        Starts
      </span>
      <SegmentedControl
        size="sm"
        tabs={CHOICES}
        active={choiceOf(config)}
        onChange={(c) => onChange(fromChoice(c, config))}
        ariaLabel="How this skill starts"
      />
    </div>
  );
}

/** The line under B's trigger: what the chosen option means. */
export function OneChoiceHelp({ config, mailboxes, slug }: Omit<Props, 'onChange'>) {
  const choice = choiceOf(config);
  const where = mailboxList(mailboxes);
  return (
    <p className={styles.help}>
      {choice === 'auto' && <>Runs when an email or chat in {where} fits. It is not in Copilot&apos;s / menu.</>}
      {choice === 'both' && (
        <>
          Runs when an email or chat in {where} fits. Agents and admins can also run it with <Slug slug={slug} /> in
          Copilot, anywhere in Hiver.
        </>
      )}
      {choice === 'slash' && (
        <>
          Shown next to <Slug slug={slug} /> in Copilot&apos;s / menu, so people pick the right skill. It never starts on
          its own, so it needs no mailboxes.
        </>
      )}
    </p>
  );
}

const REACH_OPTIONS = (Object.keys(REACH_LABEL) as Reach[]).map((id) => ({ id, label: REACH_LABEL[id] }));

/* C - Two doors, each with its own reach: on its own reaches mailboxes, / reaches
   people. Copilot suggests a fitting skill first and asks before a non-fit. */
export function TwoDoors({ config, onChange, mailboxes, slug }: Props) {
  const where = mailboxList(mailboxes);
  return (
    <div className={styles.doors}>
      <div className={styles.door} data-off={!config.auto || undefined}>
        <span className={styles.doorIco} aria-hidden>
          <RiFlashlightLine />
        </span>
        <div className={styles.switchText}>
          <span className={styles.switchTitle}>Hiver AI</span>
          <span className={styles.switchSub}>On its own, when an email or chat in {where} fits the trigger.</span>
        </div>
        <Toggle checked={config.auto} onChange={(auto) => onChange({ ...config, auto })} ariaLabel="Hiver AI starts it on its own" />
      </div>
      <div className={styles.door} data-off={!config.slash || undefined}>
        <span className={styles.doorIco} aria-hidden>
          <RiSlashCommands2 />
        </span>
        <div className={styles.switchText}>
          <span className={styles.switchTitle}>People</span>
          <span className={styles.switchSub}>
            With <Slug slug={slug} /> in Copilot, anywhere in Hiver.
          </span>
        </div>
        <div className={styles.reach} data-hidden={!config.slash || undefined}>
          <Dropdown
            variant="pill"
            prefix="Who"
            options={REACH_OPTIONS}
            value={config.reach}
            onChange={(id) => onChange({ ...config, reach: id as Reach })}
            ariaLabel="Who can run it with /"
          />
        </div>
        <Toggle checked={config.slash} onChange={(slash) => onChange({ ...config, slash })} ariaLabel="People can start it with /" />
      </div>
      {!config.auto && !config.slash ? (
        <NeverRuns />
      ) : (
        config.slash && (
          <p className={styles.help}>
            Copilot lists it first on an email that fits. On one that does not, it asks before running.
          </p>
        )
      )}
    </div>
  );
}
