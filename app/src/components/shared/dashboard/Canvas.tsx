import React, { useRef, useEffect, useState } from 'react';
import { useUpload, type CanvasShape } from '@/context/UploadContext';
import { useEdge } from '@/context/EdgeContext';

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
  const { edgeType } = useEdge();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const frameWidth = 12;
    const radius = Math.min(canvas.width, canvas.height) / 2 - frameWidth;

    drawRealisticShadow(ctx, centerX, centerY, radius, shape);

    drawFrameBackground(ctx, centerX, centerY, radius, frameWidth, shape);

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

      const off = document.createElement('canvas');
      off.width = targetW;
      off.height = targetH;
      const offCtx = off.getContext('2d');
      if (!offCtx) return;

      const imgAspect = img.width / img.height;
      const tgtAspect = targetW / targetH;

      let drawW = targetW;
      let drawH = targetH;
      let drawX = 0;
      let drawY = 0;

      if (imgAspect > tgtAspect) {
        drawH = targetW / imgAspect;
        drawY = (targetH - drawH) / 2;
      } else if (imgAspect < tgtAspect) {
        drawW = targetH * imgAspect;
        drawX = (targetW - drawW) / 2;
      }

      if (edgeType === 'mirrored') {
        offCtx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          drawX,
          drawY,
          drawW,
          drawH
        );
        const mirrorSize = 50;
        if (drawX > 0) {
          const stripWidth = Math.min(drawX, mirrorSize);
          offCtx.save();
          offCtx.scale(-1, 1);
          offCtx.drawImage(
            img,
            0,
            0,
            stripWidth * (img.width / drawW),
            img.height,
            -drawX,
            drawY,
            stripWidth,
            drawH
          );
          offCtx.restore();
          if (drawX > stripWidth) {
            offCtx.fillStyle = offCtx.createPattern(
              (() => {
                const patternCanvas = document.createElement('canvas');
                const patternCtx = patternCanvas.getContext('2d')!;
                patternCanvas.width = 20;
                patternCanvas.height = 20;
                patternCtx.fillStyle = '#e5e7eb';
                patternCtx.fillRect(0, 0, 20, 20);
                return patternCanvas;
              })(),
              'repeat'
            )!;
            offCtx.fillRect(0, drawY, drawX - stripWidth, drawH);
          }
        }

        if (drawX + drawW < targetW) {
          const rightSpace = targetW - (drawX + drawW);
          const stripWidth = Math.min(rightSpace, mirrorSize);
          offCtx.save();
          offCtx.scale(-1, 1);
          offCtx.drawImage(
            img,
            img.width - stripWidth * (img.width / drawW),
            0,
            stripWidth * (img.width / drawW),
            img.height,
            -(drawX + drawW + stripWidth),
            drawY,
            stripWidth,
            drawH
          );
          offCtx.restore();

          if (rightSpace > stripWidth) {
            offCtx.fillStyle = '#e5e7eb';
            offCtx.fillRect(
              drawX + drawW + stripWidth,
              drawY,
              rightSpace - stripWidth,
              drawH
            );
          }
        }

        if (drawY > 0) {
          const stripHeight = Math.min(drawY, mirrorSize);
          offCtx.save();
          offCtx.scale(1, -1);
          offCtx.drawImage(
            img,
            0,
            0,
            img.width,
            stripHeight * (img.height / drawH),
            drawX,
            -drawY,
            drawW,
            stripHeight
          );
          offCtx.restore();

          if (drawY > stripHeight) {
            offCtx.fillStyle = '#e5e7eb';
            offCtx.fillRect(drawX, 0, drawW, drawY - stripHeight);
          }
        }

        if (drawY + drawH < targetH) {
          const bottomSpace = targetH - (drawY + drawH);
          const stripHeight = Math.min(bottomSpace, mirrorSize);
          offCtx.save();
          offCtx.scale(1, -1);
          offCtx.drawImage(
            img,
            0,
            img.height - stripHeight * (img.height / drawH),
            img.width,
            stripHeight * (img.height / drawH),
            drawX,
            -(drawY + drawH + stripHeight),
            drawW,
            stripHeight
          );
          offCtx.restore();

          if (bottomSpace > stripHeight) {
            offCtx.fillStyle = '#e5e7eb';
            offCtx.fillRect(
              drawX,
              drawY + drawH + stripHeight,
              drawW,
              bottomSpace - stripHeight
            );
          }
        }
      } else {
        offCtx.fillStyle = '#f8f9fa';
        offCtx.fillRect(0, 0, targetW, targetH);
        offCtx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          drawX,
          drawY,
          drawW,
          drawH
        );
      }

      try {
        const id = offCtx.getImageData(0, 0, targetW, targetH);
        const data = id.data;
        const brightness = 35;
        const contrast = 1.15;
        const intercept = 128 * (1 - contrast);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(
            255,
            Math.max(0, data[i] * contrast + intercept + brightness)
          );
          data[i + 1] = Math.min(
            255,
            Math.max(0, data[i + 1] * contrast + intercept + brightness)
          );
          data[i + 2] = Math.min(
            255,
            Math.max(0, data[i + 2] * contrast + intercept + brightness)
          );
        }
        offCtx.putImageData(id, 0, 0);
      } catch (e) {}

      ctx.drawImage(off, targetX, targetY, targetW, targetH);

      ctx.restore();

      drawFrameDetails(ctx, centerX, centerY, radius, frameWidth, shape);
    };
  }, [src, canvasDims, shape]);

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
  const drawRealisticShadow = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    shape: CanvasShape
  ) => {
    ctx.save();

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

  const drawFrameBackground = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    frameWidth: number,
    shape: CanvasShape
  ) => {
    ctx.save();

    const gradient = ctx.createLinearGradient(0, 0, frameWidth, frameWidth);
    gradient.addColorStop(0, '#D2B48C');
    gradient.addColorStop(0.3, '#F5DEB3');
    gradient.addColorStop(0.7, '#DEB887');
    gradient.addColorStop(1, '#BC9A6A');

    ctx.fillStyle = gradient;

    switch (shape) {
      case 'rectangle':
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.globalCompositeOperation = 'destination-out';
        const innerWidth = ctx.canvas.width - frameWidth * 2;
        const innerHeight = ctx.canvas.height - frameWidth * 2;
        ctx.fillRect(frameWidth, frameWidth, innerWidth, innerHeight);
        break;
      default:
        ctx.beginPath();

        if (shape === 'round') {
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        } else {
          const sides = shape === 'hexagon' ? 6 : shape === 'octagon' ? 8 : 12;
          drawPolygon(ctx, centerX, centerY, radius, sides);
        }

        ctx.fill();
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

  const drawFrameDetails = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    frameWidth: number,
    shape: CanvasShape
  ) => {
    ctx.save();

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
