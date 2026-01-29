import logo from '@/assets/images/logo.svg';
import { motion, AnimatePresence } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CircleQuestionMark,
  Download,
  Upload,
  FileText,
  Loader2,
} from 'lucide-react';
import { useView } from '@/context/ViewContext';
import { useFeature } from '@/context/dashboard/FeatureContext';
import { usePreset } from '@/context/PresetContext';
import { ImportConfirmationModal } from '@/components/shared/dashboard/ImportConfirmationModal';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { setSelectedFeature } = useFeature();
  const { setSelectedView } = useView();
  const {
    isExporting,
    exportConfiguration,
    handleImportFile,
    importModalOpen,
    importSummary,
    isImporting,
    confirmImport,
    cancelImport,
    handleReUpload,
  } = usePreset();

  const handleStartTour = () => {
    setSelectedFeature(null);
    setSelectedView('room');
    localStorage.removeItem('dashboard-tour-completed');
    window.location.reload();
  };

  return (
    <>
      <header className='w-full bg-background border-b shadow-sm'>
        <div className='container mx-auto px-0 py-3 flex items-center justify-between'>
          <Link to='/' className='flex items-center space-x-2 cursor-pointer'>
            <img src={logo} alt='WHITEWALL Logo' className='h-10 w-auto' />
          </Link>

          <div className='flex items-center space-x-2'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className='flex items-center text-sm md:text-base font-medium text-gray-700 cursor-pointer select-none px-3 py-2 rounded-md hover:bg-gray-100'
                >
                  <motion.div
                    animate={{
                      scale: 1.05,
                    }}
                    transition={{
                      scale: { duration: 0.2 },
                    }}
                    className='flex items-center justify-center flex-shrink-0'
                  >
                    <FileText className='h-4 w-4 md:w-5 md:h-5' />
                  </motion.div>
                </motion.div>
              </DropdownMenuTrigger>

              <DropdownMenuContent align='end' className='rounded-xs shadow-md'>
                <DropdownMenuItem
                  onClick={exportConfiguration}
                  disabled={isExporting}
                  className='cursor-pointer flex items-center'
                >
                  <Download className='h-4 w-4 mr-2' />
                  {isExporting ? 'Exporting...' : 'Export as JSON'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleImportFile}
                  className='cursor-pointer flex items-center'
                >
                  <Upload className='h-4 w-4 mr-2' />
                  Import Preset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ImportConfirmationModal
              open={importModalOpen}
              onOpenChange={cancelImport}
              onConfirm={confirmImport}
              onReUpload={handleReUpload}
              importSummary={importSummary}
              isImporting={isImporting}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className='flex items-center text-sm md:text-base font-medium text-gray-700 cursor-pointer select-none px-3 py-2 rounded-md hover:bg-gray-100'
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

      <AnimatePresence>
        {isImporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center'
          >
            <Loader2 className='h-16 w-16 animate-spin text-pink-500' />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
