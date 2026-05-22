'use client';
import type { Chip as ChipModel } from '@/types/playbook';
import { findAction } from '@/data/library';
import { CONNECTOR_META } from '@/data/connectors';
import { CONNECTOR_ICON } from '@/components/icons/connectors';
import { ACTION_ICON } from '@/components/icons/ui';
import styles from './Chip.module.css';

interface Props {
  chip: ChipModel;
  /** Optional override for chip meta text. Falls back to ActionDef.meta from the library. */
  metaText?: string;
  onClick?: (chipId: string) => void;
}

export default function Chip({ chip, metaText, onClick }: Props) {
  const action = findAction(chip.actionId);
  if (!action) return null;

  const draft = chip.status === 'draft';
  const cls = [styles.chip, draft ? styles.isDraft : ''].filter(Boolean).join(' ');

  // Icon: connector brand SVG if connectorSlug, otherwise the verb icon from ACTION_ICON.
  const ConnectorIcon = action.connectorSlug ? CONNECTOR_ICON[action.connectorSlug] : null;
  const VerbIcon = !action.connectorSlug ? ACTION_ICON[action.iconKey] : null;
  const Icon = ConnectorIcon ?? VerbIcon ?? null;

  // Label: for connector actions, split 'Brand · Verb' so the brand/sep/verb hierarchy renders.
  // For non-connector actions, the full label is the verb.
  let brandText: string | null = null;
  let verbText: string;
  if (action.connectorSlug) {
    const brand = CONNECTOR_META[action.connectorSlug].name;
    brandText = brand;
    // The canvas label is "Brand · Verb"; strip the brand prefix to get the verb.
    const middleDot = ' · ';
    const idx = action.name.indexOf(middleDot);
    verbText = idx > -1 ? action.name.slice(idx + middleDot.length) : action.name;
  } else {
    verbText = action.name;
  }

  // Meta: prefer prop override, then ActionDef.meta default.
  const meta = metaText ?? action.meta ?? null;

  const handleClick = onClick ? () => onClick(chip.id) : undefined;

  return (
    <span
      className={cls}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-chip-id={chip.id}
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
      <span className={styles.chipVerb}>{verbText}</span>
      {meta && <span className={styles.chipMeta}>{meta}</span>}
      <span className={`${styles.chipState} ${draft ? styles.draft : ''}`} aria-hidden="true" />
    </span>
  );
}
