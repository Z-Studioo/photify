import { Button } from '@/components/ui/button';
import { CropIcon, RotateCcwIcon } from 'lucide-react';
import { Slot } from 'radix-ui';
import {
  type ComponentProps,
  type CSSProperties,
  createContext,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
  type ReactCropProps,
} from 'react-image-crop';
import { cn } from '@/lib/utils';

import 'react-image-crop/dist/ReactCrop.css';

const centerAspectCrop = (
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined
): PercentCrop =>
  centerCrop(
    aspect
      ? makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspect,
          mediaWidth,
          mediaHeight
        )
      : { x: 0, y: 0, width: 90, height: 90, unit: '%' },
    mediaWidth,
    mediaHeight
  );

const canvasToJpegBlob = (
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      blob =>
        blob ? resolve(blob) : reject(new Error('Failed to encode image')),
      'image/jpeg',
      quality
    )
  );

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/**
 * Crop the image at its FULL NATIVE RESOLUTION. `pixelCrop` is in displayed
 * (on-screen) pixels; the output canvas is sized from the image's natural
 * pixels so print files keep every pixel the source photo has (print needs
 * 300 DPI — sizing from screen pixels used to produce ~50–75 DPI files).
 *
 * Output is JPEG. To stay under `maxImageSize` we step encoding quality
 * down first and only downscale dimensions as a last resort.
 */
export const getCroppedPngImage = async (
  imageSrc: HTMLImageElement,
  scaleFactor: number = 1,
  pixelCrop: PixelCrop,
  maxImageSize: number
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context is null');
  }

  const scaleX = imageSrc.naturalWidth / imageSrc.width;
  const scaleY = imageSrc.naturalHeight / imageSrc.height;

  canvas.width = Math.round(pixelCrop.width * scaleX * scaleFactor);
  canvas.height = Math.round(pixelCrop.height * scaleY * scaleFactor);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    imageSrc,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  for (const quality of [0.92, 0.85, 0.8, 0.75]) {
    const blob = await canvasToJpegBlob(canvas, quality);
    if (blob.size <= maxImageSize) {
      return blobToDataUrl(blob);
    }
  }

  // Still too large at the lowest acceptable quality: shrink dimensions.
  return getCroppedPngImage(imageSrc, scaleFactor * 0.9, pixelCrop, maxImageSize);
};

/**
 * Center-crop an image source to `targetAspect` at full native resolution.
 * Used to auto-fit a photo to its matched print ratio without requiring the
 * user to go through the crop UI (they can still fine-tune afterwards).
 * Returns a JPEG data URL, or null when the source can't be processed.
 */
export const getCenterCroppedImage = async (
  src: string,
  targetAspect: number,
  maxImageSize: number = 1024 * 1024 * 15,
  scaleFactor: number = 1
): Promise<string | null> => {
  const image = await new Promise<HTMLImageElement | null>(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  if (!image?.naturalWidth || !image.naturalHeight || targetAspect <= 0) {
    return null;
  }

  const iw = image.naturalWidth;
  const ih = image.naturalHeight;
  let cropW = iw;
  let cropH = ih;
  if (iw / ih > targetAspect) {
    cropW = Math.round(ih * targetAspect);
  } else {
    cropH = Math.round(iw / targetAspect);
  }
  const x = Math.round((iw - cropW) / 2);
  const y = Math.round((ih - cropH) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cropW * scaleFactor));
  canvas.height = Math.max(1, Math.round(cropH * scaleFactor));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, x, y, cropW, cropH, 0, 0, canvas.width, canvas.height);

  try {
    for (const quality of [0.92, 0.85, 0.8, 0.75]) {
      const blob = await canvasToJpegBlob(canvas, quality);
      if (blob.size <= maxImageSize) {
        return blobToDataUrl(blob);
      }
    }
  } catch {
    return null;
  }

  // Still too large at the lowest acceptable quality: shrink dimensions.
  return getCenterCroppedImage(src, targetAspect, maxImageSize, scaleFactor * 0.9);
};

