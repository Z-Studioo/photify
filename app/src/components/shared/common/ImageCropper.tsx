import { useUpload } from '@/context/UploadContext';
import { ImageCrop, ImageCropContent } from '@/components/ui/crop';
import { useState, useEffect } from 'react';

interface ImageCropperProps {
  isVisible?: boolean;
}

export default function ImageCropper({ isVisible = true }: ImageCropperProps) {
  const { file, selectedRatio, setPendingFile, setPendingPreview } = useUpload();
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Always call hooks before returning
  useEffect(() => {
    if (!file) return;

    const img = new Image();
    img.onload = () => setImageSize({ width: img.width, height: img.height });
    img.src = URL.createObjectURL(file);

    return () => URL.revokeObjectURL(img.src);
  }, [file]);

  // Compute ratio — safe to compute without file
  const aspect = selectedRatio
    ? (() => {
        const parts = selectedRatio.split(':');
        return parts.length === 2
          ? parseInt(parts[0], 10) / parseInt(parts[1], 10)
          : 1;
      })()
    : 1;

  // Only now check if rendering is needed
  if (!file || !isVisible || !imageSize) return null;

  return (
    <div className='flex flex-col items-center justify-center w-full h-full px-2 md:px-4 overflow-hidden'>
      {/* Container that maintains aspect ratio and prevents overflow */}

    <div className='flex flex-col items-center justify-center w-full h-full px-2 md:px-4 overflow-hidden'>
  {imageSize && (
    <div className='relative flex items-center justify-center w-full h-full'>
      <div className='relative max-w-full max-h-full flex items-center justify-center'>
        <ImageCrop
          key={aspect}
          file={file}
          aspect={aspect}
          generateImageOnChange={true}
          onChangeCustom={croppedImage => {
            setPendingFile(file);
            setPendingPreview(croppedImage);
          }}
          className='flex items-center justify-center'
        >
          <ImageCropContent
            className='rounded-xl'
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain', // scales to fit container without squishing
              width: 'auto',
              height: 'auto',
            }}
          />
        </ImageCrop>
      </div>
    </div>
  )}
</div>


      <p className='text-xs md:text-sm mt-2 text-muted-foreground text-center'>
        Drag the corners to crop the image
      </p>
    </div>
  );
}