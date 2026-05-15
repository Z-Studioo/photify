import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type EdgeType = 'wrapped' | 'mirrored';

interface EdgeContextType {
  edgeType: EdgeType;
  setEdgeType: (type: EdgeType) => void;
  pendingEdgeType: EdgeType | null;
  setPendingEdgeType: (type: EdgeType) => void;
  applyPendingEdgeType: () => void;
  cancelPendingEdgeType: () => void;
  reset: () => void;
}

const EdgeContext = createContext<EdgeContextType | undefined>(undefined);

export const EdgeProvider = ({ children }: { children: ReactNode }) => {
  // SSR-safe defaults; localStorage is read in the post-mount effect below.
  const [edgeType, setEdgeType] = useState<EdgeType>('wrapped');
  const [pendingEdgeType, setPendingEdgeType] = useState<EdgeType | null>(null);
  const [committedEdgeType, setCommittedEdgeType] =
    useState<EdgeType>('wrapped');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedMeta = localStorage.getItem('photify_metadata');
      if (storedMeta) {
        const meta = JSON.parse(storedMeta);
        if (meta.edgeType === 'wrapped' || meta.edgeType === 'mirrored') {
          setEdgeType(meta.edgeType);
          setCommittedEdgeType(meta.edgeType);
        }
      }
    } catch {
      // Ignore parse errors; fall back to default.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const storedMeta = localStorage.getItem('photify_metadata');
      const currentMeta = storedMeta ? JSON.parse(storedMeta) : {};

      const updatedMeta = {
        ...currentMeta,
        edgeType: edgeType,
      };

      localStorage.setItem('photify_metadata', JSON.stringify(updatedMeta));
    } catch {
      // Storage disabled or quota exceeded — non-fatal.
    }
  }, [edgeType, hydrated]);

  const applyPendingEdgeType = () => {
    if (pendingEdgeType) {
      setEdgeType(pendingEdgeType);
      setCommittedEdgeType(pendingEdgeType);
      setPendingEdgeType(null);
    }
  };

  const cancelPendingEdgeType = () => {
    setEdgeType(committedEdgeType);
    setPendingEdgeType(null);
  };

  const reset = () => {
    setEdgeType('wrapped');
    setCommittedEdgeType('wrapped');
    setPendingEdgeType(null);
  };

  return (
    <EdgeContext.Provider
      value={{
        edgeType,
        setEdgeType,
        pendingEdgeType,
        setPendingEdgeType,
        applyPendingEdgeType,
        cancelPendingEdgeType,
        reset,
      }}
    >
      {children}
    </EdgeContext.Provider>
  );
};

export const useEdge = () => {
  const ctx = useContext(EdgeContext);
  if (!ctx) throw new Error('useEdge must be used within EdgeProvider');
  return ctx;
};

export default EdgeContext;
