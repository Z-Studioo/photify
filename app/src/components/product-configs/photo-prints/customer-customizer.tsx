import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  Trash2,
  Crop,
  ShoppingCart,
  Loader2,
  AlertTriangle,
  RotateCw,
  ImagePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { uploadFileToStorage } from '@/lib/supabase/storage';
import { useCart } from '@/context/CartContext';
import { DiscountedAmount, useDiscountedPrice } from '@/components/shared/Price';
import { usePromoDiscount } from '@/context/PromoDiscountContext';
import { computeDiscountedPrice } from '@/lib/pricing';
import { Header } from '@/components/layout/header';
import { PhotoPrintCropModal } from './crop-modal';
import {
  PHOTO_PRINTS_PRODUCT,
  resolvePhotoPrintsConfig,
  getActivePrintSizes,
  resolvePrintSize,
  computeEffectiveDpi,
  findClosestPrintSize,
  clearPhotoPrintsSession,
} from './config';
import { autoCropToAspect, detectLandscape } from './crop-utils';
import type {
  PhotoPrintItem,
  PhotoPrintSizeConfig,
  PhotoPrintsProductConfig,
} from './types';

function generateId(): string {
  return `print-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PhotoPrintsCustomizer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productIdParam = searchParams.get('productId');
  const { addToCart } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [productName, setProductName] = useState(PHOTO_PRINTS_PRODUCT.name);
  const [printConfig, setPrintConfig] = useState<PhotoPrintsProductConfig | null>(
    null
  );
  const [items, setItems] = useState<PhotoPrintItem[]>([]);
  const [applySizeId, setApplySizeId] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{
    itemId: string;
    printWidthIn: number;
    printHeightIn: number;
  } | null>(null);

  const activeSizes = useMemo(
    () => (printConfig ? getActivePrintSizes(printConfig) : []),
    [printConfig]
  );

  const defaultSizeId = activeSizes[0]?.id ?? '4x6';

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const supabase = createClient();

      try {
        if (!productIdParam) {
          setPrintConfig(resolvePhotoPrintsConfig(null));
          setLoading(false);
          return;
        }

        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            productIdParam
          );

        const { data, error } = await supabase
          .from('products')
          .select('id, name, config')
          .eq(isUUID ? 'id' : 'slug', productIdParam)
          .single();

        if (error) {
          console.error('Error loading product:', error);
          setPrintConfig(resolvePhotoPrintsConfig(null));
          toast.error('Could not load product — using default print sizes');
        } else if (data) {
          setProductName(data.name || PHOTO_PRINTS_PRODUCT.name);
          const cfg = resolvePhotoPrintsConfig(
            (data.config as { photoPrints?: unknown })?.photoPrints
          );
          setPrintConfig(cfg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productIdParam]);

  const getSizeById = useCallback(
    (sizeId: string): PhotoPrintSizeConfig | undefined =>
      activeSizes.find(s => s.id === sizeId),
    [activeSizes]
  );

  const applyCropToItem = async (
    item: PhotoPrintItem,
    sizeId: string,
    landscape: boolean
  ): Promise<PhotoPrintItem> => {
    const size = getSizeById(sizeId);
    if (!size) return item;

    const resolved = resolvePrintSize(size, landscape);
    try {
      const crop = await autoCropToAspect(item.originalUrl, resolved.aspectRatio);
      if (item.croppedPreviewUrl) URL.revokeObjectURL(item.croppedPreviewUrl);
      return {
        ...item,
        sizeId,
        landscape,
        croppedBlob: crop.blob,
        croppedPreviewUrl: crop.previewUrl,
        croppedWidthPx: crop.widthPx,
        croppedHeightPx: crop.heightPx,
        previewUrl: crop.previewUrl,
      };
    } catch {
      return { ...item, sizeId, landscape };
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files?.length || !printConfig) return;

    const remaining = printConfig.maxPhotos - items.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${printConfig.maxPhotos} photos per order`);
      return;
    }

    const toAdd = Array.from(files).slice(0, remaining);
    const newItems: PhotoPrintItem[] = [];

    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) continue;

      const originalUrl = URL.createObjectURL(file);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = originalUrl;
      });

      const landscape = detectLandscape(img.naturalWidth, img.naturalHeight);
      const closest = findClosestPrintSize(
        activeSizes,
        img.naturalWidth,
        img.naturalHeight
      );
      const sizeId = applySizeId ?? closest?.id ?? defaultSizeId;

      const baseItem: PhotoPrintItem = {
        id: generateId(),
        originalUrl,
        previewUrl: originalUrl,
        sizeId,
        quantity: 1,
        landscape,
      };

      const cropped = await applyCropToItem(baseItem, sizeId, landscape);
      newItems.push(cropped);
    }

    setItems(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateItem = async (
    id: string,
    patch: Partial<Pick<PhotoPrintItem, 'sizeId' | 'quantity' | 'landscape'>>
  ) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        return { ...item, ...patch };
      })
    );

    const item = items.find(i => i.id === id);
    if (!item) return;

    const nextSizeId = patch.sizeId ?? item.sizeId;
    const nextLandscape =
      patch.landscape !== undefined ? patch.landscape : item.landscape;

    if (patch.sizeId !== undefined || patch.landscape !== undefined) {
      const updated = await applyCropToItem(item, nextSizeId, nextLandscape);
      setItems(prev => prev.map(i => (i.id === id ? updated : i)));
    }
  };

  const handleApplySizeToAll = async (sizeId: string) => {
    setApplySizeId(sizeId);
    const updated = await Promise.all(
      items.map(item => applyCropToItem(item, sizeId, item.landscape))
    );
    setItems(updated);
    toast.success('Size applied to all photos');
  };

  const removeItem = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.originalUrl);
        if (item.croppedPreviewUrl && item.croppedPreviewUrl !== item.originalUrl) {
          URL.revokeObjectURL(item.croppedPreviewUrl);
        }
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const getItemDpi = (item: PhotoPrintItem): number | null => {
    if (!item.croppedWidthPx || !item.croppedHeightPx) return null;
    const size = getSizeById(item.sizeId);
    if (!size) return null;
    const resolved = resolvePrintSize(size, item.landscape);
    const longPx = Math.max(item.croppedWidthPx, item.croppedHeightPx);
    const longIn = Math.max(resolved.widthIn, resolved.heightIn);
    return computeEffectiveDpi(longPx, longIn);
  };

  const lineTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const size = getSizeById(item.sizeId);
      if (!size) return sum;
      return sum + size.price * item.quantity;
    }, 0);
  }, [items, getSizeById]);
  const { discountPercent } = usePromoDiscount();
  const linePrice = useDiscountedPrice(lineTotal);

  const formatSizeOptionPrice = (price: number) => {
    const { discounted, hasDiscount, original } = computeDiscountedPrice(
      price,
      discountPercent
    );
    if (!hasDiscount) return `£${original.toFixed(2)}`;
    return `£${discounted.toFixed(2)} (was £${original.toFixed(2)})`;
  };

  const handleAddToCart = async () => {
    if (items.length === 0) {
      toast.error('Upload at least one photo');
      return;
    }

    const missingCrop = items.some(i => !i.croppedBlob);
    if (missingCrop) {
      toast.error('Some photos need cropping — please wait or re-upload');
      return;
    }

    setAddingToCart(true);

    try {
      const grouped = new Map<
        string,
        { size: PhotoPrintSizeConfig; landscape: boolean; blobs: Blob[]; label: string }
      >();

      for (const item of items) {
        const size = getSizeById(item.sizeId);
        if (!size || !item.croppedBlob) continue;

        const resolved = resolvePrintSize(size, item.landscape);
        const key = `${item.sizeId}:${item.landscape ? 'L' : 'P'}`;

        if (!grouped.has(key)) {
          grouped.set(key, {
            size,
            landscape: item.landscape,
            blobs: [],
            label: resolved.label,
          });
        }

        const group = grouped.get(key)!;
        for (let q = 0; q < item.quantity; q++) {
          group.blobs.push(item.croppedBlob);
        }
      }

      for (const [, group] of grouped) {
        const urls: string[] = [];
        for (let i = 0; i < group.blobs.length; i++) {
          const file = new File(
            [group.blobs[i]],
            `photo-print-${group.size.id}-${i}.jpg`,
            { type: 'image/jpeg' }
          );
          const url = await uploadFileToStorage(file, 'cart-images');
          if (!url) {
            throw new Error('Failed to upload print file');
          }
          urls.push(url);
        }

        const cartId = `photo-prints-${group.size.id}-${group.landscape ? 'L' : 'P'}-${Date.now()}`;

        await addToCart({
          id: cartId,
          name: `${productName} — ${group.label}`,
          price: group.size.price,
          image: urls[0],
          images: urls,
          size: `${urls.length} × ${group.label} print${urls.length > 1 ? 's' : ''}`,
          quantity: urls.length,
        });
      }

      clearPhotoPrintsSession();
      toast.success('Prints added to cart');
      navigate('/cart');
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to add prints to cart'
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const cropItem = cropTarget
    ? items.find(i => i.id === cropTarget.itemId)
    : null;

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-white'>
        <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 font-["Mona_Sans",_sans-serif]'>
      <Header />

      <div className='max-w-4xl mx-auto px-4 py-8 sm:py-12'>
        <div className='mb-8'>
          <h1
            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2"
            style={{ fontSize: '32px', fontWeight: '700' }}
          >
            {productName}
          </h1>
          <p className='text-gray-600'>
            Upload photos, choose print sizes, and crop each one for the best
            result.
          </p>
        </div>

        {/* Upload zone */}
        <div
          className='mb-6 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-center cursor-pointer hover:border-[#f63a9e] hover:bg-pink-50/30 transition-colors'
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            handleFilesSelected(e.dataTransfer.files);
          }}
        >
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            multiple
            className='hidden'
            onChange={e => handleFilesSelected(e.target.files)}
          />
          <ImagePlus className='w-12 h-12 mx-auto text-gray-400 mb-3' />
          <p className='font-semibold text-gray-900 mb-1'>
            Tap to upload from camera roll
          </p>
          <p className='text-sm text-gray-500'>
            Up to {printConfig?.maxPhotos ?? 50} photos · JPG, PNG, HEIC where
            supported
          </p>
        </div>

        {/* Apply size to all */}
        {items.length > 0 && activeSizes.length > 0 && (
          <div className='mb-6 rounded-xl border border-gray-200 bg-white p-4'>
            <p className='text-sm font-medium text-gray-700 mb-3'>
              Apply size to all photos
            </p>
            <div className='flex flex-wrap gap-2'>
              {activeSizes.map(size => (
                <Button
                  key={size.id}
                  variant={applySizeId === size.id ? 'default' : 'outline'}
                  size='sm'
                  className={
                    applySizeId === size.id
                      ? 'bg-[#f63a9e] hover:bg-[#e02d8d]'
                      : ''
                  }
                  onClick={() => handleApplySizeToAll(size.id)}
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Photo cards */}
        <div className='space-y-4 mb-8'>
          {items.map(item => {
            const size = getSizeById(item.sizeId);
            const resolved = size
              ? resolvePrintSize(size, item.landscape)
              : null;
            const dpi = getItemDpi(item);
            const lowDpi =
              dpi != null &&
              printConfig &&
              dpi < printConfig.minDpi;
            const isSquare = size && size.widthIn === size.heightIn;

            return (
              <div
                key={item.id}
                className='rounded-xl border border-gray-200 bg-white p-4 flex gap-4'
              >
                <div className='w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100'>
                  <img
                    src={item.previewUrl}
                    alt='Print preview'
                    className='w-full h-full object-cover'
                  />
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex flex-wrap items-center gap-2 mb-3'>
                    <select
                      value={item.sizeId}
                      onChange={e =>
                        updateItem(item.id, { sizeId: e.target.value })
                      }
                      className='rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white'
                    >
                      {activeSizes.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.label} — {formatSizeOptionPrice(s.price)}
                        </option>
                      ))}
                    </select>

                    {!isSquare && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          updateItem(item.id, {
                            landscape: !item.landscape,
                          })
                        }
                        title='Toggle orientation'
                      >
                        <RotateCw className='w-4 h-4 mr-1' />
                        {item.landscape ? 'Landscape' : 'Portrait'}
                      </Button>
                    )}

                    <div className='flex items-center gap-2'>
                      <label className='text-sm text-gray-600'>Qty</label>
                      <input
                        type='number'
                        min={1}
                        max={99}
                        value={item.quantity}
                        onChange={e =>
                          updateItem(item.id, {
                            quantity: Math.max(
                              1,
                              parseInt(e.target.value, 10) || 1
                            ),
                          })
                        }
                        className='w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm'
                      />
                    </div>
                  </div>

                  {resolved && (
                    <p className='text-xs text-gray-500 mb-2'>
                      Print size: {resolved.label}
                      {size && (
                        <>
                          {' · '}
                          <DiscountedAmount amount={size.price} className='inline text-xs' />
                          {' each'}
                        </>
                      )}
                    </p>
                  )}

                  {lowDpi && (
                    <p className='text-xs text-amber-700 flex items-center gap-1 mb-2'>
                      <AlertTriangle className='w-3.5 h-3.5' />
                      May look soft at this size (~{Math.round(dpi!)} DPI)
                    </p>
                  )}

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        if (resolved) {
                          setCropTarget({
                            itemId: item.id,
                            printWidthIn: resolved.widthIn,
                            printHeightIn: resolved.heightIn,
                          });
                        }
                      }}
                    >
                      <Crop className='w-4 h-4 mr-1' />
                      Adjust crop
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-red-600 hover:text-red-700'
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className='text-center py-12 text-gray-500'>
            <Upload className='w-10 h-10 mx-auto mb-3 opacity-40' />
            <p>No photos yet — upload to get started</p>
          </div>
        )}

        {/* Footer CTA */}
        {items.length > 0 && (
          <div className='sticky bottom-4 rounded-2xl border border-gray-200 bg-white shadow-lg p-4 flex items-center justify-between gap-4'>
            <div>
              <p className='text-sm text-gray-600'>
                {items.reduce((s, i) => s + i.quantity, 0)} print
                {items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
              </p>
              <p className='text-xl font-bold text-gray-900'>
                {linePrice.hasDiscount ? (
                  <span className='inline-flex items-baseline gap-2'>
                    <span>£{linePrice.discounted.toFixed(2)}</span>
                    <span className='text-sm font-normal text-gray-400 line-through'>
                      £{linePrice.original.toFixed(2)}
                    </span>
                  </span>
                ) : (
                  `£${lineTotal.toFixed(2)}`
                )}
              </p>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className='bg-[#f63a9e] hover:bg-[#e02d8d] h-12 px-8 rounded-xl'
              style={{ fontWeight: 700 }}
            >
              {addingToCart ? (
                <>
                  <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                  Uploading...
                </>
              ) : (
                <>
                  <ShoppingCart className='w-5 h-5 mr-2' />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {cropItem && cropTarget && printConfig && (
        <PhotoPrintCropModal
          isOpen
          imageUrl={cropItem.originalUrl}
          printWidthIn={cropTarget.printWidthIn}
          printHeightIn={cropTarget.printHeightIn}
          minDpi={printConfig.minDpi}
          onClose={() => setCropTarget(null)}
          onCropComplete={result => {
            setItems(prev =>
              prev.map(i => {
                if (i.id !== cropItem.id) return i;
                if (
                  i.croppedPreviewUrl &&
                  i.croppedPreviewUrl !== i.originalUrl
                ) {
                  URL.revokeObjectURL(i.croppedPreviewUrl);
                }
                return {
                  ...i,
                  croppedBlob: result.blob,
                  croppedPreviewUrl: result.previewUrl,
                  croppedWidthPx: result.widthPx,
                  croppedHeightPx: result.heightPx,
                  previewUrl: result.previewUrl,
                };
              })
            );
            setCropTarget(null);
          }}
        />
      )}
    </div>
  );
}
