import type { SVGProps } from 'react';

// Hiver brand mark: the amber hive hexagon with a white "H" (matches the AOP Figma's
// connector-setup logo). Full-color brand mark - not currentColor.
export function HiverBrandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16 1.5 L28 8.25 V21.75 L16 28.5 L4 21.75 V8.25 Z"
        fill="#F5A623"
        stroke="#F5A623"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 10.5 V19.5 M20.5 10.5 V19.5 M11.5 15 H20.5"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
