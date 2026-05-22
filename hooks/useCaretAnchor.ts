'use client';
import { useCallback } from 'react';
import { getCaretRect } from '@/lib/caret';

export interface CaretAnchorPoint {
  top: number;
  left: number;
}

export function useCaretAnchor() {
  const computeAnchor = useCallback(
    (stepBody: HTMLElement, pickerHeight = 320): CaretAnchorPoint | null => {
      const rect = getCaretRect(stepBody);
      if (!rect) return null;
      const viewportBottom = window.innerHeight - 16;
      const wantedTop = rect.bottom + 4;
      if (wantedTop + pickerHeight > viewportBottom) {
        return { top: rect.top - pickerHeight - 4, left: rect.left };
      }
      return { top: wantedTop, left: rect.left };
    },
    [],
  );
  return { computeAnchor };
}
