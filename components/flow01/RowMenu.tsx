'use client';

import { RiArrowUpLine, RiArrowDownLine, RiFileCopyLine, RiDeleteBinLine } from 'react-icons/ri';
import styles from './RowMenu.module.css';

interface Props {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/**
 * RowMenu - the step row's 3-dot (kebab) menu. Move up / Move down (disabled at
 * the ends), then Duplicate and a danger Delete. Open/close + outside-click are
 * owned by the editor (it knows which row's menu is open); this is the popover UI.
 */
export default function RowMenu({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: Props) {
  return (
    <div className={styles.menu} role="menu" data-row-menu>
      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onMoveUp}
        disabled={!canMoveUp}
      >
        <RiArrowUpLine className={styles.ico} aria-hidden />
        Move up
      </button>
      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onMoveDown}
        disabled={!canMoveDown}
      >
        <RiArrowDownLine className={styles.ico} aria-hidden />
        Move down
      </button>
      <div className={styles.sep} role="separator" />
      <button type="button" role="menuitem" className={styles.item} onClick={onDuplicate}>
        <RiFileCopyLine className={styles.ico} aria-hidden />
        Duplicate
      </button>
      <button
        type="button"
        role="menuitem"
        className={`${styles.item} ${styles.danger}`}
        onClick={onDelete}
      >
        <RiDeleteBinLine className={styles.ico} aria-hidden />
        Delete
      </button>
    </div>
  );
}
