'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  RiSparklingLine, RiArticleLine, RiBookOpenLine, RiSearchLine, RiDraftLine,
  RiReplyLine, RiStickyNoteLine, RiPriceTag3Line, RiUserAddLine,
  RiCheckDoubleLine, RiTimeLine, RiGitBranchLine, RiStopCircleLine,
  RiGlobalLine, RiMagicLine,
} from 'react-icons/ri';
import { SiHubspot, SiSalesforce, SiSlack, SiShopify, SiClickup } from 'react-icons/si';
import type { IconType } from 'react-icons';
import styles from './inline-actions.module.css';

type Bucket = 'read' | 'ticket' | 'external' | 'human' | 'wait' | 'flow';

interface Action {
  id: string;
  bucket: Bucket;
  name: string;
  brand?: string;
  verb: string;
  meta?: string;
  desc: string;
  slug: string;
  icon: IconType;
}

const ACTIONS: Action[] = [
  // Read
  { id: 'ai_extract', bucket: 'read', name: 'AI Extract', verb: 'Extract', meta: 'from email body', desc: 'Pull structured fields from prose', slug: 'ai.extract', icon: RiSparklingLine },
  { id: 'summarize', bucket: 'read', name: 'Summarize', verb: 'Summarize', meta: 'this conversation', desc: 'One-paragraph summary of the thread', slug: 'ai.summarize', icon: RiArticleLine },
  { id: 'kb_search', bucket: 'read', name: 'Search knowledge', verb: 'Search knowledge', meta: 'help center', desc: 'Find articles in the KB', slug: 'kb.search', icon: RiBookOpenLine },
  { id: 'sheets_get', bucket: 'read', brand: 'Sheets', name: 'Sheets · Get rows', verb: 'Get rows', meta: 'bookings sheet', desc: 'Fetch rows from a Google Sheet', slug: 'sheets.get_rows', icon: RiSearchLine },
  { id: 'hubspot_get', bucket: 'read', brand: 'HubSpot', name: 'HubSpot · Find contact', verb: 'Find contact', meta: 'by from_email', desc: 'Look up a contact by email or ID', slug: 'hubspot.find_contact', icon: SiHubspot },
  { id: 'shopify_get', bucket: 'read', brand: 'Shopify', name: 'Shopify · Get order', verb: 'Get order', meta: 'by order_id', desc: 'Look up an order', slug: 'shopify.get_order', icon: SiShopify },

  // Ticket
  { id: 'tag', bucket: 'ticket', name: 'Tag', verb: 'Tag', meta: '@tour.name', desc: 'Apply one or more tags', slug: 'tag', icon: RiPriceTag3Line },
  { id: 'note', bucket: 'ticket', name: 'Note', verb: 'Note', meta: 'tour · dates · group', desc: 'Add an internal-only note', slug: 'note', icon: RiStickyNoteLine },
  { id: 'draft_reply', bucket: 'ticket', name: 'Draft reply', verb: 'Draft reply', meta: 'availability + KB', desc: 'Save a draft for the agent to send', slug: 'draft_reply', icon: RiDraftLine },
  { id: 'send_reply', bucket: 'ticket', name: 'Send reply', verb: 'Send reply', desc: 'Send a reply immediately', slug: 'send_reply', icon: RiReplyLine },
  { id: 'assign', bucket: 'ticket', name: 'Assign', verb: 'Assign', meta: 'on-shift inbox', desc: 'Reassign to a user or queue', slug: 'assign', icon: RiUserAddLine },

  // External
  { id: 'slack_send', bucket: 'external', brand: 'Slack', name: 'Slack · Send message', verb: 'Send message', meta: '#cs-team', desc: 'Post to a channel or DM', slug: 'slack.send', icon: SiSlack },
  { id: 'hubspot_create', bucket: 'external', brand: 'HubSpot', name: 'HubSpot · Create ticket', verb: 'Create ticket', desc: 'Open a support ticket', slug: 'hubspot.create_ticket', icon: SiHubspot },
  { id: 'salesforce_get', bucket: 'external', brand: 'Salesforce', name: 'Salesforce · Get account', verb: 'Get account', desc: 'Look up an account', slug: 'salesforce.get_account', icon: SiSalesforce },
  { id: 'clickup_task', bucket: 'external', brand: 'ClickUp', name: 'ClickUp · Create task', verb: 'Create task', desc: 'Add a task to a list', slug: 'clickup.create_task', icon: SiClickup },
  { id: 'http', bucket: 'external', name: 'HTTP', verb: 'HTTP', meta: 'POST · Airtable', desc: 'Call a custom endpoint', slug: 'http', icon: RiGlobalLine },

  // Human
  { id: 'approval', bucket: 'human', name: 'Approval', verb: 'Approval', meta: 'manager · 24h', desc: 'Pause for human sign-off', slug: 'approval', icon: RiCheckDoubleLine },

  // Wait
  { id: 'wait', bucket: 'wait', name: 'Wait', verb: 'Wait', meta: '5 days', desc: 'Pause for a fixed duration', slug: 'wait', icon: RiTimeLine },
  { id: 'wait_reply', bucket: 'wait', name: 'Wait for reply', verb: 'Wait for reply', desc: 'Resume when the customer responds', slug: 'wait.for_reply', icon: RiTimeLine },

  // Flow
  { id: 'condition', bucket: 'flow', name: 'Condition', verb: 'Condition', meta: 'if / else if / else', desc: 'Branch on an expression', slug: 'flow.condition', icon: RiGitBranchLine },
  { id: 'end', bucket: 'flow', name: 'End playbook', verb: 'End playbook', desc: 'Stop here, no further steps run', slug: 'flow.end', icon: RiStopCircleLine },
];

