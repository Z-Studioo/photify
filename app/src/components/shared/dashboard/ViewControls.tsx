import { motion } from 'motion/react';
import { Box, /* Eye, */ ImagePlus, Home } from 'lucide-react';

interface ViewControlsProps {
  selectedView: string;
  onViewChange: (view: 'room' | '3d' | '3droom') => void;
  onAddImage: () => void;
}

const ViewControls: React.FC<ViewControlsProps> = ({
  selectedView,
  onViewChange,
  onAddImage,
}) => {
  return (
    <div
      className='fixed flex justify-between items-start md:w-9/12 top-16 md:top-18 md:px-4 pointer-events-none z-20'
      style={{ pointerEvents: 'none' }}
    >
      <motion.button
        onClick={onAddImage}
        className={`flex flex-col items-center justify-center px-2 py-2 md:px-2 md:py-2 bg-[var(--primary)] border border-gray-300 text-white hover:transition-all cursor-pointer shadow-sm pointer-events-auto flex-shrink-0 ${
          selectedView !== 'room'
            ? 'invisible pointer-events-none'
            : 'pointer-events-auto'
        }`}
        type='button'
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ImagePlus className='h-4 w-4 md:h-5 md:w-5 m-0 md:mb-1' />
        <span className='text-sm font-medium hidden md:inline'>Add Image</span>
      </motion.button>

      <motion.div
        className='fixed flex gap-2 pointer-events-auto right-0 md:right-2'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.5,
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className='flex border border-gray-300 divide-x divide-gray-300'>
          {/* Room View button temporarily hidden
          <motion.button
            onClick={() => onViewChange('room')}
            className={`flex items-center justify-center px-2 py-2 md:px-5 md:py-3 text-xs md:text-sm font-medium rounded-none cursor-pointer transition-all flex-shrink-0 whitespace-nowrap ${
              selectedView === 'room'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type='button'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className='hidden md:inline ml-1'>Room View</span>
          </motion.button>
          */}
          <motion.button
            onClick={() => onViewChange('3droom')}
            className={`flex items-center justify-center px-2 py-2 md:px-5 md:py-3 text-xs md:text-sm font-medium rounded-none cursor-pointer transition-all flex-shrink-0 whitespace-nowrap ${
              selectedView === '3droom'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type='button'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{
                rotate: selectedView === '3droom' ? 360 : 0,
                scale: selectedView === '3droom' ? 1.1 : 1,
              }}
              transition={{
                rotate: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 0.2 },
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Home className='h-4 w-4 md:h-5 md:w-5' />
            </motion.div>
            <span className='hidden md:inline ml-1'>3D Room</span>
          </motion.button>
          <motion.button
            onClick={() => onViewChange('3d')}
            className={`flex items-center justify-center px-2 py-2 md:px-5 md:py-3 text-xs md:text-sm font-medium rounded-none cursor-pointer transition-all flex-shrink-0 whitespace-nowrap ${
              selectedView === '3d'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type='button'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{
                rotateY: selectedView === '3d' ? 360 : 0,
                scale: selectedView === '3d' ? 1.1 : 1,
              }}
              transition={{
                rotateY: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 0.2 },
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Box className='h-4 w-4 md:h-5 md:w-5' />
            </motion.div>
            <span className='hidden md:inline ml-1'>3D View</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ViewControls;
