'use client';

import type { ReactNode } from 'react';
import {
  RiPlayLine,
  RiArrowDownSLine,
  RiArrowRightLine,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiArrowUpLine,
  RiSearchLine,
  RiCloseLine,
} from 'react-icons/ri';
import Chip from '@/components/atoms/Chip';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Checkbox from '@/components/atoms/Checkbox';
import Spinner from '@/components/atoms/Spinner';
import Badge from '@/components/atoms/Badge';
import Avatar from '@/components/atoms/Avatar';
import Tooltip from '@/components/atoms/Tooltip';
import Textarea from '@/components/atoms/Textarea';
import GutterMarker from '@/components/atoms/GutterMarker';
import { GmailLogo } from '@/components/icons/ui/GmailLogo';
import CommandPalette from '@/components/flow01/CommandPalette';
import type { Chip as ChipModel } from '@/types/playbook';
import styles from './page.module.css';

// Component review surface. Components reviewed in isolation, one at a time,
// before assembly into Canvas 360. The live editor is at /canvas.

type Variant = {
  k: string;
  label: string;
  chip?: ChipModel;
  meta?: string;
  mode?: 'action' | 'ref' | 'condition';
  value?: string;
  setupNeeded?: boolean;
};

function mk(id: string, actionId: string, status: ChipModel['status'] = 'ok'): ChipModel {
  return { id, actionId, status, config: {} };
}

// ---- Action-tag (chip) — full Figma spec (component 241:16557) ----
const VERB_ONLY: Variant[] = [
  { k: 'tag0', label: 'verb only', chip: mk('g-tag-bare', 'tag') },
  { k: 'assign', label: 'verb only', chip: mk('g-assign', 'assign') },
  { k: 'status', label: 'verb only', chip: mk('g-status', 'change_status') },
];
const VERB_META: Variant[] = [
  { k: 'ai', label: 'AI Extract · meta', chip: mk('g-ai', 'ai_extract'), meta: 'summary' },
  { k: 'kb', label: 'Search knowledge · meta', chip: mk('g-kb', 'kb_search'), meta: 'Engg-docs' },
  { k: 'draft', label: 'Draft Reply · meta', chip: mk('g-draft', 'draft_reply'), meta: 'draft' },
  { k: 'send', label: 'Send reply · meta', chip: mk('g-send', 'send_reply'), meta: 'Hiver' },
  { k: 'tagm', label: 'Tag · meta', chip: mk('g-tag', 'tag'), meta: 'api-error, support' },
  { k: 'wait', label: 'Wait · meta', chip: mk('g-wait', 'wait'), meta: '1 business hour' },
];
const CONNECTOR: Variant[] = [
  { k: 'hs', label: 'HubSpot · verb · meta', chip: mk('g-hs', 'hubspot_get_contact'), meta: 'contact, company association' },
  { k: 'shop', label: 'Shopify · verb · meta', chip: mk('g-shop', 'shopify_get_order'), meta: 'by order #' },
  { k: 'slack', label: 'Slack · verb · meta', chip: mk('g-slack', 'slack_send_message'), meta: '#eng-support' },
  { k: 'sf', label: 'Salesforce · verb · meta', chip: mk('g-sf', 'salesforce_get_account'), meta: 'by account name' },
  { k: 'cu', label: 'ClickUp · verb · meta', chip: mk('g-cu', 'clickup_get_task'), meta: 'by task id' },
];
const REFERENCE: Variant[] = [
  { k: 'ref1', label: '@ email', mode: 'ref', value: 'engg.hiver@grexit.com' },
  { k: 'ref2', label: '@ field', mode: 'ref', value: 'order.id' },
  { k: 'ref3', label: '@ step output', mode: 'ref', value: 'step 3 · summary' },
];
const CONDITION: Variant[] = [
  { k: 'if', label: 'if', mode: 'condition', value: 'IF' },
  { k: 'elif', label: 'else-if', mode: 'condition', value: 'ELSE-IF' },
  { k: 'else', label: 'else', mode: 'condition', value: 'ELSE' },
  { k: 'undec', label: 'undecided', mode: 'condition', value: 'CONDITION' },
];
const STATES: Variant[] = [
  { k: 's-ok', label: 'ok (rest)', chip: mk('g-s1', 'ai_extract'), meta: 'summary' },
  { k: 's-draft', label: 'draft (unconfigured)', chip: mk('g-s2', 'ai_extract', 'draft'), meta: 'summary' },
  { k: 's-setup', label: 'connector · setup needed', chip: mk('g-s3', 'hubspot_get_contact'), setupNeeded: true },
];

