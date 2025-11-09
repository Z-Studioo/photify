import { fetchInches, fetchRatios } from '@/utils/ratio-sizes';
import { useQuery } from '@tanstack/react-query';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set, del } from 'idb-keyval';

export type CanvasShape =
  | 'rectangle'
  | 'round'
  | 'hexagon'
  | 'octagon'
  | 'dodecagon';

export type EdgeType = 'wrapped' | 'mirrored';

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
  originalPreview: string;
  version: number;
}

interface Metadata {
  selectedRatio?: string | null;
  selectedSize?: SizeData | null;
  shape?: CanvasShape;
  quality?: number[] | null;
  edgeType?: EdgeType;
}

interface UploadContextType {
  file: File | null;
  setFile: (f: File | null) => void;
  preview: string | null;
  setPreview: (p: string | null) => void;
  originalPreview: string | null;
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
  committedRatio: string | null;
  committedSize: SizeData | null;
  pendingRatio: string | null;
  setPendingRatio: (r: string | null) => void;
  pendingSize: SizeData | null;
  setPendingSize: (s: SizeData | null) => void;
  quality: number[];
  setQuality: (q: number[]) => void;
  pendingQuality: number[] | null;
  setPendingQuality: (q: number[]) => void;
  edgeType: EdgeType;
  setEdgeType: (type: EdgeType) => void;
  pendingEdgeType: EdgeType | null;
  setPendingEdgeType: (type: EdgeType) => void;
  applyPendingChanges: () => void;
  cancelPendingCropChanges: () => void;
  reset: () => Promise<void>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);
const CURRENT_VERSION = 1;

