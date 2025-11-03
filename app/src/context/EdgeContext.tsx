import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type EdgeType = 'wrapped' | 'mirrored';

interface EdgeContextType {
  edgeType: EdgeType;
  setEdgeType: (type: EdgeType) => void;
  reset: () => void;
}

const EdgeContext = createContext<EdgeContextType | undefined>(undefined);

export const EdgeProvider = ({ children }: { children: ReactNode }) => {
  const [edgeType, setEdgeType] = useState<EdgeType>('wrapped');
  const reset = () => {
    setEdgeType('wrapped');
  };
  return (
    <EdgeContext.Provider value={{ edgeType, setEdgeType, reset }}>
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
