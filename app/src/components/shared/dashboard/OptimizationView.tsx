import { useUpload } from '@/context/UploadContext';
import type React from 'react';
import ReactCompareImage from 'react-compare-image';

interface OptimizationViewProps {
  isVisible?: boolean;
}

const OptimizationView: React.FC<OptimizationViewProps> = ({ isVisible }) => {
  const { preview, originalPreview, pendingPreview } = useUpload();

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
    <div className='flex flex-col items-center justify-center w-full h-full px-2 md:px-0 overflow-hidden gap-2 bg-white'>
      <h2 className='text-base font-semibold text-gray-800'>
        Image Optimization Comparison
      </h2>

      <div className='w-full max-w-xs overflow-hidden shadow border border-gray-200 flex items-center justify-center'>
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

      <p className='mt-2 text-xs text-gray-500 text-center'>
        Drag the slider to compare before and after optimization.
      </p>
    </div>
  );
};

export default OptimizationView;
