'use client';
import { useState } from 'react';
import { RiAddLine, RiCloseLine } from 'react-icons/ri';
import { SiSlack } from 'react-icons/si';
import type { Chip } from './data';
import { findAction, ICONS } from './data';
import styles from './canvas.module.css';

interface BodyProps {
  chip: Chip;
  onMetaChange: (meta: string) => void;
}

/* ============================================================ */
/* Shared atoms                                                   */
/* ============================================================ */
function FieldRow({
  label, hint, helper, children,
}: { label: string; hint?: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldLabelRow}>
        <span className={styles.fieldLabel}>{label}</span>
        {hint && <span className={styles.fieldHint}>{hint}</span>}
      </div>
      <div className={styles.fieldControl}>{children}</div>
      {helper && <div className={styles.fieldHelper}>{helper}</div>}
    </div>
  );
}

/* ============================================================ */
/* Read body — generic but specialized for AI Extract             */
/* ============================================================ */
function ReadBody({ chip }: BodyProps) {
  const action = findAction(chip.actionId);
  const isExtract = chip.actionId === 'ai_extract';
  return (
    <>
      <FieldRow label="Source" hint="ref">
        <div className={styles.refDisplay}>
          <span className={styles.refMono}>{'{{from.body}}'}</span>
          <button className={styles.refChange} type="button">Change</button>
        </div>
      </FieldRow>
      {isExtract && (
        <FieldRow label="Fields to extract" hint="multi" helper="The AI extracts these named fields from the source.">
          <div className={styles.pillRow}>
            {['tour', 'dates', 'group', 'concerns'].map((t) => (
              <span key={t} className={styles.pill}>
                {t}
                <button className={styles.pillX} type="button"><RiCloseLine /></button>
              </span>
            ))}
            <button className={styles.pillAdd} type="button"><RiAddLine /> Add field</button>
          </div>
        </FieldRow>
      )}
      <FieldRow label="Output ref" hint="readonly" helper="Reference this downstream.">
        <div className={styles.refDisplay}>
          <span className={styles.refMono}>{`{{${action?.id ?? 'output'}.output}}`}</span>
        </div>
      </FieldRow>
    </>
  );
}

/* ============================================================ */
/* Ticket body — Tag / Note / Reply / Assign all routed here      */
/* ============================================================ */
function TicketBody({ chip, onMetaChange }: BodyProps) {
  const action = findAction(chip.actionId);

  if (chip.actionId === 'tag') {
    return (
      <>
        <FieldRow label="Tags" hint="required">
          <div className={styles.tagRow}>
            <span className={styles.tagChip}>tour-enquiry<button className={styles.pillX}><RiCloseLine /></button></span>
            <span className={styles.tagChip} data-color="ref">@tour.name<button className={styles.pillX}><RiCloseLine /></button></span>
            <button className={styles.pillAdd} type="button"><RiAddLine /> Add tag</button>
          </div>
        </FieldRow>
        <FieldRow label="Source" hint="static / ref">
          <div className={styles.radioRow}>
            <label className={styles.radioOpt}><input type="radio" name="src" defaultChecked /> Static value</label>
            <label className={styles.radioOpt}><input type="radio" name="src" /> From ref</label>
          </div>
        </FieldRow>
      </>
    );
  }

  if (chip.actionId === 'note' || chip.actionId === 'draft_reply' || chip.actionId === 'send_reply') {
    return (
      <>
        <FieldRow label="Body" hint={action?.verb || 'text'} helper="Supports {{ref}} insertion.">
          <textarea
            className={styles.textArea}
            rows={5}
            defaultValue={chip.meta || ''}
            onBlur={(e) => onMetaChange(e.currentTarget.value || (action?.defaultMeta ?? ''))}
          />
        </FieldRow>
        {chip.actionId === 'note' && (
          <FieldRow label="Visibility">
            <div className={styles.readonlyDisplay}>Internal — visible to your team only</div>
          </FieldRow>
        )}
      </>
    );
  }

  if (chip.actionId === 'assign') {
    return (
      <>
        <FieldRow label="Assignee" hint="required">
          <div className={styles.userPicker}>
            <span className={styles.avatar}>OS</span>
            <span className={styles.userName}>on-shift inbox</span>
            <button className={styles.refChange} type="button">Change</button>
          </div>
        </FieldRow>
      </>
    );
  }

  // change_status, set_field default
  return (
    <FieldRow label="Value">
      <input
        className={styles.textInput}
        type="text"
        defaultValue={chip.meta || ''}
        onBlur={(e) => onMetaChange(e.currentTarget.value)}
      />
    </FieldRow>
  );
}

