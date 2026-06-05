'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  RiSparklingLine, RiPriceTag3Line, RiCheckDoubleLine,
  RiTimeLine, RiGitBranchLine, RiCloseLine, RiPlayLine,
  RiAddLine,
} from 'react-icons/ri';
import { SiSlack } from 'react-icons/si';
import type { IconType } from 'react-icons';
import styles from './inspector.module.css';

type Bucket = 'read' | 'ticket' | 'external' | 'human' | 'wait' | 'flow';
type Mode = 'edit' | 'test' | 'run';
type InspectorStatus = 'idle' | 'running' | 'ok' | 'error';

interface DemoChip {
  id: string;
  bucket: Bucket;
  brand?: string;
  verb: string;
  meta?: string;
  slug: string;
  icon: IconType;
}

const DEMO_CHIPS: DemoChip[] = [
  { id: 'demo-read',     bucket: 'read',     verb: 'AI Extract',   meta: 'tour · dates · group',  slug: 'ai.extract',     icon: RiSparklingLine },
  { id: 'demo-ticket',   bucket: 'ticket',   verb: 'Tag',          meta: '@tour.name',            slug: 'tag',            icon: RiPriceTag3Line },
  { id: 'demo-external', bucket: 'external', brand: 'Slack',       verb: 'Send message',          meta: '#tour-team',     slug: 'slack.send',     icon: SiSlack },
  { id: 'demo-human',    bucket: 'human',    verb: 'Approval',     meta: 'team-lead · 24h',       slug: 'approval',       icon: RiCheckDoubleLine },
  { id: 'demo-wait',     bucket: 'wait',     verb: 'Wait',         meta: '1 business day',        slug: 'wait',           icon: RiTimeLine },
  { id: 'demo-flow',     bucket: 'flow',     verb: 'Condition',    meta: 'availability',          slug: 'flow.condition', icon: RiGitBranchLine },
];

const BUCKET_TITLES: Record<Bucket, string> = {
  read:     'Read · silent lookup',
  ticket:   'Ticket · Hiver verb',
  external: 'External · connector',
  human:    'Human · pause for review',
  wait:     'Wait · time-based',
  flow:     'Flow · branching & end',
};

const BUCKET_DESCS: Record<Bucket, string> = {
  read:     'Source ref + parameters + output preview',
  ticket:   'Tags / Note / Assign / Reply - Hiver-native field shapes',
  external: 'Connector tile + endpoint + params (JSON for HTTP)',
  human:    'Approver + message + dual labels + timeout',
  wait:     'Mode tabs: Duration / Until / For reply',
  flow:     'Branch list with predicates + default branch',
};

/* ============================================================ */
/* Chip atom                                                     */
/* ============================================================ */
function Chip({
  chip, selected, onClick, large,
}: { chip: DemoChip; selected?: boolean; onClick?: (e: React.MouseEvent) => void; large?: boolean }) {
  const Icon = chip.icon;
  const cls = [styles.chip];
  if (selected) cls.push(styles.chipSelected);
  if (large)    cls.push(styles.chipLarge);
  return (
    <span className={cls.join(' ')} data-bucket={chip.bucket} onClick={onClick} data-chip data-chip-id={chip.id} tabIndex={0}>
      <span className={styles.chipIco}><Icon /></span>
      {chip.brand && (
        <>
          <span className={styles.chipBrand}>{chip.brand}</span>
          <span className={styles.chipSep}>·</span>
        </>
      )}
      <span className={styles.chipVerb}>{chip.verb}</span>
      {chip.meta && <span className={styles.chipMeta}>{chip.meta}</span>}
    </span>
  );
}

/* ============================================================ */
/* Field row (shared across all bucket bodies)                   */
/* ============================================================ */
function FieldRow({
  label, hint, helper, error, children,
}: { label: string; hint?: string; helper?: string; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldLabelRow}>
        <span className={styles.fieldLabel}>{label}</span>
        {hint && <span className={styles.fieldHint}>{hint}</span>}
      </div>
      <div className={styles.fieldControl}>{children}</div>
      {helper && <div className={`${styles.fieldHelper} ${error ? styles.fieldHelperErr : ''}`}>{helper}</div>}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return <div className={styles.sectionDivider}>{label}</div>;
}

