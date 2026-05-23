'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  RiPlayLine, RiDraggable, RiMore2Fill, RiSparklingLine,
  RiReplyLine, RiPriceTag3Line, RiAddLine, RiArrowRightSLine,
} from 'react-icons/ri';
import { SiHubspot, SiShopify } from 'react-icons/si';
import styles from './node.module.css';

type Status = 'idle' | 'queued' | 'running' | 'ok' | 'error' | 'skipped';

const DOT_CLASS: Record<Status, string | undefined> = {
  idle: styles.dotIdle,
  queued: styles.dotQueued,
  running: styles.dotRunning,
  ok: styles.dotOk,
  error: styles.dotError,
  skipped: styles.dotSkipped,
};

const STATUS_TIP: Record<Status, string> = {
  idle: 'Never run',
  queued: 'Queued',
  running: 'Running…',
  ok: 'Last run 2h ago · 1.4s',
  error: 'Failed: timeout',
  skipped: 'Skipped (branch ELSE)',
};

function Dot({ status, onClick }: { status: Status; onClick?: () => void }) {
  return <span className={`${styles.dot} ${DOT_CLASS[status]}`} onClick={onClick} title={STATUS_TIP[status]} />;
}

function Tools({ visible }: { visible?: boolean }) {
  return (
    <span className={styles.tools} style={visible ? { opacity: 1, transform: 'translateY(0)' } : undefined}>
      <button className={styles.tool} title="Test from here"><RiPlayLine /></button>
      <button className={styles.tool} title="Drag"><RiDraggable /></button>
      <button className={styles.tool} title="More"><RiMore2Fill /></button>
    </span>
  );
}

