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
      className='flex w-full min-w-0 items-center justify-between gap-2 sm:gap-3'
    >
      <motion.div
        className='flex min-w-0 flex-1 flex-col gap-0 text-left'
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <motion.span
          className='flex items-baseline font-semibold tabular-nums tracking-tight text-zinc-900'
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.15,
            type: 'spring',
            stiffness: 300,
          }}
        >
          <span className='text-base sm:text-lg'>£{Math.trunc(totalPrice)}</span>
          <span className='text-[10px] text-zinc-500 sm:text-xs'>
            .{totalPrice.toFixed(2).split('.')[1]}
          </span>
        </motion.span>

        {hasDiscount && (
          <motion.div
            className='text-[10px] whitespace-nowrap sm:text-xs'
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
        className='shrink-0'
      >
        <Button
          variant='default'
          className='h-10 min-w-[10rem] rounded-xl px-5 text-sm font-semibold shadow-sm transition-all duration-200 sm:h-11 sm:min-w-[11rem] sm:px-6'
          onClick={onApply}
        >
          Apply changes
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default ApplyChangesControl;
