import type { SVGProps } from 'react';

export function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M2 8a6 6 0 11 1.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M2 13v-3h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
