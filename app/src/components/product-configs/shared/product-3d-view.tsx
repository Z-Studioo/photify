import { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/context/CartContext';
import {
  Ruler,
  Eye,
  ShoppingCart,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Crop,
  Box,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Canvas3DImageEditor } from '../single-canvas/canvas-3d-image-editor';
import Canvas3DPreview from '../single-canvas/canvas-3d-preview.client';
import { Room3DPreview } from './3d/room-3d-preview';
import { SingleCanvasMesh } from '../single-canvas/single-canvas-mesh';
import { resolveCanvasSizePrice } from '@/lib/canvas-size-price';
import type { InchData } from '@/utils/ratio-sizes';
import type { Product as LibProduct } from '@/lib/data/types';

export interface Product3DViewProps {
  imageUrl: string;
  canvasWidth?: number; // In inches - optional, will use size dimensions if not provided
  canvasHeight?: number; // In inches - optional
  productId: string;
  productName?: string;
  aspectRatioId?: string; // Optional: filter to specific aspect ratio only
  wrapImage?: boolean; // Optional: if false, use solid color sides instead of wrapping image
  sideColor?: string; // Optional: color for canvas sides when wrapImage is false
  mirrorEdges?: boolean; // Optional: if true and wrapImage is true, mirror edges instead of wrapping
  onBack?: () => void; // Optional callback for back button
  customSizeSelector?: React.ComponentType<CustomSizeSelectorProps>; // Optional: custom size selector from parent configurer
  enableImageEditor?: boolean; // Optional: enable image crop editor (for single-canvas)
}

// Props that will be passed to custom size selector components
export interface CustomSizeSelectorProps {
  productId: string;
  selectedSizeId: string | null;
  selectedAspectRatioId: string | null;
  onSizeSelect: (
    sizeId: string,
    aspectRatioId: string,
    width: number,
    height: number
  ) => void;
  onImageEdit?: () => void; // Optional: trigger image editor
  imageUrl: string;
}

interface AspectRatio {
  id: string;
  label: string;
  width_ratio: number;
  height_ratio: number;
  orientation: 'portrait' | 'landscape' | 'square';
  active: boolean;
}

interface Size {
  id: string;
  aspect_ratio_id: string;
  width_in: number;
  height_in: number;
  display_label: string;
  area_in2: number;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  config: {
    allowedRatios: string[];
    allowedSizes: string[];
    /**
     * Admin-configured GBP price per size, keyed by size id. When present it
     * overrides the `area_in2 * products.price` fallback.
     */
    sizePrices?: Record<string, number | string>;
  };
}

/**
 * Admin-configured `config.sizePrices` takes precedence; falls back to the
 * shared `resolveCanvasSizePrice` logic (per-size fixed_price, then area × base).
 * Returns a `.toFixed(2)` string for rendering; `'0.00'` when unresolvable.
 */
function formatSizePrice(size: Size, product: Product | null | undefined): string {
  const resolved = resolveCanvasSizePrice(
    size as unknown as InchData,
    product as unknown as LibProduct
  );
  return resolved != null ? resolved.toFixed(2) : '0.00';
}

export function Product3DView({
  imageUrl,
  canvasWidth,
  canvasHeight,
  productId,
  productName,
  aspectRatioId,
  wrapImage = true,
  sideColor,
  mirrorEdges = false,
  onBack,
  customSizeSelector: CustomSizeSelector,
  enableImageEditor = false,
}: Product3DViewProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const supabase = createClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [aspectRatios, setAspectRatios] = useState<AspectRatio[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRuler, setShowRuler] = useState(false);
  const [viewMode, setViewMode] = useState<'canvas' | 'room'>('canvas');

  // Selection state
  const [selectedAspectRatioId, setSelectedAspectRatioId] = useState<
    string | null
  >(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [rotation] = useState(0);
  const [zoom] = useState(1);
  const [wallColor] = useState('#d4e4d4'); // Default sage green

  // Dynamic canvas dimensions (updated from custom size selector or default selection)
  const [currentWidth, setCurrentWidth] = useState<number | undefined>(
    canvasWidth
  );
  const [currentHeight, setCurrentHeight] = useState<number | undefined>(
    canvasHeight
  );

  // Image editor state
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);

  // Initialize dimensions from URL params
  useEffect(() => {
    if (canvasWidth && canvasHeight) {
      setCurrentWidth(canvasWidth);
      setCurrentHeight(canvasHeight);
    }
  }, [canvasWidth, canvasHeight]);

  // Handler for custom size selector
  const handleCustomSizeSelect = (
    sizeId: string,
    aspectRatioId: string,
    width: number,
    height: number
  ) => {
    setSelectedSizeId(sizeId);
    setSelectedAspectRatioId(aspectRatioId);
    setCurrentWidth(width);
    setCurrentHeight(height);
  };

  // Handler for image editor
  const handleImageEdit = () => {
    setShowImageEditor(true);
  };

  // Handler for crop complete
  const handleCropComplete = (newImageUrl: string) => {
    setCurrentImageUrl(newImageUrl);
    setShowImageEditor(false);
    toast.success('Image updated! Preview refreshed.');
  };

  // Fetch product configuration and available options
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch product configuration
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id, name, price, config')
          .eq('id', productId)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        if (productData?.config?.allowedRatios) {
          // If aspectRatioId is provided, filter to only that ratio
          let ratiosToFetch = productData.config.allowedRatios;
          if (aspectRatioId) {
            ratiosToFetch = [aspectRatioId];
          }

          // Fetch allowed aspect ratios (filtered if aspectRatioId provided)
          const { data: ratiosData, error: ratiosError } = await supabase
            .from('aspect_ratios')
            .select('*')
            .in('id', ratiosToFetch)
            .eq('active', true)
            .order('label');

          if (ratiosError) throw ratiosError;
          setAspectRatios(ratiosData || []);

          // Fetch allowed sizes - filter by aspect ratio if provided
          let sizesQuery = supabase
            .from('sizes')
            .select('*')
            .in('id', productData.config.allowedSizes)
            .eq('active', true);

          // If specific aspect ratio provided, only fetch sizes for that ratio
          if (aspectRatioId && ratiosData && ratiosData.length > 0) {
            sizesQuery = sizesQuery.eq('aspect_ratio_id', aspectRatioId);
          }

          const { data: sizesData, error: sizesError } =
            await sizesQuery.order('area_in2');

          if (sizesError) throw sizesError;
          setSizes(sizesData || []);

          // Auto-select aspect ratio and size
          if (aspectRatioId) {
            // Specific aspect ratio provided - use it directly
            setSelectedAspectRatioId(aspectRatioId);

            // Auto-select best matching size for this ratio
            if (
              canvasWidth &&
              canvasHeight &&
              sizesData &&
              sizesData.length > 0
            ) {
              const providedArea = canvasWidth * canvasHeight;
              let bestSize = sizesData[0];
              let smallestAreaDiff = Math.abs(
                sizesData[0].area_in2 - providedArea
              );

              sizesData.forEach(size => {
                const areaDiff = Math.abs(size.area_in2 - providedArea);
                if (areaDiff < smallestAreaDiff) {
                  smallestAreaDiff = areaDiff;
                  bestSize = size;
                }
              });

              setSelectedSizeId(bestSize.id);
            } else if (sizesData && sizesData.length > 0) {
              // Just select first size if no dimensions provided
              setSelectedSizeId(sizesData[0].id);
            }
          } else if (
            canvasWidth &&
            canvasHeight &&
            sizesData &&
            sizesData.length > 0
          ) {
            // No specific aspect ratio - find best matching one
            const imageAspectRatio = canvasWidth / canvasHeight;

            // Find best matching aspect ratio
            let bestRatio = ratiosData?.[0];
            let smallestDiff = Math.abs(
              imageAspectRatio -
                (ratiosData?.[0]?.width_ratio || 1) /
                  (ratiosData?.[0]?.height_ratio || 1)
            );

            ratiosData?.forEach(ratio => {
              const ratioValue = ratio.width_ratio / ratio.height_ratio;
              const diff = Math.abs(imageAspectRatio - ratioValue);
              if (diff < smallestDiff) {
                smallestDiff = diff;
                bestRatio = ratio;
              }
            });

            setSelectedAspectRatioId(bestRatio?.id || null);

            // Find best matching size for this ratio
            const availableSizes = sizesData.filter(
              s => s.aspect_ratio_id === bestRatio?.id
            );
            if (availableSizes.length > 0) {
              const providedArea = canvasWidth * canvasHeight;
              let bestSize = availableSizes[0];
              let smallestAreaDiff = Math.abs(
                availableSizes[0].area_in2 - providedArea
              );

              availableSizes.forEach(size => {
                const areaDiff = Math.abs(size.area_in2 - providedArea);
                if (areaDiff < smallestAreaDiff) {
                  smallestAreaDiff = areaDiff;
                  bestSize = size;
                }
              });

              setSelectedSizeId(bestSize.id);
            }
          } else if (ratiosData && ratiosData.length > 0) {
            // No dimensions or aspect ratio provided, just select first ratio
            setSelectedAspectRatioId(ratiosData[0].id);
            const firstRatioSizes = sizesData?.filter(
              s => s.aspect_ratio_id === ratiosData[0].id
            );
            if (firstRatioSizes && firstRatioSizes.length > 0) {
              setSelectedSizeId(firstRatioSizes[0].id);
            }
          }
        }
      } catch (error: any) {
        console.error('Error fetching configuration:', error);
        toast.error('Failed to load product configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, canvasWidth, canvasHeight]);

  // Calculate price — prefers admin-configured per-size prices from
  // `products.config.sizePrices`; otherwise falls back to area × base price.
  const calculatePrice = (): string => {
    if (!selectedSizeId) return '0.00';
    const selectedSize = sizes.find(s => s.id === selectedSizeId);
    if (!selectedSize) return '0.00';
    return formatSizePrice(selectedSize, product);
  };

  // Get available sizes for selected ratio
  const getAvailableSizes = () => {
    if (!selectedAspectRatioId) return [];
    return sizes.filter(s => s.aspect_ratio_id === selectedAspectRatioId);
  };

  // Handle aspect ratio change
  const handleAspectRatioChange = (newAspectRatioId: string) => {
    setSelectedAspectRatioId(newAspectRatioId);
    // Auto-select first size of new ratio
    const newRatioSizes = sizes.filter(
      s => s.aspect_ratio_id === newAspectRatioId
    );
    const firstSize = newRatioSizes[0];
    if (firstSize) {
      setSelectedSizeId(firstSize.id);
      setCurrentWidth(firstSize.width_in);
      setCurrentHeight(firstSize.height_in);
    } else {
      setSelectedSizeId(null);
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    const selectedSize = sizes.find(s => s.id === selectedSizeId);
    const selectedRatio = aspectRatios.find(
      r => r.id === selectedAspectRatioId
    );

    if (!imageUrl || !selectedSize || !selectedRatio || !product) {
      toast.error('Please complete all selections before adding to basket');
      return;
    }

    const price = parseFloat(calculatePrice());

    // Create cart item
    const cartItem = {
      id: `${productId}-${Date.now()}`, // Unique ID for each customization
      name: `${product.name} - ${selectedSize.display_label}`,
      price: price,
      image: imageUrl,
      size: `${selectedSize.display_label} (${selectedRatio.label})`,
      quantity: 1,
    };

    await addToCart(cartItem);
    toast.success('Added to basket!');

    // Navigate to cart page
    navigate('/cart');
  };

  // Handle back button
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-[#f5f3ef]'>
        <div className='text-center'>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className='w-12 h-12 border-4 border-[#f63a9e] border-t-transparent rounded-full mx-auto mb-4'
          />
          <p className='text-gray-600'>Loading product preview...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-[#f5f3ef]'>
        <div className='text-center'>
          <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <p className='text-gray-600'>Product not found</p>
          <Button onClick={handleBack} className='mt-4'>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const selectedSize = sizes.find(s => s.id === selectedSizeId);

  return (
    <div className="min-h-screen md:h-screen bg-[#f5f3ef] font-['Mona_Sans',_sans-serif] overflow-hidden">
      {/* Back Button - Top Left - Mobile Responsive */}
      <div className='absolute top-2 left-2 md:top-4 md:left-4 z-20'>
        <Button
          variant='outline'
          size='sm'
          className='bg-white/90 backdrop-blur-md hover:bg-white h-9 md:h-10 px-3 md:px-4'
          onClick={handleBack}
        >
          <ArrowLeft className='w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2' />
          <span className='hidden md:inline'>Back</span>
        </Button>
      </div>

      {/* Main Content - Full Viewport Height - Mobile Responsive */}
      <div className='w-full min-h-screen md:h-screen flex'>
        <div className='flex flex-col lg:flex-row w-full h-full'>
          {/* LEFT SIDE - 3D Canvas Preview - Mobile: Half screen, Desktop: Flex */}
          <div className='flex-[2] relative h-[50vh] md:h-full lg:h-full'>
            <Suspense
              fallback={
                <div className='w-full h-full bg-gray-100 flex items-center justify-center'>
                  <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
                </div>
              }
            >
              {currentWidth && currentHeight ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className='w-full h-full'
                >
                  {viewMode === 'canvas' ? (
                    <Canvas3DPreview
                      imageUrl={currentImageUrl}
                      width={currentWidth}
                      height={currentHeight}
                      rotation={rotation}
                      zoom={zoom}
                      wrapImage={wrapImage}
                      sideColor={sideColor}
                      mirrorEdges={mirrorEdges}
                      showRuler={false}
                      wallColor={wallColor}
                    />
                  ) : (
                    <Room3DPreview
                      canvasMesh={
                        <SingleCanvasMesh
                          imageUrl={currentImageUrl}
                          width={currentWidth}
                          height={currentHeight}
                          rotation={rotation}
                          zoom={zoom}
                          wrapImage={wrapImage}
                          sideColor={sideColor}
                          mirrorEdges={mirrorEdges}
                        />
                      }
                      canvasWidth={currentWidth}
                      canvasHeight={currentHeight}
                      showRuler={showRuler}
                      wallColor={wallColor}
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center'
                >
                  <div className='text-center'>
                    <div className='w-32 h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 border-2 border-dashed border-gray-300 mx-auto'>
                      <Eye className='w-16 h-16 text-gray-300' />
                    </div>
                    <p className='text-gray-600 mb-4 text-lg'>
                      Select a size to preview
                    </p>
                  </div>
                </motion.div>
              )}
            </Suspense>

            {/* Bottom Toolbar - Overlay inside 3D view - Mobile Optimized */}
            {currentWidth && currentHeight && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='
  absolute
  bottom-4 md:bottom-8
  right-4 md:right-auto
  md:left-1/2
  md:-translate-x-1/2
  z-10
'
              >
                <div
                  className='
        bg-white/95 backdrop-blur-md
        rounded-xl md:rounded-2xl
        shadow-2xl
        px-2 py-1.5 md:px-6 md:py-4
        flex items-center gap-2 md:gap-3
        border border-gray-200
        w-fit
      '
                >
                  {/* Crop Button */}
                  {enableImageEditor && (
                    <button
                      onClick={() => setShowImageEditor(!showImageEditor)}
                      className={`
            flex items-center justify-center
            md:flex-col md:gap-1.5
            w-8 h-8 md:w-auto md:h-auto
            md:px-4 md:py-2
            rounded-md md:rounded-xl
            transition-colors hover:bg-gray-50
            group
            ${showImageEditor ? 'bg-[#f63a9e]/10' : ''}
          `}
                    >
                      <Crop
                        className={`
              w-4 h-4 md:w-6 md:h-6
              ${
                showImageEditor
                  ? 'text-[#f63a9e]'
                  : 'text-gray-700 group-hover:text-[#f63a9e]'
              }
            `}
                      />

                      <span
                        className={`
              hidden md:block text-xs font-medium
              ${showImageEditor ? 'text-[#f63a9e]' : 'text-gray-600'}
            `}
                      >
                        Crop
                      </span>
                    </button>
                  )}

                  {/* 3D Room Toggle */}
                  <button
                    onClick={() => {
                      const newMode = viewMode === 'canvas' ? 'room' : 'canvas';
                      setViewMode(newMode);
                      // Hide ruler when switching to canvas view
                      if (newMode === 'canvas') {
                        setShowRuler(false);
                      }
                    }}
                    className={`
          flex items-center justify-center
          md:flex-col md:gap-1.5
          w-8 h-8 md:w-auto md:h-auto
          md:px-4 md:py-2
          rounded-md md:rounded-xl
          transition-colors hover:bg-gray-50
          group
          ${viewMode === 'room' ? 'bg-[#f63a9e]/10' : ''}
        `}
                  >
                    <Box
                      className={`
            w-4 h-4 md:w-6 md:h-6
            ${
              viewMode === 'room'
                ? 'text-[#f63a9e]'
                : 'text-gray-700 group-hover:text-[#f63a9e]'
            }
          `}
                    />

                    <span
                      className={`
            hidden md:block text-xs font-medium
            ${viewMode === 'room' ? 'text-[#f63a9e]' : 'text-gray-600'}
          `}
                    >
                      {viewMode === 'room' ? 'Canvas' : '3D Room'}
                    </span>
                  </button>

                  {/* Ruler Toggle - Only in Room View */}
                  {viewMode === 'room' && (
                    <button
                      onClick={() => setShowRuler(!showRuler)}
                      className={`
          flex items-center justify-center
          md:flex-col md:gap-1.5
          w-8 h-8 md:w-auto md:h-auto
          md:px-4 md:py-2
          rounded-md md:rounded-xl
          transition-colors hover:bg-gray-50
          group
          ${showRuler ? 'bg-[#f63a9e]/10' : ''}
        `}
                    >
                      <Ruler
                        className={`
            w-4 h-4 md:w-6 md:h-6
            ${
              showRuler
                ? 'text-[#f63a9e]'
                : 'text-gray-700 group-hover:text-[#f63a9e]'
            }
          `}
                      />

                      <span
                        className={`
            hidden md:block text-xs font-medium
            ${showRuler ? 'text-[#f63a9e]' : 'text-gray-600'}
          `}
                      >
                        Ruler
                      </span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Image Editor Overlay - Only for single canvas with enableImageEditor */}
            <AnimatePresence>
              {showImageEditor &&
                enableImageEditor &&
                currentWidth &&
                currentHeight && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Canvas3DImageEditor
                      imageUrl={currentImageUrl}
                      canvasWidth={currentWidth}
                      canvasHeight={currentHeight}
                      onCropComplete={handleCropComplete}
                      onClose={() => setShowImageEditor(false)}
                    />
                  </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* RIGHT SIDE - Configuration Panel - Mobile Responsive */}
          <div className='w-full lg:w-[420px] h-auto lg:h-full overflow-y-auto bg-white py-6 px-4 md:py-8 md:px-8 space-y-6 md:space-y-8'>
            {/* Product Title & Price - Mobile Responsive */}
            <div>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2 text-xl md:text-2xl"
                style={{ fontWeight: '600' }}
              >
                {productName || product.name}{' '}
                {selectedSize
                  ? `${selectedSize.width_in} x ${selectedSize.height_in} cm`
                  : ''}
              </h2>
              <div className='flex items-baseline gap-2'>
                <span className='text-[#f63a9e] text-2xl md:text-3xl font-bold'>
                  £{selectedSizeId ? calculatePrice() : '10.99'}
                </span>
              </div>

              {/* Add to Basket Button - Mobile Responsive */}
              <Button
                className='w-full mt-4 md:mt-6 h-[48px] md:h-[56px] bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-base md:text-lg font-semibold'
                onClick={handleAddToCart}
                disabled={!selectedSizeId}
              >
                <ShoppingCart className='w-4 h-4 md:w-5 md:h-5 mr-2' />
                Add to basket
              </Button>

              {/* Quality Warning - Mobile Responsive */}
              <div className='mt-3 md:mt-4 flex items-start gap-2 p-2.5 md:p-3 bg-green-50 rounded-lg border border-green-200'>
                <AlertCircle className='w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5' />
                <p className='text-xs md:text-sm text-green-800'>
                  Your design is ready for printing at selected size
                </p>
              </div>
            </div>

            {/* Size Selection - Custom or Default */}
            {CustomSizeSelector ? (
              /* Render custom size selector from parent configurer */
              <div className='border-t border-gray-200 pt-4 md:pt-6'>
                <CustomSizeSelector
                  productId={productId}
                  selectedSizeId={selectedSizeId}
                  selectedAspectRatioId={selectedAspectRatioId}
                  onSizeSelect={handleCustomSizeSelect}
                  onImageEdit={enableImageEditor ? handleImageEdit : undefined}
                  imageUrl={currentImageUrl}
                />
              </div>
            ) : aspectRatios.length > 0 ? (
              /* Default size selection UI */
              <div className='border-t border-gray-200 pt-4 md:pt-6'>
                <h3 className='font-semibold text-gray-900 mb-3 md:mb-4 text-base md:text-lg'>
                  Choose your canvas size
                </h3>

                {/* Aspect Ratios - Only show if multiple ratios OR no specific ratio provided - Mobile Responsive */}
                {!aspectRatioId && aspectRatios.length > 1 && (
                  <div className='space-y-2 mb-3 md:mb-4'>
                    <Label className='text-xs md:text-sm font-medium text-gray-700'>
                      Format
                    </Label>
                    <div className='grid grid-cols-2 gap-2'>
                      {aspectRatios.map(ratio => (
                        <button
                          key={ratio.id}
                          className={`px-3 py-2 md:px-4 md:py-2 rounded-lg border-2 text-xs md:text-sm font-medium transition-all ${
                            selectedAspectRatioId === ratio.id
                              ? 'border-[#f63a9e] bg-pink-50 text-[#f63a9e]'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleAspectRatioChange(ratio.id)}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show current aspect ratio info if locked to one - Mobile Responsive */}
                {aspectRatioId && aspectRatios.length === 1 && (
                  <div className='mb-3 md:mb-4 p-2.5 md:p-3 bg-blue-50 rounded-lg border border-blue-200'>
                    <div className='flex items-center gap-2 text-xs md:text-sm text-blue-800'>
                      <AlertCircle className='w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0' />
                      <span>
                        Showing sizes for{' '}
                        <strong>{aspectRatios[0].label}</strong> format (matches
                        your collage)
                      </span>
                    </div>
                  </div>
                )}

                {/* Sizes - Mobile Responsive */}
                {selectedAspectRatioId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className='space-y-2'
                  >
                    <Label className='text-xs md:text-sm font-medium text-gray-700'>
                      Size
                    </Label>
                    <div className='grid grid-cols-1 gap-2 max-h-64 overflow-y-auto'>
                      {getAvailableSizes().map(size => {
                        const price = formatSizePrice(size, product);
                        const isSelected = selectedSizeId === size.id;
                        return (
                          <button
                            key={size.id}
                            className={`px-3 py-2.5 md:px-4 md:py-3 rounded-lg border-2 text-left transition-all ${
                              isSelected
                                ? 'border-[#f63a9e] bg-pink-50'
                                : 'border-gray-200 hover:border-[#f63a9e] hover:bg-pink-50'
                            }`}
                            onClick={() => {
                              setSelectedSizeId(size.id);
                              setCurrentWidth(size.width_in);
                              setCurrentHeight(size.height_in);
                            }}
                          >
                            <div className='flex items-center justify-between'>
                              <span
                                className={`font-medium text-sm md:text-base ${isSelected ? 'text-[#f63a9e]' : 'text-gray-900'}`}
                              >
                                {size.display_label}
                              </span>
                              <span className='text-[#f63a9e] font-semibold text-sm md:text-base'>
                                £{price}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
