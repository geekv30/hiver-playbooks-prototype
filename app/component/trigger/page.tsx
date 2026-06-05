'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  RiPlayLine, RiCalendarLine, RiGlobalLine,
  RiChat1Line, RiFileTextLine, RiMailLine,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import styles from './trigger.module.css';

type Mode = 'edit' | 'test' | 'run';
type Frag =
  | { kind: 'text'; text: string }
  | { kind: 'ref';  text: string }
  | { kind: 'code'; text: string };

interface FrontmatterState {
  name: string;
  triggerFragments: Frag[];
  summary: string;
}

const DEFAULT_FM: FrontmatterState = {
  name: 'Tour inquiry',
  triggerFragments: [
    { kind: 'ref',  text: 'info@walkjapan.com' },
    { kind: 'text', text: ' receives an email containing ' },
    { kind: 'code', text: '"tour"' },
  ],
  summary: 'Auto-triage incoming tour requests: extract details, check availability, draft the right reply, and pull the right team in if needed.',
};

/* ============================================================ */
/* Fragment renderer                                              */
/* ============================================================ */
function FragmentSpan({ frag }: { frag: Frag }) {
  if (frag.kind === 'text') return <span>{frag.text}</span>;
  if (frag.kind === 'ref')  return <span className={styles.refchip}>{frag.text}</span>;
  return <code className={styles.codeFrag}>{frag.text}</code>;
}

function Fragments({ fragments }: { fragments: Frag[] }) {
  return (
    <>
      {fragments.map((f, i) => (
        <FragmentSpan key={i} frag={f} />
      ))}
    </>
  );
}

/* ============================================================ */
/* Working Frontmatter (live demo)                                */
/* ============================================================ */
function FrontmatterCard({
  state, onChange, mode, status,
}: {
  state: FrontmatterState;
  onChange: (patch: Partial<FrontmatterState>) => void;
  mode: Mode;
  status?: 'idle' | 'running' | 'ok' | 'error';
}) {
  const readOnly = mode === 'run';
  const showStatus = mode !== 'edit';

  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  const handleTitleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      (e.currentTarget as HTMLElement).blur();
    }
  };

  return (
    <div
      className={`${styles.fm} ${readOnly ? styles.fmDisabled : ''}`}
      data-mode={mode}
    >
      {showStatus && (
        <span className={`${styles.statusPill} ${
          status === 'running' ? styles.pillRun :
          status === 'ok'      ? styles.pillOk  :
          status === 'error'   ? styles.pillErr :
                                 styles.pillIdle
        }`}>
          {status === 'running' && <span className={styles.statusDotRun} />}
          {status === 'ok'      && <span className={styles.statusDotOk} />}
          {status === 'error'   && <span className={styles.statusDotErr} />}
          {mode === 'test' && (status ?? 'idle').toUpperCase()}
          {mode === 'run'  && (status ?? 'idle').toUpperCase()}
        </span>
      )}

      <h1
        ref={titleRef}
        className={styles.fmTitle}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        data-placeholder="Untitled AOP"
        onKeyDown={handleTitleKey}
        onBlur={(e) => onChange({ name: e.currentTarget.textContent ?? '' })}
      >
        {state.name}
      </h1>

      <div className={styles.fmTrigger}>
        <span className={styles.triglabel} contentEditable={false}>WHEN</span>
        <span className={styles.fragRow}>
          <Fragments fragments={state.triggerFragments} />
        </span>
      </div>

      <div
        ref={summaryRef}
        className={styles.fmSummary}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        data-placeholder="Add a short summary so the team knows what this AOP does..."
        onBlur={(e) => onChange({ summary: e.currentTarget.textContent ?? '' })}
      >
        {state.summary}
      </div>
    </div>
  );
}

/* ============================================================ */
/* Mock step row (just to anchor that Frontmatter sits above)     */
/* ============================================================ */
function MockStep() {
  return (
    <div className={styles.mockStep}>
      <span className={styles.mockDot} />
      <span className={styles.mockNum}>01</span>
      <span className={styles.mockBody}>
        <span className={styles.mockChip}>
          <RiPlayLine />
          <span className={styles.mockChipVerb}>AI Extract</span>
          <span className={styles.mockChipMeta}>tour · dates · group</span>
        </span>
        <span> from the inbound message.</span>
      </span>
    </div>
  );
}

/* ============================================================ */
/* State catalog mocks                                            */
/* ============================================================ */
type CatalogState = 'empty' | 'typing' | 'configured' | 'focused' | 'error' | 'disabled';

