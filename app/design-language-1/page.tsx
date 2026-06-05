'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import Chip from '@/components/atoms/Chip';
import FieldRef from '@/components/atoms/FieldRef';
import ConnectorTile from '@/components/atoms/ConnectorTile';
import Kbd from '@/components/atoms/Kbd';
import SectionEyebrow from '@/components/atoms/SectionEyebrow';
import Frontmatter from '@/components/canvas/Frontmatter';
import { ToastStack } from '@/components/atoms/Toast';
import type { Chip as ChipModel, ChipStatus, ConnectorSlug, Frontmatter as FM, FieldType } from '@/types/playbook';
import type { ToastItem } from '@/hooks/useToast';
import styles from './design-language-1.module.css';

function mkChip(id: string, actionId: string, status: ChipStatus = 'ok', meta?: string): ChipModel {
  return { id, actionId, status, config: meta ? { meta } : {} };
}

const CHIP_SAMPLES: Array<{ label: string; chip: ChipModel; meta?: string }> = [
  { label: 'Read · AI Extract',           chip: mkChip('cv-read',   'ai_extract'),     meta: 'tour · dates · group · concerns' },
  { label: 'Ticket · Tag',                chip: mkChip('cv-tag',    'tag'),            meta: '@tour.name' },
  { label: 'External · Slack send',       chip: mkChip('cv-slack',  'slack_send_message'), meta: '#cs-team' },
  { label: 'External · Shopify get',      chip: mkChip('cv-shop',   'shopify_get_order'),  meta: 'by order_id' },
  { label: 'Human · Approval',            chip: mkChip('cv-apr',    'approval'),       meta: 'manager · 24h' },
  { label: 'Wait · Wait',                 chip: mkChip('cv-wait',   'wait'),           meta: '5 days' },
];

const CHIP_STATES: Array<{ label: string; chip: ChipModel; meta?: string }> = [
  { label: 'ok',      chip: mkChip('cs-ok',    'ai_extract', 'ok'),    meta: 'tour · dates' },
  { label: 'draft',   chip: mkChip('cs-draft', 'ai_extract', 'draft'), meta: 'configure me' },
  { label: 'warn',    chip: mkChip('cs-warn',  'ai_extract', 'warn'),  meta: 'needs review' },
  { label: 'error',   chip: mkChip('cs-err',   'ai_extract', 'error'), meta: 'timeout' },
  { label: 'running', chip: mkChip('cs-run',   'ai_extract', 'running'), meta: 'in-flight' },
];

const FIELD_REFS: Array<{ type: FieldType; refPath: string }> = [
  { type: 'email',    refPath: 'from_email' },
  { type: 'text',     refPath: 'subject' },
  { type: 'longtext', refPath: 'body' },
  { type: 'number',   refPath: 'group_size' },
  { type: 'date',     refPath: 'tour.dates' },
  { type: 'bool',     refPath: 'is_returning' },
  { type: 'enum',     refPath: 'status' },
  { type: 'doc',      refPath: 'kb.itinerary' },
  { type: 'draft',    refPath: 'draft.reply' },
];

const CONNECTOR_SLUGS: ConnectorSlug[] = ['shopify', 'hubspot', 'slack', 'salesforce', 'clickup'];

const SAMPLE_FM_FILLED: FM = {
  name: 'Tour inquiry - Walk Japan',
  summary: 'When a tour-inquiry email lands, answer with availability + matching itineraries, draft a follow-up if needed, and log the lead.',
  triggerFragments: [
    { kind: 'text', text: 'Email lands in ' },
    { kind: 'ref', refPath: 'info@walkjapan.com' },
  ],
};

const SAMPLE_FM_EMPTY: FM = {
  name: '',
  summary: '',
  triggerFragments: [
    { kind: 'text', text: 'Pick a trigger…' },
  ],
};

