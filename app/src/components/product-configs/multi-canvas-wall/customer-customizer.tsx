import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Ruler,
  Upload,
  ImagePlus,
  CheckCircle2,
  X,
  ArrowLeft,
  ShoppingCart,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { RulerOverlay2D } from './ruler-overlay-2d';
import { CropModal } from './crop-modal';
import {
  MULTI_CANVAS_WALL_PRODUCT,
  MULTI_CANVAS_WALL_SUPPORTED_RATIOS,
} from './config';
import { type MultiCanvasWallState } from './types';

// Single neutral wall colour for the preview. The picker UI was removed in
// favour of a clean, distraction-free editor backdrop.
const DEFAULT_WALL_COLOR = '#f4efe7';
import { useCart } from '@/context/CartContext';
import { resolveCanvasSizePrice } from '@/lib/canvas-size-price';
import type { InchData } from '@/utils/ratio-sizes';
import type { Product as LibProduct } from '@/lib/data/types';

// Set of `width:height` ratio keys this configurer is designed to handle.
// Used to filter ratios fetched from the DB so the customer never sees a
// ratio the layout wasn't designed for, even when an admin's per-product
// `allowedRatios` is empty/missing.
const SUPPORTED_RATIO_KEY_SET = new Set<string>(
  MULTI_CANVAS_WALL_SUPPORTED_RATIOS as readonly string[]
);

const ratioKey = (r: { width_ratio: number; height_ratio: number }): string =>
  `${r.width_ratio}:${r.height_ratio}`;

// ─── Session persistence ─────────────────────────────────────────────────────
const MULTI_CANVAS_SESSION_KEY = 'photify_multi_canvas_state';

