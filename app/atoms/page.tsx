'use client';

/* Component library. Every real prototype component, reviewed in isolation and
   grouped into categories. Specimens render the ACTUAL imported components - no
   re-implementations - so this page stays honest as the components evolve.
   Full-screen composites (editor, modals) link to their live routes. */

import { useEffect, useState, type ReactNode } from 'react';
import {
  RiPlayLine,
  RiArrowDownSLine,
  RiArrowRightLine,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiArrowUpLine,
  RiSearchLine,
  RiCloseLine,
  RiFlaskLine,
} from 'react-icons/ri';

// Atoms
import Avatar from '@/components/atoms/Avatar';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Checkbox from '@/components/atoms/Checkbox';
import Chip from '@/components/atoms/Chip';
import ConnectorTile from '@/components/atoms/ConnectorTile';
import Dropdown from '@/components/atoms/Dropdown';
import FieldRef from '@/components/atoms/FieldRef';
import GutterMarker from '@/components/atoms/GutterMarker';
import Input from '@/components/atoms/Input';
import Kbd from '@/components/atoms/Kbd';
import SectionEyebrow from '@/components/atoms/SectionEyebrow';
import SegmentedControl from '@/components/atoms/SegmentedControl';
import Spinner from '@/components/atoms/Spinner';
import Textarea from '@/components/atoms/Textarea';
import ThumbsRating, { type Verdict } from '@/components/atoms/ThumbsRating';
import { ToastStack } from '@/components/atoms/Toast';
import Tooltip from '@/components/atoms/Tooltip';
import { useToast } from '@/hooks/useToast';

// Surfaces
import FieldInput from '@/components/surfaces/FieldInput';
import Output from '@/components/surfaces/Output';

// Flow affordances + composites
import ActionHint from '@/components/flow01/ActionHint';
import ChatBar from '@/components/flow01/ChatBar';
import GmailBar from '@/components/flow01/GmailBar';
import Toolbar from '@/components/flow01/Toolbar';
import TitleField from '@/components/flow01/TitleField';
import RowMenu from '@/components/flow01/RowMenu';
import EditorLine from '@/components/flow01/EditorLine';
import CommandPalette from '@/components/flow01/CommandPalette';
import BranchTypePicker from '@/components/flow01/condition/BranchTypePicker';
import ConditionBlock from '@/components/flow01/condition/ConditionBlock';
import CopilotSparkle from '@/components/flow01/copilot/CopilotSparkle';
import PanelTabs, { type SideTab } from '@/components/flow01/copilot/PanelTabs';
import CopilotRail from '@/components/flow01/copilot/CopilotRail';
import CopilotProposal from '@/components/flow01/copilot/CopilotProposal';
import CopilotPanel from '@/components/flow01/copilot/CopilotPanel';
import SidePanel from '@/components/flow01/copilot/SidePanel';

// Canvas blocks
import Frontmatter from '@/components/canvas/Frontmatter';
import { Fragments } from '@/components/canvas/Fragments';
import StepRow from '@/components/canvas/StepRow';
import ConditionRow from '@/components/canvas/ConditionRow';
import ApprovalStep from '@/components/canvas/ApprovalStep';
import EndRow from '@/components/canvas/EndRow';
import Jumplist from '@/components/canvas/Jumplist';
import ValidationStrip from '@/components/canvas/ValidationStrip';
import ConfigTab from '@/components/canvas/rail/ConfigTab';
import OutputTab from '@/components/canvas/rail/OutputTab';
import PlaybookTab from '@/components/canvas/rail/PlaybookTab';
import RunTab from '@/components/canvas/rail/RunTab';
import SetupMode from '@/components/canvas/rail/SetupMode';

// Simulate
import StatusPill from '@/components/simulate/StatusPill';
import SimStatus from '@/components/simulate/SimStatus';
import TopicCard from '@/components/simulate/TopicCard';
import TopicHeader from '@/components/simulate/TopicHeader';
import ScenarioList from '@/components/simulate/ScenarioList';
import TraceStep from '@/components/simulate/TraceStep';
import RunTrace from '@/components/simulate/RunTrace';
import RunOutcome from '@/components/simulate/RunOutcome';
import EmailCard from '@/components/simulate/EmailCard';
import EmailList from '@/components/simulate/EmailList';
import TestAllBar from '@/components/simulate/TestAllBar';
import EvalMenu from '@/components/simulate/EvalMenu';
import EvalBackHeader from '@/components/simulate/EvalBackHeader';
import SimEmptyState from '@/components/simulate/SimEmptyState';
import ScenariosEmpty from '@/components/simulate/ScenariosEmpty';
import CustomEval from '@/components/simulate/CustomEval';
import RecentEmails from '@/components/simulate/RecentEmails';
import { SIM_TRACE } from '@/components/simulate/traceFixture';

// Icons
import { GmailLogo } from '@/components/icons/ui/GmailLogo';
import {
  DragIcon, KebabIcon, SearchIcon, SettingsIcon, SparkleIcon, PlayIcon, InspectIcon,
  HistoryIcon, CheckIcon, XIcon, EditIcon, HiverBrandIcon, SummarizeIcon, KbIcon,
  DraftVerbIcon, NoteIcon, TagIcon, AssignIcon, ApprovalIcon, WaitIcon, EndIcon,
  HumanReviewIcon, BranchIcon, AgentsIcon, CopilotIcon, AutopilotIcon, ExtractIcon,
  ReplyIcon, HttpIcon, BackIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon,
  PlusIcon, InboxIcon,
} from '@/components/icons/ui';
import {
  EmailIcon, TextIcon, LongTextIcon, NumberIcon, DateIcon, BoolIcon, EnumIcon,
  DocIcon, DraftIcon,
} from '@/components/icons/fields';
import {
  ShopifyIcon, HubSpotIcon, SlackIcon, SalesforceIcon, ClickUpIcon,
} from '@/components/icons/connectors';

import type { ComponentType, SVGProps } from 'react';
import type { Playbook } from '@/types/playbook';
import styles from './page.module.css';

// A fixed timestamp keeps SSR == client (no Date.now() in render -> no hydration drift).
const DEMO_TS = 1_749_500_000_000;

// ----------------------------------------------------------------------------
// Shared renderers
// ----------------------------------------------------------------------------

function Spec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.cell}>
      <div className={styles.cellBody}>{children}</div>
      <span className={styles.cellLabel}>{label}</span>
    </div>
  );
}

function Block({
  name,
  imp,
  desc,
  children,
}: {
  name: string;
  imp: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <div className={styles.blockTitleRow}>
          <h3>{name}</h3>
          <code className={styles.blockImport}>{imp}</code>
        </div>
        <p className={styles.blockDesc}>{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

function SubGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.subGroup}>
      <p className={styles.subLabel}>{label}</p>
      <div className={styles.row}>{children}</div>
    </div>
  );
}

