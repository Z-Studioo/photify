import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Bleed Overlay Component - Shows frame for bleed area within crop
function BleedOverlay({
  crop,
  canvasWidth,
  canvasHeight,
  bleedInches,
}: {
  crop: PixelCrop;
  canvasWidth: number;
  canvasHeight: number;
  bleedInches: number;
}) {
  // Calculate dimensions
  const totalWidth = canvasWidth + 2 * bleedInches;
  const totalHeight = canvasHeight + 2 * bleedInches;

  // Calculate bleed percentage of crop area
  const bleedPercentX = (bleedInches / totalWidth) * 100;
  const bleedPercentY = (bleedInches / totalHeight) * 100;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${crop.x}px`,
        top: `${crop.y}px`,
        width: `${crop.width}px`,
        height: `${crop.height}px`,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* Outer Frame - Bleed area (beige/cream color) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '4px dashed rgba(139, 92, 46, 0.4)',
          backgroundColor: 'rgba(222, 184, 135, 0.15)',
        }}
      />

      {/* Inner Frame - Visible Canvas Area (white/light) */}
      <div
        style={{
          position: 'absolute',
          left: `${bleedPercentX}%`,
          top: `${bleedPercentY}%`,
          width: `${100 - 2 * bleedPercentX}%`,
          height: `${100 - 2 * bleedPercentY}%`,
          border: '3px solid rgba(139, 92, 46, 0.6)',
          boxShadow: '0 0 0 2px white, inset 0 0 0 2px white',
        }}
      />

      {/* Labels for Bleed Areas - Cleaner Design */}
      {/* Top Center - Back label */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(107, 114, 128, 0.8)',
          fontSize: '14px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Back
      </div>

      {/* Bottom Center - Back label */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(107, 114, 128, 0.8)',
          fontSize: '14px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Back
      </div>

      {/* Left Center - Sides label */}
      <div
        style={{
          position: 'absolute',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'rgba(107, 114, 128, 0.8)',
          fontSize: '14px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Sides
      </div>

      {/* Right Center - Sides label */}
      <div
        style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'rgba(107, 114, 128, 0.8)',
          fontSize: '14px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Sides
      </div>
    </div>
  );
}

interface ImageCropModalProps {
  imageUrl: string;
  aspectRatio: number; // width / height ratio (of visible canvas area)
  canvasWidth?: number; // Canvas width in inches (optional, for bleed calculation)
  canvasHeight?: number; // Canvas height in inches (optional, for bleed calculation)
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  isEmbedded?: boolean; // If true, render without modal wrapper
}

export function ImageCropModal({
  imageUrl,
  aspectRatio,
  canvasWidth,
  canvasHeight,
  onCropComplete,
  onCancel,
  isEmbedded = false,
}: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  // Bleed area: 1.7 inches on each side for wrapping and stitching
  const BLEED_INCHES = 1.7;

  // Initialize crop when image loads
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;

      // Calculate crop area including bleed
      // The crop area will be: (canvasWidth + 2*bleed) x (canvasHeight + 2*bleed)
      let cropWidth, cropHeight;

      if (canvasWidth && canvasHeight) {
        // Calculate total dimensions including bleed (1.7" on each side)
        const totalWidthInches = canvasWidth + 2 * BLEED_INCHES;
        const totalHeightInches = canvasHeight + 2 * BLEED_INCHES;
        const bleedAspectRatio = totalWidthInches / totalHeightInches;

        const imageAspect = width / height;

        if (imageAspect > bleedAspectRatio) {
          // Image is wider - constrain by height
          cropHeight = height;
          cropWidth = height * bleedAspectRatio;
        } else {
          // Image is taller - constrain by width
          cropWidth = width;
          cropHeight = width / bleedAspectRatio;
        }
      } else {
        // Fallback to aspect ratio only (no bleed calculation)
        const imageAspect = width / height;

        if (imageAspect > aspectRatio) {
          cropHeight = height;
          cropWidth = height * aspectRatio;
        } else {
          cropWidth = width;
          cropHeight = width / aspectRatio;
        }
      }

      const centerX = (width - cropWidth) / 2;
      const centerY = (height - cropHeight) / 2;

      setCrop({
        unit: 'px',
        x: centerX,
        y: centerY,
        width: cropWidth,
        height: cropHeight,
      });
    },
    [aspectRatio, canvasWidth, canvasHeight, BLEED_INCHES]
  );

  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to match crop area
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    // Draw cropped image
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Convert to blob and create URL
    canvas.toBlob(
      blob => {
        if (!blob) return;
        const croppedUrl = URL.createObjectURL(blob);
        onCropComplete(croppedUrl);
      },
      'image/jpeg',
      0.95
    );
  }, [completedCrop, onCropComplete]);

  // Auto-crop on every change for embedded mode
  useEffect(() => {
    if (isEmbedded && completedCrop) {
      handleCropComplete();
    }
  }, [isEmbedded, completedCrop, handleCropComplete]);

  // Calculate aspect ratio including bleed for locked ratio
  const cropAspectRatio =
    canvasWidth && canvasHeight
      ? (canvasWidth + 2 * BLEED_INCHES) / (canvasHeight + 2 * BLEED_INCHES)
      : aspectRatio;

  // Embedded mode - just the cropper without modal wrapper
  if (isEmbedded) {
    return (
      <div className='w-full h-full flex flex-col bg-gray-50 rounded-xl p-6'>
        {/* Bleed Info Banner */}
        {canvasWidth && canvasHeight && (
          <div className='bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4'>
            <div className='flex items-start gap-2'>
              <div className='text-amber-600 mt-0.5'>ℹ️</div>
              <div className='text-sm text-amber-900'>
                <p className='font-semibold mb-1'>Bleed Area Guide</p>
                <p>
                  The{' '}
                  <strong className='text-amber-700'>beige/cream area</strong>{' '}
                  shows the 1.7&quot; bleed for wrapping. The{' '}
                  <strong className='text-amber-700'>center area</strong> is
                  your visible canvas.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='flex-1 flex items-center justify-center relative'>
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={c => setCompletedCrop(c)}
            aspect={cropAspectRatio}
            style={{ maxHeight: '100%', maxWidth: '100%' }}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt='Crop preview'
              onLoad={onImageLoad}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                display: 'block',
              }}
            />
          </ReactCrop>

          {/* Bleed Overlay */}
          {canvasWidth && canvasHeight && completedCrop && (
            <BleedOverlay
              crop={completedCrop}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              bleedInches={BLEED_INCHES}
            />
          )}
        </div>
      </div>
    );
  }

  // Modal mode - full modal with header and footer
  return (
    <div className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0'>
          <h2 className='text-xl font-semibold text-gray-900'>Crop Image</h2>
          <button
            onClick={onCancel}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-gray-600' />
          </button>
        </div>

        {/* Bleed Info Banner */}
        {canvasWidth && canvasHeight && (
          <div className='mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3'>
            <div className='flex items-start gap-2'>
              <div className='text-amber-600 mt-0.5'>ℹ️</div>
              <div className='text-sm text-amber-900'>
                <p className='font-semibold mb-1'>Bleed Area Guide</p>
                <p>
                  The{' '}
                  <strong className='text-amber-700'>beige/cream area</strong>{' '}
                  shows the 1.7&quot; bleed for wrapping. The{' '}
                  <strong className='text-amber-700'>center area</strong> is
                  your visible canvas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Crop Area - Scrollable with constrained height */}
        <div className='flex-1 overflow-auto p-6 bg-gray-50 flex items-center justify-center'>
          <div className='w-full h-full flex items-center justify-center relative'>
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
              aspect={cropAspectRatio}
              style={{ maxHeight: '100%', maxWidth: '100%' }}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt='Crop preview'
                onLoad={onImageLoad}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(90vh - 200px)', // Account for header + footer
                  width: 'auto',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </ReactCrop>

            {/* Bleed Overlay */}
            {canvasWidth && canvasHeight && completedCrop && (
              <BleedOverlay
                crop={completedCrop}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                bleedInches={BLEED_INCHES}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0'>
          <Button variant='outline' onClick={onCancel} className='h-11 px-6'>
            Cancel
          </Button>
          <Button
            onClick={handleCropComplete}
            className='h-11 px-6 bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
            disabled={!completedCrop}
          >
            <Check className='w-4 h-4 mr-2' />
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
}
