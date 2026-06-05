import styles from './GutterMarker.module.css';

interface Props {
  /** Step number. Omit (or pass undefined) to render the section dot. */
  n?: number;
}

/**
 * GutterMarker - the left-gutter index (Figma 256:3067 / 256:2885).
 * JetBrains Mono 13px, muted-soft. A bullet "·" marks frontmatter/section
 * headers; a number marks ordered steps.
 */
export default function GutterMarker({ n }: Props) {
  return (
    <span className={styles.marker} aria-hidden="true">
      {n == null ? '·' : n}
    </span>
  );
}
