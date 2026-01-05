import React, {
  createContext,
  useContext,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';
import {
  createFinalUploadData,
  validatePhotifyFile,
  type JsonExportData,
} from '@/utils/uploadHandler';
import { applyImportedConfiguration } from '@/utils/applyImportedConfiguration';
import { useUpload } from '@/context/UploadContext';
import { useToast } from '@/components/shared/common/toast';

interface ImportSummary {
  isValid: boolean;
  fileName: string;
  fileSize: string;
  hasImage: boolean;
  frameSize: string;
  frameRatio: string;
  edgeType: string;
  quantity: number;
  totalPrice: number;
  error?: string;
}

interface PresetContextType {
  isExporting: boolean;
  exportConfiguration: () => Promise<void>;

  isImporting: boolean;
  importModalOpen: boolean;
  importSummary: ImportSummary | null;
  pendingImportData: JsonExportData | null;

  handleImportFile: () => void;
  confirmImport: () => Promise<void>;
  cancelImport: () => void;
  handleReUpload: () => void;
  setImportModalOpen: (open: boolean) => void;
}

const PresetContext = createContext<PresetContextType | undefined>(undefined);

export const PresetProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null
  );
  const [pendingImportData, setPendingImportData] =
    useState<JsonExportData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const uploadContext = useUpload();
  const { addToast } = useToast();

  const exportConfiguration = async () => {
    setIsExporting(true);
    try {
      const exportData = await createFinalUploadData();

      if (!exportData) {
        alert(
          'No configuration data found. Please set up your frame settings first.'
        );
        return;
      }

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `frame-configuration-${timestamp}.json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      alert('Error exporting configuration data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleReUpload = () => {
    setImportModalOpen(false);
    setImportSummary(null);
    setPendingImportData(null);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const processFile = async (file: File) => {
    setIsImporting(true);
    try {
      const fileContent = await readFileAsText(file);
      const validation = validatePhotifyFile(fileContent);

      const summary: ImportSummary = {
        isValid: validation.isValid,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        hasImage: validation.data?.image
          ? validation.data.image.startsWith('data:image/')
          : false,
        frameSize: validation.data?.inches || '',
        frameRatio: validation.data?.ratio || '',
        edgeType: validation.data?.edgeType || '',
        quantity: validation.data?.quantity || 1,
        totalPrice: validation.data?.totalPriceAfterDiscount || 0,
        error: validation.error,
      };

      setImportSummary(summary);
      setPendingImportData(validation.data || null);
      setImportModalOpen(true);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error reading file. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const confirmImport = async () => {
    if (!pendingImportData) return;

    setIsImporting(true);
    try {
      const result = await applyImportedConfiguration(pendingImportData);

      if (!result.success) {
        throw new Error(
          result.error || 'Failed to apply imported configuration'
        );
      }

      if (result.file && result.preview) {
        uploadContext.setFile(result.file);
        uploadContext.setPreview(result.preview);
      }

      if (result.ratio) {
        uploadContext.setSelectedRatio(result.ratio);
      }

      if (result.size) {
        uploadContext.setSelectedSize(result.size);
      }

      uploadContext.setQuality(result.quality);
      uploadContext.setEdgeType(result.edgeType);
      uploadContext.setQuantity(result.quantity);

      setImportModalOpen(false);
      setImportSummary(null);
      setPendingImportData(null);

      addToast('Configuration imported successfully!', 'success');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error importing configuration. Please try again.';
      addToast(errorMessage, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const cancelImport = () => {
    setImportModalOpen(false);
    setImportSummary(null);
    setPendingImportData(null);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  React.useEffect(() => {
    const handleFileInputChange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        processFile(file);
        (event.target as HTMLInputElement).value = '';
      }
    };

    const currentRef = fileInputRef.current;
    if (currentRef) {
      currentRef.addEventListener('change', handleFileInputChange);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('change', handleFileInputChange);
      }
    };
  }, []);

  const value: PresetContextType = {
    isExporting,
    exportConfiguration,
    isImporting,
    importModalOpen,
    importSummary,
    pendingImportData,
    handleImportFile,
    confirmImport,
    cancelImport,
    handleReUpload,
    setImportModalOpen,
  };

  return (
    <PresetContext.Provider value={value}>
      <input
        type='file'
        ref={fileInputRef}
        accept='.json,application/json'
        style={{ display: 'none' }}
      />
      {children}
    </PresetContext.Provider>
  );
};

export const usePreset = () => {
  const context = useContext(PresetContext);
  if (context === undefined) {
    throw new Error('usePreset must be used within a PresetProvider');
  }
  return context;
};
