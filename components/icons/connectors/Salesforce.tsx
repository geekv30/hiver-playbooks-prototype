import type { SVGProps } from 'react';

// fallback: not in canvas - Lucide-style cloud placeholder
export function SalesforceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M17.5 19a4.5 4.5 0 1 0-1.41-8.775 5.5 5.5 0 0 0-10.659.654A4 4 0 0 0 7 19h10.5z" />
    </svg>
  );
}