// Palette swatches (mirror of globals.css for reference)
const PALETTE_SURFACE = [
  { name: '--canvas',       hex: '#FBFBFC' },
  { name: '--canvas-soft',  hex: '#F7F7F8' },
  { name: '--card',         hex: '#FFFFFF' },
  { name: '--surface-soft', hex: '#F4F4F5' },
];
const PALETTE_HAIRLINE = [
  { name: '--hairline',         hex: '#E8E8EA' },
  { name: '--hairline-soft',    hex: '#EFEFF1' },
  { name: '--hairline-strong',  hex: '#D4D4D8' },
  { name: '--surface-card',     hex: '#EFEFF1' },
];
const PALETTE_INK = [
  { name: '--ink',        hex: '#0F0F11' },
  { name: '--ink-soft',   hex: '#1F1F23' },
  { name: '--body',       hex: '#48484C' },
  { name: '--muted',      hex: '#71717A' },
];
const PALETTE_STATE = [
  { name: '--state-ok',      hex: '#16A34A' },
  { name: '--state-draft',   hex: '#D97757' },
  { name: '--state-warn',    hex: '#D97706' },
  { name: '--state-error',   hex: '#DC2626' },
];
const PALETTE_PRIMARY = [
  { name: '--primary',         hex: '#E15524' },
  { name: '--primary-hover',   hex: '#C8431C' },
  { name: '--primary-tint',    hex: 'rgba(225,85,36,.08)' },
  { name: '--primary-ring',    hex: 'rgba(225,85,36,.30)' },
];