const BUCKET_META: Record<Bucket, { name: string; tag: string; sub: string }> = {
  read:     { name: 'Read & understand',       tag: 'silent',         sub: 'Fin data connectors + OpenAI Agent reads' },
  ticket:   { name: 'Touch the ticket',        tag: 'Hiver-native',   sub: 'Fin entirely' },
  external: { name: 'Touch the outside world', tag: 'connectors',     sub: 'Fin + Pylon Custom Actions' },
  human:    { name: 'Loop in a human',         tag: 'pause for review', sub: 'Fin Handoff' },
  wait:     { name: 'Wait & come back',        tag: 'time-based',     sub: 'Pylon delay + Fin' },
  flow:     { name: 'Control flow & end',      tag: 'branching',      sub: 'Fin Condition + OpenAI If/Else' },
};

const BUCKET_ORDER: Bucket[] = ['read', 'ticket', 'external', 'human', 'wait', 'flow'];

interface ChipProps {
  action: Action;
  status?: 'ok' | 'error' | 'running';
  selected?: boolean;
  unconfigured?: boolean;
  disabled?: boolean;
  error?: boolean;
  onClick?: () => void;
}
function Chip({ action, status, selected, unconfigured, disabled, error, onClick }: ChipProps) {
  const Icon = action.icon;
  const cls = [styles.chip];
  if (selected) cls.push(styles.chipSelected);
  if (unconfigured) cls.push(styles.chipUnconfigured);
  if (disabled) cls.push(styles.chipDisabled);
  if (error) cls.push(styles.chipError);
  return (
    <span className={cls.join(' ')} onClick={onClick} tabIndex={0}>
      <span className={styles.chipIco}><Icon /></span>
      {action.brand && (
        <>
          <span className={styles.chipBrand}>{action.brand}</span>
          <span className={styles.chipSep}>·</span>
        </>
      )}
      <span className={styles.chipVerb}>
        {unconfigured ? `${action.verb} what?` : action.verb}
      </span>
      {!unconfigured && action.meta && <span className={styles.chipMeta}>{action.meta}</span>}
      {status && !disabled && (
        <span
          className={`${styles.statusRing} ${
            status === 'ok' ? styles.statusRingOk :
            status === 'error' ? styles.statusRingErr :
            styles.statusRingRun
          }`}
        />
      )}
    </span>
  );
}

