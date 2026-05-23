'use client';
import { useRef } from 'react';
import type { Frontmatter as FM } from '@/types/playbook';
import { Fragments } from './Fragments';
import { parseFragmentsFromDom } from '@/lib/parseFragments';
import styles from './Frontmatter.module.css';

interface Props {
  fm: FM;
  onChange: (patch: Partial<FM>) => void;
}

export default function Frontmatter({ fm, onChange }: Props) {
  const triggerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={styles.fm} data-step-id="__frontmatter__">
      <h1
        className={styles.fmTitle}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onChange({ name: e.currentTarget.textContent ?? '' })}
      >
        {fm.name}
      </h1>
      <div
        className={styles.fmTrigger}
        ref={triggerRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          const next = parseFragmentsFromDom(e.currentTarget, fm.triggerFragments);
          onChange({ triggerFragments: next });
        }}
      >
        <span
          className={styles.triglabel}
          contentEditable={false}
          data-skip="true"
        >
          WHEN
        </span>
        <Fragments fragments={fm.triggerFragments} refPrefix={false} />
      </div>
      <div
        className={styles.fmSummary}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Add a short summary so the team knows what this playbook does..."
        onBlur={(e) => onChange({ summary: e.currentTarget.textContent ?? '' })}
      >
        {fm.summary}
      </div>
    </div>
  );
}
