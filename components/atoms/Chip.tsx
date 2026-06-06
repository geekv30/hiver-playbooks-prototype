'use client';
import { type MouseEvent as ReactMouseEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Chip as ChipModel } from '@/types/playbook';
import { findAction } from '@/data/library';
import { CONNECTOR_META } from '@/data/connectors';
import { CONNECTOR_ICON } from '@/components/icons/connectors';
import { ACTION_ICON } from '@/components/icons/ui';
import { BranchIcon } from '@/components/icons/ui/Branch';
import { RiAtLine } from 'react-icons/ri';
import styles from './Chip.module.css';

type ChipMode = 'action' | 'ref' | 'condition' | 'placeholder';

interface Props {
  /** Required for mode 'action'. Omit for 'ref' / 'condition'. */
  chip?: ChipModel;
  /** Override for chip meta text (action mode). Falls back to chip.config.meta then ActionDef.meta. */
  metaText?: string;
  /** Action mode: click the chip to reconfigure it (passes the chip id + the
   *  element, so the caller can anchor a popover to it). Only set for chips that
   *  carry a pickable value - that is what makes a chip look/behave clickable. */
  onClick?: (chipId: string, el: HTMLElement) => void;
  /** 'action' (default) renders from chip.actionId. 'ref' = @-reference pill. 'condition' = flow branch label. */
  mode?: ChipMode;
  /** ref mode: the reference value (mono). condition mode: the branch label (IF / ELSE-IF / ELSE). */
  label?: string;
  /** Connector setup-required state: red "setup needed" status in place of verb/meta. */
  setupNeeded?: boolean;
  /** Borderless, transparent variant (e.g. the run trace) - same content, no chrome. */
  plain?: boolean;
  /** Condition mode only: muted label for the not-yet-decided ELSE-IF / ELSE prompt. */
  subtle?: boolean;
  /** Condition mode only: makes the tag a button (the ELSE-IF / ELSE prompt opens a
   *  picker). Passes the tag's element so the caller can anchor the picker to it. */
  onConditionClick?: (el: HTMLElement) => void;
}

// The action-tag. One pill chrome, several variants (Figma component 241:16557):
// action / connector verbs, @-references, condition branch labels, and the
// connector setup-required state.
export default function Chip({ chip, metaText, onClick, mode = 'action', label, setupNeeded, plain, subtle, onConditionClick }: Props) {
  // Reference (@attri) - @ glyph + mono value.
  if (mode === 'ref') {
    return (
      <span className={styles.chip} contentEditable={false} suppressContentEditableWarning>
        <span className={styles.chipAt} aria-hidden="true"><RiAtLine /></span>
        <span className={styles.chipRef}>{label}</span>
      </span>
    );
  }

  // Placeholder ("@ action") - the dashed pill shown inline the moment the user
  // types '@', held until they pick + finalize the action (Figma 647:41076).
  if (mode === 'placeholder') {
    return (
      <span
        className={`${styles.chip} ${styles.placeholder}`}
        data-chip-id={chip?.id}
        contentEditable={false}
        suppressContentEditableWarning
      >
        <span className={styles.phText}>@</span>
        <span className={styles.phText}>action</span>
      </span>
    );
  }

  // Condition / flow - branch icon + uppercase label. Two states: decided (IF /
  // ELSE-IF / ELSE, ink label) and the not-yet-decided ELSE-IF / ELSE prompt
  // (subtle label, clickable to open the branch-type picker). Same tag chrome.
  if (mode === 'condition') {
    const condCls = `${styles.chip} ${plain ? styles.plain : ''} ${onConditionClick ? styles.condButton : ''}`.trim();
    const verbCls = `${styles.chipVerb} ${subtle ? styles.verbSubtle : ''}`.trim();
    // The undecided ELSE-IF / ELSE prompt fades BOTH its label and icon (Figma 334:37179).
    const icoCls = `${styles.chipIco} ${subtle ? styles.icoSubtle : ''}`.trim();
    const inner = (
      <>
        <span className={icoCls}><BranchIcon /></span>
        <span className={verbCls}>{label}</span>
      </>
    );
    return onConditionClick ? (
      <button
        type="button"
        className={condCls}
        onClick={(e) => onConditionClick(e.currentTarget)}
        aria-haspopup="listbox"
        aria-label={`${label ?? 'Branch'} - choose branch type`}
      >
        {inner}
      </button>
    ) : (
      <span className={condCls} contentEditable={false} suppressContentEditableWarning>{inner}</span>
    );
  }

  // Action / connector.
  if (!chip) return null;
  const action = findAction(chip.actionId);
  if (!action) return null;

  const draft = chip.status === 'draft';
  const cls = [styles.chip, draft ? styles.isDraft : '', plain ? styles.plain : '', onClick ? styles.clickable : '']
    .filter(Boolean)
    .join(' ');
  const handleClick = onClick
    ? (e: ReactMouseEvent<HTMLSpanElement>) => onClick(chip.id, e.currentTarget)
    : undefined;
  // role=button + tabIndex make the chip keyboard-reachable; Enter/Space open the
  // config popover (stopPropagation so the contentEditable line doesn't also act).
  const handleKeyDown = onClick
    ? (e: ReactKeyboardEvent<HTMLSpanElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onClick(chip.id, e.currentTarget);
        }
      }
    : undefined;

  const ConnectorIcon = action.connectorSlug ? CONNECTOR_ICON[action.connectorSlug] : null;
  const VerbIcon = !action.connectorSlug ? ACTION_ICON[action.iconKey] : null;
  const Icon = ConnectorIcon ?? VerbIcon ?? null;

  let brandText: string | null = null;
  let verbText: string;
  if (action.connectorSlug) {
    brandText = CONNECTOR_META[action.connectorSlug].name;
    const middleDot = ' · ';
    const idx = action.name.indexOf(middleDot);
    verbText = idx > -1 ? action.name.slice(idx + middleDot.length) : action.name;
  } else {
    verbText = action.name;
  }

  const configMeta = typeof chip.config.meta === 'string' ? chip.config.meta : null;
  const meta = metaText ?? configMeta ?? action.meta ?? null;

  return (
    <span
      className={cls}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-haspopup={onClick ? 'dialog' : undefined}
      aria-label={onClick ? `${verbText}${meta ? `, ${meta}` : ''} - reconfigure` : undefined}
      data-chip-id={chip.id}
      contentEditable={false}
      suppressContentEditableWarning
    >
      {Icon && (
        <span className={styles.chipIco}>
          <Icon />
        </span>
      )}
      {brandText && (
        <>
          <span className={styles.chipBrand}>{brandText}</span>
          <span className={styles.chipSep}>·</span>
        </>
      )}
      {setupNeeded ? (
        <>
          {!brandText && <span className={styles.chipVerb}>{verbText}</span>}
          <span className={styles.chipSetupDot} aria-hidden="true" />
          <span className={styles.chipSetup}>setup needed</span>
        </>
      ) : (
        <>
          {/* A standalone verb is the de-emphasized lead (chipVerb); a connector
              operation that follows a brand is the emphasized value (chipMeta) -
              Figma 410:51320 renders "get-contact" in Medium/ink-soft. */}
          <span className={brandText ? styles.chipMeta : styles.chipVerb}>{verbText}</span>
          {meta && (
            <>
              <span className={styles.chipSep}>·</span>
              <span className={styles.chipMeta}>{meta}</span>
            </>
          )}
        </>
      )}
      {!setupNeeded && chip.status !== 'ok' && (
        <span className={`${styles.chipState} ${draft ? styles.draft : ''}`} aria-hidden="true" />
      )}
    </span>
  );
}
