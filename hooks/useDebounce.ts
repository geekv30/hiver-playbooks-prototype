'use client';
import { useEffect, useRef } from 'react';

export function useDebouncedEffect(callback: () => void, deps: React.DependencyList, delay: number) {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; }, [callback]);

  useEffect(() => {
    const id = window.setTimeout(() => cbRef.current(), delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
