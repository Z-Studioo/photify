import logo from '@/assets/images/logo.svg';
import { motion, AnimatePresence } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CircleQuestionMark, ArrowLeft, RefreshCw } from 'lucide-react';
import { useView } from '@/context/ViewContext';
import { useFeature } from '@/context/dashboard/FeatureContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onReset?: () => void;
  isResetting?: boolean;
}

const Navbar = ({ onReset, isResetting }: NavbarProps) => {
  const { setSelectedFeature } = useFeature();
  const { setSelectedView } = useView();
  const navigate = useNavigate();
  const [showHomeDialog, setShowHomeDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleStartTour = () => {
    setSelectedFeature(null);
    setSelectedView('room');
    localStorage.removeItem('dashboard-tour-completed');
    window.location.reload();
  };

  return (
    <>
      {/* Leave editor dialog */}
      <AlertDialog open={showHomeDialog} onOpenChange={setShowHomeDialog}>
        <AlertDialogContent className='max-w-sm rounded-2xl p-0 overflow-hidden'>
          <div className='h-2 bg-gradient-to-r from-[#f63a9e] to-purple-500' />
          <div className='px-6 pt-5 pb-6'>
            <AlertDialogHeader className='space-y-2'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0'>
                  <ArrowLeft className='w-5 h-5 text-[#f63a9e]' />
                </div>
                <AlertDialogTitle
                  className="font-['Bricolage_Grotesque',_sans-serif] text-lg text-gray-900"
                  style={{ fontWeight: '700' }}
                >
                  Leave the editor?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className='text-sm text-gray-500 leading-relaxed pl-[52px]'>
                Your current progress will be lost if you leave now. Are you
                sure you want to go back to the home page?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className='flex-col sm:flex-row gap-2 mt-5'>
              <AlertDialogCancel className='w-full sm:w-auto rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium'>
                Keep editing
              </AlertDialogCancel>
              <AlertDialogAction
                className='w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#f63a9e] to-purple-500 hover:opacity-90 text-white font-semibold shadow-md shadow-pink-200/50'
                onClick={() => navigate('/')}
              >
                Yes, go home
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset all dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className='max-w-sm rounded-2xl p-0 overflow-hidden'>
          <div className='h-2 bg-gradient-to-r from-red-400 to-orange-400' />
          <div className='px-6 pt-5 pb-6'>
            <AlertDialogHeader className='space-y-2'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0'>
                  <RefreshCw className='w-5 h-5 text-red-500' />
                </div>
                <AlertDialogTitle
                  className="font-['Bricolage_Grotesque',_sans-serif] text-lg text-gray-900"
                  style={{ fontWeight: '700' }}
                >
                  Reset everything?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className='text-sm text-gray-500 leading-relaxed pl-[52px]'>
                This will clear all your customizations and restore the editor
                to its default state. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className='flex-col sm:flex-row gap-2 mt-5'>
              <AlertDialogCancel className='w-full sm:w-auto rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium'>
                Keep my changes
              </AlertDialogCancel>
              <AlertDialogAction
                className='w-full sm:w-auto rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md shadow-red-200/50'
                onClick={() => onReset?.()}
              >
                Yes, reset all
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <header className='w-full bg-background border-b shadow-sm'>
        <div className='container mx-auto px-0 py-3 flex items-center justify-between'>
          {/* Left: back arrow + logo */}
          <div className='flex items-center gap-2'>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHomeDialog(true)}
              className='flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 text-gray-600'
              aria-label='Go back'
            >
              <ArrowLeft className='h-5 w-5' />
            </motion.button>
            <div
              className='flex items-center cursor-pointer'
              onClick={() => setShowHomeDialog(true)}
            >
              <img src={logo} alt='WHITEWALL Logo' className='h-10 w-auto' />
            </div>
          </div>

          {/* Right: Reset All + help */}
          <div className='flex items-center space-x-2'>
            {onReset && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowResetDialog(true)}
                disabled={isResetting}
                className='flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-500 cursor-pointer select-none px-3 py-2 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors'
              >
                <RefreshCw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                <span className='hidden sm:inline'>{isResetting ? 'Resetting...' : 'Reset All'}</span>
              </motion.button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className='flex items-center text-sm md:text-base font-medium text-gray-700 cursor-pointer select-none px-3 py-2 rounded-md hover:bg-gray-100'
                >
                  <motion.div
                    animate={{ rotate: 0, scale: 1.05 }}
                    transition={{
                      rotate: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                      scale: { duration: 0.2 },
                    }}
                    className='flex items-center justify-center flex-shrink-0'
                  >
                    <CircleQuestionMark className='h-4 w-4 md:w-5 md:h-5' />
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
        </div>
      </header>
    </>
  );
};

export default Navbar;
