'use client';

import { useEffect, useRef, useState } from 'react';
import EditorLine from '@/components/flow01/EditorLine';
import Toolbar from '@/components/flow01/Toolbar';
import ed from '@/components/flow01/EditorCanvas.module.css';
import { lineHasContent, type DeployStatus } from '@/components/flow01/doc';
import type { Fragment } from '@/types/playbook';
import { OneChoice, OneChoiceHelp, TwoDoors, TwoSwitches, type StartCtx } from './StartControls';
import type { Direction, StartConfig } from './model';
import styles from './TriggerSection.module.css';

/** The / command a name gives a skill: "Refund requests" -> "refund-requests". */
export function slugFor(title: string): string | null {
  const t = title.trim();
  if (!t || t === 'Untitled skill') return null;
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || null;
}

interface SectionProps {
  direction: Direction;
  config: StartConfig;
  onConfig: (next: StartConfig) => void;
  status: DeployStatus;
  title: string;
  trigger: Fragment[];
  onTrigger: (next: Fragment[]) => void;
  mailboxes: string[];
  clash?: boolean;
}

/* The Trigger section of the skill editor/skill details page with the
   direction's start control in place (and C's "Who can start it" section).
   The one renderer for every state on the review page and the live pane. */
export function TriggerSection({ direction, config, onConfig, status, title, trigger, onTrigger, mailboxes, clash }: SectionProps) {
  const hasTrigger = lineHasContent(trigger);
  const ctx: StartCtx = { config, onChange: onConfig, status, mailboxes, slug: slugFor(title), clash, hasTrigger };
  // B: a skill that only runs with / has no trigger, only a line for the / menu.
  const whenToUse = direction === 'b' && !config.auto;

  return (
    <>
      <section className={ed.block}>
        <div className={ed.row}>
          <span className={ed.gutter} aria-hidden />
          <div className={ed.content}>
            <h2 className={ed.label}>{whenToUse ? 'When to use' : 'Trigger'}</h2>
            {direction === 'b' && <OneChoice config={config} onChange={onConfig} />}
            <div className={ed.triggerLine}>
              <EditorLine
                fragments={trigger}
                placeholder={whenToUse ? 'e.g. when someone asks for a refund' : 'e.g. when an email asks for a refund'}
                onChange={onTrigger}
                noActions
                ariaLabel={whenToUse ? 'When to use this skill' : 'When should this skill run'}
              />
            </div>
            {direction === 'a' && <TwoSwitches {...ctx} />}
            {direction === 'b' && <OneChoiceHelp {...ctx} />}
          </div>
        </div>
      </section>
      {direction === 'c' && (
        <section className={`${ed.block} ${styles.after}`}>
          <div className={ed.row}>
            <span className={ed.gutter} aria-hidden />
            <div className={ed.content}>
              <h2 className={ed.label}>Who can start it</h2>
              <TwoDoors {...ctx} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/** What changed, in one line, for the toast on a live skill. */
export function changeLine(prev: StartConfig, next: StartConfig, slug: string | null): string {
  const cmd = slug ? `/${slug}` : 'its / command';
  if (!prev.auto && prev.slash && next.auto && !next.slash) return 'This skill now runs only on its own.';
  if (!next.auto && !next.slash) return 'This skill does not run.';
  if (prev.auto && !next.auto) return next.slash ? `This skill now runs only with ${cmd}.` : 'This skill does not run.';
  if (!prev.auto && next.auto) return 'This skill runs on its own again.';
  if (prev.slash && !next.slash) return 'This skill is not in the / menu now.';
  if (!prev.slash && next.slash) return 'This skill is in the / menu again.';
  if (prev.reach !== next.reach)
    return next.reach === 'everyone' ? 'Everyone can use / now.' : next.reach === 'me' ? 'Only you can use / now.' : 'Only the Billing team can use / now.';
  return 'Saved.';
}

export interface FrameSeed {
  title: string;
  status: DeployStatus;
  trigger: Fragment[];
  config: StartConfig;
  mailboxes: string[];
  clash?: boolean;
  /** Open on the toast a live change shows, as if a switch was just flipped. */
  toast?: { line: string; undo: StartConfig };
}

const TOAST_MS = 6000;

/* One state, live: a toolbar and the trigger section seeded to the state, then
   fully interactive. Changes on a live skill apply at once and say so in a
   toast with Undo, the way Pause does. */
export function StateFrame({ direction, seed }: { direction: Direction; seed: FrameSeed }) {
  const [title, setTitle] = useState(seed.title);
  const [status, setStatus] = useState(seed.status);
  const [trigger, setTrigger] = useState(seed.trigger);
  const [config, setConfig] = useState(seed.config);
  const [toast, setToast] = useState(seed.toast ?? null);
  const seeded = useRef(Boolean(seed.toast));

  // A seeded toast stays until it is used; one from a real change times out.
  useEffect(() => {
    if (!toast || seeded.current) return;
    const t = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  const change = (next: StartConfig) => {
    if (status === 'active') {
      seeded.current = false;
      setToast({ line: changeLine(config, next, slugFor(title)), undo: config });
    }
    setConfig(next);
  };
  const live = status !== 'draft';
  const mailboxes = live ? seed.mailboxes : [];

  return (
    <div className={styles.frame}>
      <Toolbar
        title={title}
        onTitleChange={setTitle}
        status={status}
        hideSimulate
        canEnable={lineHasContent(trigger)}
        onEnable={() => setStatus('active')}
        onPause={() => setStatus('paused')}
        onResume={() => setStatus('active')}
        onSettings={() => {}}
        onBack={() => {}}
      />
      <div className={styles.doc}>
        <TriggerSection
          direction={direction}
          config={config}
          onConfig={change}
          status={status}
          title={title}
          trigger={trigger}
          onTrigger={setTrigger}
          mailboxes={mailboxes}
          clash={seed.clash && slugFor(title) === slugFor(seed.title)}
        />
      </div>
      {toast && (
        <div className={styles.toast} role="status">
          <span>{toast.line}</span>
          <button
            type="button"
            className={styles.toastAction}
            onClick={() => {
              setConfig(toast.undo);
              setToast(null);
            }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
