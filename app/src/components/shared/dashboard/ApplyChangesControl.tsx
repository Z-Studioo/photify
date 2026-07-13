import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { DiscountedAmount } from '@/components/shared/Price';

interface ApplyChangesControlProps {
  pricePerItem: number;
  quantity: number;
  onApply: () => void;
}

const ApplyChangesControl: React.FC<ApplyChangesControlProps> = ({
  pricePerItem,
  quantity,
  onApply,
}) => {
  const totalPrice = pricePerItem * quantity;

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
        <DiscountedAmount
          amount={totalPrice}
          stacked
          showBadge
          className='min-w-0 flex-1 flex-col gap-0 text-left'
        />
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