type ImageCropContextType = {
  file: File;
  maxImageSize: number;
  imgSrc: string;
  crop: PercentCrop | undefined;
  completedCrop: PixelCrop | null;
  imgRef: RefObject<HTMLImageElement | null>;
  onCrop?: (croppedImage: string) => void;
  reactCropProps: Omit<ReactCropProps, 'onChange' | 'onComplete' | 'children'>;
  handleChange: (pixelCrop: PixelCrop, percentCrop: PercentCrop) => void;
  handleComplete: (
    pixelCrop: PixelCrop,
    percentCrop: PercentCrop
  ) => Promise<void>;
  onImageLoad: (e: SyntheticEvent<HTMLImageElement>) => void;
  applyCrop: () => Promise<void>;
  resetCrop: () => void;
};

const ImageCropContext = createContext<ImageCropContextType | null>(null);

const useImageCrop = () => {
  const context = useContext(ImageCropContext);
  if (!context) {
    throw new Error('ImageCrop components must be used within ImageCrop');
  }
  return context;
};

export type ImageCropProps = {
  file: File;
  maxImageSize?: number;
  onCrop?: (croppedImage: string) => void;
  children: ReactNode;
  onChange?: ReactCropProps['onChange'];
  onComplete?: ReactCropProps['onComplete'];

  // NEW
  onChangeCustom?: (image: string) => void;
  generateImageOnChange?: boolean;
  /** Called with each cropped-image generation promise, so consumers can await completion before applying. */
  onGenerationStart?: (promise: Promise<void>) => void;
} & Omit<ReactCropProps, 'onChange' | 'onComplete' | 'children'>;

export const ImageCrop = ({
  file,
  maxImageSize = 1024 * 1024 * 15,
  onCrop,
  children,
  onChange,
  onComplete,
  generateImageOnChange,
  onChangeCustom,
  onGenerationStart,
  ...reactCropProps
}: ImageCropProps) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [initialCrop, setInitialCrop] = useState<PercentCrop>();
  // Monotonic id so a slow, older generation can't overwrite a newer crop.
  const generationIdRef = useRef(0);

  useEffect(() => {
    const reader = new FileReader();
    reader.addEventListener('load', () =>
      setImgSrc(reader.result?.toString() || '')
    );
    reader.readAsDataURL(file);
  }, [file]);

  // Discard in-flight generations on unmount (e.g. the user cancelled the
  // crop view) so a late result can't repopulate the pending crop state.
  useEffect(
    () => () => {
      generationIdRef.current++;
    },
    []
  );

  // Full-resolution generation is expensive, so it runs only when a crop is
  // committed (image load + drag end), not on every change event. Starting
  // immediately on drag end also means the result is ready by the time the
  // user reaches the Apply button (the old 100ms debounce could hand Apply a
  // stale previous crop).
  const generateCroppedImage = useCallback(
    (pixelCrop: PixelCrop) => {
      if (!generateImageOnChange || !imgRef.current) return;
      const generationId = ++generationIdRef.current;

      const promise = (async () => {
        try {
          const croppedImage = await getCroppedPngImage(
            imgRef.current!,
            1,
            pixelCrop,
            maxImageSize
          );
          if (generationId === generationIdRef.current) {
            onChangeCustom?.(croppedImage);
          }
        } catch (err) {
          console.error('Failed to generate cropped image:', err);
        }
      })();

      onGenerationStart?.(promise);
    },
    [generateImageOnChange, maxImageSize, onChangeCustom, onGenerationStart]
  );

  const onImageLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const newCrop = centerAspectCrop(width, height, reactCropProps.aspect);
      setCrop(newCrop);
      setInitialCrop(newCrop);

      const pixelCrop = convertToPixelCrop(newCrop, width, height);
      setCompletedCrop(pixelCrop);
      generateCroppedImage(pixelCrop);
    },
    [reactCropProps.aspect, generateCroppedImage]
  );

  const handleChange = (pixelCrop: PixelCrop, percentCrop: PercentCrop) => {
    setCrop(percentCrop);
    onChange?.(pixelCrop, percentCrop);
  };

  // biome-ignore lint/suspicious/useAwait: "onComplete is async"
  const handleComplete = async (
    pixelCrop: PixelCrop,
    percentCrop: PercentCrop
  ) => {
    setCompletedCrop(pixelCrop);
    onComplete?.(pixelCrop, percentCrop);
    generateCroppedImage(pixelCrop);
  };

  const applyCrop = async () => {
    if (!(imgRef.current && completedCrop)) {
      return;
    }

    const croppedImage = await getCroppedPngImage(
      imgRef.current,
      1,
      completedCrop,
      maxImageSize
    );

    onCrop?.(croppedImage);
  };

  const resetCrop = () => {
    if (initialCrop) {
      setCrop(initialCrop);
      setCompletedCrop(null);
    }
  };

  const contextValue: ImageCropContextType = {
    file,
    maxImageSize,
    imgSrc,
    crop,
    completedCrop,
    imgRef,
    onCrop,
    reactCropProps,
    handleChange,
    handleComplete,
    onImageLoad,
    applyCrop,
    resetCrop,
  };

  return (
    <ImageCropContext.Provider value={contextValue}>
      {children}
    </ImageCropContext.Provider>
  );
};

