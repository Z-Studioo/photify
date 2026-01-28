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
    navigate(`/dashboard`, { replace: true });
  };

  return (
    <>
      <Header />
      <div className='flex flex-col md:flex-row h-[calc(var(--vh,1vh)*100-100px)] w-full bg-app-muted rounded-2xl overflow-hidden'>
        <div className='flex flex-col h-1/2 md:h-full md:flex-1 items-center justify-center p-4 md:p-8 bg-white/80 backdrop-blur-sm overflow-hidden'>
          <div className='w-full h-full flex items-center justify-center overflow-hidden'>
            <ImageCropper />
          </div>
        </div>

        <div className='h-1/2 md:h-full w-full md:w-[380px] bg-white flex flex-col border-t md:border-t-0 md:border-l'>
          <div className='flex-1 overflow-y-auto pb-20 md:pb-4'>
            <CropPanel />
          </div>

          <div
            className='w-full bg-white border-t p-4 absolute bottom-0 left-0 md:static md:border-t md:p-4 md:block'
            style={{
              bottom: 'env(safe-area-inset-bottom, 0px)',
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div className='max-w-[380px] mx-auto md:mx-0'>
              <Button
                size='lg'
                className='w-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed'
                // disabled={!imageUrl}
                onClick={handleApply}
              >
                Apply & Continue
                <Check className='ml-2 h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
