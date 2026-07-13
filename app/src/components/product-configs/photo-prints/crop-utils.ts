/** Auto-fit crop an image to the target aspect ratio at full resolution */
export async function autoCropToAspect(
  imageUrl: string,
  aspectRatio: number
): Promise<{
  blob: Blob;
  previewUrl: string;
  widthPx: number;
  heightPx: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const { naturalWidth, naturalHeight } = img;
        const imageAspect = naturalWidth / naturalHeight;

        let cropWidth = naturalWidth;
        let cropHeight = naturalHeight;
        let srcX = 0;
        let srcY = 0;

        if (imageAspect > aspectRatio) {
          cropWidth = naturalHeight * aspectRatio;
          srcX = (naturalWidth - cropWidth) / 2;
        } else {
          cropHeight = naturalWidth / aspectRatio;
          srcY = (naturalHeight - cropHeight) / 2;
        }

        const OUTPUT_WIDTH = Math.max(1, Math.round(cropWidth));
        const OUTPUT_HEIGHT = Math.max(1, Math.round(cropHeight));

        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_WIDTH;
        canvas.height = OUTPUT_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          img,
          srcX,
          srcY,
          cropWidth,
          cropHeight,
          0,
          0,
          OUTPUT_WIDTH,
          OUTPUT_HEIGHT
        );

        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Failed to create crop'));
              return;
            }
            resolve({
              blob,
              previewUrl: URL.createObjectURL(blob),
              widthPx: OUTPUT_WIDTH,
              heightPx: OUTPUT_HEIGHT,
            });
          },
          'image/jpeg',
          0.95
        );
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/** Detect if a photo is landscape from its natural dimensions */
export function detectLandscape(
  width: number,
  height: number
): boolean {
  return width > height;
}
