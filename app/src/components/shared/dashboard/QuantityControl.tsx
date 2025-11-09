import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MinusCircle } from 'lucide-react';

interface QuantityControlProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onConfirm: () => void;
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
}) => {
  return (
    <motion.div
      key='default-actions'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className='flex items-center justify-between gap-3 w-full'
    >
      <motion.div
        className='flex items-center justify-center space-x-2 flex-shrink-0'
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
          style={{ width: 'fit-content' }}
        >
          <Button
            variant='outline'
            size='icon'
            onClick={onDecrement}
            className='h-12 w-12 rounded-none transition-all duration-200 flex-shrink-0'
          >
            <MinusCircle className='h-6 w-6' />
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
          style={{ flex: '0 0 auto' }}
        >
          <Badge className='px-4 py-2 text-base rounded-none whitespace-nowrap'>
            {quantity}
          </Badge>
        </motion.div>
        <motion.div
          variants={buttonVariants}
          initial='idle'
          whileHover='hover'
          whileTap='tap'
          style={{ width: 'fit-content' }}
        >
          <Button
            variant='outline'
            size='icon'
            onClick={onIncrement}
            className='h-12 w-12 rounded-none transition-all duration-200 flex-shrink-0'
          >
            <PlusCircle className='h-6 w-6' />
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Button
          variant='default'
          className='w-full flex items-center justify-center px-8 py-4 text-base rounded-none transition-all duration-200'
          onClick={onConfirm}
        >
          CONFIRM CHANGES
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default QuantityControl;
