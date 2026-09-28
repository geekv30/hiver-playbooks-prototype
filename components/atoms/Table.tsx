'use client';

import type { MouseEvent, ReactNode } from 'react';
import styles from './Table.module.css';

export interface TableColumn<R> {
  id: string;
  /** Visible header label. Leave empty for a column that is only controls. */
  header?: ReactNode;
  /** Screen-reader header for a column with no visible label (row actions). */
  srHeader?: string;
  /** The one column that takes the leftover width and wraps. Every other column
   *  sizes to its content and never wraps, so values stay on one line. */
  grow?: boolean;
  /** A controls column: tighter vertical padding so a 32px button sits in 56. */
  actions?: boolean;
  cell: (row: R) => ReactNode;
}

interface Props<R> {
  ariaLabel: string;
  columns: TableColumn<R>[];
  rows: R[];
  rowKey: (row: R) => string;
  /** Whole-row click. Clicks on a link or button inside the row are left to
   *  that control, so a cell can hold its own action without stopPropagation. */
  onRowClick?: (row: R) => void;
  /** Shown under the header when there are no rows. */
  empty?: ReactNode;
}

/**
 * Table - the Skills-ai DLS table (Figma 3535:86229): white frame, 16px radius,
 * #fafafa 44px header, 56px rows on #eee hairlines, 24px cell gutters. One
 * renderer for every list of records; pages supply columns and cells.
 */
export default function Table<R>({ ariaLabel, columns, rows, rowKey, onRowClick, empty }: Props<R>) {
  const onClick = (row: R) => (e: MouseEvent<HTMLTableRowElement>) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    onRowClick?.(row);
  };

  return (
    <div className={styles.frame}>
      <table className={styles.table} aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.id}
                scope="col"
                className={styles.th}
                data-grow={c.grow || undefined}
                data-actions={c.actions || undefined}
              >
                {c.header ?? (c.srHeader ? <span className={styles.srOnly}>{c.srHeader}</span> : null)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && empty ? (
            <tr>
              <td className={styles.emptyCell} colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={styles.tr}
                data-clickable={onRowClick ? true : undefined}
                onClick={onRowClick ? onClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.id}
                    className={styles.td}
                    data-grow={c.grow || undefined}
                    data-actions={c.actions || undefined}
                  >
                    {c.grow ? <div className={styles.growInner}>{c.cell(row)}</div> : c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
