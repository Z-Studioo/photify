import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { ConfirmationModal } from '@/components/shared/dashboard/ConfirmModal';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/common/toast';
import { useCart } from '@/context/CartContext';
import { useNavigate, useSearchParams } from 'react-router';
import { useUpload } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import { toast } from 'sonner';
import { uploadFileToStorage } from '@/lib/supabase/storage';
import { resolveCanvasSizePrice } from '@/lib/canvas-size-price';
import { useProductCanvasPricingProduct } from '@/hooks/use-product-canvas-pricing';
import { useDiscountedPrice, DiscountedAmount } from '@/components/shared/Price';
import {
  computePrintDpi,
  TARGET_PRINT_DPI,
  useImageDimensions,
} from '@/hooks/use-print-quality';
import { AlertTriangle } from 'lucide-react';

interface QuantityControlProps {
  onConfirm: () => Promise<void> | void;
  isConfirming?: boolean;
}

const dataUrlToFile = async (
  dataUrl: string,
  fileName: string
): Promise<File> => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
};

const getImageDimensions = (
  src: string
): Promise<{ width: number; height: number } | null> =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () =>
      img.naturalWidth && img.naturalHeight
        ? resolve({ width: img.naturalWidth, height: img.naturalHeight })
        : resolve(null);
    img.onerror = () => resolve(null);
    img.src = src;
  });

/** Allowed relative deviation between image aspect and ordered aspect. */
const ASPECT_TOLERANCE = 0.02;

