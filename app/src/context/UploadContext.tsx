import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type CanvasShape =
  | 'rectangle'
  | 'round'
  | 'hexagon'
  | 'octagon'
  | 'dodecagon';

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
  originalPreview: string; // NEW: Store original unoptimized preview
  version: number;
}

interface Metadata {
  selectedRatio?: string | null;
  selectedSize?: SizeData | null;
  shape?: CanvasShape;
  quality?: number[] | null;
}

interface UploadContextType {
  file: File | null;
  setFile: (f: File | null) => void;
  preview: string | null;
  setPreview: (p: string | null) => void;
  originalPreview: string | null; // NEW: Original unoptimized preview
  setOriginalPreview: (p: string | null) => void;
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
  quality: number[];
  setQuality: (q: number[]) => void;
  applyPendingChanges: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null); // NEW: Store original
  const [shape, setShape] = useState<CanvasShape>('rectangle');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeData | null>(null);
  // CHANGED: Initialize quality from localStorage
  const [quality, setQuality] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const storedMeta = localStorage.getItem('photify_metadata');
      if (storedMeta) {
        try {
          const meta: Metadata = JSON.parse(storedMeta);
          if (meta.quality && Array.isArray(meta.quality) && meta.quality.length > 0) {
            return meta.quality;
          }
        } catch {
          // Fall through to default
        }
      }
    }
    return [70]; // Default fallback
  });

  // Helpers
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const base64ToFile = (
    base64Data: string,
    name: string,
    type: string
  ): File => {
    const byteChars = atob(base64Data.split(',')[1]);
    const byteArray = Uint8Array.from([...byteChars].map(c => c.charCodeAt(0)));
    return new File([byteArray], name, { type });
  };

  // Persist file (only when image changes)
  const persistFile = async (f: File | null, p: string | null, origP: string | null) => {
    if (!f && !p) {
      localStorage.removeItem('photify_uploaded_image');
      return;
    }

    const base64Data = p || (f ? await fileToBase64(f) : null);
    if (!base64Data) return;

    const imageData: StoredImageData = {
      fileName: f?.name || 'unknown',
      fileType: f?.type || '',
      fileSize: f?.size || 0,
      base64Data,
      preview: base64Data,
      originalPreview: origP || base64Data, // Store original
      version: 1,
    };
    localStorage.setItem('photify_uploaded_image', JSON.stringify(imageData));
  };

  // Persist metadata (ratio, size, shape, quality)
  const persistMetadata = (meta: Metadata) => {
    localStorage.setItem('photify_metadata', JSON.stringify(meta));
  };

  // Restore from localStorage
  useEffect(() => {
    // Image restore
    const storedImage = localStorage.getItem('photify_uploaded_image');
    if (storedImage) {
      try {
        const data: StoredImageData = JSON.parse(storedImage);
        const restoredFile = base64ToFile(
          data.base64Data,
          data.fileName,
          data.fileType
        );
        setFile(restoredFile);
        setPreview(data.preview);
        setOriginalPreview(data.originalPreview || data.preview); // Restore original or fallback
      } catch {
        localStorage.removeItem('photify_uploaded_image');
      }
    }

    // Metadata restore (quality is now handled in useState initialization above)
    const storedMeta = localStorage.getItem('photify_metadata');
    if (storedMeta) {
      try {
        const meta: Metadata = JSON.parse(storedMeta);
        if (meta.selectedRatio) setSelectedRatio(meta.selectedRatio);
        if (meta.selectedSize) setSelectedSize(meta.selectedSize);
        if (meta.shape) setShape(meta.shape);
        // REMOVED: Quality restoration from here since it's now in useState initialization
      } catch {
        localStorage.removeItem('photify_metadata');
      }
    }
  }, []);

  // Auto-persist when metadata changes
  useEffect(() => {
    persistMetadata({ selectedRatio, selectedSize, shape, quality });
  }, [selectedRatio, selectedSize, shape, quality]);

  const setFileWithPersistence = async (f: File | null, p: string | null) => {
    setFile(f);
    setPreview(p);
    // When setting a new file, also set it as original (unless we already have an original)
    if (p && !originalPreview) {
      setOriginalPreview(p);
    }
    await persistFile(f, p, originalPreview || p);
  };

  const applyPendingChanges = () => {
    if (pendingFile && pendingPreview) {
      setFile(pendingFile);
      setPreview(pendingPreview);
      // Don't update originalPreview - keep the original!
      // Use originalPreview if available, otherwise use pendingPreview as fallback
      const origToStore = originalPreview || pendingPreview;
      persistFile(pendingFile, pendingPreview, origToStore);
      setPendingFile(null);
      setPendingPreview(null);
    }
  };

  return (
    <UploadContext.Provider
      value={{
        file,
        setFile,
        preview,
        setPreview,
        originalPreview,
        setOriginalPreview,
        shape,
        setShape,
        pendingFile,
        setPendingFile,
        pendingPreview,
        setPendingPreview,
        selectedRatio,
        setSelectedRatio,
        selectedSize,
        setSelectedSize,
        applyPendingChanges,
        quality,
        setQuality,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUpload must be used within UploadProvider');
  return ctx;
};