export default function InlineActionsPage() {
  // Slash menu state — handled with useRef + useEffect outside-click (no React bubbling games)
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashIdx, setSlashIdx] = useState(0);
  const [inserted, setInserted] = useState<Action[]>([]);
  const slashAnchorRef = useRef<HTMLSpanElement | null>(null);
  const slashInputRef = useRef<HTMLInputElement | null>(null);

  // Outside-click closes slash menu
  useEffect(() => {
    if (!slashOpen) return;
    const handler = (e: MouseEvent) => {
      if (slashAnchorRef.current && !slashAnchorRef.current.contains(e.target as Node)) {
        setSlashOpen(false);
      }
    };
    // Defer attachment so the click that opened the menu doesn't immediately close it
    const id = window.setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [slashOpen]);

  // Auto-focus input when slash opens
  useEffect(() => {
    if (slashOpen) {
      setSlashQuery('');
      setSlashIdx(0);
      requestAnimationFrame(() => slashInputRef.current?.focus());
    }
  }, [slashOpen]);

  // Filtered actions
  const filtered = useMemo(() => {
    const q = slashQuery.trim().toLowerCase();
    if (!q) return ACTIONS;
    return ACTIONS.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      a.verb.toLowerCase().includes(q) ||
      a.bucket.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q)
    );
  }, [slashQuery]);

  // Group by bucket when query empty, flat when typing
  const grouped = useMemo(() => {
    if (slashQuery.trim()) return { _all: filtered };
    return BUCKET_ORDER.reduce<Record<string, Action[]>>((acc, b) => {
      const inB = filtered.filter((a) => a.bucket === b);
      if (inB.length) acc[b] = inB;
      return acc;
    }, {});
  }, [filtered, slashQuery]);

  const flatList = useMemo(() => {
    return Object.values(grouped).flat();
  }, [grouped]);

  // Clamp slashIdx
  useEffect(() => {
    if (slashIdx >= flatList.length) setSlashIdx(Math.max(0, flatList.length - 1));
  }, [flatList.length, slashIdx]);

  const insertAction = (a: Action) => {
    setInserted((cur) => [...cur, a]);
    setSlashOpen(false);
  };

  const handleSlashKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSlashIdx((i) => Math.min(flatList.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSlashIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const a = flatList[slashIdx];
      if (a) insertAction(a);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSlashOpen(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.docbar}>
        <div className={styles.brand}>P</div>
        <div className={styles.crumb}>
          <Link href="/">Playbooks</Link>
          <span className={styles.csep}>/</span>
          <Link href="/component/node">Components</Link>
          <span className={styles.csep}>/</span>
          <span className={styles.name}>Inline Actions</span>
        </div>
        <span className={styles.meta}>Umbrella · 2026-05-23</span>
        <span className={styles.tbDivider} />
        <span className={styles.meta}>Fin (ticket) · OpenAI (test/run) · Pylon (slash)</span>
        <span className={styles.spacer} />
        <Link className={styles.linkbtn} href="/component/tag">Tag (child)</Link>
        <Link className={styles.linkbtn} href="/component/node">Node</Link>
        <Link className={styles.linkbtn} href="/design-language-2">v2 editor</Link>
        <Link className={styles.linkbtn} href="/">Back to editor</Link>
      </header>

      <div className={styles.wrap}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Component · Inline Actions · umbrella</span>
          <h1 className={styles.h1}>The chip atom + 6 buckets + slash menu</h1>
          <p className={styles.lede}>
            Every verb a playbook can run is an Inline Action — rendered as an atomic chip inside a Node body.
            29 actions across 6 buckets share one shell. Click any chip → contextual Inspector. Press <strong>/</strong> inside a Node → discover all actions.
            This umbrella is the structural foundation; each variant (Tag, Note, Approval, Condition…) has its own child extraction for its variant-specific config.
          </p>
          <div className={styles.heroMeta}>
            <span><strong>Chip:</strong> icon + brand + sep + verb + mono meta</span>
            <span><strong>Buckets:</strong> 6</span>
            <span><strong>Actions:</strong> 29</span>
            <span><strong>Picker:</strong> <code>/</code> at caret</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 01 Anatomy                                                    */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>01</span> Anatomy</span>
          <h2 className={styles.h2}>One chip shell, six visible parts</h2>
          <p className={styles.sub}>Every Inline Action chip inherits this anatomy. Variations are which parts are present (brand only on connector chips, meta only when configured).</p>

          <div className={styles.canvasSurface}>
            <div className={styles.annotated}>
              <div className={styles.anchor}>
                <Chip action={ACTIONS[4]!} status="ok" />
              </div>
              <div className={styles.legend}>
                <div className={styles.legendRow}>
                  <span className={styles.legendKey}>A</span>
                  <span className={styles.legendDesc}><strong>Icon</strong> — 14×14 inside a 16×16 slot. <code>react-icons/ri</code> (UI) + <code>react-icons/si</code> (brand). <code>currentColor</code>.</span>
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.legendKey}>B</span>
                  <span className={styles.legendDesc}><strong>Brand</strong> — Inter 12.5/400/<code>--muted</code>. Connector chips only.</span>
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.legendKey}>C</span>
                  <span className={styles.legendDesc}><strong>Separator</strong> — <code>·</code> in <code>--muted-soft</code>. Only with brand.</span>
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.legendKey}>D</span>
                  <span className={styles.legendDesc}><strong>Verb</strong> — Inter 12.5/500/<code>--ink</code>. The action name.</span>
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.legendKey}>E</span>
                  <span className={styles.legendDesc}><strong>Meta</strong> — Mono 10.5/<code>--muted</code> with 1px hairline left divider. The configured value.</span>
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.legendKey}>F</span>
                  <span className={styles.legendDesc}><strong>Status ring</strong> — 8px circle at bottom-right. Only in Test/Run modes or on error.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 02 Buckets                                                   */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>02</span> 6 buckets · 29 actions</span>
          <h2 className={styles.h2}>The taxonomy is the data model, not just a UI grouping</h2>
          <p className={styles.sub}>Source of truth: <code>data/library.ts:9-16</code>. Each bucket dictates which slash-menu section the chip appears in and which Inspector schema renders when clicked.</p>

          <div className={styles.bucketGrid}>
            {BUCKET_ORDER.map((bucket) => {
              const meta = BUCKET_META[bucket];
              const chips = ACTIONS.filter((a) => a.bucket === bucket);
              return (
                <div key={bucket} className={styles.bucket}>
                  <div className={styles.bucketHead}>
                    <span className={styles.bucketName}>{meta.name}</span>
                    <span className={styles.bucketTag}>{meta.tag}</span>
                  </div>
                  <div className={styles.bucketChips}>
                    {chips.map((a) => <Chip key={a.id} action={a} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 03 Chip states                                                */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>03</span> Chip states</span>
          <h2 className={styles.h2}>The atom in every lifecycle state</h2>
          <p className={styles.sub}>Default / hover / selected / unconfigured / running / ok / error / disabled. Hover the chips below to feel the snap.</p>

          <div className={styles.canvasSurface}>
            <div className={styles.statesGrid}>
              <div className={styles.stateCell}>
                <span className={styles.stateLabel}>Default</span>
                <div className={styles.stateStage}><Chip action={ACTIONS[0]!} /></div>
              </div>
              <div className={styles.stateCell}>
                <span className={styles.stateLabel}>Selected (Inspector open)</span>
                <div className={styles.stateStage}><Chip action={ACTIONS[6]!} selected /></div>
              </div>
              <div className={styles.stateCell}>
                <span className={styles.stateLabel}>Unconfigured</span>
                <div className={styles.stateStage}><Chip action={ACTIONS[6]!} unconfigured /></div>
              </div>
              <div className={styles.stateCell}>
                <span className={styles.stateLabel}>Running</span>
                <div className={styles.stateStage}><Chip action={ACTIONS[3]!} status="running" /></div>
              </div>
              <div className={styles.stateCell}>
                <span className={styles.stateLabel}>OK (last run succeeded)</span>
                <div className={styles.stateStage}><Chip action={ACTIONS[4]!} status="ok" /></div>
              </div>
              <div className={styles.stateCell}>
                <span className={styles.stateLabel}>Error</span>
                <div className={styles.stateStage}><Chip action={ACTIONS[4]!} status="error" error /></div>
              </div>
              <div className={styles.stateCell}>
                <span className={styles.stateLabel}>Disabled</span>
                <div className={styles.stateStage}><Chip action={ACTIONS[6]!} disabled /></div>
              </div>
              <div className={styles.stateCell}>
                <span className={styles.stateLabel}>No-meta variant</span>
                <div className={styles.stateStage}><Chip action={ACTIONS[16]!} /></div>
              </div>
              <div className={styles.stateCell}>
                <span className={styles.stateLabel}>Brand + verb + meta</span>
                <div className={styles.stateStage}><Chip action={ACTIONS[11]!} /></div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 04 Slash menu                                                 */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>04</span> Slash menu (live)</span>
          <h2 className={styles.h2}>The discovery surface for all 29 actions</h2>
          <p className={styles.sub}>
            Click <strong>/ insert action</strong> below to open the menu. Type to filter. <kbd>↑↓</kbd> to navigate, <kbd>↩</kbd> to insert, <kbd>esc</kbd> to close.
            Without a query, results are sectioned by bucket. With a query, they flatten and rank by match strength.
          </p>

          <div className={styles.slashHost}>
            <span className={styles.placeholder}>Walk Japan tour enquiry · pause and try the slash menu →</span>{' '}
            <span className={styles.slashAnchor} ref={slashAnchorRef}>
              <button
                type="button"
                className={styles.slashTrigger}
                onClick={() => setSlashOpen((v) => !v)}
              >
                / insert action <kbd>/</kbd>
              </button>
              <div
                className={`${styles.slashMenu} ${slashOpen ? styles.slashOpen : ''}`}
                onKeyDown={handleSlashKey}
              >
                <div className={styles.slashHead}>
                  <span className={styles.slashScope}>ACTION</span>
                  <input
                    ref={slashInputRef}
                    className={styles.slashInput}
                    placeholder="Filter 29 actions…"
                    value={slashQuery}
                    onChange={(e) => { setSlashQuery(e.target.value); setSlashIdx(0); }}
                  />
                  <span className={styles.slashCount}>{flatList.length}</span>
                </div>
                <div className={styles.slashBody}>
                  {flatList.length === 0 ? (
                    <div className={styles.slashEmpty}>No actions match &quot;{slashQuery}&quot;</div>
                  ) : (
                    Object.entries(grouped).map(([key, items]) => {
                      const isSearchMode = key === '_all';
                      const meta = isSearchMode ? null : BUCKET_META[key as Bucket];
                      return (
                        <div key={key}>
                          {!isSearchMode && meta && (
                            <div className={styles.slashSection}>
                              {meta.name}
                              <span className={styles.slashSectionMeta}>· {items.length}</span>
                            </div>
                          )}
                          {items.map((a) => {
                            const idx = flatList.indexOf(a);
                            const active = idx === slashIdx;
                            const Icon = a.icon;
                            return (
                              <button
                                key={a.id}
                                type="button"
                                className={`${styles.slashRow} ${active ? styles.slashRowActive : ''}`}
                                onMouseEnter={() => setSlashIdx(idx)}
                                onClick={() => insertAction(a)}
                              >
                                <span className={styles.slashIco}><Icon /></span>
                                <span className={styles.slashText}>
                                  <span className={styles.slashTitle}>{a.name}</span>
                                  <span className={styles.slashSubtitle}>
                                    {a.desc} · <span className="mono">{a.slug}</span>
                                  </span>
                                </span>
                                {active && <span className={styles.slashKbd}>↩</span>}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className={styles.slashFoot}>
                  <span className={styles.slashHint}><span className={styles.slashKbd}>↑↓</span> navigate</span>
                  <span className={styles.slashHint}><span className={styles.slashKbd}>↩</span> insert</span>
                  <span className={styles.slashHint}><span className={styles.slashKbd}>esc</span> close</span>
                </div>
              </div>
            </span>
          </div>

          <div className={styles.insertedLine}>
            <span className="label">Inserted:</span>
            {inserted.length === 0 ? (
              <span className="empty">nothing yet · pick an action from the menu</span>
            ) : (
              inserted.map((a, i) => <Chip key={`${a.id}-${i}`} action={a} />)
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 05 Variant index                                              */}
        {/* ============================================================ */}
        <section className={styles.section}>
          <span className={styles.seclabel}><span className={styles.secnum}>05</span> Variant index</span>
          <h2 className={styles.h2}>Children of this umbrella</h2>
          <p className={styles.sub}>Each variant inherits the chip shell (above) and adds its own Inspector content (next umbrella).</p>

          <table className={styles.variantTable}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Bucket</th>
                <th>Child extraction</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Tag</strong></td>
                <td><span className="bucketPill">ticket</span></td>
                <td><a href="/component/tag" className={styles.linkbtn} style={{ padding: '2px 8px', fontSize: 12 }}>extraction.md ↗</a> <span className="statusReady">ready</span></td>
              </tr>
              <tr>
                <td>Note</td>
                <td><span className="bucketPill">ticket</span></td>
                <td><span className="statusParked">parked</span></td>
              </tr>
              <tr>
                <td>Assign</td>
                <td><span className="bucketPill">ticket</span></td>
                <td><span className="statusParked">parked</span></td>
              </tr>
              <tr>
                <td>Draft / Send Reply</td>
                <td><span className="bucketPill">ticket</span></td>
                <td><span className="statusParked">parked</span></td>
              </tr>
              <tr>
                <td>AI Extract</td>
                <td><span className="bucketPill">read</span></td>
                <td><span className="statusParked">parked (Inspector first)</span></td>
              </tr>
              <tr>
                <td>HubSpot · Find / Sheets · Get / Salesforce · Get</td>
                <td><span className="bucketPill">read</span></td>
                <td><span className="statusParked">parked</span></td>
              </tr>
              <tr>
                <td>Slack · Send / Shopify · Refund / ClickUp · Task / HTTP</td>
                <td><span className="bucketPill">external</span></td>
                <td><span className="statusParked">parked</span></td>
              </tr>
              <tr>
                <td>Approval</td>
                <td><span className="bucketPill">human</span></td>
                <td><span className="statusParked">parked (likely own umbrella — rich-block atom)</span></td>
              </tr>
              <tr>
                <td>Wait / Wait for reply / Wait until</td>
                <td><span className="bucketPill">wait</span></td>
                <td><span className="statusParked">parked</span></td>
              </tr>
              <tr>
                <td>Condition / End / Sub-procedure</td>
                <td><span className="bucketPill">flow</span></td>
                <td><span className="statusParked">parked (referenced in Node extraction)</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer className={styles.footer}>
          <Link href="/component/node">/component/node</Link>
          <Link href="/component/tag">/component/tag</Link>
          <Link href="/design-language-2">/design-language-2</Link>
          <Link href="/">/ assembled editor</Link>
          <a href="https://github.com/geekv30/hiver-playbooks-prototype" target="_blank" rel="noreferrer">repo</a>
        </footer>
      </div>
    </div>
  );
}
