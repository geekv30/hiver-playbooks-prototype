'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { RiMailLine, RiChat3Line } from 'react-icons/ri';
import PanelTabs from '@/components/flow01/copilot/PanelTabs';
import panelStyles from '@/components/flow01/copilot/SidePanel.module.css';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import EvalBackHeader from '@/components/simulate/EvalBackHeader';
import {
  CHAT_EVAL_ENTRIES,
  CHAT_EVAL_ICONS,
  EVAL_ENTRIES,
  EVAL_ICONS,
  EvalCard,
  evalMenuStyles as menu,
} from '@/components/simulate/EvalMenu';
import styles from './page.module.css';

/* Three ways to offer email and chat in the Evaluation tab.
 *
 * A skill is written once and runs on both channels, so the Evaluation tab has
 * to say that a skill can be tested on either, and keep the email options
 * exactly as they ship. Every panel below is built from the REAL pieces - the
 * Copilot | Evaluation tabs, the entry card, the back-header, the segmented
 * control - at the real panel size, so only the arrangement differs. */

type Channel = 'email' | 'chat';

// The stage height at a 1440 x 900 window: the panel is 830px tall in layout
// pixels there (measured on /api-example), and the tab header takes its share.
const PANEL_H = 830;

const noop = () => {};

function emailCards() {
  return EVAL_ENTRIES.map((e) => (
    <EvalCard
      key={e.id}
      icon={EVAL_ICONS[e.id]}
      title={e.title}
      sub={e.sub}
      onClick={noop}
      isNew={e.id === 'matching'}
    />
  ));
}

function chatCards() {
  return CHAT_EVAL_ENTRIES.map((e) => (
    <EvalCard key={e.id} icon={CHAT_EVAL_ICONS[e.id]} title={e.title} sub={e.sub} onClick={noop} />
  ));
}

/** The docked side panel as it ships, with the Evaluation tab active. Reports
 *  whether its content fits the panel, measured, so no note can overstate it. */
function Panel({ children, onFit }: { children: ReactNode; onFit: (fit: Fit) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // The content's own height, not scrollHeight: a short menu leaves
    // scrollHeight equal to the room, which would read as a perfect fit.
    const report = () =>
      onFit({
        content: Array.from(el.children).reduce((h, c) => h + (c as HTMLElement).offsetHeight, 0),
        room: el.clientHeight,
      });
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  });
  return (
    <div className={styles.stage} style={{ height: PANEL_H }}>
      <aside className={panelStyles.panel} aria-label="Evaluation">
        <PanelTabs active="simulate" onChange={noop} />
        <div className={styles.scroll} ref={scrollRef}>
          {children}
        </div>
      </aside>
    </div>
  );
}

interface Fit {
  content: number;
  room: number;
}

/* V1 - a channel switch. The menu keeps its heading and its cards; one control
   above the cards picks the channel. Email is the default, so the tab opens on
   exactly what ships today. */
function V1({ onFit }: { onFit: (f: Fit) => void }) {
  const [channel, setChannel] = useState<Channel>('email');
  return (
    <Panel onFit={onFit}>
      <div className={menu.menu}>
        <h3 className={menu.heading}>Evaluate your skill in one of these ways</h3>
        <SegmentedControl
          tabs={[
            { id: 'email', label: 'Email' },
            { id: 'chat', label: 'Chat' },
          ]}
          active={channel}
          onChange={setChannel}
          ariaLabel="Channel to evaluate on"
        />
        <div className={menu.cards} key={channel}>
          {channel === 'email' ? emailCards() : chatCards()}
        </div>
      </div>
    </Panel>
  );
}

/* V2 - one list, two groups. No new control: every way to evaluate is on the
   one screen, under an Email and a Chat label. */
function V2({ onFit }: { onFit: (f: Fit) => void }) {
  return (
    <Panel onFit={onFit}>
      <div className={menu.menu}>
        <h3 className={menu.heading}>Evaluate your skill in one of these ways</h3>
        <section className={styles.group} aria-label="Email">
          <p className={styles.groupLabel}>Email</p>
          <div className={menu.cards}>{emailCards()}</div>
        </section>
        <section className={styles.group} aria-label="Chat">
          <p className={styles.groupLabel}>Chat</p>
          <div className={menu.cards}>{chatCards()}</div>
        </section>
      </div>
    </Panel>
  );
}