export type ImageCropContentProps = {
  style?: CSSProperties;
  className?: string;
};

export const ImageCropContent = ({
  style,
  className,
}: ImageCropContentProps) => {
  const {
    imgSrc,
    crop,
    handleChange,
    handleComplete,
    onImageLoad,
    imgRef,
    reactCropProps,
  } = useImageCrop();

  const shadcnStyle = {
    '--rc-border-color': 'var(--color-border)',
    '--rc-focus-color': 'var(--color-primary)',
  } as CSSProperties;

  return (
    <ReactCrop
      className={cn('max-h-full max-w-full min-h-0 min-w-0', className)}
      crop={crop}
      onChange={handleChange}
      onComplete={handleComplete}
      style={{ ...shadcnStyle, ...style }}
      {...reactCropProps}
    >
      {imgSrc && (
        <img
          alt='crop'
          className='size-full'
          onLoad={onImageLoad}
          ref={imgRef}
          src={imgSrc}
        />
      )}
    </ReactCrop>
  );
};

export type ImageCropApplyProps = ComponentProps<'button'> & {
  asChild?: boolean;
};

export const ImageCropApply = ({
  asChild = false,
  children,
  onClick,
  ...props
}: ImageCropApplyProps) => {
  const { applyCrop } = useImageCrop();

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    await applyCrop();
    onClick?.(e);
  };

  if (asChild) {
    return (
      <Slot.Root onClick={handleClick} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <Button onClick={handleClick} size='icon' variant='ghost' {...props}>
      {children ?? <CropIcon className='size-4' />}
    </Button>
  );
};

export type ImageCropResetProps = ComponentProps<'button'> & {
  asChild?: boolean;
};

export const ImageCropReset = ({
  asChild = false,
  children,
  onClick,
  ...props
}: ImageCropResetProps) => {
  const { resetCrop } = useImageCrop();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    resetCrop();
    onClick?.(e);
  };

  if (asChild) {
    return (
      <Slot.Root onClick={handleClick} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <Button onClick={handleClick} size='icon' variant='ghost' {...props}>
      {children ?? <RotateCcwIcon className='size-4' />}
    </Button>
  );
};

// Keep the original Cropper component for backward compatibility
export type CropperProps = Omit<ReactCropProps, 'onChange'> & {
  file: File;
  maxImageSize?: number;
  onCrop?: (croppedImage: string) => void;
  onChange?: ReactCropProps['onChange'];
};

export const Cropper = ({
  onChange,
  onComplete,
  onCrop,
  style,
  className,
  file,
  maxImageSize,
  ...props
}: CropperProps) => {
  return (
    <ImageCrop
      file={file}
      maxImageSize={maxImageSize}
      onChange={onChange}
      onComplete={onComplete}
      onCrop={onCrop}
      {...props}
    >
      <ImageCropContent className={className} style={style} />
    </ImageCrop>
  );
};
