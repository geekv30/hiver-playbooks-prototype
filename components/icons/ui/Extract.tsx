import type { SVGProps } from 'react';

// fallback: not in canvas - Lucide wand/sparkle-extract style
export function ExtractIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M6 2l1 2.5 2.5 1-2.5 1L6 9l-1-2.5L2.5 5.5l2.5-1L6 2z" fill="currentColor" />
      <path d="M12 8l.7 1.8 1.8.7-1.8.7L12 13l-.7-1.8L9.5 10.5l1.8-.7L12 8z" fill="currentColor" />
    </svg>
  );
}