export default function PreviewPage() {
  const [popOpen, setPopOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const noop = useCallback(() => {}, []);

  const fireToast = (variant: ToastItem['variant'], message: string) => {
    const id = `t-${Date.now()}-${Math.random()}`;
    const item: ToastItem = { id, message, variant, createdAt: Date.now() };
    setToasts((cur) => [...cur, item]);
    window.setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 3000);
  };

  return (
    <>
      <header className={styles.docbar}>
        <div className={styles.brand}>P</div>
        <div className={styles.crumb}>
          <Link href="/">AOPs · tour-inquiry</Link>
          <span className={styles.csep}>›</span>
          <span className={styles.name}>Design Preview</span>
        </div>
        <span className={styles.meta}>Living preview · auto-updates with components</span>
        <span className={styles.dividerVert} />
        <span className={styles.meta}>Linear · Attio · Fin</span>
        <span className={styles.spacer} />
        <span className={styles.pill}>Pass 1 · v1</span>
        <Link className={styles.btn} href="/">Back to editor</Link>
      </header>

      <div className={styles.wrap}>
        <span className={styles.eyebrow}>Preview · v1 · 05/23/2026</span>
        <h1 className={styles.h1}>Design Preview - every primitive in the new language</h1>
        <p className={styles.lede}>
          Wipe-test surface for the new design language, built from real React components in this app.
          Updates automatically as components are refined. Approve here before each Pass 2 component change merges.
          For the assembled workspace shape, go back to <Link href="/" style={{ color: 'inherit' }}>/</Link>.
        </p>

        <nav className={styles.toc}>
          <a href="#palette">01 · Palette</a>
          <a href="#chip">02 · Chip - buckets</a>
          <a href="#chipstates">03 · Chip - states</a>
          <a href="#fieldref">04 · Field ref</a>
          <a href="#connector">05 · Connector tile</a>
          <a href="#kbd">06 · Kbd</a>
          <a href="#eyebrow">07 · Section eyebrow</a>
          <a href="#frontmatter">08 · Frontmatter</a>
          <a href="#toast">09 · Toast</a>
          <a href="#motion">10 · Motion playground</a>
        </nav>

        {/* ============ 01 PALETTE ============ */}
        <section id="palette" className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>01</span> Palette</span>
          <h2 className={styles.h2}>Cool-neutral surface, Hiver accent</h2>
          <p className={styles.sub}>Live tokens from <code>app/globals.css</code>. Surfaces stay cool; Hiver orange only on CTA / focus / active.</p>

          <span className={styles.subhead}>Surface</span>
          <div className={styles.swatchGrid}>
            {PALETTE_SURFACE.map((s) => (
              <div key={s.name} className={styles.swatch}>
                <div className={styles.swatchChip} style={{ background: s.hex }} />
                <div className={styles.swatchMeta}>
                  <span className={styles.swatchName}>{s.name}</span>
                  <span className={styles.swatchHex}>{s.hex}</span>
                </div>
              </div>
            ))}
          </div>

          <span className={styles.subhead}>Hairlines</span>
          <div className={styles.swatchGrid}>
            {PALETTE_HAIRLINE.map((s) => (
              <div key={s.name} className={styles.swatch}>
                <div className={styles.swatchChip} style={{ background: s.hex }} />
                <div className={styles.swatchMeta}>
                  <span className={styles.swatchName}>{s.name}</span>
                  <span className={styles.swatchHex}>{s.hex}</span>
                </div>
              </div>
            ))}
          </div>

          <span className={styles.subhead}>Ink</span>
          <div className={styles.swatchGrid}>
            {PALETTE_INK.map((s) => (
              <div key={s.name} className={styles.swatch}>
                <div className={styles.swatchChip} style={{ background: s.hex }} />
                <div className={styles.swatchMeta}>
                  <span className={styles.swatchName}>{s.name}</span>
                  <span className={styles.swatchHex}>{s.hex}</span>
                </div>
              </div>
            ))}
          </div>

          <span className={styles.subhead}>State</span>
          <div className={styles.swatchGrid}>
            {PALETTE_STATE.map((s) => (
              <div key={s.name} className={styles.swatch}>
                <div className={styles.swatchChip} style={{ background: s.hex }} />
                <div className={styles.swatchMeta}>
                  <span className={styles.swatchName}>{s.name}</span>
                  <span className={styles.swatchHex}>{s.hex}</span>
                </div>
              </div>
            ))}
          </div>

          <span className={styles.subhead}>Hiver tint - accent only</span>
          <div className={styles.swatchGrid}>
            {PALETTE_PRIMARY.map((s) => (
              <div key={s.name} className={styles.swatch}>
                <div className={styles.swatchChip} style={{ background: s.hex }} />
                <div className={styles.swatchMeta}>
                  <span className={styles.swatchName}>{s.name}</span>
                  <span className={styles.swatchHex}>{s.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 02 CHIP BUCKETS ============ */}
        <section id="chip" className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>02</span> Chip - by bucket</span>
          <h2 className={styles.h2}>Real Chip atom, one per bucket</h2>
          <p className={styles.sub}>Connector chips render brand + sep + verb; non-connector chips render the verb only. Meta in mono with hairline divider.</p>

          <div className={styles.group}>
            <div className={styles.groupHead}>
              <h3>Bucket samples</h3>
              <span className={styles.ghpill}>real component</span>
            </div>
            <div className={styles.groupBody}>
              <div className={`${styles.sgrid} ${styles.sgrid3}`}>
                {CHIP_SAMPLES.map(({ label, chip, meta }) => (
                  <div key={chip.id} className={styles.scell}>
                    <span className={styles.scellLabel}>{label}</span>
                    <div className={styles.scellStage}><Chip chip={chip} metaText={meta} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ 03 CHIP STATES ============ */}
        <section id="chipstates" className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>03</span> Chip - states</span>
          <h2 className={styles.h2}>Status variants from ChipStatus</h2>
          <p className={styles.sub}>Five statuses: ok, draft, warn, error, running. Currently only <code>draft</code> has dedicated styling; others use default. Pass 2 wires the remaining state visuals.</p>

          <div className={styles.group}>
            <div className={styles.groupBody}>
              <div className={`${styles.sgrid} ${styles.sgrid4}`}>
                {CHIP_STATES.map(({ label, chip, meta }) => (
                  <div key={chip.id} className={styles.scell}>
                    <span className={styles.scellLabel}>{label}</span>
                    <div className={styles.scellStage}><Chip chip={chip} metaText={meta} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ 04 FIELD REF ============ */}
        <section id="fieldref" className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>04</span> Field ref</span>
          <h2 className={styles.h2}>9 types - same atom</h2>
          <p className={styles.sub}>Inline-prose ref pill. Mono path, hairline border, surface-soft fill. Used in NL prose and in WHEN.</p>

          <div className={styles.group}>
            <div className={styles.groupBody}>
              <div className={`${styles.sgrid} ${styles.sgrid3}`}>
                {FIELD_REFS.map(({ type, refPath }) => (
                  <div key={refPath} className={styles.scell}>
                    <span className={styles.scellLabel}>{type}</span>
                    <div className={styles.scellStage}><FieldRef refPath={refPath} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ 05 CONNECTOR ============ */}
        <section id="connector" className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>05</span> Connector tile</span>
          <h2 className={styles.h2}>5 connectors, real brand SVGs (or letter fallback)</h2>

          <div className={styles.group}>
            <div className={styles.groupBody}>
              <div className={`${styles.sgrid} ${styles.sgrid3}`}>
                {CONNECTOR_SLUGS.map((slug) => (
                  <div key={slug} className={styles.scell}>
                    <span className={styles.scellLabel}>{slug}</span>
                    <div className={styles.scellStage}><ConnectorTile slug={slug} /> <ConnectorTile slug={slug} size="lg" /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ 06 KBD ============ */}
        <section id="kbd" className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>06</span> Kbd hint</span>
          <h2 className={styles.h2}>Inline shortcuts</h2>

          <div className={styles.group}>
            <div className={styles.groupBody}>
              <div className={`${styles.sgrid} ${styles.sgrid4}`}>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>Single</span>
                  <div className={styles.scellStage}><Kbd>↩</Kbd><Kbd>esc</Kbd><Kbd>⌘</Kbd></div>
                </div>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>Combo</span>
                  <div className={styles.scellStage}>
                    <Kbd>⌘ K</Kbd>
                    <Kbd>⌘ ↩</Kbd>
                  </div>
                </div>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>Inline</span>
                  <div className={styles.scellStage} style={{ fontSize: 13, color: 'var(--body)' }}>
                    Press <Kbd>/</Kbd> to insert an action.
                  </div>
                </div>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>Picker foot</span>
                  <div className={styles.scellStage} style={{ fontSize: 11, color: 'var(--muted)' }}>
                    <Kbd>↑↓</Kbd> navigate · <Kbd>↩</Kbd> insert
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 07 EYEBROW ============ */}
        <section id="eyebrow" className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>07</span> Section eyebrow</span>
          <h2 className={styles.h2}>Mono uppercase label</h2>

          <div className={styles.group}>
            <div className={styles.groupBody}>
              <div className={`${styles.sgrid} ${styles.sgrid3}`}>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>Plain</span>
                  <div className={`${styles.scellStage} ${styles.scellStageCenter}`}><SectionEyebrow>Connectors</SectionEyebrow></div>
                </div>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>With meta</span>
                  <div className={`${styles.scellStage} ${styles.scellStageCenter}`}><SectionEyebrow>Last run · 2h ago</SectionEyebrow></div>
                </div>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>Header context</span>
                  <div className={`${styles.scellStage} ${styles.scellStageCenter}`}><SectionEyebrow>Validation · 3 issues</SectionEyebrow></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 08 FRONTMATTER ============ */}
        <section id="frontmatter" className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>08</span> Frontmatter</span>
          <h2 className={styles.h2}>Title (18px / 600), summary, WHEN trigger</h2>
          <p className={styles.sub}>Real Frontmatter component. The 54px padding-left is preserved here - it aligns with the canvas step-body column in the live editor; in this isolated card it sits slightly indented from the card edge.</p>

          <div className={styles.group}>
            <div className={styles.groupHead}>
              <h3>Filled</h3>
              <span className={styles.ghpill}>name · summary · trigger</span>
            </div>
            <div className={styles.groupBody}>
              <Frontmatter fm={SAMPLE_FM_FILLED} onChange={noop} />
            </div>
          </div>
          <div style={{ height: 12 }} />
          <div className={styles.group}>
            <div className={styles.groupHead}>
              <h3>Empty</h3>
              <span className={styles.ghpill}>placeholders only</span>
            </div>
            <div className={styles.groupBody}>
              <Frontmatter fm={SAMPLE_FM_EMPTY} onChange={noop} />
            </div>
          </div>
        </section>

        {/* ============ 09 TOAST ============ */}
        <section id="toast" className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>09</span> Toast</span>
          <h2 className={styles.h2}>3 variants - default, success, warn</h2>
          <p className={styles.sub}>Click below to fire - uses the real <code>ToastStack</code> renderer, top-right.</p>

          <div className={styles.group}>
            <div className={styles.groupBody}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className={styles.btn} onClick={() => fireToast('default', 'Saved as draft')}>Default</button>
                <button className={styles.btn} onClick={() => fireToast('success', 'AOP activated')}>Success</button>
                <button className={styles.btn} onClick={() => fireToast('warn', 'Connector needs auth')}>Warn</button>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 10 MOTION ============ */}
        <section id="motion" className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>10</span> Motion playground</span>
          <h2 className={styles.h2}>Press · hover · focus · surface enter</h2>
          <p className={styles.sub}>Each cell exercises a specific motion class. Compare the snap timing on hover/press vs the spring overshoot on the popover.</p>

          <div className={styles.group}>
            <div className={styles.groupBody}>
              <div className={`${styles.sgrid} ${styles.sgrid3}`}>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>Press · 40ms snap</span>
                  <div className={`${styles.scellStage} ${styles.scellStageCenter}`}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`}>Press me</button>
                  </div>
                </div>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>Hover · 80ms snap</span>
                  <div className={`${styles.scellStage} ${styles.scellStageCenter}`}>
                    <button className={styles.btn}>Hover me</button>
                  </div>
                </div>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>Focus · instant ring</span>
                  <div className={`${styles.scellStage} ${styles.scellStageCenter}`}>
                    <input className={styles.input} placeholder="Click or Tab" />
                  </div>
                </div>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>Surface enter · 180ms spring</span>
                  <div className={`${styles.scellStage} ${styles.scellStageCenter}`}>
                    <div className={styles.popAnchor}>
                      <button className={styles.popTrigger} onClick={(e) => { e.stopPropagation(); setPopOpen((v) => !v); }}>
                        {popOpen ? 'Close popover' : 'Open popover'}
                      </button>
                      <div className={`${styles.pop} ${popOpen ? styles.popOpen : ''}`}>
                        <strong style={{ display: 'block', marginBottom: 4 }}>Spring overshoot</strong>
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>translateY(6 → 0) + opacity</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>Chip hover (real chip)</span>
                  <div className={`${styles.scellStage} ${styles.scellStageCenter}`}>
                    <Chip chip={mkChip('motion-chip', 'ai_extract')} metaText="hover me" />
                  </div>
                </div>
                <div className={styles.scell}>
                  <span className={styles.scellLabel}>Field ref hover</span>
                  <div className={`${styles.scellStage} ${styles.scellStageCenter}`}>
                    <FieldRef refPath="tour.name" onClick={() => {}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <ul>
            <li><a href="/">/ - assembled workspace</a></li>
            <li><a href="https://github.com/geekv30/hiver-playbooks-prototype" target="_blank" rel="noreferrer">Repo</a></li>
            <li><a href="/design-language-1">/design-language-1 - this page</a></li>
          </ul>
        </footer>

        <ToastStack items={toasts} />
      </div>
    </>
  );
}