/* ============================================================ */
/* External body                                                  */
/* ============================================================ */
function ExternalBody({ chip, onMetaChange }: BodyProps) {
  const action = findAction(chip.actionId);
  const isSlack = chip.actionId === 'slack_send';
  const isHttp = chip.actionId === 'http';
  return (
    <>
      <FieldRow label="Connector">
        <div className={styles.connectorTile}>
          <span className={styles.connectorIcon}>
            {isSlack ? <SiSlack /> : action ? (() => { const Icon = ICONS[action.iconKey]; return Icon ? <Icon /> : null; })() : null}
          </span>
          <span className={styles.connectorName}>{action?.brand || 'HTTP'}</span>
          <span className={styles.connectorStatus}><span className={styles.dotOk} /> Connected</span>
          <button className={styles.refChange} type="button">Change</button>
        </div>
      </FieldRow>
      {isSlack && (
        <>
          <FieldRow label="Channel">
            <input
              className={styles.textInput}
              type="text"
              defaultValue={chip.meta || '#cs-team'}
              onBlur={(e) => onMetaChange(e.currentTarget.value)}
            />
          </FieldRow>
          <FieldRow label="Message" helper="Supports {{ref}}.">
            <textarea className={styles.textArea} rows={4} defaultValue={'New tour enquiry — {{from.name}}, tour: {{ai_extract.output.tour}}.'} />
          </FieldRow>
        </>
      )}
      {isHttp && (
        <>
          <FieldRow label="Method"><input className={styles.textInputSmall} type="text" defaultValue="POST" /></FieldRow>
          <FieldRow label="URL"><input className={styles.textInput} type="text" defaultValue="https://api.airtable.com/v0/walkjapan/enquiries" /></FieldRow>
          <FieldRow label="Body" helper="JSON, supports {{ref}}.">
            <textarea className={styles.textArea} rows={5} defaultValue={'{\n  "tour": "{{ai_extract.output.tour}}",\n  "dates": "{{ai_extract.output.dates}}"\n}'} />
          </FieldRow>
        </>
      )}
      {!isSlack && !isHttp && (
        <FieldRow label="Endpoint">
          <input
            className={styles.textInput}
            type="text"
            defaultValue={chip.meta || ''}
            onBlur={(e) => onMetaChange(e.currentTarget.value)}
          />
        </FieldRow>
      )}
    </>
  );
}

/* ============================================================ */
/* Human (Approval) body                                          */
/* ============================================================ */
function HumanBody({ chip }: BodyProps) {
  return (
    <>
      <FieldRow label="Approver" hint="required">
        <div className={styles.userPicker}>
          <span className={styles.avatar}>TL</span>
          <span className={styles.userName}>team-lead@walkjapan.com</span>
          <button className={styles.refChange} type="button">Change</button>
        </div>
      </FieldRow>
      <FieldRow label="Message">
        <textarea className={styles.textArea} rows={3} defaultValue="Please review this draft before sending." />
      </FieldRow>
      <FieldRow label="Approve label"><input className={styles.textInput} type="text" defaultValue="Approve & send" /></FieldRow>
      <FieldRow label="Reject label"><input className={styles.textInput} type="text" defaultValue="Reject — send alternatives" /></FieldRow>
      <FieldRow label="Timeout" helper="Auto-resolves to Reject after this window.">
        <div className={styles.unitRow}>
          <input className={styles.textInputSmall} type="number" defaultValue="24" />
          <select className={styles.unitSelect} defaultValue="hours">
            <option>minutes</option><option>hours</option><option>business hours</option><option>days</option>
          </select>
        </div>
      </FieldRow>
    </>
  );
}

