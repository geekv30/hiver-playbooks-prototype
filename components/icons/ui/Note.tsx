import type { SVGProps } from 'react';

export function NoteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M3 3h10v8l-3 3H3V3z M10 11h3.5l-3.5 3v-3z M5.5 6h5 M5.5 8.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
