'use client';

import { useEffect, useRef, useState } from 'react';
import EditorLine from '@/components/flow01/EditorLine';
import Toolbar from '@/components/flow01/Toolbar';
import ed from '@/components/flow01/EditorCanvas.module.css';
import { lineHasContent, type DeployStatus, type TriggerMode } from '@/components/flow01/doc';
import { TRIGGER_PLACEHOLDER, modeChangeLine, slashChangeLine, slugFor } from '@/components/flow01/TriggerKind';
import TriggerStart, { type StartUi } from '@/components/flow01/TriggerStart';
import type { Fragment } from '@/types/playbook';
import styles from './TriggerSection.module.css';

export interface StartSeed {
  title: string;
  status: DeployStatus;
  trigger: Fragment[];
  mode: TriggerMode;
  /** / in the Assist Agent (chips only turn it off). */
  slash?: boolean;
  /** Open on the toast a live change shows. */
  toast?: string;
}

const TOAST_MS = 6000;

/* One state of a start layout, live: the editor's toolbar and Trigger section,
   seeded, then fully working. The same TriggerStart the full editor renders. */
export default function StartFrame({ ui, seed }: { ui: StartUi; seed: StartSeed }) {
  const [title, setTitle] = useState(seed.title);
  const [status, setStatus] = useState(seed.status);
  const [trigger, setTrigger] = useState(seed.trigger);
  const [mode, setMode] = useState(seed.mode);
  const [slash, setSlash] = useState(seed.slash ?? true);
  const [toast, setToast] = useState<{ line: string; undo: () => void } | null>(
    seed.toast ? { line: seed.toast, undo: () => setMode(seed.mode === 'manual' ? 'automatic' : 'manual') } : null,
  );
  const seeded = useRef(Boolean(seed.toast));

  // A seeded toast stays until it is used; one from a real change times out.
  useEffect(() => {
    if (!toast || seeded.current) return;
    const t = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  const slug = slugFor(title);
  const say = (line: string, undo: () => void) => {
    if (status !== 'active') return;
    seeded.current = false;
    setToast({ line, undo });
  };
  const changeMode = (m: TriggerMode) => {
    if (m === mode) return;
    const prev = mode;
    setMode(m);
    say(modeChangeLine(m, slug, slash), () => setMode(prev));
  };
  const changeSlash = (on: boolean) => {
    setSlash(on);
    say(slashChangeLine(on, slug, mode === 'automatic'), () => setSlash(!on));
  };
  const ready = mode === 'manual' || lineHasContent(trigger);
  const runs = mode === 'automatic' || slash;

  return (
    <div className={styles.frame}>
      <Toolbar
        title={title}
        onTitleChange={setTitle}
        status={status}
        hideSimulate
        canEnable={ready && runs}
        onEnable={() => setStatus('active')}
        onPause={() => setStatus('paused')}
        onResume={() => setStatus('active')}
        onSettings={() => {}}
        onBack={() => {}}
      />
      <div className={styles.doc}>
        <section className={ed.block}>
          <div className={ed.row}>
            <span className={ed.gutter} aria-hidden />
            <div className={ed.content}>
              <TriggerStart
                ui={ui}
                mode={mode}
                onMode={changeMode}
                slash={slash}
                onSlash={changeSlash}
                slug={slug}
                labelClass={ed.label}
                line={
                  <div className={ed.triggerLine}>
                    <EditorLine
                      fragments={trigger}
                      placeholder={TRIGGER_PLACEHOLDER}
                      onChange={setTrigger}
                      noActions
                      ariaLabel="When should this skill run"
                    />
                  </div>
                }
              />
            </div>
          </div>
        </section>
      </div>
      {toast && (
        <div className={styles.toast} role="status">
          <span>{toast.line}</span>
          <button
            type="button"
            className={styles.toastAction}
            onClick={() => {
              toast.undo();
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
