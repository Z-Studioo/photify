import { createContext, useContext, useRef, type ReactNode } from 'react';

export type InitialData = Record<string, unknown> | undefined;

const InitialDataContext = createContext<InitialData>(undefined);

interface InitialDataProviderProps {
  value?: InitialData;
  children: ReactNode;
}

export function InitialDataProvider({
  value,
  children,
}: InitialDataProviderProps) {
  const valueRef = useRef<InitialData>(value);

  if (valueRef.current === undefined && typeof window !== 'undefined') {
    const w = window as unknown as { __INITIAL_DATA__?: InitialData };
    if (w.__INITIAL_DATA__ !== undefined) {
      valueRef.current = w.__INITIAL_DATA__;
    }
  }

  return (
    <InitialDataContext.Provider value={valueRef.current}>
      {children}
    </InitialDataContext.Provider>
  );
}

/**
 * Read SSR-provided initial data for the current route.
 * Returns undefined on client-side navigations (so components should
 * fall back to fetching themselves).
 */
export function useInitialData<T = unknown>(key?: string): T | undefined {
  const data = useContext(InitialDataContext);
  if (!data) return undefined;

  if (key) {
    return (data as Record<string, unknown>)[key] as T | undefined;
  }

  return data as unknown as T;
}

/**
 * Consume initial data exactly once. After the first read on the client,
 * subsequent calls return undefined so that client-side navigations
 * refetch fresh data rather than reusing stale SSR payloads.
 */
export function useConsumedInitialData<T = unknown>(
  key: string
): T | undefined {
  const data = useContext(InitialDataContext);
  const consumedRef = useRef(false);

  if (consumedRef.current) return undefined;
  consumedRef.current = true;

  if (!data) return undefined;
  return (data as Record<string, unknown>)[key] as T | undefined;
}
