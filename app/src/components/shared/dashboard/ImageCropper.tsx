import { useEffect, useMemo, useState } from 'react';
import { useUpload } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
  ImageCropReset,
} from '@/components/ui/crop';
import { Button } from '@/components/ui/button';
import { Check, X, RefreshCw, ArrowLeft } from 'lucide-react';
import { useFeature } from '@/context/dashboard/FeatureContext';

export const ImageCropper = () => {
  const {
    file,
    setPendingFile,
    pendingPreview,
    setPendingPreview,
    selectedRatio,
    setFile,
    setPreview,
  } = useUpload();

  const { setSelectedView } = useView();
  const { setSelectedFeature } = useFeature();
  const [croppedImage, setCroppedImage] = useState<string | null>(
    pendingPreview || null
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  if (!file) return null;

  const aspect = useMemo(() => {
    if (!selectedRatio) return 1;
    const parts = selectedRatio.split(':');
    if (parts.length === 2)
      return parseInt(parts[0], 10) / parseInt(parts[1], 10);
    return 1;
  }, [selectedRatio]);

  useEffect(() => {
    setCroppedImage(pendingPreview || null);
  }, [aspect, pendingPreview]);

  const handleApplyCrop = () => {
    if (!croppedImage) return;
    setIsPreviewMode(true);
  };

  const handleConfirmApply = () => {
    if (!croppedImage || !file) return;

    // Directly update the active file & preview
    setFile(file);
    setPreview(croppedImage);

    // Clear pending state
    setPendingFile(null);
    setPendingPreview(null);

    // Close cropper panel
    setSelectedFeature(null);
    setSelectedView('room');
  };

  const handleCloseCropper = () => {
    setPendingPreview(null);
    setSelectedView('room');
  };

  const handleBackToCrop = () => {
    setIsPreviewMode(false);
  };

  return (
    <div className='relative w-full h-[600px] bg-app-muted rounded-2xl overflow-hidden flex flex-col items-center justify-center'>
      {/* Header toggle bar */}
      <div className='absolute top-3 flex items-center gap-2 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm'>
        <Button
          variant={!isPreviewMode ? 'default' : 'ghost'}
          size='sm'
          onClick={() => setIsPreviewMode(false)}
          className={
            !isPreviewMode
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:text-primary'
          }
        >
          Crop Photo
        </Button>
        <Button
          variant={isPreviewMode ? 'default' : 'ghost'}
          size='sm'
          onClick={() => setIsPreviewMode(true)}
          className={
            isPreviewMode
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:text-primary'
          }
        >
          Preview
        </Button>
      </div>

      {/* Crop Mode */}
      {!isPreviewMode && (
        <div className='relative w-full h-full flex items-center justify-center p-4'>
          <ImageCrop
            key={aspect}
            file={file}
            aspect={aspect}
            onCrop={setCroppedImage}
          >
            <ImageCropContent className='w-full h-full object-contain border border-primary' />

            {/* Bottom toolbar */}
            <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow'>
              {/* Reset */}
              <ImageCropReset asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-muted-foreground hover:text-primary'
                >
                  <RefreshCw className='w-5 h-5' />
                </Button>
              </ImageCropReset>

              {/* Apply */}
              <ImageCropApply asChild>
                <Button
                  size='icon'
                  className='bg-primary'
                  onClick={handleApplyCrop}
                >
                  <Check className='w-5 h-5' />
                </Button>
              </ImageCropApply>

              {/* Close */}
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-red-500'
                onClick={handleCloseCropper}
              >
                <X className='w-5 h-5' />
              </Button>
            </div>
          </ImageCrop>
        </div>
      )}

      {/* Preview Mode */}
      {isPreviewMode && (
        <div className='relative w-full h-full flex flex-col items-center justify-center p-4'>
          {croppedImage ? (
            <img
              src={croppedImage}
              alt='Preview'
              className='max-h-[80%] rounded-xl border border-primary shadow-md object-contain'
            />
          ) : (
            <p className='text-gray-500'>No preview available</p>
          )}

          {/* Bottom toolbar */}
          <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow'>
            {/* Back */}
            <Button
              variant='ghost'
              size='icon'
              className='text-muted-foreground hover:text-primary'
              onClick={handleBackToCrop}
            >
              <ArrowLeft className='w-5 h-5' />
            </Button>

            {/* Confirm */}
            <Button
              size='icon'
              className='bg-primary'
              onClick={handleConfirmApply}
            >
              <Check className='w-5 h-5' />
            </Button>

            {/* Cancel */}
            <Button
              variant='ghost'
              size='icon'
              className='text-muted-foreground hover:text-red-500'
              onClick={handleCloseCropper}
            >
              <X className='w-5 h-5' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