/* ============================================================ */
/* Per-bucket bodies                                              */
/* ============================================================ */
function ReadBody() {
  return (
    <>
      <FieldRow label="Source" hint="ref">
        <div className={styles.refDisplay}>
          <span className={styles.refMono}>{'{{from.body}}'}</span>
          <button className={styles.refChange} type="button">Change</button>
        </div>
      </FieldRow>
      <FieldRow label="Fields to extract" hint="multi">
        <div className={styles.pillRow}>
          {['tour', 'dates', 'group', 'concerns'].map((t) => (
            <span key={t} className={styles.pill}>
              {t}
              <button className={styles.pillX} type="button" aria-label="Remove"><RiCloseLine /></button>
            </span>
          ))}
          <button className={styles.pillAdd} type="button"><RiAddLine /> Add field</button>
        </div>
        <div className={styles.fieldHelper}>The AI extracts these named fields from the source.</div>
      </FieldRow>
      <FieldRow label="Output ref" hint="readonly">
        <div className={styles.refDisplay}>
          <span className={styles.refMono}>{'{{ai_extract.output}}'}</span>
        </div>
        <div className={styles.fieldHelper}>Reference this anywhere downstream with <code className={styles.codeInline}>{'{{ai_extract.output.tour}}'}</code> etc.</div>
      </FieldRow>
    </>
  );
}

function TicketBody() {
  return (
    <>
      <FieldRow label="Tags" hint="required">
        <div className={styles.tagRow}>
          <span className={styles.tagChip}>
            tour-inquiry
            <button className={styles.pillX} type="button" aria-label="Remove"><RiCloseLine /></button>
          </span>
          <span className={styles.tagChip} data-color="ref">
            {'@tour.name'}
            <button className={styles.pillX} type="button" aria-label="Remove"><RiCloseLine /></button>
          </span>
          <button className={styles.pillAdd} type="button"><RiAddLine /> Add tag</button>
        </div>
      </FieldRow>
      <FieldRow label="Source" hint="static / ref">
        <div className={styles.radioRow}>
          <label className={styles.radioOpt}>
            <input type="radio" name="src" defaultChecked /> Static value
          </label>
          <label className={styles.radioOpt}>
            <input type="radio" name="src" /> From ref
          </label>
        </div>
      </FieldRow>
      <FieldRow label="When applied" hint="optional">
        <div className={styles.radioRow}>
          <label className={styles.radioOpt}>
            <input type="radio" name="when" defaultChecked /> After this step
          </label>
          <label className={styles.radioOpt}>
            <input type="radio" name="when" disabled /> If predicate
          </label>
        </div>
      </FieldRow>
    </>
  );
}

function ExternalBody() {
  return (
    <>
      <FieldRow label="Connector">
        <div className={styles.connectorTile}>
          <span className={styles.connectorIcon}><SiSlack /></span>
          <span className={styles.connectorName}>Slack</span>
          <span className={styles.connectorStatus}>
            <span className={styles.dotOk} /> Connected
          </span>
          <button className={styles.connectorChange} type="button">Change</button>
        </div>
      </FieldRow>
      <FieldRow label="Channel">
        <input className={styles.textInput} defaultValue="#tour-team" type="text" />
        <div className={styles.fieldHelper}>Type <code className={styles.codeInline}>#</code> for autocomplete.</div>
      </FieldRow>
      <FieldRow label="Message">
        <textarea
          className={styles.textArea}
          rows={4}
          defaultValue={'New tour inquiry from {{from.name}} - {{ai_extract.output.tour}} in {{ai_extract.output.dates}}.'}
        />
        <div className={styles.fieldHelper}>Supports <code className={styles.codeInline}>{'{{ref}}'}</code> insertion.</div>
      </FieldRow>
      <FieldRow label="Attachments" hint="optional">
        <label className={styles.toggleRow}>
          <input type="checkbox" />
          <span className={styles.toggleTrack}><span className={styles.toggleKnob} /></span>
          <span className={styles.toggleLabel}>Include the original email</span>
        </label>
      </FieldRow>
    </>
  );
}

function HumanBody() {
  return (
    <>
      <FieldRow label="Approver" hint="required">
        <div className={styles.userPicker}>
          <span className={styles.avatar}>TL</span>
          <span className={styles.userName}>team-lead@walkjapan.com</span>
          <button className={styles.pickerChange} type="button">Change</button>
        </div>
      </FieldRow>
      <FieldRow label="Message">
        <textarea
          className={styles.textArea}
          rows={3}
          defaultValue={'Please review this draft before sending. Tour: {{ai_extract.output.tour}}.'}
        />
      </FieldRow>
      <SectionDivider label="Buttons" />
      <FieldRow label="Approve label">
        <input className={styles.textInput} defaultValue="Approve & continue" type="text" />
      </FieldRow>
      <FieldRow label="Reject label">
        <input className={styles.textInput} defaultValue="Reject - send alternatives" type="text" />
      </FieldRow>
      <FieldRow label="Timeout" hint="auto-resolve after">
        <div className={styles.unitRow}>
          <input className={styles.textInputSmall} defaultValue="24" type="number" />
          <select className={styles.unitSelect} defaultValue="hours">
            <option>minutes</option>
            <option>hours</option>
            <option>business hours</option>
            <option>days</option>
          </select>
        </div>
        <div className={styles.fieldHelper}>If no decision in this window, the step resolves to Reject.</div>
      </FieldRow>
    </>
  );
}

function WaitBody() {
  const [tab, setTab] = useState<'duration' | 'until' | 'for-reply'>('duration');
  return (
    <>
      <div className={styles.tabStrip}>
        <button className={`${styles.tabBtn} ${tab === 'duration' ? styles.tabBtnActive : ''}`}     onClick={() => setTab('duration')}>Duration</button>
        <button className={`${styles.tabBtn} ${tab === 'until' ? styles.tabBtnActive : ''}`}        onClick={() => setTab('until')}>Until</button>
        <button className={`${styles.tabBtn} ${tab === 'for-reply' ? styles.tabBtnActive : ''}`}    onClick={() => setTab('for-reply')}>For reply</button>
      </div>
      {tab === 'duration' && (
        <>
          <FieldRow label="Duration">
            <div className={styles.unitRow}>
              <input className={styles.textInputSmall} defaultValue="1" type="number" />
              <select className={styles.unitSelect} defaultValue="business days">
                <option>minutes</option>
                <option>hours</option>
                <option>business hours</option>
                <option>days</option>
                <option>business days</option>
              </select>
            </div>
          </FieldRow>
          <FieldRow label="Business hours" hint="workspace">
            <div className={styles.readonlyDisplay}>
              Mon-Fri · 9:00 AM to 6:00 PM · Asia/Tokyo
            </div>
            <div className={styles.fieldHelper}><a className={styles.linkInline}>Change workspace settings ↗</a></div>
          </FieldRow>
        </>
      )}
      {tab === 'until' && (
        <>
          <FieldRow label="Until">
            <input className={styles.textInput} defaultValue="06/01/2026 9:00 AM" type="text" />
          </FieldRow>
          <FieldRow label="Timezone" hint="workspace">
            <div className={styles.readonlyDisplay}>Asia/Tokyo (UTC+9)</div>
          </FieldRow>
        </>
      )}
      {tab === 'for-reply' && (
        <>
          <FieldRow label="From">
            <div className={styles.radioRow}>
              <label className={styles.radioOpt}>
                <input type="radio" name="from" defaultChecked /> Customer
              </label>
              <label className={styles.radioOpt}>
                <input type="radio" name="from" /> Anyone
              </label>
            </div>
          </FieldRow>
          <FieldRow label="Timeout">
            <div className={styles.unitRow}>
              <input className={styles.textInputSmall} defaultValue="7" type="number" />
              <select className={styles.unitSelect} defaultValue="days">
                <option>hours</option>
                <option>days</option>
              </select>
            </div>
          </FieldRow>
        </>
      )}
    </>
  );
}