function loadPersistedMultiCanvasState() {
  try {
    const saved = sessionStorage.getItem(MULTI_CANVAS_SESSION_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    //
  }
  return null;
}

function clearPersistedMultiCanvasState() {
  try {
    sessionStorage.removeItem(MULTI_CANVAS_SESSION_KEY);
  } catch {
    //
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// Types for database
interface AspectRatio {
  id: string;
  label: string;
  width_ratio: number;
  height_ratio: number;
  orientation: string;
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

export function MultiCanvasWallCustomizer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supabase = createClient();
  const { addToCart } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Get productId and artImageUrl from URL if available
  const productId = searchParams.get('productId');
  const artImageUrl = searchParams.get('artImageUrl')
    ? decodeURIComponent(searchParams.get('artImageUrl')!)
    : null;

  // Size selection state
  const [aspectRatios, setAspectRatios] = useState<AspectRatio[]>([]);
  const [selectedAspectRatioId, setSelectedAspectRatioId] = useState<string | null>(() => {
    if (artImageUrl) return null;
    return loadPersistedMultiCanvasState()?.selectedAspectRatioId ?? null;
  });
  const [sizes, setSizes] = useState<Size[]>([]);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(() => {
    if (artImageUrl) return null; // fresh art flow — don't restore
    return loadPersistedMultiCanvasState()?.selectedSizeId ?? null;
  });
  const [canvasWidth, setCanvasWidth] = useState(() => {
    if (artImageUrl) return MULTI_CANVAS_WALL_PRODUCT.config.canvasWidth;
    return loadPersistedMultiCanvasState()?.canvasWidth ?? MULTI_CANVAS_WALL_PRODUCT.config.canvasWidth;
  });
  const [canvasHeight, setCanvasHeight] = useState(() => {
    if (artImageUrl) return MULTI_CANVAS_WALL_PRODUCT.config.canvasHeight;
    return loadPersistedMultiCanvasState()?.canvasHeight ?? MULTI_CANVAS_WALL_PRODUCT.config.canvasHeight;
  });
  /**
   * Snapshot of the product row used by `resolveCanvasSizePrice`. Holds the
   * admin-configured `config.sizePrices` map plus the base `price` so the
   * size buttons can show the same price the admin set.
   */
  const [productForPricing, setProductForPricing] = useState<LibProduct | null>(
    null
  );

  // State — if artImageUrl provided, pre-fill all 3 canvases
  const [state, setState] = useState<MultiCanvasWallState>(() => {
    if (!artImageUrl) {
      const saved = loadPersistedMultiCanvasState();
      if (saved?.canvases) {
        return {
          canvases: (saved.canvases as any[]).map((c: any) => ({
            ...c,
            imageFile: null,
          })),
          showRulers: false,
          selectedCanvasId: null,
          selectedRoom: 'default',
          // Default to a tight gallery-wall spacing. The slider is gone, so
          // a smaller value keeps the 3-canvas row narrower in the preview
          // and lets the canvases scale up to fill the wall area. Old saved
          // sessions may still carry the previous 12" value — cap it so a
          // stale value doesn't shrink the canvases.
          customSpacing: Math.min(saved.customSpacing ?? 4, 6),
        };
      }
    }
    return {
      canvases: Array.from({ length: 3 }, (_, i) => ({
        id: i,
        imageUrl: artImageUrl ?? null,
        imageFile: null,
        uploaded: artImageUrl ? true : false,
      })),
      showRulers: false,
      selectedCanvasId: null,
      selectedRoom: 'default',
      customSpacing: 4,
    };
  });

  // Hidden file input shared by all 3 canvas slots — clicking a canvas opens
  // the OS file picker directly, then the chosen image jumps straight into
  // the crop modal. Keeps the flow to: tap → pick file → crop → done.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingCanvasIdRef = useRef<number | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempImageForCrop, setTempImageForCrop] = useState<{
    canvasId: number;
    imageUrl: string;
  } | null>(null);
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Sync canvas dims when sizes load and a saved selectedSizeId is restored
  useEffect(() => {
    if (!selectedSizeId || sizes.length === 0) return;
    const match = sizes.find(s => s.id === selectedSizeId);
    if (match) {
      setCanvasWidth(match.width_in);
      setCanvasHeight(match.height_in);
    }
  }, [sizes, selectedSizeId]);

  // Persist key state to sessionStorage
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return; }
    if (artImageUrl) return; // don't persist art-flow sessions
    try {
      sessionStorage.setItem(
        MULTI_CANVAS_SESSION_KEY,
        JSON.stringify({
          canvases: state.canvases.map(c => ({
            id: c.id,
            imageUrl: c.imageUrl,
            uploaded: c.uploaded,
          })),
          selectedRoom: state.selectedRoom,
          customSpacing: state.customSpacing,
          selectedAspectRatioId,
          selectedSizeId,
          canvasWidth,
          canvasHeight,
        })
      );
    } catch {
      //
    }
  }, [state.canvases, state.selectedRoom, state.customSpacing, selectedAspectRatioId, selectedSizeId, canvasWidth, canvasHeight]);

  // Fetch product config and sizes
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

        // Snapshot the full product row so `resolveCanvasSizePrice` can read
        // both `price` (per-sq-inch fallback) and `config.sizePrices` (admin's
        // per-size overrides).
        setProductForPricing(productData as unknown as LibProduct);

        // Fetch aspect ratios first so we can constrain sizes by the
        // configurer's supported ratios (1:1, 1:2, 2:3) even when the admin
        // hasn't set `allowedRatios` on the product yet.
        let ratios: AspectRatio[] = [];
        if (
          productData?.config?.allowedRatios &&
          productData.config.allowedRatios.length > 0
        ) {
          const { data: ratiosData } = await supabase
            .from('aspect_ratios')
            .select('*')
            .in('id', productData.config.allowedRatios)
            .eq('active', true)
            .order('label');
          ratios = ratiosData || [];
        } else {
          // No admin-curated list — fall back to every supported ratio that
          // exists in the DB. This guarantees the sidebar isn't empty for
          // freshly-seeded products that haven't been configured yet.
          const { data: ratiosData } = await supabase
            .from('aspect_ratios')
            .select('*')
            .eq('active', true)
            .order('label');
          ratios = (ratiosData || []).filter(r =>
            SUPPORTED_RATIO_KEY_SET.has(ratioKey(r))
          );
        }

        // Always enforce the configurer's supported set, regardless of what
        // the admin saved. Prevents stale `allowedRatios` (e.g. landscape
        // ratios saved before this filter existed) from reaching the customer.
        ratios = ratios.filter(r => SUPPORTED_RATIO_KEY_SET.has(ratioKey(r)));

        // If the admin's curated list doesn't intersect with the supported
        // set (legacy/misconfigured product), fall back to every supported
        // ratio in the DB so the customer never sees an empty sidebar.
        if (ratios.length === 0) {
          const { data: fallbackRatios } = await supabase
            .from('aspect_ratios')
            .select('*')
            .eq('active', true)
            .order('label');
          ratios = (fallbackRatios || []).filter(r =>
            SUPPORTED_RATIO_KEY_SET.has(ratioKey(r))
          );
        }

        const ratioIdSet = new Set(ratios.map(r => r.id));

        // Fetch sizes — admin curated when available, otherwise every active
        // size that belongs to a supported ratio.
        let allSizes: Size[] = [];
        if (
          productData?.config?.allowedSizes &&
          productData.config.allowedSizes.length > 0
        ) {
          const { data: sizesData } = await supabase
            .from('sizes')
            .select('*')
            .in('id', productData.config.allowedSizes)
            .eq('active', true)
            .order('area_in2');
          allSizes = sizesData || [];
        } else if (ratios.length > 0) {
          const { data: sizesData } = await supabase
            .from('sizes')
            .select('*')
            .in('aspect_ratio_id', ratios.map(r => r.id))
            .eq('active', true)
            .order('area_in2');
          allSizes = sizesData || [];
        }

        // Drop any sizes whose ratio isn't in the supported set (defensive
        // mirror of the ratio filter above for the admin-curated path).
        allSizes = allSizes.filter(s => ratioIdSet.has(s.aspect_ratio_id));

        // If admin's `allowedSizes` was all unsupported (legacy data), backfill
        // with every active size on the supported ratios so the customer can
        // still proceed to checkout.
        if (allSizes.length === 0 && ratios.length > 0) {
          const { data: fallbackSizes } = await supabase
            .from('sizes')
            .select('*')
            .in('aspect_ratio_id', ratios.map(r => r.id))
            .eq('active', true)
            .order('area_in2');
          allSizes = fallbackSizes || [];
        }

        setSizes(allSizes);
        setAspectRatios(ratios);

        // Pick the first ratio and first size
        const firstRatio = ratios[0] ?? null;
        const firstRatioId = firstRatio?.id ?? null;

        setSelectedAspectRatioId((prev: string | null) => {
          if (prev && ratios.some(r => r.id === prev)) return prev;
          return firstRatioId;
        });

        // Auto-select first size of the chosen ratio
        const initialRatioId = (loadPersistedMultiCanvasState()?.selectedAspectRatioId &&
          ratios.some(r => r.id === loadPersistedMultiCanvasState()?.selectedAspectRatioId))
          ? loadPersistedMultiCanvasState()!.selectedAspectRatioId
          : firstRatioId;

        const sizesForInitialRatio = allSizes.filter(s => s.aspect_ratio_id === initialRatioId);
        const firstSizeForRatio = sizesForInitialRatio[0] ?? allSizes[0];

        if (firstSizeForRatio) {
          setSelectedSizeId((prev: string | null) => {
            if (prev && allSizes.some(s => s.id === prev)) return prev;
            return firstSizeForRatio.id;
          });
          setCanvasWidth((prev: number) => {
            if (prev !== MULTI_CANVAS_WALL_PRODUCT.config.canvasWidth) return prev;
            return firstSizeForRatio.width_in;
          });
          setCanvasHeight((prev: number) => {
            if (prev !== MULTI_CANVAS_WALL_PRODUCT.config.canvasHeight) return prev;
            return firstSizeForRatio.height_in;
          });
        }
      } catch (error) {
        console.error('Error fetching product configuration:', error);
      }
    };

    if (productId !== undefined) {
      fetchProductConfig();
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

  // Reference scale — derived from the *largest* size in the current aspect
  // ratio (not the currently-selected one). This stays constant as the
  // customer flips between sizes, so a smaller selection literally renders
  // smaller on the wall. Net effect: the customer gets a real visual sense
  // of how a 12×18 set compares to a 24×36 set, instead of the layout
  // re-fitting and making every option look identical.
  //
  // The reserved space for rulers collapses when rulers are hidden, so the
  // largest size still gets to use almost the full wall area.
  const scale = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 1;

    const isMobile = window.innerWidth < 640; // sm breakpoint
    const layoutScale = MULTI_CANVAS_WALL_PRODUCT.config.layout.scale; // 40 px/inch

    // Anchor the room "zoom level" to the largest canvas across ALL
    // aspect ratios — not just the currently selected one. Otherwise
    // switching from 2:3 to 1:2 (or 1:1) would change the zoom, and the
    // reference objects (books, vase) plus the room itself would visibly
    // shrink/grow even though nothing about the physical room changed.
    // Keeping a constant reference lets the customer directly compare how
    // each aspect ratio reads at the same in-room scale.
    const referenceWidth = sizes.reduce(
      (max, s) => Math.max(max, s.width_in),
      canvasWidth
    );
    const referenceHeight = sizes.reduce(
      (max, s) => Math.max(max, s.height_in),
      canvasHeight
    );

    const totalContentWidthPx =
      (referenceWidth * 3 + state.customSpacing * 2) * layoutScale;
    const contentHeightPx = referenceHeight * layoutScale;

    // Always reserve the ruler-sized padding budget so the canvases stay
    // the same on-screen size whether rulers are visible or hidden. This
    // matters for relative-size perception — toggling the rulers should not
    // make the customer think they've picked a different size.
    const rulerPaddingH = isMobile ? 80 : 140;
    const rulerPaddingV = isMobile ? 90 : 160;
    const extraH = isMobile ? 4 : 8;
    const extraV = isMobile ? 4 : 8;

    const scaleX = (containerSize.width - rulerPaddingH - extraH) / totalContentWidthPx;
    const scaleY = (containerSize.height - rulerPaddingV - extraV) / contentHeightPx;

    return Math.max(0.1, Math.min(scaleX, scaleY));
  }, [
    containerSize,
    sizes,
    canvasWidth,
    canvasHeight,
    state.customSpacing,
  ]);

  // Tapping a canvas opens the OS file picker directly. We stash the target
  // canvas id in a ref because the <input> change event has no notion of
  // which slot was clicked.
  const handleCanvasClick = (canvasId: number) => {
    pendingCanvasIdRef.current = canvasId;
    if (fileInputRef.current) {
      // Reset value so picking the same file twice still fires `change`.
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Once the user picks a file, validate and jump straight to the crop modal.
  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }
    const canvasId = pendingCanvasIdRef.current;
    if (canvasId === null) return;

    const reader = new FileReader();
    reader.onload = e => {
      const imageUrl = e.target?.result as string;
      if (!imageUrl) return;
      setTempImageForCrop({ canvasId, imageUrl });
      setIsCropModalOpen(true);
    };
    reader.onerror = () => toast.error('Failed to read the selected image');
    reader.readAsDataURL(file);
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

  // Sizes filtered by selected aspect ratio
  const filteredSizes = selectedAspectRatioId
    ? sizes.filter(s => s.aspect_ratio_id === selectedAspectRatioId)
    : sizes;

  // Check if all canvases have images
  const allUploaded = state.canvases.every(c => c.uploaded);
  const uploadCount = state.canvases.filter(c => c.uploaded).length;

  /**
   * Wall total — admin's price is treated as the price for the full 3-canvas
   * set, matching how the Size & Pricing editor labels it. Resolution order
   * matches single-canvas: admin `config.sizePrices` → `sizes.fixed_price`
   * → base × area as fallback. Returns 0 when no resolvable price exists yet
   * so the UI can show a neutral state instead of NaN.
   */
  const getWallPriceForSize = (size: Size): number => {
    const resolved = resolveCanvasSizePrice(
      size as unknown as InchData,
      productForPricing
    );
    return resolved ?? 0;
  };

  const selectedSize = selectedSizeId
    ? sizes.find(s => s.id === selectedSizeId) ?? null
    : null;

  const currentTotalPrice = selectedSize
    ? getWallPriceForSize(selectedSize).toFixed(2)
    : '0.00';

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!allUploaded) {
      toast.error('Please upload images for all 3 canvases');
      return;
    }

    if (!selectedSizeId) {
      toast.error('Please select a canvas size');
      return;
    }

    const cartSize = sizes.find(s => s.id === selectedSizeId);
    if (!cartSize) return;

    // Use the same admin-aware resolver as the size buttons so cart matches UI
    const totalPrice = getWallPriceForSize(cartSize).toFixed(2);

    // Create cart item
    const cartItem = {
      id: `multi-canvas-wall-${Date.now()}`,
      name: `${MULTI_CANVAS_WALL_PRODUCT.name} — ${cartSize.display_label}`,
      price: parseFloat(totalPrice),
      image: state.canvases[0].imageUrl || '/placeholder.jpg',
      images: state.canvases.map(c => c.imageUrl || '/placeholder.jpg'),
      size: `3 × ${cartSize.width_in}" × ${cartSize.height_in}" canvases`,
      quantity: 1,
    };

    await addToCart(cartItem);
    clearPersistedMultiCanvasState();
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

  // Handle full reset
  const handleReset = () => {
    clearPersistedMultiCanvasState();
    setState(prev => ({
      ...prev,
      canvases: Array.from({ length: 3 }, (_, i) => ({
        id: i,
        imageUrl: null,
        imageFile: null,
        uploaded: false,
      })),
      customSpacing: 4,
      selectedRoom: 'default',
      showRulers: false,
    }));
    setSelectedSizeId(sizes.length > 0 ? sizes[0].id : null);
    if (sizes.length > 0) {
      setCanvasWidth(sizes[0].width_in);
      setCanvasHeight(sizes[0].height_in);
    }
  };

  // Get dimensions (using selected size dimensions)
  const canvasDims = {
    width: canvasWidth * MULTI_CANVAS_WALL_PRODUCT.config.layout.scale,
    height: canvasHeight * MULTI_CANVAS_WALL_PRODUCT.config.layout.scale,
  };

  // Reference dimensions = largest canvas in the current ratio. The display
  // frame is sized to fit *this* canvas, which means smaller selections
  // render at their true relative size inside the same frame, giving the
  // customer a real sense of scale across sizes.
  const referenceDims = useMemo(() => {
    const sizesInRatio = selectedAspectRatioId
      ? sizes.filter(s => s.aspect_ratio_id === selectedAspectRatioId)
      : sizes;
    return {
      width: sizesInRatio.reduce(
        (max, s) => Math.max(max, s.width_in),
        canvasWidth
      ),
      height: sizesInRatio.reduce(
        (max, s) => Math.max(max, s.height_in),
        canvasHeight
      ),
    };
  }, [sizes, selectedAspectRatioId, canvasWidth, canvasHeight]);

  // Frame size in wall-space pixels (before applying `scale`). Spans all
  // three reference-sized canvases plus the inter-canvas spacing.
  const displayArea = useMemo(() => {
    const layoutScale = MULTI_CANVAS_WALL_PRODUCT.config.layout.scale;
    return {
      width:
        (referenceDims.width * 3 + state.customSpacing * 2) * layoutScale,
      height: referenceDims.height * layoutScale,
      offsetX: 0,
      offsetY: 0,
    };
  }, [referenceDims, state.customSpacing]);

  // Canvas positions — each canvas slot is centred vertically inside the
  // reference frame, and the three slots are centred as a horizontal group.
  // When the customer picks a smaller size, the slots stay anchored at the
  // group centre but shrink in place, so the surrounding wall area visibly
  // grows around them.
  const canvasPositions = useMemo(() => {
    const layoutScale = MULTI_CANVAS_WALL_PRODUCT.config.layout.scale;
    // Total width of the three actual-size canvases + their spacing.
    const groupWidthIn =
      canvasWidth * 3 + state.customSpacing * 2;
    const startXIn = (referenceDims.width * 3 + state.customSpacing * 2 - groupWidthIn) / 2;
    const startYIn = (referenceDims.height - canvasHeight) / 2;

    return [
      {
        x: startXIn * layoutScale,
        y: startYIn * layoutScale,
      },
      {
        x: (startXIn + canvasWidth + state.customSpacing) * layoutScale,
        y: startYIn * layoutScale,
      },
      {
        x: (startXIn + (canvasWidth + state.customSpacing) * 2) * layoutScale,
        y: startYIn * layoutScale,
      },
    ];
  }, [referenceDims, canvasWidth, canvasHeight, state.customSpacing]);

  // Responsive padding for ruler space — kept constant whether rulers are
  // shown or hidden so the canvases never visually resize on toggle.
  const rulerPadding = useMemo(() => {
    const isMobile = window.innerWidth < 640;
    return {
      horizontal: isMobile ? 40 : 60,
      top: isMobile ? 40 : 60,
      bottom: isMobile ? 50 : 80,
      total: {
        width: isMobile ? 80 : 120,
        height: isMobile ? 90 : 140,
      },
    };
  }, [containerSize]);

  return (
    <div className='h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 flex flex-col md:flex-row overflow-hidden'>
      {/* Leave editor dialog */}
      <AlertDialog open={showBackDialog} onOpenChange={setShowBackDialog}>
        <AlertDialogContent className='max-w-sm rounded-2xl p-0 overflow-hidden'>
          <div className='h-2 bg-gradient-to-r from-[#f63a9e] to-purple-500' />
          <div className='px-6 pt-5 pb-6'>
            <AlertDialogHeader className='space-y-2'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0'>
                  <ArrowLeft className='w-5 h-5 text-[#f63a9e]' />
                </div>
                <AlertDialogTitle
                  className="font-['Bricolage_Grotesque',_sans-serif] text-lg text-gray-900"
                  style={{ fontWeight: '700' }}
                >
                  Leave the editor?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className='text-sm text-gray-500 leading-relaxed pl-[52px]'>
                You&apos;ve started building your gallery wall. Your progress
                will be saved — you can come back and continue anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className='flex-col sm:flex-row gap-2 mt-5'>
              <AlertDialogCancel className='w-full sm:w-auto rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium'>
                Keep editing
              </AlertDialogCancel>
              <AlertDialogAction
                className='w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#f63a9e] to-purple-500 hover:opacity-90 text-white font-semibold shadow-md shadow-pink-200/50'
                onClick={() => navigate(-1)}
              >
                Yes, go back
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset / start over dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className='max-w-sm rounded-2xl p-0 overflow-hidden'>
          <div className='h-2 bg-gradient-to-r from-red-400 to-orange-400' />
          <div className='px-6 pt-5 pb-6'>
            <AlertDialogHeader className='space-y-2'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0'>
                  <RotateCcw className='w-5 h-5 text-red-500' />
                </div>
                <AlertDialogTitle
                  className="font-['Bricolage_Grotesque',_sans-serif] text-lg text-gray-900"
                  style={{ fontWeight: '700' }}
                >
                  Start over?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className='text-sm text-gray-500 leading-relaxed pl-[52px]'>
                This will remove all uploaded images and reset your canvas
                layout. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className='flex-col sm:flex-row gap-2 mt-5'>
              <AlertDialogCancel className='w-full sm:w-auto rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium'>
                Keep my wall
              </AlertDialogCancel>
              <AlertDialogAction
                className='w-full sm:w-auto rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md shadow-red-200/50'
                onClick={handleReset}
              >
                Yes, start over
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {/* Main Content Area — on mobile/tablet (< md) the wall preview is
          locked to ~50% of the viewport height and pinned to the top, so
          the customer always sees their canvases while scrolling the
          configuration controls below. On md+ it returns to the side-by-
          side layout where the preview fills the remaining width. */}
      <div className='flex-shrink-0 h-[50vh] md:h-auto md:flex-1 flex items-stretch'>
        <div
          ref={containerRef}
          className='relative w-full h-full overflow-visible'
        >
          {/* Wall Background — multi-layer CSS to read as a real interior
              wall: warm base, side-lit ambient lighting, plaster speckle, a
              fine paint-roller weave, soft corner vignettes, ceiling shadow,
              floor wash, white skirting board with a baseboard profile, and
              a hint of timber floor at the very bottom. Pure CSS, zero
              assets. */}
          <div
            className='absolute inset-0 overflow-hidden'
            style={{
              backgroundColor: DEFAULT_WALL_COLOR,
              backgroundImage: [
                // Window/ambient side-light from the upper-left — brightens
                // one shoulder of the wall, the rest falls into gentle shade.
                'radial-gradient(ellipse at 18% 12%, rgba(255,250,240,0.35) 0%, rgba(255,250,240,0) 45%)',
                // Counter shadow opposite the light source.
                'radial-gradient(ellipse at 88% 95%, rgba(60,45,30,0.16) 0%, rgba(60,45,30,0) 55%)',
                // Soft full-frame vignette so corners feel slightly recessed.
                'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.12) 100%)',
                // Top-down ambient lighting — bright at top, shaded near floor.
                'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 30%, rgba(60,45,30,0.07) 100%)',
                // Plaster speckle — coarse layer.
                'radial-gradient(rgba(80,60,40,0.07) 0.6px, transparent 0.7px)',
                // Plaster speckle — fine layer for sub-pixel grain.
                'radial-gradient(rgba(255,255,255,0.05) 0.4px, transparent 0.5px)',
                // Vertical paint-roller weave (very subtle) — mimics the
                // nap variation a roller leaves on matte emulsion.
                'repeating-linear-gradient(90deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 1px, transparent 1px, transparent 5px)',
                // Faint horizontal brushed-paint banding.
                'repeating-linear-gradient(180deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 1px, transparent 1px, transparent 6px)',
              ].join(', '),
              backgroundSize:
                '100% 100%, 100% 100%, 100% 100%, 100% 100%, 4px 4px, 2px 2px, 5px 100%, 100% 6px',
              backgroundRepeat:
                'no-repeat, no-repeat, no-repeat, no-repeat, repeat, repeat, repeat, repeat',
            }}
          >
            {/* Ceiling shadow — a thin band of darker wash at the very top
                where wall meets ceiling, sells the "indoor" feel. */}
            <div
              className='pointer-events-none absolute top-0 left-0 right-0 z-0'
              style={{
                height: '6%',
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0) 100%)',
              }}
            />

            {/* Floor shadow — soft dark wash where wall meets floor. */}
            <div
              className='pointer-events-none absolute left-0 right-0 z-0'
              style={{
                bottom: '4.5%',
                height: '14%',
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.10) 100%)',
              }}
            />

            {/* Skirting board — taller, off-white painted profile with a
                shadow line at the top (where it meets the wall) and a darker
                base meeting the floor. Sells the depth of a real baseboard. */}
            <div
              className='pointer-events-none absolute left-0 right-0 z-0'
              style={{
                bottom: '2%',
                height: '3.5%',
                minHeight: 22,
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(255,255,255,0.55) 4%, #efe9de 12%, #f6f1e7 55%, #d8cdb9 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(0,0,0,0.08), inset 0 -1px 0 rgba(0,0,0,0.18)',
              }}
            />

            {/* Floor strip — a subtle warm wood/floor band at the very
                bottom. Uses a repeating linear-gradient to fake plank seams
                without committing to a heavy texture. */}
            <div
              className='pointer-events-none absolute bottom-0 left-0 right-0 z-0'
              style={{
                height: '2%',
                minHeight: 8,
                backgroundColor: '#b89876',
                backgroundImage: [
                  'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0) 30%)',
                  'repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 64px)',
                  'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 6px)',
                ].join(', '),
              }}
            />

            {/* Reference stack of books — drawn pure-CSS at the same
                wall-pixel scale as the canvases so the customer gets a real
                physical sense of how big each canvas size looks in a room.
                Books are short enough to always fit on the floor strip
                without being clipped, unlike a tall lamp. Hidden on the
                smallest screens to avoid crowding. */}
            {(() => {
              const layoutScale = MULTI_CANVAS_WALL_PRODUCT.config.layout.scale;
              const px = (inches: number) => inches * layoutScale * scale;

              // Each book: width (in), height/thickness (in), horizontal
              // offset from the leftmost edge (in), cover gradient, page-
              // edge colour. Books are stacked from bottom up; the array is
              // drawn in order so later items sit on top.
              const books = [
                {
                  w: 12,
                  h: 1.6,
                  offsetX: 0,
                  rotate: -1.2,
                  cover: 'linear-gradient(180deg, #2f5a4f 0%, #1f3f37 100%)',
                  pages: '#f4ead0',
                },
                {
                  w: 10,
                  h: 1.3,
                  offsetX: 1.2,
                  rotate: 0.8,
                  cover: 'linear-gradient(180deg, #b94a3a 0%, #862e21 100%)',
                  pages: '#f6efd9',
                },
                {
                  w: 11,
                  h: 1.4,
                  offsetX: 0.4,
                  rotate: -0.6,
                  cover: 'linear-gradient(180deg, #1f3a5f 0%, #122648 100%)',
                  pages: '#efe6cc',
                },
                {
                  w: 8.5,
                  h: 1.1,
                  offsetX: 1.8,
                  rotate: 1.4,
                  cover: 'linear-gradient(180deg, #d8c47a 0%, #b09a52 100%)',
                  pages: '#f7eedc',
                },
              ];

              const STACK_W_IN = Math.max(...books.map(b => b.w + b.offsetX));
              const STACK_H_IN = books.reduce((sum, b) => sum + b.h, 0);

              return (
                <div
                  className='pointer-events-none absolute z-0'
                  style={{
                    // Anchor the stack on the floor strip so it sits *in
                    // front of* the skirting like real books on the floor.
                    bottom: '2.2%',
                    left: '3.5%',
                    width: px(STACK_W_IN),
                    height: px(STACK_H_IN) + 8,
                  }}
                  aria-hidden
                >
                  {books.map((book, i) => {
                    // Stack from the bottom up.
                    const cumulativeBelow = books
                      .slice(0, i)
                      .reduce((s, b) => s + b.h, 0);
                    return (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          bottom: px(cumulativeBelow),
                          left: px(book.offsetX),
                          width: px(book.w),
                          height: px(book.h),
                          background: book.cover,
                          borderRadius: 1,
                          transform: `rotate(${book.rotate}deg)`,
                          transformOrigin: 'center bottom',
                          boxShadow:
                            '0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.25)',
                        }}
                      >
                        {/* Page-edge stripe — thin band along the bottom of
                            the cover so each book reads as having pages. */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 1,
                            right: 1,
                            bottom: 1,
                            height: Math.max(2, px(book.h) * 0.32),
                            background: book.pages,
                            backgroundImage:
                              'repeating-linear-gradient(180deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 0.5px, transparent 0.5px, transparent 1.5px)',
                            borderRadius: 0.5,
                          }}
                        />
                        {/* Spine label dash — a tiny title-like accent on
                            the cover to add a little life. */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '38%',
                            left: '20%',
                            width: '40%',
                            height: 1,
                            background: 'rgba(255,255,255,0.35)',
                            borderRadius: 0.5,
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* Soft contact shadow under the stack. */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -px(0.3),
                      left: px(0.5),
                      width: px(STACK_W_IN - 0.5),
                      height: 6,
                      background:
                        'radial-gradient(ellipse, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 70%)',
                      filter: 'blur(2px)',
                    }}
                  />

                </div>
              );
            })()}

            {/* Reference flower vase — small ceramic vase with a few stems,
                drawn pure-CSS at the same wall-pixel scale as the canvases.
                Sits on the right side of the wall mirroring the books on
                the left, giving customers a second real-world scale cue. */}
            {(() => {
              const layoutScale = MULTI_CANVAS_WALL_PRODUCT.config.layout.scale;
              const px = (inches: number) => inches * layoutScale * scale;

              // Vase body geometry (in inches, real-world).
              const VASE_W = 6;
              const VASE_H = 9;
              const NECK_W = 3.6;
              const NECK_H = 1.4;

              // Each stem: height above neck (in), horizontal x-offset from
              // vase centre (in, +right / -left), bloom diameter (in),
              // bloom colour, and a tiny lean angle in degrees.
              const stems = [
                { h: 7, x: -1.4, bloom: 2.4, color: '#e85a8a', lean: -6 },
                { h: 9, x: 0.2, bloom: 2.8, color: '#f0b347', lean: 1 },
                { h: 6, x: 1.5, bloom: 2.0, color: '#e9eef2', lean: 7 },
              ];

              const TALLEST_STEM = Math.max(...stems.map(s => s.h));
              const TALLEST_BLOOM = Math.max(...stems.map(s => s.bloom));
              const TOTAL_H_IN = VASE_H + TALLEST_STEM + TALLEST_BLOOM * 0.5;
              const TOTAL_W_IN = Math.max(
                VASE_W,
                ...stems.map(s => Math.abs(s.x) * 2 + s.bloom),
              );

              return (
                <div
                  className='pointer-events-none absolute z-0'
                  style={{
                    bottom: '2.2%',
                    right: '4%',
                    width: px(TOTAL_W_IN),
                    height: px(TOTAL_H_IN),
                  }}
                  aria-hidden
                >
                  {/* Stems + blooms — drawn first so vase overlaps stem
                      bottoms naturally. */}
                  {stems.map((s, i) => {
                    const stemBottom = px(VASE_H - NECK_H * 0.4);
                    const stemHeight = px(s.h);
                    const bloomSize = px(s.bloom);
                    const centerX = px(TOTAL_W_IN / 2);
                    const stemX = centerX + px(s.x);
                    return (
                      <div key={i}>
                        {/* Green stem */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: stemBottom,
                            left: stemX,
                            width: 2,
                            height: stemHeight,
                            background:
                              'linear-gradient(180deg, #4a7a3f 0%, #2f5230 100%)',
                            transform: `rotate(${s.lean}deg)`,
                            transformOrigin: 'bottom center',
                            borderRadius: 1,
                          }}
                        />
                        {/* Tiny leaf halfway up the stem */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: stemBottom + stemHeight * 0.45,
                            left: stemX + (s.lean >= 0 ? 1 : -px(1.2)),
                            width: px(1.2),
                            height: px(0.6),
                            background:
                              'linear-gradient(180deg, #5a8a4a 0%, #355c33 100%)',
                            borderRadius: '50% 0 50% 0',
                            transform: `rotate(${s.lean - 25}deg)`,
                          }}
                        />
                        {/* Bloom — soft rounded petals via radial-gradient
                            with a darker centre for depth. */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: stemBottom + stemHeight - bloomSize * 0.25,
                            left:
                              stemX + Math.sin((s.lean * Math.PI) / 180) * stemHeight - bloomSize / 2 + 1,
                            width: bloomSize,
                            height: bloomSize,
                            background: `radial-gradient(circle at 35% 35%, ${s.color} 0%, ${s.color} 45%, rgba(0,0,0,0.18) 100%)`,
                            borderRadius: '50%',
                            boxShadow:
                              '0 1px 3px rgba(0,0,0,0.20), inset 0 -2px 4px rgba(0,0,0,0.12)',
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* Vase body — ceramic, slightly bulged shape via
                      clipPath. Two-tone gradient for ceramic curvature. */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: px(VASE_W),
                      height: px(VASE_H),
                      background:
                        'linear-gradient(90deg, #b8c4cc 0%, #e8eef2 35%, #f5f8fa 50%, #d4dde3 80%, #9aa6ad 100%)',
                      clipPath:
                        'polygon(20% 0, 80% 0, 78% 18%, 100% 55%, 92% 100%, 8% 100%, 0 55%, 22% 18%)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.25)',
                    }}
                  />
                  {/* Vase neck rim — small dark band at the top opening so
                      the stems read as going *into* the vase. */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: px(VASE_H - 0.2),
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: px(NECK_W),
                      height: Math.max(2, px(0.3)),
                      background:
                        'linear-gradient(90deg, #6a7378 0%, #2c3236 50%, #6a7378 100%)',
                      borderRadius: '50%',
                    }}
                  />
                  {/* Vertical highlight on the vase — sells curvature. */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: px(0.6),
                      left: '50%',
                      transform: `translateX(-${px(VASE_W) * 0.18}px)`,
                      width: Math.max(2, px(0.4)),
                      height: px(VASE_H - 1.6),
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 35%, rgba(255,255,255,0) 100%)',
                      borderRadius: 2,
                    }}
                  />

                  {/* Soft contact shadow under the vase. */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -px(0.3),
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: px(VASE_W) * 1.1,
                      height: 6,
                      background:
                        'radial-gradient(ellipse, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 70%)',
                      filter: 'blur(2px)',
                    }}
                  />
                </div>
              );
            })()}

            {/* Top Left - Back Button */}
            <div className='absolute top-2 left-2 sm:top-4 sm:left-4 md:top-6 md:left-6 z-20'>
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => setShowBackDialog(true)}
                className='flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 bg-white/95 backdrop-blur-md hover:bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border-2 border-gray-200 hover:border-gray-300 transition-all group'
              >
                <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-[#f63a9e] transition-colors' />
                <span className='text-xs sm:text-sm md:text-base font-semibold text-gray-700 group-hover:text-[#f63a9e] transition-colors'>
                  Back
                </span>
              </motion.button>
            </div>

            {/* Top Right - Reset + Ruler Toggle */}
            <div className='absolute top-2 right-2 sm:top-4 sm:right-4 md:top-6 md:right-6 z-20 flex items-center gap-2'>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                onClick={() => setShowResetDialog(true)}
                className='flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 bg-white/95 backdrop-blur-md hover:bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border-2 border-gray-200 hover:border-red-300 hover:text-red-500 transition-all group'
              >
                <RotateCcw className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-red-500 transition-colors' />
                <span className='hidden sm:inline text-xs sm:text-sm md:text-base font-semibold text-gray-700 group-hover:text-red-500 transition-colors'>
                  Start Over
                </span>
              </motion.button>
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
                  const scaledCanvasWidth = canvasDims.width * scale;
                  const scaledCanvasHeight = canvasDims.height * scale;
                  const minCanvasSide = Math.min(
                    scaledCanvasWidth,
                    scaledCanvasHeight
                  );
                  const iconSize = Math.max(
                    18,
                    Math.min(40, minCanvasSide * 0.18)
                  );
                  const titleFontSize = Math.max(
                    10,
                    Math.min(18, minCanvasSide * 0.085)
                  );

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
                        width: scaledCanvasWidth,
                        height: scaledCanvasHeight,
                      }}
                    >
                      {/* Wall shadow halo — soft, asymmetric so the canvas
                          appears top-lit (matching the reference photo). The
                          bottom of the canvas casts a stronger shadow than
                          the top, which is what sells the "hung on a wall"
                          effect. Sits behind the canvas via z-index. */}
                      <div
                        className='pointer-events-none absolute -inset-[6%] rounded-[2px] bg-black/25 blur-2xl'
                        style={{ transform: 'translateY(10px)', zIndex: -1 }}
                      />

                      {/* Canvas surface */}
                      <div
                        onClick={() => handleCanvasClick(canvas.id)}
                        className='group/canvas relative w-full h-full overflow-hidden cursor-pointer transition-transform duration-300 ease-out group-hover:-translate-y-0.5'
                        style={{
                          backgroundColor: uploaded ? 'transparent' : '#fbfaf7',
                          // Layered shadow simulates real canvas depth + cast
                          // shadow on the wall. Tight inner shadows give the
                          // wrapped-edge thickness, the larger blurred ones
                          // are the wall shadow.
                          boxShadow: uploaded
                            ? [
                                // Hairline outline keeps the photo edge crisp
                                // against the wall colour without injecting
                                // any visible inset gap.
                                '0 0 0 1px rgba(0,0,0,0.05)',
                                '0 2px 4px rgba(0,0,0,0.08)',
                                '0 14px 28px -6px rgba(0,0,0,0.28)',
                                '0 28px 50px -12px rgba(0,0,0,0.22)',
                              ].join(', ')
                            : [
                                // Top inner highlight — lit edge
                                '0 1px 0 rgba(255,255,255,0.9) inset',
                                // Bottom inner crease — wrapped edge in shadow
                                '0 -1px 0 rgba(0,0,0,0.06) inset',
                                // Hairline outline so the white canvas reads
                                // against a similarly-light wall colour
                                '0 0 0 1px rgba(0,0,0,0.04)',
                                // Tight contact shadow under the canvas
                                '0 2px 3px rgba(0,0,0,0.08)',
                                // Mid wall shadow
                                '0 12px 22px -6px rgba(0,0,0,0.22)',
                                // Wide soft ambient shadow
                                '0 26px 48px -14px rgba(0,0,0,0.18)',
                              ].join(', '),
                        }}
                      >
                        {uploaded && canvas.imageUrl ? (
                          // Uploaded Image — `block` kills the inline-image
                          // baseline whitespace that would otherwise leave a
                          // few pixels of background visible at the bottom.
                          <img
                            src={canvas.imageUrl}
                            alt={`Canvas ${canvas.id + 1}`}
                            className='block w-full h-full object-cover'
                            draggable={false}
                          />
                        ) : (
                          // Empty Placeholder — styled like a real blank
                          // primed canvas: warm white surface with a very
                          // subtle vertical lighting gradient. The upload
                          // affordance is intentionally quiet so the canvas
                          // reads as a physical object first, a button second.
                          <div
                            className='relative w-full h-full'
                            style={{
                              backgroundImage:
                                'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0.04) 100%)',
                            }}
                          >
                            {/* Subtle linen-like noise via tiny radial spots
                                at low opacity. Pure CSS keeps the asset zero. */}
                            <div
                              className='absolute inset-0 opacity-[0.18] mix-blend-multiply pointer-events-none'
                              style={{
                                backgroundImage:
                                  'radial-gradient(rgba(0,0,0,0.18) 0.5px, transparent 0.6px)',
                                backgroundSize: '3px 3px',
                              }}
                            />

                            {/* Centered upload affordance */}
                            <div className='relative w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 group-hover/canvas:text-[#f63a9e] transition-colors'>
                              <div
                                className='rounded-full border-2 border-dashed border-current flex items-center justify-center'
                                style={{
                                  width: `${iconSize * 1.9}px`,
                                  height: `${iconSize * 1.9}px`,
                                }}
                              >
                                <ImagePlus
                                  style={{
                                    width: `${iconSize}px`,
                                    height: `${iconSize}px`,
                                  }}
                                  strokeWidth={1.75}
                                />
                              </div>
                              <span
                                className='font-semibold tracking-wide'
                                style={{ fontSize: `${titleFontSize}px` }}
                              >
                                {`Photo ${canvas.id + 1}`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons — sit *above* the canvas (outside
                          its top edge) so they never obscure the photo.
                          Right-aligned to the canvas so they read as
                          belonging to that specific slot. On desktop they
                          fade in on hover; on mobile/touch they stay
                          visible because there's no hover state. */}
                      {uploaded && canvas.imageUrl && (
                        <div className='absolute bottom-full right-0 mb-1.5 sm:mb-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex gap-1 sm:gap-1.5 z-10'>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleCanvasClick(canvas.id);
                            }}
                            className='w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-md ring-1 ring-black/10 flex items-center justify-center transition-all hover:scale-110'
                            title='Replace image'
                          >
                            <Upload className='w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-gray-700' />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleRemoveImage(canvas.id);
                            }}
                            className='w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-red-500/95 backdrop-blur-sm hover:bg-red-600 shadow-md ring-1 ring-black/10 flex items-center justify-center transition-all hover:scale-110'
                            title='Remove image'
                          >
                            <X className='w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white' />
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

        </div>
      </div>

      {/* Right Sidebar - Responsive. On mobile it takes the remaining
          viewport height (flex-1 + min-h-0) so its inner content area can
          scroll independently of the fixed wall preview above. */}
      <div className='w-full md:w-[420px] lg:w-[460px] flex-1 min-h-0 md:flex-none bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col shadow-xl md:max-h-none md:h-screen'>
        {/* Debug Info - Only in development
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
        )} */}

        {/* Sidebar scroll region — header lives *inside* the scroll
            container so the "Gallery wall designer" intro can scroll out
            of view, freeing vertical space for the actual configuration
            controls. This matters most on mobile where the visible
            sidebar area is only ~50vh. */}
        <div className='flex-1 overflow-y-auto'>
          {/* Sidebar Header */}
          <div className='px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 lg:py-7 border-b border-gray-200 bg-gradient-to-br from-pink-50/40 via-white to-white'>
            <div className='flex items-center gap-2 mb-1.5 text-[10px] sm:text-[11px] font-semibold tracking-[0.14em] uppercase text-[#f63a9e]'>
              <Sparkles className='w-3 h-3 sm:w-3.5 sm:h-3.5' />
              <span>Gallery wall designer</span>
            </div>
            <h2
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-1 text-lg sm:text-xl md:text-2xl"
              style={{ fontWeight: '700', lineHeight: '1.15' }}
            >
              Design your 3-canvas wall
            </h2>
            <p className='text-xs sm:text-sm text-gray-600'>
              Pick a shape and size, upload three photos, and we&apos;ll
              print your set on premium canvas.
            </p>
          </div>

          {/* Sidebar Content */}
          <div className='p-4 sm:p-6 md:p-7 space-y-5 sm:space-y-6 md:space-y-7'>
          {/* Aspect Ratio Selection */}
          {aspectRatios.length > 0 && (
            <div>
              <div className='flex items-center gap-2 mb-2 sm:mb-3'>
                <span className='inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#f63a9e] text-white text-[10px] sm:text-xs font-bold'>
                  1
                </span>
                <h3 className='font-semibold text-gray-900 text-xs sm:text-sm md:text-base'>
                  Choose canvas shape
                </h3>
              </div>
              <div className='grid grid-cols-3 gap-2 sm:gap-2.5'>
                {aspectRatios.map(ratio => {
                  const active = selectedAspectRatioId === ratio.id;
                  // Strip "Portrait/Landscape/Square" suffix to keep label tight
                  const compactLabel = ratio.label
                    .replace(/\s*(Portrait|Landscape|Square|Ultrawide)\s*/i, '')
                    .trim() || ratio.label;
                  const orientation = ratio.orientation
                    ? ratio.orientation.charAt(0).toUpperCase() +
                      ratio.orientation.slice(1)
                    : '';
                  return (
                    <button
                      key={ratio.id}
                      onClick={() => {
                        const firstSize = sizes.find(
                          s => s.aspect_ratio_id === ratio.id
                        );
                        // Aspect-ratio change invalidates existing crops —
                        // an image cropped for portrait won't fit a square or
                        // landscape slot. Clear any uploads and prompt for
                        // re-upload + re-crop. Same-aspect size changes (eg.
                        // 12×18 → 16×24, both 2:3) leave the existing crop
                        // valid so we only do this on actual aspect changes.
                        const oldAspect = canvasWidth / canvasHeight;
                        const newAspect = firstSize
                          ? firstSize.width_in / firstSize.height_in
                          : oldAspect;
                        const aspectChanged =
                          Math.abs(oldAspect - newAspect) > 0.001;
                        const hadUploads = state.canvases.some(c => c.uploaded);

                        setSelectedAspectRatioId(ratio.id);
                        if (firstSize) {
                          setSelectedSizeId(firstSize.id);
                          setCanvasWidth(firstSize.width_in);
                          setCanvasHeight(firstSize.height_in);
                        }
                        if (aspectChanged && hadUploads) {
                          setState(prev => ({
                            ...prev,
                            canvases: prev.canvases.map(c => ({
                              ...c,
                              imageUrl: null,
                              imageFile: null,
                              uploaded: false,
                            })),
                          }));
                          toast.info(
                            'Aspect ratio changed — please re-upload your photos so they fit the new shape.'
                          );
                        }
                      }}
                      className={`relative flex flex-col items-center justify-center gap-1.5 px-2 py-3 sm:py-3.5 rounded-xl border-2 transition-all ${
                        active
                          ? 'border-[#f63a9e] bg-pink-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      {active && (
                        <div className='absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#f63a9e] flex items-center justify-center'>
                          <CheckCircle2 className='w-2.5 h-2.5 text-white' />
                        </div>
                      )}
                      {/* Visual ratio indicator */}
                      <div className='flex items-center justify-center w-8 h-8'>
                        <div
                          className={`border-2 rounded-[3px] ${
                            active ? 'border-[#f63a9e]' : 'border-gray-400'
                          }`}
                          style={{
                            width:
                              ratio.width_ratio >= ratio.height_ratio
                                ? 26
                                : Math.round(
                                    (26 * ratio.width_ratio) / ratio.height_ratio
                                  ),
                            height:
                              ratio.height_ratio >= ratio.width_ratio
                                ? 26
                                : Math.round(
                                    (26 * ratio.height_ratio) / ratio.width_ratio
                                  ),
                          }}
                        />
                      </div>
                      <span
                        className={`text-xs sm:text-sm font-bold leading-tight ${
                          active ? 'text-[#f63a9e]' : 'text-gray-800'
                        }`}
                      >
                        {compactLabel}
                      </span>
                      {orientation && (
                        <span className='text-[9px] sm:text-[10px] font-medium text-gray-500 uppercase tracking-wide'>
                          {orientation}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selection */}
          <div>
            <div className='flex items-center justify-between mb-2 sm:mb-3'>
              <div className='flex items-center gap-2'>
                <span className='inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#f63a9e] text-white text-[10px] sm:text-xs font-bold'>
                  2
                </span>
                <h3 className='font-semibold text-gray-900 text-xs sm:text-sm md:text-base'>
                  Pick a size
                </h3>
              </div>
              {filteredSizes.length > 0 && (
                <span className='text-[10px] sm:text-xs text-gray-500'>
                  Price for set of 3
                </span>
              )}
            </div>

            {/* Size List */}
            {filteredSizes.length === 0 ? (
              <div className='p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center'>
                <p className='text-xs sm:text-sm text-gray-600'>
                  No sizes available for this shape yet. Try a different
                  ratio.
                </p>
              </div>
            ) : (
              <div className='space-y-2'>
                {filteredSizes.map(size => {
                  // Wall total honours admin's per-size price (config.sizePrices)
                  // first, then sizes.fixed_price, then base × area as fallback.
                  const totalPrice = getWallPriceForSize(size).toFixed(2);
                  const active = selectedSizeId === size.id;
                  return (
                    <button
                      key={size.id}
                      onClick={() => {
                        setSelectedSizeId(size.id);
                        setCanvasWidth(size.width_in);
                        setCanvasHeight(size.height_in);
                      }}
                      className={`relative w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl border-2 transition-all text-left ${
                        active
                          ? 'border-[#f63a9e] bg-pink-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className='flex items-center gap-3 min-w-0'>
                        <span
                          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            active
                              ? 'border-[#f63a9e] bg-[#f63a9e]'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {active && (
                            <span className='w-2 h-2 rounded-full bg-white' />
                          )}
                        </span>
                        <div className='min-w-0'>
                          <div
                            className={`text-sm sm:text-base font-bold truncate ${
                              active ? 'text-gray-900' : 'text-gray-900'
                            }`}
                          >
                            {size.display_label}
                          </div>
                          <div className='text-[10px] sm:text-xs text-gray-500 mt-0.5'>
                            {size.width_in}&quot; × {size.height_in}&quot; per
                            canvas
                          </div>
                        </div>
                      </div>
                      <div className='text-right ml-3 flex-shrink-0'>
                        <div className='text-base sm:text-lg font-bold text-[#f63a9e]'>
                          £{totalPrice}
                        </div>
                        <div className='text-[9px] sm:text-[10px] text-gray-500'>
                          Set of 3
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

          </div>

          {/* Order Summary + CTA — kept inline rather than sticky so the
              page reads top-to-bottom on mobile, but visually anchored with
              a card so it doesn't feel detached on desktop. */}
          <div className='pt-4 border-t border-gray-200 space-y-3'>
            {selectedSizeId && (
              <div className='rounded-xl border border-gray-200 bg-gradient-to-br from-pink-50/40 to-white p-3 sm:p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-[10px] sm:text-xs uppercase tracking-wide text-gray-500 font-semibold'>
                      Your gallery wall
                    </p>
                    <p className='text-xs sm:text-sm font-semibold text-gray-900 mt-0.5 truncate'>
                      3 × {canvasWidth}&quot; × {canvasHeight}&quot;
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-[10px] sm:text-xs text-gray-500'>
                      Total
                    </p>
                    <p className='text-lg sm:text-xl font-bold text-[#f63a9e] leading-tight'>
                      £{currentTotalPrice}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleAddToCart}
              disabled={!allUploaded || !selectedSizeId}
              className={`w-full h-12 sm:h-[52px] rounded-xl text-sm sm:text-base font-semibold shadow-lg transition-all ${
                !allUploaded || !selectedSizeId
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-[#f63a9e] hover:bg-[#e02d8d] text-white shadow-pink-200/60'
              }`}
            >
              <ShoppingCart className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
              {!allUploaded
                ? `Upload ${3 - uploadCount} more photo${
                    3 - uploadCount === 1 ? '' : 's'
                  } to continue`
                : selectedSizeId
                  ? `Add to cart · £${currentTotalPrice}`
                  : 'Pick a size to continue'}
            </Button>

            {/* Inline status — only show negative state (positive feedback is
                already implicit in the active CTA + summary card). */}
            {!allUploaded && (
              <p className='text-[10px] sm:text-xs text-gray-500 text-center'>
                <strong>{uploadCount}/3</strong> photos added · upload the rest
                to add to cart
              </p>
            )}

          </div>
          </div>
        </div>
      </div>

      {/* Hidden file input — opened directly by clicking a canvas slot, so
          the customer skips a redundant upload-method modal and goes straight
          from "tap canvas" → OS file picker → crop dialog. */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/jpeg,image/png,image/webp,image/*'
        className='hidden'
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file);
        }}
      />

      {/* Crop Modal */}
      {tempImageForCrop && (
        <CropModal
          isOpen={isCropModalOpen}
          imageUrl={tempImageForCrop.imageUrl}
          canvasId={tempImageForCrop.canvasId}
          aspectRatio={canvasWidth / canvasHeight}
          canvasWidthIn={canvasWidth}
          canvasHeightIn={canvasHeight}
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
