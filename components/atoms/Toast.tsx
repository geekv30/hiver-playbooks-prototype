'use client';
import type { ToastItem } from '@/hooks/useToast';
import styles from './Toast.module.css';

export function ToastStack({ items }: { items: ToastItem[] }) {
  return (
    <div className={styles.stack} role="status" aria-live="polite">
      {items.map((t) => {
        const variantCls = t.variant === 'success' ? styles.success : t.variant === 'warn' ? styles.warn : '';
        return (
          <div key={t.id} className={`${styles.toast} ${variantCls}`}>{t.message}</div>
        );
      })}
    </div>
  );
}
