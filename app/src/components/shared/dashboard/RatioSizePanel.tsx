import React, { useEffect, useRef, useState } from 'react';
import { Loader2, WandSparkles } from 'lucide-react';
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
import { resolveCanvasSizePrice } from '@/lib/canvas-size-price';
import { useProductCanvasPricingProduct } from '@/hooks/use-product-canvas-pricing';

interface RatioSizePanelProps {
  onSelectionChange?: (ratio: string, size: InchData | null) => void;
}

/** Hide secondary line when it only repeats the print dimensions (common DB duplication). */
function dimensionsDuplicateDisplay(
  widthIn: number,
  heightIn: number,
  displayLabel: string | undefined
): boolean {
  if (!displayLabel?.trim()) return true;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s/g, '')
      .replace(/[""'″`]/g, '')
      .replace(/×/g, 'x');
  const label = norm(displayLabel);
  const a = norm(`${widthIn}"x${heightIn}"`);
  const b = norm(`${widthIn}x${heightIn}`);
  return label === a || label === b;
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
    selectedProduct,
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

  const productForCanvasPricing =
    useProductCanvasPricingProduct(selectedProduct);

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
    <div className='flex flex-col gap-0 pb-2'>
      {/* Ratio selector — scrolls with sizes on small screens; sticky only md+ for tall side panels */}
      <div className='border-b border-zinc-100 bg-zinc-50/95 pb-3 pt-1 md:sticky md:top-0 md:z-10'>
        <div className='flex items-baseline justify-between gap-2 px-0.5 pt-2'>
          <p className='text-[13px] font-medium text-zinc-800'>Aspect ratio</p>
          {selectedRatio && (
            <span className='rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
              {selectedRatio}
            </span>
          )}
        </div>

        <button
          type='button'
          onClick={handleAutoRatioClick}
          aria-pressed={isAutoRatioSelected}
          className={cn(
            'mt-3 flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition',
            isAutoRatioSelected
              ? 'border-primary/35 bg-primary/[0.07] text-zinc-900'
              : 'border-zinc-200/90 bg-white text-zinc-800 hover:bg-zinc-50'
          )}
        >
          <span className='inline-flex items-center gap-2 font-medium'>
            <WandSparkles className='h-4 w-4 shrink-0 text-primary' />
            Match my photo
          </span>
          <span
            className={cn(
              'truncate text-xs',
              autoResolvedRatio ? 'text-zinc-600' : 'text-zinc-400'
            )}
          >
            {autoResolvedRatio ? autoResolvedRatio : 'Pick closest ratio'}
          </span>
        </button>

        <div className='mt-3 grid grid-cols-3 gap-2'>
          {availableRatios.map(ratio => {
            const active = !isAutoRatioSelected && selectedRatio === ratio.label;
            return (
              <button
                key={ratio.id}
                type='button'
                aria-pressed={active}
                onClick={() => {
                  setIsAutoRatioSelected(false);
                  handleRatioClick(ratio);
                }}
                className={cn(
                  'flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-2 text-xs font-semibold transition',
                  active
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-zinc-200/90 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                )}
              >
                <span
                  className={
                    active ? 'text-white' : 'text-zinc-500'
                  }
                >
                  <AspectRatioIcon ratio={ratio.label} size={16} />
                </span>
                <span>{ratio.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Print sizes */}
      <div className='space-y-2 pt-4'>
        <p className='px-0.5 text-[13px] font-medium text-zinc-800'>
          Print size
        </p>
        {sizes.map(size => {
          const isSelected = selectedSize?.id === size?.id;
          const resolved = resolveCanvasSizePrice(
            size!,
            productForCanvasPricing
          );
          const price = resolved !== null ? resolved.toFixed(2) : null;
          const hideSecondary = dimensionsDuplicateDisplay(
            size!.width_in,
            size!.height_in,
            size!.display_label
          );

          return (
            <motion.button
              key={size!.id}
              type='button'
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSizeClick(size!)}
              className={cn(
                'w-full rounded-xl border px-3.5 py-3 text-left transition',
                isSelected
                  ? 'border-primary/45 bg-primary/[0.06] ring-1 ring-primary/20'
                  : 'border-zinc-200/90 bg-white hover:border-zinc-300 hover:bg-zinc-50/80',
                price === null && 'opacity-50'
              )}
              disabled={price === null}
            >
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <div className='text-[15px] font-semibold tracking-tight text-zinc-900'>
                    {size!.width_in}" × {size!.height_in}"
                  </div>
                  {!hideSecondary && (
                    <div className='mt-0.5 truncate text-xs text-zinc-500'>
                      {size!.display_label}
                    </div>
                  )}
                </div>
                <div className='shrink-0 text-right'>
                  {price !== null ? (
                    <span className='text-[15px] font-semibold tabular-nums text-primary'>
                      £{price}
                    </span>
                  ) : (
                    <span className='text-xs text-zinc-400'>No price</span>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default RatioSizePanel;