const STATE_LABEL: Record<CatalogState, string> = {
  empty:      'empty',
  typing:     'typing',
  configured: 'configured',
  focused:    'focused',
  error:      'error',
  disabled:   'disabled (run)',
};

const STATE_HINT: Record<CatalogState, string> = {
  empty:      'All 3 regions show placeholders. Card un-claimed.',
  typing:     'Cursor visible in focused region; surface-soft tint.',
  configured: 'All values committed; no focus tints.',
  focused:    'Tab-stop highlighted; no cursor (not typing yet).',
  error:      'Required region empty; red helper line.',
  disabled:   'Run mode - read-only + dimmed; status pill in corner.',
};

function StateMock({ state }: { state: CatalogState }) {
  return (
    <div className={styles.stateCard} data-state={state}>
      <div className={styles.stateLabel}>
        <span className={styles.stateName}>{STATE_LABEL[state]}</span>
        <span className={styles.stateHint}>{STATE_HINT[state]}</span>
      </div>
      <div className={styles.stateFrame}>
        <div className={styles.miniFm} data-state={state}>
          {state === 'disabled' && (
            <span className={`${styles.miniPill} ${styles.pillIdle}`}>IDLE</span>
          )}
          <div
            className={`${styles.miniTitle} ${state === 'focused' || state === 'typing' ? styles.miniFocused : ''} ${state === 'error' ? styles.miniError : ''}`}
          >
            {state === 'empty' || state === 'error'
              ? <span className={styles.miniPlaceholder}>Untitled AOP</span>
              : state === 'typing'
                ? <>Tour inq<span className={styles.miniCaret} /></>
                : 'Tour inquiry'}
          </div>
          {state === 'error' && (
            <div className={styles.miniErrLine}>Name is required</div>
          )}
          <div className={styles.miniTrigger}>
            <span className={styles.miniWhen}>WHEN</span>
            {state === 'empty'
              ? null
              : (
                <span className={styles.miniFragRow}>
                  <span className={styles.miniRef}>info@walkjapan.com</span>
                  <span className={styles.miniTxt}>receives an email containing</span>
                  <span className={styles.miniCode}>&quot;tour&quot;</span>
                </span>
              )}
          </div>
          <div className={`${styles.miniSummary} ${state === 'focused' ? styles.miniFocused : ''}`}>
            {state === 'empty'
              ? <span className={styles.miniPlaceholder}>Add a short summary...</span>
              : 'Auto-triage incoming tour requests, draft the right reply, pull team in if needed.'}
          </div>
        </div>
      </div>
    </div>
  );
}

const CATALOG_ORDER: CatalogState[] = ['empty', 'typing', 'configured', 'focused', 'error', 'disabled'];

/* ============================================================ */
/* Variant strip - 5 trigger types                                */
/* ============================================================ */
interface VariantDef {
  id: string;
  label: string;
  sub: string;
  icon: IconType;
  fragments: Frag[];
  status: 'v1' | 'future';
}

const VARIANTS: VariantDef[] = [
  {
    id: 'email',
    label: 'Email match',
    sub: 'v1 default · Hiver Gmail bread-and-butter',
    icon: RiMailLine,
    status: 'v1',
    fragments: [
      { kind: 'ref',  text: 'info@walkjapan.com' },
      { kind: 'text', text: ' receives an email containing ' },
      { kind: 'code', text: '"tour"' },
    ],
  },
  {
    id: 'scheduled',
    label: 'Scheduled',
    sub: 'cron-style recurrence · pulls in date+time picker',
    icon: RiCalendarLine,
    status: 'future',
    fragments: [
      { kind: 'text', text: 'every business day at ' },
      { kind: 'code', text: '9:00 AM' },
      { kind: 'text', text: ' (' },
      { kind: 'ref',  text: 'Asia/Tokyo' },
      { kind: 'text', text: ')' },
    ],
  },
  {
    id: 'api',
    label: 'API webhook',
    sub: 'external integrations · shows copyable URL',
    icon: RiGlobalLine,
    status: 'future',
    fragments: [
      { kind: 'text', text: 'webhook ' },
      { kind: 'code', text: 'POST /aops/walkjapan/inquiry' },
      { kind: 'text', text: ' receives payload' },
    ],
  },
  {
    id: 'chat',
    label: 'Chat message',
    sub: 'for Hiver Omni’s chat channel',
    icon: RiChat1Line,
    status: 'future',
    fragments: [
      { kind: 'text', text: 'a customer sends a chat message containing ' },
      { kind: 'code', text: '"tour"' },
    ],
  },
  {
    id: 'form',
    label: 'Form submit',
    sub: 'customer-portal form filing',
    icon: RiFileTextLine,
    status: 'future',
    fragments: [
      { kind: 'text', text: 'form ' },
      { kind: 'code', text: '"Tour inquiry"' },
      { kind: 'text', text: ' is submitted' },
    ],
  },
];

