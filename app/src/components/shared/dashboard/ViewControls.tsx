import { motion } from 'motion/react';
import { /* Box, Eye, */ ImagePlus } from 'lucide-react';

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
      className='fixed flex justify-between items-start md:w-9/12 top-14 md:top-[3.75rem] md:px-4 pointer-events-none z-20'
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

      {/* View toggle (Room View / 3D Room / 3D View) — hidden. Only the
         3D Room view is used, so the toggle adds no value. Keep the
         onViewChange prop so the page can still programmatically switch
         views. */}
    </div>
  );
};

export default ViewControls;
