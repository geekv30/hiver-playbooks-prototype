'use client';

import type { ReactNode } from 'react';
import { RiErrorWarningLine, RiFlashlightLine, RiPauseCircleLine, RiSlashCommands2 } from 'react-icons/ri';
import Toggle from '@/components/atoms/Toggle';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import Dropdown from '@/components/atoms/Dropdown';
import { mailboxList } from '@/data/mailboxes';
import type { DeployStatus } from '@/components/flow01/doc';
import { REACH_LABEL, choiceOf, fromChoice, type Choice, type Reach, type StartConfig } from './model';
import styles from './StartControls.module.css';

/** Everything the start controls read about the skill. */
export interface StartCtx {
  config: StartConfig;
  onChange: (next: StartConfig) => void;
  status: DeployStatus;
  /** Empty until the skill is enabled: mailboxes are picked at Enable. */
  mailboxes: string[];
  /** Null until the skill has a name: the / command comes from the name. */
  slug: string | null;
  /** Another skill already uses this / command. */
  clash?: boolean;
  /** The trigger (or "When to use") line has something in it. */
  hasTrigger: boolean;
}

/** "in Billing and Refunds", or where they will come from on a draft. */
function where(mailboxes: string[]): string {
  return mailboxes.length ? `in ${mailboxList(mailboxes)}` : 'in the mailboxes you pick at Enable';
}

export function Slug({ slug, clash }: { slug: string; clash?: boolean }) {
  return (
    <code className={styles.slug} data-clash={clash || undefined}>
      /{slug}
    </code>
  );
}

/** The / command inline in a sentence: the slug, or a stand-in before a name. */
function Command({ slug, clash }: { slug: string | null; clash?: boolean }) {
  return slug ? <Slug slug={slug} clash={clash} /> : <>its / command</>;
}

type Tone = 'warn' | 'error' | 'quiet';
function Notice({ tone, icon, children }: { tone: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <p className={styles.notice} data-tone={tone} role={tone === 'quiet' ? undefined : 'status'}>
      {icon ?? <RiErrorWarningLine aria-hidden />}
      <span>{children}</span>
    </p>
  );
}

/** The / row's second line: what typing it does, or why it cannot yet. */
function slashSub(ctx: StartCtx, lead: ReactNode): ReactNode {
  if (ctx.clash && ctx.slug)
    return (
      <span className={styles.subError}>
        Another skill already uses /{ctx.slug}. Rename this skill to give it its own command.
      </span>
    );
  if (!ctx.slug) return 'Name the skill to get its / command.';
  return lead;
}

/** The one line under the controls that matters most right now, if any. */
function StateNotice({ ctx, direction }: { ctx: StartCtx; direction: 'a' | 'b' | 'c' }) {
  const { config, status } = ctx;
  if (status === 'paused')
    return (
      <Notice tone="quiet" icon={<RiPauseCircleLine aria-hidden />}>
        Paused. Nothing starts, on its own or with /, until you resume.
      </Notice>
    );
  if (!config.auto && !config.slash) return <Notice tone="warn">With both off, this skill never runs.</Notice>;
  if (!config.auto && !ctx.hasTrigger)
    return (
      <Notice tone="warn">
        {direction === 'b' ? 'Write when to use it.' : 'Write a trigger.'} It is the line people read next to{' '}
        <Command slug={ctx.slug} /> in the / menu.
      </Notice>
    );
  if (!config.auto && direction !== 'b')
    return (
      <Notice tone="quiet" icon={<RiSlashCommands2 aria-hidden />}>
        It does not run on its own, so the trigger only tells people when to use it in the / menu.
      </Notice>
    );
  return null;
}

/* A - Two switches. Starting on its own and starting with / are independent,
   both on by default. / follows the skill's mailboxes. */
