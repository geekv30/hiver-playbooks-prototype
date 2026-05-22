import type { SVGProps } from 'react';

// fallback: not in canvas - Lucide inbox style
export function InboxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M2 9h3l1.5 2.5h3L11 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M2 9v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