/* ============================================================ */
/* Wait body                                                      */
/* ============================================================ */
function WaitBody({ chip, onMetaChange }: BodyProps) {
  const [tab, setTab] = useState<'duration' | 'until' | 'for-reply'>(
    chip.actionId === 'wait_until' ? 'until' : chip.actionId === 'wait_for_reply' ? 'for-reply' : 'duration'
  );
  return (
    <>
      <div className={styles.tabStrip}>
        {(['duration', 'until', 'for-reply'] as const).map((t) => (
          <button
            key={t}
            className={`${styles.tabBtn} ${tab === t ? styles.tabBtnActive : ''}`}
            onClick={() => setTab(t)}
            type="button"
          >
            {t === 'duration' ? 'Duration' : t === 'until' ? 'Until' : 'For reply'}
          </button>
        ))}
      </div>
      {tab === 'duration' && (
        <FieldRow label="Duration">
          <div className={styles.unitRow}>
            <input className={styles.textInputSmall} type="number" defaultValue="5" onBlur={(e) => onMetaChange(`${e.currentTarget.value} days`)} />
            <select className={styles.unitSelect} defaultValue="days">
              <option>minutes</option><option>hours</option><option>business hours</option><option>days</option><option>business days</option>
            </select>
          </div>
        </FieldRow>
      )}
      {tab === 'until' && (
        <FieldRow label="Until">
          <input className={styles.textInput} type="text" defaultValue="2026-06-01 09:00" />
        </FieldRow>
      )}
      {tab === 'for-reply' && (
        <>
          <FieldRow label="From">
            <div className={styles.radioRow}>
              <label className={styles.radioOpt}><input type="radio" name="from" defaultChecked /> Customer</label>
              <label className={styles.radioOpt}><input type="radio" name="from" /> Anyone</label>
            </div>
          </FieldRow>
          <FieldRow label="Timeout">
            <div className={styles.unitRow}>
              <input className={styles.textInputSmall} type="number" defaultValue="7" />
              <select className={styles.unitSelect} defaultValue="days"><option>hours</option><option>days</option></select>
            </div>
          </FieldRow>
        </>
      )}
    </>
  );
}

/* ============================================================ */
/* Flow body                                                      */
/* ============================================================ */
function FlowBody({ chip }: BodyProps) {
  if (chip.actionId === 'end') {
    return (
      <>
        <FieldRow label="Reason tag" helper="Tag this end-point for analytics.">
          <input className={styles.textInput} type="text" defaultValue="tour-enquiry handled" />
        </FieldRow>
        <FieldRow label="Notify">
          <label className={styles.toggleRow}>
            <input type="checkbox" />
            <span className={styles.toggleTrack}><span className={styles.toggleKnob} /></span>
            <span className={styles.toggleLabel}>Send a Slack ping when this end is hit</span>
          </label>
        </FieldRow>
      </>
    );
  }
  return (
    <FieldRow label="Branches" hint="evaluated top-down">
      <div className={styles.branchList}>
        <div className={styles.branchRow}><span className={styles.branchNum}>01</span><code className={styles.branchPred}>availability == &quot;yes&quot;</code><button className={styles.branchEdit} disabled>Edit</button></div>
        <div className={styles.branchRow}><span className={styles.branchNum}>02</span><code className={styles.branchPred}>availability == &quot;no&quot;</code><button className={styles.branchEdit} disabled>Edit</button></div>
        <div className={styles.branchRow} data-default><span className={styles.branchNum}>else</span><code className={styles.branchPred}>(default)</code><button className={styles.branchEdit} disabled>Edit</button></div>
      </div>
    </FieldRow>
  );
}

/* ============================================================ */
/* Public switch                                                   */
/* ============================================================ */
export function ConfigureBody({ chip, onMetaChange }: BodyProps) {
  const action = findAction(chip.actionId);
  if (!action) return <div className={styles.fieldHelper}>Unknown action</div>;
  switch (action.bucket) {
    case 'read':     return <ReadBody chip={chip} onMetaChange={onMetaChange} />;
    case 'ticket':   return <TicketBody chip={chip} onMetaChange={onMetaChange} />;
    case 'external': return <ExternalBody chip={chip} onMetaChange={onMetaChange} />;
    case 'human':    return <HumanBody chip={chip} onMetaChange={onMetaChange} />;
    case 'wait':     return <WaitBody chip={chip} onMetaChange={onMetaChange} />;
    case 'flow':     return <FlowBody chip={chip} onMetaChange={onMetaChange} />;
  }
}
