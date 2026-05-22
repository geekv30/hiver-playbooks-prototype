import type { SVGProps } from 'react';

// Verb-action "draft" icon (pencil with edit lines)
// Named DraftIcon internally; exported as DraftVerbIcon from ui/index.ts to avoid
// collision with the field-type DraftIcon in fields/Draft.tsx
export function DraftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M11.5 2.5l2 2-7 7-2.5.5.5-2.5 7-7z M9 5l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
