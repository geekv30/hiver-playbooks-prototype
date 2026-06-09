'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  RiPlayLine, RiDraggable, RiMore2Fill, RiSparklingLine,
  RiReplyLine, RiPriceTag3Line, RiAddLine, RiArrowRightSLine, RiCloseLine,
} from 'react-icons/ri';
import { SiHubspot, SiShopify } from 'react-icons/si';
import styles from './node.module.css';

type Status = 'idle' | 'queued' | 'running' | 'ok' | 'error' | 'skipped';
type Mode = 'edit' | 'test' | 'run';

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

function Dot({ status, onClick }: { status: Status; onClick?: (e: React.MouseEvent) => void }) {
  return <span className={`${styles.dot} ${DOT_CLASS[status]}`} onClick={onClick} title={STATUS_TIP[status]} />;
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

function Chip({
  icon, brand, verb, meta, selected, bucket, onClick,
}: {
  icon?: React.ReactNode; brand?: string; verb: string; meta?: string; selected?: boolean; bucket?: 'read' | 'ticket' | 'external' | 'human' | 'wait' | 'flow'; onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <span
      className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
      data-bucket={bucket}
      onClick={onClick}
      data-chip
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

function RefChip({ name, src }: { name: string; src: string }) {
  return (
    <span className={styles.refchip}>
      {name}<span className={styles.refSrc}>{src}</span>
    </span>
  );
}

interface CardProps {
  status: Status;
  num: string;
  selected?: boolean;
  editing?: boolean;
  dragging?: boolean;
  disabled?: boolean;
  error?: boolean;
  forceHover?: boolean;
  runActive?: boolean;
  children: React.ReactNode;
  onDotClick?: (e: React.MouseEvent) => void;
}
function NodeCard({
  status, num, selected, editing, dragging, disabled, error, forceHover, runActive, children, onDotClick,
}: CardProps) {
  const cls = [styles.card];
  if (selected) cls.push(styles.cardSelected);
  if (editing) cls.push(styles.cardEditing);
  if (dragging) cls.push(styles.cardDragging);
  if (disabled) cls.push(styles.cardDisabled);
  if (error) cls.push(styles.cardError);
  if (forceHover) cls.push(styles.cardForceHover);
  if (runActive) cls.push(styles.cardRunActive);

  return (
    <div className={cls.join(' ')}>
      <div className={styles.row}>
        <Dot status={status} onClick={onDotClick} />
        <span className={styles.num}>{num}</span>
        <span className={styles.body}>{children}</span>
        <Tools />
      </div>
    </div>
  );
}

export default function NodeComponentPage() {
  const [mode, setMode] = useState<Mode>('edit');
  const [inspectorChip, setInspectorChip] = useState<string | null>(null);
  const [tracePopFor, setTracePopFor] = useState<string | null>(null);

  // Per-mode card status overlays (so Test mode actually animates dots and Run highlights a card)
  const liveStatus = (defaultStatus: Status, idx: number): Status => {
    if (mode === 'test') {
      if (idx === 0) return 'ok';
      if (idx === 1) return 'running';
      return 'idle';
    }
    if (mode === 'run') {
      if (idx === 1) return 'running';
      return defaultStatus;
    }
    return defaultStatus;
  };

  return (
    <div className={styles.page} onClick={() => { setInspectorChip(null); setTracePopFor(null); }}>
      <header className={styles.docbar}>
        <div className={styles.brand}>P</div>
        <div className={styles.crumb}>
          <Link href="/atoms">AOPs</Link>
          <span className={styles.csep}>/</span>
          <Link href="/atoms">Components</Link>
          <span className={styles.csep}>/</span>
          <span className={styles.name}>Node</span>
        </div>
        <span className={styles.meta}>Extraction · v2 · 05/23/2026</span>
        <span className={styles.tbDivider} />
        <span className={styles.meta}>OpenAI Agent Builder × Intercom Fin</span>
        <span className={styles.spacer} />
        <Link className={styles.linkbtn} href="/design-language-1">v1</Link>
        <Link className={styles.linkbtn} href="/design-language-2">v2 editor</Link>
        <Link className={styles.linkbtn} href="/atoms">Back to editor</Link>
      </header>

      <div className={styles.wrap}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Component · Node · v2 extraction</span>
          <h1 className={styles.h1}>Floating islands on a textured canvas</h1>
          <p className={styles.lede}>
            Each Node is a card with elevation, sitting on a dot-grid canvas.
            Click the mode toggle to switch between Edit / Test / Run - Test animates the dots live;
            Run dims the canvas to grayscale and lifts the active card with a glow.
            Click any chip → contextual Inspector slides in from the right. Click off → it slides out.
          </p>
          <div className={styles.heroMeta}>
            <span><strong>Structure:</strong> OpenAI floating island</span>
            <span><strong>Body:</strong> Fin prose-with-chips</span>
            <span><strong>Modes:</strong> Edit · Test · Run</span>
            <span><strong>Inspector:</strong> contextual slide-in</span>
          </div>
        </div>

        {/* ===== 01 LIVING CANVAS ===== */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>01</span> Living canvas</span>
          <h2 className={styles.h2}>One canvas, three modes, real interactions</h2>
          <p className={styles.sub}>
            The Walk Japan AOP as Nodes on a textured canvas. Switch modes with the pill toggle.
            Hover any card → toolbar fades in. Click a chip → Inspector slides in. Click a status dot → trace popover.
          </p>

          <div className={styles.canvasToolbar}>
            <div className={styles.modeSwitch}>
              {(['edit', 'test', 'run'] as Mode[]).map((m) => (
                <button
                  key={m}
                  className={`${styles.modeBtn} ${mode === m ? styles.modeBtnActive : ''}`}
                  onClick={(e) => { e.stopPropagation(); setMode(m); }}
                  type="button"
                >
                  {m}
                </button>
              ))}
            </div>
            <span className={styles.canvasMeta}>
              {mode === 'edit' && 'authoring · click chips to inspect'}
              {mode === 'test' && 'running preview · dots animate live'}
              {mode === 'run' && 'production run · canvas dimmed · active step glows'}
            </span>
          </div>

          <div
            className={`${styles.canvasSurface} ${mode === 'run' ? styles.runMode : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <NodeCard
              status={liveStatus('ok', 0)}
              num="01"
              runActive={mode === 'run' && false}
              onDotClick={(e) => { e.stopPropagation(); setTracePopFor(tracePopFor === '01' ? null : '01'); }}
            >
              <Chip
                icon={<RiSparklingLine />}
                brand="AI"
                verb="Extract"
                meta="tour · dates · group · concerns"
                bucket="read"
                selected={inspectorChip === 'extract'}
                onClick={(e) => { e.stopPropagation(); setInspectorChip(inspectorChip === 'extract' ? null : 'extract'); }}
              />
              {' '}from the email body.
              {tracePopFor === '01' && (
                <span
                  className={styles.tracePop}
                  style={{ left: -8, top: 30 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.row}><span className="k">Status</span><span className="v">ok</span></div>
                  <div className={styles.row}><span className="k">Last run</span><span className="v">2h ago</span></div>
                  <div className={styles.row}><span className="k">Duration</span><span className="v">1.4s</span></div>
                  <div className={styles.row}><span className="k">Output</span><span className="v">{`{ tour:"Kumano Kodo", dates:"13-20 Oct" }`}</span></div>
                </span>
              )}
            </NodeCard>

            <NodeCard
              status={liveStatus('ok', 1)}
              num="02"
              runActive={mode === 'run'}
            >
              <Chip
                icon={<SiShopify />}
                brand="Sheets"
                verb="Get rows"
                meta="bookings sheet"
                bucket="read"
                selected={inspectorChip === 'sheets'}
                onClick={(e) => { e.stopPropagation(); setInspectorChip(inspectorChip === 'sheets' ? null : 'sheets'); }}
              />
              {' '}to check availability for <RefChip name="tour.dates" src="01" />.
            </NodeCard>

            <NodeCard status={liveStatus('idle', 2)} num="03">
              <Chip icon={<SiHubspot />} brand="HubSpot" verb="Find contact" meta="by from_email" bucket="read" />
              {' '}to attach the lead history.
            </NodeCard>

            <NodeCard status={liveStatus('idle', 3)} num="04">
              <Chip
                icon={<RiPriceTag3Line />}
                verb="Tag"
                meta="@tour.name"
                bucket="ticket"
                selected={inspectorChip === 'tag'}
                onClick={(e) => { e.stopPropagation(); setInspectorChip(inspectorChip === 'tag' ? null : 'tag'); }}
              />
              {' '}the conversation for routing.
            </NodeCard>

            <NodeCard status={liveStatus('idle', 4)} num="05">
              Send <Chip icon={<RiReplyLine />} verb="Draft reply" meta="availability + KB" bucket="ticket" /> using <RefChip name="tour.dates" src="01" /> and <RefChip name="customer.history" src="03" />.
            </NodeCard>

            {/* Slide-in inspector overlay */}
            <aside
              className={`${styles.inspectorOverlay} ${inspectorChip ? styles.open : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.inspectorClose}
                onClick={(e) => { e.stopPropagation(); setInspectorChip(null); }}
                title="Close inspector"
              >
                <RiCloseLine />
              </button>
              <div className={styles.inspectorPanelHead}>Inspector</div>
              <div className={styles.inspectorPanelTitle}>
                {inspectorChip === 'extract' && 'AI Extract · configure'}
                {inspectorChip === 'sheets' && 'Sheets · Get rows'}
                {inspectorChip === 'tag' && 'Tag · configure'}
                {!inspectorChip && '-'}
              </div>

              {inspectorChip === 'extract' && (
                <>
                  <div className={styles.inspectorField}>
                    <span className={styles.inspectorLabel}>Source</span>
                    <input className={styles.inspectorInput} defaultValue="Email body" />
                  </div>
                  <div className={styles.inspectorField}>
                    <span className={styles.inspectorLabel}>Fields to extract</span>
                    <input className={styles.inspectorInput} defaultValue="tour, dates, group, concerns" />
                  </div>
                  <div className={styles.inspectorField}>
                    <span className={styles.inspectorLabel}>Model</span>
                    <input className={styles.inspectorInput} defaultValue="claude-sonnet-4.6" />
                  </div>
                </>
              )}

              {inspectorChip === 'sheets' && (
                <>
                  <div className={styles.inspectorField}>
                    <span className={styles.inspectorLabel}>Sheet</span>
                    <input className={styles.inspectorInput} defaultValue="bookings 2026" />
                  </div>
                  <div className={styles.inspectorField}>
                    <span className={styles.inspectorLabel}>Filter</span>
                    <input className={styles.inspectorInput} defaultValue="tour == @tour.name && dates overlap @tour.dates" />
                  </div>
                </>
              )}

              {inspectorChip === 'tag' && (
                <>
                  <div className={styles.inspectorField}>
                    <span className={styles.inspectorLabel}>Tags to apply</span>
                    <input className={styles.inspectorInput} defaultValue="@tour.name" />
                  </div>
                  <div className={styles.inspectorField}>
                    <span className={styles.inspectorLabel}>Apply mode</span>
                    <input className={styles.inspectorInput} defaultValue="Append" />
                  </div>
                </>
              )}

              <div className={styles.inspectorHelp}>
                Inspector content depends on the selected chip&apos;s action type. Click another chip to swap, or click off the canvas to dismiss.
              </div>
            </aside>
          </div>
        </section>

        {/* ===== 02 STATUS DOT STATES ===== */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>02</span> Status dot states</span>
          <h2 className={styles.h2}>Six states · click a dot for trace</h2>
          <p className={styles.sub}>Each dot has a hover tooltip and an on-click trace popover.</p>

          <div className={styles.canvasSurface} onClick={(e) => e.stopPropagation()}>
            {([
              ['idle', '01', 'idle - never run'],
              ['queued', '02', 'queued - scheduled, waiting'],
              ['running', '03', 'running - currently executing (pulse 1.4s)'],
              ['ok', '04', 'ok - last run succeeded'],
              ['error', '05', 'error - last run failed'],
              ['skipped', '06', 'skipped - a branch chose another path (hollow ring)'],
            ] as const).map(([s, n, label]) => (
              <NodeCard
                key={s}
                status={s}
                num={n}
                error={s === 'error'}
                onDotClick={(e) => { e.stopPropagation(); setTracePopFor(tracePopFor === s ? null : s); }}
              >
                {label}
                {tracePopFor === s && (
                  <span className={styles.tracePop} style={{ left: -8, top: 30 }} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.row}><span className="k">Status</span><span className="v">{s}</span></div>
                    <div className={styles.row}><span className="k">Last run</span><span className="v">{s === 'idle' ? 'never' : '2h ago'}</span></div>
                    <div className={styles.row}><span className="k">Duration</span><span className="v">{s === 'error' ? 'timeout' : '1.4s'}</span></div>
                    <div className={styles.row}><span className="k">Output</span><span className="v">{s === 'error' || s === 'idle' ? '-' : `{ rows: 1 }`}</span></div>
                  </span>
                )}
              </NodeCard>
            ))}
          </div>
        </section>

        {/* ===== 03 CARD STATES ===== */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>03</span> Card states</span>
          <h2 className={styles.h2}>Default · hover · editing · selected · dragging · disabled · error</h2>

          <div className={styles.canvasSurface} onClick={(e) => e.stopPropagation()}>
            <NodeCard status="ok" num="01">
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>default - </em>
              <Chip verb="Run action" /> hover toolbar hidden.
            </NodeCard>
            <NodeCard status="ok" num="02" forceHover>
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>hover (pinned) - </em>
              <Chip verb="Run action" /> shadow lifts, toolbar fades in.
            </NodeCard>
            <NodeCard status="ok" num="03" editing>
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>editing - </em>
              body has focus, left edge marker. <Chip verb="Inline edit" />
            </NodeCard>
            <NodeCard status="ok" num="04" selected>
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>selected - </em>
              chip configured. <Chip verb="Tag" meta="tour.name" selected />
            </NodeCard>
            <NodeCard status="ok" num="05" dragging>
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>dragging - </em>
              lifted, rotated 0.3°, deep shadow. <Chip verb="Reorder me" />
            </NodeCard>
            <NodeCard status="idle" num="06" disabled>
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>disabled - </em>
              <Chip verb="Inactive" /> opacity .55.
            </NodeCard>
            <NodeCard status="error" num="07" error>
              <em style={{ color: 'var(--muted)', fontStyle: 'normal' }}>error - </em>
              soft red bg + border tint. <Chip verb="Failed run" meta="timeout" />
            </NodeCard>
          </div>
        </section>

        {/* ===== 04 VARIANTS ===== */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>04</span> Variants</span>
          <h2 className={styles.h2}>Condition · Sub-procedure · End</h2>
          <p className={styles.sub}>Same gutter (dot + number) but body shape differs by kind. All sit as cards on the canvas.</p>

          <div className={styles.canvasSurface} onClick={(e) => e.stopPropagation()}>
            <NodeCard status="ok" num="01">
              Plain action card for context.
            </NodeCard>

            <div className={styles.card}>
              <div className={styles.condHead}>
                <Dot status="ok" />
                <span className={styles.num}>02</span>
                <div className={styles.condExpr}>
                  <span className={styles.condLabel}>Check</span>
                  tour is available on <RefChip name="tour.dates" src="01" />
                </div>
              </div>
              <div className={styles.branches}>
                <div className={styles.branch}>
                  <span className={styles.branchTag}>Then</span>
                  Send <Chip icon={<RiReplyLine />} verb="Draft reply" meta="availability + KB" bucket="ticket" /> with confirmation.
                </div>
                <div className={styles.branch}>
                  <span className={styles.branchTag}>Else</span>
                  Send <Chip icon={<RiReplyLine />} verb="Draft reply" meta="alternatives" bucket="ticket" /> and tag the conversation.
                </div>
              </div>
            </div>

            <NodeCard status="idle" num="03">
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
            </NodeCard>

            <div className={styles.endDivider}>
              <span className={styles.label}>END</span>
              <button className={styles.endAdd}><RiAddLine /> Add step</button>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <Link href="/atoms">/ assembled editor</Link>
          <Link href="/design-language-1">/design-language-1</Link>
          <Link href="/design-language-2">/design-language-2</Link>
          <a href="https://github.com/geekv30/hiver-playbooks-prototype" target="_blank" rel="noreferrer">repo</a>
        </footer>
      </div>
    </div>
  );
}
