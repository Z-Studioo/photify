import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WallCarouselProps {
  images: string[];
  currentIndex: number;
  slideDirection: 'left' | 'right';
  onPrevious: () => void;
  onNext: () => void;
  onSelectIndex: (index: number) => void;
}

const slideVariants = {
  enter: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? '100%' : '-100%',
  }),
  center: { x: 0 },
  exit: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? '-100%' : '100%',
  }),
};

const WallCarousel: React.FC<WallCarouselProps> = ({
  images,
  currentIndex,
  slideDirection,
  onPrevious,
  onNext,
  onSelectIndex,
}) => {
  return (
    <div className='relative w-full h-full overflow-hidden'>
      <AnimatePresence mode='wait' custom={slideDirection}>
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt='Room'
          className='w-full h-full object-cover'
          custom={slideDirection}
          variants={slideVariants}
          initial='enter'
          animate='center'
          exit='exit'
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            duration: 0.6,
          }}
        />
      </AnimatePresence>

      {/* Left Arrow */}
      <motion.button
        onClick={onPrevious}
        className='cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 
             bg-white/80 hover:bg-white
             p-2 sm:p-3 rounded-full shadow-lg hover:shadow-2xl z-10
             transition-all duration-150 ease-out
             group'
        type='button'
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        whileHover={{
          scale: 1.15,
          transition: {
            duration: 0.15,
            ease: [0.33, 1, 0.68, 1],
          },
        }}
        whileTap={{ 
          scale: 0.95,
          transition: { duration: 0.05, ease: 'easeOut' }
        }}
      >
        <ChevronLeft className='h-4 w-4 sm:h-6 sm:w-6 text-gray-800 
          transition-transform duration-150 ease-out
          group-hover:-translate-x-0.5' />
      </motion.button>

      {/* Right Arrow */}
      <motion.button
        onClick={onNext}
        className='cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 
             bg-white/80 hover:bg-white
             p-2 sm:p-3 rounded-full shadow-lg hover:shadow-2xl z-10
             transition-all duration-150 ease-out
             group'
        type='button'
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        whileHover={{
          scale: 1.15,
          transition: {
            duration: 0.15,
            ease: [0.33, 1, 0.68, 1],
          },
        }}
        whileTap={{ 
          scale: 0.95,
          transition: { duration: 0.05, ease: 'easeOut' }
        }}
      >
        <ChevronRight className='h-4 w-4 sm:h-6 sm:w-6 text-gray-800 
          transition-transform duration-150 ease-out
          group-hover:translate-x-0.5' />
      </motion.button>

      {/* Wall Indicator Dots */}
      <motion.div
        className='absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1 sm:space-x-1.5 z-10'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        {images.map((image, index) => (
          <motion.button
            key={image}
            onClick={() => onSelectIndex(index)}
            className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white shadow-md'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              scale: index === currentIndex ? 1.3 : 1,
              opacity: index === currentIndex ? 1 : 0.6,
            }}
            type='button'
          />
        ))}
      </motion.div>
    </div>
  );
};

export default WallCarousel;
