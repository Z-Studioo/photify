import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpload, type SizeData } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import { AspectRatioIcon } from '../common/icons';
import { useQuery } from '@tanstack/react-query';
import { fetchInches, fetchRatios, type InchData, type RatioData } from '@/utils/ratio-sizes';


interface CropPanelProps {
  onSelectionChange?: (ratio: string, size: InchData | null) => void;
}

const CropPanel: React.FC<CropPanelProps> = ({ onSelectionChange }) => {
  const {
    selectedRatio,
    setSelectedRatio,
    selectedSize,
    setSelectedSize,
  } = useUpload();
  const { setSelectedView } = useView();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const {
    data: ratios = [],
    isLoading: ratiosLoading,
    isError: ratiosError,
    error: ratioError,
  } = useQuery({
    queryKey: ['ratios'],
    queryFn: fetchRatios,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: inches = [],
    isLoading: inchesLoading,
    isError: inchesError,
    error: inchError,
  } = useQuery({
    queryKey: ['inches'],
    queryFn: fetchInches,
    staleTime: 5 * 60 * 1000,
  });

  const loading = ratiosLoading || inchesLoading;
  const error = ratiosError || inchesError;

  // ✅ Default selection logic once both datasets are ready
  useEffect(() => {
    if (!ratios.length || !inches.length) return;

    let defaultRatio =
      ratios.find(r => r.ratio === selectedRatio) ||
      ratios.find(r => r.ratio === '1:1') ||
      ratios[0];

    if (defaultRatio) {
      const available = inches
        .filter(inch => defaultRatio.Inches.includes(inch._id))
        .sort((a, b) => a.width * a.height - b.width * b.height);

      const smallest = available[0] || null;
      if (smallest) {
        setSelectedRatio(defaultRatio.ratio);
        setSelectedSize(smallest);
        onSelectionChange?.(defaultRatio.ratio, smallest);
      }
    }
  }, [ratios, inches]);

  // Helpers
  const calculateDiscount = (actual: number, sell: number) =>
    Math.round(((actual - sell) / actual) * 100);

  // Get available sizes for ratio
  const getAvailableSizes = (ratioData: RatioData): InchData[] => {
    if (!ratioData?.Inches) return [];
    return inches
      .filter(inch => ratioData.Inches.includes(inch._id))
      .sort((a, b) => a.width * a.height - b.width * b.height);
  };

  const handleRatioClick = (ratioData: RatioData) => {
    const available = getAvailableSizes(ratioData);
    if (available.length > 0) {
      const smallest = available[0];
      setSelectedRatio(ratioData.ratio);
      setSelectedSize(smallest);
      onSelectionChange?.(ratioData.ratio, smallest);
      setSelectedView('crop');

      const ref = sectionRefs.current[ratioData._id];
      if (ref) {
        const isFirstRatio = ratios[0]?._id === ratioData._id;

        if (isFirstRatio) {
          // For first ratio, scroll container to top
          const container = ref.closest('.overflow-auto');
          if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else {
          // For other ratios, use scrollIntoView
          ref.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }
    }
  };

  const handleSizeChange = (ratio: string, size: InchData) => {
    setSelectedRatio(ratio);
    const sizeData: SizeData = {
      _id: size._id,
      width: size.width,
      height: size.height,
      w: size.w,
      h: size.h,
      Slug: size.Slug,
      sell_price: size.sell_price,
      actual_price: size.actual_price,
    };
    setSelectedSize(sizeData);
    onSelectionChange?.(ratio, size);
    setSelectedView('crop');
  };

  // Loading UI
  if (loading)
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <Loader2 className='h-6 w-6 animate-spin text-primary' />
        <p className='text-gray-600 mt-3 text-sm'>Loading canvas options...</p>
      </div>
    );

  // Error UI
  if (error)
    return (
      <div className='p-4 text-center text-red-600'>
        <p>
          Error loading data:{' '}
          {ratioError instanceof Error
            ? ratioError.message
            : inchError instanceof Error
              ? inchError.message
              : 'Unknown error'}
        </p>
        <Button
          variant='outline'
          className='mt-2'
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );

  return (
    <div className='space-y-6'>
      {/* Sticky Header + Ratios */}
      <div className='sticky top-0 bg-gray-50 z-10 pt-1 pb-2'>
        <h2 className='text-xl font-semibold text-gray-800 mb-2 pl-4'>
          Customize Image
        </h2>

        <div className='flex overflow-x-auto gap-2'>
          {ratios.map(ratio => (
            <button
              key={ratio._id}
              onClick={() => handleRatioClick(ratio)}
              className={`px-4 rounded-full whitespace-nowrap border-2 transition-all ${
                selectedRatio === ratio.ratio
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {ratio.ratio}
            </button>
          ))}
        </div>
      </div>

      {/* Show all sizes for all ratios */}
      <div className='space-y-6'>
        {ratios.map((ratio, index) => {
          const sizes = getAvailableSizes(ratio);
          if (sizes.length === 0) return null;

          return (
            <div
              key={ratio._id}
              ref={el => {
                sectionRefs.current[ratio._id] = el;
              }}
              style={{ scrollMarginTop: index === 0 ? '0px' : '80px' }}
            >
              <h3 className='flex items-center gap-2 font-semibold text-lg mb-3 text-gray-800 ml-4'>
                <AspectRatioIcon ratio={ratio.ratio} />
                {ratio.ratio}
              </h3>

              <div className='grid gap-3'>
                {sizes.map(size => {
                  const discount = calculateDiscount(
                    size.actual_price,
                    size.sell_price
                  );
                  const isSelected =
                    selectedRatio === ratio.ratio &&
                    selectedSize?._id === size._id;

                  return (
                    <button
                      key={size._id}
                      onClick={() => handleSizeChange(ratio.ratio, size)}
                      className={`relative p-4 border-2 rounded-xl text-left transition-all w-full ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className='flex justify-between items-start'>
                        <div>
                          <div className='font-semibold text-gray-800'>
                            {size.width}&quot; × {size.height}&quot;
                          </div>
                          <div className='text-sm text-gray-500'>
                            {size.Slug}
                          </div>
                          {discount > 0 && (
                            <div className='text-green-600 text-sm mt-1 font-medium'>
                              Save {discount}% ($
                              {(size.actual_price - size.sell_price).toFixed(2)}
                              )
                            </div>
                          )}
                        </div>
                        <div className='text-right'>
                          <div className='font-bold text-primary'>
                            ${size.sell_price.toFixed(2)}
                          </div>
                          {discount > 0 && (
                            <div className='text-gray-400 text-sm line-through'>
                              ${size.actual_price.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CropPanel;
