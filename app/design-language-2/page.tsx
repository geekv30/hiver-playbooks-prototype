'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  RiArrowLeftLine,
  RiMore2Fill,
  RiPlayLine,
  RiDraggable,
  RiSparklingLine,
  RiInboxLine,
  RiHistoryLine,
  RiSettings3Line,
  RiBookOpenLine,
  RiSearchLine,
  RiArrowRightSLine,
  RiReplyLine,
  RiTimeLine,
  RiPriceTag3Line,
  RiCheckDoubleLine,
  RiAddLine,
} from 'react-icons/ri';
import { SiHubspot, SiSalesforce, SiSlack, SiShopify, SiClickup } from 'react-icons/si';
import styles from './design-language-2.module.css';

type StatusDot = 'ok' | 'running' | 'error' | 'skipped' | 'idle' | 'queued';

function Dot({ s }: { s: StatusDot }) {
  const cls = {
    ok: styles.dotOk,
    running: styles.dotRunning,
    error: styles.dotError,
    skipped: styles.dotSkipped,
    idle: styles.dotIdle,
    queued: styles.dotQueued,
  }[s];
  return <span className={`${styles.dot} ${cls}`} title={s} />;
}

function Tools() {
  return (
    <span className={styles.tools}>
      <button className={styles.tool} title="Test from here"><RiPlayLine /></button>
      <button className={styles.tool} title="Drag"><RiDraggable /></button>
      <button className={styles.tool} title="More"><RiMore2Fill /></button>
    </span>
  );
}

function StepRow({ status, num, children }: { status: StatusDot; num: string; children: React.ReactNode }) {
  return (
    <div className={styles.step}>
      <Dot s={status} />
      <span className={styles.stepNum}>{num}</span>
      <span className={styles.stepBody}>{children}</span>
      <Tools />
    </div>
  );
}

function Chip({ icon, brand, verb, meta }: { icon?: React.ReactNode; brand?: string; verb: string; meta?: string }) {
  return (
    <span className={styles.chip}>
      {icon && <span className={styles.chipIco}>{icon}</span>}
      {brand && (
        <>
          <span className={styles.chipBrand}>{brand}</span>
          <span className={styles.chipSep}>·</span>
        </>
      )}
      <span className={styles.chipVerb}>{verb}</span>
      {meta && <span className={styles.chipMeta}>{meta}</span>}
    </span>
  );
}

function RefChip({ name, src }: { name: string; src: string }) {
  return (
    <span className={styles.refchip}>
      {name}<span className={styles.refSrc}>{src}</span>
    </span>
  );
}

type RailTab = 'playbook' | 'config' | 'test' | 'history';

