import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MinusCircle, Loader2 } from 'lucide-react';
import { ConfirmationModal } from '@/components/shared/dashboard/ConfirmModal';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/common/toast';
import { useCart } from '@/context/CartContext';
import { useNavigate, useSearchParams } from 'react-router';
import { useUpload } from '@/context/UploadContext';
import { toast } from 'sonner';

interface QuantityControlProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onConfirm: () => Promise<void> | void;
  isConfirming?: boolean;
}

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onIncrement,
  onDecrement,
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
  const { selectedSize, selectedRatio, shape, selectedProduct } =
    useUpload();
    const [params] = useSearchParams()
  // Get price data from localStorage
  // useEffect(() => {
  //   const loadPriceData = () => {
  //     try {
  //       const metadataStr = localStorage.getItem('photify_metadata');
  //       if (metadataStr) {
  //         const metadata: Metadata = JSON.parse(metadataStr);
  //         const sellPrice = metadata.selectedSize?.sell_price || 0;
  //         const actualPrice = metadata.selectedSize?.actual_price || sellPrice;
  //         setPriceData({ sellPrice, actualPrice });
  //       }
  //     } catch (error) {
  //       console.error('Error loading price data from localStorage:', error);
  //     }
  //   };

  //   loadPriceData();

  //   const handleStorageChange = (e: StorageEvent) => {
  //     if (e.key === 'photify_metadata') {
  //       loadPriceData();
  //     }
  //   };

  //   window.addEventListener('storage', handleStorageChange);
  //   return () => window.removeEventListener('storage', handleStorageChange);
  // }, []);

  // useEffect(() => {
  //   const metadataStr = localStorage.getItem('photify_metadata');
  //   if (metadataStr) {
  //     const metadata: Metadata = JSON.parse(metadataStr);
  //     const sellPrice = metadata.selectedSize?.sell_price || 0;
  //     const actualPrice = metadata.selectedSize?.actual_price || sellPrice;
  //     setPriceData({ sellPrice, actualPrice });
  //   }
  // }, [quantity]);

  useEffect(() => {
    if (selectedProduct && selectedSize) {
      setPriceData({
        sellPrice: +(selectedProduct.price || 0) * selectedSize.area_in2,
        actualPrice: +selectedProduct.price * selectedSize.area_in2,
      });
    }
  }, [selectedProduct, selectedSize]);

  const handleConfirmClick = () => {
    setShowConfirmation(true);
  };

  const handleFinalConfirm = async () => {
    if(!params.get("image")) {
      return toast.error('No image selected to add to cart.');
    }
    setLocalConfirming(true);
    try {
      await onConfirm();
      addToCart({
        quantity,
        id: `${selectedRatio || 'custom'}-${selectedSize?.display_label || 'custom'}-${shape || 'rectangular'}`,
        name: `${selectedRatio || 'Custom Ratio'} - ${selectedSize?.display_label || 'Custom Size'} - ${shape || 'Rectangular'}`,
        image: params.get('image') || '',
        price: priceData.sellPrice,
        size: selectedSize?.display_label || 'Custom Size',
      });
      addToast('Quantity updated and added to cart successfully!', 'success');
      navigate('/cart');
      setShowConfirmation(false);
    } catch (error) {
      addToast('Failed to update quantity. Please try again.', 'error');
      console.warn(error);
    } finally {
      setLocalConfirming(false);
    }
  };

  const isProcessing = isConfirming || localConfirming;
  const totalActualPrice = priceData.actualPrice * quantity;
  const totalSellPrice = priceData.sellPrice * quantity;
  const hasDiscount = priceData.actualPrice > priceData.sellPrice;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((priceData.actualPrice - priceData.sellPrice) /
          priceData.actualPrice) *
          100
      )
    : 0;

  return (
    <>
      <motion.div
        key='default-actions'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className='flex items-end justify-between gap-3 w-full'
      >
        <motion.div
          className='flex items-center space-x-1 flex-shrink-0'
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.1,
            duration: 0.3,
            type: 'spring',
            stiffness: 300,
          }}
        >
          <motion.div
            variants={buttonVariants}
            initial='idle'
            whileHover='hover'
            whileTap='tap'
          >
            <Button
              variant='outline'
              size='icon'
              onClick={onDecrement}
              className='h-9 w-9 rounded-none transition-all duration-200'
              disabled={isProcessing}
            >
              <MinusCircle className='h-4 w-4' />
            </Button>
          </motion.div>

          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.15,
              type: 'spring',
              stiffness: 400,
            }}
          >
            <Badge className='px-3 py-1.5 text-sm rounded-none min-w-[45px] justify-center'>
              {quantity}
            </Badge>
          </motion.div>

          <motion.div
            variants={buttonVariants}
            initial='idle'
            whileHover='hover'
            whileTap='tap'
          >
            <Button
              variant='outline'
              size='icon'
              onClick={onIncrement}
              className='h-9 w-9 rounded-none transition-all duration-200'
              disabled={isProcessing}
            >
              <PlusCircle className='h-4 w-4' />
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className='flex flex-col items-end gap-0 flex-1 min-w-0'
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className='w-full text-right mb-0.5'
          >
            {hasDiscount ? (
              <div className='flex flex-col items-end -space-y-1'>
                <div className='flex items-baseline justify-end gap-1'>
                  <Badge
                    variant='secondary'
                    className='bg-green-100 text-green-700 text-xs font-medium px-1 py-0'
                  >
                    {discountPercentage}% OFF
                  </Badge>
                  <span className='text-base font-bold text-gray-900'>
                    ${totalSellPrice.toFixed(2)}
                  </span>
                </div>

                <div>
                  <span className='text-xs text-gray-500 line-through leading-tight'>
                    ${totalActualPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <span className='text-base font-bold text-gray-900'>
                ${totalSellPrice.toFixed(2)}
              </span>
            )}
          </motion.div>

          <motion.div
            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
            className='w-full'
          >
            <Button
              variant='default'
              className='w-full flex items-center justify-center px-4 py-2 text-sm rounded-none transition-all duration-200 gap-1 whitespace-nowrap'
              onClick={handleConfirmClick}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className='h-3 w-3 animate-spin' />
                  PLEASE WAIT
                </>
              ) : (
                'CONFIRM CHANGES'
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      <ConfirmationModal
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleFinalConfirm}
        title='Confirm Order'
        description={`You are about to place an order for ${quantity} canvas${quantity > 1 ? 'es' : ''} for $${totalSellPrice.toFixed(2)}`}
        confirmText={localConfirming ? 'Processing...' : 'Yes, Confirm Order'}
        cancelText='Cancel'
        isLoading={localConfirming}
      />
    </>
  );
};

export default QuantityControl;
