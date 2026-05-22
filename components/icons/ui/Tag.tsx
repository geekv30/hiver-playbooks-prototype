import type { SVGProps } from 'react';

export function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M2.5 8.5l6-6h5v5l-6 6-5-5z M11 4.5a.5.5 0 100 1 .5.5 0 000-1z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
