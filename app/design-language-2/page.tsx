'use client';
import { useState } from 'react';
import Link from 'next/link';
import { RiPlayLine, RiDraggable, RiMore2Fill, RiArrowRightSLine, RiSparklingLine } from 'react-icons/ri';
import styles from './design-language-2.module.css';

type DotState = 'idle' | 'queued' | 'running' | 'ok' | 'error' | 'skipped';

function StepDot({ state }: { state: DotState }) {
  const cls = {
    idle: styles.dotIdle,
    queued: styles.dotQueued,
    running: styles.dotRunning,
    ok: styles.dotOk,
    error: styles.dotError,
    skipped: styles.dotSkipped,
  }[state];
  return <span className={`${styles.dot} ${cls}`} title={state} />;
}

function StepRow({ status, num, children }: { status: DotState; num: string; children: React.ReactNode }) {
  return (
    <div className={styles.step}>
      <StepDot state={status} />
      <span className={styles.num}>{num}</span>
      <span className={styles.body}>{children}</span>
      <span className={styles.tools}>
        <button className={styles.tool} title="Test from here"><RiPlayLine size={14} /></button>
        <button className={styles.tool} title="Drag"><RiDraggable size={14} /></button>
        <button className={styles.tool} title="More"><RiMore2Fill size={14} /></button>
      </span>
    </div>
  );
}

