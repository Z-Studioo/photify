import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, WandSparkles } from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface RatioSizePanelProps {
  onSelectionChange?: (ratio: string, size: InchData | null) => void;
}

const RatioSizePanel: React.FC<RatioSizePanelProps> = ({
  onSelectionChange,
}) => {
  const {
    preview,
    selectedRatio,
    setSelectedRatio,
    selectedSize,
    setSelectedSize,
  } = useUpload();

  const { setSelectedView } = useView();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isAutoRatioSelected, setIsAutoRatioSelected] = useState(false);
  const [autoResolvedRatio, setAutoResolvedRatio] = useState<string | null>(null);
  const lastAutoAppliedPreviewRef = useRef<string | null>(null);
  
  const {
    data: ratios = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery<RatioData[]>({
    queryKey: ['ratios'],
    queryFn: fetchRatios,
    staleTime: 1000 * 60 * 30, // Consider data fresh for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: inches = [] } = useQuery<InchData[]>({
    queryKey: ['printSizes', ratios],
    queryFn: () => getAllPrintSizes(ratios),
    enabled: ratios.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  // Default selection
  useEffect(() => {
    if (!ratios.length) return;

    const ratio =
      ratios.find(r => r.label === selectedRatio) ||
      ratios.find(r => r.label === '1:1') ||
      ratios[0];

    if (!ratio) return;

    const sizes = inches
      .filter(i => ratio.sizes.includes(i))
      .sort((a, b) => a.area_in2 - b.area_in2);

    const smallest = sizes[0] ?? null;

    if (!selectedRatio) setSelectedRatio(ratio.label);
    if (!selectedSize && smallest) setSelectedSize(smallest);

    onSelectionChange?.(ratio.label, smallest);
  }, [ratios]);

  const handleRatioClick = (ratio: RatioData) => {
    const sizes = inches
      .filter(i => ratio.sizes.includes(i))
      .sort((a, b) => a.area_in2 - b.area_in2);

    const smallest = sizes[0] ?? null;

    setSelectedRatio(ratio.label);
    setSelectedSize(smallest);
    onSelectionChange?.(ratio.label, smallest);
    setSelectedView('crop');

    sectionRefs.current[ratio.id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const getImageAspectRatio = (src: string): Promise<number | null> =>
    new Promise(resolve => {
      const image = new window.Image();
      image.onload = () => {
        if (!image.width || !image.height) {
          resolve(null);
          return;
        }
        resolve(image.width / image.height);
      };
      image.onerror = () => resolve(null);
      image.src = src;
    });

  const getClosestRatio = (
    imageAspectRatio: number,
    availableRatios: RatioData[]
  ): RatioData | null => {
    const validRatios = availableRatios.filter(r => r.sizes.length > 0);
    if (!validRatios.length) return null;

    const getRatioValue = (ratio: RatioData) => {
      if (ratio.width_ratio > 0 && ratio.height_ratio > 0) {
        return ratio.width_ratio / ratio.height_ratio;
      }
      const [w, h] = ratio.label.split(':').map(Number);
      return w > 0 && h > 0 ? w / h : 1;
    };

    return validRatios.reduce((closest, current) => {
      const closestDiff = Math.abs(
        Math.log(getRatioValue(closest) / imageAspectRatio)
      );
      const currentDiff = Math.abs(
        Math.log(getRatioValue(current) / imageAspectRatio)
      );
      return currentDiff < closestDiff ? current : closest;
    });
  };

  const applyAutoRatio = async ({
    shouldSwitchToCrop,
  }: { shouldSwitchToCrop: boolean }) => {
    if (!preview || !ratios.length) return false;

    const imageAspectRatio = await getImageAspectRatio(preview);
    if (!imageAspectRatio) return false;

    const closestRatio = getClosestRatio(imageAspectRatio, ratios);
    if (!closestRatio) return false;

    const autoSizes = inches
      .filter(i => closestRatio.sizes.some(s => s.id === i.id))
      .sort((a, b) => a.area_in2 - b.area_in2);
    const smallest = autoSizes[0] ?? null;

    setIsAutoRatioSelected(true);
    setSelectedRatio(closestRatio.label);
    setSelectedSize(smallest);
    onSelectionChange?.(closestRatio.label, smallest);
    if (shouldSwitchToCrop) {
      setSelectedView('crop');
    }
    setAutoResolvedRatio(closestRatio.label);
    return true;
  };

  const handleAutoRatioClick = async () => {
    await applyAutoRatio({ shouldSwitchToCrop: true });
  };

  useEffect(() => {
    if (!preview || !ratios.length || !inches.length) return;
    if (lastAutoAppliedPreviewRef.current === preview) return;

    lastAutoAppliedPreviewRef.current = preview;
    void applyAutoRatio({ shouldSwitchToCrop: false });
  }, [preview, ratios, inches]);

  const handleSizeClick = (size: InchData) => {
    setSelectedSize(size);
    onSelectionChange?.(selectedRatio!, size);
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
        <p>{error?.message}</p>
        <Button variant='outline' className='mt-2' onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );

  const currentRatio = ratios.find(r => r.label === selectedRatio);
  const sizes =
    currentRatio?.sizes
      .map(s => inches.find(i => i.id === s.id))
      .filter(Boolean) ?? [];
  const availableRatios = ratios.filter(ratio => ratio.sizes.length > 0);

  return (
    <>
      {/* Ratio Selector */}
      <div className='border-b bg-white sticky top-0 z-10'>
        <div className='px-3 pt-3 pb-2'>
          <div className='flex items-center justify-between gap-3 mb-2'>
            <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
              Aspect Ratio
            </p>
            {selectedRatio && (
              <span className='inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-semibold'>
                {selectedRatio}
              </span>
            )}
          </div>

          <button
            onClick={handleAutoRatioClick}
            aria-pressed={isAutoRatioSelected}
            className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition border ${
              isAutoRatioSelected
                ? 'bg-primary/10 text-primary border-primary/40'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className='inline-flex items-center gap-2'>
              <WandSparkles size={16} />
              Auto
            </span>
            <span
              className={cn(
                'text-xs font-medium',
                isAutoRatioSelected ? 'text-primary' : 'text-gray-500'
              )}
            >
              {autoResolvedRatio ? `Best match: ${autoResolvedRatio}` : 'Best match'}
            </span>
          </button>

          <div className='mt-2 flex flex-wrap gap-2 w-full'>
            {availableRatios.map(ratio => {
            const active = !isAutoRatioSelected && selectedRatio === ratio.label;
            return (
              <button
                key={ratio.id}
                aria-pressed={active}
                onClick={() => {
                  setIsAutoRatioSelected(false);
                  handleRatioClick(ratio);
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition border ${
                  active
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <AspectRatioIcon ratio={ratio.label} size={18} />
                {ratio.label}
                {active && <Check size={14} />}
              </button>
            );
            })}
          </div>
        </div>
        {isAutoRatioSelected && autoResolvedRatio && (
          <div className='px-4 pb-3 text-xs text-gray-500'>
            Auto selected ratio:{' '}
            <span className='font-semibold'>{autoResolvedRatio}</span>
          </div>
        )}
      </div>

      {/* Sizes */}
      <div className='p-4 space-y-3 bg-gray-50'>
        {sizes.map(size => {
          const isSelected = selectedSize?.id === size?.id;
          // Use fixed_price if available, otherwise show placeholder
          const price =
            size!.fixed_price !== null ? size!.fixed_price.toFixed(2) : null;

          return (
            <motion.button
              key={size!.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSizeClick(size!)}
              className={`w-full p-4 rounded-xl text-left transition border-2 ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'bg-white border-gray-100 hover:border-primary/40'
              } ${price === null ? 'opacity-50' : ''}`}
              disabled={price === null}
            >
              <div className='flex justify-between items-center'>
                <div>
                  <div className='font-bold text-gray-900'>
                    {size!.width_in}" × {size!.height_in}"
                  </div>
                  <div className='text-xs text-gray-500'>
                    {size!.display_label}
                  </div>
                </div>
                <div className='text-right'>
                  {price !== null ? (
                    <div className='font-bold text-lg text-primary'>£{price}</div>
                  ) : (
                    <div className='text-xs text-gray-400'>
                      Pricing not set
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </>
  );
};

export default RatioSizePanel;
