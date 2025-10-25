'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useView } from '@/context/ViewContext';
import { useUpload } from '@/context/UploadContext';
import React, { useEffect, useState } from 'react';

const OptimizationControl: React.FC = () => {
  const { setSelectedView } = useView();
  const {
    preview,
    setPendingPreview,
    file,
    setPendingFile,
    quality,
    setQuality,
  } = useUpload();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setSelectedView('optimization');
  }, [setSelectedView]);

  // Core canvas enhancement logic
  const enhanceImageWithCanvas = async (
    src: string,
    qualityValue: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // allow local or remote image
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject('Canvas not supported');
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Base enhancement strength based on quality (normalize to 0–1)
        const q = qualityValue / 100;

        // Apply subtle adjustments
        // Slight contrast, brightness, and sharpness simulation
        ctx.filter = `
          brightness(${1 + q * 0.1})
          contrast(${1 + q * 0.2})
          saturate(${1 + q * 0.1})
          blur(${(1 - q) * 0.5}px)
        `;

        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Optional sharpening simulation by re-drawing with partial transparency
        if (q > 0.7) {
          ctx.globalAlpha = (q - 0.7) * 1.5; // stronger at higher quality
          ctx.drawImage(canvas, -1, 0);
          ctx.drawImage(canvas, 1, 0);
          ctx.globalAlpha = 1.0;
        }

        const enhanced = canvas.toDataURL('image/jpeg', q);
        resolve(enhanced);
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  // Debounced enhancement trigger
  useEffect(() => {
    if (!preview) return;

    const handler = setTimeout(async () => {
      try {
        setIsProcessing(true);
        console.log('Enhancing with canvas...');

        const enhanced = await enhanceImageWithCanvas(preview, quality[0]);

        console.log('Enhanced image generated');
        setPendingPreview(enhanced);
        setPendingFile(file);
      } catch (error) {
        console.error('Canvas enhancement failed:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 800);

    return () => clearTimeout(handler);
  }, [quality, preview, setPendingPreview]);

  return (
    <div>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <Label htmlFor='quality' className='text-base font-medium'>
            Quality
          </Label>
          <span className='text-sm font-semibold text-primary'>
            {quality[0]}%
          </span>
        </div>

        <Slider
          id='quality'
          min={1}
          max={100}
          step={1}
          value={quality}
          onValueChange={setQuality}
          className='w-full'
          disabled={isProcessing}
        />

        <p className='text-xs text-muted-foreground'>
          {isProcessing
            ? 'Enhancing image... please wait'
            : 'Higher quality means more contrast and sharpness'}
        </p>
      </div>
    </div>
  );
};

export default OptimizationControl;
