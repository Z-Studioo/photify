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
const EDGE_STORAGE_KEY = 'photify_edge_type';

export const EdgeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage
  const [edgeType, setEdgeType] = useState<EdgeType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(EDGE_STORAGE_KEY);
        if (stored === 'wrapped' || stored === 'mirrored') {
          return stored;
        }
      } catch {
        // Ignore errors
      }
    }
    return 'wrapped';
  });

  const [pendingEdgeType, setPendingEdgeType] = useState<EdgeType | null>(null);
  const [committedEdgeType, setCommittedEdgeType] = useState<EdgeType>(edgeType);

  // Persist to localStorage whenever edgeType changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(EDGE_STORAGE_KEY, edgeType);
      } catch {
        // Ignore errors
      }
    }
  }, [edgeType]);
  
  const applyPendingEdgeType = () => {
    if (pendingEdgeType) {
      setEdgeType(pendingEdgeType);
      setCommittedEdgeType(pendingEdgeType);
      setPendingEdgeType(null);
    }
  };

  const cancelPendingEdgeType = () => {
    // Revert to the last committed edge type
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
        reset 
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
