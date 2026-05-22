import type { SVGProps } from 'react';

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1.5v2 M8 12.5v2 M3.5 8h-2 M14.5 8h-2 M4.8 4.8l-1.4-1.4 M12.6 12.6l-1.4-1.4 M4.8 11.2l-1.4 1.4 M12.6 3.4l-1.4 1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
