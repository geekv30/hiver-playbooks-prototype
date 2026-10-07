'use client';

import Toolbar from '@/components/flow01/Toolbar';
import EditorLine from '@/components/flow01/EditorLine';
import GutterMarker from '@/components/atoms/GutterMarker';
import ed from '@/components/flow01/EditorCanvas.module.css';
import type { Fragment } from '@/types/playbook';
import { OneChoice, OneChoiceHelp, TwoDoors, TwoSwitches } from './StartControls';
import { EDITED_MAILBOXES, EDITED_NAME, EDITED_SLUG, EDITED_STEPS, type Direction, type StartConfig } from './model';
import styles from './EditorPane.module.css';

const noop = () => {};

interface Props {
  direction: Direction;
  config: StartConfig;
  onConfig: (next: StartConfig) => void;
  trigger: Fragment[];
  onTrigger: (next: Fragment[]) => void;
}

/* The skill editor/skill details page for one skill, with the direction's
   start control in place. Built from the editor's own parts (Toolbar,
   EditorLine, its section and gutter styles) so the control is judged where it
   would ship. */
export default function EditorPane({ direction, config, onConfig, trigger, onTrigger }: Props) {
  const ctl = { config, onChange: onConfig, mailboxes: EDITED_MAILBOXES, slug: EDITED_SLUG };
  // B: a skill that only runs with / has no trigger, only a line for the / menu.
  const whenToUse = direction === 'b' && !config.auto;

  return (
    <div className={styles.pane}>
      <Toolbar title={EDITED_NAME} onTitleChange={noop} status="active" hideSimulate onPause={noop} onSettings={noop} onBack={noop} />
      <div className={styles.scroll}>
        <div className={styles.doc}>
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
                {direction === 'a' && <TwoSwitches {...ctl} />}
                {direction === 'b' && <OneChoiceHelp config={config} mailboxes={EDITED_MAILBOXES} slug={EDITED_SLUG} />}
              </div>
            </div>
          </section>

          {direction === 'c' && (
            <section className={`${ed.block} ${styles.section}`}>
              <div className={ed.row}>
                <span className={ed.gutter} aria-hidden />
                <div className={ed.content}>
                  <h2 className={ed.label}>Who can start it</h2>
                  <TwoDoors {...ctl} />
                </div>
              </div>
            </section>
          )}

          <section className={`${ed.block} ${styles.section}`}>
            <div className={ed.row}>
              <span className={ed.gutter} aria-hidden />
              <div className={ed.content}>
                <h2 className={ed.label}>Description</h2>
              </div>
            </div>
            <ol className={styles.steps}>
              {EDITED_STEPS.map((s, i) => (
                <li key={s} className={ed.row}>
                  <span className={ed.gutter}>
                    <GutterMarker n={i + 1} />
                  </span>
                  <p className={styles.stepText}>{s}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
