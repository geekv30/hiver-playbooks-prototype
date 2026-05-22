import type { SVGProps } from 'react';

export function HiverBrandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      {/* Hiver mark: simple rounded H */}
      <path d="M3.5 2v12 M11.5 2v12 M3.5 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
