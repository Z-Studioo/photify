import { motion } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CircleQuestionMark } from 'lucide-react';
import { useView } from '@/context/ViewContext';
import { useFeature } from '@/context/dashboard/FeatureContext';

interface NavbarProps {
  /** No full-width header bar — compact floating controls for an immersive canvas. */
  immersive?: boolean;
}

const Navbar = ({ immersive = false }: NavbarProps) => {
  const { setSelectedFeature } = useFeature();
  const { setSelectedView } = useView();

  const handleStartTour = () => {
    setSelectedFeature(null);
    setSelectedView('3droom');
    localStorage.removeItem('dashboard-tour-completed');
    window.location.reload();
  };

  const helpMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          type='button'
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className='flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100'
          aria-label='Help'
        >
          <CircleQuestionMark className='h-4 w-4 md:h-5 md:w-5' />
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='rounded-xs shadow-md'>
        <DropdownMenuItem onClick={handleStartTour} className='cursor-pointer'>
          How to use the editor?
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (immersive) return null;

  return (
    <header className='w-full border-b bg-background shadow-sm'>
      <div className='container mx-auto flex items-center justify-end px-0 py-3'>
        {helpMenu}
      </div>
    </header>
  );
};

export default Navbar;
