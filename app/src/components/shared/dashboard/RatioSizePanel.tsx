import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpload } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import { AspectRatioIcon } from '../common/icons';
import { useQuery } from '@tanstack/react-query';
import {
  fetchRatios,
  type InchData,
  type RatioData,
} from '@/utils/ratio-sizes';

interface RatioSizePanelProps {
  onSelectionChange?: (ratio: string, size: InchData | null) => void;
}

const RatioSizePanel: React.FC<RatioSizePanelProps> = ({
  onSelectionChange,
}) => {
  const {
    selectedRatio,
    setSelectedRatio,
    selectedSize,
    setSelectedSize,
    pendingRatio,
    setPendingRatio,
    pendingSize,
    setPendingSize,
  } = useUpload();
  const { setSelectedView } = useView();

  const [ratios, setRatios] = React.useState<RatioData[]>([]);
  const [inches, setInches] = React.useState<InchData[]>([]);
  const [ratiosLoading, setRatiosLoading] = React.useState<boolean>(true);
  const [inchesLoading, setInchesLoading] = React.useState<boolean>(true);
  const [ratiosError, setRatiosError] = React.useState<Error | null>(null);
  const [inchesError, setInchesError] = React.useState<Error | null>(null);

  const displayRatio = pendingRatio || selectedRatio;
  const displaySize = pendingSize || selectedSize;

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loading = ratiosLoading || inchesLoading;
  const error = ratiosError || inchesError;

  useEffect(() => {
    if (!ratios.length || !inches.length) return;

    let defaultRatio = displayRatio
      ? ratios.find(r => r.id === displayRatio) || null
      : null;

    let defaultSize = displaySize || null;

    if (!defaultRatio || !defaultSize) {
      defaultRatio = ratios.find(r => r.label === '1:1') || ratios[0] || null;
      if (defaultRatio) {
        const availableSizes = inches
          .filter(inch => defaultRatio!.sizes.includes(inch))
          .sort((a, b) => a.width_in * a.height_in - b.width_in * b.height_in);
        defaultSize = availableSizes[0] || null;
      }
    }

    if (defaultRatio && defaultSize) {
      if (!pendingRatio) setPendingRatio(defaultRatio.id);
      if (!pendingSize) setPendingSize(defaultSize);

      if (!selectedRatio) setSelectedRatio(defaultRatio.id);
      if (!selectedSize) setSelectedSize(defaultSize);

      onSelectionChange?.(defaultRatio.id, defaultSize);
    }
  }, [
    ratios,
    inches,
    displayRatio,
    displaySize,
    pendingRatio,
    pendingSize,
    selectedRatio,
    selectedSize,
    setSelectedRatio,
    setSelectedSize,
    setPendingRatio,
    setPendingSize,
    onSelectionChange,
  ]);

  const calculateDiscount = (actual: number, sell: number) =>
    Math.round(((actual - sell) / actual) * 100);

  const getAvailableSizes = (ratioData: RatioData): InchData[] => {
    if (!ratioData?.sizes) return [];
    return inches
      .filter(inch => ratioData.sizes.includes(inch))
      .sort((a, b) => a.width_in * a.height_in - b.width_in * b.height_in);
  };

  const handleRatioClick = (ratioData: RatioData) => {
    const available = getAvailableSizes(ratioData);
    if (available.length > 0) {
      const smallest = available[0];
      const isDifferentRatio = displayRatio !== ratioData.id;

      setPendingRatio(ratioData.id);
      setPendingSize(smallest);

      setSelectedRatio(ratioData.id);
      setSelectedSize(smallest);

      onSelectionChange?.(ratioData.id, smallest);

      const ref = sectionRefs.current[ratioData.id];
      if (ref) {
        const isFirstRatio = ratios[0]?.id === ratioData.id;
        if (isFirstRatio) {
          const container = ref.closest('.overflow-auto');
          if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else {
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
    const isDifferentRatio = displayRatio !== ratio;

    setPendingRatio(ratio);
    setPendingSize(size);

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
          {ratiosError instanceof Error
            ? ratiosError.message
            : inchesError instanceof Error
              ? inchesError.message
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
    <div className='space-y-6 pb-20'>
      <div className='sticky top-0 bg-gray-50 z-10 pt-1 pb-2'>
        <h2 className='text-xl font-semibold text-gray-800 mb-2 pl-4'>
          Customize Image
        </h2>

        <div className='flex overflow-x-auto gap-3 pb-2 pl-4'>
          {ratios.map(ratio => (
            <button
              key={ratio.id}
              onClick={() => handleRatioClick(ratio)}
              className={`px-4 rounded-full whitespace-nowrap border-2 transition-all ${
                displayRatio === ratio.label
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>
      </div>

      <div className='space-y-6'>
        {ratios.map((ratio, index) => {
          const sizes = getAvailableSizes(ratio);
          if (!sizes.length) return null;

          return (
            <div
              key={ratio.id}
              ref={el => {
                sectionRefs.current[ratio.id] = el;
              }}
              style={{ scrollMarginTop: index === 0 ? '0px' : '80px' }}
            >
              <h3 className='flex items-center gap-2 font-semibold text-lg mb-3 text-gray-800 ml-4'>
                <AspectRatioIcon ratio={ratio.label} />
                {ratio.label}
              </h3>

              <div className='grid gap-3'>
                {sizes.map(size => {
                  const discount = calculateDiscount(
                    10,
                    9
                  );
                  const isSelected =
                    displayRatio === ratio.label &&
                    displaySize?.id === size.id;

                  return (
                    <button
                      key={size.id}
                      onClick={() => handleSizeChange(ratio.label, size)}
                      className={`relative p-4 border-2 rounded-xl text-left transition-all w-full ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className='flex justify-between items-start'>
                        <div>
                          <div className='font-semibold text-gray-800'>
                            {size.width_in}&quot; × {size.height_in}&quot;
                          </div>
                          <div className='text-sm text-gray-500'>
                            {size.display_label}
                          </div>
                          {discount > 0 && (
                            <div className='text-green-600 text-sm mt-1 font-medium'>
                              Save {discount}% ($
                              {(10 - 9).toFixed(2)}
                              )
                            </div>
                          )}
                        </div>
                        <div className='text-right'>
                          <div className='font-bold text-primary'>
                            ${9}
                          </div>
                          {discount > 0 && (
                            <div className='text-gray-400 text-sm line-through'>
                              ${10}
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

export default RatioSizePanel;
