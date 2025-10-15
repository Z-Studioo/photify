import { useNavigate } from 'react-router';
import CropRatioSelector from '@/components/shared/crop/CropRatioSelector';
import CropImage from '@/components/shared/crop/CropImage';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useUpload } from '@/context/UploadContext';

export default function CropPage() {
  const navigate = useNavigate();
  const { pendingFile, pendingPreview, applyPendingChanges } = useUpload();

  const handleApply = () => {
    applyPendingChanges();

    navigate('/dashboard');
  };

  return (
    <div className='flex flex-col md:flex-row h-[calc(100vh-5px)] w-full bg-app-muted rounded-2xl overflow-hidden'>
      {/* Left - Cropper */}
      <div className='flex-1 flex items-center justify-center p-4 md:p-8 bg-white/80 backdrop-blur-sm'>
        <div className='w-full max-w-[90%] max-h-[90vh] flex items-center justify-center'>
          <CropImage />
        </div>
      </div>

      {/* Right - Ratio / Size Panel */}
      <div className='w-full md:w-[380px] bg-white h-full flex flex-col border-t md:border-t-0 md:border-l'>
        <div className='flex-1 overflow-y-auto p-4 md:p-6'>
          <CropRatioSelector />
        </div>

        {/* Apply Button */}
        <div className='sticky bottom-0 w-full bg-white border-t p-4 flex justify-center'>
          <Button
            size='lg'
            className='w-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={!pendingFile || !pendingPreview}
            onClick={handleApply}
          >
            Apply & Continue
            <Check className='ml-2 h-5 w-5' />
          </Button>
        </div>
      </div>
    </div>
  );
}