function FlowBody() {
  return (
    <>
      <FieldRow label="Branches" hint="evaluated top-down">
        <div className={styles.branchList}>
          <div className={styles.branchRow}>
            <span className={styles.branchNum}>01</span>
            <code className={styles.branchPred}>availability == "yes"</code>
            <button className={styles.branchEdit} type="button" disabled>Edit</button>
          </div>
          <div className={styles.branchRow}>
            <span className={styles.branchNum}>02</span>
            <code className={styles.branchPred}>availability == "no"</code>
            <button className={styles.branchEdit} type="button" disabled>Edit</button>
          </div>
          <div className={styles.branchRow} data-default>
            <span className={styles.branchNum}>else</span>
            <code className={styles.branchPred}>(default)</code>
            <button className={styles.branchEdit} type="button" disabled>Edit</button>
          </div>
        </div>
        <button className={styles.pillAdd} type="button" style={{ marginTop: 10 }}><RiAddLine /> Add branch</button>
      </FieldRow>
    </>
  );
}

/* ============================================================ */
/* Status pill                                                   */
/* ============================================================ */
function StatusPill({ status }: { status: InspectorStatus }) {
  const cls =
    status === 'running' ? styles.pillRun :
    status === 'ok'      ? styles.pillOk :
    status === 'error'   ? styles.pillErr :
                           styles.pillIdle;
  const label =
    status === 'running' ? 'Running' :
    status === 'ok'      ? 'Ok' :
    status === 'error'   ? 'Error' :
                           'Idle';
  return (
    <span className={`${styles.statusPill} ${cls}`}>
      {status === 'running' && <span className={styles.statusDotRun} />}
      {status === 'ok'      && <span className={styles.statusDotOk}  />}
      {status === 'error'   && <span className={styles.statusDotErr} />}
      {label}
    </span>
  );
}

/* ============================================================ */
/* Inspector shell                                                */
/* ============================================================ */
function Inspector({
  chip, status, onClose, inspectorRef,
}: {
  chip: DemoChip;
  status: InspectorStatus;
  onClose: () => void;
  inspectorRef: React.RefObject<HTMLElement | null>;
}) {
  const Icon = chip.icon;
  return (
    <aside ref={inspectorRef} className={styles.inspector} data-open="true">
      <header className={styles.inspectorHead}>
        <span className={styles.bucketIcon}><Icon /></span>
        <div className={styles.headText}>
          <div className={styles.headVerb}>
            {chip.brand && <span className={styles.headBrand}>{chip.brand} · </span>}
            {chip.verb}
          </div>
          <div className={styles.headSlug}>{chip.slug}</div>
        </div>
        <StatusPill status={status} />
        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close"><RiCloseLine /></button>
      </header>
      <div className={styles.inspectorBody}>
        {chip.bucket === 'read'     && <ReadBody />}
        {chip.bucket === 'ticket'   && <TicketBody />}
        {chip.bucket === 'external' && <ExternalBody />}
        {chip.bucket === 'human'    && <HumanBody />}
        {chip.bucket === 'wait'     && <WaitBody />}
        {chip.bucket === 'flow'     && <FlowBody />}
      </div>
      <footer className={styles.inspectorFoot}>
        <button className={styles.testBtn} type="button">
          <RiPlayLine /> Test this step
        </button>
        <div className={styles.statusStrip}>Never tested.</div>
      </footer>
    </aside>
  );
}

/* ============================================================ */
/* State catalog mocks                                            */
/* ============================================================ */
type CatalogState =
  | 'closed' | 'opening' | 'open-idle' | 'open-configured'
  | 'open-unconfigured' | 'open-error' | 'open-running'
  | 'open-success' | 'open-disabled';

const STATE_LABEL: Record<CatalogState, string> = {
  'closed':            'closed',
  'opening':           'opening',
  'open-idle':         'open · idle',
  'open-configured':   'open · configured',
  'open-unconfigured': 'open · unconfigured',
  'open-error':        'open · error',
  'open-running':      'open · running',
  'open-success':      'open · success',
  'open-disabled':     'open · disabled',
};
const STATE_HINT: Record<CatalogState, string> = {
  'closed':            'No chip selected.',
  'opening':           'Mid 220ms spring slide-in.',
  'open-idle':         'Default field values, no interaction yet.',
  'open-configured':   'All fields filled, no focus ring.',
  'open-unconfigured': 'Required field highlighted with red dot.',
  'open-error':        'Top strip warns; field helper flips to red.',
  'open-running':      'Body dimmed, pill spins, Test → Cancel.',
  'open-success':      'Green pill + View output ↗ in footer.',
  'open-disabled':     'Whole inspector dimmed; only X is active.',
};

