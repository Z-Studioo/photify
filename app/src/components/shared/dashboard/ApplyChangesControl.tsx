import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';

interface PriceData {
  actual_price: number;
  sell_price: number;
}

interface ApplyChangesControlProps {
  pricePerItem: number;
  quantity: number;
  selectedSize?: PriceData | null;
  onApply: () => void;
}

const ApplyChangesControl: React.FC<ApplyChangesControlProps> = ({
  pricePerItem,
  quantity,
  selectedSize,
  onApply,
}) => {
  const totalPrice = pricePerItem * quantity;
  const hasDiscount =
    selectedSize && selectedSize.actual_price > selectedSize.sell_price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((selectedSize.actual_price - selectedSize.sell_price) /
          selectedSize.actual_price) *
          100
      )
    : 0;

  return (
    <motion.div
      key='feature-actions'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className='flex items-center justify-between gap-3 w-full'
    >
      <motion.div
        className='flex flex-col flex-shrink-0'
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <motion.span
          className='text-xl font-semibold whitespace-nowrap'
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.15,
            type: 'spring',
            stiffness: 300,
          }}
        >
          £{totalPrice.toFixed(2)}
        </motion.span>

        {hasDiscount && (
          <motion.div
            className='text-sm whitespace-nowrap'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <span className='line-through text-gray-500'>
              £{(selectedSize.actual_price * quantity).toFixed(2)}
            </span>
            <span className='ml-2 text-green-600 font-medium'>
              {discountPercentage}% OFF
            </span>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Button
          variant='default'
          className='w-full px-6 py-2 rounded-none whitespace-nowrap transition-all duration-200'
          onClick={onApply}
        >
          Apply Changes
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default ApplyChangesControl;