/* V3 - channel first. The menu asks one question, email or chat, and each
   answer opens that channel's ways behind the flows' own back-header. */
function V3({ onFit }: { onFit: (f: Fit) => void }) {
  const [channel, setChannel] = useState<Channel | null>(null);
  return (
    <Panel onFit={onFit}>
      {channel === null ? (
        <div className={menu.menu}>
          <h3 className={menu.heading}>Where do you want to evaluate this skill?</h3>
          <div className={menu.cards}>
            <EvalCard
              icon={<RiMailLine />}
              title="Email"
              sub="Matching emails, recent conversations, AI scenarios, or your own email"
              onClick={() => setChannel('email')}
            />
            <EvalCard
              icon={<RiChat3Line />}
              title="Chat"
              sub="Past chats, AI scenarios, or chat as a customer"
              onClick={() => setChannel('chat')}
            />
          </div>
        </div>
      ) : (
        <>
          <EvalBackHeader
            title={channel === 'email' ? 'Email' : 'Chat'}
            icon={channel === 'email' ? <RiMailLine /> : <RiChat3Line />}
            onBack={() => setChannel(null)}
          />
          <div className={menu.menu}>
            <div className={menu.cards}>{channel === 'email' ? emailCards() : chatCards()}</div>
          </div>
        </>
      )}
    </Panel>
  );
}

const VARIANTS = [
  {
    id: 'v1',
    name: 'Channel switch',
    tag: 'Recommended',
    note: 'One control above the cards picks Email or Chat. Email is the default, so the tab opens on exactly what ships today and the email options are untouched. Each channel shows only its own ways, so the list never grows. This is how Intercom and Pylon handle it: the channel is a selector on the test, not a separate place to test.',
    Render: V1,
  },
  {
    id: 'v2',
    name: 'One list, two groups',
    tag: 'No new control',
    note: 'Every way to evaluate on one screen, under an Email and a Chat label. Nothing to switch and nothing hidden. The cost is length: seven cards do not fit the panel, so the chat ways sit below the fold, where a new user may never scroll to find them.',
    Render: V2,
  },
  {
    id: 'v3',
    name: 'Channel first',
    tag: 'One more click',
    note: 'The first screen asks one question, email or chat, and each answer opens that channel’s ways behind the back-header the flows already use. The first screen is the simplest of the three. The cost is a click on every evaluation, and the email ways move one level down, which changes the tab people already know.',
    Render: V3,
  },
];

function fitLabel(fit: Fit | undefined): string {
  if (!fit) return '';
  const c = Math.round(fit.content);
  const r = Math.round(fit.room);
  return c <= r ? `Fits: ${c}px of content in ${r}px` : `Scrolls: ${c}px of content in ${r}px`;
}

export default function EvalChannelsExhibit() {
  const [fits, setFits] = useState<Record<string, Fit>>({});
  const report = (id: string) => (f: Fit) =>
    setFits((prev) =>
      prev[id]?.content === f.content && prev[id]?.room === f.room ? prev : { ...prev, [id]: f },
    );

  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <p className={styles.eyebrow}>Evaluation · email and chat</p>
        <h1 className={styles.h1}>Three ways to offer both channels in the Evaluation tab</h1>
        <p className={styles.lede}>
          A skill is written once and runs on email and on chat, so the Evaluation tab has to make
          it clear that a skill can be tested on either. The email ways stay exactly as they ship.
          The chat ways are Past chats, AI scenarios and Chat as a customer. Each panel is the real
          side panel at its real size in a 1440 &times; 900 window, built from the shipped pieces,
          so only the arrangement differs. The fit line under each one is measured live.
        </p>
      </header>

      <div className={styles.grid}>
        {VARIANTS.map(({ id, name, tag, note, Render }, i) => (
          <section key={id} className={styles.col}>
            <div className={styles.sectionHead}>
              <h2 className={styles.h2}>
                <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                {name}
              </h2>
              <span className={styles.tag} data-rec={tag === 'Recommended' || undefined}>
                {tag}
              </span>
            </div>
            <p className={styles.note}>{note}</p>
            <p className={styles.fit} data-over={fits[id] && fits[id]!.content > fits[id]!.room ? '' : undefined}>
              {fitLabel(fits[id])}
            </p>
            <Render onFit={report(id)} />
          </section>
        ))}
      </div>
    </main>
  );
}
