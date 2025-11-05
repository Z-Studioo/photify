import { useUpload } from '@/context/UploadContext';
import type React from 'react';
import { useEffect, useState } from 'react';
import ReactCompareImage from 'react-compare-image';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface OptimizationViewProps {
  isVisible?: boolean;
}

const OptimizationView: React.FC<OptimizationViewProps> = ({ isVisible }) => {
  const {
    preview,
    originalPreview,
    pendingPreview,
    quality,
    setQuality,
    setPendingPreview,
    file,
    setPendingFile,
  } = useUpload();
  const [isProcessing, setIsProcessing] = useState(false);

  // Enhancement function
  const enhanceImageWithCanvas = async (
    src: string,
    qualityValue: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject('Canvas not supported');
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        const q = qualityValue / 100;

        ctx.filter = `
          brightness(${1 + q * 0.1})
          contrast(${1 + q * 0.2})
          saturate(${1 + q * 0.1})
          blur(${(1 - q) * 0.5}px)
        `;

        ctx.drawImage(img, 0, 0, img.width, img.height);

        if (q > 0.7) {
          ctx.globalAlpha = (q - 0.7) * 1.5;
          ctx.drawImage(canvas, -1, 0);
          ctx.drawImage(canvas, 1, 0);
          ctx.globalAlpha = 1.0;
        }

        const enhanced = canvas.toDataURL('image/jpeg', q);
        resolve(enhanced);
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  // Process optimization when quality changes
  useEffect(() => {
    const basePreview = originalPreview || preview;
    if (!basePreview) return;

    const handler = setTimeout(async () => {
      try {
        setIsProcessing(true);
        const enhanced = await enhanceImageWithCanvas(basePreview, quality[0]);
        setPendingPreview(enhanced);
        setPendingFile(file);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Image enhancement failed:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 800);

    return () => clearTimeout(handler);
  }, [quality, originalPreview, preview, setPendingPreview, file, setPendingFile]);

  if (!isVisible) return null;

  // Use original preview as the "before" image
  const beforeImage = originalPreview || preview;
  if (!beforeImage) {
    return (
      <div className='flex flex-col items-center justify-center w-full h-full bg-white text-gray-400 text-sm'>
        No image preview available
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center w-full h-full px-4 md:px-0 overflow-hidden gap-4 bg-white py-4'>
      <h2 className='text-base font-semibold text-gray-800'>
        Image Optimization Comparison
      </h2>

      <div className='w-full max-w-md overflow-hidden shadow border border-gray-200 flex items-center justify-center'>
        <ReactCompareImage
          leftImage={beforeImage}
          rightImage={pendingPreview ?? beforeImage}
          sliderLineWidth={3}
          handleSize={28}
          leftImageLabel='Before'
          rightImageLabel='After'
          sliderLineColor='oklch(0.6619 0.2359 353.43)'
        />
      </div>

      <p className='text-xs text-gray-500 text-center'>
        Drag the slider to compare before and after optimization.
      </p>

      {/* Mobile Optimization Controls */}
      <div className='w-full max-w-md px-2 md:hidden'>
        <div className='bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='quality-mobile' className='text-base font-medium'>
              Quality
            </Label>
            <span className='text-sm font-semibold text-primary'>
              {quality[0]}%
            </span>
          </div>

          <Slider
            id='quality-mobile'
            min={1}
            max={100}
            step={1}
            value={quality}
            onValueChange={setQuality}
            className='w-full'
            disabled={isProcessing}
          />

          <p className='text-xs text-muted-foreground'>
            {isProcessing
              ? 'Enhancing image... please wait'
              : 'Higher quality means more contrast and sharpness'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OptimizationView;
