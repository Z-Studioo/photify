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
import { toast } from 'sonner';
import { uploadFileToStorage } from '@/lib/supabase/storage';
import { resolveCanvasSizePrice } from '@/lib/canvas-size-price';
import { useProductCanvasPricingProduct } from '@/hooks/use-product-canvas-pricing';

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

const QuantityControl: React.FC<QuantityControlProps> = ({
  onConfirm,
  isConfirming = false,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [localConfirming, setLocalConfirming] = useState(false);
  const [priceData, setPriceData] = useState<{
    sellPrice: number;
    actualPrice: number;
  }>({
    sellPrice: 0,
    actualPrice: 0,
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
  const [params] = useSearchParams();

  useEffect(() => {
    if (pricingProduct && selectedSize) {
      const canvasPrice =
        resolveCanvasSizePrice(selectedSize, pricingProduct) ?? 0;
      setPriceData({
        sellPrice: canvasPrice + artFixedPrice,
        actualPrice: canvasPrice + artFixedPrice,
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
      addToCart({
        quantity: 1,
        id: `${selectedRatio || 'custom'}-${selectedSize?.display_label || 'custom'}-${shape || 'rectangular'}`,
        name: artName
          ? `${artName} — ${selectedRatio || 'Custom Ratio'} ${selectedSize?.display_label || 'Custom Size'}`
          : `${selectedRatio || 'Custom Ratio'} - ${selectedSize?.display_label || 'Custom Size'} - ${shape || 'Rectangular'}`,
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
  const unitSell = priceData.sellPrice;
  const unitActual = priceData.actualPrice;
  const hasDiscount = unitActual > unitSell;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((unitActual - unitSell) / unitActual) * 100
      )
    : 0;

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
              {discountPercentage}% OFF
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
              'Confirm changes'
            )}
          </Button>
        </motion.div>
      </motion.div>

      <ConfirmationModal
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleFinalConfirm}
        title='Confirm Order'
        description={`Add this print to your cart for £${unitSell.toFixed(2)}? You can change quantity at checkout.${
          artFixedPrice > 0
            ? ` (art £${artFixedPrice.toFixed(2)} + canvas £${(priceData.sellPrice - artFixedPrice).toFixed(2)})`
            : ''
        }`}
        confirmText={localConfirming ? 'Processing...' : 'Yes, add to cart'}
        cancelText='Cancel'
        isLoading={localConfirming}
      />
    </>
  );
};

export default QuantityControl;