function Cell({ v }: { v: Variant }) {
  return (
    <div className={styles.cell}>
      <div className={styles.cellBody}>
        <Chip chip={v.chip} metaText={v.meta} mode={v.mode} label={v.value} setupNeeded={v.setupNeeded} />
      </div>
      <span className={styles.cellLabel}>{v.label}</span>
    </div>
  );
}

// Generic specimen cell for any component.
function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.cell}>
      <div className={styles.cellBody}>{children}</div>
      <span className={styles.cellLabel}>{label}</span>
    </div>
  );
}

function Group({ label, variants }: { label: string; variants: Variant[] }) {
  return (
    <div className={styles.group}>
      <p className={styles.groupLabel}>{label}</p>
      <div className={styles.row}>
        {variants.map((v) => (
          <Cell key={v.k} v={v} />
        ))}
      </div>
    </div>
  );
}

export default function ComponentsReview() {
  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1>Components</h1>
        <p>
          Each component reviewed in isolation, then assembled into the live editor at{' '}
          <a href="/canvas">/canvas</a>.
        </p>
      </header>

      {/* Action-tag (chip) */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Action-tag (chip)</h2>
          <span className={styles.status}>reconciled to Figma 241:16557</span>
        </div>
        <Group label="Verb only" variants={VERB_ONLY} />
        <Group label="Verb + meta" variants={VERB_META} />
        <Group label="Brand + verb + meta (connector)" variants={CONNECTOR} />
        <Group label="Reference (@)" variants={REFERENCE} />
        <Group label="Condition / flow" variants={CONDITION} />
        <Group label="States" variants={STATES} />
      </section>

      {/* Button */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Button</h2>
          <span className={styles.status}>reconciled to Figma 211:19456 / 19749 / 20709</span>
        </div>
        <div className={styles.group}>
          <p className={styles.groupLabel}>Variants</p>
          <div className={styles.row}>
            <Specimen label="primary"><Button variant="primary">Activate</Button></Specimen>
            <Specimen label="secondary"><Button variant="secondary">Simulate</Button></Specimen>
            <Specimen label="tertiary"><Button variant="tertiary">Edit</Button></Specimen>
            <Specimen label="text"><Button variant="text">Learn more</Button></Specimen>
          </div>
        </div>
        <div className={styles.group}>
          <p className={styles.groupLabel}>With icon</p>
          <div className={styles.row}>
            <Specimen label="icon left"><Button variant="secondary" iconLeft={<RiPlayLine />}>Simulate</Button></Specimen>
            <Specimen label="icon right"><Button variant="primary" iconRight={<RiArrowDownSLine />}>Activate</Button></Specimen>
            <Specimen label="continue"><Button variant="primary" iconRight={<RiArrowRightLine />}>Continue</Button></Specimen>
            <Specimen label="icon only · undo"><Button variant="tertiary" iconOnly={<RiArrowGoBackLine />} ariaLabel="Undo" /></Specimen>
            <Specimen label="icon only · redo"><Button variant="tertiary" iconOnly={<RiArrowGoForwardLine />} ariaLabel="Redo" /></Specimen>
            <Specimen label="pill · send"><Button variant="primary" pill iconOnly={<RiArrowUpLine />} ariaLabel="Send" /></Specimen>
          </div>
        </div>
        <div className={styles.group}>
          <p className={styles.groupLabel}>States</p>
          <div className={styles.row}>
            <Specimen label="default"><Button variant="primary">Activate</Button></Specimen>
            <Specimen label="primary · disabled"><Button variant="primary" disabled iconRight={<RiArrowDownSLine />}>Activate</Button></Specimen>
            <Specimen label="secondary · disabled"><Button variant="secondary" disabled>Simulate</Button></Specimen>
          </div>
        </div>
      </section>

      {/* Input */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Input</h2>
          <span className={styles.status}>reconciled to Figma 258:21645</span>
        </div>
        <div className={styles.group}>
          <p className={styles.groupLabel}>Variants</p>
          <div className={styles.row}>
            <Specimen label="placeholder"><div style={{ width: 260 }}><Input placeholder="ask a question..." /></div></Specimen>
            <Specimen label="filled"><div style={{ width: 260 }}><Input defaultValue="engineering domain" /></div></Specimen>
            <Specimen label="select"><div style={{ width: 260 }}><Input placeholder="Select tone" readOnly suffix={<RiArrowDownSLine />} /></div></Specimen>
            <Specimen label="search"><div style={{ width: 260 }}><Input placeholder="search actions, connectors..." prefixIcon={<RiSearchLine />} /></div></Specimen>
          </div>
        </div>
        <div className={styles.group}>
          <p className={styles.groupLabel}>States</p>
          <div className={styles.row}>
            <Specimen label="rest"><div style={{ width: 260 }}><Input placeholder="placeholder" /></div></Specimen>
            <Specimen label="error"><div style={{ width: 260 }}><Input defaultValue="bad value" error suffix={<RiCloseLine />} /></div></Specimen>
            <Specimen label="disabled"><div style={{ width: 260 }}><Input placeholder="disabled" disabled /></div></Specimen>
          </div>
        </div>
      </section>

      {/* Checkbox & Spinner */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Checkbox &amp; Spinner</h2>
          <span className={styles.status}>reconciled to Figma 211:21186 / 211:19472</span>
        </div>
        <div className={styles.group}>
          <p className={styles.groupLabel}>Checkbox</p>
          <div className={styles.row}>
            <Specimen label="unchecked"><Checkbox /></Specimen>
            <Specimen label="checked"><Checkbox checked /></Specimen>
            <Specimen label="indeterminate"><Checkbox indeterminate /></Specimen>
            <Specimen label="disabled"><Checkbox disabled /></Specimen>
            <Specimen label="disabled · checked"><Checkbox checked disabled /></Specimen>
          </div>
        </div>
        <div className={styles.group}>
          <p className={styles.groupLabel}>Spinner</p>
          <div className={styles.row}>
            <Specimen label="14"><Spinner size={14} /></Specimen>
            <Specimen label="16"><Spinner size={16} /></Specimen>
            <Specimen label="20"><Spinner size={20} /></Specimen>
            <Specimen label="in button"><Button variant="secondary" iconLeft={<Spinner size={16} />}>Running</Button></Specimen>
          </div>
        </div>
      </section>

      {/* Badge & Avatar */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Badge &amp; Avatar</h2>
          <span className={styles.status}>reconciled to Figma 258:21962 / 211:24039</span>
        </div>
        <div className={styles.group}>
          <p className={styles.groupLabel}>Badge</p>
          <div className={styles.row}>
            <Specimen label="neutral"><Badge>+3</Badge></Specimen>
            <Specimen label="success"><Badge intent="success">Passed</Badge></Specimen>
            <Specimen label="running"><Badge intent="running">Running</Badge></Specimen>
            <Specimen label="warning"><Badge intent="warning">Pending</Badge></Specimen>
            <Specimen label="error"><Badge intent="error">404 errors</Badge></Specimen>
          </div>
        </div>
        <div className={styles.group}>
          <p className={styles.groupLabel}>Avatar</p>
          <div className={styles.row}>
            <Specimen label="initials"><Avatar initials="K" color="#8789C5" /></Specimen>
            <Specimen label="online"><Avatar initials="A" color="#6FA974" online /></Specimen>
            <Specimen label="size 32"><Avatar initials="M" color="#D97757" size={32} /></Specimen>
            <Specimen label="stacked + count">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ display: 'flex' }}>
                  {['#8789C5', '#6FA974', '#D97757'].map((c, i) => (
                    <span
                      key={c}
                      style={{ marginLeft: i ? -6 : 0, boxShadow: '0 0 0 1.5px #fff', borderRadius: '50%' }}
                    >
                      <Avatar initials={['K', 'A', 'M'][i]} color={c} />
                    </span>
                  ))}
                </span>
                <span style={{ marginLeft: 6 }}><Badge>+3</Badge></span>
              </div>
            </Specimen>
          </div>
        </div>
      </section>

      {/* Tooltip */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Tooltip</h2>
          <span className={styles.status}>Figma 258:21951 (trigger); bubble = app dark-bubble convention</span>
        </div>
        <div className={styles.group}>
          <p className={styles.groupLabel}>Default trigger (info icon) · sides</p>
          <div className={styles.row}>
            <Specimen label="top"><Tooltip side="top" content="Runs when a new email lands in this mailbox." /></Specimen>
            <Specimen label="bottom"><Tooltip side="bottom" content="Runs when a new email lands in this mailbox." /></Specimen>
            <Specimen label="left"><Tooltip side="left" content="Output of step 3." /></Specimen>
            <Specimen label="right"><Tooltip side="right" content="Output of step 3." /></Specimen>
          </div>
        </div>
        <div className={styles.group}>
          <p className={styles.groupLabel}>Custom trigger</p>
          <div className={styles.row}>
            <Specimen label="on a button">
              <Tooltip content="Simulate this procedure against a test email." side="top">
                <Button variant="secondary" iconLeft={<RiPlayLine />}>Simulate</Button>
              </Tooltip>
            </Specimen>
            <Specimen label="on a chip">
              <Tooltip content="This connector needs to be set up before the procedure can run." side="top">
                <Chip chip={mk('tt-chip', 'hubspot_get_contact')} setupNeeded />
              </Tooltip>
            </Specimen>
            <Specimen label="rich content">
              <Tooltip
                side="top"
                content={
                  <span>
                    Press <strong>Cmd K</strong> to open the command palette.
                  </span>
                }
              >
                <Button variant="tertiary">Shortcut</Button>
              </Tooltip>
            </Specimen>
          </div>
        </div>
      </section>

      {/* Flow-01 atoms — the leaf units that compose screen 256:2880 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Flow-01 atoms</h2>
          <span className={styles.status}>leaf units for screen 256:2880 (trigger / step / toolbar / chat)</span>
        </div>

        <div className={styles.group}>
          <p className={styles.groupLabel}>Textarea — trigger field (256:2895)</p>
          <div className={styles.row}>
            <Specimen label="placeholder">
              <div style={{ width: 440 }}>
                <Textarea placeholder="Describe briefly when this procedure is to be run" />
              </div>
            </Specimen>
            <Specimen label="+ corner info">
              <div style={{ width: 440 }}>
                <Textarea
                  placeholder="Describe briefly when this procedure is to be run"
                  info="The procedure runs whenever an email matches this description."
                />
              </div>
            </Specimen>
          </div>
          <div className={styles.row}>
            <Specimen label="filled (auto-grow)">
              <div style={{ width: 440 }}>
                <Textarea defaultValue="engineering domain with some kind of error or api status issue that needs triaging before a reply goes out" />
              </div>
            </Specimen>
            <Specimen label="disabled">
              <div style={{ width: 440 }}>
                <Textarea placeholder="Describe briefly when this procedure is to be run" disabled />
              </div>
            </Specimen>
          </div>
        </div>

        <div className={styles.group}>
          <p className={styles.groupLabel}>Gutter marker (256:3067 / 256:2885)</p>
          <div className={styles.row}>
            <Specimen label="section dot"><GutterMarker /></Specimen>
            <Specimen label="step 1"><GutterMarker n={1} /></Specimen>
            <Specimen label="step 2"><GutterMarker n={2} /></Specimen>
            <Specimen label="step 12"><GutterMarker n={12} /></Specimen>
          </div>
        </div>

        <div className={styles.group}>
          <p className={styles.groupLabel}>@ inline hint &amp; reference (Chip ref mode)</p>
          <div className={styles.row}>
            <Specimen label="@ hint (empty)"><Chip mode="ref" /></Specimen>
            <Specimen label="@ email ref"><Chip mode="ref" label="engg.hiver@grexit.com" /></Specimen>
          </div>
        </div>

        <div className={styles.group}>
          <p className={styles.groupLabel}>Draft status pill (256:3087) &amp; send button (258:7078)</p>
          <div className={styles.row}>
            <Specimen label="draft pill"><Badge intent="draft">Draft</Badge></Specimen>
            <Specimen label="send · sm (22px)">
              <Button variant="primary" size="sm" pill iconOnly={<RiArrowUpLine />} ariaLabel="Send" />
            </Specimen>
          </div>
        </div>

        <div className={styles.group}>
          <p className={styles.groupLabel}>Chat input bar (258:7073) — pill container + Textarea + send</p>
          <div className={styles.row}>
            <div className={styles.chatPreview}>
              <span className={styles.chatPlaceholder}>ask a question...</span>
              <Button variant="primary" size="sm" pill iconOnly={<RiArrowUpLine />} ariaLabel="Send" />
            </div>
          </div>
        </div>

        <div className={styles.group}>
          <p className={styles.groupLabel}>Gmail brand mark (for top bar chrome)</p>
          <div className={styles.row}>
            <Specimen label="logo 20px"><GmailLogo style={{ width: 26, height: 20 }} /></Specimen>
            <Specimen label="with wordmark">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <GmailLogo style={{ width: 26, height: 20 }} />
                <span style={{ fontSize: 22, color: '#5f6368', fontWeight: 400, letterSpacing: '-0.01em' }}>Gmail</span>
              </span>
            </Specimen>
          </div>
        </div>
      </section>

      {/* Command palette */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Command palette</h2>
          <span className={styles.status}>Figma 283:28427 — search, Actions/Connectors, connector drill-down, footer hints. Interactive.</span>
        </div>
        <div className={styles.group}>
          <p className={styles.groupLabel}>Default (interactive — type to filter, click a connector to drill in)</p>
          <div className={styles.row}>
            <CommandPalette
              presentation
              anchor={{ left: 0, top: 0, bottom: 0 }}
              onSelect={() => {}}
              onClose={() => {}}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
