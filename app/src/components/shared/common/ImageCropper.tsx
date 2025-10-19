import { useUpload } from '@/context/UploadContext';
import { ImageCrop, ImageCropContent } from '@/components/ui/crop';
import { useState, useEffect } from 'react';

interface ImageCropperProps {
  isVisible?: boolean;
}

export default function ImageCropper({ isVisible = true }: ImageCropperProps) {
  const { file, selectedRatio, setPendingFile, setPendingPreview } = useUpload();
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  if (!file) return null;

  // Convert ratio like '1:1' or '16:9' to number
  const aspect = selectedRatio
    ? (() => {
        const parts = selectedRatio.split(':');
        return parts.length === 2
          ? parseInt(parts[0], 10) / parseInt(parts[1], 10)
          : 1;
      })()
    : 1;

  // Load image to get its natural width and height
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };
    img.src = URL.createObjectURL(file);
  }, [file]);

  if (!isVisible || !imageSize) return null;

  // Compute container size with max limits
  const maxWidth = 800;
  const maxHeight = 600;
  const imageAspect = imageSize.width / imageSize.height;

  let displayWidth = maxWidth;
  let displayHeight = displayWidth / imageAspect;

  if (displayHeight > maxHeight) {
    displayHeight = maxHeight;
    displayWidth = displayHeight * imageAspect;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-2 md:px-0 overflow-hidden gap-4">
      <div
        className="relative bg-app-muted border border-primary flex items-center justify-center overflow-hidden"
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
        }}
      >
        <ImageCrop
          key={aspect}
          file={file}
          aspect={aspect}
          generateImageOnChange={true}
          onChangeCustom={(croppedImage) => {
            setPendingFile(file);
            setPendingPreview(croppedImage);
          }}
          className="w-full h-full flex items-center justify-center"
        >
          <ImageCropContent className="max-w-full max-h-full object-contain rounded-xl" />
        </ImageCrop>
      </div>

      <p className="text-sm text-muted-foreground">
        Drag the corners to crop the image
      </p>
    </div>
  );
}
