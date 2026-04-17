import { useUpload } from '@/context/UploadContext';
import { ImageCrop, ImageCropContent } from '@/components/ui/crop';
import { useState, useEffect } from 'react';

interface ImageCropperProps {
  isVisible?: boolean;
}

export default function ImageCropper({ isVisible = true }: ImageCropperProps) {
  const { file, selectedRatio, setPendingFile, setPendingPreview } =
    useUpload();
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      setImageSize(null);
    };
    img.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const aspect = selectedRatio
    ? (() => {
        const parts = selectedRatio.split(':');
        return parts.length === 2
          ? parseInt(parts[0], 10) / parseInt(parts[1], 10)
          : 1;
      })()
    : 1;

  if (!file || !isVisible || !imageSize) return null;

  return (
    <div className='flex h-full min-h-0 w-full flex-col overflow-hidden'>
      {/* Fill flex parent; min-h-0 lets flex children shrink. Max height uses dynamic viewport so it works before/without exact parent height. */}
      <div className='flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-auto px-2 py-1 md:px-4 md:py-2'>
        <div
          className='flex w-full max-w-full items-center justify-center'
          style={{
            maxHeight:
              'min(82dvh, calc(100dvh - 10rem), calc(100svh - 10rem))',
          }}
        >
          <div className='relative inline-flex max-h-full max-w-full'>
            <ImageCrop
              key={aspect}
              file={file}
              aspect={aspect}
              generateImageOnChange={true}
              onChangeCustom={croppedImage => {
                setPendingFile(file);
                setPendingPreview(croppedImage);
              }}
              className='flex max-h-full max-w-full items-center justify-center'
            >
              <ImageCropContent
                className='max-h-[min(82dvh,calc(100dvh-10rem))] w-auto max-w-full rounded-xl md:max-h-[min(78dvh,calc(100dvh-11rem))]'
                style={{
                  maxWidth: 'min(96vw, 1200px)',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
            </ImageCrop>
          </div>
        </div>
      </div>
      <p className='flex-shrink-0 px-2 pb-2 pt-1 text-center text-xs text-muted-foreground md:text-sm'>
        Drag the corners to crop the image
      </p>
    </div>
  );
}
