import React, { useState, useEffect } from 'react';
import { AlertCircle, HardDrive, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MyPhotos from '@/components/shared/dashboard/MyPhotos';
import { useUpload } from '@/context/UploadContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
  base64?: string;
}

interface SelectPhotoProps {
  onPhotoSelected?: (file: File) => void;
}

const SelectPhoto: React.FC<SelectPhotoProps> = ({ onPhotoSelected }) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [duplicateAlert, setDuplicateAlert] = useState<{
    show: boolean;
    files: string[];
  }>({ show: false, files: [] });
  const [storageAlert, setStorageAlert] = useState<{
    show: boolean;
    type: 'warning' | 'error';
    message: string;
    usedSize: string;
    maxSize: string;
  } | null>(null);
  const { setPendingFile, setPendingPreview, applyPendingChanges } =
    useUpload();

  const STORAGE_KEY = 'photify_uploaded_images';
  const MAX_STORAGE_SIZE = 8 * 1024 * 1024; // 8MB in bytes
  const WARNING_THRESHOLD = 0.8; // Warn at 80% usage

  const getLocalStorageSize = (): number => {
    let total = 0;
    for (const key in localStorage) {
      // eslint-disable-next-line no-prototype-builtins
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }
    return total * 2; // Convert to bytes
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Check storage size and show alerts if needed
   * Returns false if storage is full (error state), true otherwise
   */
  const checkStorageSize = (showWarnings: boolean = true): boolean => {
    const currentSize = getLocalStorageSize();
    const usagePercentage = currentSize / MAX_STORAGE_SIZE;

    if (currentSize >= MAX_STORAGE_SIZE) {
      setStorageAlert({
        show: true,
        type: 'error',
        message:
          'Storage limit exceeded! Please delete some photos to free up space.',
        usedSize: formatBytes(currentSize),
        maxSize: formatBytes(MAX_STORAGE_SIZE),
      });
      return false;
    } else if (showWarnings && usagePercentage >= WARNING_THRESHOLD) {
      setStorageAlert({
        show: true,
        type: 'warning',
        message: 'Storage is running low. Consider deleting unused photos.',
        usedSize: formatBytes(currentSize),
        maxSize: formatBytes(MAX_STORAGE_SIZE),
      });
      return true;
    }
    return true;
  };

  /**
   * Estimate if adding new data will exceed storage limit
   */
  const willExceedStorage = (additionalDataSize: number): boolean => {
    const currentSize = getLocalStorageSize();
    const estimatedSize = currentSize + additionalDataSize;
    return estimatedSize >= MAX_STORAGE_SIZE;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const base64ToFile = (
    base64Data: string,
    fileName: string,
    fileType: string
  ): File => {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], fileName, { type: fileType });
  };

  const isDuplicateFile = (file: File): boolean => {
    return uploadedImages.some(
      img => img.file.name === file.name && img.file.size === file.size
    );
  };

  useEffect(() => {
    const savedImages = localStorage.getItem(STORAGE_KEY);
    if (savedImages) {
      try {
        const parsedImages = JSON.parse(savedImages);
        const restoredImages: UploadedImage[] = parsedImages.map((img: any) => {
          if (img.base64) {
            const restoredFile = base64ToFile(
              img.base64,
              img.name,
              img.file?.type || 'image/jpeg'
            );
            return {
              id: img.id,
              name: img.name,
              file: restoredFile,
              url: img.base64,
              base64: img.base64,
            };
          }
          return img;
        });
        setUploadedImages(restoredImages);
      } catch (error) {
        console.error('Error loading images from localStorage:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    checkStorageSize(false); // Don't show warnings on mount
  }, []);

  useEffect(() => {
    if (uploadedImages.length > 0) {
      try {
        const serializableImages = uploadedImages.map(img => ({
          id: img.id,
          name: img.name,
          base64: img.base64,
          url: img.url,
          file: {
            name: img.file.name,
            type: img.file.type,
            size: img.file.size,
          },
        }));
        const dataToStore = JSON.stringify(serializableImages);

        localStorage.setItem(STORAGE_KEY, dataToStore);
        checkStorageSize(false); // Check but don't show warnings during save
      } catch (error: any) {
        if (error.name === 'QuotaExceededError' || error.code === 22) {
          setStorageAlert({
            show: true,
            type: 'error',
            message:
              'Storage quota exceeded! Unable to save photos. Please delete some to free up space.',
            usedSize: formatBytes(getLocalStorageSize()),
            maxSize: formatBytes(MAX_STORAGE_SIZE),
          });
        } else {
          console.error('Error saving to localStorage:', error);
        }
      }
    }
  }, [uploadedImages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check if storage is already full
      if (!checkStorageSize()) {
        e.target.value = '';
        return;
      }

      if (isDuplicateFile(file)) {
        setDuplicateAlert({ show: true, files: [file.name] });
        e.target.value = '';
        return;
      }

      try {
        const base64Data = await fileToBase64(file);
        const estimatedSize = base64Data.length * 2; // Approximate size in bytes

        // Check if adding this file will exceed storage
        if (willExceedStorage(estimatedSize)) {
          setStorageAlert({
            show: true,
            type: 'error',
            message:
              'Cannot upload: Adding this photo would exceed storage limit. Please delete some photos first.',
            usedSize: formatBytes(getLocalStorageSize()),
            maxSize: formatBytes(MAX_STORAGE_SIZE),
          });
          e.target.value = '';
          return;
        }

        const imageId = Date.now().toString();
        const newImage: UploadedImage = {
          id: imageId,
          file,
          url: base64Data,
          name: file.name,
          base64: base64Data,
        };

        setUploadedImages(prev => [...prev, newImage]);
        setSelectedImageId(imageId);
        setPendingFile(file);
        setPendingPreview(base64Data);

        applyPendingChanges();

        onPhotoSelected?.(file);
      } catch (error) {
        console.error('Error converting file to base64:', error);
        const imageUrl = URL.createObjectURL(file);
        const imageId = Date.now().toString();
        const newImage: UploadedImage = {
          id: imageId,
          file,
          url: imageUrl,
          name: file.name,
        };

        setUploadedImages(prev => [...prev, newImage]);
        setSelectedImageId(imageId);
        setPendingFile(file);
        setPendingPreview(imageUrl);
        onPhotoSelected?.(file);
      }
    }
  };

  const triggerFileUpload = () => {
    const fileInput = document.getElementById(
      'select-photo-input'
    ) as HTMLInputElement;
    fileInput?.click();
  };

  const handleMultipleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      // Check if storage is already full
      if (!checkStorageSize()) {
        e.target.value = '';
        return;
      }

      const files = Array.from(e.target.files);
      const newImages: UploadedImage[] = [];
      const duplicateFiles: string[] = [];
      let totalEstimatedSize = 0;

      for (const file of files) {
        if (isDuplicateFile(file)) {
          duplicateFiles.push(file.name);
          continue;
        }

        try {
          const base64Data = await fileToBase64(file);
          const fileSize = base64Data.length * 2;
          totalEstimatedSize += fileSize;

          // Check if adding these files will exceed storage
          if (willExceedStorage(totalEstimatedSize)) {
            setStorageAlert({
              show: true,
              type: 'error',
              message: `Cannot upload all photos: Storage limit would be exceeded. Successfully uploaded ${newImages.length} photo(s). Please delete some photos to upload more.`,
              usedSize: formatBytes(getLocalStorageSize()),
              maxSize: formatBytes(MAX_STORAGE_SIZE),
            });
            break; // Stop processing more files
          }

          const imageId =
            Date.now().toString() + Math.random().toString(36).substr(2, 9);
          const newImage: UploadedImage = {
            id: imageId,
            file,
            url: base64Data,
            name: file.name,
            base64: base64Data,
          };
          newImages.push(newImage);
        } catch (error) {
          console.error('Error converting file to base64:', error);
          const imageUrl = URL.createObjectURL(file);
          const imageId =
            Date.now().toString() + Math.random().toString(36).substr(2, 9);
          const newImage: UploadedImage = {
            id: imageId,
            file,
            url: imageUrl,
            name: file.name,
          };
          newImages.push(newImage);
        }
      }

      if (duplicateFiles.length > 0) {
        setDuplicateAlert({ show: true, files: duplicateFiles });
      }

      if (newImages.length > 0) {
        setUploadedImages(prev => [...prev, ...newImages]);

        if (!selectedImageId) {
          setSelectedImageId(newImages[0].id);
          onPhotoSelected?.(newImages[0].file);
        }
      }
      e.target.value = '';
    }
  };

  const handleImageSelect = (imageId: string) => {
    setSelectedImageId(imageId);

    const selectedImage = uploadedImages.find(img => img.id === imageId);
    if (selectedImage) {
      setPendingFile(selectedImage.file);
      setPendingPreview(selectedImage.url);
      onPhotoSelected?.(selectedImage.file);
    }
  };

  const handleConfirmSelection = () => {
    const selectedImage = uploadedImages.find(
      img => img.id === selectedImageId
    );
    if (selectedImage) {
      setPendingFile(selectedImage.file);
      setPendingPreview(selectedImage.url);
      onPhotoSelected?.(selectedImage.file);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    const updatedImages = uploadedImages.filter(img => img.id !== imageId);
    setUploadedImages(updatedImages);

    if (updatedImages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedImages));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    if (selectedImageId === imageId) {
      setSelectedImageId(null);
      setPendingFile(null);
      setPendingPreview(null);
    }
    // Clear any storage alerts after deletion
    setStorageAlert(null);
  };

  const handleGoBackToUpload = () => {
    setUploadedImages([]);
    setSelectedImageId(null);
    localStorage.removeItem(STORAGE_KEY);
    setStorageAlert(null);
  };

  if (uploadedImages.length > 0) {
    return (
      <div className='relative overflow-auto p-4'>
        {storageAlert?.show && (
          <Alert
            variant={storageAlert.type === 'error' ? 'destructive' : 'default'}
            className='mb-4'
          >
            <HardDrive className='h-4 w-4' />
            <AlertTitle>
              {storageAlert.type === 'error'
                ? 'Storage Full'
                : 'Storage Warning'}
            </AlertTitle>
            <AlertDescription>
              <div className='mt-2'>
                <p className='mb-2'>{storageAlert.message}</p>
                <p className='text-sm mb-2'>
                  <strong>Used:</strong> {storageAlert.usedSize} /{' '}
                  {storageAlert.maxSize}
                </p>
                <p className='text-xs text-muted-foreground mb-3'>
                  Tip: Delete older photos or download them before removing to
                  free up space.
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setStorageAlert(null)}
                  className='mt-2'
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {duplicateAlert.show && (
          <Alert variant='destructive' className='mb-4'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Duplicate Files Detected</AlertTitle>
            <AlertDescription>
              <div className='mt-2'>
                <p className='mb-2'>
                  The following file(s) have already been uploaded and were
                  skipped:
                </p>
                <ul className='list-disc list-inside space-y-1'>
                  {duplicateAlert.files.map((fileName, index) => (
                    <li key={index} className='text-sm'>
                      {fileName}
                    </li>
                  ))}
                </ul>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setDuplicateAlert({ show: false, files: [] })}
                  className='mt-3'
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        <input
          type='file'
          id='my-photos-input'
          className='hidden'
          accept='image/*'
          multiple
          onChange={handleMultipleFileChange}
        />

        <MyPhotos
          uploadedImages={uploadedImages}
          selectedImageId={selectedImageId}
          onImageSelect={handleImageSelect}
          onUploadMore={() => {
            const fileInput = document.getElementById(
              'my-photos-input'
            ) as HTMLInputElement;
            fileInput?.click();
          }}
          onClose={handleGoBackToUpload}
          onConfirm={handleConfirmSelection}
          onDeleteImage={handleDeleteImage}
        />
      </div>
    );
  }

  return (
    <div className='relative overflow-auto p-4'>
      {storageAlert?.show && (
        <Alert
          variant={storageAlert.type === 'error' ? 'destructive' : 'default'}
          className='mb-4'
        >
          <HardDrive className='h-4 w-4' />
          <AlertTitle>
            {storageAlert.type === 'error' ? 'Storage Full' : 'Storage Warning'}
          </AlertTitle>
          <AlertDescription>
            <div className='mt-2'>
              <p className='mb-2'>{storageAlert.message}</p>
              <p className='text-sm mb-2'>
                <strong>Used:</strong> {storageAlert.usedSize} /{' '}
                {storageAlert.maxSize}
              </p>
              <p className='text-xs text-muted-foreground mb-3'>
                Tip: Clear browser cache or delete old photos to free up space.
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setStorageAlert(null)}
                className='mt-2'
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {duplicateAlert.show && (
        <Alert variant='destructive' className='mb-4'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Duplicate File Detected</AlertTitle>
          <AlertDescription>
            <div className='mt-2'>
              <p className='mb-2'>
                The following file(s) have already been uploaded:
              </p>
              <ul className='list-disc list-inside space-y-1'>
                {duplicateAlert.files.map((fileName, index) => (
                  <li key={index} className='text-sm'>
                    {fileName}
                  </li>
                ))}
              </ul>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setDuplicateAlert({ show: false, files: [] })}
                className='mt-3'
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <div className='flex flex-col space-y-6'>
        <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center space-y-4 bg-white'>
          <ImagePlus className='h-10 w-10 text-gray-400' />
          <p className='text-lg font-light text-gray-700'>
            Drag and Drop Your Files Here
          </p>
          <p className='text-xs text-gray-500 text-center'>
            JPG, PNG format, min 700x700px, max 50000x50000px or 1000MP, max
            2GB. <br />
            We save your uploaded photo in your account for 90 days.
          </p>
          <input
            type='file'
            id='select-photo-input'
            className='hidden'
            accept='image/*'
            onChange={handleFileChange}
          />
          <Button
            variant='default'
            onClick={triggerFileUpload}
            className='px-6 py-3 rounded-none'
          >
            Upload Photo
          </Button>
          <p className='text-sm text-gray-500'>
            Please{' '}
            <span className='underline cursor-pointer hover:no-underline'>
              login
            </span>{' '}
            to upload
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelectPhoto;