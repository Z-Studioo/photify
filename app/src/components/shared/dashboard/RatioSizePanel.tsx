import React, { useEffect, useRef, useState } from 'react';
import { Loader2, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpload } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import { AspectRatioIcon } from '../common/icons';
import {
  fetchRatios,
  findClosestRatio,
  getAllPrintSizes,
  getImageAspectRatio,
  getRatioValue,
  getSmallestSize,
  type InchData,
  type RatioData,
} from '@/utils/ratio-sizes';
import { getCenterCroppedImage } from '@/components/ui/crop';
import {
  computePrintDpi,
  printQualityLevel,
  useImageDimensions,
} from '@/hooks/use-print-quality';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { resolveCanvasSizePrice } from '@/lib/canvas-size-price';
import { useProductCanvasPricingProduct } from '@/hooks/use-product-canvas-pricing';
import { Price } from '@/components/shared/Price';

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
    originalPreview,
    file,
    selectedRatio,
    setSelectedRatio,
    selectedSize,
    setSelectedSize,
    selectedProduct,
    hasUserOverriddenRatio,
    setHasUserOverriddenRatio,
    commitSelection,
    setPendingFile,
    setPendingPreview,
    applyPendingChanges,
  } = useUpload();
  /**
   * "Match my photo" should always match the *original uploaded* photo's
   * aspect ratio, not whatever the current preview is (which becomes the
   * cropped image after the user applies a crop). Fall back to `preview`
   * when `originalPreview` isn't yet populated.
   */
  const sourceForAutoRatio = originalPreview || preview;

  const { setSelectedView } = useView();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Auto-match state derives from the persistent override flag: if the user
  // has overridden, we're not in auto mode. Initial `autoResolvedRatio` is
  // hydrated from the current `selectedRatio` when auto mode is still active,
  // so the "Match my photo" label remains stable across remounts.
  const [isAutoRatioSelected, setIsAutoRatioSelected] = useState(
    () => !hasUserOverriddenRatio
  );
  const [autoResolvedRatio, setAutoResolvedRatio] = useState<string | null>(
    () => (hasUserOverriddenRatio ? null : selectedRatio)
  );
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

  // Pixel dimensions of the image that will actually be printed (the
  // cropped preview), used to show an estimated DPI per print size.
  const previewDims = useImageDimensions(preview);

  // Default selection
  useEffect(() => {
    if (!ratios.length) return;

    const ratio =
      ratios.find(r => r.label === selectedRatio) ||
      ratios.find(r => r.label === '1:1') ||
      ratios[0];

    if (!ratio) return;

    const smallest = getSmallestSize(ratio);

    // Defaults are the committed baseline — nothing earlier to cancel back to.
    commitSelection(
      selectedRatio ? null : ratio.label,
      selectedSize ? null : smallest
    );

    onSelectionChange?.(ratio.label, smallest);
  }, [ratios, inches]);

  const handleRatioClick = (ratio: RatioData) => {
    const smallest = getSmallestSize(ratio);

    setHasUserOverriddenRatio(true);
    setIsAutoRatioSelected(false);
    // Live (uncommitted) selection: cancelling the crop reverts to the
    // committed ratio/size; applying the crop commits these.
    setSelectedRatio(ratio.label);
    setSelectedSize(smallest);
    onSelectionChange?.(ratio.label, smallest);
    setSelectedView('crop');

    sectionRefs.current[ratio.id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  /**
   * When the current preview doesn't fit the matched ratio, auto-apply a
   * centered full-resolution crop of the original photo so the user can go
   * straight to cart. The crop editor stays available for fine-tuning.
   */
  const autoCropToRatio = async (targetAspect: number) => {
    if (!file || !sourceForAutoRatio || targetAspect <= 0) return;

    // If the committed preview already matches (e.g. a restored crop), keep it.
    const previewAspect = preview ? await getImageAspectRatio(preview) : null;
    if (
      previewAspect &&
      Math.abs(previewAspect - targetAspect) / targetAspect <= 0.02
    ) {
      return;
    }

    const autoCropped = await getCenterCroppedImage(
      sourceForAutoRatio,
      targetAspect
    );
    if (!autoCropped) return;

    setPendingFile(file);
    setPendingPreview(autoCropped);
    await applyPendingChanges();
  };

  const applyAutoRatio = async ({
    shouldSwitchToCrop,
  }: { shouldSwitchToCrop: boolean }) => {
    if (!sourceForAutoRatio || !ratios.length) return false;

    const imageAspectRatio = await getImageAspectRatio(sourceForAutoRatio);
    if (!imageAspectRatio) return false;

    const closestRatio = findClosestRatio(imageAspectRatio, ratios);
    if (!closestRatio) return false;

    const smallest = getSmallestSize(closestRatio);

    setIsAutoRatioSelected(true);
    // The matched ratio is the new baseline: commit it so a later crop-cancel
    // can't revert the cropper to a stale ratio from a previous session
    // (e.g. a square cropper on a 2:3 photo).
    commitSelection(closestRatio.label, smallest);
    onSelectionChange?.(closestRatio.label, smallest);
    if (shouldSwitchToCrop) {
      setSelectedView('crop');
    }
    setAutoResolvedRatio(closestRatio.label);

    // Fit the photo to the matched ratio automatically (centered crop), so
    // proceeding to cart works without a mandatory manual crop step.
    await autoCropToRatio(getRatioValue(closestRatio));
    return true;
  };

  const handleAutoRatioClick = async () => {
    setHasUserOverriddenRatio(false);
    await applyAutoRatio({ shouldSwitchToCrop: true });
  };

  useEffect(() => {
    if (!sourceForAutoRatio || !ratios.length || !inches.length) return;
    if (lastAutoAppliedPreviewRef.current === sourceForAutoRatio) return;
    if (hasUserOverriddenRatio) {
      lastAutoAppliedPreviewRef.current = sourceForAutoRatio;
      return;
    }

    lastAutoAppliedPreviewRef.current = sourceForAutoRatio;
    void applyAutoRatio({ shouldSwitchToCrop: false });
  }, [sourceForAutoRatio, ratios, inches, hasUserOverriddenRatio]);

  const handleSizeClick = (size: InchData) => {
    setHasUserOverriddenRatio(true);
    setIsAutoRatioSelected(false);
    // Size changes within the current ratio apply immediately (no crop step),
    // so commit them right away.
    commitSelection(selectedRatio, size);
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
          const dpi = computePrintDpi(previewDims, size!);
          const quality = dpi !== null ? printQualityLevel(dpi) : null;

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
                  {quality && (
                    <div
                      className={cn(
                        'mt-0.5 text-[11px] font-medium',
                        quality === 'excellent' && 'text-green-600',
                        quality === 'good' && 'text-amber-600',
                        quality === 'low' && 'text-red-600'
                      )}
                    >
                      {quality === 'excellent'
                        ? `Excellent quality · ${dpi} DPI`
                        : quality === 'good'
                          ? `Good quality · ${dpi} DPI`
                          : `Low quality · ${dpi} DPI`}
                    </div>
                  )}
                </div>
                <div className='shrink-0 text-right'>
                  {price !== null ? (
                    <Price amount={parseFloat(price)} variant='compact' />
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