export function TwoSwitches(ctx: StartCtx) {
  const { config, onChange, mailboxes, slug, clash } = ctx;
  return (
    <div className={styles.switches}>
      <div className={styles.switchRow}>
        <div className={styles.switchText}>
          <span className={styles.switchTitle}>Runs on its own</span>
          <span className={styles.switchSub}>When an email or chat {where(mailboxes)} fits the trigger.</span>
        </div>
        <Toggle checked={config.auto} onChange={(auto) => onChange({ ...config, auto })} ariaLabel="Runs on its own" />
      </div>
      <div className={styles.switchRow}>
        <div className={styles.switchText}>
          <span className={styles.switchTitle}>
            Runs with <Command slug={slug} clash={clash} />
          </span>
          <span className={styles.switchSub}>
            {slashSub(ctx, <>When an agent or admin types it in Copilot, on an email or chat {where(mailboxes)}.</>)}
          </span>
        </div>
        <Toggle checked={config.slash} onChange={(s) => onChange({ ...config, slash: s })} ariaLabel="Runs with /" />
      </div>
      <StateNotice ctx={ctx} direction="a" />
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
export function OneChoice({ config, onChange }: Pick<StartCtx, 'config' | 'onChange'>) {
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
export function OneChoiceHelp(ctx: StartCtx) {
  const { config, mailboxes, slug, clash } = ctx;
  const choice = choiceOf(config);
  const notice = <StateNotice ctx={ctx} direction="b" />;
  return (
    <>
      <p className={styles.help}>
        {choice === 'auto' && <>Runs on its own when an email or chat {where(mailboxes)} fits. It is not in Copilot&apos;s / menu.</>}
        {choice === 'both' && (
          <>
            Runs on its own when an email or chat {where(mailboxes)} fits. Agents and admins can also run it with{' '}
            <Command slug={slug} clash={clash} /> in Copilot, anywhere in Hiver.
          </>
        )}
        {choice === 'slash' && (
          <>
            Shown next to <Command slug={slug} clash={clash} /> in Copilot&apos;s / menu, so people pick the right skill. It
            never starts on its own, so it needs no mailboxes.
          </>
        )}
      </p>
      {choice !== 'auto' && (clash || !slug) && <p className={styles.help}>{slashSub(ctx, null)}</p>}
      {notice}
    </>
  );
}

const REACH_OPTIONS = (Object.keys(REACH_LABEL) as Reach[]).map((id) => ({ id, label: REACH_LABEL[id] }));

/* C - Two doors, each with its own reach: on its own reaches mailboxes, / reaches
   people. Copilot suggests a fitting skill first and asks before a non-fit. */
export function TwoDoors(ctx: StartCtx) {
  const { config, onChange, mailboxes, slug, clash } = ctx;
  return (
    <div className={styles.doors}>
      <div className={styles.door} data-off={!config.auto || undefined}>
        <span className={styles.doorIco} aria-hidden>
          <RiFlashlightLine />
        </span>
        <div className={styles.switchText}>
          <span className={styles.switchTitle}>Hiver AI</span>
          <span className={styles.switchSub}>On its own, when an email or chat {where(mailboxes)} fits the trigger.</span>
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
            {slashSub(
              ctx,
              <>
                With <Command slug={slug} clash={clash} /> in Copilot, anywhere in Hiver.
              </>,
            )}
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
        <Toggle checked={config.slash} onChange={(s) => onChange({ ...config, slash: s })} ariaLabel="People can start it with /" />
      </div>
      <StateNotice ctx={ctx} direction="c" />
      {config.slash && config.reach === 'me' && ctx.status !== 'paused' && (
        <p className={styles.help}>Only you see it in the / menu. Share it with a team or everyone when it is ready.</p>
      )}
      {config.slash && config.reach !== 'me' && config.auto && ctx.status !== 'paused' && (
        <p className={styles.help}>Copilot lists it first on an email that fits. On one that does not, it asks before running.</p>
      )}
    </div>
  );
}
