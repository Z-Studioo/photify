import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crop, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ReactCrop, {
  type Crop as CropType,
  type PercentCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface CropModalProps {
  isOpen: boolean;
  imageUrl: string;
  canvasId: number;
  aspectRatio: number; // width / height (e.g., 16/32 = 0.5)
  canvasWidthIn?: number;
  canvasHeightIn?: number;
  onCropComplete: (canvasId: number, croppedImageUrl: string) => void;
  onClose: () => void;
}

export function CropModal({
  isOpen,
  imageUrl,
  canvasId,
  aspectRatio,
  canvasWidthIn,
  canvasHeightIn,
  onCropComplete,
  onClose,
}: CropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<CropType>();
  // Crop is tracked in percent units (0–100). This is the only unit that
  // survives the image being rendered at a different size than its natural
  // dimensions (which happens because of `max-width: 100%` / `max-height`
  // styling). With percent units the crop overlay always lines up with the
  // displayed image, and we convert to natural pixels at draw time.
  const [completedCrop, setCompletedCrop] = useState<PercentCrop>();
  const [processing, setProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Initialize crop when image loads — uses naturalWidth/naturalHeight (not
  // the rendered CSS width, which is what `e.currentTarget.width` returns
  // post-CSS-constraint and which previously made the crop overlay extend
  // past the visible image).
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoaded(true);
    setImageError(false);

    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (!naturalWidth || !naturalHeight) return;

    const imageAspect = naturalWidth / naturalHeight;

    // Largest centred crop with the requested aspect ratio that still fits
    // entirely inside the image. Computed in percent so it's resolution-
    // independent.
    let cropWidthPct = 100;
    let cropHeightPct = 100;
    if (imageAspect > aspectRatio) {
      // Image is wider than the desired crop — full height, narrower width.
      cropWidthPct = (aspectRatio / imageAspect) * 100;
    } else {
      // Image is taller than the desired crop — full width, shorter height.
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
    // Mirror into completedCrop so "Apply Crop" works without any user
    // interaction.
    setCompletedCrop({
      unit: '%',
      x,
      y,
      width: cropWidthPct,
      height: cropHeightPct,
    });
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

      // Percent crop → natural-pixel crop. We use naturalWidth/naturalHeight
      // directly so the source rect is computed against the *real* image,
      // independent of how big or small the modal is rendering it.
      const srcX = (completedCrop.x / 100) * image.naturalWidth;
      const srcY = (completedCrop.y / 100) * image.naturalHeight;
      const srcW = (completedCrop.width / 100) * image.naturalWidth;
      const srcH = (completedCrop.height / 100) * image.naturalHeight;

      // Output dimensions match the canvas aspect ratio exactly. We cap the
      // long side at 1200px (plenty for the on-screen preview) but also
      // never *upscale* past the source crop — so a customer who zooms in on
      // a small detail gets that detail's actual resolution rather than a
      // blurry stretched version.
      const MAX_LONG_SIDE = 1200;
      let OUTPUT_WIDTH: number;
      let OUTPUT_HEIGHT: number;
      if (aspectRatio >= 1) {
        OUTPUT_WIDTH = Math.min(Math.round(srcW), MAX_LONG_SIDE);
        OUTPUT_HEIGHT = Math.round(OUTPUT_WIDTH / aspectRatio);
      } else {
        OUTPUT_HEIGHT = Math.min(Math.round(srcH), MAX_LONG_SIDE);
        OUTPUT_WIDTH = Math.round(OUTPUT_HEIGHT * aspectRatio);
      }

      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw cropped region (in natural pixels) scaled to the output size
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
            <div className='bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col'>
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
                    {canvasWidthIn && canvasHeightIn
                      ? `Crop to ${canvasWidthIn}" × ${canvasHeightIn}" aspect ratio (${
                          canvasWidthIn === canvasHeightIn
                            ? 'Square'
                            : canvasWidthIn > canvasHeightIn
                              ? 'Landscape'
                              : 'Portrait'
                        })`
                      : `Crop to ${aspectRatio.toFixed(2)}:1 aspect ratio`}
                  </p>
                  <p className='text-xs text-gray-500 mt-1.5'>
                    Drag the corners or edges to zoom in on a specific part of
                    your photo. Drag inside the box to reposition it.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className='w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'
                >
                  <X className='w-5 h-5 text-gray-600' />
                </button>
              </div>

              {/* Crop Area — generous vertical padding keeps the crop
                  selection's dashed outline visibly inside the modal rather
                  than flush against the header/footer borders. */}
              <div className='flex-1 min-h-0 overflow-hidden px-6 py-12 sm:px-10 sm:py-14 bg-gray-50 flex items-center justify-center'>
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

                    {/* Image Crop — kept in percent units so the crop
                        selection scales with the rendered image size. The
                        ReactCrop wrapper is forced to inline-block + zero
                        line-height so it shrink-wraps the image exactly,
                        otherwise the crop selection ends up sized to the
                        wrapper (which can be a few px larger than the image
                        due to inherited max-height / baseline whitespace). */}
                    <ReactCrop
                      crop={crop}
                      onChange={(_pixel, percent) => setCrop(percent)}
                      onComplete={(_pixel, percent) => setCompletedCrop(percent)}
                      aspect={aspectRatio}
                      // Allow zooming in on a small portion of the image —
                      // 20px lower bound is small enough to crop a face or
                      // detail out of a wide photo, but big enough to keep
                      // the handles draggable on touch devices.
                      minWidth={20}
                      minHeight={20}
                      keepSelection={true}
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
                        // The image is the source of truth for the wrapper's
                        // size. `display:block + margin/padding/border:0`
                        // prevents the inline-image baseline gap and any UA
                        // border/padding that would push the wrapper a few
                        // pixels bigger than the image and create a visible
                        // sliver between the image edge and the dashed crop.
                        style={{
                          maxWidth: '100%',
                          maxHeight: 'min(55vh, 520px)',
                          width: 'auto',
                          height: 'auto',
                          display: 'block',
                          margin: 0,
                          padding: 0,
                          border: 0,
                          verticalAlign: 'top',
                        }}
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
