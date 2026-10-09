import styles from './CustomerMark.module.css';

/** Muted, distinct fills. A visitor keeps one colour everywhere they appear. */
const FILLS = ['#d9773f', '#4f7fd6', '#3d9670', '#8a64c8', '#cc5577', '#2f97a8', '#b8862a'];

function fillFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return FILLS[h % FILLS.length]!;
}

/**
 * CustomerMark - who a chat run was with: a round initial, then the name.
 *
 * The chat inbox's own list does this (one initial, the name or the visitor's
 * generated handle), so a chat run reads the way the chat it came from does.
 * A chat has no subject; the person is the thing to recognise.
 */
export default function CustomerMark({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`${styles.mark} ${className ?? ''}`}>
      <span
        className={styles.avatar}
        style={{
          width: size,
          height: size,
          background: fillFor(name),
          fontSize: Math.round(size * 0.55),
        }}
        aria-hidden
      >
        {name.trim().charAt(0).toUpperCase()}
      </span>
      <span className={styles.name}>{name}</span>
    </span>
  );
}
