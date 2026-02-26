import { useUpload } from '@/context/UploadContext';
import type React from 'react';
import { useEffect, useState } from 'react';
import ReactCompareImage from 'react-compare-image';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';
import { useView } from '@/context/ViewContext';
import { useFeature } from '@/context/dashboard/FeatureContext';

interface OptimizationViewProps {
  isVisible?: boolean;
}

const OptimizationView: React.FC<OptimizationViewProps> = ({ isVisible }) => {
  const {
    preview,
    originalPreview,
    pendingPreview,
    quality,
    pendingQuality,
    setPendingQuality,
    setPendingPreview,
    file,
    setPendingFile,
  } = useUpload();
  const { setSelectedView } = useView();
  const { setSelectedFeature } = useFeature();
  const [isProcessing, setIsProcessing] = useState(false);

  const displayQuality = pendingQuality || quality;
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

  useEffect(() => {
    const basePreview = originalPreview || preview;
    if (!basePreview || !pendingQuality) return;

    const handler = setTimeout(async () => {
      try {
        setIsProcessing(true);
        const enhanced = await enhanceImageWithCanvas(
          basePreview,
          pendingQuality[0]
        );
        setPendingPreview(enhanced);
        setPendingFile(file);
      } catch (error) {
        console.error('Image enhancement failed:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 800);

    return () => clearTimeout(handler);
  }, [
    pendingQuality,
    originalPreview,
    preview,
    setPendingPreview,
    file,
    setPendingFile,
  ]);

  const handleGoBack = () => {
    setSelectedView('3droom');
    setSelectedFeature(null);
  };

  if (!isVisible) return null;

  const beforeImage = originalPreview || preview;
  if (!beforeImage) {
    return (
      <div className='flex flex-col items-center justify-center w-full h-full bg-white text-gray-400 text-sm'>
        No image preview available
      </div>
    );
  }

  return (
    <div className='flex flex-col w-full h-full bg-white overflow-y-auto'>
      <div className='relative flex items-center p-4 flex-shrink-0 border-b border-gray-200'>
        <ChevronLeft
          className='h-4 w-4 text-gray-600 cursor-pointer'
          onClick={handleGoBack}
        />
        <h3 className='absolute left-1/2 transform -translate-x-1/2 text-lg font-bold text-center whitespace-nowrap px-2'>
          Image Optimization
        </h3>
      </div>

      <div className='flex flex-col items-center justify-start w-full px-4 md:px-0 gap-4 py-4 pb-24 md:pb-4'>
        <h2 className='text-base font-semibold text-gray-800 mt-2'>
          Comparison
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

        <div className='w-full max-w-md px-2 md:hidden'>
          <div className='bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='quality-mobile' className='text-base font-medium'>
                Quality
              </Label>
              <span className='text-sm font-semibold text-primary'>
                {displayQuality[0]}%
              </span>
            </div>

            <Slider
              id='quality-mobile'
              min={1}
              max={100}
              step={1}
              value={displayQuality}
              onValueChange={setPendingQuality}
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
    </div>
  );
};

export default OptimizationView;