export default function DesignLanguage2Editor() {
  const [triggerOpen, setTriggerOpen] = useState(true);
  const [tab, setTab] = useState<RailTab>('test');
  const tabs: Array<{ id: RailTab; label: string }> = [
    { id: 'playbook', label: 'Playbook' },
    { id: 'config',   label: 'Config' },
    { id: 'test',     label: 'Test' },
    { id: 'history',  label: 'History' },
  ];

  // Measure-based indicator: positions itself under the active button
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabBtnRefs = useRef<Record<RailTab, HTMLButtonElement | null>>({
    playbook: null, config: null, test: null, history: null,
  });
  const [indicator, setIndicator] = useState<{ x: number; w: number }>({ x: 0, w: 0 });

  const measureIndicator = () => {
    const container = tabsContainerRef.current;
    const btn = tabBtnRefs.current[tab];
    if (!container || !btn) return;
    const c = container.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    setIndicator({ x: b.left - c.left, w: b.width });
  };

  useLayoutEffect(measureIndicator, [tab]);

  useEffect(() => {
    const onResize = () => measureIndicator();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className={styles.shell}>
      {/* ===== Topbar ===== */}
      <div className={styles.topbar}>
        <div className={styles.brand}>H</div>
        <button className={styles.back} title="Back"><RiArrowLeftLine /></button>
        <div className={styles.crumb}>
          <Link href="/">Playbooks</Link>
          <span className={styles.csep}>/</span>
          <span className={styles.pname} contentEditable suppressContentEditableWarning>tour-enquiry</span>
        </div>
        <span className={styles.save}>Saved 12s ago</span>
        <span className={styles.dividerV} />
        <span className={styles.metric}>
          <span className={styles.dotMini} />
          Last run · 2h ago · 94%
        </span>
        <span className={styles.spacer} />
        <button className={`${styles.btn} ${styles.btnGhost}`}>Draft with AI</button>
        <button className={styles.btn}><RiPlayLine /> Test</button>
        <button className={`${styles.btn} ${styles.btnPrimary}`}>Activate</button>
        <span className={styles.statusPill}>Draft</span>
        <button className={styles.kebab}><RiMore2Fill /></button>
      </div>

      {/* ===== Left nav ===== */}
      <nav className={styles.nav}>
        <button className={`${styles.navItem} ${styles.navItemActive}`} title="Playbooks"><RiBookOpenLine /></button>
        <button className={styles.navItem} title="Inbox"><RiInboxLine /></button>
        <button className={styles.navItem} title="History"><RiHistoryLine /></button>
        <button className={styles.navItem} title="Search"><RiSearchLine /></button>
        <span className={styles.navSpacer} />
        <button className={styles.navItem} title="Settings"><RiSettings3Line /></button>
        <div className={styles.avatar}>V</div>
      </nav>

      {/* ===== Canvas ===== */}
      <main className={styles.canvas}>
        <div className={styles.canvasInner}>

          {/* Trigger card (expanded by default in v2) */}
          <div className={styles.trigger}>
            <div className={styles.triggerHead}>
              <span className={styles.triggerLabel}>When</span>
            </div>
            <div className={styles.triggerLine}>
              Email lands in <span className={styles.triggerCode}>info@walkjapan.com</span>
            </div>
            <button
              className={`${styles.triggerFold} ${triggerOpen ? styles.triggerFoldOpen : ''}`}
              onClick={() => setTriggerOpen((v) => !v)}
              type="button"
            >
              <RiArrowRightSLine />
              Example phrases (3)
            </button>
            {triggerOpen && (
              <ul className={styles.triggerExamples}>
                <li>&quot;What tours are available in October?&quot;</li>
                <li>&quot;Can I book the Kumano Kodo for 4 people?&quot;</li>
                <li>&quot;Tell me about your group tours&quot;</li>
              </ul>
            )}
          </div>

          {/* Frontmatter */}
          <div className={styles.fm}>
            <h1 className={styles.fmTitle} contentEditable suppressContentEditableWarning>
              Tour enquiry — Walk Japan
            </h1>
            <div className={styles.fmSummary} contentEditable suppressContentEditableWarning>
              When a tour-enquiry email lands, answer with availability + matching itineraries,
              draft a follow-up if needed, and log the lead in Airtable.
            </div>
          </div>

          {/* Steps */}
          <StepRow status="ok" num="01">
            <Chip icon={<RiSparklingLine />} brand="AI" verb="Extract" meta="tour · dates · group · concerns" /> from the email body.
          </StepRow>

          <StepRow status="ok" num="02">
            <Chip icon={<SiShopify />} brand="Sheets" verb="Get rows" meta="bookings sheet" /> to check availability for <RefChip name="tour.dates" src="01" />.
          </StepRow>

          <StepRow status="running" num="03">
            <Chip icon={<SiHubspot />} brand="HubSpot" verb="Find contact" meta="by from_email" /> to attach the lead history.
          </StepRow>

          {/* Condition */}
          <div className={styles.condition}>
            <div className={styles.condHead}>
              <Dot s="ok" />
              <span className={styles.stepNum}>04</span>
              <div className={styles.condExpr}>
                <span className={styles.condLabel}>Check</span>
                tour is available on <RefChip name="tour.dates" src="01" />
              </div>
            </div>
            <div className={styles.branches}>
              <div className={styles.branch}>
                <div className={styles.branchHead}>
                  <span className={styles.branchTag}>THEN</span>
                </div>
                <div className={styles.branchBody}>
                  Send <Chip icon={<RiReplyLine />} verb="Draft reply" meta="availability + KB links" /> with confirmation and itinerary.
                </div>
              </div>
              <div className={styles.branch}>
                <div className={styles.branchHead}>
                  <span className={styles.branchTag}>ELSE</span>
                </div>
                <div className={styles.branchBody}>
                  Send <Chip icon={<RiReplyLine />} verb="Draft reply" meta="alternatives + similar tours" /> and tag the conversation.
                </div>
              </div>
            </div>
          </div>

          {/* Sub-procedure step (new in v2) */}
          <StepRow status="idle" num="05">
            <span className={styles.subproc}>
              <span className={styles.subprocArrow}>↪</span>
              <span className={styles.subprocLabel}>SUB</span>
              <span>
                <span className={styles.subprocName}>verify-customer</span>
                <span className={styles.subprocMeta}> · 4 steps · v1.2</span>
              </span>
              <button className={styles.subprocOpen}><RiArrowRightSLine /></button>
            </span>
            once we have a probable lead.
          </StepRow>

          <StepRow status="idle" num="06">
            <Chip icon={<RiAddLine />} brand="Airtable" verb="Add row" meta="enquiries" /> with the extracted details so leadgen can follow up.
          </StepRow>

          <StepRow status="idle" num="07">
            <Chip icon={<RiPriceTag3Line />} verb="Tag" meta="@tour.name" /> the conversation for routing.
          </StepRow>

          <StepRow status="idle" num="08">
            <Chip icon={<RiTimeLine />} verb="Wait" meta="5 days" /> for a customer reply.
          </StepRow>

          <StepRow status="idle" num="09">
            <Chip icon={<RiCheckDoubleLine />} verb="Approval" meta="manager · 24h timeout" /> before sending the alternative-tour pitch.
          </StepRow>

          {/* End row */}
          <div className={styles.endRow}>
            <span className={styles.endLabel}>END</span>
            <button className={styles.endAdd} type="button">
              <RiAddLine /> Add step
            </button>
          </div>

        </div>
      </main>

      {/* ===== Right rail ===== */}
      <aside className={styles.rail}>
        <div className={styles.railTabs} ref={tabsContainerRef}>
          {tabs.map((t) => (
            <button
              key={t.id}
              ref={(el) => { tabBtnRefs.current[t.id] = el; }}
              className={`${styles.railTab} ${tab === t.id ? styles.railTabActive : ''}`}
              onClick={() => setTab(t.id)}
              type="button"
            >
              {t.label}
            </button>
          ))}
          <span
            className={styles.railInd}
            style={{ width: indicator.w, transform: `translateX(${indicator.x}px)`, left: 0 }}
          />
        </div>

        <div className={styles.railBody}>
          {tab === 'playbook' && (
            <>
              <div className={styles.railProp}>
                <span className={styles.railPropLabel}>Trigger</span>
                <span className={styles.railPropValue}>Email arrival in <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--body)' }}>info@walkjapan.com</span></span>
              </div>
              <div className={styles.railProp}>
                <span className={styles.railPropLabel}>Owner</span>
                <span className={styles.railPropValue}>Rhys Coleman</span>
              </div>
              <div className={styles.railProp}>
                <span className={styles.railPropLabel}>Connectors</span>
                <div className={styles.connList}>
                  <span className={styles.conn}>
                    <span className={styles.connTile} style={{ background: 'transparent' }}><SiShopify /></span>
                    <span className={styles.connName}>Sheets</span>
                    <span className={`${styles.connState} ${styles.connStateOk}`}>connected</span>
                  </span>
                  <span className={styles.conn}>
                    <span className={styles.connTile} style={{ background: 'transparent' }}><SiHubspot /></span>
                    <span className={styles.connName}>HubSpot</span>
                    <span className={`${styles.connState} ${styles.connStateOk}`}>connected</span>
                  </span>
                  <span className={styles.conn}>
                    <span className={styles.connTile} style={{ background: 'transparent' }}><SiSlack /></span>
                    <span className={styles.connName}>Slack</span>
                    <span className={`${styles.connState} ${styles.connStateUnauthed}`}>connect</span>
                  </span>
                  <span className={styles.conn}>
                    <span className={styles.connTile} style={{ background: 'transparent' }}><SiSalesforce /></span>
                    <span className={styles.connName}>Salesforce</span>
                    <span className={`${styles.connState} ${styles.connStateUnauthed}`}>connect</span>
                  </span>
                  <span className={styles.conn}>
                    <span className={styles.connTile} style={{ background: 'transparent' }}><SiClickup /></span>
                    <span className={styles.connName}>ClickUp</span>
                    <span className={`${styles.connState} ${styles.connStateUnauthed}`}>connect</span>
                  </span>
                </div>
              </div>
              <div className={styles.railProp}>
                <span className={styles.railPropLabel}>Activity (24h)</span>
                <span className={`${styles.railPropValue} mono`} style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--body)' }}>7 runs · 94% success</span>
              </div>
            </>
          )}

          {tab === 'config' && (
            <>
              <div className={styles.railProp}>
                <span className={styles.railPropLabel}>Select a chip</span>
                <span className={styles.railPropValue} style={{ color: 'var(--muted)', fontSize: 12.5 }}>
                  Click any action chip in the canvas to configure it inline here.
                </span>
              </div>
            </>
          )}

          {tab === 'test' && (
            <>
              <div className={styles.railProp} style={{ borderBottom: 0, paddingBottom: 0 }}>
                <span className={styles.railPropLabel}>Sample input</span>
                <textarea
                  className={styles.testPrompt}
                  defaultValue="Hi! Are the Kumano Kodo tours available 13-20 October for 4 people? We have one vegetarian in the group."
                />
                <button className={styles.testRunBtn}><RiPlayLine /> Run preview</button>
              </div>
              <div className={styles.testTrace}>
                <div className={styles.testTraceLabel}>Trace · 2 of 9 steps</div>
                <div className={styles.traceRow}>
                  <span className={`${styles.traceBadge} ${styles.traceBadgeOk}`} />
                  <span className={styles.traceN}>01</span>
                  <span className={styles.traceL}>tour: Kumano Kodo · dates: 13-20 Oct · group: 4</span>
                  <span className={styles.traceD}>1.2s</span>
                </div>
                <div className={styles.traceRow}>
                  <span className={`${styles.traceBadge} ${styles.traceBadgeOk}`} />
                  <span className={styles.traceN}>02</span>
                  <span className={styles.traceL}>Sheets returned 1 row (available)</span>
                  <span className={styles.traceD}>0.4s</span>
                </div>
                <div className={styles.traceRow}>
                  <span className={`${styles.traceBadge} ${styles.traceBadgeRun}`} />
                  <span className={styles.traceN}>03</span>
                  <span className={styles.traceL} style={{ color: 'var(--muted)' }}>HubSpot · finding contact…</span>
                  <span className={styles.traceD}></span>
                </div>
                <div className={styles.traceRow}>
                  <span className={`${styles.traceBadge} ${styles.traceBadgeIdle}`} />
                  <span className={styles.traceN}>04</span>
                  <span className={styles.traceL} style={{ color: 'var(--muted-soft)' }}>queued · Condition</span>
                  <span className={styles.traceD}></span>
                </div>
              </div>
            </>
          )}

          {tab === 'history' && (
            <>
              <div className={styles.testTraceLabel} style={{ marginBottom: 4 }}>Last 24 hours</div>
              <div className={styles.traceRow}>
                <span className={`${styles.traceBadge} ${styles.traceBadgeOk}`} />
                <span className={styles.traceN}>2h</span>
                <span className={styles.traceL}>sara@cohort.co — Kumano Kodo</span>
                <span className={styles.traceD}>2.3s</span>
              </div>
              <div className={styles.traceRow}>
                <span className={`${styles.traceBadge} ${styles.traceBadgeOk}`} />
                <span className={styles.traceN}>4h</span>
                <span className={styles.traceL}>ken@traveler.jp — Nakasendo trail</span>
                <span className={styles.traceD}>1.9s</span>
              </div>
              <div className={styles.traceRow}>
                <span className={`${styles.traceBadge} ${styles.traceBadgeErr}`} />
                <span className={styles.traceN}>5h</span>
                <span className={styles.traceL}>joe@adventure.io — HubSpot timeout</span>
                <span className={styles.traceD}>err</span>
              </div>
              <div className={styles.traceRow}>
                <span className={`${styles.traceBadge} ${styles.traceBadgeOk}`} />
                <span className={styles.traceN}>6h</span>
                <span className={styles.traceL}>maya@birds.com — group of 8</span>
                <span className={styles.traceD}>2.1s</span>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Preview banner */}
      <div className={styles.previewBanner}>
        <span className={styles.bdot} />
        Design Language v2 preview · <Link href="/">back to /</Link> · <Link href="/design-language-1">v1</Link>
      </div>
    </div>
  );
}
