'use client';
import { useEffect, useRef } from 'react';

export function useGlobalShortcut(predicate: (e: KeyboardEvent) => boolean, handler: (e: KeyboardEvent) => void) {
  const handlerRef = useRef(handler);
  useEffect(() => { handlerRef.current = handler; }, [handler]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (predicate(e)) handlerRef.current(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [predicate]);
}
