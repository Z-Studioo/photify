// contexts/FeatureContext.tsx
'use client';
import { createContext, useContext, useState } from 'react';

import type { ReactNode } from 'react';

interface Feature {
  id: number;
  name: string;
  subtitle: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  step: number;
  component: string | null;
}

interface FeatureContextType {
  selectedFeature: Feature | null;
  setSelectedFeature: (feature: Feature | null) => void;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const FeatureProvider = ({ children }: { children: ReactNode }) => {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  return (
    <FeatureContext.Provider value={{ selectedFeature, setSelectedFeature }}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeature = () => {
  const context = useContext(FeatureContext);
  if (!context)
    throw new Error('useFeature must be used within FeatureProvider');
  return context;
};
