import logo from '@/assets/images/logo.svg';
import { motion } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CircleQuestionMark } from 'lucide-react';
import { useView } from '@/context/ViewContext';
import { useNextStep } from 'nextstepjs';
import { useFeature } from '@/context/dashboard/FeatureContext';

const Navbar = () => {
  const { startNextStep } = useNextStep();
  const { setSelectedFeature } = useFeature();
  const { setSelectedView } = useView();

  const handleStartTour = () => {
    setSelectedFeature(null);
    setSelectedView('room');
    startNextStep('dashboard-tour');
  };

  return (
    <header className='w-full bg-background border-b shadow-sm'>
      <div className='container mx-auto px-0 py-3 flex items-center justify-between'>
        {/* Left: Logo */}
        <div className='flex items-center space-x-2 cursor-pointer'>
          <img src={logo} alt='WHITEWALL Logo' className='h-10 w-auto' />
        </div>

        {/* Right: Info label (not button) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              data-tour='info-menu-label'
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className='absolute flex items-center text-sm md:text-base font-medium text-gray-700 cursor-pointer select-none right-2 md:right-8 lg:right-14'
            >
              <motion.div
                animate={{
                  rotate: 0,
                  scale: 1.05,
                }}
                transition={{
                  rotate: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                  scale: { duration: 0.2 },
                }}
                className='flex items-center justify-center flex-shrink-0  '
              >
                <CircleQuestionMark className='h-4 w-4 md:w-5 md:h-5 mr-1' />
              </motion.div>
            </motion.div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align='end' className='rounded-xs shadow-md'>
            <DropdownMenuItem
              onClick={handleStartTour}
              className='cursor-pointer'
            >
              How to use the editor?
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
