import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Ruler,
  Upload,
  CheckCircle2,
  X,
  ArrowLeft,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { UploadModal } from './upload-modal';
import { RulerOverlay2D } from './ruler-overlay-2d';
import { CropModal } from './crop-modal';
import { MULTI_CANVAS_WALL_PRODUCT, getWallDimensionsPx } from './config';
import { type MultiCanvasWallState, type Room } from './types';
import { useCart } from '@/context/CartContext';

// Types for database
interface Size {
  id: string;
  aspect_ratio_id: string;
  width_in: number;
  height_in: number;
  display_label: string;
  area_in2: number;
  active: boolean;
}

export function MultiCanvasWallCustomizer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supabase = createClient();
  const { addToCart } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Get productId from URL if available
  const productId = searchParams.get('productId');

  // Size selection state
  const [sizes, setSizes] = useState<Size[]>([]);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(
    MULTI_CANVAS_WALL_PRODUCT.config.canvasWidth
  );
  const [canvasHeight, setCanvasHeight] = useState(
    MULTI_CANVAS_WALL_PRODUCT.config.canvasHeight
  );
  const [productPrice, setProductPrice] = useState<number>(0); // Price per square inch

  // State
  const [state, setState] = useState<MultiCanvasWallState>({
    canvases: Array.from({ length: 3 }, (_, i) => ({
      id: i,
      imageUrl: null,
      imageFile: null,
      uploaded: false,
    })),
    showRulers: true,
    selectedCanvasId: null,
    selectedRoom: 'living-room', // default room
    customSpacing: 12, // default 12 inches spacing
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCanvasForUpload, setSelectedCanvasForUpload] = useState<
    number | null
  >(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempImageForCrop, setTempImageForCrop] = useState<{
    canvasId: number;
    imageUrl: string;
  } | null>(null);

  // Room backgrounds from database
  const [rooms, setRooms] = useState<Room[]>([]);
  const [, setRoomsLoading] = useState(true);

  // Fetch product config, sizes, and room backgrounds
  useEffect(() => {
    const fetchProductConfig = async () => {
      try {
        const effectiveProductId = productId || MULTI_CANVAS_WALL_PRODUCT.id;

        // Check if it's a UUID or slug
        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            effectiveProductId
          );

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('config, price')
          .eq(isUUID ? 'id' : 'slug', effectiveProductId)
          .single();

        if (productError) {
          console.error('Error fetching product config:', productError);
          return;
        }

        // Set product price (price per square inch)
        if (productData?.price) {
          setProductPrice(productData.price);
        }

        console.log('Product data:', productData);
        console.log('Product config:', productData?.config);
        console.log('Allowed sizes:', productData?.config?.allowedSizes);

        // Fetch sizes
        // If product has allowedSizes in config, use those
        // Otherwise, fetch all active sizes as fallback
        let sizesQuery;

        if (
          productData?.config?.allowedSizes &&
          productData.config.allowedSizes.length > 0
        ) {
          console.log('Using allowedSizes from config');
          // Fetch specific sizes from config
          sizesQuery = supabase
            .from('sizes')
            .select('*')
            .in('id', productData.config.allowedSizes)
            .eq('active', true)
            .order('area_in2');
        } else {
          console.log('No allowedSizes in config, fetching all active sizes');
          // Fallback: fetch all active sizes
          sizesQuery = supabase
            .from('sizes')
            .select('*')
            .eq('active', true)
            .order('area_in2')
            .limit(20);
        }

        const { data: sizesData, error: sizesError } = await sizesQuery;

        console.log('Sizes query result:', sizesData);
        console.log('Sizes query error:', sizesError);

        if (sizesData && sizesData.length > 0) {
          setSizes(sizesData);

          // Auto-select first size
          const firstSize = sizesData[0];
          setSelectedSizeId(firstSize.id);
          setCanvasWidth(firstSize.width_in);
          setCanvasHeight(firstSize.height_in);
          console.log('Selected first size:', firstSize);
        } else {
          console.warn('No sizes available. SizesData:', sizesData);
        }
      } catch (error) {
        console.error('Error fetching product configuration:', error);
      }
    };

    if (productId !== undefined) {
      fetchProductConfig();
    }
  }, [productId]);

  // Fetch room backgrounds from product config
  useEffect(() => {
    const fetchRooms = async () => {
      setRoomsLoading(true);
      try {
        // If we have a productId from URL, fetch that product's room backgrounds
        if (productId) {
          // Check if it's a UUID or slug
          const isUUID =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              productId
            );

          const { data, error } = await supabase
            .from('products')
            .select('config')
            .eq(isUUID ? 'id' : 'slug', productId)
            .single();

          if (error) {
            // Fallback to hardcoded rooms
            setRooms(MULTI_CANVAS_WALL_PRODUCT.config.rooms || []);
          } else if (
            data?.config?.roomBackgrounds &&
            Array.isArray(data.config.roomBackgrounds)
          ) {
            // Filter active rooms and transform to Room interface
            const activeRooms: Room[] = data.config.roomBackgrounds
              .filter((room: any) => {
                return room.isActive !== false;
              })
              .map((room: any) => ({
                id: room.id,
                name: room.name,
                imageUrl: room.imageUrl,
              }));

            if (activeRooms.length > 0) {
              setRooms(activeRooms);

              // Set first room as default if current selection doesn't exist
              if (!activeRooms.find(r => r.id === state.selectedRoom)) {
                setState(prev => ({
                  ...prev,
                  selectedRoom: activeRooms[0].id,
                }));
              }
            } else {
              setRooms(MULTI_CANVAS_WALL_PRODUCT.config.rooms || []);
            }
          } else {
            setRooms(MULTI_CANVAS_WALL_PRODUCT.config.rooms || []);
          }
        } else {
          // No productId in URL, use hardcoded fallback
          setRooms(MULTI_CANVAS_WALL_PRODUCT.config.rooms || []);
        }
      } catch (err) {
        console.error('❌ Unexpected error fetching rooms:', err);
        setRooms(MULTI_CANVAS_WALL_PRODUCT.config.rooms || []);
      } finally {
        setRoomsLoading(false);
      }
    };

    // Only fetch if productId state is initialized (null or has value)
    if (productId !== undefined) {
      fetchRooms();
    }
  }, [productId]);

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate scale to fit wall in container
  const scale = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 1;

    const isMobile = window.innerWidth < 640; // sm breakpoint
    const layoutScale = MULTI_CANVAS_WALL_PRODUCT.config.layout.scale; // 40 px/inch

    if (isMobile) {
      // On mobile: scale so the 3 canvases (not the full wall) fill the available width
      // Total canvas content width in px = (3 × canvasWidth + 2 × spacing) × layoutScale
      const totalContentWidthPx = (canvasWidth * 3 + state.customSpacing * 2) * layoutScale;
      const contentHeightPx = canvasHeight * layoutScale;

      const rulerPaddingH = 80;  // left + right ruler space
      const rulerPaddingV = 90;  // top + bottom ruler space
      const extraH = 16;         // small breathing room on sides
      const extraV = 16;

      const scaleX = (containerSize.width - rulerPaddingH - extraH) / totalContentWidthPx;
      const scaleY = (containerSize.height - rulerPaddingV - extraV) / contentHeightPx;

      return Math.min(scaleX, scaleY);
    }

    // Desktop: fit entire wall
    const wallDims = getWallDimensionsPx();
    const rulerPadding = 120;
    const rulerPaddingVertical = 140;
    const extraPadding = 100;

    const scaleX = (containerSize.width - rulerPadding - extraPadding) / wallDims.width;
    const scaleY = (containerSize.height - rulerPaddingVertical - extraPadding) / wallDims.height;

    return Math.min(scaleX, scaleY, 1); // Never scale up, only down
  }, [containerSize, canvasWidth, canvasHeight, state.customSpacing]);

  // Handle canvas click
  const handleCanvasClick = (canvasId: number) => {
    setSelectedCanvasForUpload(canvasId);
    setIsUploadModalOpen(true);
  };

  // Handle image upload - show crop modal first
  const handleUpload = (canvasId: number, _file: File, imageUrl: string) => {
    setTempImageForCrop({ canvasId, imageUrl });
    setIsUploadModalOpen(false);
    setIsCropModalOpen(true);
  };

  // Handle crop complete
  const handleCropComplete = (canvasId: number, croppedImageUrl: string) => {
    setState(prev => ({
      ...prev,
      canvases: prev.canvases.map(canvas =>
        canvas.id === canvasId
          ? {
              ...canvas,
              imageUrl: croppedImageUrl,
              imageFile: null,
              uploaded: true,
            }
          : canvas
      ),
    }));
    setIsCropModalOpen(false);
    setTempImageForCrop(null);
  };

  // Toggle rulers
  const toggleRulers = () => {
    setState(prev => ({ ...prev, showRulers: !prev.showRulers }));
  };

  // Change room
  const handleRoomChange = (roomId: string) => {
    setState(prev => ({ ...prev, selectedRoom: roomId }));
  };

  // Check if all canvases have images
  const allUploaded = state.canvases.every(c => c.uploaded);
  const uploadCount = state.canvases.filter(c => c.uploaded).length;

  // Calculate current total price
  const currentTotalPrice = selectedSizeId
    ? (
        (sizes.find(s => s.id === selectedSizeId)?.area_in2 || 0) *
        productPrice *
        3
      ).toFixed(2)
    : '0.00';

  // Handle add to cart
  const handleAddToCart = () => {
    if (!allUploaded) {
      toast.error('Please upload images for all 3 canvases');
      return;
    }

    if (!selectedSizeId) {
      toast.error('Please select a canvas size');
      return;
    }

    const selectedSize = sizes.find(s => s.id === selectedSizeId);
    if (!selectedSize) return;

    // Calculate total price
    const totalPrice = (selectedSize.area_in2 * productPrice * 3).toFixed(2);

    // Create cart item
    const cartItem = {
      id: `multi-canvas-wall-${Date.now()}`,
      name: `Multi-Canvas Wall - ${selectedSize.display_label}`,
      price: parseFloat(totalPrice),
      image: state.canvases[0].imageUrl || '/placeholder.jpg',
      size: `3 × ${selectedSize.width_in}" × ${selectedSize.height_in}" canvases with ${state.customSpacing}" spacing`,
      quantity: 1,
      customization: {
        canvases: state.canvases.map(c => c.imageUrl),
        spacing: state.customSpacing,
        room: state.selectedRoom,
      },
    };

    addToCart(cartItem);
    toast.success('Added to cart! 3 canvases ready for checkout.');
    navigate('/cart');
  };

  // Handle remove image
  const handleRemoveImage = (canvasId: number) => {
    setState(prev => ({
      ...prev,
      canvases: prev.canvases.map(canvas =>
        canvas.id === canvasId
          ? { ...canvas, imageUrl: null, imageFile: null, uploaded: false }
          : canvas
      ),
    }));
    toast.success(`Canvas ${canvasId + 1} cleared`);
  };

  // Get dimensions (using selected size dimensions)
  const wallDims = getWallDimensionsPx();
  const canvasDims = {
    width: canvasWidth * MULTI_CANVAS_WALL_PRODUCT.config.layout.scale,
    height: canvasHeight * MULTI_CANVAS_WALL_PRODUCT.config.layout.scale,
  };

  // Calculate dynamic canvas positions based on custom spacing and selected size
  const canvasPositions = useMemo(() => {
    const { scale } = MULTI_CANVAS_WALL_PRODUCT.config.layout;
    const baseY = 20; // vertical position (inches) — used only on desktop
    const startX =
      (MULTI_CANVAS_WALL_PRODUCT.config.wall.width -
        (canvasWidth * 3 + state.customSpacing * 2)) /
      2;

    return [
      { x: startX * scale, y: baseY * scale },
      {
        x: (startX + canvasWidth + state.customSpacing) * scale,
        y: baseY * scale,
      },
      {
        x: (startX + (canvasWidth + state.customSpacing) * 2) * scale,
        y: baseY * scale,
      },
    ];
  }, [state.customSpacing, canvasWidth]);

  // On mobile, display only the canvas content area (not the full wall).
  // Compute width/height of the display frame and the x/y offset to shift canvases to start at 0.
  const displayArea = useMemo(() => {
    const isMobile = window.innerWidth < 640;
    const layoutScale = MULTI_CANVAS_WALL_PRODUCT.config.layout.scale;

    if (isMobile) {
      const contentWidthPx = (canvasWidth * 3 + state.customSpacing * 2) * layoutScale;
      const contentHeightPx = canvasHeight * layoutScale;
      // canvasPositions[0].x is the left edge of the first canvas in wall-px
      const originX = canvasPositions[0]?.x ?? 0;
      const originY = canvasPositions[0]?.y ?? 0;
      return {
        width: contentWidthPx,
        height: contentHeightPx,
        offsetX: -originX, // shift so first canvas starts at x=0
        offsetY: -originY, // shift so canvases start at y=0
      };
    }

    return {
      width: wallDims.width,
      height: wallDims.height,
      offsetX: 0,
      offsetY: 0,
    };
  }, [canvasPositions, canvasWidth, canvasHeight, state.customSpacing, wallDims]);

  // Responsive padding for ruler space
  const rulerPadding = useMemo(() => {
    const isMobile = window.innerWidth < 640;
    return {
      horizontal: isMobile ? 40 : 60, // Left/right padding
      top: isMobile ? 40 : 60,        // Top padding
      bottom: isMobile ? 50 : 80,     // Bottom padding (needs more space for bottom ruler)
      total: {
        width: isMobile ? 80 : 120,
        height: isMobile ? 90 : 140,
      }
    };
  }, [containerSize]); // Re-calculate on resize

  // Get current room (from database or fallback to hardcoded)
  const currentRoom = rooms.find(r => r.id === state.selectedRoom) || rooms[0];

  return (
    <div className='min-h-screen md:h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 flex flex-col md:flex-row overflow-hidden'>
      {/* Main Content Area */}
      <div className='flex-1 flex items-stretch'>
        <div
          ref={containerRef}
          className='relative w-full h-[62vh] sm:h-[68vh] md:h-full overflow-visible'
        >
          {/* Room Background */}
          <div
            className='absolute inset-0 overflow-hidden'
            style={{
              backgroundColor: MULTI_CANVAS_WALL_PRODUCT.config.wall.color,
              backgroundImage: currentRoom
                ? `url(${currentRoom.imageUrl})`
                : `url(${MULTI_CANVAS_WALL_PRODUCT.config.wall.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Top Left - Back Button */}
            <div className='absolute top-2 left-2 sm:top-4 sm:left-4 md:top-6 md:left-6 z-20'>
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => navigate(-1)}
                className='flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 bg-white/95 backdrop-blur-md hover:bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border-2 border-gray-200 hover:border-gray-300 transition-all group'
              >
                <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-[#f63a9e] transition-colors' />
                <span className='text-xs sm:text-sm md:text-base font-semibold text-gray-700 group-hover:text-[#f63a9e] transition-colors'>
                  Back
                </span>
              </motion.button>
            </div>

            {/* Top Right - Ruler Toggle */}
            <div className='absolute top-2 right-2 sm:top-4 sm:right-4 md:top-6 md:right-6 z-20'>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={toggleRulers}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border-2 transition-all ${
                  state.showRulers
                    ? 'bg-[#f63a9e] border-[#f63a9e] text-white hover:bg-[#e02d8d] hover:border-[#e02d8d]'
                    : 'bg-white/95 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300'
                }`}
              >
                <Ruler
                  className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${state.showRulers ? 'text-white' : 'text-gray-700'}`}
                />
                <span className='hidden sm:inline text-xs sm:text-sm md:text-base font-semibold'>
                  {state.showRulers ? 'Hide Rulers' : 'Show Rulers'}
                </span>
              </motion.button>
            </div>

            {/* Canvas Container */}
            <div className='absolute inset-0 flex items-center justify-center'>
              {/* Canvas Placeholders - with padding for rulers */}
              <div
                className='relative'
                style={{
                  width: displayArea.width * scale + rulerPadding.total.width,
                  height: displayArea.height * scale + rulerPadding.total.height,
                  paddingTop: rulerPadding.top,
                  paddingRight: rulerPadding.horizontal,
                  paddingBottom: rulerPadding.bottom,
                  paddingLeft: rulerPadding.horizontal,
                }}
              >
                {state.canvases.map((canvas, index) => {
                  const position = canvasPositions[index];
                  const uploaded = canvas.uploaded;

                  return (
                    <motion.div
                      key={canvas.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className='absolute group'
                      style={{
                        left: (position.x + displayArea.offsetX) * scale + rulerPadding.horizontal,
                        top: (position.y + displayArea.offsetY) * scale + rulerPadding.top,
                        width: canvasDims.width * scale,
                        height: canvasDims.height * scale,
                      }}
                    >
                      {/* Canvas Shadow Layer */}
                      <div
                        className='absolute inset-0 bg-black/40 blur-xl'
                        style={{
                          transform: 'translateY(8px)',
                          zIndex: -1,
                        }}
                      />

                      {/* Canvas Image */}
                      <div
                        onClick={() =>
                          !uploaded && handleCanvasClick(canvas.id)
                        }
                        className={`w-full h-full overflow-hidden transition-all duration-300 ${
                          uploaded
                            ? 'shadow-2xl'
                            : 'ring-2 ring-white/50 cursor-pointer hover:ring-white/80'
                        }`}
                        style={{
                          backgroundColor: uploaded
                            ? 'transparent'
                            : 'rgba(255, 255, 255, 0.1)',
                          boxShadow: uploaded
                            ? '0 20px 40px rgba(0, 0, 0, 0.5), 0 8px 16px rgba(0, 0, 0, 0.3)'
                            : undefined,
                        }}
                      >
                        {uploaded && canvas.imageUrl ? (
                          // Uploaded Image
                          <img
                            src={canvas.imageUrl}
                            alt={`Canvas ${canvas.id + 1}`}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          // Empty Placeholder with Primary Color
                          <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f63a9e] to-[#e02d8d] backdrop-blur-sm'>
                            <div className='text-white text-center px-1 sm:px-2'>
                              <Upload
                                className='w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 lg:w-16 lg:h-16 mx-auto mb-0.5 sm:mb-1 md:mb-2 lg:mb-3'
                                strokeWidth={2}
                              />
                              <p className='text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-semibold leading-tight'>
                                Upload Image
                              </p>
                              <p className='text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs mt-0 sm:mt-0.5 md:mt-1 opacity-80 leading-tight'>
                                Canvas {canvas.id + 1}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons - Show on hover/touch when uploaded */}
                      {uploaded && canvas.imageUrl && (
                        <div className='absolute top-1 right-1 sm:top-2 sm:right-2 md:top-3 md:right-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex gap-1 sm:gap-2 z-10'>
                          <button
                            onClick={() => handleCanvasClick(canvas.id)}
                            className='w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110'
                            title='Replace image'
                          >
                            <Upload className='w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700' />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleRemoveImage(canvas.id);
                            }}
                            className='w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-red-500/90 backdrop-blur-sm hover:bg-red-600 shadow-lg flex items-center justify-center transition-all hover:scale-110'
                            title='Remove image'
                          >
                            <X className='w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white' />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Ruler Overlay */}
                <RulerOverlay2D
                  showRulers={state.showRulers}
                  containerWidth={displayArea.width * scale}
                  containerHeight={displayArea.height * scale}
                  canvasPositions={canvasPositions.map(p => ({
                    x: p.x + displayArea.offsetX,
                    y: p.y + displayArea.offsetY,
                  }))}
                  canvasDims={canvasDims}
                  customSpacing={state.customSpacing}
                  scale={scale}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  offsetX={rulerPadding.horizontal}
                  offsetY={rulerPadding.top}
                />
              </div>
            </div>
          </div>

          {/* Room Selector - Floating at Bottom (Outside zoom area) */}
          <div className='absolute bottom-2 sm:bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] md:w-auto max-w-full'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className='bg-white/95 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl px-2 py-2 sm:px-3 sm:py-3 md:px-6 md:py-4 border-2 border-gray-200'
            >
              <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3 overflow-x-auto scrollbar-hide'>
                {rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => handleRoomChange(room.id)}
                    className={`relative w-20 h-14 sm:w-24 sm:h-16 md:w-32 md:h-20 rounded-md sm:rounded-lg md:rounded-xl overflow-hidden transition-all flex-shrink-0 ${
                      state.selectedRoom === room.id
                        ? 'ring-2 sm:ring-3 md:ring-4 ring-[#f63a9e] shadow-lg scale-105'
                        : 'ring-1 sm:ring-2 ring-gray-300 hover:ring-gray-400 hover:scale-102'
                    }`}
                  >
                    <img
                      src={room.imageUrl}
                      alt={room.name}
                      className='w-full h-full object-cover'
                    />
                    {state.selectedRoom === room.id && (
                      <div className='absolute inset-0 bg-[#f63a9e]/20 flex items-center justify-center'>
                        <div className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-[#f63a9e] flex items-center justify-center shadow-lg'>
                          <CheckCircle2 className='w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white' />
                        </div>
                      </div>
                    )}
                    <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-2 sm:pt-3 md:pt-4 pb-0.5 sm:pb-1 md:pb-1.5 px-0.5 sm:px-1'>
                      <p className='text-white text-[8px] sm:text-[9px] md:text-xs font-semibold text-center truncate leading-tight'>
                        {room.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Responsive */}
      <div className='w-full md:w-[420px] lg:w-[460px] bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col shadow-xl md:max-h-none md:h-screen'>
        {/* Debug Info - Only in development */}
        {process.env.NODE_ENV === 'development' && !productId && (
          <div className='bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 max-w-sm m-3'>
            <p className='text-xs font-semibold text-yellow-800 mb-1'>
              ⚠️ Development Notice
            </p>
            <p className='text-xs text-yellow-700'>
              No productId in URL. Using default rooms. Access via product page
              for custom rooms.
            </p>
          </div>
        )}

        {/* Sidebar Header */}
        <div className='px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 lg:py-8 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white'>
          <h2
            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-1 text-base sm:text-lg md:text-xl lg:text-2xl"
            style={{ fontWeight: '700', lineHeight: '1.2' }}
          >
            Gallery Wall
          </h2>
          <p className='text-xs sm:text-sm md:text-base text-gray-600'>
            Configure your 3-canvas layout
          </p>
        </div>

        {/* Sidebar Content */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8'>
          {/* Size Selection */}
          <div>
            <h3 className='font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base'>
              Select Canvas Size
            </h3>

            {/* Size List */}
            <div className='space-y-2 sm:space-y-2.5'>
              {sizes.map(size => {
                // Calculate price for 3 canvases (3 × area × price per sq inch)
                const totalPrice = (size.area_in2 * productPrice * 3).toFixed(
                  2
                );

                return (
                  <button
                    key={size.id}
                    onClick={() => {
                      setSelectedSizeId(size.id);
                      setCanvasWidth(size.width_in);
                      setCanvasHeight(size.height_in);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 sm:p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all ${
                      selectedSizeId === size.id
                        ? 'border-[#f63a9e] bg-pink-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className='flex-1 text-left'>
                      <div className='text-xs sm:text-sm md:text-base font-bold text-gray-900'>
                        {size.display_label}
                      </div>
                      <div className='text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5'>
                        {size.width_in}&quot; × {size.height_in}&quot; each
                      </div>
                    </div>
                    <div className='text-right ml-2 sm:ml-3'>
                      <div className='text-sm sm:text-base md:text-lg font-bold text-[#f63a9e]'>
                        ${totalPrice}
                      </div>
                      <div className='text-[9px] sm:text-[10px] md:text-xs text-gray-500'>
                        3 canvases
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Support Text */}
            {selectedSizeId && (
              <div className='mt-2 sm:mt-3 p-2 sm:p-2.5 md:p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                <p className='text-[10px] sm:text-xs md:text-sm text-blue-700 flex items-start gap-1.5 sm:gap-2'>
                  <span className='text-blue-500 flex-shrink-0 mt-0.5'>ℹ️</span>
                  <span>
                    All 3 canvases will be{' '}
                    <strong>
                      {canvasWidth}&quot; × {canvasHeight}&quot;
                    </strong>{' '}
                    each. Total wall space needed:{' '}
                    <strong>
                      {canvasWidth * 3 + state.customSpacing * 2}&quot; wide
                    </strong>{' '}
                    (including spacing) and{' '}
                    <strong>{canvasHeight}&quot; height</strong>.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Spacing Slider */}
          <div>
            <h3 className='font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base'>
              Canvas Spacing
            </h3>
            <div className='space-y-2 sm:space-y-3 md:space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-[10px] sm:text-xs md:text-sm text-gray-600'>
                  Horizontal Gap
                </span>
                <span className='text-[10px] sm:text-xs md:text-sm font-semibold text-[#f63a9e]'>
                  {state.customSpacing}&quot;
                </span>
              </div>
              <input
                type='range'
                min='1'
                max='30'
                step='1'
                value={state.customSpacing}
                onChange={e =>
                  setState(prev => ({
                    ...prev,
                    customSpacing: parseInt(e.target.value),
                  }))
                }
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#f63a9e]'
                style={{
                  background: `linear-gradient(to right, #f63a9e 0%, #f63a9e ${((state.customSpacing - 1) / 29) * 100}%, #e5e7eb ${((state.customSpacing - 1) / 29) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className='flex justify-between text-[10px] md:text-xs text-gray-500'>
                <span>1&quot;</span>
                <span>15&quot;</span>
                <span>30&quot;</span>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className='pt-3 sm:pt-4 border-t border-gray-200'>
            <Button
              onClick={handleAddToCart}
              disabled={!allUploaded || !selectedSizeId}
              className={`w-full h-11 sm:h-12 md:h-[52px] lg:h-[56px] rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-semibold shadow-lg transition-all ${
                !allUploaded || !selectedSizeId
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
              }`}
            >
              <ShoppingCart className='w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2' />
              {!allUploaded
                ? `Add Images (${uploadCount}/3)`
                : selectedSizeId
                  ? `Add to Cart - $${currentTotalPrice}`
                  : 'Select Size'}
            </Button>

            {/* Upload Progress Info */}
            {!allUploaded && (
              <div className='mt-2 sm:mt-3 p-2 sm:p-2.5 md:p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                <p className='text-[10px] sm:text-xs md:text-sm text-amber-700 flex items-start gap-1.5 sm:gap-2'>
                  <span className='text-amber-500 flex-shrink-0 mt-0.5'>
                    ⚠️
                  </span>
                  <span>
                    Please upload images for all 3 canvases before adding to
                    cart.
                    <strong> {uploadCount}/3 uploaded</strong>.
                  </span>
                </p>
              </div>
            )}

            {/* Ready Status */}
            {allUploaded && selectedSizeId && (
              <div className='mt-2 sm:mt-3 p-2 sm:p-2.5 md:p-3 bg-green-50 border border-green-200 rounded-lg'>
                <p className='text-[10px] sm:text-xs md:text-sm text-green-700 flex items-start gap-1.5 sm:gap-2'>
                  <span className='text-green-500 flex-shrink-0 mt-0.5'>✓</span>
                  <span>Your gallery wall is ready! Click to add to cart.</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        canvasId={selectedCanvasForUpload ?? 0}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedCanvasForUpload(null);
        }}
        onUpload={handleUpload}
      />

      {/* Crop Modal */}
      {tempImageForCrop && (
        <CropModal
          isOpen={isCropModalOpen}
          imageUrl={tempImageForCrop.imageUrl}
          canvasId={tempImageForCrop.canvasId}
          aspectRatio={canvasWidth / canvasHeight}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setIsCropModalOpen(false);
            setTempImageForCrop(null);
          }}
        />
      )}
    </div>
  );
}
