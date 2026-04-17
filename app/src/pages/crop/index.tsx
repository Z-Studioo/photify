import { useNavigate } from 'react-router';
import ImageCropper from '@/components/shared/common/ImageCropper';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import CropPanel from '@/components/shared/crop/CropPanel';
import { useEffect } from 'react';
import { Header } from '@/components/layout/header';

export default function CropPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  const handleApply = () => {
    // applyPendingChanges();
    navigate(`/canvas-configurer`, { replace: true });
  };

  return (
    <>
      <Header />
      <div className='flex flex-col md:flex-row h-[calc(var(--vh,1vh)*100-64px)] sm:h-[calc(var(--vh,1vh)*100-100px)] w-full bg-gray-100 overflow-hidden mx-auto'>
        <div className='flex flex-col h-1/2 md:h-full md:flex-1 items-center justify-center p-2 sm:p-4 md:p-8 bg-white/80 backdrop-blur-sm overflow-hidden rounded-t-xl md:rounded-l-xl md:rounded-tr-none'>
          <div className='w-full h-full flex items-center justify-center overflow-hidden'>
            <ImageCropper />
          </div>
        </div>

        <div className='h-1/2 md:h-full w-full md:w-[400px] lg:w-[460px] xl:w-[520px] bg-white flex flex-col border-t md:border-t-0 md:border-l rounded-b-xl md:rounded-r-xl md:rounded-bl-none'>
          <div className='flex-1 overflow-y-auto pb-16 sm:pb-20 md:pb-4'>
            <CropPanel />
          </div>

          <div
            className='w-full bg-white border-t p-3 sm:p-4 fixed md:static bottom-0 left-0 right-0 z-10 shadow-lg md:shadow-none'
            style={{
              bottom: 'env(safe-area-inset-bottom, 0px)',
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div className='max-w-[520px] mx-auto md:mx-0'>
              <Button
                size='lg'
                className='w-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed h-11 sm:h-12 text-sm sm:text-base'
                // disabled={!imageUrl}
                onClick={handleApply}
              >
                Apply & Continue
                <Check className='ml-2 h-4 w-4 sm:h-5 sm:w-5' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
