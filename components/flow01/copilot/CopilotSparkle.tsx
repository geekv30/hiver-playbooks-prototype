'use client';

import { useId } from 'react';

/**
 * The Copilot brand mark - a 4-point sparkle. Two tones:
 *  - `gradient` (default): the Figma AI gradient (teal #31E3DE -> purple #662BF5
 *    -> warm #E4B2A2), pulled verbatim from node 483:16736 (the rail toggle).
 *  - `flat`: a single `currentColor` stroke, for surfaces where the multi-stop
 *    gradient reads as AI-slop (the ChatGPT-clone empty-state hero, inline use).
 * The gradient id is per-instance (useId) so several sparkles on one page don't
 * collide on a shared <linearGradient> id.
 */
export default function CopilotSparkle({
  size = 18,
  className,
  tone = 'gradient',
}: {
  size?: number;
  className?: string;
  tone?: 'gradient' | 'flat';
}) {
  // Strip the colons useId() emits (":r0:") - they're valid in an id but break
  // SVG url(#...) references in Safari/Firefox.
  const gid = `cps-${useId().replace(/:/g, '')}`;
  const flat = tone === 'flat';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        d="M14.2817 12.1365C14.6543 13.0347 15.3509 13.7562 16.231 14.1472L16.5522 14.2898L16.1987 14.448C15.3409 14.8292 14.6568 15.5246 14.2778 16.3933L14.1997 16.5691L14.1235 16.3933C13.7445 15.5245 13.0597 14.8292 12.2017 14.448L11.8472 14.2898L12.1704 14.1472C13.0504 13.7562 13.7462 13.0347 14.1187 12.1365L14.1997 11.9392L14.2817 12.1365ZM13.8501 13.5115L13.4282 13.9304L13.0659 14.2898L13.4341 14.6453L13.856 15.0525L14.2065 15.3904L14.5542 15.0486L14.9673 14.6414L15.3228 14.2898L14.9722 13.9343L14.5591 13.5154L14.2065 13.158L13.8501 13.5115ZM7.10889 1.40405C7.18568 1.21901 7.42754 1.21905 7.50439 1.40405L8.17139 3.0105C8.79531 4.51392 9.95977 5.71804 11.4282 6.36987L13.1831 7.14917C13.2687 7.18718 13.3179 7.26632 13.3179 7.36694C13.3178 7.46747 13.2687 7.54673 13.1831 7.58472L11.3716 8.38843C9.93994 9.02391 8.79552 10.1855 8.16064 11.6394L7.50244 13.1462C7.424 13.3259 7.18924 13.3258 7.11084 13.1462L6.45264 11.6394C5.81781 10.1855 4.67333 9.02391 3.2417 8.38843L1.43018 7.58472C1.34459 7.54673 1.29547 7.46746 1.29541 7.36694C1.29541 7.26639 1.34461 7.18721 1.43018 7.14917L3.18506 6.36987C4.6535 5.71804 5.81894 4.51395 6.44287 3.0105L7.10889 1.40405ZM6.84912 3.33179C6.13508 4.95851 4.83385 6.1854 3.20166 6.90991L2.17236 7.36694L3.20166 7.82397C4.82058 8.54259 6.11683 9.71307 6.85303 11.3093L7.30713 12.2937L7.76123 11.3093C8.49744 9.71312 9.79283 8.5426 11.4116 7.82397L12.4409 7.36694L11.4116 6.90991C9.77947 6.18539 8.4782 4.95849 7.76416 3.33179L7.30713 2.28882L6.84912 3.33179Z"
        stroke={flat ? 'currentColor' : `url(#${gid})`}
      />
      {!flat && (
        <defs>
          <linearGradient
            id={gid}
            x1="-0.156275"
            y1="18.0957"
            x2="21.1064"
            y2="10.0437"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#31E3DE" />
            <stop offset="0.25" stopColor="#662BF5" />
            <stop offset="1" stopColor="#E4B2A2" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}
