import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpload, type SizeData } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import { AspectRatioIcon } from '../common/icons';
import { useQuery } from '@tanstack/react-query';
import {
  fetchInches,
  fetchRatios,
  type InchData,
  type RatioData,
} from '@/utils/ratio-sizes';
import { motion } from 'framer-motion';

interface CropPanelProps {
  onSelectionChange?: (ratio: string, size: InchData | null) => void;
}

const CropPanel: React.FC<CropPanelProps> = ({ onSelectionChange }) => {
  const { selectedRatio, setSelectedRatio, selectedSize, setSelectedSize } =
    useUpload();
  const { setSelectedView } = useView();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [_expandedRatio, setExpandedRatio] = useState<string | null>(null);

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

    const defaultRatio =
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <>
      {/* Modern Ratio Selector - Compact Tabs */}
      <div className='border-b border-gray-100 bg-white'>
        <div className='flex overflow-x-auto gap-1 px-2 py-3 scrollbar-hide'>
          {ratios.map(ratio => {
            const isActive = selectedRatio === ratio.ratio;
            return (
              <button
                key={ratio._id}
                onClick={() => {
                  handleRatioClick(ratio);
                  setExpandedRatio(ratio.ratio);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <AspectRatioIcon ratio={ratio.ratio} />
                <span>{ratio.ratio}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizes Grid - Clean Cards */}
      <div className='p-4 md:p-5 space-y-3 bg-gray-50/50'>
        <div className='flex items-center justify-between px-1'>
          <h3 className='text-xs font-bold text-gray-500 uppercase tracking-wider'>
            Choose Your Size
          </h3>
          <span className='text-xs text-gray-400'>
            {(() => {
              const currentRatioData = ratios.find(
                r => r.ratio === selectedRatio
              );
              if (!currentRatioData) return '';
              const sizes = getAvailableSizes(currentRatioData);
              return `${sizes.length} option${sizes.length !== 1 ? 's' : ''}`;
            })()}
          </span>
        </div>

        <div className='grid gap-2.5'>
          {(() => {
            const currentRatioData = ratios.find(
              r => r.ratio === selectedRatio
            );
            if (!currentRatioData) return null;

            const sizes = getAvailableSizes(currentRatioData);
            if (sizes.length === 0) {
              return (
                <div className='text-center py-12 text-gray-400 text-sm bg-white rounded-xl border border-gray-100'>
                  No sizes available for this ratio
                </div>
              );
            }

            return sizes.map(size => {
              const discount = calculateDiscount(
                size.actual_price,
                size.sell_price
              );
              const isSelected = selectedSize?._id === size._id;

              return (
                <motion.button
                  key={size._id}
                  onClick={() =>
                    selectedRatio && handleSizeChange(selectedRatio, size)
                  }
                  initial={false}
                  whileTap={{ scale: 0.97 }}
                  className={`relative p-4 rounded-xl text-left transition-all w-full shadow-sm ${
                    isSelected
                      ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary shadow-md ring-2 ring-primary/20'
                      : 'bg-white border-2 border-gray-100 hover:border-primary/30 hover:shadow-md'
                  }`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                      }}
                      className='absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md'
                    >
                      <svg
                        className='w-3.5 h-3.5 text-white'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={3}
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    </motion.div>
                  )}

                  <div className='flex justify-between items-start gap-4 pr-8'>
                    {/* Size Info */}
                    <div className='flex-1 min-w-0'>
                      <div
                        className={`font-bold text-base mb-1 ${isSelected ? 'text-primary' : 'text-gray-900'}`}
                      >
                        {size.width}&quot; × {size.height}&quot;
                      </div>
                      <div className='text-xs text-gray-500 font-medium'>
                        {size.Slug}
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className='text-right shrink-0'>
                      <div
                        className={`font-bold text-lg leading-tight ${isSelected ? 'text-primary' : 'text-gray-900'}`}
                      >
                        ${size.sell_price.toFixed(2)}
                      </div>
                      {discount > 0 && (
                        <>
                          <div className='text-gray-400 text-xs line-through leading-tight mt-0.5'>
                            ${size.actual_price.toFixed(2)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Discount Badge */}
                  {discount > 0 && (
                    <div className='mt-3 pt-3 border-t border-gray-100 flex items-center justify-between'>
                      <div className='inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded-lg'>
                        <svg
                          className='w-3.5 h-3.5 text-green-600'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z'
                            clipRule='evenodd'
                          />
                        </svg>
                        <span className='text-xs font-bold text-green-700'>
                          {discount}% OFF
                        </span>
                      </div>
                      <div className='text-xs text-green-600 font-semibold'>
                        Save ${(size.actual_price - size.sell_price).toFixed(2)}
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            });
          })()}
        </div>
      </div>
    </>
  );
};

export default CropPanel;