export const UploadProvider = ({ children }: { children: React.ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [shape, setShape] = useState<CanvasShape>('rectangle');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeData | null>(null);
  const [committedRatio, setCommittedRatio] = useState<string | null>(null);
  const [committedSize, setCommittedSize] = useState<SizeData | null>(null);
  const [pendingRatio, setPendingRatio] = useState<string | null>(null);
  const [pendingSize, setPendingSize] = useState<SizeData | null>(null);
  const [quality, setQuality] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedMeta = localStorage.getItem('photify_metadata');
        if (storedMeta) {
          const meta: Metadata = JSON.parse(storedMeta);
          if (Array.isArray(meta.quality) && meta.quality.length > 0) {
            return meta.quality;
          }
        }
      } catch {
        // Ignore errors
      }
    }
    return [70];
  });
  const [pendingQuality, setPendingQuality] = useState<number[] | null>(null);
  
  // Edge type state
  const [edgeType, setEdgeType] = useState<EdgeType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedMeta = localStorage.getItem('photify_metadata');
        if (storedMeta) {
          const meta: Metadata = JSON.parse(storedMeta);
          if (meta.edgeType === 'wrapped' || meta.edgeType === 'mirrored') {
            return meta.edgeType;
          }
        }
      } catch {
        // Ignore errors
      }
    }
    return 'wrapped';
  });
  const [pendingEdgeType, setPendingEdgeType] = useState<EdgeType | null>(null);

  // === React Query hooks ===
  const { refetch: refetchRatios } = useQuery({
    queryKey: ['ratios'],
    queryFn: fetchRatios,
    enabled: false,
  });

  const { refetch: refetchInches } = useQuery({
    queryKey: ['inches'],
    queryFn: fetchInches,
    enabled: false,
  });

  // === Helpers ===
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

  // === Persist File using IndexedDB ===
  const persistFile = async (
    f: File | null,
    p: string | null,
    origP: string | null
  ) => {
    if (!f && !p) {
      await del('photify_uploaded_image');
      return;
    }

    const base64Data = f ? await fileToBase64(f) : null;
    if (!base64Data) return;

    const imageData: StoredImageData = {
      fileName: f?.name || 'unknown',
      fileType: f?.type || '',
      fileSize: f?.size || 0,
      base64Data,
      preview: p || base64Data,
      originalPreview: origP || base64Data,
      version: CURRENT_VERSION,
    };

    try {
      await set('photify_uploaded_image', imageData);
    } catch (err) {
      console.error('Failed to store image in IndexedDB', err);
    }
  };

  const persistMetadata = (meta: Metadata) => {
    try {
      localStorage.setItem('photify_metadata', JSON.stringify(meta));
    } catch (err) {
      console.error('Failed to persist metadata', err);
    }
  };

  // === Restore from IndexedDB + localStorage ===
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const restore = async () => {
      try {
        const data = (await get('photify_uploaded_image')) as
          | StoredImageData
          | undefined;
        if (data) {
          const restoredFile = base64ToFile(
            data.base64Data,
            data.fileName,
            data.fileType
          );
          setFile(restoredFile);
          setPreview(data.preview);
          setOriginalPreview(data.originalPreview || data.preview);
        }
      } catch (err) {
        console.error('Failed to restore from IndexedDB', err);
        await del('photify_uploaded_image');
      }

      // restore metadata
      try {
        const storedMeta = localStorage.getItem('photify_metadata');
        if (storedMeta) {
          const meta: Metadata = JSON.parse(storedMeta);
          console.log("meta is  ", meta)
          if (meta.selectedRatio) {
            setSelectedRatio(meta.selectedRatio);
            setCommittedRatio(meta.selectedRatio);
          }
          if (meta.selectedSize) {
            setSelectedSize(meta.selectedSize);
            setCommittedSize(meta.selectedSize);
          }
          if (meta.shape) setShape(meta.shape);
          if (meta.edgeType) setEdgeType(meta.edgeType);
        }
      } catch {
        localStorage.removeItem('photify_metadata');
      }
    };

    restore();
  }, []);

  // === Auto-persist file on change ===
  useEffect(() => {
    if (!file) return;
    (async () => {
      try {
        const base64Data = await fileToBase64(file);
        setOriginalPreview(base64Data);
        setPreview(base64Data);
        await persistFile(file, base64Data, base64Data);
      } catch (err) {
        console.error('Error persisting file', err);
      }
    })();
  }, [file]);

  // === Auto-persist metadata ===
  useEffect(() => {
    if(!selectedRatio || !selectedSize || !shape || !quality.length) return;
    persistMetadata({ selectedRatio, selectedSize, shape, quality, edgeType });
  }, [selectedRatio, selectedSize, shape, quality, edgeType]);

  // === Apply pending changes ===
  const applyPendingChanges = async () => {
    // Apply pending ratio and size if exists
    if (pendingRatio) {
      setSelectedRatio(pendingRatio);
      setCommittedRatio(pendingRatio);
      setPendingRatio(null);
    }
    if (pendingSize) {
      setSelectedSize(pendingSize);
      setCommittedSize(pendingSize);
      setPendingSize(null);
    }

    // Apply pending quality if exists
    if (pendingQuality) {
      setQuality(pendingQuality);
      setPendingQuality(null);
    }

    // Apply pending edge type if exists
    if (pendingEdgeType) {
      setEdgeType(pendingEdgeType);
      setPendingEdgeType(null);
    }

    // Apply pending file and preview
    if (pendingFile && pendingPreview) {
      setFile(pendingFile);
      setPreview(pendingPreview);
      const origToStore = originalPreview || pendingPreview;
      await persistFile(pendingFile, pendingPreview, origToStore);
      setPendingFile(null);
      setPendingPreview(null);
    }
  };

  // === Cancel pending crop changes ===
  const cancelPendingCropChanges = () => {
    // Revert to the last committed crop values
    if (committedRatio !== null) {
      setSelectedRatio(committedRatio);
    }
    if (committedSize !== null) {
      setSelectedSize(committedSize);
    }
    setPendingRatio(null);
    setPendingSize(null);
  };

  // === Reset ===
  const reset = async () => {
    console.log('🔄 Resetting and fetching latest ratios/sizes...');
    const [ratiosRes, inchesRes] = await Promise.all([
      refetchRatios(),
      refetchInches(),
    ]);
    const ratios = ratiosRes.data || [];
    const inches = inchesRes.data || [];

    if (ratios.length && inches.length) {
      const defaultRatio =
        ratios.find((r: any) => r.ratio === '1:1') || ratios[0];
      const available = inches
        .filter((inch: any) => defaultRatio.Inches.includes(inch._id))
        .sort(
          (a: SizeData, b: SizeData) => a.width * a.height - b.width * b.height
        );
      const smallest = available[0] || null;

      if (defaultRatio && smallest) {
        setSelectedRatio(defaultRatio.ratio);
        setSelectedSize(smallest);
        setCommittedRatio(defaultRatio.ratio);
        setCommittedSize(smallest);
      }
    }

    setPendingFile(null);
    setPendingPreview(null);
    setPendingRatio(null);
    setPendingSize(null);
    setPendingEdgeType(null);
    setShape('rectangle');
    setQuality([70]);
    setEdgeType('wrapped');

    if (file) {
      const base64 = await fileToBase64(file);
      setPreview(base64);
    } else {
      setPreview(null);
      setOriginalPreview(null);
      await del('photify_uploaded_image');
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
        committedRatio,
        committedSize,
        pendingRatio,
        setPendingRatio,
        pendingSize,
        setPendingSize,
        applyPendingChanges,
        cancelPendingCropChanges,
        reset,
        quality,
        setQuality,
        pendingQuality,
        setPendingQuality,
        edgeType,
        setEdgeType,
        pendingEdgeType,
        setPendingEdgeType,
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