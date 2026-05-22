import type { SVGProps } from 'react';

export function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" {...props}>
      <path d="M4 3v10l9-5-9-5z" fill="currentColor" />
    </svg>
  );
}