function VariantCard({ v }: { v: VariantDef }) {
  const Icon = v.icon;
  return (
    <div className={styles.variant} data-status={v.status}>
      <div className={styles.variantHead}>
        <span className={styles.variantIcon}><Icon /></span>
        <div className={styles.variantText}>
          <span className={styles.variantLabel}>{v.label}</span>
          <span className={styles.variantSub}>{v.sub}</span>
        </div>
        <span className={styles.variantTag}>{v.status === 'v1' ? 'v1' : 'future'}</span>
      </div>
      <div className={styles.variantTrigger}>
        <span className={styles.variantWhen}>WHEN</span>
        <span className={styles.variantFragRow}>
          {v.fragments.map((f, i) => (
            f.kind === 'text' ? <span key={i}>{f.text}</span> :
            f.kind === 'ref'  ? <span key={i} className={styles.miniRef}>{f.text}</span> :
                                <code key={i} className={styles.miniCode}>{f.text}</code>
          ))}
        </span>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Default exported page                                          */
/* ============================================================ */
export default function TriggerPage() {
  const [fm, setFm] = useState<FrontmatterState>(DEFAULT_FM);
  const [mode, setMode] = useState<Mode>('edit');
  const [status, setStatus] = useState<'idle' | 'running' | 'ok' | 'error'>('idle');

  useEffect(() => {
    if (mode === 'edit') setStatus('idle');
  }, [mode]);

  const handleChange = (patch: Partial<FrontmatterState>) => {
    setFm((cur) => ({ ...cur, ...patch }));
  };

  return (
    <div className={styles.page}>
      <header className={styles.docbar}>
        <div className={styles.brand}>P</div>
        <div className={styles.crumb}>
          <Link href="/">AOPs</Link>
          <span className={styles.csep}>/</span>
          <Link href="/component/inspector">Components</Link>
          <span className={styles.csep}>/</span>
          <span className={styles.name}>Trigger / Frontmatter</span>
        </div>
        <span className={styles.meta}>Umbrella · 05/23/2026</span>
        <span className={styles.tbDivider} />
        <span className={styles.meta}>Fin (WHEN row) · OpenAI (start node) · Linear / Notion (title) · Hiver-prod</span>
        <span className={styles.spacer} />
        <Link className={styles.linkbtn} href="/component/inspector">Inspector</Link>
        <Link className={styles.linkbtn} href="/component/node">Node</Link>
        <Link className={styles.linkbtn} href="/component/inline-actions">Inline Actions</Link>
        <Link className={styles.linkbtn} href="/design-language-2">v2 editor</Link>
      </header>

      <div className={styles.wrap}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Component · Trigger / Frontmatter · umbrella</span>
          <h1 className={styles.h1}>The anchor row - AOP Name + WHEN trigger + Summary</h1>
          <p className={styles.lede}>
            One Frontmatter per canvas. Always first, never deletable. Holds the AOP&apos;s identity (Name + Summary) and its entry condition (WHEN). The Trigger row is the load-bearing part: it&apos;s what makes the AOP an AOP. Type freely into any region; <code>Tab</code> cycles Name → Trigger → Summary; values commit on blur.
          </p>
          <div className={styles.heroMeta}>
            <span><strong>Regions:</strong> 3 (Title · Trigger · Summary)</span>
            <span><strong>Required:</strong> Name + Trigger</span>
            <span><strong>Optional:</strong> Summary</span>
            <span><strong>States:</strong> 6</span>
            <span><strong>Variants:</strong> 5 (v1 ships email-match)</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 01 Live demo                                                  */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>01</span> Live demo</span>
          <h2 className={styles.h2}>Type into any region - values commit on blur</h2>
          <p className={styles.sub}>The Frontmatter sits at the top of the canvas with a mock step below it for context. Tab cycles regions. Enter in Title/Trigger blurs; Enter in Summary inserts a line break. Switch modes to see read-only behavior.</p>

          <div className={styles.canvasToolbar}>
            <div className={styles.modeSwitch}>
              {(['edit', 'test', 'run'] as Mode[]).map((m) => (
                <button
                  key={m}
                  className={`${styles.modeBtn} ${mode === m ? styles.modeBtnActive : ''}`}
                  onClick={() => setMode(m)}
                  type="button"
                >
                  {m}
                </button>
              ))}
            </div>
            <span className={styles.canvasMeta}>mode: {mode}</span>
            <span className={styles.spacer} />
            {mode !== 'edit' && (
              <div className={styles.statusSwitch}>
                <span className={styles.statusSwitchLabel}>status preview</span>
                {(['idle', 'running', 'ok', 'error'] as const).map((s) => (
                  <button
                    key={s}
                    className={`${styles.statusSwitchBtn} ${status === s ? styles.statusSwitchActive : ''}`}
                    onClick={() => setStatus(s)}
                    type="button"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.canvasSurface}>
            <FrontmatterCard
              state={fm}
              onChange={handleChange}
              mode={mode}
              status={mode === 'edit' ? undefined : status}
            />
            <MockStep />
          </div>

          <div className={styles.canvasNote}>
            <strong>Committed values</strong> · Name: <code>{fm.name || '-'}</code> · Summary:{' '}
            <code>{fm.summary.length > 80 ? fm.summary.slice(0, 80) + '…' : fm.summary || '-'}</code>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 02 States catalog                                              */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>02</span> 6 states</span>
          <h2 className={styles.h2}>Every state the Frontmatter can be in</h2>
          <p className={styles.sub}>Mini-mocks of the Frontmatter across each state. Empty shows three placeholders; configured shows the rendered Walk Japan example; error shows a required-field violation; disabled shows the read-only Run state with the status pill.</p>

          <div className={styles.statesGrid}>
            {CATALOG_ORDER.map((s) => (
              <StateMock key={s} state={s} />
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 03 Variant strip                                              */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>03</span> 5 trigger types</span>
          <h2 className={styles.h2}>v1 ships email-match - the other 4 are designed for, not shipped yet</h2>
          <p className={styles.sub}>The Frontmatter shell is type-agnostic; only the WHEN fragment list differs per type. Static mocks of all 5 so the variant taxonomy is grounded before we ship the type-switcher (see Open Question 1 in the spec).</p>

          <div className={styles.variantGrid}>
            {VARIANTS.map((v) => (
              <VariantCard key={v.id} v={v} />
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 04 Source notes                                                */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>04</span> Source notes</span>
          <h2 className={styles.h2}>Where each piece of the Frontmatter came from</h2>
          <p className={styles.sub}>Per the deep-extraction workflow, every anatomy property is tagged with its reference. Full table in <code>lhs/components/trigger/extraction.md</code>; headlines below.</p>

          <div className={styles.sourceTable}>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>WHEN label (uppercase, .06em, --muted)</div>
              <div className={styles.sourceFrom}>Intercom Fin Procedures</div>
              <div className={styles.sourceNote}>Their trigger card uses the same uppercase &quot;When&quot; prefix.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>Single entry-point card per canvas</div>
              <div className={styles.sourceFrom}>OpenAI Agent Builder</div>
              <div className={styles.sourceNote}>Their Start node maps to our Frontmatter: one per workflow, the run-from point.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>ContentEditable title with placeholder + focus tint</div>
              <div className={styles.sourceFrom}>Linear / Notion</div>
              <div className={styles.sourceNote}>Inline-block title (focus bg hugs the text, not the row); <code>:empty::before</code> placeholder pattern.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>Fragment model (text · ref · code) in the WHEN row</div>
              <div className={styles.sourceFrom}>Hiver-prod</div>
              <div className={styles.sourceNote}>Same model as step bodies - <code>types/playbook.ts</code> Fragment union. Trigger excludes <code>chip</code> kind (no action chips in WHEN).</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>Padding-left aligned to step body column</div>
              <div className={styles.sourceFrom}>Hiver-prod (ui-polish-01)</div>
              <div className={styles.sourceNote}>Title left-edge matches step body left-edge so the canvas has a single visual column.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>Status pill in Run mode (top-right corner of card)</div>
              <div className={styles.sourceFrom}>Linear / OpenAI</div>
              <div className={styles.sourceNote}>Same idiom as the Node status indicator + the Inspector header pill.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>5 trigger-type taxonomy</div>
              <div className={styles.sourceFrom}>Hiver product surfaces</div>
              <div className={styles.sourceNote}>email-match (Gmail) · scheduled (cron) · API (integrations) · chat (Omni) · form (Customer Portal).</div>
            </div>
          </div>
        </section>

        <div className={styles.footnote}>
          Canonical spec: <code>lhs/components/trigger/extraction.md</code>. Live source-of-truth code: <code>prototype/components/canvas/Frontmatter.tsx</code>. Canvas assembly comes after Trigger + key variants per the locked workflow.
        </div>
      </div>
    </div>
  );
}
