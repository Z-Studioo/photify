import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpload } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import { AspectRatioIcon } from '../common/icons';
import {
  fetchRatios,
  getAllPrintSizes,
  type InchData,
  type RatioData,
} from '@/utils/ratio-sizes';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface CropPanelProps {
  onSelectionChange?: (ratio: string, size: InchData | null) => void;
}

const CropPanel: React.FC<CropPanelProps> = ({ onSelectionChange }) => {
  const {
    selectedRatio,
    setSelectedRatio,
    selectedSize,
    setSelectedSize,
    selectedProduct,
  } = useUpload();
  const { setSelectedView } = useView();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [_expandedRatio, setExpandedRatio] = useState<string | null>(null);
  const [ratiosLoading, setRatiosLoading] = useState<boolean>(false);
  const [ratiosError, setRatiosError] = useState<Error | null>(null);
  const [ratios, setRatios] = useState<RatioData[]>([]);
  const [inches, setInches] = useState<InchData[]>([]);

  useEffect(() => {
    const getRatioAndSizes = async () => {
      setRatiosLoading(true);
      try {
        const ratiosData = await fetchRatios();
        setRatios(ratiosData);
        setInches(getAllPrintSizes(ratiosData));
      } catch (error: any) {
        toast.error('Failed to load ratios: ' + error.message);
        setRatiosError(error);
      } finally {
        setRatiosLoading(false);
      }
    };

    getRatioAndSizes();
  }, []);

  useEffect(() => {
    if (!ratios.length) return;

    const defaultRatio =
      ratios.find(r => r.label === selectedRatio) ||
      ratios.find(r => r.label === '1:1') ||
      ratios[0];

    if (defaultRatio) {
      const available = inches
        .filter(inch => defaultRatio.sizes.includes(inch))
        .sort((a, b) => a.width_in * a.height_in - b.width_in * b.height_in);

      const smallest = available[0] || null;
      if (smallest) {
        setSelectedRatio(defaultRatio.label);
        setSelectedSize(smallest);
        onSelectionChange?.(defaultRatio.label, smallest);
      }
    }
  }, [ratios]);

  const calculateDiscount = (actual: number, sell: number) =>
    Math.round(((actual - sell) / actual) * 100);

  const handleRatioClick = (ratioData: RatioData) => {
    const smallest = ratioData.sizes[0] || null;
    setSelectedRatio(ratioData.label);
    setSelectedSize(smallest);
    onSelectionChange?.(ratioData.label, smallest);
    setSelectedView('crop');

    const ref = sectionRefs.current[ratioData.label];
    if (ref) {
      const isFirstRatio = ratios[0]?.label === ratioData.label;

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
  };

  const handleSizeChange = (ratio: string, size: InchData) => {
    setSelectedRatio(ratio);
    setSelectedSize(size);
    onSelectionChange?.(ratio, size);
    setSelectedView('crop');
  };

  if (ratiosLoading)
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <Loader2 className='h-6 w-6 animate-spin text-primary' />
        <p className='text-gray-600 mt-3 text-sm'>Loading canvas options...</p>
      </div>
    );

  if (ratiosError)
    return (
      <div className='p-4 text-center text-red-600'>
        <p>
          Error loading data:{' '}
          {ratiosError instanceof Error ? ratiosError.message : 'Unknown error'}
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
      <div className='border-b border-gray-100 bg-white'>
        <div className='flex overflow-x-auto gap-1 px-2 py-3 scrollbar-hide'>
          {ratios.map(ratio => {
            const isActive = selectedRatio === ratio.label;
            return (
              <button
                key={ratio.id}
                onClick={() => {
                  handleRatioClick(ratio);
                  setExpandedRatio(ratio.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <AspectRatioIcon ratio={ratio.label} />
                <span>{ratio.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className='p-4 md:p-5 space-y-3 bg-gray-50/50'>
        <div className='flex items-center justify-between px-1'>
          <h3 className='text-xs font-bold text-gray-500 uppercase tracking-wider'>
            Choose Your Size
          </h3>
          <span className='text-xs text-gray-400'>
            {(() => {
              const currentRatioData = ratios.find(
                r => r.label === selectedRatio
              );
              if (!currentRatioData) return '';
              const sizes = currentRatioData.sizes;
              return `${sizes.length} option${sizes.length !== 1 ? 's' : ''}`;
            })()}
          </span>
        </div>

        <div className='grid gap-2.5'>
          {(() => {
            const currentRatioData = ratios.find(
              r => r.label === selectedRatio
            );
            if (!currentRatioData) return null;

            const sizes = currentRatioData.sizes;
            if (sizes.length === 0) {
              return (
                <div className='text-center py-12 text-gray-400 text-sm bg-white rounded-xl border border-gray-100'>
                  No sizes available for this ratio
                </div>
              );
            }

            return sizes.map(size => {
              const discount = calculateDiscount(
                +(selectedProduct?.price ?? 0) * size.area_in2,
                +(selectedProduct?.price ?? 0) * size.area_in2
              );
              const isSelected = selectedSize?.id === size.id;

              return (
                <motion.button
                  key={size.id}
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
                    <div className='flex-1 min-w-0'>
                      <div
                        className={`font-bold text-base mb-1 ${isSelected ? 'text-primary' : 'text-gray-900'}`}
                      >
                        {size.width_in}&quot; × {size.height_in}&quot;
                      </div>
                      <div className='text-xs text-gray-500 font-medium'>
                        {size.display_label}
                      </div>
                    </div>

                    <div className='text-right shrink-0'>
                      <div
                        className={`font-bold text-lg leading-tight ${isSelected ? 'text-primary' : 'text-gray-900'}`}
                      >
                        $
                        {selectedProduct
                          ? (+selectedProduct.price * size.area_in2).toFixed(2)
                          : '0.00'}
                      </div>
                      {discount > 0 && (
                        <>
                          <div className='text-gray-400 text-xs line-through leading-tight mt-0.5'>
                            $
                            {(+selectedProduct!.price * size.area_in2).toFixed(
                              2
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

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
                        Save $
                        {(
                          -(
                            +(selectedProduct?.price ?? 0) *
                            size.area_in2 *
                            discount
                          ) / 100
                        ).toFixed(2)}
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
