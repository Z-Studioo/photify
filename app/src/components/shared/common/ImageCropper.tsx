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
    img.onload = () => setImageSize({ width: img.width, height: img.height });
    img.src = URL.createObjectURL(file);

    return () => URL.revokeObjectURL(img.src);
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

  const maxWidth = 800;
  const maxHeight = 600;
  let displayedWidth = imageSize.width;
  let displayedHeight = imageSize.height;
  if (displayedWidth > maxWidth) {
    displayedHeight = (maxWidth / displayedWidth) * displayedHeight;
    displayedWidth = maxWidth;
  }
  if (displayedHeight > maxHeight) {
    displayedWidth = (maxHeight / displayedHeight) * displayedWidth;
    displayedHeight = maxHeight;
  }

  return (
    <div className='flex flex-col items-center justify-center w-full h-full px-2 md:px-4 overflow-hidden'>
      <div className='flex flex-col items-center justify-center w-full px-2 md:px-4 overflow-hidden'>
        {imageSize && (
          <div
            className='relative flex items-center justify-center w-full'
            style={{
              height: displayedHeight,
              maxHeight: displayedHeight,
              maxWidth: displayedWidth,
              overflow: 'hidden',
            }}
          >
            <ImageCrop
              key={aspect}
              file={file}
              aspect={aspect}
              generateImageOnChange={true}
              onChangeCustom={croppedImage => {
                setPendingFile(file);
                setPendingPreview(croppedImage);
              }}
              className='flex items-center justify-center w-full h-full'
            >
              <ImageCropContent
                className='rounded-xl'
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  width: 'auto',
                  height: 'auto',
                }}
              />
            </ImageCrop>
          </div>
        )}
      </div>
      <p className='text-xs md:text-sm mt-2 text-muted-foreground text-center'>
        Drag the corners to crop the image
      </p>
    </div>
  );
}
