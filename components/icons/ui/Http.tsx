import type { SVGProps } from 'react';

// fallback: not in canvas - Lucide globe style
export function HttpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 2c0 0-2 2-2 6s2 6 2 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 2c0 0 2 2 2 6s-2 6-2 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M2 8h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
