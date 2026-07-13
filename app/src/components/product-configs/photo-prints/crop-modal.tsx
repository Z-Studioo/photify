import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crop, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ReactCrop, {
  type Crop as CropType,
  type PercentCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { computeEffectiveDpi } from './config';

interface PhotoPrintCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  printWidthIn: number;
  printHeightIn: number;
  minDpi: number;
  onCropComplete: (result: {
    blob: Blob;
    previewUrl: string;
    widthPx: number;
    heightPx: number;
  }) => void;
  onClose: () => void;
}

export function PhotoPrintCropModal({
  isOpen,
  imageUrl,
  printWidthIn,
  printHeightIn,
  minDpi,
  onCropComplete,
  onClose,
}: PhotoPrintCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PercentCrop>();
  const [processing, setProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [estimatedDpi, setEstimatedDpi] = useState<number | null>(null);

  const aspectRatio = printWidthIn / printHeightIn;
  const printLongSideIn = Math.max(printWidthIn, printHeightIn);

  const updateDpiEstimate = (percentCrop: PercentCrop | undefined) => {
    const img = imgRef.current;
    if (!img || !percentCrop || !img.naturalWidth) {
      setEstimatedDpi(null);
      return;
    }
    const srcW = (percentCrop.width / 100) * img.naturalWidth;
    const srcH = (percentCrop.height / 100) * img.naturalHeight;
    const longSide = Math.max(srcW, srcH);
    setEstimatedDpi(computeEffectiveDpi(longSide, printLongSideIn));
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoaded(true);
    setImageError(false);

    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (!naturalWidth || !naturalHeight) return;

    const imageAspect = naturalWidth / naturalHeight;

    let cropWidthPct = 100;
    let cropHeightPct = 100;
    if (imageAspect > aspectRatio) {
      cropWidthPct = (aspectRatio / imageAspect) * 100;
    } else {
      cropHeightPct = (imageAspect / aspectRatio) * 100;
    }
    const x = (100 - cropWidthPct) / 2;
    const y = (100 - cropHeightPct) / 2;

    const initialCrop: CropType = {
      unit: '%',
      x,
      y,
      width: cropWidthPct,
      height: cropHeightPct,
    };

    setCrop(initialCrop);
    const completed: PercentCrop = {
      unit: '%',
      x,
      y,
      width: cropWidthPct,
      height: cropHeightPct,
    };
    setCompletedCrop(completed);
    updateDpiEstimate(completed);
  };

  const handleApplyCrop = async () => {
    if (!completedCrop || !imgRef.current) {
      toast.error('Please select a crop area');
      return;
    }

    if (completedCrop.width <= 0 || completedCrop.height <= 0) {
      toast.error('Invalid crop dimensions');
      return;
    }

    setProcessing(true);

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      const srcX = (completedCrop.x / 100) * image.naturalWidth;
      const srcY = (completedCrop.y / 100) * image.naturalHeight;
      const srcW = (completedCrop.width / 100) * image.naturalWidth;
      const srcH = (completedCrop.height / 100) * image.naturalHeight;

      // Full-resolution export — no downscaling cap (unlike canvas preview crops)
      const OUTPUT_WIDTH = Math.max(1, Math.round(srcW));
      const OUTPUT_HEIGHT = Math.max(1, Math.round(srcH));

      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        srcX,
        srcY,
        srcW,
        srcH,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT
      );

      canvas.toBlob(
        blob => {
          if (!blob) {
            toast.error('Failed to create cropped image');
            setProcessing(false);
            return;
          }

          const previewUrl = URL.createObjectURL(blob);
          onCropComplete({
            blob,
            previewUrl,
            widthPx: OUTPUT_WIDTH,
            heightPx: OUTPUT_HEIGHT,
          });
          toast.success('Crop applied');
          setProcessing(false);
          onClose();
        },
        'image/jpeg',
        0.95
      );
    } catch (error) {
      console.error('Crop error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to crop image'
      );
      setProcessing(false);
    }
  };

  const lowDpi = estimatedDpi != null && estimatedDpi < minDpi;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='fixed inset-0 bg-black/70 backdrop-blur-sm z-50'
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className='fixed inset-0 z-50 flex items-center justify-center p-4'
          >
            <div className='bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col'>
              <div className='px-8 py-6 border-b border-gray-200 flex items-center justify-between'>
                <div>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                    style={{ fontSize: '24px', fontWeight: '700' }}
                  >
                    Crop for Print
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>
                    Crop to {printWidthIn}" × {printHeightIn}" (
                    {printWidthIn === printHeightIn
                      ? 'Square'
                      : printWidthIn > printHeightIn
                        ? 'Landscape'
                        : 'Portrait'}
                    )
                  </p>
                  {estimatedDpi != null && (
                    <p
                      className={`text-xs mt-1.5 flex items-center gap-1 ${
                        lowDpi ? 'text-amber-700' : 'text-gray-500'
                      }`}
                    >
                      {lowDpi && <AlertTriangle className='w-3.5 h-3.5' />}
                      Estimated quality: ~{Math.round(estimatedDpi)} DPI
                      {lowDpi && ' — may look soft at this size'}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className='w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'
                >
                  <X className='w-5 h-5 text-gray-600' />
                </button>
              </div>

              <div className='flex-1 min-h-0 overflow-hidden px-6 py-12 sm:px-10 sm:py-14 bg-gray-50 flex items-center justify-center'>
                {imageError ? (
                  <div className='text-center'>
                    <p className='text-red-600 mb-2'>Failed to load image</p>
                    <p className='text-sm text-gray-600'>
                      Please try uploading again
                    </p>
                  </div>
                ) : (
                  <div className='relative w-full h-full flex items-center justify-center'>
                    {!imageLoaded && (
                      <div className='absolute inset-0 flex items-center justify-center bg-gray-50 z-10'>
                        <Loader2 className='w-5 h-5 animate-spin text-gray-600' />
                      </div>
                    )}

                    <ReactCrop
                      crop={crop}
                      onChange={(_pixel, percent) => setCrop(percent)}
                      onComplete={(_pixel, percent) => {
                        setCompletedCrop(percent);
                        updateDpiEstimate(percent);
                      }}
                      aspect={aspectRatio}
                      minWidth={20}
                      minHeight={20}
                      keepSelection
                      ruleOfThirds
                      style={{
                        display: 'inline-block',
                        lineHeight: 0,
                        fontSize: 0,
                        maxWidth: '100%',
                        maxHeight: '100%',
                      }}
                    >
                      <img
                        ref={imgRef}
                        src={imageUrl}
                        alt='Crop preview'
                        onLoad={onImageLoad}
                        onError={() => {
                          setImageError(true);
                          setImageLoaded(false);
                          toast.error('Failed to load image for cropping');
                        }}
                        style={{
                          maxWidth: '100%',
                          maxHeight: 'min(55vh, 520px)',
                          width: 'auto',
                          height: 'auto',
                          display: 'block',
                          margin: 0,
                          padding: 0,
                          border: 0,
                        }}
                      />
                    </ReactCrop>
                  </div>
                )}
              </div>

              <div className='px-8 py-6 border-t border-gray-200 flex items-center justify-between bg-gray-50'>
                <Button
                  variant='outline'
                  onClick={onClose}
                  disabled={processing}
                  className='border-2 border-gray-300 text-gray-700 hover:bg-gray-100 h-12 px-6 rounded-xl'
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyCrop}
                  disabled={
                    processing || !completedCrop || !imageLoaded || imageError
                  }
                  className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-12 px-8 rounded-xl disabled:opacity-50'
                  style={{ fontWeight: '700' }}
                >
                  {processing ? (
                    <>
                      <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crop className='w-5 h-5 mr-2' />
                      Apply Crop
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
