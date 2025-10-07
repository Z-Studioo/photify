import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type CanvasShape = 'rectangle' | 'round' | 'hexagon' | 'octagon' | 'dodecagon';

interface UploadContextType {
  file: File | null;
  setFile: (f: File | null) => void;
  preview: string | null;
  setPreview: (p: string | null) => void;
  shape: CanvasShape;
  setShape: (s: CanvasShape) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [shape, setShape] = useState<CanvasShape>('rectangle');

  return (
    <UploadContext.Provider value={{ file, setFile, preview, setPreview, shape, setShape }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUpload must be used within UploadProvider');
  return ctx;
};

export default UploadContext;
