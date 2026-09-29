'use client';

import { useMemo, useState } from 'react';
import PanelTabs from '@/components/flow01/copilot/PanelTabs';
import panelStyles from '@/components/flow01/copilot/SidePanel.module.css';
import { exampleDoc, lineToText } from '@/components/flow01/doc';
import SimulatePanel from '@/components/simulate/SimulatePanel';
import type { ChatEvalView, EvalChannel } from '@/components/simulate/EvalMenu';
import { ALL_CHAT_WAYS, ALL_EVAL_CHANNELS, CHAT_WAYS } from '@/components/simulate/evalChannels';
import { useTriggerScan } from '@/components/simulate/useTriggerScan';
import { useLiveCopilot } from '@/lib/copilot/useLiveCopilot';
import exhibit from '../eval-channels/page.module.css';
import { LIBRARY, type LibChannel } from './registry';
import styles from './page.module.css';

/* The Evaluation library: every evaluation flow, of both channels, usable in
 * the real panel - including the chat ways the app has paused - beside an
 * index of the pieces they are built from. */

const CHANNEL_LABEL: Record<LibChannel, string> = { email: 'Email', chat: 'Chat', both: 'Both' };

/** A chat way that is off in the app right now. */
const pausedWay = (way?: ChatEvalView) => !!way && !CHAT_WAYS.includes(way);

function LivePanel() {
  const doc = useMemo(() => exampleDoc(), []);
  const trigger = useMemo(() => lineToText(doc.trigger), [doc.trigger]);
  const scan = useTriggerScan(trigger);
  const live = useLiveCopilot();
  const [channel, setChannel] = useState<EvalChannel>('chat');
  const [matchingIsNew, setMatchingIsNew] = useState(true);
  return (
    <div className={styles.stage}>
      <aside className={panelStyles.panel} aria-label="Evaluation library panel">
        <PanelTabs active="simulate" onChange={() => {}} />
        <div className={styles.panelBody}>
          <SimulatePanel
            docked
            open
            hasScenarios
            hasTrigger
            trigger={trigger}
            mailboxes={doc.mailboxes}
            scan={scan}
            matchingIsNew={matchingIsNew}
            onMatchingSeen={() => setMatchingIsNew(false)}
            doc={doc}
            live={live}
            channel={channel}
            onChannel={setChannel}
            channels={ALL_EVAL_CHANNELS}
            chatWays={ALL_CHAT_WAYS}
          />
        </div>
      </aside>
    </div>
  );
}

export default function EvaluationLibrary() {
  return (
    <main className={exhibit.page}>
      <header className={exhibit.pageHead}>
        <p className={exhibit.eyebrow}>Evaluation · library</p>
        <h1 className={exhibit.h1}>Every way to evaluate a skill, and what it is built from</h1>
        <p className={exhibit.lede}>
          The app offers every email way and, on chat, only <strong>Chat as a customer</strong> for now. This page
          keeps every way usable in the real panel, with the example skill, so nothing paused is lost. To bring a
          chat way back, add it to <code className={styles.code}>CHAT_WAYS</code> in{' '}
          <code className={styles.code}>components/simulate/evalChannels.ts</code>. The full write-up of every piece
          is <code className={styles.code}>docs/EVALUATION_COMPONENTS.md</code>.
        </p>
      </header>

      <div className={styles.layout}>
        <LivePanel />
        <div className={styles.index}>
          {LIBRARY.map((g) => (
            <section key={g.title} className={styles.group}>
              <h2 className={styles.groupTitle}>{g.title}</h2>
              <ul className={styles.rows}>
                {g.entries.map((e) => (
                  <li key={e.name} className={styles.row}>
                    <div className={styles.rowHead}>
                      <span className={styles.name}>{e.name}</span>
                      <span className={styles.chip} data-channel={e.channel} data-paused={pausedWay(e.way) || undefined}>
                        {CHANNEL_LABEL[e.channel]}
                        {pausedWay(e.way) ? ' · paused' : ''}
                      </span>
                    </div>
                    <p className={styles.what}>{e.what}</p>
                    <code className={styles.file}>{e.file}</code>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
