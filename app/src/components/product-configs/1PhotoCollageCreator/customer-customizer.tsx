import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/context/CartContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload,
  ShoppingCart,
  Loader2,
  Image as ImageIcon,
  Palette,
  Ruler as RulerIcon,
  X,
  LayoutGrid,
  Home,
  AlertTriangle,
  Check,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CollageEditor } from './collage-editor';
import { TemplateSelector } from './template-selector';
import {
  type CollageSelection,
  type CollagePhoto,
  type CollageTemplate,
  DEFAULT_COLLAGE_CONFIG,
  PREDEFINED_TEMPLATES,
} from './types';
import {
  getCanvasDimensionsFromAspectRatio,
  COLLAGE_CANVAS_PRODUCT,
} from './config';
import { Room3DPreview } from '../shared/3d/room-3d-preview';
import { CollageMesh } from './collage-mesh';
import { uploadDataURLToStorage } from '@/lib/supabase/storage';

type TabType = 'templates' | 'photos' | 'background';

// ─── Session persistence ────────────────────────────────────────────────────
const COLLAGE_SESSION_KEY = 'photify_collage_state';

interface PersistedCollageState {
  hasSelectedTemplate: boolean;
  selectedTemplate: CollageTemplate | null;
  selection: Omit<CollageSelection, 'photos'> & {
    photos: Array<Omit<CollagePhoto, 'file'> & { file: null }>;
  };
  selectedSizeId: string | null;
  selectedAspectRatioId: string | null;
}