function Chip({ verb, meta }: { verb: string; meta?: string }) {
  return (
    <span className={styles.chip}>
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

export default function DesignLanguage2Page() {
  const [triggerOpen, setTriggerOpen] = useState(true);
  const [testTab, setTestTab] = useState(0);
  const tabLabels = ['Preview', 'Simulations', 'History'];

  return (
    <>
      <header className={styles.docbar}>
        <div className={styles.brand}>P</div>
        <div className={styles.crumb}>
          <Link href="/">Playbooks · tour-enquiry</Link>
          <span className={styles.csep}>›</span>
          <span className={styles.name}>Design Preview v2</span>
        </div>
        <span className={styles.meta}>OpenAI Agent Builder × Intercom Fin</span>
        <span className={styles.dividerVert} />
        <span className={styles.meta}>v2.0 · 2026-05-23</span>
        <span className={styles.spacer} />
        <span className={styles.pill}>Pattern catalog</span>
        <Link className={styles.linkbtn} href="/design-language-1">v1</Link>
        <Link className={styles.linkbtn} href="/">Back to editor</Link>
      </header>

      <div className={styles.wrap}>
        <span className={styles.eyebrow}>Design Preview · v2 · 2026-05-23</span>
        <h1 className={styles.h1}>OpenAI fluidity + Fin authoring</h1>
        <p className={styles.lede}>
          v2 layers OpenAI Agent Builder's status visibility and inline test on top of Intercom Fin's prose-with-chips authoring.
          No new tokens — v1 foundations stand. Seven new interaction patterns demonstrated below.
        </p>

        {/* 2.1 STATUS INDICATOR */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>2.1</span> Per-step status indicator</span>
          <h2 className={styles.h2}>6px colored dot per step + hover-reveal toolbar</h2>
          <p className={styles.sub}>Hover any row — drag, play, kebab fade in at the right edge.</p>

          <div className={styles.pattern}>
            <div className={styles.patternHead}>
              <h3>Five statuses + skipped</h3>
              <span className={styles.src}>from OpenAI</span>
            </div>
            <div className={styles.patternBody}>
              <div className={styles.steps}>
                <StepRow status="ok" num="01">
                  <Chip verb="AI Extract" meta="tour · dates · group" /> from the email body.
                </StepRow>
                <StepRow status="running" num="02">
                  <Chip verb="Sheets · Get rows" meta="bookings sheet" /> to check availability.
                </StepRow>
                <StepRow status="error" num="03">
                  <Chip verb="HubSpot · Find contact" meta="by from_email" /> <span className={styles.errText}> failed: timeout</span>
                </StepRow>
                <StepRow status="skipped" num="04">
                  <span style={{ color: 'var(--muted-soft)' }}>Branch ELSE — skipped this run.</span>
                </StepRow>
                <StepRow status="idle" num="05">
                  <Chip verb="Tag" meta="tour.name" /> never run.
                </StepRow>
                <StepRow status="queued" num="06">
                  <Chip verb="Wait" meta="5 days" /> queued.
                </StepRow>
              </div>
              <p className={styles.patternNote}>Dot states: <b>ok</b> · <b>running (pulse)</b> · <b>error</b> · <b>skipped (hollow ring)</b> · <b>idle</b> · <b>queued (lavender)</b>.</p>
            </div>
          </div>
        </section>

        {/* 2.5 TRIGGER CARD */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>2.5</span> Expanded trigger card</span>
          <h2 className={styles.h2}>WHEN block with collapsible example phrases</h2>
          <p className={styles.sub}>Click the chevron below to expand or collapse.</p>

          <div className={styles.pattern}>
            <div className={styles.patternHead}>
              <h3>Trigger card</h3>
              <span className={styles.src}>from Fin</span>
            </div>
            <div className={styles.patternBody}>
              <div className={styles.trigger}>
                <div className={styles.triggerHead}><span className={styles.triggerLabel}>When</span></div>
                <div className={styles.triggerLine}>Email lands in <span className={styles.triggerCode}>info@walkjapan.com</span></div>
                <button
                  className={`${styles.triggerFold} ${triggerOpen ? styles.triggerFoldOpen : ''}`}
                  onClick={() => setTriggerOpen((v) => !v)}
                  type="button"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><polyline points="6 4 10 8 6 12" /></svg>
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
            </div>
          </div>
        </section>

        {/* 2.3 TEST WORKSPACE */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>2.3</span> Test workspace</span>
          <h2 className={styles.h2}>Preview · Simulations · History tabs in the rail</h2>
          <p className={styles.sub}>Click tabs to see the indicator slide (200ms spring). Canvas on the left stays visible during test.</p>

          <div className={styles.pattern}>
            <div className={styles.patternHead}>
              <h3>Test workspace</h3>
              <span className={styles.src}>from Fin</span>
            </div>
            <div className={styles.patternBody}>
              <div className={styles.testWs}>
                <div className={styles.testCanvas}>
                  <div className={styles.cnvLabel}>Canvas (steps light up as they run)</div>
                  <div className={styles.miniStep}><span className={styles.dot + ' ' + styles.dotOk} /><span className="n">01</span><span>AI Extract from email body</span></div>
                  <div className={styles.miniStep}><span className={styles.dot + ' ' + styles.dotRunning} /><span className="n">02</span><span>Sheets · Get rows</span></div>
                  <div className={styles.miniStep}><span className={styles.dot + ' ' + styles.dotIdle} /><span className="n">03</span><span>HubSpot · Find contact</span></div>
                  <div className={styles.miniStep}><span className={styles.dot + ' ' + styles.dotIdle} /><span className="n">04</span><span>Condition: tour available</span></div>
                </div>
                <div className={styles.testRail}>
                  <div className={styles.testTabs}>
                    {tabLabels.map((label, i) => (
                      <button
                        key={label}
                        className={`${styles.testTab} ${testTab === i ? styles.testTabActive : ''}`}
                        onClick={() => setTestTab(i)}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                    <span
                      className={styles.testInd}
                      style={{
                        left: 12,
                        width: 60,
                        transform: `translateX(${testTab * 76}px)`,
                      }}
                    />
                  </div>
                  <div className={styles.testBody}>
                    {testTab === 0 && (
                      <>
                        <textarea className={styles.testPrompt} defaultValue="Hi! Are the Kumano Kodo tours available 13-20 October for 4 people?" />
                        <div style={{ marginTop: 10 }}>
                          <div className={styles.testRow}>
                            <span className={`${styles.testBadge} ${styles.testBadgeOk}`} />
                            <span className={styles.testN}>01</span>
                            <span className={styles.testL}>AI Extract → tour: Kumano Kodo, dates: 13-20 Oct, group: 4</span>
                            <span className={styles.testD}>1.2s</span>
                          </div>
                          <div className={styles.testRow}>
                            <span className={`${styles.testBadge} ${styles.testBadgeOk}`} />
                            <span className={styles.testN}>02</span>
                            <span className={styles.testL}>Sheets returned 1 row (available)</span>
                            <span className={styles.testD}>0.4s</span>
                          </div>
                          <div className={styles.testRow}>
                            <span className={`${styles.testBadge} ${styles.testBadgeRun}`} />
                            <span className={styles.testN}>03</span>
                            <span className={styles.testL} style={{ color: 'var(--muted)' }}>Running…</span>
                            <span className={styles.testD}></span>
                          </div>
                        </div>
                      </>
                    )}
                    {testTab === 1 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Saved scenarios (4)</div>
                        <div className={styles.testRow}><span className={`${styles.testBadge} ${styles.testBadgeOk}`} /><span className={styles.testN}>S01</span><span className={styles.testL}>Availability — happy path</span><span className={styles.testD}>passed</span></div>
                        <div className={styles.testRow}><span className={`${styles.testBadge} ${styles.testBadgeOk}`} /><span className={styles.testN}>S02</span><span className={styles.testL}>No availability → alternatives</span><span className={styles.testD}>passed</span></div>
                        <div className={styles.testRow}><span className={`${styles.testBadge} ${styles.testBadgeErr}`} /><span className={styles.testN}>S03</span><span className={styles.testL}>HubSpot timeout retry</span><span className={styles.testD}>failed</span></div>
                        <div className={styles.testRow}><span className={`${styles.testBadge} ${styles.testBadgeOk}`} /><span className={styles.testN}>S04</span><span className={styles.testL}>Returning customer</span><span className={styles.testD}>passed</span></div>
                      </>
                    )}
                    {testTab === 2 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Last 5 production runs</div>
                        <div className={styles.testRow}><span className={`${styles.testBadge} ${styles.testBadgeOk}`} /><span className={styles.testL}>2h ago · sara@example.com</span><span className={styles.testD}>2.3s</span></div>
                        <div className={styles.testRow}><span className={`${styles.testBadge} ${styles.testBadgeOk}`} /><span className={styles.testL}>4h ago · ken@example.com</span><span className={styles.testD}>1.9s</span></div>
                        <div className={styles.testRow}><span className={`${styles.testBadge} ${styles.testBadgeErr}`} /><span className={styles.testL}>5h ago · joe@example.com</span><span className={styles.testD}>timeout</span></div>
                        <div className={styles.testRow}><span className={`${styles.testBadge} ${styles.testBadgeOk}`} /><span className={styles.testL}>6h ago · maya@example.com</span><span className={styles.testD}>2.1s</span></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2.4 SUB-PROCEDURE */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>2.4</span> Sub-procedure step type</span>
          <h2 className={styles.h2}>Reusable playbook as a first-class step</h2>

          <div className={styles.pattern}>
            <div className={styles.patternHead}>
              <h3>Sub-procedure card</h3>
              <span className={styles.src}>from Fin</span>
            </div>
            <div className={styles.patternBody}>
              <div className={styles.steps}>
                <div className={styles.step}>
                  <StepDot state="ok" />
                  <span className={styles.num}>02</span>
                  <span className={styles.body}>
                    <div className={styles.subproc}>
                      <span className="arrow">↪</span>
                      <span className="sublabel">SUB</span>
                      <span>
                        <span className="pname">verify-customer</span>
                        <span className="pmeta">· 4 steps · v1.2</span>
                      </span>
                      <button className="openBtn" type="button"><RiArrowRightSLine /></button>
                    </div>
                  </span>
                  <span className={styles.tools}>
                    <button className={styles.tool}><RiPlayLine size={14} /></button>
                    <button className={styles.tool}><RiDraggable size={14} /></button>
                    <button className={styles.tool}><RiMore2Fill size={14} /></button>
                  </span>
                </div>
              </div>
              <p className={styles.patternNote}>Inserted via the <code style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface-soft)', padding: '1px 6px', borderRadius: 3 }}>@</code> menu → <b>Run sub-procedure</b>. Click → opens the sub-procedure in a side modal.</p>
            </div>
          </div>
        </section>

        {/* 2.6 AI DRAFT */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>2.6</span> AI Draft from prompt</span>
          <h2 className={styles.h2}>Empty-state and topbar entry point</h2>

          <div className={styles.pattern}>
            <div className={styles.patternHead}>
              <h3>Draft card</h3>
              <span className={styles.src}>from Fin</span>
            </div>
            <div className={styles.patternBody}>
              <div className={styles.draftCard}>
                <h3><RiSparklingLine style={{ verticalAlign: 'middle', marginRight: 8 }} />Draft from prompt</h3>
                <p>Describe the workflow in plain English. We&apos;ll write the steps; you keep, edit, or discard.</p>
                <textarea
                  className={styles.draftInput}
                  placeholder="When a customer asks about a refund, look up their order in Shopify, check the policy in our KB, and draft a reply…"
                />
                <button className={styles.draftBtn} type="button">Draft</button>
              </div>
            </div>
          </div>
        </section>

        {/* 2.7 TYPED DATA FLOW */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>2.7</span> Typed data-flow on refs</span>
          <h2 className={styles.h2}>Source-step badge on every @ref</h2>

          <div className={styles.pattern}>
            <div className={styles.patternHead}>
              <h3>Refs show which step produced them</h3>
              <span className={styles.src}>from OpenAI</span>
            </div>
            <div className={styles.patternBody}>
              <div className={styles.steps}>
                <StepRow status="ok" num="04">
                  Send <Chip verb="Draft reply" meta="availability + KB" /> using <RefChip name="tour.dates" src="01" /> and <RefChip name="customer.history" src="03" />.
                </StepRow>
                <StepRow status="idle" num="05">
                  Update <Chip verb="HubSpot · Update contact" /> with <RefChip name="customer.id" src="03" /> and <RefChip name="last_tour" src="04" />.
                </StepRow>
              </div>
              <p className={styles.patternNote}>Hover a source badge (e.g. <RefChip name="dates" src="01" />) → scrolls to and pulses the producing step. The data contract is visible inline.</p>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <ul>
            <li><Link href="/">/ — assembled editor</Link></li>
            <li><Link href="/design-language-1">/design-language-1 — v1 preview</Link></li>
            <li><a href="https://github.com/geekv30/hiver-playbooks-prototype" target="_blank" rel="noreferrer">repo</a></li>
          </ul>
        </footer>
      </div>
    </>
  );
}
