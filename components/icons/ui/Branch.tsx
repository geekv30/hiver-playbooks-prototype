import type { SVGProps } from 'react';

export function BranchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M5 3v3a3 3 0 003 3h3 M5 9v3 M11 9v3 M5 13h.01 M11 13h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="5" cy="3" r="1" fill="currentColor" />
      <circle cx="5" cy="13" r="1" fill="currentColor" />
      <circle cx="11" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}
