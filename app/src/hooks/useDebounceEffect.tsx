import { useEffect, type DependencyList } from 'react';

export function useDebounceEffect(
  fn: () => void | Promise<void>,
  waitTime: number,
  deps: DependencyList = []
) {
  useEffect(() => {
    const t = setTimeout(() => {
      fn();
    }, waitTime);

    return () => {
      clearTimeout(t);
    };
  }, deps);
}
