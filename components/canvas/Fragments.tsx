'use client';
import type { Fragment, Chip as ChipModel } from '@/types/playbook';
import Chip from '@/components/atoms/Chip';
import FieldRef from '@/components/atoms/FieldRef';
import styles from './Fragments.module.css';

interface Props {
  fragments: Fragment[];
  onChipClick?: (chipId: string) => void;
  onRefClick?: (refPath: string) => void;
  /** Whether refs should prepend '@' when rendered. Trigger refs (like info@walkjapan.com) disable this. */
  refPrefix?: boolean;
}

export function Fragments({ fragments, onChipClick, onRefClick, refPrefix = true }: Props) {
  return (
    <>
      {fragments.map((f, idx) => {
        if (f.kind === 'text') return <span key={idx}>{f.text}</span>;
        if (f.kind === 'chip') return <Chip key={idx} chip={f.chip} onClick={onChipClick} />;
        if (f.kind === 'ref') return <FieldRef key={idx} refPath={f.refPath} onClick={onRefClick} prefix={refPrefix} />;
        if (f.kind === 'code') return <code key={idx} className={styles.code}>{f.code}</code>;
        return null;
      })}
    </>
  );
}
