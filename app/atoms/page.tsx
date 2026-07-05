'use client';

/* Component library - the ATOMS and reusable COMPONENTS used across the three
   journeys (/canvas, /api-example, /connector-setup). Building blocks only:
   full screens, panels, modals, and multi-step flows (EditorCanvas, the modals,
   CopilotPanel, SidePanel, SimulatePanel, CustomEval, RecentEmails) are excluded -
   those are seen live in the journeys. Each specimen renders the real component. */

import { useEffect, useRef, useState, type ReactNode, type ComponentType, type SVGProps, type CSSProperties } from 'react';
import {
  RiPlayLine,
  RiArrowDownSLine,
  RiArrowRightLine,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiArrowUpLine,
  RiFlaskLine,
} from 'react-icons/ri';

// Atoms
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Checkbox from '@/components/atoms/Checkbox';
import Chip from '@/components/atoms/Chip';
import Dropdown from '@/components/atoms/Dropdown';
import GutterMarker from '@/components/atoms/GutterMarker';
import Spinner from '@/components/atoms/Spinner';
import ThumbsRating, { type Verdict } from '@/components/atoms/ThumbsRating';

// Editor (flow-01)
import ActionHint from '@/components/flow01/ActionHint';
import GmailBar from '@/components/flow01/GmailBar';
import Toolbar from '@/components/flow01/Toolbar';
import TitleField from '@/components/flow01/TitleField';
import RowMenu from '@/components/flow01/RowMenu';
import EditorLine from '@/components/flow01/EditorLine';
import CommandPalette from '@/components/flow01/CommandPalette';
import BranchTypePicker from '@/components/flow01/condition/BranchTypePicker';
import ConditionBlock from '@/components/flow01/condition/ConditionBlock';

// Copilot
import CopilotSparkle from '@/components/flow01/copilot/CopilotSparkle';
import PanelTabs, { type SideTab } from '@/components/flow01/copilot/PanelTabs';
import CopilotProposal from '@/components/flow01/copilot/CopilotProposal';
import CopilotPanel from '@/components/flow01/copilot/CopilotPanel';
import SidePanel from '@/components/flow01/copilot/SidePanel';

// Modals - the signature entry / connect / go-live screens of the journeys
import ColdStartModal from '@/components/flow01/ColdStartModal';
import ConnectorSetupModal from '@/components/flow01/setup/ConnectorSetupModal';
import EnableModal from '@/components/flow01/enable/EnableModal';

// Evaluate (simulate)
import StatusPill from '@/components/simulate/StatusPill';
import SimStatus from '@/components/simulate/SimStatus';
import TopicCard from '@/components/simulate/TopicCard';
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
import { SIM_TRACE } from '@/components/simulate/traceFixture';

// Icons
import {
  DragIcon, KebabIcon, SearchIcon, SettingsIcon, SparkleIcon, PlayIcon, InspectIcon,
  HistoryIcon, CheckIcon, XIcon, EditIcon, HiverBrandIcon, SummarizeIcon, KbIcon,
  DraftVerbIcon, NoteIcon, TagIcon, AssignIcon, ApprovalIcon, WaitIcon, EndIcon,
  HumanReviewIcon, BranchIcon, AgentsIcon, CopilotIcon, AutopilotIcon, ExtractIcon,
  ReplyIcon, HttpIcon, BackIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon,
  PlusIcon, InboxIcon,
} from '@/components/icons/ui';
import {
  ShopifyIcon, HubSpotIcon, SlackIcon, SalesforceIcon, ClickUpIcon,
} from '@/components/icons/connectors';

import styles from './page.module.css';

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

