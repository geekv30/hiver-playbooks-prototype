import type { SVGProps } from 'react';

export function BoolIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="2" y="7" width="20" height="10" rx="5" />
      <circle cx="16" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}
