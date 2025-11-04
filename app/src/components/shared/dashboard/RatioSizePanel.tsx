import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpload } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import { AspectRatioIcon } from '../common/icons';
import { useQuery } from '@tanstack/react-query';
import { fetchInches, fetchRatios, type InchData, type RatioData } from '@/utils/ratio-sizes';

interface RatioSizePanelProps {
  onSelectionChange?: (ratio: string, size: InchData | null) => void;
}

const RatioSizePanel: React.FC<RatioSizePanelProps> = ({
  onSelectionChange,
}) => {
  const { selectedRatio, setSelectedRatio, selectedSize, setSelectedSize } =
    useUpload();
  const { setSelectedView } = useView();

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ✅ Fetch ratios and inches
  const {
    data: ratios = [],
    isLoading: ratiosLoading,
    isError: ratiosError,
    error: ratioErrObj,
  } = useQuery({
    queryKey: ['ratios'],
    queryFn: fetchRatios,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: inches = [],
    isLoading: inchesLoading,
    isError: inchesError,
    error: inchErrObj,
  } = useQuery({
    queryKey: ['inches'],
    queryFn: fetchInches,
    staleTime: 5 * 60 * 1000,
  });

  const loading = ratiosLoading || inchesLoading;
  const error = ratiosError || inchesError;

  // ✅ Setup default selection once data is ready
  useEffect(() => {
    if (!ratios.length || !inches.length) return;

    let defaultRatio = selectedRatio
      ? ratios.find(r => r.ratio === selectedRatio) || null
      : null;

    let defaultSize = selectedSize || null;

    if (!defaultRatio || !defaultSize) {
      defaultRatio = ratios.find(r => r.ratio === '1:1') || ratios[0] || null;
      if (defaultRatio) {
        const availableSizes = inches
          .filter(inch => defaultRatio!.Inches.includes(inch._id))
          .sort((a, b) => a.width * a.height - b.width * b.height);
        defaultSize = availableSizes[0] || null;
      }
    }

    if (defaultRatio && defaultSize) {
      // update context for defaults as well
      setSelectedRatio(defaultRatio.ratio);
      setSelectedSize(defaultSize);

      onSelectionChange?.(defaultRatio.ratio, defaultSize);
    }
  }, [
    ratios,
    inches,
    selectedRatio,
    selectedSize,
    setSelectedRatio,
    setSelectedSize,
    onSelectionChange,
  ]);

  const calculateDiscount = (actual: number, sell: number) =>
    Math.round(((actual - sell) / actual) * 100);

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
      const isDifferentRatio = selectedRatio !== ratioData.ratio;

      setSelectedRatio(ratioData.ratio);
      setSelectedSize(smallest);
      onSelectionChange?.(ratioData.ratio, smallest);

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

      if (isDifferentRatio) setSelectedView('crop');
    }
  };

  const handleSizeChange = (ratio: string, size: InchData) => {
    const isDifferentRatio = selectedRatio !== ratio;
    setSelectedRatio(ratio);
    setSelectedSize(size);
    onSelectionChange?.(ratio, size);
    if (isDifferentRatio) setSelectedView('crop');
  };

  if (loading)
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <Loader2 className='h-6 w-6 animate-spin text-primary' />
        <p className='text-gray-600 mt-3 text-sm'>Loading canvas options...</p>
      </div>
    );

  if (error)
    return (
      <div className='p-4 text-center text-red-600'>
        <p>
          Error loading data:{' '}
          {ratioErrObj instanceof Error
            ? ratioErrObj.message
            : inchErrObj instanceof Error
              ? inchErrObj.message
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

        <div className='flex overflow-x-auto gap-3 pb-2 pl-4'>
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

      {/* Sizes List */}
      <div className='space-y-6'>
        {ratios.map((ratio, index) => {
          const sizes = getAvailableSizes(ratio);
          if (!sizes.length) return null;

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

      {/* Price Summary */}
      {selectedRatio && selectedSize && (
        <div className='border-t pt-4'>
          <div className='bg-gray-50 p-4 rounded-lg space-y-1 text-sm'>
            <h4 className='font-semibold text-gray-800 mb-2'>Canvas Price</h4>
            <div>
              <span className='text-primary font-bold text-lg'>
                ${selectedSize.sell_price.toFixed(2)}
              </span>{' '}
              <span className='line-through text-gray-400'>
                ${selectedSize.actual_price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatioSizePanel;