function Stage({
  hint,
  wide,
  tall,
  children,
}: {
  hint?: string;
  wide?: boolean;
  tall?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.stage} ${wide ? styles.stageWide : ''} ${tall ? styles.stageTall : ''}`}>
      {hint && <span className={styles.stageHint}>{hint}</span>}
      {children}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Stateful demo wrappers (controlled components need a host that owns state)
// ----------------------------------------------------------------------------

function DropdownDemo({
  options,
  initial,
  placeholder,
  ariaLabel,
}: {
  options: { id: string; label: string }[];
  initial: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div style={{ width: 200 }}>
      <Dropdown options={options} value={value} onChange={setValue} placeholder={placeholder} ariaLabel={ariaLabel} />
    </div>
  );
}

function SegDemo({
  tabs,
  initial,
  ariaLabel,
}: {
  tabs: { id: string; label: string }[];
  initial: string;
  ariaLabel: string;
}) {
  const [active, setActive] = useState(initial);
  return <SegmentedControl tabs={tabs} active={active} onChange={setActive} ariaLabel={ariaLabel} />;
}

function ThumbsDemo({ initial }: { initial?: Verdict }) {
  const [verdict, setVerdict] = useState<Verdict | undefined>(initial);
  return <ThumbsRating verdict={verdict} onVerdict={setVerdict} />;
}

function FieldInputDemo({
  label,
  initial,
  type,
  multiline,
  help,
  error,
  placeholder,
}: {
  label: string;
  initial: string;
  type?: 'text' | 'email' | 'number' | 'date';
  multiline?: boolean;
  help?: string;
  error?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div style={{ width: 280 }}>
      <FieldInput
        label={label}
        value={value}
        onChange={setValue}
        type={type}
        multiline={multiline}
        help={help}
        error={error}
        placeholder={placeholder}
      />
    </div>
  );
}

function TitleFieldDemo({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
      <TitleField value={value} onChange={setValue} />
    </span>
  );
}

function ToolbarDemo({
  title,
  status,
  canEnable,
  hideIdentity,
}: {
  title: string;
  status: 'draft' | 'active' | 'paused';
  canEnable?: boolean;
  hideIdentity?: boolean;
}) {
  const [t, setT] = useState(title);
  return (
    <Toolbar
      title={t}
      onTitleChange={setT}
      status={status}
      canEnable={canEnable}
      hideIdentity={hideIdentity}
      onSimulate={() => {}}
      onEnable={() => {}}
      onPause={() => {}}
      onResume={() => {}}
      onSettings={() => {}}
      onBack={() => {}}
    />
  );
}

function PanelTabsDemo({ initial }: { initial: SideTab }) {
  const [active, setActive] = useState<SideTab>(initial);
  return (
    <div style={{ width: 360 }}>
      <PanelTabs active={active} onChange={setActive} />
    </div>
  );
}

function CopilotRailDemo() {
  const [open, setOpen] = useState<'copilot' | 'evaluate' | null>('copilot');
  return (
    <CopilotRail
      copilotOpen={open === 'copilot'}
      onToggleCopilot={() => setOpen((o) => (o === 'copilot' ? null : 'copilot'))}
      evaluating={open === 'evaluate'}
      onToggleEvaluate={() => setOpen((o) => (o === 'evaluate' ? null : 'evaluate'))}
    />
  );
}

function ToastDemo() {
  const { items, push } = useToast();
  return (
    <>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={() => push('Saved your changes')}>Default</Button>
        <Button variant="secondary" onClick={() => push('Procedure activated', 'success')}>Success</Button>
        <Button variant="secondary" onClick={() => push('Connector needs setup', 'warn')}>Warn</Button>
      </div>
      <ToastStack items={items} />
    </>
  );
}

const EDITABLE_NOOP = () => {};
// Stable no-op: components whose effects key on a handler (e.g. BranchTypePicker's
// focus effect on [onClose]) must get a constant reference, or they re-run every render.
const NOOP = () => {};

// ----------------------------------------------------------------------------
// Foundations data
// ----------------------------------------------------------------------------

const COLOR_GROUPS: { label: string; tokens: { name: string; value: string }[] }[] = [
  {
    label: 'Surfaces',
    tokens: [
      { name: '--canvas', value: '#fbfbfc' },
      { name: '--canvas-soft', value: '#f6f8fc' },
      { name: '--hairline-soft', value: '#eceff6' },
      { name: '--hairline', value: '#d6dde8' },
      { name: '--hairline-strong', value: '#97a3b7' },
    ],
  },
  {
    label: 'Text',
    tokens: [
      { name: '--ink', value: '#343c45' },
      { name: '--ink-soft', value: '#3e4c5a' },
      { name: '--muted', value: '#6f7c90' },
      { name: '--muted-soft', value: '#97a3b7' },
    ],
  },
  {
    label: 'State',
    tokens: [
      { name: '--state-ok', value: '#16a34a' },
      { name: '--state-warn', value: '#d97706' },
      { name: '--state-error', value: '#dc2626' },
      { name: '--state-running', value: '#7c3aed' },
      { name: '--state-draft', value: '#d97757' },
    ],
  },
  {
    label: 'Brand',
    tokens: [
      { name: '--primary', value: '#e15524' },
      { name: '--primary-hover', value: '#c8431c' },
    ],
  },
];

const TYPE_SCALE: { token: string; px: string; sample: string }[] = [
  { token: '--fs-h1', px: '28', sample: 'Build a procedure' },
  { token: '--fs-h2', px: '24', sample: 'Section title' },
  { token: '--fs-h3', px: '20', sample: 'Component title' },
  { token: '--fs-h4', px: '18', sample: 'Sub-section' },
  { token: '--fs-h5', px: '16', sample: 'Panel head' },
  { token: '--fs-body', px: '14', sample: 'Body copy - the base reading size for prose and labels.' },
  { token: '--fs-small', px: '13', sample: 'Buttons, chip text, captions' },
  { token: '--fs-caption', px: '12', sample: 'Mono inline / small captions' },
  { token: '--fs-micro', px: '11', sample: 'Eyebrow / kbd / mono labels' },
];

const RADII: { token: string; px: string }[] = [
  { token: '--r-xs', px: '4' },
  { token: '--r-sm', px: '6' },
  { token: '--r-md', px: '8' },
  { token: '--r-lg', px: '10' },
  { token: '--r-pill', px: '9999' },
];

// Demo playbook for the rail tabs (only the read fields matter).
const DEMO_PLAYBOOK: Playbook = {
  id: 'pb-demo',
  version: 1,
  frontmatter: { name: 'Tour inquiry triage', summary: 'Triage inbound inquiries.', triggerFragments: [] },
  steps: [
    { kind: 'action', id: 's1', fragments: [] },
    { kind: 'action', id: 's2', fragments: [] },
    { kind: 'action', id: 's3', fragments: [] },
  ],
  refs: [],
  connectors: [
    { slug: 'shopify', authed: true, accountLabel: 'acme-store.myshopify.com' },
    { slug: 'hubspot', authed: false },
  ],
  bindings: [
    { mailboxId: 'support', mailboxName: 'Support', active: true },
    { mailboxId: 'sales', mailboxName: 'Sales', active: false },
  ],
  updatedAt: DEMO_TS,
};

// ----------------------------------------------------------------------------
// Nav model + scroll-spy
// ----------------------------------------------------------------------------

const NAV: { id: string; label: string; count: number }[] = [
  { id: 'foundations', label: 'Foundations', count: 3 },
  { id: 'atoms', label: 'Atoms', count: 6 },
  { id: 'form-controls', label: 'Form controls', count: 11 },
  { id: 'surfaces', label: 'Surfaces & overlays', count: 11 },
  { id: 'canvas', label: 'Canvas blocks', count: 18 },
  { id: 'simulate', label: 'Simulate', count: 17 },
  { id: 'screens', label: 'Composed screens', count: 8 },
  { id: 'icons', label: 'Icons', count: 4 },
];

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '');
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: '-12% 0px -70% 0px', threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

const NAV_IDS = NAV.map((n) => n.id);

export default function ComponentLibrary() {
  const active = useScrollSpy(NAV_IDS);
  const total = NAV.reduce((s, n) => s + n.count, 0);

  // Several always-mounted specimens (CommandPalette, BranchTypePicker, CopilotPanel,
  // CustomEval, RecentEmails) focus an input on mount - some via a deferred callback -
  // which would yank this long page down on load. During the brief load window we make
  // every focus() non-scrolling, so the viewer stays at the top. Restored after 1.5s.
  useEffect(() => {
    window.scrollTo(0, 0);
    const proto = HTMLElement.prototype;
    const orig = proto.focus;
    proto.focus = function (this: HTMLElement, opts?: FocusOptions) {
      return orig.call(this, { ...opts, preventScroll: true });
    };
    const t = window.setTimeout(() => { proto.focus = orig; }, 1500);
    return () => { window.clearTimeout(t); proto.focus = orig; };
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hiver-mark.png" alt="" className={styles.navMark} />
          AOP
        </div>
        <p className={styles.navSub}>Component library</p>
        <ul className={styles.navList}>
          {NAV.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={styles.navLink}
                data-active={active === n.id}
                onClick={() => go(n.id)}
              >
                <span>{n.label}</span>
                <span className={styles.navCount}>{n.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className={styles.main}>
        <header className={styles.head}>
          <h1>Component library</h1>
          <p>
            Every component in the AOP prototype, reviewed in isolation and grouped by role. Each
            specimen renders the real component, so this page tracks the code. The live editor is at{' '}
            <a href="/canvas">/canvas</a>.
          </p>
          <div className={styles.headMeta}>
            <span>{total} components</span>
            <span>{NAV.length} categories</span>
            <span>cool-neutral palette</span>
          </div>
        </header>

        {/* ============================ FOUNDATIONS ============================ */}
        <section id="foundations" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Foundations</h2>
            <span className={styles.categoryCount}>tokens</span>
          </div>
          <p className={styles.categoryNote}>
            The design tokens every component reads from <code>app/globals.css</code> - the
            cool-neutral surface, text, state, and brand ramps, the type scale, and the radii.
          </p>
          <div className={styles.categoryRule} />

          <Block name="Color" imp="var(--token)" desc="The cool-neutral surface, text, state, and brand ramps.">
            {COLOR_GROUPS.map((g) => (
              <div key={g.label} className={styles.subGroup}>
                <p className={styles.subLabel}>{g.label}</p>
                <div className={styles.swatchGrid}>
                  {g.tokens.map((t) => (
                    <div key={t.name} className={styles.swatch}>
                      <span className={styles.swatchChip} style={{ background: `var(${t.name})` }} />
                      <span className={styles.swatchName}>{t.name}</span>
                      <span className={styles.swatchVal}>{t.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Block>

          <Block name="Typography" imp="var(--fs-*) · Inter + JetBrains Mono" desc="A constrained nine-step scale; weights 400 / 500 / 600 only.">
            <div className={styles.typeList}>
              {TYPE_SCALE.map((t) => (
                <div key={t.token} className={styles.typeRow}>
                  <span className={styles.typeSample} style={{ fontSize: `var(${t.token})`, fontWeight: 500 }}>
                    {t.sample}
                  </span>
                  <span className={styles.typeMeta}>
                    <code className={styles.typeToken}>{t.token}</code>
                    <code className={styles.typePx}>{t.px}px</code>
                  </span>
                </div>
              ))}
            </div>
          </Block>

          <Block name="Radii" imp="var(--r-*)" desc="Corner radii from inputs to pills.">
            <div className={styles.radiiRow}>
              {RADII.map((r) => (
                <div key={r.token} className={styles.radiiCell}>
                  <span className={styles.radiiBox} style={{ borderRadius: `var(${r.token})` }} />
                  <span className={styles.cellLabel}>{r.token} · {r.px === '9999' ? 'pill' : `${r.px}px`}</span>
                </div>
              ))}
            </div>
          </Block>
        </section>

        {/* ============================ ATOMS ============================ */}
        <section id="atoms" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Atoms</h2>
            <span className={styles.categoryCount}>6</span>
          </div>
          <p className={styles.categoryNote}>The smallest leaf primitives - no internal state, no data dependencies.</p>
          <div className={styles.categoryRule} />

          <Block name="Avatar" imp="atoms/Avatar" desc="Image or pastel initials with an optional online dot.">
            <Row>
              <Spec label="initials"><Avatar initials="K" color="#8789C5" /></Spec>
              <Spec label="online"><Avatar initials="A" color="#6FA974" online /></Spec>
              <Spec label="size 32"><Avatar initials="M" color="#D97757" size={32} /></Spec>
              <Spec label="stack + count">
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <span style={{ display: 'flex' }}>
                    {['#8789C5', '#6FA974', '#D97757'].map((c, i) => (
                      <span key={c} style={{ marginLeft: i ? -6 : 0, boxShadow: '0 0 0 1.5px var(--canvas)', borderRadius: '50%' }}>
                        <Avatar initials={['K', 'A', 'M'][i]} color={c} />
                      </span>
                    ))}
                  </span>
                  <span style={{ marginLeft: 6 }}><Badge>+3</Badge></span>
                </span>
              </Spec>
            </Row>
          </Block>

          <Block name="Badge" imp="atoms/Badge" desc="A small count or status pill, intent-toned.">
            <Row>
              <Spec label="neutral"><Badge>+3</Badge></Spec>
              <Spec label="success"><Badge intent="success">Passed</Badge></Spec>
              <Spec label="running"><Badge intent="running">Running</Badge></Spec>
              <Spec label="warning"><Badge intent="warning">Pending</Badge></Spec>
              <Spec label="error"><Badge intent="error">404 errors</Badge></Spec>
              <Spec label="draft"><Badge intent="draft">Draft</Badge></Spec>
              <Spec label="active"><Badge intent="active">Active</Badge></Spec>
              <Spec label="paused"><Badge intent="paused">Paused</Badge></Spec>
            </Row>
          </Block>

          <Block name="Kbd" imp="atoms/Kbd" desc="A keyboard-key cap for inline shortcuts.">
            <Row>
              <Spec label="enter"><Kbd>↩</Kbd></Spec>
              <Spec label="esc"><Kbd>esc</Kbd></Spec>
              <Spec label="cmd K"><Kbd>⌘ K</Kbd></Spec>
              <Spec label="slash"><Kbd>/</Kbd></Spec>
            </Row>
          </Block>

          <Block name="SectionEyebrow" imp="atoms/SectionEyebrow" desc="A small uppercase label for section eyebrows and meta lines.">
            <Row>
              <Spec label="label"><SectionEyebrow>Connectors</SectionEyebrow></Spec>
              <Spec label="meta"><SectionEyebrow>Last run · 2h ago</SectionEyebrow></Spec>
              <Spec label="validation"><SectionEyebrow>Validation · 3 issues</SectionEyebrow></Spec>
            </Row>
          </Block>

          <Block name="Spinner" imp="atoms/Spinner" desc="A rotating loader for in-progress states.">
            <Row>
              <Spec label="14"><Spinner size={14} /></Spec>
              <Spec label="16"><Spinner size={16} /></Spec>
              <Spec label="20"><Spinner size={20} /></Spec>
              <Spec label="in button"><Button variant="secondary" iconLeft={<Spinner size={16} />}>Running</Button></Spec>
            </Row>
          </Block>

          <Block name="ConnectorTile" imp="atoms/ConnectorTile" desc="A square brand-logo tile for a connector (letter fallback when no mark).">
            <Row>
              <Spec label="shopify"><ConnectorTile slug="shopify" /></Spec>
              <Spec label="hubspot"><ConnectorTile slug="hubspot" /></Spec>
              <Spec label="slack"><ConnectorTile slug="slack" /></Spec>
              <Spec label="salesforce"><ConnectorTile slug="salesforce" /></Spec>
              <Spec label="clickup"><ConnectorTile slug="clickup" /></Spec>
              <Spec label="lg"><ConnectorTile slug="shopify" size="lg" /></Spec>
            </Row>
          </Block>
        </section>

        {/* ============================ FORM CONTROLS ============================ */}
        <section id="form-controls" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Form controls</h2>
            <span className={styles.categoryCount}>11</span>
          </div>
          <p className={styles.categoryNote}>Inputs and switches. Controlled components are wrapped in a small stateful host so they actually work here.</p>
          <div className={styles.categoryRule} />

          <Block name="Button" imp="atoms/Button" desc="The system button: primary / secondary / tertiary / text variants, icon slots, pill icon-only.">
            <SubGroup label="Variants">
              <Spec label="primary"><Button variant="primary">Activate</Button></Spec>
              <Spec label="secondary"><Button variant="secondary">Simulate</Button></Spec>
              <Spec label="tertiary"><Button variant="tertiary">Edit</Button></Spec>
              <Spec label="text"><Button variant="text">Learn more</Button></Spec>
            </SubGroup>
            <SubGroup label="With icon">
              <Spec label="icon left"><Button variant="secondary" iconLeft={<RiPlayLine />}>Simulate</Button></Spec>
              <Spec label="icon right"><Button variant="primary" iconRight={<RiArrowDownSLine />}>Activate</Button></Spec>
              <Spec label="continue"><Button variant="primary" iconRight={<RiArrowRightLine />}>Continue</Button></Spec>
              <Spec label="undo"><Button variant="tertiary" iconOnly={<RiArrowGoBackLine />} ariaLabel="Undo" /></Spec>
              <Spec label="redo"><Button variant="tertiary" iconOnly={<RiArrowGoForwardLine />} ariaLabel="Redo" /></Spec>
              <Spec label="pill send"><Button variant="primary" pill iconOnly={<RiArrowUpLine />} ariaLabel="Send" /></Spec>
              <Spec label="sm send"><Button variant="primary" size="sm" pill iconOnly={<RiArrowUpLine />} ariaLabel="Send" /></Spec>
            </SubGroup>
            <SubGroup label="States">
              <Spec label="default"><Button variant="primary">Activate</Button></Spec>
              <Spec label="primary · disabled"><Button variant="primary" disabled iconRight={<RiArrowDownSLine />}>Activate</Button></Spec>
              <Spec label="secondary · disabled"><Button variant="secondary" disabled>Simulate</Button></Spec>
            </SubGroup>
          </Block>

          <Block name="Input" imp="atoms/Input" desc="A single-line field shell with optional prefix icon, suffix affordance, and error / disabled states.">
            <SubGroup label="Variants">
              <Spec label="placeholder"><div style={{ width: 260 }}><Input placeholder="ask a question..." /></div></Spec>
              <Spec label="filled"><div style={{ width: 260 }}><Input defaultValue="engineering domain" /></div></Spec>
              <Spec label="search"><div style={{ width: 260 }}><Input placeholder="search actions, connectors..." prefixIcon={<RiSearchLine />} /></div></Spec>
              <Spec label="select"><div style={{ width: 260 }}><Input placeholder="Select tone" readOnly suffix={<RiArrowDownSLine />} /></div></Spec>
            </SubGroup>
            <SubGroup label="States">
              <Spec label="error"><div style={{ width: 260 }}><Input defaultValue="bad value" error suffix={<RiCloseLine />} /></div></Spec>
              <Spec label="disabled"><div style={{ width: 260 }}><Input placeholder="disabled" disabled /></div></Spec>
            </SubGroup>
          </Block>

          <Block name="Textarea" imp="atoms/Textarea" desc="An auto-growing NL field with placeholder, error, and an optional corner info-tooltip.">
            <Row>
              <Spec label="placeholder"><div style={{ width: 440 }}><Textarea placeholder="Describe briefly when this procedure is to be run" /></div></Spec>
              <Spec label="+ corner info"><div style={{ width: 440 }}><Textarea placeholder="Describe when this runs" info="Runs when a new email lands in this mailbox." /></div></Spec>
            </Row>
            <Row>
              <Spec label="filled (auto-grow)"><div style={{ width: 440 }}><Textarea defaultValue="engineering domain with some kind of error or api status issue that needs triaging before a reply goes out" /></div></Spec>
              <Spec label="disabled"><div style={{ width: 440 }}><Textarea placeholder="Describe briefly when this procedure is to be run" disabled /></div></Spec>
            </Row>
          </Block>

          <Block name="Checkbox" imp="atoms/Checkbox" desc="Controlled checkbox with unchecked / checked / indeterminate / disabled, plus presentational + subtle variants.">
            <Row>
              <Spec label="unchecked"><Checkbox /></Spec>
              <Spec label="checked"><Checkbox checked /></Spec>
              <Spec label="indeterminate"><Checkbox indeterminate /></Spec>
              <Spec label="disabled"><Checkbox disabled /></Spec>
              <Spec label="disabled · checked"><Checkbox checked disabled /></Spec>
              <Spec label="subtle · 16"><Checkbox presentational subtle size={16} checked /></Spec>
            </Row>
          </Block>

          <Block name="Dropdown" imp="atoms/Dropdown" desc="A design-language select: trigger plus a keyboard-navigable listbox, closes on outside-click / Esc.">
            <Row>
              <Spec label="tone select"><DropdownDemo initial="friendly" ariaLabel="Tone" options={[{ id: 'formal', label: 'Formal' }, { id: 'friendly', label: 'Friendly' }, { id: 'concise', label: 'Concise' }]} /></Spec>
              <Spec label="empty placeholder"><DropdownDemo initial="" placeholder="Select an option" options={[{ id: 'a', label: 'Option A' }, { id: 'b', label: 'Option B' }]} /></Spec>
            </Row>
          </Block>

          <Block name="SegmentedControl" imp="atoms/SegmentedControl" desc="White-chip-on-track control; the active chip slides between equal-width segments. Generic over N tabs.">
            <Row>
              <Spec label="two tabs"><SegDemo initial="edit" ariaLabel="View mode" tabs={[{ id: 'edit', label: 'Edit' }, { id: 'preview', label: 'Preview' }]} /></Spec>
              <Spec label="three tabs"><SegDemo initial="all" ariaLabel="Filter" tabs={[{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'draft', label: 'Draft' }]} /></Spec>
            </Row>
          </Block>

          <Block name="ThumbsRating" imp="atoms/ThumbsRating" desc="The single 'rate this' renderer - icon-only up / down verdict; the consumer owns the value.">
            <Row>
              <Spec label="unrated"><ThumbsDemo /></Spec>
              <Spec label="thumbs up"><ThumbsDemo initial="up" /></Spec>
              <Spec label="thumbs down"><ThumbsDemo initial="down" /></Spec>
            </Row>
          </Block>

          <Block name="FieldInput" imp="surfaces/FieldInput" desc="A labeled text / textarea field with focus ring, help text, and an error state.">
            <Row>
              <Spec label="text"><FieldInputDemo label="Subject" initial="Welcome aboard" placeholder="Enter a subject…" /></Spec>
              <Spec label="with help"><FieldInputDemo label="Reply-to" initial="team@example.com" type="email" help="Replies will be routed here" /></Spec>
              <Spec label="error"><FieldInputDemo label="Reply-to address" initial="not-an-email" error="Enter a valid email address" /></Spec>
              <Spec label="multiline"><FieldInputDemo label="Message" initial="Thanks for reaching out…" multiline placeholder="Write a message…" /></Spec>
            </Row>
          </Block>

          <Block name="TitleField" imp="flow01/TitleField" desc="The editable AOP title - a content-sized contentEditable with a 'name me' dotted underline while unnamed.">
            <Row>
              <Spec label="named"><TitleFieldDemo initial="Refund triage" /></Spec>
              <Spec label="unnamed (name-me)"><TitleFieldDemo initial="Untitled AOP" /></Spec>
            </Row>
          </Block>

          <Block name="PanelTabs" imp="flow01/copilot/PanelTabs" desc="The side-panel Copilot | Evaluation switcher with a sliding active underline.">
            <Row>
              <Spec label="copilot active"><PanelTabsDemo initial="copilot" /></Spec>
              <Spec label="evaluation active"><PanelTabsDemo initial="simulate" /></Spec>
            </Row>
          </Block>

          <Block name="CopilotRail" imp="flow01/copilot/CopilotRail" desc="The floating /canvas tool-switcher - a vertical Copilot-over-Evaluate segmented control.">
            <Row>
              <Spec label="interactive"><CopilotRailDemo /></Spec>
            </Row>
          </Block>
        </section>

        {/* ============================ SURFACES & OVERLAYS ============================ */}
        <section id="surfaces" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Surfaces &amp; overlays</h2>
            <span className={styles.categoryCount}>11</span>
          </div>
          <p className={styles.categoryNote}>Popovers, tooltips, menus, and toasts. Self-positioning overlays are shown inside a contained stage; the toast pushes a real fixed toast.</p>
          <div className={styles.categoryRule} />

          <Block name="Tooltip" imp="atoms/Tooltip" desc="A CSS-driven hover / focus advisory bubble; defaults to a 14px info-icon trigger, four sides.">
            <SubGroup label="Default trigger · sides">
              <Spec label="top"><Tooltip side="top" content="Runs when a new email lands in this mailbox." /></Spec>
              <Spec label="bottom"><Tooltip side="bottom" content="Runs when a new email lands in this mailbox." /></Spec>
              <Spec label="left"><Tooltip side="left" content="Output of step 3." /></Spec>
              <Spec label="right"><Tooltip side="right" content="Output of step 3." /></Spec>
            </SubGroup>
            <SubGroup label="Custom trigger">
              <Spec label="on a button">
                <Tooltip content="Simulate this procedure against a test email." side="top">
                  <Button variant="secondary" iconLeft={<RiPlayLine />}>Simulate</Button>
                </Tooltip>
              </Spec>
              <Spec label="rich content">
                <Tooltip side="top" content={<span>Press <strong>Cmd K</strong> to open the command palette.</span>}>
                  <Button variant="tertiary">Shortcut</Button>
                </Tooltip>
              </Spec>
            </SubGroup>
          </Block>

          <Block name="ToastStack" imp="atoms/Toast · useToast" desc="A fixed live-region stack. Click to push a real toast - it appears bottom-center and auto-dismisses.">
            <Row>
              <Spec label="push a toast (live)"><ToastDemo /></Spec>
            </Row>
          </Block>

          <Block name="Output" imp="surfaces/Output" desc="A read-only renderer for an action's output: a key / value list, a scalar, or an empty hint.">
            <Row>
              <Spec label="object"><div style={{ width: 260 }}><Output data={{ status: 'classified', priority: 'high', confidence: 0.92 }} /></div></Spec>
              <Spec label="scalar"><div style={{ width: 260 }}><Output data="Order #1042 refunded" /></div></Spec>
              <Spec label="empty"><div style={{ width: 260 }}><Output data={null} /></div></Spec>
              <Spec label="custom hint"><div style={{ width: 260 }}><Output data={null} emptyHint="Run the step to see output" /></div></Spec>
            </Row>
          </Block>

          <Block name="RowMenu" imp="flow01/RowMenu" desc="The step-row kebab menu: Move up / down (disabled at the ends), Duplicate, and a danger Delete.">
            <Row>
              <Stage hint="popover">
                <div style={{ position: 'relative', width: 168, marginTop: 22 }}>
                  <RowMenu canMoveUp canMoveDown onMoveUp={() => {}} onMoveDown={() => {}} onDuplicate={() => {}} onDelete={() => {}} />
                </div>
              </Stage>
              <Stage hint="first row">
                <div style={{ position: 'relative', width: 168, marginTop: 22 }}>
                  <RowMenu canMoveUp={false} canMoveDown onMoveUp={() => {}} onMoveDown={() => {}} onDuplicate={() => {}} onDelete={() => {}} />
                </div>
              </Stage>
            </Row>
          </Block>

          <Block name="CommandPalette" imp="flow01/CommandPalette" desc="The slash / @ insert palette over Actions + Connectors, with drill-down, keyboard nav, and a connector multi-select. Interactive in presentation mode.">
            <SubGroup label="Actions root (interactive)">
              <CommandPalette presentation anchor={{ left: 0, top: 0, bottom: 0 }} onSelect={() => {}} onClose={() => {}} />
            </SubGroup>
            <SubGroup label="Opened on References (@)">
              <CommandPalette presentation initialScope="references" anchor={{ left: 0, top: 0, bottom: 0 }} onSelect={() => {}} onClose={() => {}} />
            </SubGroup>
          </Block>

          <Block name="BranchTypePicker" imp="flow01/condition/BranchTypePicker" desc="The two-option ELSE-IF / ELSE popover opened from a condition tag - palette chrome minus the search field.">
            <Row>
              <Stage hint="both options" tall>
                <div style={{ position: 'relative', marginTop: 20 }}>
                  <BranchTypePicker onPick={NOOP} onClose={NOOP} />
                </div>
              </Stage>
              <Stage hint="else-if only" tall>
                <div style={{ position: 'relative', marginTop: 20 }}>
                  <BranchTypePicker allowElse={false} onPick={NOOP} onClose={NOOP} />
                </div>
              </Stage>
            </Row>
          </Block>

          <Block name="CopilotProposal" imp="flow01/copilot/CopilotProposal" desc="The reviewable apply card - a concrete proposed change; Apply / Dismiss settle it to a compact confirmation.">
            <Row>
              <Spec label="open">
                <div style={{ width: 340 }}>
                  <CopilotProposal title="Add a fallback branch" summary={['Add an ELSE-IF arm for unmatched cases', 'Route those replies to a manager']} state="open" onApply={() => {}} onDismiss={() => {}} onUndo={() => {}} />
                </div>
              </Spec>
              <Spec label="applied">
                <div style={{ width: 340 }}>
                  <CopilotProposal title="Add a fallback branch" summary={['Add an ELSE-IF arm for unmatched cases']} state="applied" onApply={() => {}} onDismiss={() => {}} onUndo={() => {}} />
                </div>
              </Spec>
              <Spec label="dismissed">
                <div style={{ width: 340 }}>
                  <CopilotProposal title="Add a fallback branch" summary={['Add an ELSE-IF arm for unmatched cases']} state="dismissed" onApply={() => {}} onDismiss={() => {}} onUndo={() => {}} />
                </div>
              </Spec>
            </Row>
          </Block>

          <Block name="ActionHint" imp="flow01/ActionHint" desc="The quiet '@ for actions' pill that opens the actions palette below the first line.">
            <Row>
              <Spec label="default"><ActionHint /></Spec>
            </Row>
          </Block>

          <Block name="ChatBar" imp="flow01/ChatBar" desc="The 'Ask a question…' composer with a send -> 'Thinking…' -> idle loop (visual only).">
            <Row>
              <Spec label="resting"><div style={{ width: 460 }}><ChatBar /></div></Spec>
            </Row>
          </Block>

          <Block name="GmailBar" imp="flow01/GmailBar" desc="The host Gmail top-bar chrome (menu + logo) that wraps the AOP editor.">
            <Row>
              <Spec label="default"><div style={{ width: 520 }}><GmailBar /></div></Spec>
            </Row>
          </Block>

          <Block name="Picker" imp="surfaces/Picker" desc="The surfaces-level slash / @ / Cmd+K picker (action / ref / global scopes). It portals to the body and positions to the caret, so it is shown live in the editor rather than embedded here.">
            <div className={styles.linkRow}>
              <a className={styles.linkCard} href="/canvas">
                <span className={styles.linkCardTop}>
                  <span className={styles.linkCardName}>Slash / @ picker</span>
                  <span className={styles.linkCardRoute}>/canvas</span>
                </span>
                <p className={styles.linkCardDesc}>Type <code>/</code> in a step or <code>@</code> for a reference to open the live, caret-anchored picker.</p>
              </a>
            </div>
          </Block>
        </section>

        {/* ============================ CANVAS BLOCKS ============================ */}
        <section id="canvas" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Canvas blocks</h2>
            <span className={styles.categoryCount}>18</span>
          </div>
          <p className={styles.categoryNote}>The pieces that compose the editor document - tokens, step rows, the inspector rail tabs. Model-driven; fed minimal literal data here.</p>
          <div className={styles.categoryRule} />

          <Block name="Chip" imp="atoms/Chip" desc="The action-tag pill - one chrome over action / connector verbs, @-references, condition labels, the dashed placeholder, and the setup-needed state.">
            <SubGroup label="Action">
              <Spec label="verb only"><Chip chip={{ id: 'g1', actionId: 'tag', status: 'ok', config: {} }} /></Spec>
              <Spec label="verb + meta"><Chip chip={{ id: 'g2', actionId: 'ai_extract', status: 'ok', config: {} }} metaText="summary" /></Spec>
              <Spec label="connector"><Chip chip={{ id: 'g3', actionId: 'hubspot_get_contact', status: 'ok', config: {} }} /></Spec>
              <Spec label="slack · channel"><Chip chip={{ id: 'g4', actionId: 'slack_send_message', status: 'ok', config: {} }} metaText="#eng-support" /></Spec>
            </SubGroup>
            <SubGroup label="States">
              <Spec label="draft (unconfigured)"><Chip chip={{ id: 'g5', actionId: 'ai_extract', status: 'draft', config: {} }} metaText="summary" /></Spec>
              <Spec label="setup needed"><Chip chip={{ id: 'g6', actionId: 'hubspot_get_contact', status: 'ok', config: {} }} setupNeeded /></Spec>
            </SubGroup>
            <SubGroup label="Modes">
              <Spec label="@ reference"><Chip mode="ref" label="engg.hiver@grexit.com" /></Spec>
              <Spec label="condition · if"><Chip mode="condition" label="IF" /></Spec>
              <Spec label="condition · else"><Chip mode="condition" label="ELSE" subtle /></Spec>
              <Spec label="@ placeholder"><Chip mode="placeholder" /></Spec>
            </SubGroup>
          </Block>

          <Block name="FieldRef" imp="atoms/FieldRef" desc="An inline @-prefixed reference token for a field path, optionally clickable.">
            <Row>
              <Spec label="static"><FieldRef refPath="tour.name" /></Spec>
              <Spec label="clickable"><FieldRef refPath="tour.dates" onClick={() => {}} /></Spec>
              <Spec label="no prefix"><FieldRef refPath="customer.history" prefix={false} /></Spec>
            </Row>
          </Block>

          <Block name="GutterMarker" imp="atoms/GutterMarker" desc="The left-gutter index - a bullet for sections, a number for ordered steps.">
            <Row>
              <Spec label="section dot"><GutterMarker /></Spec>
              <Spec label="step 1"><GutterMarker n={1} /></Spec>
              <Spec label="step 2"><GutterMarker n={2} /></Spec>
              <Spec label="step 12"><GutterMarker n={12} /></Spec>
            </Row>
          </Block>

          <Block name="Fragments" imp="canvas/Fragments" desc="The rich-text renderer for a fragment array - turns text / chip / ref / code fragments into inline spans, Chips, FieldRefs, and code.">
            <Row>
              <Spec label="text + ref">
                <Fragments fragments={[{ kind: 'text', text: 'Email lands in ' }, { kind: 'ref', refPath: 'support@example.com' }]} refPrefix={false} />
              </Spec>
              <Spec label="text + chip + code">
                <Fragments fragments={[{ kind: 'text', text: 'If ' }, { kind: 'chip', chip: { id: 'c1', actionId: 'ai_extract', status: 'ok', config: {} } }, { kind: 'text', text: ' equals ' }, { kind: 'code', code: '"yes"' }]} onChipClick={() => {}} />
              </Spec>
            </Row>
          </Block>

          <Block name="EditorLine" imp="flow01/EditorLine" desc="One segmented token line (trigger or step body) - contentEditable text interleaved with atomic chip / ref / code tokens.">
            <Row>
              <Spec label="plain NL trigger">
                <div style={{ width: 440 }}>
                  <EditorLine fragments={[{ kind: 'text', text: 'When a refund is requested' }]} onChange={EDITABLE_NOOP} noActions ariaLabel="When should this AOP run" />
                </div>
              </Spec>
              <Spec label="text + ref token">
                <div style={{ width: 440 }}>
                  <EditorLine fragments={[{ kind: 'text', text: 'Email ' }, { kind: 'ref', refPath: 'ticket.requester' }, { kind: 'text', text: ' a confirmation' }]} onChange={EDITABLE_NOOP} />
                </div>
              </Spec>
            </Row>
          </Block>

          <Block name="Frontmatter" imp="canvas/Frontmatter" desc="The AOP header block - editable title, a WHEN trigger built from fragments, and a summary.">
            <div style={{ maxWidth: 720, border: '1px solid var(--hairline-soft)', borderRadius: 'var(--r-lg)', padding: '20px 8px', background: 'var(--card, #fff)' }}>
              <Frontmatter
                fm={{ name: 'Tour inquiry triage', summary: 'When an inquiry email lands, answer with availability, draft a follow-up if needed, and log the lead.', triggerFragments: [{ kind: 'text', text: 'Email lands in ' }, { kind: 'ref', refPath: 'support@example.com' }] }}
                onChange={() => {}}
              />
            </div>
          </Block>

          <Block name="StepRow" imp="canvas/StepRow" desc="A single numbered action step - contentEditable body of fragments, slash / @ handling, and a delete affordance.">
            <div style={{ maxWidth: 720 }}>
              <StepRow index={0} step={{ kind: 'action', id: 's1', fragments: [{ kind: 'text', text: 'Reply to the customer with ' }, { kind: 'chip', chip: { id: 'c1', actionId: 'draft_reply', status: 'ok', config: {} } }] }} onSlash={() => {}} onAt={() => {}} onChipClick={() => {}} onDelete={() => {}} />
              <StepRow index={1} step={{ kind: 'action', id: 's2', fragments: [{ kind: 'text', text: 'Then ' }, { kind: 'chip', chip: { id: 'c2', actionId: 'tag', status: 'draft', config: {} } }] }} onSlash={() => {}} onAt={() => {}} onChipClick={() => {}} onDelete={() => {}} />
            </div>
          </Block>

          <Block name="ConditionRow" imp="canvas/ConditionRow" desc="A branching CHECK step - a top-level expression plus IF / ELSE-IF / ELSE branches with per-branch expression and body.">
            <div style={{ maxWidth: 720 }}>
              <ConditionRow
                index={2}
                cond={{ kind: 'condition', id: 'cond1', exprFragments: [{ kind: 'text', text: 'order status' }], meta: '2 branches', branches: [{ id: 'b1', tag: 'if', exprFragments: [{ kind: 'text', text: 'is refunded' }], bodyFragments: [{ kind: 'text', text: 'Close the ticket' }] }, { id: 'b2', tag: 'else', exprFragments: [], bodyFragments: [{ kind: 'text', text: 'Escalate to a human' }] }] }}
                onAddBranch={() => {}}
                onChipClick={() => {}}
              />
            </div>
          </Block>

          <Block name="ApprovalStep" imp="canvas/ApprovalStep" desc="A human-approval step - an APPROVAL · FROM head and a contentEditable prompt body.">
            <div style={{ maxWidth: 720 }}>
              <ApprovalStep index={3} step={{ kind: 'approval', id: 'appr1', approverRefPath: 'manager@example.com', promptFragments: [{ kind: 'text', text: 'Approve this refund before it is issued.' }] }} onSlash={() => {}} onAt={() => {}} onChipClick={() => {}} />
            </div>
          </Block>

          <Block name="EndRow" imp="canvas/EndRow" desc="The terminal add-step CTA pinned to the bottom of the canvas.">
            <div style={{ maxWidth: 720 }}>
              <EndRow onClick={() => {}} />
            </div>
          </Block>

          <Block name="ConditionBlock" imp="flow01/condition/ConditionBlock" desc="The IF / ELSE-IF / ELSE authoring block - condition-chip tags + resizable fields and numbered body lines.">
            <div style={{ maxWidth: 640 }}>
              <ConditionBlock
                branches={[
                  { id: 'if', type: 'if', condition: [], lines: [{ id: 'if-l1', body: [] }] },
                  { id: 'ei', type: 'elseif', condition: [], lines: [{ id: 'ei-l1', body: [] }] },
                  { id: 'el', type: 'else', lines: [{ id: 'el-l1', body: [] }] },
                ]}
                onAddBranch={() => {}}
                onChangeBranchType={() => {}}
                onEditCondition={() => {}}
                onDeleteBranch={() => {}}
              />
            </div>
          </Block>

          <Block name="Jumplist" imp="canvas/Jumplist" desc="A hover-expanding side rail listing Setup + every step as a jump target. Hover to expand.">
            <Stage hint="hover to expand" tall>
              <div style={{ position: 'relative', height: 180 }}>
                <Jumplist
                  steps={[
                    { kind: 'action', id: 's1', fragments: [{ kind: 'chip', chip: { id: 'c1', actionId: 'ai_extract', status: 'ok', config: {} } }] },
                    { kind: 'condition', id: 'cond1', exprFragments: [], branches: [] },
                    { kind: 'approval', id: 'appr1', approverRefPath: 'manager@example.com', promptFragments: [] },
                    { kind: 'end', id: 'end1' },
                  ]}
                  onJump={() => {}}
                />
              </div>
            </Stage>
          </Block>

          <Block name="ValidationStrip" imp="canvas/ValidationStrip" desc="A strip surfacing the first validation issue with a '+N more' count and a Resolve affordance.">
            <Row>
              <Spec label="single issue">
                <div style={{ width: 440 }}>
                  <ValidationStrip issues={[{ rule: 'name-empty', message: 'Playbook name is required' }]} onResolve={() => {}} />
                </div>
              </Spec>
              <Spec label="multiple (+N more)">
                <div style={{ width: 440 }}>
                  <ValidationStrip issues={[{ rule: 'chip-unconfigured', message: '2 steps need configuration', targetId: 'c2' }, { rule: 'connector-unauthed', message: '1 connector not connected' }]} onResolve={() => {}} />
                </div>
              </Spec>
            </Row>
          </Block>

          <Block name="Rail · ConfigTab" imp="canvas/rail/ConfigTab" desc="The inspector Config tab - the selected chip's action, an editable key / value form, and its status pill.">
            <Row>
              <Spec label="empty state">
                <div className={styles.railFrame}><ConfigTab chip={null} onUpdateChip={() => {}} /></div>
              </Spec>
              <Spec label="selected chip">
                <div className={styles.railFrame}><ConfigTab chip={{ id: 'c1', actionId: 'ai_extract', status: 'draft', config: { from: 'email body', fields: 'order_id, intent' } }} onUpdateChip={() => {}} /></div>
              </Spec>
            </Row>
          </Block>

          <Block name="Rail · OutputTab" imp="canvas/rail/OutputTab" desc="The inspector Output tab - the mocked output for the selected chip's action.">
            <Row>
              <Spec label="empty"><div className={styles.railFrame}><OutputTab chip={null} /></div></Spec>
              <Spec label="selected chip"><div className={styles.railFrame}><OutputTab chip={{ id: 'c1', actionId: 'ai_extract', status: 'ok', config: {} }} /></div></Spec>
            </Row>
          </Block>

          <Block name="Rail · PlaybookTab" imp="canvas/rail/PlaybookTab" desc="The inspector Playbook tab - status, shared-mailbox toggles, connector readiness, recent runs.">
            <Row>
              <Spec label="active AOP">
                <div className={styles.railFrame}>
                  <PlaybookTab playbook={DEMO_PLAYBOOK} onSetBindingActive={() => {}} onOpenSetup={() => {}} />
                </div>
              </Spec>
            </Row>
          </Block>

          <Block name="Rail · RunTab" imp="canvas/rail/RunTab" desc="The inspector Runs tab - recent-runs placeholder plus an Estimated panel.">
            <Row>
              <Spec label="default"><div className={styles.railFrame}><RunTab playbook={DEMO_PLAYBOOK} /></div></Spec>
            </Row>
          </Block>

          <Block name="Rail · SetupMode" imp="canvas/rail/SetupMode" desc="The inspector connector-setup mode - a tile, Connect blurb, a mock-OAuth button, and a back link.">
            <Row>
              <Spec label="not connected">
                <div className={styles.railFrame}><SetupMode slug="shopify" authed={false} onConnect={() => {}} onClose={() => {}} /></div>
              </Spec>
              <Spec label="connected">
                <div className={styles.railFrame}><SetupMode slug="hubspot" authed authedLabel="your-team.hubspot.com" onConnect={() => {}} onClose={() => {}} /></div>
              </Spec>
            </Row>
          </Block>
        </section>

        {/* ============================ SIMULATE ============================ */}
        <section id="simulate" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Simulate</h2>
            <span className={styles.categoryCount}>17</span>
          </div>
          <p className={styles.categoryNote}>The Evaluate / test-run surface - status pills, scenario cards, the run trace, and the eval entry flows.</p>
          <div className={styles.categoryRule} />

          <Block name="StatusPill" imp="simulate/StatusPill" desc="Run-state pill on an email result card - animated dots for running, a colored dot + outcome label otherwise.">
            <Row>
              <Spec label="running"><StatusPill status="running" /></Spec>
              <Spec label="passed"><StatusPill status="passed" /></Spec>
              <Spec label="failed"><StatusPill status="failed" /></Spec>
              <Spec label="needs attention"><StatusPill status="attention" /></Spec>
            </Row>
          </Block>

          <Block name="SimStatus" imp="simulate/SimStatus" desc="The single colored-dot + label renderer for every simulate status.">
            <Row>
              <Spec label="idle"><SimStatus status="idle" label="no runs yet" /></Spec>
              <Spec label="passed"><SimStatus status="passed" label="Passed · 1 run" /></Spec>
              <Spec label="failed"><SimStatus status="failed" label="Failed · 2 runs" /></Spec>
              <Spec label="attention"><SimStatus status="attention" label="Needs attention · 1 run" /></Spec>
              <Spec label="running"><SimStatus status="running" label="Running…" /></Spec>
            </Row>
          </Block>

          <Block name="TopicCard" imp="simulate/TopicCard" desc="One AI-grouped scenario row - topic name, SimStatus, drill chevron on hover.">
            <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TopicCard topic={{ id: 't1', label: 'Refund requests', status: 'idle', runCount: 0, emails: [] }} onOpen={() => {}} />
              <TopicCard topic={{ id: 't2', label: 'Password resets', status: 'passed', runCount: 1, emails: [] }} onOpen={() => {}} />
              <TopicCard topic={{ id: 't3', label: 'Shipping delays', status: 'attention', runCount: 2, emails: [] }} onOpen={() => {}} />
            </div>
          </Block>

          <Block name="TopicHeader" imp="simulate/TopicHeader" desc="Drill-down header for a topic - back button, name, and rollup status.">
            <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TopicHeader topic={{ id: 't1', label: '404 errors', status: 'passed', runCount: 1, emails: [] }} onBack={() => {}} />
              <TopicHeader topic={{ id: 't2', label: 'Edge cases', status: 'attention', runCount: 1, emails: [] }} onBack={() => {}} />
            </div>
          </Block>

          <Block name="ScenarioList" imp="simulate/ScenarioList" desc="The stack of TopicCards in the Scenarios tab.">
            <div style={{ width: 360 }}>
              <ScenarioList topics={[{ id: 't1', label: '404 errors', status: 'passed', runCount: 1, emails: [] }, { id: 't2', label: 'Server errors', status: 'failed', runCount: 1, emails: [] }, { id: 't3', label: 'Edge cases', status: 'attention', runCount: 1, emails: [] }]} onOpenTopic={() => {}} />
            </div>
          </Block>

          <Block name="TraceStep" imp="simulate/TraceStep" desc="One execution step in a run trace - a status rail plus the shared Chip action-tag, with spring-in output.">
            <div style={{ width: 360 }}>
              <TraceStep step={SIM_TRACE[1]!} status="done" isLast={false} />
              <TraceStep step={SIM_TRACE[2]!} status="running" isLast={false} />
              <TraceStep step={SIM_TRACE[3]!} status="failed" isLast />
            </div>
          </Block>

          <Block name="RunTrace" imp="simulate/RunTrace" desc="The collapsible Trace section on an email card - the SIM_TRACE fixture keyed by status.">
            <Row>
              <Spec label="passed">
                <div style={{ width: 360 }}><RunTrace stepStatus={{ s1: 'done', s2: 'done', s3: 'done', s4: 'done', s5: 'done', s6: 'done' }} outcome="passed" /></div>
              </Spec>
              <Spec label="failed at KB">
                <div style={{ width: 360 }}><RunTrace stepStatus={{ s1: 'done', s2: 'done', s3: 'done', s4: 'failed', s5: 'skipped', s6: 'skipped' }} outcome="failed" /></div>
              </Spec>
            </Row>
          </Block>

          <Block name="RunOutcome" imp="simulate/RunOutcome" desc="The payoff above the trace - the drafted reply + a thumbs verdict, or the needs-attention / failure nudge.">
            <Row>
              <Spec label="passed"><div style={{ width: 360 }}><RunOutcome kind="passed" onVerdict={() => {}} /></div></Spec>
              <Spec label="attention"><div style={{ width: 360 }}><RunOutcome kind="attention" /></div></Spec>
              <Spec label="failed"><div style={{ width: 360 }}><RunOutcome kind="failed" /></div></Spec>
            </Row>
          </Block>

          <Block name="EmailCard" imp="simulate/EmailCard" desc="A bordered email card that grows a status pill + trace + outcome once a run is in flight; optional select mode.">
            <Row>
              <Spec label="static">
                <div style={{ width: 360 }}><EmailCard email={{ id: 'e1', sender: 'Maria Gomez', subject: '404 on the /v2/orders endpoint', preview: 'Since this morning every call to /v2/orders comes back 404 not found.' }} /></div>
              </Spec>
              <Spec label="selectable (checked)">
                <div style={{ width: 360 }}><EmailCard email={{ id: 'e2', sender: 'Liam Smith', subject: 'Trouble with my subscription payment', preview: 'My card was charged twice this month.' }} selectable selected onToggleSelect={() => {}} /></div>
              </Spec>
            </Row>
          </Block>

          <Block name="EmailList" imp="simulate/EmailList" desc="The stack of EmailCards inside a topic drill-down.">
            <div style={{ width: 360 }}>
              <EmailList emails={[{ id: 'e1', sender: 'Maria Gomez', subject: '404 on /v2/orders', preview: 'Every call comes back 404 not found.' }, { id: 'e2', sender: 'Devin Park', subject: 'Getting 404s after the v1.2.1 upgrade', preview: 'Webhook receiver returns 404 for routes that worked yesterday.' }]} />
            </div>
          </Block>

          <Block name="TestAllBar" imp="simulate/TestAllBar" desc="Pinned footer CTA - Test all emails / Stop test / Re-test all.">
            <Row>
              <Spec label="idle"><div style={{ width: 360 }}><TestAllBar mode="idle" onTestAll={() => {}} /></div></Spec>
              <Spec label="running"><div style={{ width: 360 }}><TestAllBar mode="running" onStop={() => {}} /></div></Spec>
              <Spec label="done"><div style={{ width: 360 }}><TestAllBar mode="done" onTestAll={() => {}} /></div></Spec>
            </Row>
          </Block>

          <Block name="EvalBackHeader" imp="simulate/EvalBackHeader" desc="Back-control + flow title header that replaces the tabs once a flow is entered.">
            <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <EvalBackHeader title="Recent conversations" onBack={() => {}} />
              <EvalBackHeader title="Custom email" onBack={() => {}} />
            </div>
          </Block>

          <Block name="EvalMenu" imp="simulate/EvalMenu" desc="The Evaluate root - three entry cards (Recent conversations / AI scenarios / Custom email).">
            <div style={{ width: 360 }}>
              <EvalMenu onOpen={() => {}} />
            </div>
          </Block>

          <Block name="ScenariosEmpty" imp="simulate/ScenariosEmpty" desc="The Scenarios empty state - faded ghost cards behind an icon and a light 'Add a trigger' action.">
            <Row>
              <Spec label="no trigger"><div style={{ width: 360 }}><ScenariosEmpty hasTrigger={false} onAddTrigger={() => {}} /></div></Spec>
              <Spec label="has trigger"><div style={{ width: 360 }}><ScenariosEmpty hasTrigger /></div></Spec>
            </Row>
          </Block>

          <Block name="SimEmptyState" imp="simulate/SimEmptyState" desc="The shared informative empty state - dimmed ghost preview, then an icon / headline / body / action.">
            <div style={{ width: 360 }}>
              <SimEmptyState
                icon={RiFlaskLine}
                title="No scenarios to simulate yet"
                body="Once your AOP has a trigger, Hiver AI groups real past emails into scenarios you can test here."
                ghosts={['Refund requests', 'Password resets', 'Shipping delays'].map((label, i) => (
                  <TopicCard key={label} topic={{ id: `g${i}`, label, status: 'idle', runCount: 0, emails: [] }} />
                ))}
              />
            </div>
          </Block>

          <Block name="CustomEval" imp="simulate/CustomEval" desc="The custom-email eval flow - compose a body, Send, and the result streams a run trace.">
            <div className={`${styles.frame} ${styles.col360}`} style={{ height: 460, display: 'flex', flexDirection: 'column' }}>
              <CustomEval />
            </div>
          </Block>

          <Block name="RecentEmails" imp="simulate/RecentEmails" desc="The recent-conversations flow - pick a mailbox, multi-select recent emails, Evaluate the checked ones.">
            <div className={`${styles.frame} ${styles.col360}`} style={{ height: 460, display: 'flex', flexDirection: 'column' }}>
              <RecentEmails onExit={() => {}} />
            </div>
          </Block>
        </section>

        {/* ============================ COMPOSED SCREENS ============================ */}
        <section id="screens" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Composed screens</h2>
            <span className={styles.categoryCount}>8</span>
          </div>
          <p className={styles.categoryNote}>Panels and full-screen assemblies. Panels are framed at their working size; full-viewport modals link to the live route where they take over the screen.</p>
          <div className={styles.categoryRule} />

          <Block name="Toolbar" imp="flow01/Toolbar" desc="The editor toolbar - back + editable title + status pill, Simulate toggle, settings gear, and one state-driven primary control.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 980 }}>
              <ToolbarDemo title="Untitled AOP" status="draft" />
              <ToolbarDemo title="Refund triage" status="draft" canEnable={false} />
              <ToolbarDemo title="Refund triage" status="active" />
              <ToolbarDemo title="Refund triage" status="paused" />
            </div>
          </Block>

          <Block name="CopilotPanel" imp="flow01/copilot/CopilotPanel" desc="The Copilot side panel - chat with an empty-state hero + starters, streaming replies, reviewable apply cards, and a Stop-while-busy composer.">
            <Row>
              <Spec label="empty hero">
                <div className={styles.panelFrame}>
                  <CopilotPanel docked open messages={[]} onClose={() => {}} onSend={() => {}} onStop={() => {}} onApplyProposal={() => {}} onDismissProposal={() => {}} onUndoProposal={() => {}} onVerdict={() => {}} />
                </div>
              </Spec>
              <Spec label="conversation">
                <div className={styles.panelFrame}>
                  <CopilotPanel docked open messages={[{ role: 'user', text: 'Add a step that checks the order status' }, { role: 'assistant', text: 'Added a step that looks up the order status before drafting the reply.' }]} onClose={() => {}} onSend={() => {}} onRegenerate={() => {}} onClear={() => {}} onStop={() => {}} onApplyProposal={() => {}} onDismissProposal={() => {}} onUndoProposal={() => {}} onVerdict={() => {}} />
                </div>
              </Spec>
            </Row>
          </Block>

          <Block name="SidePanel" imp="flow01/copilot/SidePanel" desc="The docked side panel - the Copilot | Evaluation header over two cross-fading panes.">
            <Row>
              <Spec label="copilot tab">
                <div className={`${styles.panelFrame} ${styles.panelFrameWide}`}>
                  <SidePanel tab="copilot" onTab={() => {}} copilot={{ messages: [], onSend: () => {}, onStop: () => {}, onApplyProposal: () => {}, onDismissProposal: () => {}, onUndoProposal: () => {}, onVerdict: () => {} }} sim={{ hasTrigger: true }} />
                </div>
              </Spec>
              <Spec label="evaluation tab">
                <div className={`${styles.panelFrame} ${styles.panelFrameWide}`}>
                  <SidePanel tab="simulate" onTab={() => {}} copilot={{ messages: [], onSend: () => {}, onStop: () => {}, onApplyProposal: () => {}, onDismissProposal: () => {}, onUndoProposal: () => {}, onVerdict: () => {} }} sim={{ hasTrigger: true }} />
                </div>
              </Spec>
            </Row>
          </Block>

          <Block name="Full-screen flows" imp="flow01/* · simulate/SimulatePanel" desc="Modals and full assemblies that take over the viewport - open them live.">
            <div className={styles.linkRow}>
              {[
                { name: 'EditorCanvas', route: '/canvas', imp: 'flow01/EditorCanvas', desc: 'The full AOP editor - title, steps, palette, docked Copilot / Evaluate panels.' },
                { name: 'ColdStartModal', route: '/canvas', imp: 'flow01/ColdStartModal', desc: 'The "Draft your AOP with AI" cold-start entry - describe field, starters, SOP upload.' },
                { name: 'ConnectorSetupModal', route: '/connector-setup', imp: 'flow01/setup/ConnectorSetupModal', desc: 'The connect flow - intro tools, paste a token, You’re connected.' },
                { name: 'EnableModal', route: '/api-example', imp: 'flow01/enable/EnableModal', desc: 'The go-live / manage modal - name + mailbox pick, then the success moment.' },
                { name: 'SimulatePanel', route: '/api-example', imp: 'simulate/SimulatePanel', desc: 'The floating Evaluate panel - the three eval flows over the run engine.' },
              ].map((s) => (
                <a key={s.name} className={styles.linkCard} href={s.route}>
                  <span className={styles.linkCardTop}>
                    <span className={styles.linkCardName}>{s.name}</span>
                    <span className={styles.linkCardRoute}>{s.route}</span>
                  </span>
                  <p className={styles.linkCardDesc}>{s.desc}</p>
                  <code className={styles.linkCardImport}>{s.imp}</code>
                </a>
              ))}
            </div>
          </Block>
        </section>

        {/* ============================ ICONS ============================ */}
        <section id="icons" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Icons</h2>
            <span className={styles.categoryCount}>4</span>
          </div>
          <p className={styles.categoryNote}>The icon sets - UI / verb / nav glyphs, field-type badges, full-color connector marks, and the Copilot sparkle.</p>
          <div className={styles.categoryRule} />

          <Block name="UI icons" imp="icons/ui" desc="UI, verb, and nav glyphs (mostly Remix re-exports; HiverBrandIcon + ExtractIcon are custom SVGs).">
            <IconGrid
              size={20}
              items={[
                ['DragIcon', DragIcon], ['KebabIcon', KebabIcon], ['SearchIcon', SearchIcon], ['SettingsIcon', SettingsIcon],
                ['SparkleIcon', SparkleIcon], ['PlayIcon', PlayIcon], ['InspectIcon', InspectIcon], ['HistoryIcon', HistoryIcon],
                ['CheckIcon', CheckIcon], ['XIcon', XIcon], ['EditIcon', EditIcon], ['HiverBrandIcon', HiverBrandIcon],
                ['SummarizeIcon', SummarizeIcon], ['KbIcon', KbIcon], ['DraftVerbIcon', DraftVerbIcon], ['NoteIcon', NoteIcon],
                ['TagIcon', TagIcon], ['AssignIcon', AssignIcon], ['ApprovalIcon', ApprovalIcon], ['WaitIcon', WaitIcon],
                ['EndIcon', EndIcon], ['HumanReviewIcon', HumanReviewIcon], ['BranchIcon', BranchIcon], ['AgentsIcon', AgentsIcon],
                ['CopilotIcon', CopilotIcon], ['AutopilotIcon', AutopilotIcon], ['ExtractIcon', ExtractIcon], ['ReplyIcon', ReplyIcon],
                ['HttpIcon', HttpIcon], ['BackIcon', BackIcon], ['ChevronLeftIcon', ChevronLeftIcon], ['ChevronRightIcon', ChevronRightIcon],
                ['ChevronDownIcon', ChevronDownIcon], ['PlusIcon', PlusIcon], ['InboxIcon', InboxIcon],
              ]}
            />
          </Block>

          <Block name="Field-type icons" imp="icons/fields" desc="The nine field-type badges, looked up by FieldType via FIELD_ICON.">
            <IconGrid
              size={18}
              items={[
                ['EmailIcon', EmailIcon], ['TextIcon', TextIcon], ['LongTextIcon', LongTextIcon], ['NumberIcon', NumberIcon],
                ['DateIcon', DateIcon], ['BoolIcon', BoolIcon], ['EnumIcon', EnumIcon], ['DocIcon', DocIcon], ['DraftIcon', DraftIcon],
              ]}
            />
          </Block>

          <Block name="Connector marks" imp="icons/connectors" desc="The five full-color third-party brand marks (real official paths, hardcoded fills), looked up via CONNECTOR_ICON.">
            <IconGrid
              size={28}
              items={[
                ['ShopifyIcon', ShopifyIcon], ['HubSpotIcon', HubSpotIcon], ['SlackIcon', SlackIcon],
                ['SalesforceIcon', SalesforceIcon], ['ClickUpIcon', ClickUpIcon],
              ]}
            />
          </Block>

          <Block name="CopilotSparkle" imp="flow01/copilot/CopilotSparkle" desc="The Copilot brand mark - the multi-stop AI gradient, or a flat currentColor stroke.">
            <Row>
              <Spec label="gradient"><CopilotSparkle size={28} /></Spec>
              <Spec label="flat"><CopilotSparkle size={28} tone="flat" /></Spec>
              <Spec label="flat · inherits"><span style={{ color: 'var(--primary)' }}><CopilotSparkle size={28} tone="flat" /></span></Spec>
            </Row>
          </Block>

          <Block name="Gmail mark" imp="icons/ui/GmailLogo" desc="The host Gmail brand mark for the top-bar chrome.">
            <Row>
              <Spec label="logo"><GmailLogo style={{ width: 26, height: 20 }} /></Spec>
              <Spec label="with wordmark">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <GmailLogo style={{ width: 26, height: 20 }} />
                  <span style={{ fontSize: 22, color: '#5f6368', fontWeight: 400, letterSpacing: '-0.01em' }}>Gmail</span>
                </span>
              </Spec>
            </Row>
          </Block>
        </section>
      </main>
    </div>
  );
}

// Icon specimen grid - one renderer for all icon sets.
function IconGrid({
  items,
  size,
}: {
  items: [string, ComponentType<SVGProps<SVGSVGElement>>][];
  size: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))', gap: 12, maxWidth: 880 }}>
      {items.map(([name, Icon]) => (
        <div
          key={name}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, padding: '14px 8px',
            border: '1px solid var(--hairline-soft)', borderRadius: 'var(--r-md)', background: 'var(--card, #fff)',
          }}
        >
          <Icon style={{ width: size, height: size }} aria-hidden />
          <span style={{ fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--muted-soft)', letterSpacing: 0 }}>{name}</span>
        </div>
      ))}
    </div>
  );
}