function loadCollageSession(): PersistedCollageState | null {
  try {
    const raw = sessionStorage.getItem(COLLAGE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedCollageState;
  } catch {
    return null;
  }
}

function saveCollageSession(state: PersistedCollageState) {
  try {
    sessionStorage.setItem(COLLAGE_SESSION_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded (large base64 photos) — retry without photos
    try {
      sessionStorage.setItem(
        COLLAGE_SESSION_KEY,
        JSON.stringify({ ...state, selection: { ...state.selection, photos: [] } })
      );
    } catch { /* ignore */ }
  }
}

function clearCollageSession() {
  try { sessionStorage.removeItem(COLLAGE_SESSION_KEY); } catch { /* noop */ }
}
// ────────────────────────────────────────────────────────────────────────────

export function CollageCustomizer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart, openCart } = useCart();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get productId from URL
  const urlProductId = searchParams.get('productId');

  // Default dimensions (will be updated when template is selected)
  const defaultDimensions = { width: 20, height: 20, label: '20" × 20"' };

  const [selection, setSelection] = useState<CollageSelection>(() => {
    const p = loadCollageSession();
    if (p?.selection) {
      return {
        ...p.selection,
        photos: p.selection.photos.map(ph => ({ ...ph, file: null as unknown as File })),
      };
    }
    return {
      templateId: null,
      canvasSizeId: defaultDimensions.label,
      canvasWidth: defaultDimensions.width,
      canvasHeight: defaultDimensions.height,
      backgroundId: 'white',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      photos: [],
    };
  });

  const [selectedTemplate, setSelectedTemplate] = useState<CollageTemplate | null>(
    () => loadCollageSession()?.selectedTemplate ?? null
  );
  const [hasSelectedTemplate, setHasSelectedTemplate] = useState<boolean>(
    () => loadCollageSession()?.hasSelectedTemplate ?? false
  );
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [showRuler, setShowRuler] = useState(false);
  const [collageDataURL, setCollageDataURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true); // Default to true to avoid layout shift
  const [isMounted, setIsMounted] = useState(false); // Track if component is mounted
  const [customHexColor, setCustomHexColor] = useState('#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorHSL, setColorHSL] = useState({ h: 0, s: 0, l: 100 }); // Track HSL for picker position
  const [opacity, setOpacity] = useState(20); // Track opacity (0-100), default 20%
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  // Size selection state
  const [showSizeSelection, setShowSizeSelection] = useState(false);
  const [aspectRatios, setAspectRatios] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [selectedAspectRatioId, setSelectedAspectRatioId] = useState<string | null>(
    () => loadCollageSession()?.selectedAspectRatioId ?? null
  );
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(
    () => loadCollageSession()?.selectedSizeId ?? null
  );
  /**
   * Admin-managed price map keyed by size id (`products.config.sizePrices`).
   * When populated, these prices override the per-sq-inch fallback so the
   * customizer honours what the shop operator has configured.
   */
  const [productSizePrices, setProductSizePrices] = useState<Record<string, number>>({});

  // Set mounted state on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Persist editor state to sessionStorage after every meaningful change
  useEffect(() => {
    if (!isMounted) return;
    saveCollageSession({
      hasSelectedTemplate,
      selectedTemplate,
      selection: {
        ...selection,
        // Strip non-serialisable File objects; url (base64) is enough to restore
        photos: selection.photos.map(({ file: _file, ...rest }) => ({ ...rest, file: null })),
      },
      selectedSizeId,
      selectedAspectRatioId,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, hasSelectedTemplate, selectedTemplate, selection, selectedSizeId, selectedAspectRatioId]);

  // Photo selection modal state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isUploadDragActive, setIsUploadDragActive] = useState(false);
  const [pendingSlotForModal, setPendingSlotForModal] = useState<{
    slotId: string | null;
    targetSlot: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const [onPhotoSelectedForSlot, setOnPhotoSelectedForSlot] = useState<
    | ((
        photo: CollagePhoto,
        slotInfo: {
          slotId: string | null;
          targetSlot: { x: number; y: number; width: number; height: number };
        }
      ) => void)
    | null
  >(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    placedCount: number;
    uniqueCount: number;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    placedCount: 0,
    uniqueCount: 0,
    onConfirm: () => {},
  });

  // Check if desktop on mount and resize
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Fetch the product's admin-managed config (sizePrices) once on mount so
  // we can price each size using the admin's values instead of a hardcoded rate.
  useEffect(() => {
    const fetchProductConfig = async () => {
      const productId = urlProductId || COLLAGE_CANVAS_PRODUCT.id;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('config')
          .eq('id', productId)
          .maybeSingle();

        if (error) {
          console.warn('Could not load product pricing config:', error.message);
          return;
        }

        const rawPrices = (data?.config as any)?.sizePrices;
        if (rawPrices && typeof rawPrices === 'object') {
          const normalised: Record<string, number> = {};
          for (const [sizeId, value] of Object.entries(rawPrices)) {
            const n = typeof value === 'number' ? value : Number(value);
            if (Number.isFinite(n) && n > 0) {
              normalised[sizeId] = n;
            }
          }
          setProductSizePrices(normalised);
        }
      } catch (err) {
        console.warn('Unexpected error loading product pricing config:', err);
      }
    };

    fetchProductConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlProductId]);

  // Fetch aspect ratios and sizes when template is selected
  useEffect(() => {
    const fetchSizeOptions = async () => {
      if (!selectedTemplate) return;

      try {
        // Map template aspectRatio to database label
        const aspectRatioLabelMap: Record<string, string> = {
          '1:1': '1:1 Square',
          '2:3': '2:3 Portrait',
          '3:2': '3:2 Landscape',
        };

        const aspectRatioLabel =
          aspectRatioLabelMap[selectedTemplate.aspectRatio];

        // Fetch the matching aspect ratio from database
        const { data: ratioData, error: ratioError } = await supabase
          .from('aspect_ratios')
          .select('*')
          .eq('label', aspectRatioLabel)
          .eq('active', true)
          .single();

        if (ratioError) {
          console.error('Error fetching aspect ratio:', ratioError);
          return;
        }

        if (!ratioData) return;

        setAspectRatios([ratioData]);
        setSelectedAspectRatioId(ratioData.id);

        // Fetch sizes for this aspect ratio
        const { data: sizesData, error: sizesError } = await supabase
          .from('sizes')
          .select('*')
          .eq('aspect_ratio_id', ratioData.id)
          .eq('active', true)
          .order('area_in2');

        if (sizesError) {
          console.error('Error fetching sizes:', sizesError);
          return;
        }

        setSizes(sizesData || []);

        // Auto-select first size
        if (sizesData && sizesData.length > 0) {
          setSelectedSizeId(sizesData[0].id);
        }
      } catch (error) {
        console.error('Error in fetchSizeOptions:', error);
      }
    };

    fetchSizeOptions();
  }, [selectedTemplate]);

  const createPhotoFromFile = (file: File): Promise<CollagePhoto> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error(`${file.name} is not an image`));
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        reject(new Error('Image too large. Please use an image under 10MB.'));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () =>
        reject(new Error('Failed to read image file. Please try again.'));
      reader.onload = e => {
        if (!e.target?.result) {
          reject(new Error('No result from FileReader'));
          return;
        }

        const img = new Image();
        img.onerror = () =>
          reject(new Error('Failed to load image. Please try a different image.'));
        img.onload = () => {
          const photoId = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          resolve({
            id: photoId,
            instanceId: photoId,
            file,
            url: e.target?.result as string,
            rotation: 0,
            isPlaced: false,
            originalWidth: img.width,
            originalHeight: img.height,
          });
        };
        img.src = e.target.result as string;
      };

      try {
        reader.readAsDataURL(file);
      } catch {
        reject(new Error('Failed to read image file. Please try again.'));
      }
    });
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const filesToProcess = pendingSlotForModal ? [files[0]] : files;
    let successCount = 0;

    for (const file of filesToProcess) {
      try {
        const photo = await createPhotoFromFile(file);

        if (pendingSlotForModal && onPhotoSelectedForSlot) {
          setShowPhotoModal(false);
          onPhotoSelectedForSlot(photo, pendingSlotForModal);
          setPendingSlotForModal(null);
          successCount += 1;
          break;
        }

        setSelection(prev => ({
          ...prev,
          photos: [...prev.photos, photo],
        }));
        successCount += 1;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to process image. Please try again.'
        );
      }
    }

    if (!pendingSlotForModal && successCount > 0) {
      toast.success(
        successCount === 1
          ? '1 photo uploaded'
          : `${successCount} photos uploaded`
      );
    }
  };

  // Handle file upload - if there's a pending slot, trigger crop modal immediately
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    await processFiles(files);
    // Reset input to allow selecting the same file again
    event.target.value = '';
  };

  const uploadedPhotos = Array.from(
    new Map(selection.photos.map(p => [p.id, p])).values()
  );

  // Generate unique ID (mobile-compatible fallback)
  const generateUniqueId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for browsers that don't support crypto.randomUUID (some mobile browsers)
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle selecting existing photo
  const handleSelectExistingPhoto = (photoId: string) => {
    const existingPhoto = selection.photos.find(p => p.id === photoId);
    if (!existingPhoto) return;

    // Create a new instance with unplaced state
    const newInstance: CollagePhoto = {
      ...existingPhoto,
      instanceId: generateUniqueId(),
      isPlaced: false,
      x: undefined,
      y: undefined,
      width: undefined,
      height: undefined,
      slotId: undefined,
    };

    // If there's a pending slot, trigger placement flow
    if (pendingSlotForModal && onPhotoSelectedForSlot) {
      setShowPhotoModal(false);
      onPhotoSelectedForSlot(newInstance, pendingSlotForModal);
      setPendingSlotForModal(null);
    } else {
      // Otherwise just add to photos list
      setSelection(prev => ({
        ...prev,
        photos: [...prev.photos, newInstance],
      }));
      toast.success('Photo added! Drag it to the canvas.');
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: CollageTemplate) => {
    if (!template) return; // Should never happen since Blank Canvas is removed

    // Get canvas dimensions based on template's aspect ratio
    const newDimensions = getCanvasDimensionsFromAspectRatio(
      template.aspectRatio
    );

    // Check if user has placed photos on current template
    const hasPlacedPhotos = selection.photos.some(p => p.isPlaced);
    const placedCount = selection.photos.filter(p => p.isPlaced).length;

    // Check if selecting the same template that's already selected
    const isSameTemplate = template?.id === selectedTemplate?.id;

    if (
      hasPlacedPhotos &&
      selectedTemplate &&
      template?.id !== selectedTemplate.id
    ) {
      // Calculate unique photos count
      const uniqueCount = Array.from(
        new Map(selection.photos.map(p => [p.id, p])).values()
      ).length;

      // Show custom confirmation dialog
      setConfirmDialog({
        open: true,
        title: 'Changing Template',
        message: template.name,
        placedCount,
        uniqueCount,
        onConfirm: () => {
          // Deduplicate photos: keep only unique photos (by id), mark all as unplaced
          const uniquePhotos = Array.from(
            new Map(selection.photos.map(p => [p.id, p])).values()
          ).map(photo => ({
            ...photo,
            isPlaced: false,
            x: undefined,
            y: undefined,
            width: undefined,
            height: undefined,
            slotId: undefined,
            instanceId: photo.id, // Reset to original ID
          }));

          // Update template and canvas dimensions
          setSelection(prev => ({
            ...prev,
            templateId: template.id,
            canvasSizeId: newDimensions.label,
            canvasWidth: newDimensions.width,
            canvasHeight: newDimensions.height,
            photos: uniquePhotos,
          }));

          setSelectedTemplate(template);
          setHasSelectedTemplate(true);
          setConfirmDialog(prev => ({ ...prev, open: false }));
          setShowMobilePanel(false); // Close mobile panel after template change
          toast.info(
            `Template changed to ${newDimensions.label}! ${uniquePhotos.length} photo${uniquePhotos.length > 1 ? 's' : ''} ready to place.`
          );
        },
      });
    } else {
      // No placed photos or same template, just update
      setSelectedTemplate(template);
      setHasSelectedTemplate(true);

      // Update canvas dimensions if template changed
      if (!isSameTemplate) {
        setSelection(prev => ({
          ...prev,
          templateId: template.id,
          canvasSizeId: newDimensions.label,
          canvasWidth: newDimensions.width,
          canvasHeight: newDimensions.height,
        }));
      } else {
        setSelection(prev => ({
          ...prev,
          templateId: template.id,
        }));
      }

      // Close mobile panel when template is selected (even if same template)
      if (!isDesktop) {
        setShowMobilePanel(false);
        if (isSameTemplate) {
          toast.success(
            'Ready to design! Click + on canvas or upload photos from the bottom toolbar.'
          );
        }
      }
    }
  };

  // Handle background change
  const handleBackgroundChange = (
    backgroundId: string,
    backgroundColor: string
  ) => {
    setSelection(prev => ({
      ...prev,
      backgroundId,
      backgroundColor,
    }));
  };

  // Handle photos change from editor
  const handlePhotosChange = (photos: CollagePhoto[]) => {
    setSelection(prev => ({
      ...prev,
      photos,
    }));
  };

  // Handle canvas update for 3D preview
  const handleCanvasUpdate = (dataURL: string) => {
    setCollageDataURL(dataURL);
  };

  // Handle Next button - upload collage and navigate to 3D view
  const handleNext = async () => {
    if (selection.photos.length === 0) {
      toast.error('Please add at least one photo');
      return;
    }

    if (!collageDataURL) {
      toast.error('Please wait for collage to render');
      return;
    }

    if (!selectedAspectRatioId) {
      toast.error('Please select a template first');
      return;
    }

    setLoading(true);

    try {
      // Upload collage image to storage
      toast.info('Uploading your collage...');
      const publicUrl = await uploadDataURLToStorage(
        collageDataURL,
        'collages',
        `collage-${Date.now()}.png`
      );

      if (!publicUrl) {
        throw new Error('Failed to upload collage image');
      }

      toast.success('Collage uploaded!');

      // Extract hex color from rgba background color for canvas sides
      // selection.backgroundColor is in format: rgba(r, g, b, a) or #hex
      let hexColor = '#ffffff'; // Default to white
      if (selection.backgroundColor) {
        if (selection.backgroundColor.startsWith('rgba')) {
          // Extract RGB values from rgba string
          const match = selection.backgroundColor.match(
            /rgba?\((\d+),\s*(\d+),\s*(\d+)/
          );
          if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          }
        } else if (selection.backgroundColor.startsWith('#')) {
          hexColor = selection.backgroundColor;
        }
      }

      // Navigate to Product3DView with storage URL and aspect ratio
      const params = new URLSearchParams({
        image: encodeURIComponent(publicUrl),
        width: selection.canvasWidth.toString(),
        height: selection.canvasHeight.toString(),
        productId: urlProductId || COLLAGE_CANVAS_PRODUCT.id, // Use URL productId if provided, otherwise default
        productName: encodeURIComponent('Photo Collage on Canvas'),
        aspectRatioId: selectedAspectRatioId, // Pass the specific aspect ratio
        wrapImage: 'false', // Collages should not wrap - use solid color sides
        sideColor: encodeURIComponent(hexColor), // Pass the background color for canvas sides
      });

      navigate(`/customize/product-3d-view?${params.toString()}`);
    } catch (error) {
      console.error('Failed to process collage:', error);
      toast.error('Failed to upload collage. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle size selection change
  const handleSizeChange = (sizeId: string) => {
    setSelectedSizeId(sizeId);
  };

  // Fallback rate used when the admin hasn't set an explicit price for a size.
  // Kept for backwards-compatibility so the flow never renders £0.00.
  const FALLBACK_PRICE_PER_SQ_IN = 0.15;

  /**
   * Resolve a numeric price for a given size. Prefers `products.config.sizePrices`
   * (admin-configured GBP price), falls back to the per-sq-inch rate so legacy
   * products without admin pricing still work.
   */
  const resolveSizePrice = (size: { id: string; area_in2: number }): number => {
    const fromConfig = productSizePrices[size.id];
    if (typeof fromConfig === 'number' && fromConfig > 0) {
      return fromConfig;
    }
    return size.area_in2 * FALLBACK_PRICE_PER_SQ_IN;
  };

  // Calculate price based on selected size
  const calculatePrice = (): string => {
    if (!selectedSizeId) return '0.00';
    const selectedSize = sizes.find(s => s.id === selectedSizeId);
    if (!selectedSize) return '0.00';
    return resolveSizePrice(selectedSize).toFixed(2);
  };

  // Confirm size and add to cart
  const handleConfirmSizeAndAddToCart = async () => {
    if (!selectedSizeId) {
      toast.error('Please select a canvas size');
      return;
    }

    const selectedSize = sizes.find(s => s.id === selectedSizeId);
    if (!selectedSize) {
      toast.error('Invalid size selection');
      return;
    }

    setLoading(true);

    try {
      await addToCart({
        id: `collage-${Date.now()}`,
        name: 'Photo Collage on Canvas',
        price: parseFloat(calculatePrice()),
        image: collageDataURL || '/placeholder.jpg',
        size: selectedSize.display_label,
        quantity: 1,
      });

      clearCollageSession();
      toast.success('Collage added to cart!');
      openCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  // Get selected size for display
  const selectedSize = sizes.find(s => s.id === selectedSizeId);
  const selectedAspectRatio = aspectRatios.find(
    r => r.id === selectedAspectRatioId
  );

  // Prevent hydration mismatch - don't render until mounted
  if (!isMounted) {
    return (
      <div className='h-screen bg-gray-50 flex items-center justify-center'>
        <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
      </div>
    );
  }

  // SIZE SELECTION VIEW (shown after clicking Next)
  if (showSizeSelection && collageDataURL) {
    return (
      <div className="h-screen bg-white font-['Mona_Sans',_sans-serif] overflow-hidden">
        <div className='w-full h-screen flex flex-col'>
          {/* Header */}
          <header className='h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0'>
            <div className='flex items-center gap-4'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowSizeSelection(false)}
                className='text-gray-600 hover:text-gray-900'
              >
                <ArrowLeft className='w-4 h-4 mr-2' />
                Back to Editor
              </Button>

              <div className='h-8 w-px bg-gray-200' />

              <div>
                <h1 className='text-sm font-semibold text-gray-900'>
                  Select Canvas Size
                </h1>
                <p className='text-xs text-gray-500'>
                  {selectedTemplate?.name} - {selectedAspectRatio?.label}
                </p>
              </div>
            </div>

            <Button
              onClick={handleConfirmSizeAndAddToCart}
              disabled={!selectedSizeId || loading}
              className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
            >
              {loading ? (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              ) : (
                <ShoppingCart className='w-4 h-4 mr-2' />
              )}
              Add to Cart
            </Button>
          </header>

          <div className='flex-1 flex overflow-hidden'>
            {/* LEFT - 3D Preview */}
            <div className='flex-[3] bg-gray-50 relative h-full flex items-center justify-center'>
              <div className='w-full h-full'>
                <Room3DPreview
                  canvasMesh={
                    <CollageMesh
                      imageUrl={collageDataURL}
                      width={selectedSize?.width_in || selection.canvasWidth}
                      height={selectedSize?.height_in || selection.canvasHeight}
                    />
                  }
                  canvasWidth={selectedSize?.width_in || selection.canvasWidth}
                  canvasHeight={
                    selectedSize?.height_in || selection.canvasHeight
                  }
                  showRuler={showRuler}
                />
              </div>

              {/* Ruler Toggle */}
              <button
                onClick={() => setShowRuler(!showRuler)}
                className='absolute bottom-4 left-4 px-4 py-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2'
              >
                <RulerIcon className='w-4 h-4' />
                <span className='text-sm font-medium'>
                  {showRuler ? 'Hide' : 'Show'} Dimensions
                </span>
              </button>
            </div>

            {/* RIGHT - Size Selection Panel */}
            <div className='flex-[2] h-full overflow-y-auto bg-white p-4 border-l border-gray-200'>
              <div className='max-w-2xl mx-auto'>
                {/* Size List */}
                <div className='space-y-6 mb-8'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                      Available Sizes - {selectedAspectRatio?.label}
                    </h3>
                    <div className='space-y-3'>
                      {sizes.map(size => {
                        const isSelected = selectedSizeId === size.id;
                        const priceValue = resolveSizePrice(size);
                        const price = priceValue.toFixed(2);
                        // "Original" (pre-discount) price is a 10%-off presentation flourish
                        // relative to whichever price source we actually used.
                        const originalPrice = (priceValue * 1.11).toFixed(2);

                        return (
                          <button
                            key={size.id}
                            className={`w-full px-6 py-4 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? 'border-[#f63a9e] bg-pink-50'
                                : 'border-gray-200 hover:border-[#f63a9e] hover:bg-pink-50'
                            }`}
                            onClick={() => handleSizeChange(size.id)}
                          >
                            <div className='flex items-center justify-between'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-3 mb-1'>
                                  <span
                                    className={`text-lg font-semibold ${isSelected ? 'text-[#f63a9e]' : 'text-gray-900'}`}
                                  >
                                    {size.display_label}
                                  </span>
                                  <span className='bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded'>
                                    Save 10%
                                  </span>
                                </div>
                                <p className='text-sm text-gray-500'>
                                  {size.area_in2} sq in
                                </p>
                              </div>
                              <div className='text-right'>
                                <div className='text-2xl font-bold text-[#f63a9e]'>
                                  £{price}
                                </div>
                                <div className='text-sm text-gray-400 line-through'>
                                  £{originalPrice}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Canvas Price Summary */}
                {selectedSizeId && (
                  <div className='bg-green-50 border border-green-200 rounded-xl p-6 mb-6'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-green-500 flex items-center justify-center'>
                          <span className='text-white font-bold text-lg'>
                            ✓
                          </span>
                        </div>
                        <div>
                          <span className='text-lg font-semibold text-gray-900'>
                            Canvas Price
                          </span>
                          <p className='text-sm text-gray-600'>
                            {selectedSize?.display_label}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='text-2xl font-bold text-[#f63a9e]'>
                          £{calculatePrice()}
                        </div>
                        <div className='text-sm text-gray-500 line-through'>
                          £
                          {selectedSize
                            ? (resolveSizePrice(selectedSize) * 1.11).toFixed(2)
                            : '0.00'}
                        </div>
                        <div className='text-xs text-green-600 font-semibold'>
                          Save 10%
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className='bg-blue-50 border border-blue-200 rounded-xl p-4'>
                  <p className='text-sm text-blue-900'>
                    <strong>Note:</strong> All collage canvases are printed on
                    premium canvas with 1.7&quot; bleed for edge wrapping.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='h-screen flex flex-col bg-gray-50'>
      {/* Start Over confirmation dialog */}
      <AlertDialog open={showStartOverDialog} onOpenChange={setShowStartOverDialog}>
        <AlertDialogContent className='max-w-sm rounded-2xl p-0 overflow-hidden'>
          <div className='h-2 bg-gradient-to-r from-red-400 to-orange-400' />
          <div className='px-6 pt-5 pb-6'>
            <AlertDialogHeader className='space-y-2'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0'>
                  <RotateCcw className='w-5 h-5 text-red-500' />
                </div>
                <AlertDialogTitle className="font-['Bricolage_Grotesque',_sans-serif] text-lg text-gray-900" style={{ fontWeight: '700' }}>
                  Start over?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className='text-sm text-gray-500 leading-relaxed pl-[52px]'>
                This will clear your template, all uploaded photos, and background settings. You&apos;ll be taken back to the template selection screen. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className='flex-col sm:flex-row gap-2 mt-5'>
              <AlertDialogCancel className='w-full sm:w-auto rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium'>
                Keep my collage
              </AlertDialogCancel>
              <AlertDialogAction
                className='w-full sm:w-auto rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md shadow-red-200/50'
                onClick={() => {
                  clearCollageSession();
                  setSelection({
                    templateId: null,
                    canvasSizeId: defaultDimensions.label,
                    canvasWidth: defaultDimensions.width,
                    canvasHeight: defaultDimensions.height,
                    backgroundId: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    photos: [],
                  });
                  setSelectedTemplate(null);
                  setHasSelectedTemplate(false);
                  setCollageDataURL(null);
                  setSelectedSizeId(null);
                  setSelectedAspectRatioId(null);
                  setSizes([]);
                  setAspectRatios([]);
                  setShowSizeSelection(false);
                }}
              >
                Yes, start over
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave confirmation dialog */}
      <AlertDialog open={showBackDialog} onOpenChange={setShowBackDialog}>
        <AlertDialogContent className='max-w-sm rounded-2xl p-0 overflow-hidden'>
          <div className='h-2 bg-gradient-to-r from-[#f63a9e] to-purple-500' />
          <div className='px-6 pt-5 pb-6'>
            <AlertDialogHeader className='space-y-2'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0'>
                  <Home className='w-5 h-5 text-[#f63a9e]' />
                </div>
                <AlertDialogTitle className="font-['Bricolage_Grotesque',_sans-serif] text-lg text-gray-900" style={{ fontWeight: '700' }}>
                  Leave the collage editor?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className='text-sm text-gray-500 leading-relaxed pl-[52px]'>
                Your template choice, photos, and background colour are automatically saved. You can come back and continue right where you left off — or use the
                {' '}<span className='font-medium text-gray-700'>Start over</span> button to begin fresh.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className='flex-col sm:flex-row gap-2 mt-5'>
              <AlertDialogCancel className='w-full sm:w-auto rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium'>
                Keep editing
              </AlertDialogCancel>
              <AlertDialogAction
                className='w-full sm:w-auto rounded-xl bg-[#f63a9e] hover:bg-[#e02d8d] text-white font-semibold shadow-md shadow-pink-200/50'
                onClick={() => navigate(-1)}
              >
                Yes, go back
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Top Header - Canva Style - Responsive */}
      <header className='h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-2 md:px-4 shrink-0'>
        <div className='flex items-center gap-2 md:gap-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => hasSelectedTemplate ? setShowBackDialog(true) : navigate(-1)}
            className='text-gray-600 hover:text-gray-900 h-8 md:h-9 px-2 md:px-3'
          >
            <Home className='w-4 h-4 md:mr-2' />
            <span className='hidden md:inline'>Home</span>
          </Button>

          <div className='hidden md:block h-8 w-px bg-gray-200' />

          <div>
            <h1 className='text-xs md:text-sm font-semibold text-gray-900 truncate max-w-[120px] md:max-w-none'>
              Untitled Collage
            </h1>
            <p className='text-[10px] md:text-xs text-gray-500'>
              Ratio {selectedTemplate?.aspectRatio || '1:1'}
            </p>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className='hidden md:flex items-center gap-2'>
          {hasSelectedTemplate && (
            <Button
              variant='ghost'
              size='sm'
              title='Start over'
              onClick={() => setShowStartOverDialog(true)}
              className='text-gray-500 hover:text-red-600 hover:bg-red-50 h-8 md:h-9 px-2 md:px-3 transition-colors'
            >
              <RotateCcw className='w-4 h-4 md:mr-1.5' />
              <span className='hidden md:inline text-sm'>Start over</span>
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={
              selection.photos.length === 0 || loading || !collageDataURL
            }
            className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white px-8'
          >
            {loading ? <Loader2 className='w-4 h-4 mr-2 animate-spin' /> : null}
            Next
          </Button>
        </div>

        {/* Mobile Actions - Compact */}
        <div className='flex md:hidden items-center gap-1'>
          {hasSelectedTemplate && (
            <Button
              variant='ghost'
              size='sm'
              title='Start over'
              onClick={() => setShowStartOverDialog(true)}
              className='text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0 transition-colors'
            >
              <RotateCcw className='w-4 h-4' />
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={
              selection.photos.length === 0 || loading || !collageDataURL
            }
            className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-8 px-6'
          >
            {loading ? <Loader2 className='w-4 h-4 mr-1 animate-spin' /> : null}
            Next
          </Button>
        </div>
      </header>

      <div className='flex-1 flex overflow-hidden relative'>
        {/* Left Sidebar - Hidden on mobile, show as bottom nav instead */}
        <aside className='hidden md:flex w-20 bg-white border-r border-gray-200 flex-col items-center py-4 gap-2 shrink-0'>
          <button
            onClick={() => setActiveTab('templates')}
            className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'templates'
                ? 'bg-[#f63a9e]/10 text-[#f63a9e]'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutGrid className='w-5 h-5' />
            <span className='text-xs font-medium'>Template</span>
          </button>

          <button
            onClick={() => {
              if (hasSelectedTemplate) {
                setActiveTab('photos');
              } else {
                toast.error('Please select a template first');
              }
            }}
            disabled={!hasSelectedTemplate}
            className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${
              !hasSelectedTemplate
                ? 'opacity-40 cursor-not-allowed'
                : activeTab === 'photos'
                  ? 'bg-[#f63a9e]/10 text-[#f63a9e]'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className='w-5 h-5' />
            <span className='text-xs font-medium'>Photos</span>
          </button>

          <button
            onClick={() => {
              if (hasSelectedTemplate) {
                setActiveTab('background');
              } else {
                toast.error('Please select a template first');
              }
            }}
            disabled={!hasSelectedTemplate}
            className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${
              !hasSelectedTemplate
                ? 'opacity-40 cursor-not-allowed'
                : activeTab === 'background'
                  ? 'bg-[#f63a9e]/10 text-[#f63a9e]'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Palette className='w-5 h-5' />
            <span className='text-xs font-medium'>Settings</span>
          </button>
        </aside>

        {/* Overlay for mobile panel */}
        {showMobilePanel && hasSelectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobilePanel(false)}
            className='fixed inset-0 bg-black/50 z-30 md:hidden'
          />
        )}

        {/* Side Panel - Responsive: slide-out on mobile, fixed on desktop */}
        {hasSelectedTemplate && (showMobilePanel || isDesktop) && (
          <AnimatePresence mode='wait'>
            <motion.aside
              key={activeTab}
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className='w-[90vw] max-w-[340px] xs:w-[85vw] xs:max-w-sm md:w-80 bg-white border-r border-gray-200 overflow-y-auto shrink-0 fixed md:relative z-40 md:z-20 left-0 top-0 md:top-0 bottom-0 md:h-full shadow-2xl md:shadow-none'
            >
              {/* Mobile close button */}
              <div className='md:hidden sticky top-0 bg-white border-b border-gray-200 px-3 xs:px-4 py-2 xs:py-3 flex items-center justify-between z-10'>
                <h2 className='font-semibold text-gray-900 text-sm xs:text-base'>
                  {activeTab === 'templates' && 'Templates'}
                  {activeTab === 'photos' && 'Your Photos'}
                  {activeTab === 'background' && 'Settings'}
                </h2>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowMobilePanel(false)}
                  className='h-7 w-7 xs:h-8 xs:w-8 p-0'
                >
                  <X className='w-4 h-4 xs:w-5 xs:h-5' />
                </Button>
              </div>

              <div className='p-3 xs:p-4 md:p-6'>
                {/* Templates Tab */}
                {activeTab === 'templates' && (
                  <div className='space-y-3 xs:space-y-4'>
                    <div>
                      <h2 className='text-base xs:text-lg font-semibold text-gray-900 mb-1'>
                        Change Template
                      </h2>
                      <p className='text-xs xs:text-sm text-gray-600'>
                        Select a different layout
                      </p>
                    </div>
                    <TemplateSelector
                      selectedTemplate={selectedTemplate}
                      onSelectTemplate={handleTemplateSelect}
                    />
                  </div>
                )}

                {/* Photos Tab */}
                {activeTab === 'photos' && (
                  <div className='space-y-3 xs:space-y-4'>
                    <div>
                      <h2 className='text-base xs:text-lg font-semibold text-gray-900 mb-1'>
                        Your Photos
                      </h2>
                      <p className='text-xs xs:text-sm text-gray-600'>
                        Upload and manage your photos
                      </p>
                    </div>

                    {/* Upload Button */}
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-9 xs:h-10 text-sm xs:text-base'
                    >
                      <Upload className='w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5 xs:mr-2' />
                      Upload Photos
                    </Button>

                    {/* Photo Grid */}
                    {selection.photos.length > 0 ? (
                      <>
                        {/* Stats - Mobile Responsive */}
                        <div className='bg-gray-50 rounded-lg p-2 md:p-3 text-xs md:text-sm'>
                          <div className='flex flex-col md:flex-row gap-1 md:gap-0 md:justify-between text-gray-600'>
                            <span>
                              Unique Photos:{' '}
                              {
                                Array.from(
                                  new Set(selection.photos.map(p => p.id))
                                ).length
                              }
                            </span>
                            <span>
                              Total Placed:{' '}
                              {selection.photos.filter(p => p.isPlaced).length}
                            </span>
                          </div>
                        </div>

                        <div className='grid grid-cols-2 gap-2 md:gap-3'>
                          {/* Show only unique photos, deduplicated by photo.id */}
                          {Array.from(
                            new Map(
                              selection.photos.map(p => [p.id, p])
                            ).values()
                          ).map(photo => {
                            // Count how many times this photo is placed
                            const placedCount = selection.photos.filter(
                              p => p.id === photo.id && p.isPlaced
                            ).length;

                            return (
                              <div
                                key={photo.id}
                                draggable
                                onDragStart={e => {
                                  e.dataTransfer.setData('photoId', photo.id);
                                  e.dataTransfer.effectAllowed = 'copy';
                                }}
                                className='relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 transition-all cursor-move border-gray-200 hover:border-[#f63a9e] hover:shadow-lg'
                              >
                                <img
                                  src={photo.url}
                                  alt='Photo'
                                  className='w-full h-full object-cover pointer-events-none'
                                />

                                {/* Placed count indicator - Touch friendly */}
                                {placedCount > 0 && (
                                  <div className='absolute top-1.5 md:top-2 left-1.5 md:left-2 bg-green-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-medium shadow-lg'>
                                    ✓ {placedCount}x
                                  </div>
                                )}

                                {/* Delete button - Always visible on mobile, hover on desktop */}
                                <button
                                  onClick={() => {
                                    // Remove all instances of this photo (both original and placed copies)
                                    setSelection(prev => ({
                                      ...prev,
                                      photos: prev.photos.filter(
                                        p => p.id !== photo.id
                                      ),
                                    }));
                                    toast.success('Photo removed');
                                  }}
                                  className='absolute top-1 md:top-1 right-1 md:right-1 w-6 h-6 md:w-6 md:h-6 bg-red-500 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center z-10'
                                  title='Remove photo and all placements'
                                >
                                  <X className='w-3 md:w-4 h-3 md:h-4' />
                                </button>

                                {/* Drag hint - Hidden on mobile, show on desktop hover */}
                                <div className='hidden md:block absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                  <p className='text-white text-xs text-center font-medium'>
                                    {placedCount > 0
                                      ? 'Drag again to reuse'
                                      : 'Drag to canvas'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className='text-center py-12 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
                        <ImageIcon className='w-12 h-12 mx-auto mb-3 opacity-50' />
                        <p className='text-sm'>No photos uploaded yet</p>
                        <p className='text-xs mt-1'>
                          Click &quot;Upload Photos&quot; above to add images
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Background Tab */}
                {activeTab === 'background' && (
                  <div className='space-y-3 xs:space-y-4'>
                    <div>
                      <h2 className='text-base xs:text-lg font-semibold text-gray-900 mb-1'>
                        Background Color
                      </h2>
                      <p className='text-xs xs:text-sm text-gray-600'>
                        Customize your collage background
                      </p>
                    </div>

                    <div className='space-y-3 xs:space-y-4'>
                      {/* Document Colors */}
                      <div>
                        <Label className='text-xs font-medium text-gray-700 mb-2 xs:mb-3 block'>
                          Document colors
                        </Label>
                        <div className='flex items-center gap-1.5 xs:gap-2 flex-wrap'>
                          {/* Color Picker Button */}
                          <button
                            onClick={() => {
                              if (!showColorPicker) {
                                // Convert current hex to HSL when opening picker
                                const hexToHSL = (hex: string) => {
                                  const result =
                                    /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
                                      hex
                                    );
                                  if (!result) return { h: 0, s: 0, l: 100 };
                                  const r = parseInt(result[1], 16) / 255;
                                  const g = parseInt(result[2], 16) / 255;
                                  const b = parseInt(result[3], 16) / 255;
                                  const max = Math.max(r, g, b);
                                  const min = Math.min(r, g, b);
                                  let h = 0,
                                    s = 0,
                                    // eslint-disable-next-line prefer-const
                                    l = (max + min) / 2;
                                  if (max !== min) {
                                    const d = max - min;
                                    s =
                                      l > 0.5
                                        ? d / (2 - max - min)
                                        : d / (max + min);
                                    switch (max) {
                                      case r:
                                        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                                        break;
                                      case g:
                                        h = ((b - r) / d + 2) / 6;
                                        break;
                                      case b:
                                        h = ((r - g) / d + 4) / 6;
                                        break;
                                    }
                                  }
                                  return {
                                    h: Math.round(h * 360),
                                    s: Math.round(s * 100),
                                    l: Math.round(l * 100),
                                  };
                                };
                                setColorHSL(hexToHSL(customHexColor));
                              }
                              setShowColorPicker(!showColorPicker);
                            }}
                            className={`w-9 h-9 xs:w-10 xs:h-10 rounded-full border-3 shadow-md hover:shadow-lg flex items-center justify-center relative overflow-hidden transition-all hover:scale-105 ${
                              showColorPicker
                                ? 'border-[#f63a9e] scale-110'
                                : 'border-white'
                            }`}
                            style={{
                              background:
                                'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #ffd200 100%)',
                            }}
                          >
                            <div className='absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm'>
                              <svg
                                className='w-5 h-5 text-white drop-shadow-lg'
                                fill='none'
                                strokeWidth='3'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  d='M12 4v16m8-8H4'
                                />
                              </svg>
                            </div>
                          </button>

                          {/* Preset Colors */}
                          {DEFAULT_COLLAGE_CONFIG.allowedBackgrounds.map(bg => (
                            <button
                              key={bg.id}
                              onClick={() => {
                                setCustomHexColor(bg.value);

                                // Apply color with current opacity
                                const rgb = bg.value.match(
                                  /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
                                );
                                if (rgb) {
                                  const r = parseInt(rgb[1], 16);
                                  const g = parseInt(rgb[2], 16);
                                  const b = parseInt(rgb[3], 16);
                                  const rgba = `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
                                  handleBackgroundChange(bg.id, rgba);
                                } else {
                                  handleBackgroundChange(bg.id, bg.value);
                                }

                                // Update HSL state for picker position
                                const hexToHSL = (hex: string) => {
                                  const result =
                                    /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
                                      hex
                                    );
                                  if (!result) return { h: 0, s: 0, l: 100 };
                                  const r = parseInt(result[1], 16) / 255;
                                  const g = parseInt(result[2], 16) / 255;
                                  const b = parseInt(result[3], 16) / 255;
                                  const max = Math.max(r, g, b);
                                  const min = Math.min(r, g, b);
                                  let h = 0,
                                    s = 0,
                                    // eslint-disable-next-line prefer-const
                                    l = (max + min) / 2;
                                  if (max !== min) {
                                    const d = max - min;
                                    s =
                                      l > 0.5
                                        ? d / (2 - max - min)
                                        : d / (max + min);
                                    switch (max) {
                                      case r:
                                        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                                        break;
                                      case g:
                                        h = ((b - r) / d + 2) / 6;
                                        break;
                                      case b:
                                        h = ((r - g) / d + 4) / 6;
                                        break;
                                    }
                                  }
                                  return {
                                    h: Math.round(h * 360),
                                    s: Math.round(s * 100),
                                    l: Math.round(l * 100),
                                  };
                                };
                                setColorHSL(hexToHSL(bg.value));
                                setShowColorPicker(false);
                              }}
                              className={`w-9 h-9 xs:w-10 xs:h-10 rounded-full border-3 transition-all ${
                                selection.backgroundId === bg.id &&
                                selection.backgroundColor === bg.value &&
                                !showColorPicker
                                  ? 'border-[#f63a9e] scale-110 shadow-lg'
                                  : 'border-white shadow-md hover:scale-105'
                              }`}
                              style={{ backgroundColor: bg.value }}
                              title={bg.name}
                            />
                          ))}

                          {/* Show custom color if it's different from presets */}
                          {customHexColor &&
                            !DEFAULT_COLLAGE_CONFIG.allowedBackgrounds.some(
                              bg =>
                                bg.value.toLowerCase() ===
                                customHexColor.toLowerCase()
                            ) &&
                            selection.backgroundId === 'custom' &&
                            !showColorPicker && (
                              <button
                                onClick={() =>
                                  handleBackgroundChange(
                                    'custom',
                                    customHexColor
                                  )
                                }
                                className='w-9 h-9 xs:w-10 xs:h-10 rounded-full border-3 border-[#f63a9e] scale-110 shadow-lg'
                                style={{ backgroundColor: customHexColor }}
                                title={customHexColor}
                              />
                            )}
                        </div>
                      </div>

                      {/* Inline Color Picker - Single Zone with All Colors */}
                      {showColorPicker && (
                        <div className='space-y-2.5 xs:space-y-3 pt-1.5 xs:pt-2 animate-in fade-in slide-in-from-top-2 duration-200'>
                          {/* Full Spectrum Color Picker */}
                          <div
                            onMouseDown={e => {
                              const gradientElement = e.currentTarget; // Capture element reference

                              const hslToHex = (
                                h: number,
                                s: number,
                                l: number
                              ) => {
                                l /= 100;
                                const a = (s * Math.min(l, 1 - l)) / 100;
                                const f = (n: number) => {
                                  const k = (n + h / 30) % 12;
                                  const color =
                                    l -
                                    a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                                  return Math.round(255 * color)
                                    .toString(16)
                                    .padStart(2, '0');
                                };
                                return `#${f(0)}${f(8)}${f(4)}`;
                              };

                              const updateColor = (
                                clientX: number,
                                clientY: number
                              ) => {
                                const rect =
                                  gradientElement.getBoundingClientRect();
                                const x = clientX - rect.left;
                                const y = clientY - rect.top;

                                // Calculate hue from x position (full spectrum 0-360)
                                const hue = Math.max(
                                  0,
                                  Math.min(
                                    360,
                                    Math.round((x / rect.width) * 360)
                                  )
                                );

                                // Calculate lightness from y position (100% at top to 0% at bottom)
                                const lightness = Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    Math.round(100 - (y / rect.height) * 100)
                                  )
                                );

                                // Use full saturation for vibrant colors
                                const saturation = 100;

                                const newColor = hslToHex(
                                  hue,
                                  saturation,
                                  lightness
                                );
                                setCustomHexColor(newColor);
                                setColorHSL({
                                  h: hue,
                                  s: saturation,
                                  l: lightness,
                                });

                                // Apply color with current opacity
                                const rgb = newColor.match(
                                  /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
                                );
                                if (rgb) {
                                  const r = parseInt(rgb[1], 16);
                                  const g = parseInt(rgb[2], 16);
                                  const b = parseInt(rgb[3], 16);
                                  const rgba = `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
                                  handleBackgroundChange('custom', rgba);
                                } else {
                                  handleBackgroundChange('custom', newColor);
                                }
                              };

                              updateColor(e.clientX, e.clientY);

                              const handleMouseMove = (
                                moveEvent: MouseEvent
                              ) => {
                                updateColor(
                                  moveEvent.clientX,
                                  moveEvent.clientY
                                );
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener(
                                  'mousemove',
                                  handleMouseMove
                                );
                                document.removeEventListener(
                                  'mouseup',
                                  handleMouseUp
                                );
                              };

                              document.addEventListener(
                                'mousemove',
                                handleMouseMove
                              );
                              document.addEventListener(
                                'mouseup',
                                handleMouseUp
                              );
                            }}
                            className='relative w-full h-40 xs:h-44 sm:h-48 rounded-lg xs:rounded-xl cursor-crosshair overflow-hidden shadow-md border-2 border-white'
                            style={{
                              background: `
                                linear-gradient(to bottom, 
                                  rgba(255, 255, 255, 1) 0%,
                                  rgba(255, 255, 255, 0) 50%,
                                  rgba(0, 0, 0, 1) 100%
                                ),
                                linear-gradient(to right,
                                  hsl(0, 100%, 50%) 0%,
                                  hsl(60, 100%, 50%) 17%,
                                  hsl(120, 100%, 50%) 33%,
                                  hsl(180, 100%, 50%) 50%,
                                  hsl(240, 100%, 50%) 67%,
                                  hsl(300, 100%, 50%) 83%,
                                  hsl(360, 100%, 50%) 100%
                                )
                              `,
                              backgroundBlendMode: 'normal',
                            }}
                          >
                            <div
                              className='absolute w-5 h-5 xs:w-6 xs:h-6 rounded-full border-[3px] border-white shadow-lg cursor-grab active:cursor-grabbing'
                              style={{
                                left: `${(colorHSL.h / 360) * 100}%`,
                                top: `${100 - colorHSL.l}%`,
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: 'transparent',
                                boxShadow:
                                  '0 0 0 1.5px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.2), inset 0 0 0 2px white',
                              }}
                              onMouseDown={e => {
                                e.stopPropagation();
                                const gradientEl =
                                  e.currentTarget.parentElement;
                                if (!gradientEl) return;

                                const hslToHex = (
                                  h: number,
                                  s: number,
                                  l: number
                                ) => {
                                  l /= 100;
                                  const a = (s * Math.min(l, 1 - l)) / 100;
                                  const f = (n: number) => {
                                    const k = (n + h / 30) % 12;
                                    const color =
                                      l -
                                      a *
                                        Math.max(Math.min(k - 3, 9 - k, 1), -1);
                                    return Math.round(255 * color)
                                      .toString(16)
                                      .padStart(2, '0');
                                  };
                                  return `#${f(0)}${f(8)}${f(4)}`;
                                };

                                const updateColor = (
                                  clientX: number,
                                  clientY: number
                                ) => {
                                  const rect =
                                    gradientEl.getBoundingClientRect();
                                  const x = clientX - rect.left;
                                  const y = clientY - rect.top;

                                  // Calculate hue from x position (full spectrum 0-360)
                                  const hue = Math.max(
                                    0,
                                    Math.min(
                                      360,
                                      Math.round((x / rect.width) * 360)
                                    )
                                  );

                                  // Calculate lightness from y position (100% at top to 0% at bottom)
                                  const lightness = Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      Math.round(100 - (y / rect.height) * 100)
                                    )
                                  );

                                  // Use full saturation for vibrant colors
                                  const saturation = 100;

                                  const newColor = hslToHex(
                                    hue,
                                    saturation,
                                    lightness
                                  );
                                  setCustomHexColor(newColor);
                                  setColorHSL({
                                    h: hue,
                                    s: saturation,
                                    l: lightness,
                                  });

                                  // Apply color with current opacity
                                  const rgb = newColor.match(
                                    /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
                                  );
                                  if (rgb) {
                                    const r = parseInt(rgb[1], 16);
                                    const g = parseInt(rgb[2], 16);
                                    const b = parseInt(rgb[3], 16);
                                    const rgba = `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
                                    handleBackgroundChange('custom', rgba);
                                  } else {
                                    handleBackgroundChange('custom', newColor);
                                  }
                                };

                                const handleMouseMove = (
                                  moveEvent: MouseEvent
                                ) => {
                                  updateColor(
                                    moveEvent.clientX,
                                    moveEvent.clientY
                                  );
                                };

                                const handleMouseUp = () => {
                                  document.removeEventListener(
                                    'mousemove',
                                    handleMouseMove
                                  );
                                  document.removeEventListener(
                                    'mouseup',
                                    handleMouseUp
                                  );
                                };

                                document.addEventListener(
                                  'mousemove',
                                  handleMouseMove
                                );
                                document.addEventListener(
                                  'mouseup',
                                  handleMouseUp
                                );
                              }}
                            >
                              <div
                                className='absolute inset-0 rounded-full'
                                style={{
                                  backgroundColor: customHexColor,
                                  margin: '3px',
                                }}
                              />
                            </div>
                          </div>

                          {/* Opacity Slider */}
                          <div className='relative'>
                            <Label className='text-xs font-medium text-gray-700 block mb-1.5 xs:mb-2'>
                              Opacity: {opacity}%
                            </Label>
                            <div
                              onMouseDown={e => {
                                const sliderElement = e.currentTarget;

                                const updateOpacity = (clientX: number) => {
                                  const rect =
                                    sliderElement.getBoundingClientRect();
                                  const x = clientX - rect.left;
                                  const newOpacity = Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      Math.round((x / rect.width) * 100)
                                    )
                                  );
                                  setOpacity(newOpacity);

                                  // Convert hex to rgba for background
                                  const rgb = customHexColor.match(
                                    /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
                                  );
                                  if (rgb) {
                                    const r = parseInt(rgb[1], 16);
                                    const g = parseInt(rgb[2], 16);
                                    const b = parseInt(rgb[3], 16);
                                    const rgba = `rgba(${r}, ${g}, ${b}, ${newOpacity / 100})`;
                                    handleBackgroundChange('custom', rgba);
                                  }
                                };

                                updateOpacity(e.clientX);

                                const handleMouseMove = (
                                  moveEvent: MouseEvent
                                ) => {
                                  updateOpacity(moveEvent.clientX);
                                };

                                const handleMouseUp = () => {
                                  document.removeEventListener(
                                    'mousemove',
                                    handleMouseMove
                                  );
                                  document.removeEventListener(
                                    'mouseup',
                                    handleMouseUp
                                  );
                                };

                                document.addEventListener(
                                  'mousemove',
                                  handleMouseMove
                                );
                                document.addEventListener(
                                  'mouseup',
                                  handleMouseUp
                                );
                              }}
                              className='relative w-full h-6 xs:h-7 rounded-full cursor-pointer border-2 border-white shadow-md overflow-hidden'
                              style={{
                                background: `
                                  linear-gradient(to right, 
                                    transparent 0%, 
                                    ${customHexColor} 100%
                                  ),
                                  repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 50% / 10px 10px
                                `,
                              }}
                            >
                              <div
                                className='absolute top-1/2 w-5 h-5 xs:w-6 xs:h-6 rounded-full border-[3px] border-white shadow-lg cursor-grab active:cursor-grabbing'
                                style={{
                                  left: `${opacity}%`,
                                  transform: 'translate(-50%, -50%)',
                                  backgroundColor: 'transparent',
                                  boxShadow:
                                    '0 0 0 1.5px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.2), inset 0 0 0 2px white',
                                }}
                                onMouseDown={e => {
                                  e.stopPropagation();
                                  const sliderEl =
                                    e.currentTarget.parentElement;
                                  if (!sliderEl) return;

                                  const updateOpacity = (clientX: number) => {
                                    const rect =
                                      sliderEl.getBoundingClientRect();
                                    const x = clientX - rect.left;
                                    const newOpacity = Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        Math.round((x / rect.width) * 100)
                                      )
                                    );
                                    setOpacity(newOpacity);

                                    // Convert hex to rgba for background
                                    const rgb = customHexColor.match(
                                      /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
                                    );
                                    if (rgb) {
                                      const r = parseInt(rgb[1], 16);
                                      const g = parseInt(rgb[2], 16);
                                      const b = parseInt(rgb[3], 16);
                                      const rgba = `rgba(${r}, ${g}, ${b}, ${newOpacity / 100})`;
                                      handleBackgroundChange('custom', rgba);
                                    }
                                  };

                                  const handleMouseMove = (
                                    moveEvent: MouseEvent
                                  ) => {
                                    updateOpacity(moveEvent.clientX);
                                  };

                                  const handleMouseUp = () => {
                                    document.removeEventListener(
                                      'mousemove',
                                      handleMouseMove
                                    );
                                    document.removeEventListener(
                                      'mouseup',
                                      handleMouseUp
                                    );
                                  };

                                  document.addEventListener(
                                    'mousemove',
                                    handleMouseMove
                                  );
                                  document.addEventListener(
                                    'mouseup',
                                    handleMouseUp
                                  );
                                }}
                              >
                                <div
                                  className='absolute inset-0 rounded-full'
                                  style={{
                                    backgroundColor: customHexColor,
                                    opacity: opacity / 100,
                                    margin: '3px',
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Hex Input */}
                          <div className='flex items-center gap-1.5 xs:gap-2'>
                            <div
                              className='w-9 h-9 xs:w-10 xs:h-10 rounded-full border-2 border-white shadow-md shrink-0'
                              style={{ backgroundColor: customHexColor }}
                            />
                            <input
                              type='text'
                              value={customHexColor}
                              onChange={e => {
                                const value = e.target.value;
                                setCustomHexColor(value);
                                if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                                  // Apply color with current opacity
                                  const rgb = value.match(
                                    /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
                                  );
                                  if (rgb) {
                                    const r = parseInt(rgb[1], 16);
                                    const g = parseInt(rgb[2], 16);
                                    const b = parseInt(rgb[3], 16);
                                    const rgba = `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
                                    handleBackgroundChange('custom', rgba);
                                  } else {
                                    handleBackgroundChange('custom', value);
                                  }

                                  // Update HSL state
                                  const hexToHSL = (hex: string) => {
                                    const result =
                                      /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
                                        hex
                                      );
                                    if (!result) return { h: 0, s: 0, l: 100 };
                                    const r = parseInt(result[1], 16) / 255;
                                    const g = parseInt(result[2], 16) / 255;
                                    const b = parseInt(result[3], 16) / 255;
                                    const max = Math.max(r, g, b);
                                    const min = Math.min(r, g, b);
                                    let h = 0,
                                      s = 0,
                                      // eslint-disable-next-line prefer-const
                                      l = (max + min) / 2;
                                    if (max !== min) {
                                      const d = max - min;
                                      s =
                                        l > 0.5
                                          ? d / (2 - max - min)
                                          : d / (max + min);
                                      switch (max) {
                                        case r:
                                          h =
                                            ((g - b) / d + (g < b ? 6 : 0)) / 6;
                                          break;
                                        case g:
                                          h = ((b - r) / d + 2) / 6;
                                          break;
                                        case b:
                                          h = ((r - g) / d + 4) / 6;
                                          break;
                                      }
                                    }
                                    return {
                                      h: Math.round(h * 360),
                                      s: Math.round(s * 100),
                                      l: Math.round(l * 100),
                                    };
                                  };
                                  setColorHSL(hexToHSL(value));
                                }
                              }}
                              className='flex-1 px-2.5 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f63a9e] focus:border-transparent font-mono bg-blue-50'
                              maxLength={7}
                              placeholder='#FFFFFF'
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          </AnimatePresence>
        )}

        {/* Hidden file input for uploads */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          multiple={!pendingSlotForModal}
          onChange={handleFileUpload}
          className='hidden'
        />

        {/* Main Area */}
        <main className='flex-1 flex flex-col bg-gray-50 overflow-hidden pb-16 md:pb-0'>
          {!hasSelectedTemplate ? (
            /* Template Selection Screen - Full Width - Mobile Responsive */
            <div className='flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 bg-gradient-to-br from-gray-50 to-gray-100'>
              <div className='max-w-7xl mx-auto'>
                <div className='mb-6 md:mb-12 text-center'>
                  <h1 className='text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 md:mb-4'>
                    Choose Your Collage Template
                  </h1>
                  <p className='text-sm md:text-lg lg:text-xl text-gray-600'>
                    Select a layout to start creating your perfect photo collage
                  </p>
                </div>

                {/* Template Grid - Mobile Responsive */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12'>
                  {PREDEFINED_TEMPLATES.map(template => (
                    <motion.button
                      key={template.id}
                      onClick={() => {
                        handleTemplateSelect(template);
                      }}
                      className='relative text-left rounded-xl md:rounded-2xl border-2 border-gray-200 hover:border-[#f63a9e] hover:shadow-xl transition-all overflow-hidden bg-white'
                      whileHover={{ scale: 1.03, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Template Preview - Match real collage aspect/shape */}
                      <div className='bg-white p-4 md:p-8 h-40 md:h-64 flex items-center justify-center'>
                        {template.type === 'grid' &&
                          (() => {
                            const { rows, columns } = template.config as any;
                            const previewAspectRatio =
                              template.aspectRatio === '2:3'
                                ? '2 / 3'
                                : template.aspectRatio === '3:2'
                                  ? '3 / 2'
                                  : '1 / 1';
                            const fitByHeight =
                              template.aspectRatio === '2:3' ||
                              template.aspectRatio === '1:1';

                            return (
                              <div
                                className='border border-gray-200 bg-gray-50 p-2 md:p-3'
                                style={{
                                  aspectRatio: previewAspectRatio,
                                  width: fitByHeight ? 'auto' : '100%',
                                  height: fitByHeight ? '100%' : 'auto',
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                }}
                              >
                                <div
                                  className='grid w-full h-full gap-1.5 md:gap-2'
                                  style={{
                                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                                  }}
                                >
                                  {Array.from({ length: rows * columns }).map(
                                    (_, i) => (
                                      <div
                                        key={i}
                                        className='bg-gradient-to-br from-pink-100 to-pink-200'
                                      />
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                      </div>

                      {/* Template Info - Responsive */}
                      <div className='px-4 md:px-6 py-3 md:py-5 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50'>
                        <div className='flex items-start justify-between gap-2 mb-1'>
                          <h3 className='font-bold text-base md:text-lg text-gray-900'>
                            {template.name}
                          </h3>
                          <span className='text-xs font-semibold text-[#f63a9e] bg-pink-50 px-2 py-1 rounded-full shrink-0'>
                            {template.aspectRatio}
                          </span>
                        </div>
                        {template.description && (
                          <p className='text-xs md:text-sm text-gray-600'>
                            {template.description}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Canvas Editor - Show after template selection */
            <div className='flex-1 overflow-hidden'>
              <CollageEditor
                width={selection.canvasWidth}
                height={selection.canvasHeight}
                backgroundColor={selection.backgroundColor}
                photos={selection.photos}
                template={selectedTemplate}
                onPhotosChange={handlePhotosChange}
                onCanvasUpdate={handleCanvasUpdate}
                onOpenPhotoModal={(slotInfo, photoSelectedCallback) => {
                  setPendingSlotForModal(slotInfo);
                  setOnPhotoSelectedForSlot(() => photoSelectedCallback);
                  setShowPhotoModal(true);
                }}
              />
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation - Only show when template is selected */}
        {hasSelectedTemplate && (
          <nav className='md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-pb'>
            <div className='grid grid-cols-3 gap-0.5 xs:gap-1 px-1 xs:px-2 py-1.5 xs:py-2'>
              <button
                onClick={() => {
                  setActiveTab('templates');
                  setShowMobilePanel(true);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 xs:gap-1 py-1.5 xs:py-2 rounded-md xs:rounded-lg transition-colors ${
                  activeTab === 'templates'
                    ? 'bg-[#f63a9e]/10 text-[#f63a9e]'
                    : 'text-gray-600'
                }`}
              >
                <LayoutGrid className='w-4 h-4 xs:w-5 xs:h-5' />
                <span className='text-[10px] xs:text-xs font-medium'>Template</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('photos');
                  setShowMobilePanel(true);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 xs:gap-1 py-1.5 xs:py-2 rounded-md xs:rounded-lg transition-colors ${
                  activeTab === 'photos'
                    ? 'bg-[#f63a9e]/10 text-[#f63a9e]'
                    : 'text-gray-600'
                }`}
              >
                <ImageIcon className='w-4 h-4 xs:w-5 xs:h-5' />
                <span className='text-[10px] xs:text-xs font-medium'>Photos</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('background');
                  setShowMobilePanel(true);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 xs:gap-1 py-1.5 xs:py-2 rounded-md xs:rounded-lg transition-colors ${
                  activeTab === 'background'
                    ? 'bg-[#f63a9e]/10 text-[#f63a9e]'
                    : 'text-gray-600'
                }`}
              >
                <Palette className='w-4 h-4 xs:w-5 xs:h-5' />
                <span className='text-[10px] xs:text-xs font-medium'>Settings</span>
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* Custom Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={open => setConfirmDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0'>
                <AlertTriangle className='w-6 h-6 text-amber-600' />
              </div>
              <DialogTitle className='text-xl'>
                {confirmDialog.title}
              </DialogTitle>
            </div>
            <DialogDescription className='text-base leading-relaxed pt-2'>
              You have{' '}
              <strong className='text-gray-900'>
                {confirmDialog.placedCount} photo
                {confirmDialog.placedCount > 1 ? 's' : ''}
              </strong>{' '}
              placed on the canvas.
              <br />
              Switching to{' '}
              <strong className='text-[#f63a9e]'>
                {confirmDialog.message}
              </strong>{' '}
              will remove them from the canvas.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-4'>
            <div className='bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2'>
              <Check className='w-5 h-5 text-green-600 shrink-0 mt-0.5' />
              <div>
                <p className='font-medium text-green-900 text-sm'>
                  Your photos will be kept
                </p>
                <p className='text-green-700 text-xs mt-0.5'>
                  All {confirmDialog.uniqueCount} uploaded photo
                  {confirmDialog.uniqueCount > 1 ? 's' : ''} will remain
                  available
                </p>
              </div>
            </div>

            <div className='bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2'>
              <X className='w-5 h-5 text-red-600 shrink-0 mt-0.5' />
              <div>
                <p className='font-medium text-red-900 text-sm'>
                  Photos will be removed from canvas
                </p>
                <p className='text-red-700 text-xs mt-0.5'>
                  You&apos;ll need to drag them onto the new template
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={() =>
                setConfirmDialog(prev => ({ ...prev, open: false }))
              }
              className='flex-1 sm:flex-none'
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDialog.onConfirm}
              className='flex-1 sm:flex-none bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Selection Modal */}
      <Dialog
        open={showPhotoModal}
        onOpenChange={open => {
          setShowPhotoModal(open);
          if (!open) setPendingSlotForModal(null);
        }}
      >
        <DialogContent className='sm:max-w-3xl max-h-[85vh]'>
          <DialogHeader>
            <DialogTitle className='text-2xl'>Add Photos</DialogTitle>
            <DialogDescription>
              {pendingSlotForModal
                ? 'Upload new photos or select from already uploaded ones to place on canvas'
                : 'Upload new photos or select from already uploaded ones'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6 py-4 overflow-y-auto max-h-[60vh]'>
            {/* Upload Section */}
            <div className='rounded-xl border border-gray-200 bg-white p-4 md:p-5'>
              <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg'>
                <Upload className='w-5 h-5 text-[#f63a9e]' />
                Upload New Photos
              </h3>
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={e => {
                  e.preventDefault();
                  setIsUploadDragActive(true);
                }}
                onDragOver={e => {
                  e.preventDefault();
                  setIsUploadDragActive(true);
                }}
                onDragLeave={e => {
                  e.preventDefault();
                  setIsUploadDragActive(false);
                }}
                onDrop={async e => {
                  e.preventDefault();
                  setIsUploadDragActive(false);
                  const files = Array.from(e.dataTransfer.files || []);
                  await processFiles(files);
                }}
                className={`w-full rounded-xl border-2 border-dashed p-5 md:p-7 transition-colors ${
                  isUploadDragActive
                    ? 'border-[#f63a9e] bg-pink-50'
                    : 'border-gray-300 hover:border-[#f63a9e] hover:bg-pink-50'
                }`}
                aria-label='Upload photos by clicking or dragging files'
              >
                <div className='flex flex-col items-center gap-3 text-center'>
                  <Upload
                    className={`w-9 h-9 ${isUploadDragActive ? 'text-[#f63a9e]' : 'text-gray-400'}`}
                  />
                  <div>
                    <p className='font-semibold text-gray-800'>
                      {isUploadDragActive ? 'Drop photos to upload' : 'Click to upload or drag and drop'}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>
                      PNG, JPG, WEBP up to 10MB each
                    </p>
                  </div>
                  <span className='inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600'>
                    Browse files
                  </span>
                </div>
              </button>
              {pendingSlotForModal && (
                <p className='text-xs text-[#f63a9e] mt-3 font-medium'>
                  Slot placement mode: the next uploaded photo opens crop for this selected slot.
                </p>
              )}
            </div>

            {/* Already Uploaded Section */}
            {uploadedPhotos.length > 0 && (
              <div className='rounded-xl border border-gray-200 bg-white p-4 md:p-5'>
                <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg'>
                  <ImageIcon className='w-5 h-5 text-[#f63a9e]' />
                  Choose from Uploaded Photos ({uploadedPhotos.length})
                </h3>
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                  {uploadedPhotos.map(photo => {
                    const placedCount = selection.photos.filter(
                      p => p.id === photo.id && p.isPlaced
                    ).length;
                    const totalCount = selection.photos.filter(
                      p => p.id === photo.id
                    ).length;

                    return (
                      <button
                        key={photo.id}
                        onClick={() => handleSelectExistingPhoto(photo.id)}
                        className='relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-[#f63a9e] hover:shadow-lg transition-all'
                      >
                        <img
                          src={photo.url}
                          alt='Photo'
                          className='w-full h-full object-cover'
                        />

                        {/* Usage indicator */}
                        <div className='absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg'>
                          {totalCount}x
                        </div>

                        {placedCount > 0 && (
                          <div className='absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg'>
                            ✓ {placedCount}
                          </div>
                        )}

                        {/* Overlay on hover */}
                        <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                          <div className='text-white text-center'>
                            <Check className='w-8 h-8 mx-auto mb-1' />
                            <p className='text-sm font-medium'>Select</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className='text-xs text-gray-500 mt-3'>
                  Click a photo to add it to your selection. You can use the
                  same photo multiple times.
                </p>
              </div>
            )}

            {/* Empty state */}
            {uploadedPhotos.length === 0 && (
              <div className='text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50'>
                <ImageIcon className='w-14 h-14 mx-auto mb-3 opacity-50' />
                <p className='text-sm font-medium'>No uploaded photos yet</p>
                <p className='text-xs mt-1'>Start by dragging files into the upload area above.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowPhotoModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
