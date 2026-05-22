import type { SVGProps } from 'react';

// Untitled UI · magic-wand-01 (outlined, 1.4 stroke, rounded caps)
// Stroked diamond spark + small companion to match the 4-point-star idiom
// without the filled-blob look of the prior solid version.
export function ExtractIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M9.5 2 10.6 4.9 13.5 6 10.6 7.1 9.5 10 8.4 7.1 5.5 6 8.4 4.9 9.5 2Z" />
      <path d="M4.25 9.5 4.85 11 6.35 11.6 4.85 12.2 4.25 13.7 3.65 12.2 2.15 11.6 3.65 11 4.25 9.5Z" />
    </svg>
  );
}
