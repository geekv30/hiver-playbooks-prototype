import { RiBookOpenLine, RiListCheck3 } from 'react-icons/ri';
import styles from './SkillMark.module.css';

export type SkillMarkVariant = 'notebook' | 'open-book' | 'steps' | 'solid';

const GLYPH = {
  'open-book': RiBookOpenLine,
  steps: RiListCheck3,
  solid: RiBookOpenLine,
} as const;

/**
 * The faded 80px mark above the empty state's prompt (Figma 3038:24636). Ink at
 * 10%, dissolving downward into the heading. `notebook` is the Figma asset
 * verbatim; the others compose a Remix glyph with a single four-point sparkle so
 * the sparkle can settle in once on load. `solid` is the round-2 take (after
 * Sarvam): larger and centered, fading out completely. (A filled book was
 * tried and read as two grey slabs once faded.)
 */
export default function SkillMark({ variant }: { variant: SkillMarkVariant }) {
  if (variant === 'notebook') {
    return (
      <span className={styles.mark} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/skills-empty-mark.svg" alt="" width={80} height={80} />
      </span>
    );
  }
  const Glyph = GLYPH[variant];
  return (
    <span
      className={`${styles.mark} ${styles.composed} ${variant === 'solid' ? styles.solid : ''}`}
      aria-hidden
    >
      <Glyph className={styles.glyph} />
      <svg className={styles.sparkle} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C12.7 6.3 17.7 11.3 24 12 17.7 12.7 12.7 17.7 12 24 11.3 17.7 6.3 12.7 0 12 6.3 11.3 11.3 6.3 12 0Z" />
      </svg>
    </span>
  );
}
