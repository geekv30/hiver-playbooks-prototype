import styles from './Avatar.module.css';

interface Props {
  initials?: string;
  src?: string;
  size?: number;
  /** Background for the initials variant (pastel). */
  color?: string;
  online?: boolean;
  ariaLabel?: string;
}

// Avatar — Figma 211:24039. Image or initials, optional online dot.
export default function Avatar({ initials, src, size = 24, color = '#8789C5', online, ariaLabel }: Props) {
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, background: src ? undefined : color }}
      aria-label={ariaLabel}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.img} src={src} alt="" />
      ) : (
        <span className={styles.initials} style={{ fontSize: Math.round(size * 0.42) }}>
          {initials}
        </span>
      )}
      {online && <span className={styles.online} />}
    </span>
  );
}
