'use client';
import type { Chip } from '@/types/playbook';
import { findAction } from '@/data/library';
import ChipAtom from '@/components/atoms/Chip';
import FieldInput from '@/components/surfaces/FieldInput';
import styles from './rail.module.css';

interface Props {
  chip: Chip | null;
  onUpdateChip: (chipId: string, patch: Partial<Chip>) => void;
}

export default function ConfigTab({ chip, onUpdateChip }: Props) {
  if (!chip) {
    return <div className={styles.configEmpty}>Click a chip to configure it.</div>;
  }
  const action = findAction(chip.actionId);
  if (!action) return null;

  const configKeys = Object.keys(chip.config);

  return (
    <div>
      <div className={styles.section}>
        <div className={styles.label}>{action.name}</div>
        <div className={styles.configChipPreview}>
          <ChipAtom chip={chip} />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>Configuration</div>
        <div className={styles.configForm}>
          {configKeys.length === 0 && (
            <div className={styles.placeholder}>
              No config keys yet
              <span className={styles.phHint}>edit the chip in the canvas to set values</span>
            </div>
          )}
          {configKeys.map((k) => {
            const v = chip.config[k];
            const display = typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
              ? String(v) : JSON.stringify(v);
            return (
              <FieldInput
                key={k}
                label={k}
                value={display}
                onChange={(next) => {
                  onUpdateChip(chip.id, { config: { ...chip.config, [k]: next } });
                }}
              />
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>Status</div>
        <div className={styles.row}>
          <span className={styles.key}>State</span>
          <span className={`${styles.pill} ${chip.status === 'draft' ? styles.draft : chip.status === 'ok' ? '' : styles.off}`}>
            {chip.status}
          </span>
        </div>
      </div>
    </div>
  );
}