function Chip({
  icon, brand, verb, meta, selected, onClick,
}: {
  icon?: React.ReactNode; brand?: string; verb: string; meta?: string; selected?: boolean; onClick?: () => void;
}) {
  return (
    <span
      className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
      onClick={onClick}
    >
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

function RefChip({ name, src, onClick }: { name: string; src: string; onClick?: () => void }) {
  return (
    <span className={styles.refchip} onClick={onClick}>
      {name}<span className={styles.refSrc}>{src}</span>
    </span>
  );
}

interface RowProps {
  status: Status;
  num: string;
  state?: 'default' | 'selected' | 'editing' | 'dragging' | 'disabled' | 'always-hover';
  children: React.ReactNode;
  onDotClick?: () => void;
}
function NodeRow({ status, num, state = 'default', children, onDotClick }: RowProps) {
  const cls = [styles.row];
  if (state === 'selected') cls.push(styles.rowSelected);
  if (state === 'editing') cls.push(styles.rowEditing);
  if (state === 'dragging') cls.push(styles.rowDragging);
  if (state === 'disabled') cls.push(styles.rowDisabled);
  if (state === 'always-hover') cls.push(styles.rowAlwaysHover);

  return (
    <div className={cls.join(' ')}>
      <Dot status={status} onClick={onDotClick} />
      <span className={styles.num}>{num}</span>
      <span className={styles.body}>{children}</span>
      <Tools />
    </div>
  );
}

export default function NodeComponentPage() {
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [tracePopFor, setTracePopFor] = useState<string | null>(null);

  return (
    <div className={styles.page}>
      <header className={styles.docbar}>
        <div className={styles.brand}>P</div>
        <div className={styles.crumb}>
          <Link href="/">Playbooks</Link>
          <span className={styles.csep}>/</span>
          <Link href="/">Components</Link>
          <span className={styles.csep}>/</span>
          <span className={styles.name}>Node</span>
        </div>
        <span className={styles.meta}>Extraction · 2026-05-23</span>
        <span className={styles.tbDivider} />
        <span className={styles.meta}>OpenAI Agent Builder × Intercom Fin</span>
        <span className={styles.spacer} />
        <Link className={styles.linkbtn} href="/design-language-1">v1</Link>
        <Link className={styles.linkbtn} href="/design-language-2">v2 editor</Link>
        <Link className={styles.linkbtn} href="/">Back to editor</Link>
      </header>

      <div className={styles.wrap}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Component · Node · v2 extraction</span>
          <h1 className={styles.h1}>The floating-island step card</h1>
          <p className={styles.lede}>
            The smallest reusable unit. Canvas, Inspector, Test mode and Run mode all wrap around it.
            Every state below uses the real React component you will see in the assembled editor.
            Each property is tagged with its reference source (OpenAI or Fin) in the paired{' '}
            <Link href="/component/node" style={{ color: 'inherit' }}>extraction.md</Link>.
          </p>
          <div className={styles.heroMeta}>
            <span><strong>Structure:</strong> OpenAI floating island</span>
            <span><strong>Body:</strong> Fin prose-with-chips</span>
            <span><strong>Data flow:</strong> source-step badge on refs, not typed edges</span>
            <span><strong>Mix:</strong> intentional, sourced per property</span>
          </div>
        </div>

        {/* ===== 01 Canonical node ===== */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>01</span> Canonical Node</span>
          <h2 className={styles.h2}>The default action variant, in its hovered state</h2>
          <p className={styles.sub}>Six visible parts: status dot, step number, body, action chip(s), ref chip(s), hover toolbar. Hover to see the toolbar fade in on the other rows below.</p>

          <div className={styles.demoFrame}>
            <div className={styles.demoFrameHead}>Hovered (toolbar pinned for reference)</div>
            <NodeRow status="ok" num="02" state="always-hover">
              <Chip
                icon={<RiSparklingLine />}
                brand="Sheets"
                verb="Get rows"
                meta="bookings sheet"
              />
              {' '}to check availability for{' '}
              <RefChip name="tour.dates" src="01" />.
            </NodeRow>
          </div>

          <div className={styles.demoFrame} style={{ marginTop: 16 }}>
            <div className={styles.demoFrameHead}>Default → hover (move your pointer over each row)</div>
            <NodeRow status="ok" num="01">
              <Chip icon={<RiSparklingLine />} brand="AI" verb="Extract" meta="tour · dates · group · concerns" />
              {' '}from the email body.
            </NodeRow>
            <NodeRow status="ok" num="02">
              <Chip icon={<SiShopify />} brand="Sheets" verb="Get rows" meta="bookings sheet" />
              {' '}to check availability for <RefChip name="tour.dates" src="01" />.
            </NodeRow>
            <NodeRow status="running" num="03">
              <Chip icon={<SiHubspot />} brand="HubSpot" verb="Find contact" meta="by from_email" />
              {' '}to attach the lead history.
            </NodeRow>
          </div>
        </section>

        {/* ===== 02 Status dot states ===== */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>02</span> Status dot states</span>
          <h2 className={styles.h2}>Six states · click a dot to see its run trace</h2>
          <p className={styles.sub}>Click any status dot to open a trace popover (OpenAI pattern). Hover for a quick tooltip.</p>

          <div className={styles.demoFrame}>
            <div style={{ position: 'relative' }}>
              {([
                ['idle', '01', 'idle — never run'],
                ['queued', '02', 'queued — scheduled, waiting'],
                ['running', '03', 'running — currently executing (pulse 1.4s)'],
                ['ok', '04', 'ok — last run succeeded'],
                ['error', '05', 'error — last run failed'],
                ['skipped', '06', 'skipped — a branch chose another path (hollow ring)'],
              ] as const).map(([s, n, label]) => (
                <NodeRow
                  key={s}
                  status={s}
                  num={n}
                  onDotClick={() => setTracePopFor(tracePopFor === s ? null : s)}
                >
                  {label}
                  {tracePopFor === s && (
                    <span
                      className={styles.tracePop}
                      style={{ left: -8, top: 26 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={styles.row}><span className="k">Status</span><span className="v">{s}</span></div>
                      <div className={styles.row}><span className="k">Last run</span><span className="v">2h ago</span></div>
                      <div className={styles.row}><span className="k">Duration</span><span className="v">{s === 'error' ? 'timeout' : '1.4s'}</span></div>
                      <div className={styles.row}><span className="k">Input</span><span className="v">{`{ from_email: "..." }`}</span></div>
                      <div className={styles.row}><span className="k">Output</span><span className="v">{s === 'error' ? '—' : `{ rows: 1 }`}</span></div>
                    </span>
                  )}
                </NodeRow>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 03 Row states ===== */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>03</span> Row states</span>
          <h2 className={styles.h2}>Default · hover · editing · selected · dragging · disabled</h2>

          <div className={styles.demoFrame}>
            <NodeRow status="ok" num="01">
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>default — </em>
              <Chip verb="Run action" /> resting, hover toolbar hidden.
            </NodeRow>
            <NodeRow status="ok" num="02" state="always-hover">
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>hover (pinned) — </em>
              <Chip verb="Run action" /> bg shifts, toolbar fades in.
            </NodeRow>
            <NodeRow status="ok" num="03" state="editing">
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>editing — </em>
              <span style={{ outline: 'none' }}>body has focus, status dimmed. <Chip verb="Inline edit" /></span>
            </NodeRow>
            <NodeRow status="ok" num="04" state="selected">
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>selected — </em>
              a chip inside is being configured. <Chip verb="Tag" meta="tour.name" selected />
            </NodeRow>
            <NodeRow status="ok" num="05" state="dragging">
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>dragging — </em>
              lifted, shadowed, scale(1.01). <Chip verb="Reorder me" />
            </NodeRow>
            <NodeRow status="idle" num="06" state="disabled">
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>disabled — </em>
              <Chip verb="Inactive step" /> opacity .55, no interaction.
            </NodeRow>
          </div>
        </section>

        {/* ===== 04 Mode states ===== */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>04</span> Mode states</span>
          <h2 className={styles.h2}>How the Node responds to canvas-level modes</h2>
          <p className={styles.sub}>Edit (default) · Test (dots animate live) · Run (canvas dims to greyscale, active step lifts out).</p>

          <div className={styles.modeGrid}>
            <div className={styles.modePanel}>
              <div className={styles.modeLabel}>Edit mode</div>
              <NodeRow status="ok" num="01">
                <Chip icon={<RiSparklingLine />} verb="AI Extract" meta="tour · dates" />
              </NodeRow>
              <div className={styles.modeDesc}>Full colour. Hover affordances active. Inline editing allowed.</div>
            </div>

            <div className={styles.modePanel}>
              <div className={styles.modeLabel}>Test mode</div>
              <NodeRow status="running" num="01">
                <Chip icon={<RiSparklingLine />} verb="AI Extract" meta="tour · dates" />
                <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}> · running</em>
              </NodeRow>
              <div className={styles.modeDesc}>Same palette. Status dots animate live as test progresses. Toolbar still visible.</div>
            </div>

            <div className={`${styles.modePanel} ${styles.modeDark}`}>
              <div className={styles.modeLabel}>Run mode</div>
              <div className={`${styles.row} ${styles.runDim}`}>
                <Dot status="ok" /><span className={styles.num}>01</span>
                <span className={styles.body}>step 01 — greyscale</span>
              </div>
              <div className={`${styles.row} ${styles.runActive}`}>
                <Dot status="running" /><span className={styles.num}>02</span>
                <span className={styles.body}>step 02 — focused</span>
              </div>
              <div className={`${styles.row} ${styles.runDim}`}>
                <Dot status="idle" /><span className={styles.num}>03</span>
                <span className={styles.body}>step 03 — greyscale</span>
              </div>
              <div className={styles.modeDesc}>Canvas dims to greyscale. Active step lifts with 4px running-glow. Authoring locked.</div>
            </div>
          </div>
        </section>

        {/* ===== 05 Variants ===== */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>05</span> Variants</span>
          <h2 className={styles.h2}>Condition · Sub-procedure · End</h2>
          <p className={styles.sub}>Same gutter (dot + number) but body shape differs by kind.</p>

          <div className={styles.demoFrame}>
            <div className={styles.demoFrameHead}>Condition Node</div>
            <div className={styles.condition}>
              <div className={styles.condHead}>
                <Dot status="ok" />
                <span className={styles.num}>04</span>
                <div className={styles.condExpr}>
                  <span className={styles.condLabel}>Check</span>
                  tour is available on <RefChip name="tour.dates" src="01" />
                </div>
              </div>
              <div className={styles.branches}>
                <div className={styles.branch}>
                  <span className={styles.branchTag}>Then</span>
                  Send <Chip icon={<RiReplyLine />} verb="Draft reply" meta="availability + KB" /> with confirmation.
                </div>
                <div className={styles.branch}>
                  <span className={styles.branchTag}>Else</span>
                  Send <Chip icon={<RiReplyLine />} verb="Draft reply" meta="alternatives" /> and tag the conversation.
                </div>
              </div>
            </div>
          </div>

          <div className={styles.demoFrame} style={{ marginTop: 16 }}>
            <div className={styles.demoFrameHead}>Sub-procedure Node</div>
            <NodeRow status="idle" num="05">
              <span className={styles.subproc}>
                <span className={styles.subprocArrow}>↪</span>
                <span className={styles.subprocLabel}>SUB</span>
                <span>
                  <span className={styles.subprocName}>verify-customer</span>
                  <span className={styles.subprocMeta}>· 4 steps · v1.2</span>
                </span>
                <button className={styles.tool}><RiArrowRightSLine /></button>
              </span>
              once we have a probable lead.
            </NodeRow>
          </div>

          <div className={styles.demoFrame} style={{ marginTop: 16 }}>
            <div className={styles.demoFrameHead}>End Node</div>
            <div className={styles.endDivider}>
              <span className={styles.label}>END</span>
              <button className={styles.endAdd}><RiAddLine /> Add step</button>
            </div>
          </div>
        </section>

        {/* ===== 06 Click-chip → Inspector ===== */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>06</span> Click chip → Inspector</span>
          <h2 className={styles.h2}>The contextual right panel opens on chip click, not on Node click</h2>
          <p className={styles.sub}>Click the <Chip verb="Tag" meta="@tour.name" /> chip below. Inspector slides into view. Click off to dismiss.</p>

          <div className={styles.inspectorMock}>
            <div className={styles.inspectorCanvas}>
              <NodeRow status="ok" num="07" state={selectedChip === 'tag' ? 'selected' : 'default'}>
                <Chip
                  icon={<RiPriceTag3Line />}
                  verb="Tag"
                  meta="@tour.name"
                  selected={selectedChip === 'tag'}
                  onClick={() => setSelectedChip(selectedChip === 'tag' ? null : 'tag')}
                />
                {' '}the conversation for routing.
              </NodeRow>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                Click the chip → Inspector opens. Click chip again or click outside → Inspector closes.
              </div>
            </div>
            <div className={styles.inspectorPanel}>
              {selectedChip === 'tag' ? (
                <>
                  <div className={styles.inspectorPanelHead}>Inspector</div>
                  <div className={styles.inspectorPanelTitle}>Tag · configure</div>
                  <div className={styles.inspectorField}>
                    <span className={styles.inspectorLabel}>Tags to apply</span>
                    <input className={styles.inspectorInput} defaultValue="@tour.name" />
                  </div>
                  <div className={styles.inspectorField}>
                    <span className={styles.inspectorLabel}>Apply mode</span>
                    <input className={styles.inspectorInput} defaultValue="Replace existing" />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 18 }}>
                    Inspector content depends on the selected chip's action type.
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--muted-soft)', padding: '16px 0' }}>
                  No chip selected. Inspector reclaims space when nothing is being configured.
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <Link href="/">/ assembled editor</Link>
          <Link href="/design-language-1">/design-language-1</Link>
          <Link href="/design-language-2">/design-language-2</Link>
          <a href="https://github.com/geekv30/hiver-playbooks-prototype" target="_blank" rel="noreferrer">repo</a>
        </footer>
      </div>
    </div>
  );
}
