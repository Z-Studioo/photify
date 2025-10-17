import { useUpload } from '@/context/UploadContext';
import { ImageCrop, ImageCropContent } from '@/components/ui/crop';

interface ImageCropperProps {
  isVisible?: boolean;
}

export default function ImageCropper({ isVisible = true }: ImageCropperProps) {
  const { file, selectedRatio, setPendingFile, setPendingPreview } =
    useUpload();

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

  if (!isVisible) return null;
  return (
    <div className='flex flex-col items-center justify-center w-full h-full px-2 md:px-0 overflow-hidden gap-4'>
      <div
        className={`max-w-full bg-app-muted border border-primary flex items-center justify-center`}
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
          className='absolute inset-0 w-full h-full'
        >
          <ImageCropContent className='w-full h-full object-contain rounded-xl' />
        </ImageCrop>
      </div>
      <p className='text-sm text-muted-foreground'>
        Drag the corners to crop the image
      </p>
    </div>
  );
}