const QuantityControl: React.FC<QuantityControlProps> = ({
  onConfirm,
  isConfirming = false,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [localConfirming, setLocalConfirming] = useState(false);
  const [priceData, setPriceData] = useState<{ sellPrice: number }>({
    sellPrice: 0,
  });
  const { addToast } = useToast();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const {
    selectedSize,
    selectedRatio,
    shape,
    selectedProduct,
    preview,
    cornerStyle,
    quality,
    edgeType,
    artFixedPrice,
    artName,
  } = useUpload();
  const pricingProduct = useProductCanvasPricingProduct(selectedProduct);
  const { setSelectedView } = useView();
  const [params] = useSearchParams();

  // Live print-quality estimate for the CURRENT preview at the selected size.
  const previewSrc = preview || params.get('image') || null;
  const previewDims = useImageDimensions(previewSrc);
  const printDpi = computePrintDpi(previewDims, selectedSize);
  const isLowDpi = printDpi !== null && printDpi < TARGET_PRINT_DPI;

  useEffect(() => {
    if (pricingProduct && selectedSize) {
      const canvasPrice =
        resolveCanvasSizePrice(selectedSize, pricingProduct) ?? 0;
      setPriceData({
        sellPrice: canvasPrice + artFixedPrice,
      });
    }
  }, [pricingProduct, selectedSize, artFixedPrice]);

  const handleConfirmClick = () => {
    setShowConfirmation(true);
  };

  const handleFinalConfirm = async () => {
    const imageUrl = preview || params.get('image') || '';
    if (!imageUrl) {
      return toast.error('No image selected to add to cart.');
    }
    setLocalConfirming(true);
    try {
      // Guard against ordering an image whose aspect ratio doesn't match the
      // selected print size (e.g. an uncropped photo on a 1:1 canvas) — this
      // is exactly what the print shop receives.
      if (selectedSize) {
        const dims = await getImageDimensions(imageUrl);
        if (dims) {
          const targetAspect = selectedSize.width_in / selectedSize.height_in;
          const actualAspect = dims.width / dims.height;
          if (
            Math.abs(actualAspect - targetAspect) / targetAspect >
            ASPECT_TOLERANCE
          ) {
            toast.error(
              `Your photo needs a quick crop to fit the ${selectedRatio || ''} format. Adjust the crop and press "Apply crop", then add to cart.`
            );
            setShowConfirmation(false);
            setSelectedView('crop');
            setLocalConfirming(false);
            return;
          }
          // Low-DPI consent is collected in the confirmation dialog before
          // this handler runs (see modal description below).
        }
      }

      await onConfirm();
      let finalImageUrl = imageUrl;
      if (imageUrl.startsWith('data:')) {
        const uploadToast = toast.loading('Uploading image to cart...');
        try {
          const fileName = `cart-image-${Date.now()}.jpg`;
          const file = await dataUrlToFile(imageUrl, fileName);
          const supabaseUrl = await uploadFileToStorage(file, 'cart-images');

          if (!supabaseUrl) {
            toast.error('Failed to upload image', { id: uploadToast });
            setLocalConfirming(false);
            return;
          }

          finalImageUrl = supabaseUrl;
          toast.dismiss(uploadToast);
        } catch (error) {
          console.error('Failed to upload image to Supabase:', error);
          toast.error('Failed to upload image', { id: uploadToast });
          setLocalConfirming(false);
          return;
        }
      }
      const productName = selectedProduct?.name?.trim() || 'Custom Canvas';
      const ratioLabel = selectedRatio || 'Custom Ratio';
      const sizeLabel = selectedSize?.display_label || 'Custom Size';
      const cartName = artName
        ? `${artName} — ${productName} — ${ratioLabel} ${sizeLabel}`
        : `${productName} — ${ratioLabel} — ${sizeLabel}`;

      addToCart({
        quantity: 1,
        // Unique per customization so a second upload with the same
        // size/shape becomes its own line item instead of merging into
        // (and losing the photo of) an existing one.
        id: `${selectedProduct?.id || 'custom'}-${selectedRatio || 'custom'}-${selectedSize?.display_label || 'custom'}-${shape || 'rectangular'}-${Date.now()}`,
        name: cartName,
        image: finalImageUrl,
        price: priceData.sellPrice,
        size: selectedSize?.display_label || 'Custom Size',
        customization: {
          edgeType: edgeType || 'wrapped',
          cornerStyle: cornerStyle || 'rounded',
          imageQuality: quality?.[0] ?? 100,
          shape: shape || 'rectangular',
        },
      });
      addToast('Added to cart. Adjust quantity at checkout if needed.', 'success');
      navigate('/cart');
      setShowConfirmation(false);
    } catch (error) {
      addToast('Failed to add to cart. Please try again.', 'error');
      console.warn(error);
    } finally {
      setLocalConfirming(false);
    }
  };

  const isProcessing = isConfirming || localConfirming;
  const unitBase = priceData.sellPrice;
  const { discounted: unitSell, original: unitActual, percentOff, hasDiscount } =
    useDiscountedPrice(unitBase);

  const sellWhole = Math.trunc(unitSell);
  const sellCents = unitSell.toFixed(2).split('.')[1];
  const actualWhole = Math.trunc(unitActual);
  const actualCents = unitActual.toFixed(2).split('.')[1];

  const bigPrice = (
    <span className='flex items-baseline font-semibold tabular-nums tracking-tight text-zinc-900'>
      <span className='text-base sm:text-lg'>£{sellWhole}</span>
      <span className='text-[10px] text-zinc-500 sm:text-xs'>.{sellCents}</span>
    </span>
  );

  const priceBlock = (
    <div className='min-w-0 flex-1 text-left'>
      {artFixedPrice > 0 ? (
        <div className='flex flex-col gap-0'>
          {bigPrice}
          <span className='hidden text-[9px] leading-tight text-zinc-400 sm:block sm:text-[10px]'>
            Art £{artFixedPrice.toFixed(2)} + Canvas £
            {(priceData.sellPrice - artFixedPrice).toFixed(2)}
          </span>
        </div>
      ) : hasDiscount ? (
        <div className='flex flex-col gap-0'>
          <div className='flex flex-wrap items-center gap-1'>
            <Badge
              variant='secondary'
              className='bg-green-100 px-1 py-0 text-[10px] font-medium text-green-700 sm:text-xs'
            >
              {percentOff}% OFF
            </Badge>
            {bigPrice}
          </div>
          <span className='flex items-baseline text-[10px] leading-tight text-zinc-400 line-through sm:text-xs'>
            <span>£{actualWhole}</span>
            <span className='text-[9px] sm:text-[10px]'>.{actualCents}</span>
          </span>
        </div>
      ) : (
        bigPrice
      )}
    </div>
  );

  return (
    <>
      {isLowDpi && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-2 flex w-full items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2'
        >
          <AlertTriangle className='mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600' />
          <p className='text-[11px] leading-snug text-amber-900 sm:text-xs'>
            This photo prints at about <strong>{printDpi} DPI</strong> on a{' '}
            {selectedSize?.display_label ?? 'this'} canvas ({TARGET_PRINT_DPI}{' '}
            DPI is ideal). A higher-resolution photo or a smaller size will
            look sharper.
          </p>
        </motion.div>
      )}
      <motion.div
        key='default-actions'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className='flex w-full min-w-0 flex-row items-center justify-between gap-2 sm:gap-3'
      >
        {priceBlock}

        <motion.div
          whileHover={{ scale: isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          className='shrink-0'
        >
          <Button
            variant='default'
            className='h-10 min-w-[10rem] rounded-xl px-5 text-sm font-semibold shadow-sm transition-all duration-200 sm:h-11 sm:min-w-[11rem] sm:px-6'
            onClick={handleConfirmClick}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 shrink-0 animate-spin' />
                Please wait
              </>
            ) : (
              'Next'
            )}
          </Button>
        </motion.div>
      </motion.div>

      <ConfirmationModal
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleFinalConfirm}
        title='Confirm Order'
        description={
          <>
            {`Add this print to your cart for £${unitSell.toFixed(2)}? You can change quantity at checkout.${
              artFixedPrice > 0
                ? ` (art £${artFixedPrice.toFixed(2)} + canvas £${(priceData.sellPrice - artFixedPrice).toFixed(2)})`
                : ''
            }`}
            {isLowDpi && (
              <span className='mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2'>
                <AlertTriangle className='mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600' />
                <span className='text-[11px] leading-snug text-amber-900'>
                  Heads up: this photo prints at about{' '}
                  <strong>{printDpi} DPI</strong> at this size (
                  {TARGET_PRINT_DPI} DPI is ideal), so it may look a little
                  soft. A higher-resolution photo or a smaller size would be
                  sharper.
                </span>
              </span>
            )}
          </>
        }
        confirmText={localConfirming ? 'Processing...' : 'Yes, add to cart'}
        cancelText='Cancel'
        isLoading={localConfirming}
      />
    </>
  );
};

export default QuantityControl;
