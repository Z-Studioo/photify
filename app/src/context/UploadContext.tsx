import {
  fetchRatios,
  getAllPrintSizes,
  type InchData,
  type RatioData,
} from '@/utils/ratio-sizes';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set, del } from 'idb-keyval';
import type { Product } from '@/lib/data';

export type CanvasShape =
  | 'rectangle'
  | 'round'
  | 'hexagon'
  | 'octagon'
  | 'dodecagon';

export type EdgeType = 'wrapped' | 'mirrored';

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
  selectedSize?: InchData | null;
  shape?: CanvasShape;
  quality?: number[] | null;
  edgeType?: EdgeType;
  quantity?: number;
}

interface UploadContextType {
  selectedProduct?: Product | null;
  setSelectedProduct: (p: Product | null) => void;
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
  selectedSize: InchData | null;
  setSelectedSize: (s: InchData | null) => void;
  committedRatio: string | null;
  committedSize: InchData | null;
  pendingRatio: string | null;
  setPendingRatio: (r: string | null) => void;
  pendingSize: InchData | null;
  setPendingSize: (s: InchData | null) => void;
  quality: number[];
  setQuality: (q: number[]) => void;
  pendingQuality: number[] | null;
  setPendingQuality: (q: number[]) => void;
  edgeType: EdgeType;
  setEdgeType: (type: EdgeType) => void;
  pendingEdgeType: EdgeType | null;
  setPendingEdgeType: (type: EdgeType) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  pendingQuantity: number | null;
  setPendingQuantity: (q: number) => void;
  applyPendingChanges: () => void;
  cancelPendingCropChanges: () => void;
  reset: () => Promise<void>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);
const CURRENT_VERSION = 1;

const getStoredMetadata = (): Partial<Metadata> => {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem('photify_metadata');
    if (!stored) return {};

    const parsed = JSON.parse(stored);

    return {
      selectedRatio:
        typeof parsed.selectedRatio === 'string'
          ? parsed.selectedRatio
          : undefined,
      selectedSize:
        parsed.selectedSize &&
        typeof parsed.selectedSize === 'object' &&
        typeof parsed.selectedSize._id === 'string' &&
        typeof parsed.selectedSize.width === 'number' &&
        typeof parsed.selectedSize.height === 'number'
          ? (parsed.selectedSize as InchData)
          : undefined,
      shape: ['rectangle', 'round', 'hexagon', 'octagon', 'dodecagon'].includes(
        parsed.shape
      )
        ? (parsed.shape as CanvasShape)
        : undefined,
      quality:
        Array.isArray(parsed.quality) &&
        parsed.quality.every((n: unknown) => typeof n === 'number')
          ? parsed.quality
          : undefined,
      edgeType:
        parsed.edgeType === 'wrapped' || parsed.edgeType === 'mirrored'
          ? parsed.edgeType
          : undefined,
      quantity:
        typeof parsed.quantity === 'number' && parsed.quantity > 0
          ? parsed.quantity
          : undefined,
    };
  } catch (error) {
    console.error('Error getting stored metadata:', error);
    localStorage.removeItem('photify_metadata');
    return {};
  }
};

const persistMetadata = (meta: Metadata): void => {
  try {
    localStorage.setItem('photify_metadata', JSON.stringify(meta));
  } catch (error) {
    console.error('Error persisting metadata:', error);
  }
};

export const UploadProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [shape, setShape] = useState<CanvasShape>('rectangle');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<InchData | null>(null);
  const [committedRatio, setCommittedRatio] = useState<string | null>(null);
  const [committedSize, setCommittedSize] = useState<InchData | null>(null);
  const [pendingRatio, setPendingRatio] = useState<string | null>(null);
  const [pendingSize, setPendingSize] = useState<InchData | null>(null);

  const [quality, setQuality] = useState<number[]>(
    () => getStoredMetadata().quality || [70]
  );
  const [pendingQuality, setPendingQuality] = useState<number[] | null>(null);

  const [edgeType, setEdgeType] = useState<EdgeType>(
    () => getStoredMetadata().edgeType || 'wrapped'
  );
  const [pendingEdgeType, setPendingEdgeType] = useState<EdgeType | null>(null);

  const [quantity, setQuantity] = useState<number>(
    () => getStoredMetadata().quantity || 1
  );
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);

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
    } catch (error) {
      console.error('Error storing image in IndexedDB:', error);
    }
  };

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
      } catch (error) {
        console.error('Error restoring from IndexedDB:', error);
        await del('photify_uploaded_image');
      }

      const metadata = getStoredMetadata();
      if (metadata.selectedRatio) {
        setSelectedRatio(metadata.selectedRatio);
        setCommittedRatio(metadata.selectedRatio);
      }
      if (metadata.selectedSize) {
        setSelectedSize(metadata.selectedSize);
        setCommittedSize(metadata.selectedSize);
      }
      if (metadata.shape) setShape(metadata.shape);
      if (metadata.edgeType) setEdgeType(metadata.edgeType);
      if (metadata.quantity) setQuantity(metadata.quantity);
    };

    restore();
  }, []);

  useEffect(() => {
    if (!file) return;

    (async () => {
      try {
        const base64Data = await fileToBase64(file);
        setOriginalPreview(base64Data);
        setPreview(base64Data);
        await persistFile(file, base64Data, base64Data);
      } catch (error) {
        console.error('Error persisting file:', error);
      }
    })();
  }, [file]);

  useEffect(() => {
    if (!selectedRatio || !selectedSize || !shape || !quality.length) return;

    persistMetadata({
      selectedRatio,
      selectedSize,
      shape,
      quality,
      edgeType,
      quantity,
    });
  }, [selectedRatio, selectedSize, shape, quality, edgeType, quantity]);

  const applyPendingChanges = async () => {
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

    if (pendingQuality) {
      setQuality(pendingQuality);
      setPendingQuality(null);
    }

    if (pendingEdgeType) {
      setEdgeType(pendingEdgeType);
      setPendingEdgeType(null);
    }

    if (pendingQuantity !== null) {
      setQuantity(pendingQuantity);
      setPendingQuantity(null);
    }

    if (pendingFile && pendingPreview) {
      setFile(pendingFile);
      setPreview(pendingPreview);
      const origToStore = originalPreview || pendingPreview;
      await persistFile(pendingFile, pendingPreview, origToStore);
      setPendingFile(null);
      setPendingPreview(null);
    }
  };

  const cancelPendingCropChanges = () => {
    if (committedRatio !== null) {
      setSelectedRatio(committedRatio);
    }
    if (committedSize !== null) {
      setSelectedSize(committedSize);
    }
    setPendingRatio(null);
    setPendingSize(null);
  };

  const reset = async () => {
    const [ratios] = await Promise.all([fetchRatios()]);
    const inches = getAllPrintSizes(ratios);

    if (ratios.length && inches.length) {
      const defaultRatio =
        ratios.find((r: RatioData) => r.label === '1:1') || ratios[0];
      const available = inches
        .filter((inch: InchData) => defaultRatio.sizes.includes(inch))
        .sort(
          (a: InchData, b: InchData) =>
            a.width_in * a.height_in - b.width_in * b.height_in
        );
      const smallest = available[0] || null;

      if (defaultRatio && smallest) {
        setSelectedRatio(defaultRatio.label);
        setSelectedSize(smallest);
        setCommittedRatio(defaultRatio.label);
        setCommittedSize(smallest);
      }
    }

    setPendingFile(null);
    setPendingPreview(null);
    setPendingRatio(null);
    setPendingSize(null);
    setPendingEdgeType(null);
    setPendingQuantity(null);
    setShape('rectangle');
    setQuality([70]);
    setEdgeType('wrapped');
    setQuantity(1);

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
        selectedProduct,
        setSelectedProduct,
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
        quantity,
        setQuantity,
        pendingQuantity,
        setPendingQuantity,
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
