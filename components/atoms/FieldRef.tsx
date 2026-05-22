'use client';
import styles from './FieldRef.module.css';

interface Props {
  refPath: string;          // the canvas '@'+ref.path display style
  onClick?: (refPath: string) => void;
  /** When true, prepend '@' to the displayed path. Defaults to true. */
  prefix?: boolean;
}

export default function FieldRef({ refPath, onClick, prefix = true }: Props) {
  const handleClick = onClick ? () => onClick(refPath) : undefined;
  return (
    <span
      className={styles.ref}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-ref-path={refPath}
    >
      {prefix && '@'}{refPath}
    </span>
  );
}
