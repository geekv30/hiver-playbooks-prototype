'use client';

import { useLayoutEffect, useRef } from 'react';
import {
  RiArrowLeftLine,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiBookOpenLine,
  RiPlayLine,
  RiArrowDownSLine,
} from 'react-icons/ri';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import styles from './Toolbar.module.css';

interface Props {
  title: string;
  onTitleChange: (t: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isValid: boolean;
  onSimulate?: () => void;
  onActivate?: () => void;
}

// Editor toolbar (flow-01 256:3081). Undo/redo/title/validity are live; the
// back arrow, Simulate, and Activate's deploy dropdown lead to archetypes that
// aren't built yet, so they're rendered but stubbed.
export default function Toolbar({
  title,
  onTitleChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isValid,
  onSimulate,
  onActivate,
}: Props) {
  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <Button variant="secondary" iconOnly={<RiArrowLeftLine />} ariaLabel="Back" />
        <TitleField value={title} onChange={onTitleChange} />
        <Badge intent="draft">Draft</Badge>
      </div>

      <div className={styles.right}>
        <Button variant="tertiary" iconOnly={<RiArrowGoBackLine />} ariaLabel="Undo" onClick={onUndo} disabled={!canUndo} />
        <Button variant="tertiary" iconOnly={<RiArrowGoForwardLine />} ariaLabel="Redo" onClick={onRedo} disabled={!canRedo} />
        <span className={styles.gap} />
        <Button variant="secondary" iconOnly={<RiBookOpenLine />} ariaLabel="Manual" />
        <Button variant="secondary" iconLeft={<RiPlayLine />} onClick={onSimulate}>Simulate</Button>
        <Button variant="primary" iconRight={<RiArrowDownSLine />} disabled={!isValid} onClick={onActivate}>
          Activate
        </Button>
      </div>
    </div>
  );
}

// Editable title — a content-sized span so the dotted underline hugs the text
// exactly (an <input> sized by char-count overshoots a proportional font).
// Uncontrolled DOM text (seeded/reconciled imperatively) so the caret never jumps.
function TitleField({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.textContent !== value) el.textContent = value;
  }, [value]);
  return (
    <span
      ref={ref}
      className={styles.title}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-label="Playbook title"
      onInput={(e) => onChange(e.currentTarget.textContent ?? '')}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    />
  );
}