function Block({ name, imp, desc, children }: { name: string; imp: string; desc: string; children: ReactNode }) {
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

function Stage({ hint, tall, children }: { hint?: string; tall?: boolean; children: ReactNode }) {
  return (
    <div className={`${styles.stage} ${tall ? styles.stageTall : ''}`}>
      {hint && <span className={styles.stageHint}>{hint}</span>}
      {children}
    </div>
  );
}

// Icon specimen grid - one renderer for all icon sets.
function IconGrid({ items, size }: { items: [string, ComponentType<SVGProps<SVGSVGElement>>][]; size: number }) {
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

// ----------------------------------------------------------------------------
// Stateful demo wrappers (controlled components need a host that owns state)
// ----------------------------------------------------------------------------

function DropdownDemo({ options, initial, placeholder, ariaLabel }: { options: { id: string; label: string }[]; initial: string; placeholder?: string; ariaLabel?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div style={{ width: 200 }}>
      <Dropdown options={options} value={value} onChange={setValue} placeholder={placeholder} ariaLabel={ariaLabel} />
    </div>
  );
}

function ThumbsDemo({ initial }: { initial?: Verdict }) {
  const [verdict, setVerdict] = useState<Verdict | undefined>(initial);
  return <ThumbsRating verdict={verdict} onVerdict={setVerdict} />;
}

function TitleFieldDemo({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
      <TitleField value={value} onChange={setValue} />
    </span>
  );
}

function ToolbarDemo({ title, status, canEnable }: { title: string; status: 'draft' | 'active' | 'paused'; canEnable?: boolean }) {
  const [t, setT] = useState(title);
  // The journeys mount the editor with companions, so the toolbar hides Simulate
  // (the docked SidePanel owns it). Match that here.
  return (
    <Toolbar
      title={t}
      onTitleChange={setT}
      status={status}
      canEnable={canEnable}
      hideSimulate
      onEnable={() => {}}
      onPause={() => {}}
      onResume={() => {}}
      onSettings={() => {}}
      onBack={() => {}}
    />
  );
}

function EnableModalDemo() {
  const [name, setName] = useState('API error triage');
  const [selected, setSelected] = useState<string[]>(['support', 'sales']);
  return (
    <div className={styles.modalStage} style={{ height: 900 }}>
      <EnableModal
        open
        mode="commit"
        name={name}
        onNameChange={setName}
        selected={selected}
        onSelectedChange={setSelected}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    </div>
  );
}

const glowFieldStyle: CSSProperties = {
  position: 'relative',
  width: 420,
  borderRadius: 12,
  border: '1px solid var(--hairline)',
  background: 'var(--card, #fff)',
  padding: '14px 16px',
  minHeight: 80,
};

// The glow held lit, so it's always visible (in product it plays once then fades).
function GlowLit() {
  return (
    <div className={styles.glowLit}>
      <div className="ai-input-glow" style={glowFieldStyle}>
        <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-body)' }}>Describe what you want your AOP to do…</span>
      </div>
    </div>
  );
}

// The real one-shot animation. It ends at opacity 0, so we re-trigger it (remount
// via key) when it scrolls into view, plus a Replay button.
function GlowAnimated() {
  const [playId, setPlayId] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) setPlayId((p) => p + 1); },
      { threshold: 0.55 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div key={playId} className="ai-input-glow" style={glowFieldStyle}>
        <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-body)' }}>Describe what you want your AOP to do…</span>
      </div>
      <span><Button variant="secondary" onClick={() => setPlayId((p) => p + 1)}>Replay</Button></span>
    </div>
  );
}

