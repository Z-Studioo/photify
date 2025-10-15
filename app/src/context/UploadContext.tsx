import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type CanvasShape = 'rectangle' | 'round' | 'hexagon' | 'octagon' | 'dodecagon';

export interface SizeData {
  _id: string;
  width: number;
  height: number;
  w: number;
  h: number;
  Slug: string;
  sell_price: number;
  actual_price: number;
}

interface StoredImageData {
  fileName: string;
  fileType: string;
  fileSize: number;
  base64Data: string;
  preview: string;
}

interface UploadContextType {
  file: File | null;
  setFile: (f: File | null) => void;
  preview: string | null;
  setPreview: (p: string | null) => void;
  shape: CanvasShape;
  setShape: (s: CanvasShape) => void;
  pendingFile: File | null;
  setPendingFile: (f: File | null) => void;
  pendingPreview: string | null;
  setPendingPreview: (p: string | null) => void;
  selectedRatio: string | null;
  setSelectedRatio: (r: string | null) => void;
  selectedSize: SizeData | null;
  setSelectedSize: (s: SizeData | null) => void;
  applyPendingChanges: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [shape, setShape] = useState<CanvasShape>('rectangle');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeData | null>(null);

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Helper function to convert base64 to File
  const base64ToFile = (base64Data: string, fileName: string, fileType: string): File => {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], fileName, { type: fileType });
  };

  // Enhanced setFile function that persists to localStorage
  const setFileWithPersistence = async (f: File | null) => {
    setFile(f);
    
    if (f) {
      try {
        const base64Data = await fileToBase64(f);
        const imageData: StoredImageData = {
          fileName: f.name,
          fileType: f.type,
          fileSize: f.size,
          base64Data,
          preview: base64Data
        };
        localStorage.setItem('photify_uploaded_image', JSON.stringify(imageData));
        setPreview(base64Data);
      } catch (error) {
        console.error('Error storing image:', error);
      }
    } else {
      localStorage.removeItem('photify_uploaded_image');
      setPreview(null);
    }
  };

  // Restore image from localStorage on component mount
  useEffect(() => {
    const storedImageData = localStorage.getItem('photify_uploaded_image');
    if (storedImageData) {
      try {
        const imageData: StoredImageData = JSON.parse(storedImageData);
        const restoredFile = base64ToFile(
          imageData.base64Data,
          imageData.fileName,
          imageData.fileType
        );
        setFile(restoredFile);
        setPreview(imageData.preview);
      } catch (error) {
        console.error('Error restoring image:', error);
        localStorage.removeItem('photify_uploaded_image');
      }
    }
  }, []);

  const applyPendingChanges = () => {
    if (pendingFile && pendingPreview) {
      setFileWithPersistence(pendingFile);
      setPendingFile(null);
      setPendingPreview(null);
    }
  };

  return (
    <UploadContext.Provider value={{ 
      file, setFile: setFileWithPersistence, preview, setPreview, shape, setShape,
      pendingFile, setPendingFile, pendingPreview, setPendingPreview,
      selectedRatio, setSelectedRatio, selectedSize, setSelectedSize,
      applyPendingChanges
    }}>
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
