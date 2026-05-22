import type { SVGProps } from 'react';

// fallback: not in canvas - Lucide-style chevron-up placeholder
export function ClickUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5 16l7-7 7 7" />
    </svg>
  );
}