function PanelTabsDemo({ initial }: { initial: SideTab }) {
  const [activeTab, setActiveTab] = useState<SideTab>(initial);
  return (
    <div style={{ width: 360 }}>
      <PanelTabs active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

const EDITABLE_NOOP = () => {};
// Stable no-op: BranchTypePicker's focus effect keys on [onClose], so an inline
// arrow would re-run it (and re-steal focus) on every render.
const NOOP = () => {};

// ----------------------------------------------------------------------------
// Nav + scroll-spy
// ----------------------------------------------------------------------------

const NAV: { id: string; label: string; count: number }[] = [
  { id: 'atoms', label: 'Atoms', count: 8 },
  { id: 'editor', label: 'Editor', count: 9 },
  { id: 'copilot', label: 'Copilot', count: 5 },
  { id: 'evaluate', label: 'Evaluate', count: 14 },
  { id: 'modals', label: 'Modals', count: 4 },
  { id: 'icons', label: 'Icons', count: 2 },
];
const NAV_IDS = NAV.map((n) => n.id);

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

export default function ComponentLibrary() {
  const active = useScrollSpy(NAV_IDS);
  const total = NAV.reduce((s, n) => s + n.count, 0);

  // CommandPalette and BranchTypePicker focus an input on mount, which would yank
  // this long page down on load. During the brief load window we make every focus()
  // non-scrolling, so the viewer stays at the top. Restored after 1.5s.
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
              <button type="button" className={styles.navLink} data-active={active === n.id} onClick={() => go(n.id)}>
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
            Every component you see across the three journeys -{' '}
            <a href="/canvas">/canvas</a>, <a href="/api-example">/api-example</a>, and{' '}
            <a href="/connector-setup">/connector-setup</a> - rendered from the real code: the
            cold-start modal with its AI-glow input, the Copilot window, the editor, the run
            trace, and the connect / go-live modals.
          </p>
          <div className={styles.headMeta}>
            <span>{total} components</span>
            <span>{NAV.length} groups</span>
            <span>3 journeys</span>
          </div>
        </header>

        {/* ============================ ATOMS ============================ */}
        <section id="atoms" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Atoms</h2>
            <span className={styles.categoryCount}>8</span>
          </div>
          <p className={styles.categoryNote}>The leaf primitives the journeys build on.</p>
          <div className={styles.categoryRule} />

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
              <Spec label="disabled"><Button variant="primary" disabled iconRight={<RiArrowDownSLine />}>Activate</Button></Spec>
            </SubGroup>
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

          <Block name="Dropdown" imp="atoms/Dropdown" desc="A design-language select: trigger plus a keyboard-navigable listbox, closes on outside-click / Esc.">
            <Row>
              <Spec label="tone select"><DropdownDemo initial="friendly" ariaLabel="Tone" options={[{ id: 'formal', label: 'Formal' }, { id: 'friendly', label: 'Friendly' }, { id: 'concise', label: 'Concise' }]} /></Spec>
              <Spec label="empty placeholder"><DropdownDemo initial="" placeholder="Select an option" options={[{ id: 'a', label: 'Option A' }, { id: 'b', label: 'Option B' }]} /></Spec>
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

          <Block name="Spinner" imp="atoms/Spinner" desc="A rotating loader for in-progress states.">
            <Row>
              <Spec label="14"><Spinner size={14} /></Spec>
              <Spec label="16"><Spinner size={16} /></Spec>
              <Spec label="20"><Spinner size={20} /></Spec>
              <Spec label="in button"><Button variant="secondary" iconLeft={<Spinner size={16} />}>Running</Button></Spec>
            </Row>
          </Block>

          <Block name="ThumbsRating" imp="atoms/ThumbsRating" desc="The single 'rate this' renderer - icon-only up / down verdict; the consumer owns the value.">
            <Row>
              <Spec label="unrated"><ThumbsDemo /></Spec>
              <Spec label="thumbs up"><ThumbsDemo initial="up" /></Spec>
              <Spec label="thumbs down"><ThumbsDemo initial="down" /></Spec>
            </Row>
          </Block>
        </section>

        {/* ============================ EDITOR ============================ */}
        <section id="editor" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Editor</h2>
            <span className={styles.categoryCount}>9</span>
          </div>
          <p className={styles.categoryNote}>The flow-01 authoring surface - chrome, the token line, the insert palette, and conditions.</p>
          <div className={styles.categoryRule} />

          <Block name="TitleField" imp="flow01/TitleField" desc="The editable AOP title - a content-sized contentEditable with a 'name me' dotted underline while unnamed.">
            <Row>
              <Spec label="named"><TitleFieldDemo initial="Refund triage" /></Spec>
              <Spec label="unnamed (name-me)"><TitleFieldDemo initial="Untitled AOP" /></Spec>
            </Row>
          </Block>

          <Block name="Toolbar" imp="flow01/Toolbar" desc="The editor toolbar as the journeys show it - back + editable title + status pill, the settings gear, and one state-driven control (Enable / Pause / Resume). Simulate is hidden (the docked panel owns it).">

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 980 }}>
              <ToolbarDemo title="Untitled AOP" status="draft" />
              <ToolbarDemo title="Refund triage" status="draft" canEnable={false} />
              <ToolbarDemo title="Refund triage" status="active" />
              <ToolbarDemo title="Refund triage" status="paused" />
            </div>
          </Block>

          <Block name="GmailBar" imp="flow01/GmailBar" desc="The host Gmail top-bar chrome (menu + logo) that wraps the AOP editor.">
            <Row>
              <Spec label="default"><div style={{ width: 520 }}><GmailBar /></div></Spec>
            </Row>
          </Block>

          <Block name="ActionHint" imp="flow01/ActionHint" desc="The quiet '@ for actions' pill that opens the actions palette below the first line.">
            <Row>
              <Spec label="default"><ActionHint /></Spec>
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

          <Block name="CommandPalette" imp="flow01/CommandPalette" desc="The slash / @ insert palette over Actions + Connectors, with drill-down, keyboard nav, and a connector multi-select. Interactive in presentation mode.">
            <SubGroup label="Actions root (interactive)">
              <CommandPalette presentation anchor={{ left: 0, top: 0, bottom: 0 }} onSelect={() => {}} onClose={() => {}} />
            </SubGroup>
            <SubGroup label="Opened on References (@)">
              <CommandPalette presentation initialScope="references" anchor={{ left: 0, top: 0, bottom: 0 }} onSelect={() => {}} onClose={() => {}} />
            </SubGroup>
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
        </section>

        {/* ============================ COPILOT ============================ */}
        <section id="copilot" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Copilot</h2>
            <span className={styles.categoryCount}>5</span>
          </div>
          <p className={styles.categoryNote}>The Copilot window from /canvas and /api-example - the docked panel, the chat with its AI-glow composer, the tab switcher, the apply card, and the brand mark.</p>
          <div className={styles.categoryRule} />

          <Block name="SidePanel" imp="flow01/copilot/SidePanel" desc="The docked Copilot window - the Copilot | Evaluation header over two cross-fading panes (the right-hand panel in /canvas and /api-example).">
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

          <Block name="CopilotPanel" imp="flow01/copilot/CopilotPanel" desc="The Copilot chat - the empty-state hero + starters with the AI-glow composer, and a populated conversation with reviewable apply cards.">
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

          <Block name="PanelTabs" imp="flow01/copilot/PanelTabs" desc="The side-panel Copilot | Evaluation switcher with a sliding active underline.">
            <Row>
              <Spec label="copilot active"><PanelTabsDemo initial="copilot" /></Spec>
              <Spec label="evaluation active"><PanelTabsDemo initial="simulate" /></Spec>
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

          <Block name="CopilotSparkle" imp="flow01/copilot/CopilotSparkle" desc="The Copilot brand mark - the multi-stop AI gradient, or a flat currentColor stroke.">
            <Row>
              <Spec label="gradient"><CopilotSparkle size={28} /></Spec>
              <Spec label="flat"><CopilotSparkle size={28} tone="flat" /></Spec>
              <Spec label="flat · inherits"><span style={{ color: 'var(--primary)' }}><CopilotSparkle size={28} tone="flat" /></span></Spec>
            </Row>
          </Block>
        </section>

        {/* ============================ EVALUATE ============================ */}
        <section id="evaluate" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Evaluate</h2>
            <span className={styles.categoryCount}>14</span>
          </div>
          <p className={styles.categoryNote}>The test-run building blocks - status pills, scenario cards, the run trace, and the eval entry pieces.</p>
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
        </section>

        {/* ============================ MODALS ============================ */}
        <section id="modals" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Modals</h2>
            <span className={styles.categoryCount}>4</span>
          </div>
          <p className={styles.categoryNote}>The AI-glow input and the full-screen moment of each journey, rendered from the real code (contained here; live they take over the viewport).</p>
          <div className={styles.categoryRule} />

          <Block name="AI input glow" imp="globals.css · .ai-input-glow" desc="The shared Hiver-AI glow on the describe input and the Copilot composer - a conic ring + soft halo. In product it plays once on appear then fades to the neutral border (and is off under reduced motion); here it's held lit so you can see it, with the real play-then-fade alongside.">
            <Row>
              <Spec label="lit (the glow)"><GlowLit /></Spec>
              <Spec label="play-then-fade (tap Replay)"><GlowAnimated /></Spec>
            </Row>
          </Block>

          <Block name="ColdStartModal" imp="flow01/ColdStartModal" desc="The /canvas entry - 'Draft your AOP with AI': the describe input with its AI glow, generic starters, and an SOP upload drop target.">
            <div className={styles.modalStage} style={{ height: 540 }}>
              <ColdStartModal onGenerate={() => {}} onDismiss={() => {}} />
            </div>
          </Block>

          <Block name="EnableModal" imp="flow01/enable/EnableModal" desc="The /api-example go-live - name the AOP and pick the shared mailboxes (tag-owning ones pre-selected), then the success moment.">
            <EnableModalDemo />
          </Block>

          <Block name="ConnectorSetupModal" imp="flow01/setup/ConnectorSetupModal" desc="The /connector-setup connect flow - intro tools, paste a token, then you're connected. Resizes between phases.">
            <div className={styles.modalStage} style={{ height: 440 }}>
              <ConnectorSetupModal connector="shopify" onConnected={() => {}} onClose={() => {}} />
            </div>
          </Block>
        </section>

        {/* ============================ ICONS ============================ */}
        <section id="icons" className={styles.category}>
          <div className={styles.categoryHead}>
            <h2>Icons</h2>
            <span className={styles.categoryCount}>2</span>
          </div>
          <p className={styles.categoryNote}>The icon sets the journeys pull in - UI / verb / nav glyphs and the full-color connector marks.</p>
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

          <Block name="Connector marks" imp="icons/connectors" desc="The five full-color third-party brand marks (real official paths, hardcoded fills), looked up via CONNECTOR_ICON.">
            <IconGrid
              size={28}
              items={[
                ['ShopifyIcon', ShopifyIcon], ['HubSpotIcon', HubSpotIcon], ['SlackIcon', SlackIcon],
                ['SalesforceIcon', SalesforceIcon], ['ClickUpIcon', ClickUpIcon],
              ]}
            />
          </Block>
        </section>
      </main>
    </div>
  );
}
