import type { SVGProps } from 'react';

export function DragIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" {...props}>
      <circle cx="6" cy="4" r="1.1" fill="currentColor" />
      <circle cx="10" cy="4" r="1.1" fill="currentColor" />
      <circle cx="6" cy="8" r="1.1" fill="currentColor" />
      <circle cx="10" cy="8" r="1.1" fill="currentColor" />
      <circle cx="6" cy="12" r="1.1" fill="currentColor" />
      <circle cx="10" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}
