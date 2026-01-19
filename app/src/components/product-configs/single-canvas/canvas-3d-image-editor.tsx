import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, Loader2 } from 'lucide-react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { uploadFileToStorage } from '@/lib/supabase/storage';
import { toast } from 'sonner';

interface Canvas3DImageEditorProps {
  imageUrl: string;
  canvasWidth: number; // Canvas width in inches
  canvasHeight: number; // Canvas height in inches
  onCropComplete: (croppedImageUrl: string) => void;
  onClose: () => void;
}

export function Canvas3DImageEditor({ 
  imageUrl, 
  canvasWidth,
  canvasHeight, 
  onCropComplete, 
  onClose 
}: Canvas3DImageEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);

  // Bleed area: 1.7 inches on each side for wrapping
  const BLEED_INCHES = 1.7;

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isProcessing, onClose]);

  // Initialize crop when image loads
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Calculate crop area including bleed
    const totalWidthInches = canvasWidth + (2 * BLEED_INCHES);
    const totalHeightInches = canvasHeight + (2 * BLEED_INCHES);
    const bleedAspectRatio = totalWidthInches / totalHeightInches;
    
    const imageAspect = width / height;
    
    let cropWidth, cropHeight;
    if (imageAspect > bleedAspectRatio) {
      // Image is wider - constrain by height
      cropHeight = height;
      cropWidth = height * bleedAspectRatio;
    } else {
      // Image is taller - constrain by width
      cropWidth = width;
      cropHeight = width / bleedAspectRatio;
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
  }, [canvasWidth, canvasHeight, BLEED_INCHES]);

  const handleApplyCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    setIsProcessing(true);
    const processingToast = toast.loading('Processing cropped image...');

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

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

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.95);
      });

      // Create file from blob
      const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Upload to Supabase storage
      toast.loading('Uploading cropped image...', { id: processingToast });
      const publicUrl = await uploadFileToStorage(file, 'canvas-uploads');
      
      if (!publicUrl) {
        throw new Error('Failed to upload cropped image');
      }

      toast.success('Image cropped successfully!', { id: processingToast });
      onCropComplete(publicUrl);
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('Failed to process cropped image', { id: processingToast });
    } finally {
      setIsProcessing(false);
    }
  }, [completedCrop, onCropComplete]);

  // Calculate aspect ratio including bleed for locked ratio
  const cropAspectRatio = (canvasWidth + 2 * BLEED_INCHES) / (canvasHeight + 2 * BLEED_INCHES);

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Crop Editor Card - Centered Overlay */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Crop Image</h3>
            <p className="text-sm text-gray-600 mt-0.5">Adjust the crop area for your canvas</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Crop Area - Scrollable */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="w-full h-full flex items-center justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={cropAspectRatio}
              style={{ maxHeight: '100%', maxWidth: '100%' }}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                crossOrigin="anonymous"
                onLoad={onImageLoad}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(90vh - 200px)',
                  width: 'auto',
                  height: 'auto',
                  display: 'block'
                }}
              />
            </ReactCrop>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-11 px-6"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApplyCrop}
            className="h-11 px-6 bg-[#f63a9e] hover:bg-[#e02d8d] text-white"
            disabled={!completedCrop || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Apply Crop
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

