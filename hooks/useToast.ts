'use client';
import { useCallback, useState } from 'react';
import { newId } from '@/lib/ids';

export interface ToastItem {
  id: string;
  message: string;
  variant: 'default' | 'success' | 'warn';
  createdAt: number;
}

export function useToast(durationMs = 3200) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback(
    (message: string, variant: ToastItem['variant'] = 'default') => {
      const id = newId('toast');
      const item: ToastItem = { id, message, variant, createdAt: Date.now() };
      setItems((prev) => [...prev, item]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
    },
    [durationMs],
  );

  return { items, push };
}
