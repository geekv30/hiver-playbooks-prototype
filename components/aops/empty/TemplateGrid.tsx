'use client';

import { STARTERS, type StarterSpec } from '@/components/flow01/coldStart';
import TemplateCard, { type TemplateCardVariant } from './TemplateCard';

/** The empty state's "Start with a template" grid: every starter, one card each. */
export default function TemplateGrid({
  variant,
  className,
  onPick,
}: {
  variant: TemplateCardVariant;
  className?: string;
  onPick?: (spec: StarterSpec) => void;
}) {
  return (
    <div className={className}>
      {STARTERS.map((s) => (
        <TemplateCard key={s.id} spec={s} variant={variant} onPick={onPick} />
      ))}
    </div>
  );
}
