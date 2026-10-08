'use client';

import Toolbar from '@/components/flow01/Toolbar';
import GutterMarker from '@/components/atoms/GutterMarker';
import ed from '@/components/flow01/EditorCanvas.module.css';
import type { Fragment } from '@/types/playbook';
import { TriggerSection } from './TriggerSection';
import { EDITED_MAILBOXES, EDITED_NAME, EDITED_STEPS, type Direction, type StartConfig } from './model';
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
   the shared TriggerSection, its section and gutter styles) so the control is judged where it
   would ship. */
export default function EditorPane({ direction, config, onConfig, trigger, onTrigger }: Props) {
  return (
    <div className={styles.pane}>
      <Toolbar title={EDITED_NAME} onTitleChange={noop} status="active" hideSimulate onPause={noop} onSettings={noop} onBack={noop} />
      <div className={styles.scroll}>
        <div className={styles.doc}>
          <TriggerSection
            direction={direction}
            config={config}
            onConfig={onConfig}
            status="active"
            title={EDITED_NAME}
            trigger={trigger}
            onTrigger={onTrigger}
            mailboxes={EDITED_MAILBOXES}
          />

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
