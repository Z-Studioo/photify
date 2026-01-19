import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface CropModalProps {
  isOpen: boolean;
  imageUrl: string;
  slotWidth: number;
  slotHeight: number;
  onClose: () => void;
  onCrop: (cropData: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    rotation: number;
  }) => void;
  // Existing crop data (for editing)
  existingCrop?: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    rotation: number;
  };
}

export function CropModal({
  isOpen,
  imageUrl,
  slotWidth,
  slotHeight,
  onClose,
  onCrop,
  existingCrop
}: CropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [displaySize, setDisplaySize] = useState({ width: slotWidth, height: slotHeight });

  // Calculate display size maintaining aspect ratio
  useEffect(() => {
    if (!isOpen) return;

    const calculateDisplaySize = () => {
      const maxWidth = Math.min(600, window.innerWidth - 40);
      const maxHeight = Math.min(600, window.innerHeight * 0.5);
      
      // Calculate scale to fit the slot within max dimensions
      const scaleToFit = Math.min(
        maxWidth / slotWidth,
        maxHeight / slotHeight,
        1 // Don't scale up
      );
      
      setDisplaySize({
        width: slotWidth * scaleToFit,
        height: slotHeight * scaleToFit
      });
    };

    calculateDisplaySize();
    window.addEventListener('resize', calculateDisplaySize);
    
    return () => window.removeEventListener('resize', calculateDisplaySize);
  }, [isOpen, slotWidth, slotHeight]);

  // Load image
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    const image = new Image();
    image.crossOrigin = 'anonymous'; // Handle CORS for some images
    
    // Handle image load errors
    image.onerror = (error) => {
      console.error('Crop modal image load error:', error);
      toast.error('Failed to load image for cropping');
    };
    
    image.onload = () => {
      setImg(image);
      
      // If editing with existing crop data, use it
      if (existingCrop) {
        setScale(existingCrop.scale);
        setRotation(existingCrop.rotation);
        // Convert crop coordinates back to position
        const x = -existingCrop.x * existingCrop.scale;
        const y = -existingCrop.y * existingCrop.scale;
        setPosition({ x, y });
      } else {
        // Calculate initial scale to completely cover the slot (no whitespace)
        const scaleToFit = Math.max(
          slotWidth / image.width,
          slotHeight / image.height
        );
        setScale(scaleToFit);
        
        // Center the image (constrained to prevent whitespace)
        const imgWidth = image.width * scaleToFit;
        const imgHeight = image.height * scaleToFit;
        
        // Position so image covers slot completely
        const x = Math.min(0, (slotWidth - imgWidth) / 2);
        const y = Math.min(0, (slotHeight - imgHeight) / 2);
        
        setPosition({ x, y });
      }
    };
    
    // Use setTimeout to ensure image loads properly on mobile
    setTimeout(() => {
      image.src = imageUrl;
    }, 0);
  }, [isOpen, imageUrl, slotWidth, slotHeight, existingCrop]);

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !img) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to slot size
    canvas.width = slotWidth;
    canvas.height = slotHeight;

    // Clear canvas
    ctx.clearRect(0, 0, slotWidth, slotHeight);

    // Save context
    ctx.save();

    // Draw the cropped/scaled image
    ctx.translate(position.x + (img.width * scale) / 2, position.y + (img.height * scale) / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      img,
      -(img.width * scale) / 2,
      -(img.height * scale) / 2,
      img.width * scale,
      img.height * scale
    );

    // Restore context
    ctx.restore();

    // Draw slot border
    ctx.strokeStyle = '#f63a9e';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, slotWidth, slotHeight);
  }, [img, scale, rotation, position, slotWidth, slotHeight]);

  // Handle both mouse and touch events
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    try {
      e.preventDefault();
      setIsDragging(true);
      
      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
      
      if (clientX === undefined || clientY === undefined) {
        console.error('Invalid touch/mouse coordinates');
        return;
      }
      
      setDragStart({ x: clientX - position.x, y: clientY - position.y });
    } catch (error) {
      console.error('Error in handleMouseDown:', error);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    try {
      if (!isDragging || !img) return;
      
      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
      
      if (clientX === undefined || clientY === undefined) {
        console.error('Invalid touch/mouse coordinates in move');
        return;
      }
      
      const newX = clientX - dragStart.x;
      const newY = clientY - dragStart.y;
      
      // Calculate image bounds
      const imgWidth = img.width * scale;
      const imgHeight = img.height * scale;
      
      // Constrain position to prevent whitespace
      // Image must always cover the entire slot area
      const minX = slotWidth - imgWidth;
      const maxX = 0;
      const minY = slotHeight - imgHeight;
      const maxY = 0;
      
      setPosition({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY))
      });
    } catch (error) {
      console.error('Error in handleMouseMove:', error);
    }
  };

  const handleMouseUp = () => {
    try {
      setIsDragging(false);
    } catch (error) {
      console.error('Error in handleMouseUp:', error);
    }
  };

  // Constrain position to prevent whitespace - defined before handlers that use it
  const constrainPosition = React.useCallback((newScale: number) => {
    if (!img) return newScale;
    
    const imgWidth = img.width * newScale;
    const imgHeight = img.height * newScale;
    
    // If image would be smaller than slot, calculate minimum scale to cover
    if (imgWidth < slotWidth || imgHeight < slotHeight) {
      const minScale = Math.max(
        slotWidth / img.width,
        slotHeight / img.height
      );
      // Constrain position for minimum scale
      const minImgWidth = img.width * minScale;
      const minImgHeight = img.height * minScale;
      const minX = slotWidth - minImgWidth;
      const maxX = 0;
      const minY = slotHeight - minImgHeight;
      const maxY = 0;
      
      setPosition(prev => ({
        x: Math.max(minX, Math.min(maxX, prev.x)),
        y: Math.max(minY, Math.min(maxY, prev.y))
      }));
      
      return minScale; // Return the minimum scale
    }
    
    // Constrain position for current scale
    const minX = slotWidth - imgWidth;
    const maxX = 0;
    const minY = slotHeight - imgHeight;
    const maxY = 0;
    
    setPosition(prev => ({
      x: Math.max(minX, Math.min(maxX, prev.x)),
      y: Math.max(minY, Math.min(maxY, prev.y))
    }));
    
    return newScale;
  }, [img, slotWidth, slotHeight]);

  const handleZoomIn = () => {
    setScale(prev => {
      const newScale = Math.min(prev + 0.1, 3);
      return constrainPosition(newScale);
    });
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.1, 0.1);
      return constrainPosition(newScale);
    });
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleApplyCrop = () => {
    if (!img) return;

    onCrop({
      x: -position.x / scale,
      y: -position.y / scale,
      width: slotWidth / scale,
      height: slotHeight / scale,
      scale,
      rotation
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] flex flex-col"
          >
            {/* Header - Mobile Responsive */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900">Crop & Position Photo</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 hidden sm:block">
                  Drag to reposition, use controls to zoom and rotate
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              </button>
            </div>

            {/* Canvas Area - Mobile Responsive */}
            <div className="flex-1 overflow-hidden p-3 md:p-8 bg-gray-50">
              <div className="h-full flex flex-col items-center justify-center gap-2 md:gap-4">
                <div
                  ref={containerRef}
                  className="relative bg-white shadow-xl rounded-lg overflow-hidden cursor-move touch-none"
                  style={{
                    width: `${displaySize.width}px`,
                    height: `${displaySize.height}px`,
                    maxWidth: '100%'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchMove={handleMouseMove}
                  onTouchEnd={handleMouseUp}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    style={{ 
                      touchAction: 'none'
                    }}
                  />
                </div>
                
                {/* Instructions - Outside canvas - Hide on small mobile */}
                <div className="hidden sm:flex bg-gray-100 text-gray-700 text-xs md:text-sm px-3 md:px-5 py-1.5 md:py-2.5 rounded-full border border-gray-300">
                  <span className="font-medium">Drag to reposition</span>
                  <span className="mx-2">•</span>
                  <span>Pink border = crop area</span>
                </div>
              </div>
            </div>

            {/* Controls - Mobile Responsive */}
            <div className="px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 bg-white rounded-b-xl md:rounded-b-2xl">
              {/* Mobile: Stack controls vertically, Desktop: Horizontal */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4">
                {/* Zoom & Rotate Controls */}
                <div className="flex items-center gap-1.5 md:gap-2 justify-center md:justify-start">
                  <Button
                    onClick={handleZoomOut}
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 md:h-10 md:w-10 p-0"
                  >
                    <ZoomOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                  
                  <div className="text-xs md:text-sm font-medium text-gray-700 min-w-[50px] md:min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </div>
                  
                  <Button
                    onClick={handleZoomIn}
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 md:h-10 md:w-10 p-0"
                  >
                    <ZoomIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>

                  <div className="w-px h-6 md:h-8 bg-gray-300 mx-1 md:mx-2" />

                  <Button
                    onClick={handleRotate}
                    variant="outline"
                    size="sm"
                    className="h-9 md:h-10 px-3 md:px-4"
                  >
                    <RotateCw className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                    <span className="text-xs md:text-sm">Rotate 90°</span>
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 md:gap-3">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 md:flex-none h-10 md:h-11 px-4 md:px-6 text-sm md:text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApplyCrop}
                    className="flex-1 md:flex-none h-10 md:h-11 px-6 md:px-8 bg-[#f63a9e] hover:bg-[#e02d8d] text-white text-sm md:text-base font-semibold"
                  >
                    Apply Crop
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

