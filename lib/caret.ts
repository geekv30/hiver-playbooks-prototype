export interface CaretRect {
  top: number;
  left: number;
  bottom: number;
  height: number;
}

export function getCaretRect(stepBody: HTMLElement): CaretRect | null {
  if (typeof window === 'undefined') return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  let rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    rect = stepBody.getBoundingClientRect();
  }
  return { top: rect.top, left: rect.left, bottom: rect.bottom, height: rect.height || 20 };
}
