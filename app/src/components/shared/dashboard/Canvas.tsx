import React, { useRef, useEffect, useState } from 'react';
import { useUpload, type CanvasShape } from '@/context/UploadContext';

interface PhotoFrameProps {
  src: string;
  maxWidth?: number;
  maxHeight?: number;
}

const Canvas: React.FC<PhotoFrameProps> = ({
  src,
  maxWidth = 300,
  maxHeight = 300,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasDims, setCanvasDims] = useState({ width: 0, height: 0 });
  const { shape } = useUpload();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Responsive sizing
    const updateCanvasDims = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = Math.min(parent.clientWidth * 0.8, maxWidth);
      const height = Math.min(parent.clientHeight * 0.5, maxHeight);
      setCanvasDims({ width, height });
    };

    updateCanvasDims();
    window.addEventListener('resize', updateCanvasDims);
    return () => window.removeEventListener('resize', updateCanvasDims);
  }, [maxWidth, maxHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const frameWidth = 12; // Frame thickness
    const radius = Math.min(canvas.width, canvas.height) / 2 - frameWidth;

    // Draw shadow first (behind everything)
    drawRealisticShadow(ctx, centerX, centerY, radius, shape);

    // Create and draw the frame background
    drawFrameBackground(ctx, centerX, centerY, radius, frameWidth, shape);

    // Create clipping path for image based on shape
    ctx.save();

    switch (shape) {
      case 'rectangle': {
        const innerWidth = canvas.width - frameWidth * 2;
        const innerHeight = canvas.height - frameWidth * 2;
        ctx.beginPath();
        ctx.rect(frameWidth, frameWidth, innerWidth, innerHeight);
        ctx.closePath();
        break;
      }
      case 'round': {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - frameWidth / 2, 0, 2 * Math.PI);
        ctx.closePath();
        break;
      }
      case 'hexagon': {
        ctx.beginPath();
        drawPolygon(ctx, centerX, centerY, radius - frameWidth / 2, 6);
        ctx.closePath();
        break;
      }
      case 'octagon': {
        ctx.beginPath();
        drawPolygon(ctx, centerX, centerY, radius - frameWidth / 2, 8);
        ctx.closePath();
        break;
      }
      case 'dodecagon': {
        ctx.beginPath();
        drawPolygon(ctx, centerX, centerY, radius - frameWidth / 2, 12);
        ctx.closePath();
        break;
      }
      default:
        break;
    }

    ctx.clip();

    const img = new Image();
    img.src = src;
    img.onload = () => {
      // Prepare target drawing area
      let targetX = 0;
      let targetY = 0;
      let targetW = 0;
      let targetH = 0;
      if (shape === 'rectangle') {
        targetX = frameWidth;
        targetY = frameWidth;
        targetW = canvas.width - frameWidth * 2;
        targetH = canvas.height - frameWidth * 2;
      } else {
        const imageSize = (radius - frameWidth / 2) * 2;
        targetW = imageSize;
        targetH = imageSize;
        targetX = Math.round(centerX - imageSize / 2);
        targetY = Math.round(centerY - imageSize / 2);
      }

      // Offscreen canvas to preprocess image (center-crop + brightness/contrast)
      const off = document.createElement('canvas');
      off.width = targetW;
      off.height = targetH;
      const offCtx = off.getContext('2d');
      if (!offCtx) return;

      // Preserve aspect ratio - contain the image within the frame
      const imgAspect = img.width / img.height;
      const tgtAspect = targetW / targetH;
      
      let drawW = targetW;
      let drawH = targetH;
      let drawX = 0;
      let drawY = 0;
      
      if (imgAspect > tgtAspect) {
        // Image is wider - fit to width, center vertically
        drawH = targetW / imgAspect;
        drawY = (targetH - drawH) / 2;
      } else if (imgAspect < tgtAspect) {
        // Image is taller - fit to height, center horizontally
        drawW = targetH * imgAspect;
        drawX = (targetW - drawW) / 2;
      }
      
      // Fill background with a subtle color for areas not covered by image
      offCtx.fillStyle = '#f8f9fa';
      offCtx.fillRect(0, 0, targetW, targetH);

      // Draw the entire image scaled to fit within the frame
      offCtx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawW, drawH);

      // Apply aggressive brightness/contrast adjustment to make image pop
      try {
        const id = offCtx.getImageData(0, 0, targetW, targetH);
        const data = id.data;
        const brightness = 35; // additive - much higher
        const contrast = 1.15; // multiplier - more dramatic
        const intercept = 128 * (1 - contrast);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(
            255,
            Math.max(0, data[i] * contrast + intercept + brightness)
          ); // R
          data[i + 1] = Math.min(
            255,
            Math.max(0, data[i + 1] * contrast + intercept + brightness)
          ); // G
          data[i + 2] = Math.min(
            255,
            Math.max(0, data[i + 2] * contrast + intercept + brightness)
          ); // B
          // alpha stays the same
        }
        offCtx.putImageData(id, 0, 0);
      } catch (e) {
        // If CORS blocks pixel access, fall back to direct draw
        // (can't adjust), so do nothing
      }

      // Draw processed image into main canvas
      ctx.drawImage(off, targetX, targetY, targetW, targetH);

      ctx.restore();

      // Draw realistic frame edges and highlights
      drawFrameDetails(ctx, centerX, centerY, radius, frameWidth, shape);
    };
  }, [src, canvasDims, shape]);

  // Helper function to draw polygons (accept nullable ctx for safety)
  const drawPolygon = (
    ctx: CanvasRenderingContext2D | null,
    centerX: number,
    centerY: number,
    radius: number,
    sides: number,
    strokeOnly = false
  ) => {
    if (!ctx) return;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    if (strokeOnly) {
      ctx.stroke();
    }
  };

  // Draw realistic shadow effect
  const drawRealisticShadow = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    shape: CanvasShape
  ) => {
    ctx.save();

    // Create shadow gradient - reduced to prevent darkening
    const shadowOffset = 4;
    const shadowBlur = 8;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffset;
    ctx.shadowOffsetY = shadowOffset;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';

    switch (shape) {
      case 'rectangle':
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        break;
      case 'round':
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        break;
      case 'hexagon':
        drawPolygon(ctx, centerX, centerY, radius, 6);
        ctx.fill();
        break;
      case 'octagon':
        drawPolygon(ctx, centerX, centerY, radius, 8);
        ctx.fill();
        break;
      case 'dodecagon':
        drawPolygon(ctx, centerX, centerY, radius, 12);
        ctx.fill();
        break;
    }

    ctx.restore();
  };

  // Draw frame background with gradient
  const drawFrameBackground = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    frameWidth: number,
    shape: CanvasShape
  ) => {
    ctx.save();

    // Create frame gradient (lighter colors to reduce darkening)
    const gradient = ctx.createLinearGradient(0, 0, frameWidth, frameWidth);
    gradient.addColorStop(0, '#D2B48C'); // Tan
    gradient.addColorStop(0.3, '#F5DEB3'); // Wheat
    gradient.addColorStop(0.7, '#DEB887'); // Burlywood
    gradient.addColorStop(1, '#BC9A6A'); // Light brown

    ctx.fillStyle = gradient;

    switch (shape) {
      case 'rectangle':
        // Draw outer frame
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // Cut out inner area
        ctx.globalCompositeOperation = 'destination-out';
        const innerWidth = ctx.canvas.width - frameWidth * 2;
        const innerHeight = ctx.canvas.height - frameWidth * 2;
        ctx.fillRect(frameWidth, frameWidth, innerWidth, innerHeight);
        break;
      default:
        // For circular and polygon shapes
        ctx.beginPath();

        if (shape === 'round') {
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        } else {
          const sides = shape === 'hexagon' ? 6 : shape === 'octagon' ? 8 : 12;
          drawPolygon(ctx, centerX, centerY, radius, sides);
        }

        ctx.fill();

        // Cut out inner area
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();

        if (shape === 'round') {
          ctx.arc(centerX, centerY, radius - frameWidth, 0, 2 * Math.PI);
        } else {
          const sides = shape === 'hexagon' ? 6 : shape === 'octagon' ? 8 : 12;
          drawPolygon(ctx, centerX, centerY, radius - frameWidth, sides);
        }

        ctx.fill();
        break;
    }

    ctx.restore();
  };

  // Draw frame details and highlights
  const drawFrameDetails = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    frameWidth: number,
    shape: CanvasShape
  ) => {
    ctx.save();

    // Inner bevel highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;

    switch (shape) {
      case 'rectangle':
        const innerWidth = ctx.canvas.width - frameWidth * 2;
        const innerHeight = ctx.canvas.height - frameWidth * 2;
        ctx.strokeRect(
          frameWidth + 1,
          frameWidth + 1,
          innerWidth - 2,
          innerHeight - 2
        );
        break;
      case 'round':
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - frameWidth + 1, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case 'hexagon':
        drawPolygon(ctx, centerX, centerY, radius - frameWidth + 1, 6, true);
        break;
      case 'octagon':
        drawPolygon(ctx, centerX, centerY, radius - frameWidth + 1, 8, true);
        break;
      case 'dodecagon':
        drawPolygon(ctx, centerX, centerY, radius - frameWidth + 1, 12, true);
        break;
    }

    // Outer edge shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;

    switch (shape) {
      case 'rectangle':
        ctx.strokeRect(1, 1, ctx.canvas.width - 2, ctx.canvas.height - 2);
        break;
      case 'round':
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 1, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case 'hexagon':
        drawPolygon(ctx, centerX, centerY, radius - 1, 6, true);
        break;
      case 'octagon':
        drawPolygon(ctx, centerX, centerY, radius - 1, 8, true);
        break;
      case 'dodecagon':
        drawPolygon(ctx, centerX, centerY, radius - 1, 12, true);
        break;
    }

    ctx.restore();
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasDims.width}
      height={canvasDims.height}
      className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    />
  );
};

export default Canvas;
