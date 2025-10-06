import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface UploadContextType {
  file: File | null;
  setFile: (f: File | null) => void;
  preview: string | null;
  setPreview: (p: string | null) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <UploadContext.Provider value={{ file, setFile, preview, setPreview }}>
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
