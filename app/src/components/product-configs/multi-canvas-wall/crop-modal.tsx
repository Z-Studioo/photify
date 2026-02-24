import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crop, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ReactCrop, {
  type Crop as CropType,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface CropModalProps {
  isOpen: boolean;
  imageUrl: string;
  canvasId: number;
  aspectRatio: number; // width / height (e.g., 16/32 = 0.5)
  onCropComplete: (canvasId: number, croppedImageUrl: string) => void;
  onClose: () => void;
}

export function CropModal({
  isOpen,
  imageUrl,
  canvasId,
  aspectRatio,
  onCropComplete,
  onClose,
}: CropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Initialize crop when image loads
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoaded(true);
    setImageError(false);
    
    const { width, height } = e.currentTarget;

    // Center crop with correct aspect ratio
    const cropWidth = width;
    const cropHeight = width / aspectRatio;

    // If calculated height exceeds image height, constrain by height instead
    let finalWidth = cropWidth;
    let finalHeight = cropHeight;

    if (cropHeight > height) {
      finalHeight = height;
      finalWidth = height * aspectRatio;
    }

    const x = (width - finalWidth) / 2;
    const y = (height - finalHeight) / 2;

    const initialCrop: CropType = {
      unit: 'px',
      x,
      y,
      width: finalWidth,
      height: finalHeight,
    };

    setCrop(initialCrop);
    
    // Initialize completedCrop so the crop can be applied immediately without user interaction
    setCompletedCrop({
      unit: 'px',
      x,
      y,
      width: finalWidth,
      height: finalHeight,
    });
  };

  const handleApplyCrop = async () => {
    if (!completedCrop || !imgRef.current) {
      toast.error('Please select a crop area');
      return;
    }

    // Validate crop dimensions
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

      // Use a fixed output size with the exact aspect ratio
      // For 16:32 ratio (0.5), we'll use 800x1600
      const OUTPUT_WIDTH = 800;
      const OUTPUT_HEIGHT = Math.round(OUTPUT_WIDTH / aspectRatio);

      // Set canvas to the standardized output dimensions
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw cropped and scaled image
      ctx.drawImage(
        image,
        completedCrop.x,
        completedCrop.y,
        completedCrop.width,
        completedCrop.height,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT
      );

      // Convert to blob and create URL
      canvas.toBlob(
        blob => {
          if (!blob) {
            toast.error('Failed to create cropped image');
            setProcessing(false);
            return;
          }

          const croppedUrl = URL.createObjectURL(blob);
          onCropComplete(canvasId, croppedUrl);
          toast.success('Image cropped successfully');
          setProcessing(false);
          onClose();
        },
        'image/jpeg',
        0.95
      );
    } catch (error) {
      console.error('Crop error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to crop image');
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='fixed inset-0 bg-black/70 backdrop-blur-sm z-50'
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className='fixed inset-0 z-50 flex items-center justify-center p-4'
          >
            <div className='bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col'>
              {/* Header */}
              <div className='px-8 py-6 border-b border-gray-200 flex items-center justify-between'>
                <div>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                    style={{ fontSize: '24px', fontWeight: '700' }}
                  >
                    Crop Image - Canvas {canvasId + 1}
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>
                    Crop to 16&quot; × 32&quot; aspect ratio (Portrait)
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className='w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'
                >
                  <X className='w-5 h-5 text-gray-600' />
                </button>
              </div>

              {/* Crop Area */}
              <div className='flex-1 overflow-auto p-8 bg-gray-50 flex items-center justify-center'>
                {imageError ? (
                  <div className='text-center'>
                    <p className='text-red-600 mb-2'>Failed to load image</p>
                    <p className='text-sm text-gray-600'>Please try uploading the image again</p>
                  </div>
                ) : (
                  <div className='relative w-full h-full flex items-center justify-center'>
                    {/* Loading Overlay */}
                    {!imageLoaded && (
                      <div className='absolute inset-0 flex items-center justify-center bg-gray-50 z-10'>
                        <div className='flex items-center gap-2 text-gray-600'>
                          <Loader2 className='w-5 h-5 animate-spin' />
                          <span>Loading image...</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Image Crop - Always render so onLoad can fire */}
                    <ReactCrop
                      crop={crop}
                      onChange={c => setCrop(c)}
                      onComplete={c => setCompletedCrop(c)}
                      aspect={aspectRatio}
                      minWidth={50}
                      minHeight={50}
                      keepSelection={true}
                      className='max-w-full max-h-full'
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
                        className='max-w-full max-h-[60vh]'
                      />
                    </ReactCrop>
                  </div>
                )}
              </div>

              {/* Footer */}
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
                  disabled={processing || !completedCrop || !imageLoaded || imageError}
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