function StateMock({ state }: { state: CatalogState }) {
  const dataAttr: Record<string, string> = { 'data-state': state };
  return (
    <div className={styles.stateCard} {...dataAttr}>
      <div className={styles.stateLabel}>
        <span className={styles.stateName}>{STATE_LABEL[state]}</span>
        <span className={styles.stateHint}>{STATE_HINT[state]}</span>
      </div>
      <div className={styles.stateFrame}>
        <div className={styles.miniInsp}>
          {/* error top strip (only for error) */}
          {state === 'open-error' && (
            <div className={styles.miniErrStrip}>1 field needs attention</div>
          )}
          {/* header */}
          <div className={styles.miniHead}>
            <div className={styles.miniIcon}><RiPriceTag3Line /></div>
            <div className={styles.miniTextCol}>
              <div className={styles.miniVerb}>Tag</div>
              <div className={styles.miniSlug}>tag</div>
            </div>
            <div className={`${styles.miniPill} ${
              state === 'open-running' ? styles.pillRun :
              state === 'open-success' ? styles.pillOk :
              state === 'open-error'   ? styles.pillErr :
                                         styles.pillIdle
            }`}>
              {state === 'open-running' && <span className={styles.statusDotRun} />}
              {state === 'open-success' && <span className={styles.statusDotOk} />}
              {state === 'open-error'   && <span className={styles.statusDotErr} />}
              {state === 'open-running' ? 'Running' :
               state === 'open-success' ? 'Ok' :
               state === 'open-error'   ? 'Error' : 'Idle'}
            </div>
            <button className={styles.miniClose} type="button"><RiCloseLine /></button>
          </div>
          {/* body */}
          <div className={styles.miniBody}>
            <div className={styles.miniField}>
              <div className={styles.miniFieldLabel}>
                Tags
                {state === 'open-unconfigured' && <span className={styles.requiredDot} />}
              </div>
              <div
                className={`${styles.miniInput} ${
                  state === 'open-unconfigured' ? styles.miniInputFocus : ''
                }`}
              >
                {(state === 'open-configured' || state === 'open-running' || state === 'open-success' || state === 'open-error' || state === 'open-disabled' || state === 'open-idle') &&
                  <>
                    <span className={styles.miniTag}>tour-inquiry</span>
                    <span className={styles.miniTag} data-ref>{'@tour.name'}</span>
                  </>
                }
              </div>
              {state === 'open-error' && <div className={styles.miniHelperErr}>Tag <code>@tour.name</code> isn't a valid ref.</div>}
            </div>
            <div className={styles.miniField}>
              <div className={styles.miniFieldLabel}>Source</div>
              <div className={styles.miniInput}><span className={styles.miniMuted}>Static value</span></div>
            </div>
          </div>
          {/* footer */}
          <div className={styles.miniFoot}>
            {state === 'open-running' ? (
              <button className={styles.miniTestBtn} data-running type="button">Cancel</button>
            ) : (
              <button className={styles.miniTestBtn} type="button"><RiPlayLine /> Test this step</button>
            )}
            <div className={styles.miniStatus}>
              {state === 'open-success' && <><span className={styles.statusDotOk} /> Last tested 2m ago · Ok · <a className={styles.linkInline}>View output ↗</a></>}
              {state === 'open-error'   && <><span className={styles.statusDotErr} /> Failed: invalid ref</>}
              {state === 'open-running' && <><span className={styles.statusDotRun} /> Running…</>}
              {(state === 'open-idle' || state === 'open-configured' || state === 'open-unconfigured' || state === 'open-disabled') && 'Never tested.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CATALOG_ORDER: CatalogState[] = [
  'closed', 'opening', 'open-idle', 'open-configured',
  'open-unconfigured', 'open-error', 'open-running',
  'open-success', 'open-disabled',
];

/* ============================================================ */
/* Default exported page                                          */
/* ============================================================ */
export default function InspectorPage() {
  const [openChipId, setOpenChipId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('edit');
  const [status, setStatus] = useState<InspectorStatus>('idle');
  const inspectorRef = useRef<HTMLElement | null>(null);

  const openChip = openChipId ? (DEMO_CHIPS.find((c) => c.id === openChipId) ?? null) : null;

  /* outside-click - canonical deferred-attach pattern */
  useEffect(() => {
    if (!openChipId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (inspectorRef.current?.contains(target)) return;
      // also ignore clicks on chips (so clicking another chip swaps content rather than closing)
      const chipEl = (target as Element).closest?.('[data-chip]');
      if (chipEl) return;
      setOpenChipId(null);
    };
    const id = window.setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [openChipId]);

  /* Esc closes */
  useEffect(() => {
    if (!openChipId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenChipId(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [openChipId]);

  return (
    <div className={styles.page}>
      <header className={styles.docbar}>
        <div className={styles.brand}>P</div>
        <div className={styles.crumb}>
          <Link href="/">AOPs</Link>
          <span className={styles.csep}>/</span>
          <Link href="/component/node">Components</Link>
          <span className={styles.csep}>/</span>
          <span className={styles.name}>Inspector</span>
        </div>
        <span className={styles.meta}>Umbrella · 05/23/2026</span>
        <span className={styles.tbDivider} />
        <span className={styles.meta}>OpenAI (shell) · Fin (ticket fields) · Linear (rows) · Hiver (taxonomy)</span>
        <span className={styles.spacer} />
        <Link className={styles.linkbtn} href="/component/node">Node</Link>
        <Link className={styles.linkbtn} href="/component/inline-actions">Inline Actions</Link>
        <Link className={styles.linkbtn} href="/component/tag">Tag</Link>
        <Link className={styles.linkbtn} href="/design-language-2">v2 editor</Link>
      </header>

      <div className={styles.wrap}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Component · Inspector · umbrella</span>
          <h1 className={styles.h1}>The contextual right rail - bucket-aware, slide-in on chip click</h1>
          <p className={styles.lede}>
            One Inspector shell, six body renderers. Click any Inline Action chip and the Inspector slides in from the right (220ms spring) with that chip's config. The body content is bucket-aware: <strong>read</strong> chips show source + parameters + output; <strong>ticket</strong> chips show Hiver-native fields; <strong>external</strong> chips show connector + endpoint; <strong>human</strong> chips show approver + dual labels; <strong>wait</strong> chips show duration mode tabs; <strong>flow</strong> chips show branch lists.
          </p>
          <div className={styles.heroMeta}>
            <span><strong>Width:</strong> 380px</span>
            <span><strong>Slide:</strong> 220ms spring</span>
            <span><strong>Buckets:</strong> 6</span>
            <span><strong>States:</strong> 9</span>
            <span><strong>Close:</strong> click outside · <code>Esc</code></span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 01 Live demo - canvas + 6 chips + working Inspector            */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>01</span> Live demo</span>
          <h2 className={styles.h2}>Click any chip - the Inspector opens with its bucket's body</h2>
          <p className={styles.sub}>Six demo chips, one per bucket. Same chip atom, same Inspector shell, six different bodies. Click outside or press <code>Esc</code> to close. Click a second chip while open - content swaps without re-animating.</p>

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
            <div className={styles.statusSwitch}>
              <span className={styles.statusSwitchLabel}>state preview</span>
              {(['idle', 'running', 'ok', 'error'] as InspectorStatus[]).map((s) => (
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
          </div>

          <div
            className={`${styles.canvasWrap} ${mode === 'run' ? styles.canvasRun : ''}`}
            data-inspector-open={openChip ? 'true' : 'false'}
          >
            <div className={styles.canvasSurface}>
              <div className={styles.cardGrid}>
                {DEMO_CHIPS.map((chip) => (
                  <div
                    key={chip.id}
                    className={`${styles.demoCard} ${openChipId === chip.id ? styles.demoCardSelected : ''}`}
                  >
                    <div className={styles.demoCardHead}>
                      <span className={styles.bucketTag} data-bucket={chip.bucket}>{chip.bucket}</span>
                      <span className={styles.demoCardTitle}>{BUCKET_TITLES[chip.bucket]}</span>
                    </div>
                    <p className={styles.demoCardDesc}>{BUCKET_DESCS[chip.bucket]}</p>
                    <div className={styles.demoCardChip}>
                      <Chip chip={chip} selected={openChipId === chip.id} onClick={() => setOpenChipId(chip.id)} large />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`${styles.inspectorSlot} ${openChip ? styles.inspectorSlotOpen : ''}`}>
              {openChip && (
                <Inspector chip={openChip} status={status} onClose={() => setOpenChipId(null)} inspectorRef={inspectorRef} />
              )}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 02 All 9 states catalog                                       */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>02</span> 9 states</span>
          <h2 className={styles.h2}>Every state the Inspector can be in</h2>
          <p className={styles.sub}>Mini-mocks of the Tag-bucket Inspector across every state in the spec. The states are the visual contract: any state that doesn't render here is a state the implementation forgot.</p>

          <div className={styles.statesGrid}>
            {CATALOG_ORDER.map((s) => (
              <StateMock key={s} state={s} />
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 03 Source notes                                                */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>03</span> Source notes</span>
          <h2 className={styles.h2}>Where each piece of the Inspector came from</h2>
          <p className={styles.sub}>Per the deep-extraction workflow, every anatomy property is tagged with the reference it came from. The full mapping is in <code>lhs/components/inspector/extraction.md</code>; this is the headline table.</p>

          <div className={styles.sourceTable}>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>Outer shell · contextual right rail</div>
              <div className={styles.sourceFrom}>OpenAI Agent Builder</div>
              <div className={styles.sourceNote}>Slide-in on chip click, not persistent rail.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>Slide-in spring (220ms)</div>
              <div className={styles.sourceFrom}>OpenAI Agent Builder</div>
              <div className={styles.sourceNote}><code>cubic-bezier(0.32, 0.72, 0, 1)</code> - calm enter, no overshoot.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>Field-row anatomy (label · control · helper)</div>
              <div className={styles.sourceFrom}>Linear</div>
              <div className={styles.sourceNote}>Issue detail panel field rows.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>Status pill placement (right of header)</div>
              <div className={styles.sourceFrom}>Linear</div>
              <div className={styles.sourceNote}>Same idiom as Linear's status badge.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>Ticket-bucket field shapes (Tag picker, Note textarea, Assign user picker)</div>
              <div className={styles.sourceFrom}>Intercom Fin Procedures</div>
              <div className={styles.sourceNote}>Adapted to Hiver vocabulary.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>External-bucket connector tile + endpoint dropdown</div>
              <div className={styles.sourceFrom}>Pylon Custom Actions + Postman</div>
              <div className={styles.sourceNote}>Auth + endpoint + params + body - the four sections.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>Wait mode tabs (Duration / Until / For reply)</div>
              <div className={styles.sourceFrom}>Pylon delay step + Fin Wait-for-reply</div>
              <div className={styles.sourceNote}>Three-mode segmented control inside the body.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>Per-step Test button in footer</div>
              <div className={styles.sourceFrom}>OpenAI Agent Builder</div>
              <div className={styles.sourceNote}>Test is dedicated to the Inspector's chip, not the whole canvas.</div>
            </div>
            <div className={styles.sourceRow}>
              <div className={styles.sourceProp}>Bucket taxonomy + action verbs</div>
              <div className={styles.sourceFrom}>Hiver - <code>data/library.ts:9-16</code></div>
              <div className={styles.sourceNote}>6 buckets, 29 actions. Not invented.</div>
            </div>
          </div>
        </section>

        <div className={styles.footnote}>
          Read the canonical spec: <Link href="/component/node" className={styles.linkInline}>related component routes</Link> · canvas assembly comes after Inspector + Trigger + variant children.
        </div>
      </div>
    </div>
  );
}
