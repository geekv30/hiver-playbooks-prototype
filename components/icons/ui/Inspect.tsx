import type { SVGProps } from 'react';

export function InspectIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 3v10" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
