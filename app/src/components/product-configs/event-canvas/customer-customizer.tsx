import { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { createClient } from '@/lib/supabase/client';
import {
  Upload,
  MessageCircle,
  Info,
  Loader2,
  ArrowLeft,
  ShoppingCart,
  Ruler,
  Eye,
  RotateCcw,
  LayoutGrid,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { uploadFileToStorage } from '@/lib/supabase/storage';
import { useCart } from '@/context/CartContext';
import {
  EVENT_CANVAS_PRODUCT,
  POSTER_SIZES,
  DEFAULT_POSTER_SIZE,
  WHATSAPP_DESIGN_SERVICE,
} from './config';
import type {
  EventCanvasStep,
  PosterSize,
  PosterUploadState,
} from './types';
import PosterEaselPreview from './poster-ease-ipreview.client';
import { TemplateGallery } from './template-gallery';
import { TemplateDesigner } from './template-designer';
import { getTemplateById, type EventCanvasTemplate } from './templates';

// Versioned key — bump if the persisted shape changes so stale data from a
// previous build doesn't drop the wizard onto a step that no longer has the
// data it needs.
const POSTER_SESSION_KEY = 'photify_event_canvas_state_v3';

interface PersistedState {
  step?: EventCanvasStep;
  templateId?: string | null;
  productId: string | null;
  imageUrl: string | null;
  posterWidth: number;
  posterHeight: number;
}

const EMPTY_PERSISTED: PersistedState = {
  productId: null,
  imageUrl: null,
  posterWidth: DEFAULT_POSTER_SIZE.width,
  posterHeight: DEFAULT_POSTER_SIZE.height,
};

function loadPersistedPosterState(): PersistedState {
  try {
    const raw = sessionStorage.getItem(POSTER_SESSION_KEY);
    if (!raw) return EMPTY_PERSISTED;
    const parsed = JSON.parse(raw);
    return {
      step: typeof parsed.step === 'string' ? parsed.step : undefined,
      templateId:
        typeof parsed.templateId === 'string' ? parsed.templateId : null,
      productId:
        typeof parsed.productId === 'string' ? parsed.productId : null,
      imageUrl: typeof parsed.imageUrl === 'string' ? parsed.imageUrl : null,
      posterWidth:
        typeof parsed.posterWidth === 'number'
          ? parsed.posterWidth
          : DEFAULT_POSTER_SIZE.width,
      posterHeight:
        typeof parsed.posterHeight === 'number'
          ? parsed.posterHeight
          : DEFAULT_POSTER_SIZE.height,
    };
  } catch {
    return EMPTY_PERSISTED;
  }
}

function clearPersistedPosterState() {
  try {
    sessionStorage.removeItem(POSTER_SESSION_KEY);
  } catch {
    /* noop */
  }
}

export function EventCanvasCustomizer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const artImageUrl = searchParams.get('artImageUrl')
    ? decodeURIComponent(searchParams.get('artImageUrl')!)
    : null;
  const artFixedPrice =
    parseFloat(searchParams.get('artFixedPrice') || '0') || 0;
  const artName = searchParams.get('artName')
    ? decodeURIComponent(searchParams.get('artName')!)
    : '';
  const productIdParam = searchParams.get('productId') ?? null;
  const supabase = createClient();
  const { addToCart } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [productPrice, setProductPrice] = useState(0.5);
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);
  const [activeTemplate, setActiveTemplate] =
    useState<EventCanvasTemplate | null>(null);

  const [state, setState] = useState<PosterUploadState>(() => {
    const persisted = loadPersistedPosterState();

    // artImageUrl (deep-link from art detail) jumps straight to size step.
    if (artImageUrl) {
      return {
        step: 'size',
        templateId: null,
        imageUrl: artImageUrl,
        imageFile: null,
        selectedSizeId: null,
        posterWidth: DEFAULT_POSTER_SIZE.width,
        posterHeight: DEFAULT_POSTER_SIZE.height,
        isUploading: false,
        uploadProgress: 0,
      };
    }

    // Only trust persisted progress when it belongs to this same product
    // session. This prevents an old design (or a stale broken-image URL) from
    // hijacking a fresh entry to the customizer.
    const sameProduct =
      !!persisted.productId && persisted.productId === productIdParam;

    if (!sameProduct) {
      // Different (or unknown) productId — clear any leftover state and let
      // the customer start at step 1.
      clearPersistedPosterState();
      return {
        step: 'choose',
        templateId: null,
        imageUrl: null,
        imageFile: null,
        selectedSizeId: null,
        posterWidth: DEFAULT_POSTER_SIZE.width,
        posterHeight: DEFAULT_POSTER_SIZE.height,
        isUploading: false,
        uploadProgress: 0,
      };
    }

    const restoredUrl = persisted.imageUrl;
    let restoredStep: EventCanvasStep = persisted.step ?? 'choose';

    if (restoredStep === 'size' && !restoredUrl) restoredStep = 'choose';
    if (restoredStep === 'design' && !persisted.templateId)
      restoredStep = 'choose';
    if (restoredStep === 'choose' && restoredUrl) restoredStep = 'size';

    return {
      step: restoredStep,
      templateId: persisted.templateId ?? null,
      imageUrl: restoredUrl,
      imageFile: null,
      selectedSizeId: null,
      posterWidth: restoredUrl
        ? persisted.posterWidth
        : DEFAULT_POSTER_SIZE.width,
      posterHeight: restoredUrl
        ? persisted.posterHeight
        : DEFAULT_POSTER_SIZE.height,
      isUploading: false,
      uploadProgress: 0,
    };
  });

  // After mount, validate that the persisted imageUrl actually loads. If it
  // 404s or otherwise fails, drop back to step 1 so the customer doesn't get
  // stranded on the size step with an empty 3D preview.
  useEffect(() => {
    if (state.step !== 'size' || !state.imageUrl || artImageUrl) return;
    const url = state.imageUrl;
    const probe = new Image();
    let cancelled = false;
    probe.onerror = () => {
      if (cancelled) return;
      clearPersistedPosterState();
      setState(prev => ({
        ...prev,
        step: 'choose',
        templateId: null,
        imageUrl: null,
        imageFile: null,
      }));
    };
    probe.src = url;
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore active template from persisted id when the wizard is on the design step.
  useEffect(() => {
    if (state.step === 'design' && state.templateId && !activeTemplate) {
      const t = getTemplateById(state.templateId);
      if (t) setActiveTemplate(t);
      else setState(prev => ({ ...prev, step: 'gallery', templateId: null }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.templateId]);

  // Persist enough state to survive a refresh — scoped to the current
  // productId so a different product entry won't pick up this design.
  useEffect(() => {
    try {
      // Don't persist while the wizard is still on step 1 with no progress.
      // This keeps a no-op visit from creating a record that would later be
      // mistaken for in-flight work.
      if (state.step === 'choose' && !state.imageUrl && !state.templateId) {
        sessionStorage.removeItem(POSTER_SESSION_KEY);
        return;
      }
      sessionStorage.setItem(
        POSTER_SESSION_KEY,
        JSON.stringify({
          productId: productIdParam,
          step: state.step,
          templateId: state.templateId,
          imageUrl: state.imageUrl,
          posterWidth: state.posterWidth,
          posterHeight: state.posterHeight,
        })
      );
    } catch {
      /* storage quota — ignore */
    }
  }, [
    productIdParam,
    state.step,
    state.templateId,
    state.imageUrl,
    state.posterWidth,
    state.posterHeight,
  ]);

  useEffect(() => {
    const fetchProductPrice = async () => {
      try {
        const { data: productData, error } = await supabase
          .from('products')
          .select('price')
          .eq('slug', EVENT_CANVAS_PRODUCT.slug)
          .single();

        if (!error && productData) {
          setProductPrice(productData.price);
        }
      } catch (error) {
        console.error('Error fetching product price:', error);
      }
    };

    fetchProductPrice();
  }, []);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size must be under 25MB');
      return;
    }

    const uploadToast = toast.loading('Uploading poster...');

    try {
      setState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }));

      const publicUrl = await uploadFileToStorage(file, 'poster-uploads');

      if (!publicUrl) {
        toast.error('Failed to upload poster. Please try again.', {
          id: uploadToast,
        });
        setState(prev => ({ ...prev, isUploading: false }));
        return;
      }

      setState(prev => ({
        ...prev,
        imageUrl: publicUrl,
        imageFile: file,
        isUploading: false,
        uploadProgress: 100,
        step: 'size',
        templateId: null,
      }));

      toast.success('Poster uploaded!', { id: uploadToast });

      // Detect aspect ratio in the background to auto-pick the closest size.
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;

        const img = new Image();
        img.onload = () => {
          const imageAspectRatio = img.width / img.height;

          let bestSize =
            POSTER_SIZES.find(s => s.recommended) || POSTER_SIZES[0];
          let smallestDiff = Math.abs(imageAspectRatio - bestSize.aspectRatio);

          POSTER_SIZES.forEach(size => {
            const diff = Math.abs(imageAspectRatio - size.aspectRatio);
            if (diff < smallestDiff) {
              smallestDiff = diff;
              bestSize = size;
            }
          });

          setState(prev => ({
            ...prev,
            posterWidth: bestSize.width,
            posterHeight: bestSize.height,
          }));
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload poster. Please try again.', {
        id: uploadToast,
      });
      setState(prev => ({ ...prev, isUploading: false }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handleSizeSelect = (size: PosterSize) => {
    setState(prev => ({
      ...prev,
      posterWidth: size.width,
      posterHeight: size.height,
    }));
    toast.success(`Size selected: ${size.label}`);
  };

  const calculateCanvasPrice = () =>
    state.posterWidth * state.posterHeight * productPrice;
  const calculatePrice = () =>
    (calculateCanvasPrice() + artFixedPrice).toFixed(2);

  const handleAddToCart = async () => {
    if (!state.imageUrl) {
      toast.error('Please add a design first');
      return;
    }

    try {
      const canvasPrice = calculateCanvasPrice();
      const totalPrice = parseFloat((canvasPrice + artFixedPrice).toFixed(2));
      const itemName = artName
        ? `${artName} — ${EVENT_CANVAS_PRODUCT.name} — ${state.posterWidth}" × ${state.posterHeight}"`
        : `${EVENT_CANVAS_PRODUCT.name} - ${state.posterWidth}" × ${state.posterHeight}"`;

      await addToCart({
        id: EVENT_CANVAS_PRODUCT.id,
        name: itemName,
        quantity: 1,
        price: totalPrice,
        image: state.imageUrl,
        size: `${state.posterWidth}" × ${state.posterHeight}"`,
      });

      clearPersistedPosterState();
      toast.success('Added to cart!');
      navigate('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleWhatsAppDesign = () => {
    const url = WHATSAPP_DESIGN_SERVICE.url();
    window.open(url, '_blank');
  };

  // ── Wizard navigation ─────────────────────────────────────────────────
  const goToStep = (step: EventCanvasStep) =>
    setState(prev => ({ ...prev, step }));

  const handleHeaderBack = () => {
    if (state.imageUrl && state.step === 'size') {
      setShowBackDialog(true);
      return;
    }

    switch (state.step) {
      case 'choose':
        navigate(-1);
        return;
      case 'upload':
      case 'gallery':
        goToStep('choose');
        return;
      case 'design':
        setActiveTemplate(null);
        setState(prev => ({ ...prev, step: 'gallery', templateId: null }));
        return;
      case 'size':
        // No image yet (e.g. art deep-link with empty state) — exit.
        navigate(-1);
        return;
    }
  };

  const handleStartOver = () => {
    clearPersistedPosterState();
    setActiveTemplate(null);
    setState(prev => ({
      ...prev,
      step: 'choose',
      templateId: null,
      imageUrl: null,
      imageFile: null,
      posterWidth: DEFAULT_POSTER_SIZE.width,
      posterHeight: DEFAULT_POSTER_SIZE.height,
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTemplateSelect = (template: EventCanvasTemplate) => {
    setActiveTemplate(template);
    setState(prev => ({
      ...prev,
      templateId: template.id,
      step: 'design',
    }));
  };

  const handleTemplateDone = (compositeUrl: string) => {
    setState(prev => ({
      ...prev,
      imageUrl: compositeUrl,
      imageFile: null,
      step: 'size',
      // keep templateId so a refresh on size step still knows the source.
    }));
  };

  const subtitle = (() => {
    switch (state.step) {
      case 'choose':
        return 'Step 1 of 3 · Choose how to start';
      case 'upload':
        return 'Step 2 of 3 · Upload your design';
      case 'gallery':
        return 'Step 2 of 3 · Pick a template';
      case 'design':
        return 'Step 2 of 3 · Personalise your design';
      case 'size':
        return 'Step 3 of 3 · Choose size';
    }
  })();

  // ── Render ────────────────────────────────────────────────────────────
  return (
    // Use a definite viewport height (h-[100dvh] handles mobile address bar)
    // so flex-1 children have something concrete to fill — without this,
    // percentage heights inside the size step collapse and the 3D preview
    // never expands to fill the left panel.
    <div className='h-[100dvh] overflow-hidden bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 flex flex-col'>
      {/* Start Over confirmation dialog */}
      <AlertDialog
        open={showStartOverDialog}
        onOpenChange={setShowStartOverDialog}
      >
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
                This will remove your design and size choices. You&apos;ll
                start fresh from the first step. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className='flex-col sm:flex-row gap-2 mt-5'>
              <AlertDialogCancel className='w-full sm:w-auto rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium'>
                Keep my design
              </AlertDialogCancel>
              <AlertDialogAction
                className='w-full sm:w-auto rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md shadow-red-200/50'
                onClick={handleStartOver}
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
                You&apos;ve already prepared your design and chosen a size. If
                you go back now your progress will be saved and you can return
                to continue — but if you&apos;re done you can also start over.
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

      <input
        ref={fileInputRef}
        type='file'
        accept='image/*,.pdf'
        className='hidden'
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
        }}
      />

      {/* Header — hidden on the design step so the editor can take the
          full viewport. The TemplateDesigner has its own top bar. */}
      <div
        className={`bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm ${
          state.step === 'design' || state.step === 'size' ? 'hidden' : ''
        }`}
      >
        <div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4'>
          <div className='flex items-center justify-between gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='flex-shrink-0 bg-white hover:bg-gray-50 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 border-2 border-gray-200 rounded-lg'
              onClick={handleHeaderBack}
            >
              <ArrowLeft className='w-4 h-4 md:w-4 md:h-4' />
              <span className='hidden sm:inline ml-1 md:ml-2 text-sm'>
                Back
              </span>
            </Button>

            <div className='flex-1 text-center px-2 sm:px-4'>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-base sm:text-lg md:text-2xl lg:text-3xl"
                style={{ fontWeight: '700', lineHeight: '1.2' }}
              >
                {EVENT_CANVAS_PRODUCT.name}
              </h1>
              <p className='text-[10px] sm:text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 hidden xs:block'>
                {subtitle}
              </p>
            </div>

            {state.imageUrl || state.step !== 'choose' ? (
              <Button
                variant='outline'
                size='sm'
                className='flex-shrink-0 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 border-2 border-gray-200 rounded-lg transition-colors'
                onClick={() => setShowStartOverDialog(true)}
              >
                <RotateCcw className='w-4 h-4' />
                <span className='hidden sm:inline ml-1 md:ml-2 text-sm'>
                  Start over
                </span>
              </Button>
            ) : (
              <div className='w-8 sm:w-[68px] md:w-[84px] flex-shrink-0' />
            )}
          </div>
        </div>
      </div>

      <div className='flex-1 flex flex-col min-h-0 overflow-hidden'>
        <AnimatePresence mode='wait'>
          {state.step === 'choose' && (
            <motion.div
              key='choose'
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className='flex-1 min-h-0 overflow-y-auto flex items-center justify-center px-4 py-8 sm:py-12'
            >
              <ChooseStep
                onPickUpload={() => goToStep('upload')}
                onPickTemplate={() => goToStep('gallery')}
                onWhatsAppDesign={handleWhatsAppDesign}
              />
            </motion.div>
          )}

          {state.step === 'upload' && (
            <motion.div
              key='upload'
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className='flex-1 min-h-0 overflow-y-auto flex items-center justify-center px-4 py-8 sm:py-12'
            >
              <UploadStep
                isDragging={isDragging}
                isUploading={state.isUploading}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPickFile={() => fileInputRef.current?.click()}
                onWhatsAppDesign={handleWhatsAppDesign}
              />
            </motion.div>
          )}

          {state.step === 'gallery' && (
            <motion.div
              key='gallery'
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className='flex-1 min-h-0 overflow-y-auto'
            >
              <TemplateGallery
                selectedTemplateId={state.templateId}
                onSelect={handleTemplateSelect}
              />
            </motion.div>
          )}

          {state.step === 'design' && activeTemplate && (
            <motion.div
              key='design'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              // Full-viewport overlay so the editor always fits without
              // scrolling, regardless of the parent flow.
              className='fixed inset-0 z-40 flex bg-[#f7f7fb]'
            >
              <TemplateDesigner
                template={activeTemplate}
                onBack={() => {
                  setActiveTemplate(null);
                  setState(prev => ({
                    ...prev,
                    step: 'gallery',
                    templateId: null,
                  }));
                }}
                onDone={handleTemplateDone}
              />
            </motion.div>
          )}

          {state.step === 'size' && (
            <motion.div
              key='size'
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className='flex-1 min-h-0 flex flex-col lg:flex-row'
            >
              {/* LEFT — 3D preview (fills remaining height on lg, takes ~55%
                  of viewport on mobile so the size panel is reachable below) */}
              <div className='flex-1 min-h-0 lg:flex-[2] relative bg-gradient-to-br from-gray-50 to-gray-100 order-1 lg:order-1'>
                {/* Floating navigation overlay — replaces the hidden header
                    so the user can still go back or start over. Uses
                    pointer-events-none on the wrapper so the gap between
                    the two pill controls doesn't block 3D orbit drags. */}
                <div className='absolute top-4 sm:top-5 left-4 sm:left-5 right-4 sm:right-5 z-20 flex items-start justify-between gap-2 pointer-events-none'>
                  <button
                    type='button'
                    onClick={handleHeaderBack}
                    className='pointer-events-auto group flex items-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-full bg-white/85 hover:bg-white backdrop-blur-md text-gray-800 text-xs sm:text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-all hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)] active:scale-[0.97]'
                  >
                    <ArrowLeft className='w-3.5 h-3.5 sm:w-4 sm:h-4 -ml-0.5 transition-transform group-hover:-translate-x-0.5' />
                    <span>Back</span>
                  </button>

                  {(state.imageUrl || state.step !== 'choose') && (
                    <button
                      type='button'
                      onClick={() => setShowStartOverDialog(true)}
                      className='pointer-events-auto group flex items-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-full bg-white/85 hover:bg-white backdrop-blur-md text-gray-800 hover:text-red-600 text-xs sm:text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-all hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)] active:scale-[0.97]'
                    >
                      <RotateCcw className='w-3.5 h-3.5 sm:w-4 sm:h-4 -ml-0.5 transition-transform group-hover:-rotate-45' />
                      <span className='hidden xs:inline'>Start over</span>
                    </button>
                  )}
                </div>

                <Suspense
                  fallback={
                    <div className='w-full h-full bg-gray-100 flex items-center justify-center'>
                      <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
                    </div>
                  }
                >
                  {state.imageUrl ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className='w-full h-full bg-gradient-to-br from-gray-50 to-gray-100'
                    >
                      <PosterEaselPreview
                        imageUrl={state.imageUrl}
                        width={state.posterWidth}
                        height={state.posterHeight}
                        showRuler={showRuler}
                        wallColor='#e8e4d8'
                      />
                    </motion.div>
                  ) : (
                    <div className='w-full h-full flex items-center justify-center p-6 text-center'>
                      <div className='text-gray-400'>
                        <Eye className='w-12 h-12 mx-auto mb-3 text-gray-300' />
                        <p className='text-sm'>
                          No design yet. Go back and add one.
                        </p>
                      </div>
                    </div>
                  )}
                </Suspense>

                {state.imageUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-10'
                  >
                    <button
                      type='button'
                      onClick={() => setShowRuler(!showRuler)}
                      className={`flex items-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-full backdrop-blur-md text-xs sm:text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.08)] ring-1 transition-all hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)] active:scale-[0.97] ${
                        showRuler
                          ? 'bg-[#f63a9e] text-white ring-[#f63a9e]/30 hover:bg-[#e6328d]'
                          : 'bg-white/85 hover:bg-white text-gray-800 ring-black/5'
                      }`}
                      aria-pressed={showRuler}
                    >
                      <Ruler className='w-3.5 h-3.5 sm:w-4 sm:h-4 -ml-0.5' />
                      <span>Ruler</span>
                    </button>
                  </motion.div>
                )}
              </div>

              {/* RIGHT — size + cart panel */}
              <div className='w-full lg:w-[400px] xl:w-[450px] 2xl:w-[480px] flex-shrink-0 lg:h-full max-h-[55vh] lg:max-h-none overflow-y-auto bg-white border-t lg:border-t-0 lg:border-l border-gray-200 shadow-lg lg:shadow-xl order-2 lg:order-2'>
                <div className='py-3 px-3 sm:py-4 sm:px-4 md:py-6 md:px-6 lg:py-8 lg:px-8 space-y-3 sm:space-y-4 md:space-y-6'>
                  <div>
                    <h2
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-1.5 sm:mb-2 text-base sm:text-lg md:text-xl lg:text-2xl"
                      style={{ fontWeight: '600' }}
                    >
                      Choose your size
                    </h2>
                    <p className='text-gray-600 text-[11px] xs:text-xs sm:text-sm leading-snug'>
                      Pick a size — the 3D preview updates as you go.
                    </p>
                    <div className='mt-2 sm:mt-3'>
                      <div className='flex items-baseline gap-1.5 sm:gap-2'>
                        <span className='text-[#f63a9e] text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold'>
                          £
                          {state.imageUrl
                            ? calculatePrice()
                            : artFixedPrice > 0
                              ? (21.6 + artFixedPrice).toFixed(2)
                              : '21.60'}
                        </span>
                        <span className='text-[10px] xs:text-xs sm:text-sm text-gray-600'>
                          ({state.posterWidth}&quot; × {state.posterHeight}
                          &quot;)
                        </span>
                      </div>
                      {artFixedPrice > 0 && (
                        <p className='text-[10px] xs:text-xs text-gray-400 mt-0.5'>
                          Art £{artFixedPrice.toFixed(2)} + Poster £
                          {state.imageUrl
                            ? calculateCanvasPrice().toFixed(2)
                            : '21.60'}
                        </p>
                      )}
                    </div>

                    <Button
                      className='w-full mt-2.5 sm:mt-3 md:mt-4 h-[42px] xs:h-[44px] sm:h-[48px] md:h-[52px] lg:h-[56px] bg-teal-600 hover:bg-teal-700 text-white rounded-lg sm:rounded-xl text-xs xs:text-sm sm:text-base md:text-lg font-semibold shadow-lg transition-all active:scale-[0.98]'
                      onClick={handleAddToCart}
                      disabled={!state.imageUrl}
                    >
                      <ShoppingCart className='w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2' />
                      Add to basket
                    </Button>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='border-t border-gray-200 pt-3 sm:pt-4 md:pt-6'
                  >
                    <Label className='text-[10px] xs:text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-2.5 md:mb-3 block'>
                      Select Size
                    </Label>
                    <div className='space-y-1.5 sm:space-y-2'>
                      {POSTER_SIZES.map(size => {
                        const area = size.width * size.height;
                        const price = (area * productPrice).toFixed(2);
                        const isSelected =
                          state.posterWidth === size.width &&
                          state.posterHeight === size.height;
                        const totalSizePrice = (
                          parseFloat(price) + artFixedPrice
                        ).toFixed(2);
                        return (
                          <button
                            key={size.label}
                            onClick={() => handleSizeSelect(size)}
                            className={`w-full text-left p-2 xs:p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-[#f63a9e] bg-pink-50 shadow-md'
                                : 'border-gray-200 hover:border-[#f63a9e] hover:bg-pink-50'
                            }`}
                          >
                            <div className='flex items-center justify-between mb-0.5 sm:mb-1'>
                              <div className='flex items-center gap-1.5 sm:gap-2'>
                                <h4 className='font-bold text-gray-900 text-[11px] xs:text-xs sm:text-sm md:text-base'>
                                  {size.label}
                                </h4>
                                {size.recommended && (
                                  <span className='px-1 xs:px-1.5 sm:px-2 py-0.5 bg-[#f63a9e] text-white text-[8px] xs:text-[9px] sm:text-[10px] rounded-full font-medium'>
                                    Popular
                                  </span>
                                )}
                              </div>
                              <div className='flex flex-col items-end'>
                                <span className='text-[#f63a9e] font-semibold text-[11px] xs:text-xs sm:text-sm md:text-base'>
                                  £
                                  {artFixedPrice > 0 ? totalSizePrice : price}
                                </span>
                                {artFixedPrice > 0 && (
                                  <span className='text-[8px] xs:text-[9px] text-gray-400 leading-tight'>
                                    Art £{artFixedPrice.toFixed(2)} + Poster £
                                    {price}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className='text-[10px] xs:text-[10px] sm:text-xs text-gray-600 leading-snug'>
                              {size.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <div className='mt-2.5 sm:mt-3 md:mt-4 p-2 xs:p-2.5 sm:p-3 bg-green-50 rounded-lg sm:rounded-lg border border-green-200'>
                      <div className='flex items-start gap-1 xs:gap-1.5 sm:gap-2 text-[10px] xs:text-[10px] sm:text-xs text-green-800 leading-snug'>
                        <Info className='w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5' />
                        <p>
                          Premium canvas with white sides, perfect for easel
                          display.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Step views (kept inline as small private components) ─────────────────

function ChooseStep({
  onPickUpload,
  onPickTemplate,
  onWhatsAppDesign,
}: {
  onPickUpload: () => void;
  onPickTemplate: () => void;
  onWhatsAppDesign: () => void;
}) {
  return (
    <div className='w-full max-w-4xl'>
      <div className='text-center mb-6 sm:mb-8'>
        <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-[#f63a9e] text-[11px] sm:text-xs font-semibold mb-2'>
          <Sparkles className='w-3 h-3' />
          Step 1 of 3
        </div>
        <h2
          className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-xl sm:text-2xl md:text-3xl mb-1.5"
          style={{ fontWeight: '700' }}
        >
          How would you like to start?
        </h2>
        <p className='text-xs sm:text-sm text-gray-600 max-w-xl mx-auto'>
          Bring your own banner design, or pick a template and personalise it
          with your text and photos.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5'>
        <motion.button
          type='button'
          whileHover={{ y: -3 }}
          onClick={onPickUpload}
          className='group text-left p-5 sm:p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#f63a9e] shadow-sm hover:shadow-lg transition-all'
        >
          <div className='w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform'>
            <Upload className='w-6 h-6 sm:w-7 sm:h-7 text-[#f63a9e]' />
          </div>
          <h3 className='font-bold text-gray-900 text-base sm:text-lg mb-1'>
            Upload my design
          </h3>
          <p className='text-xs sm:text-sm text-gray-600 leading-relaxed'>
            Already have a poster? Drop in a JPG, PNG, or PDF and skip ahead
            to size selection.
          </p>
          <span className='inline-flex items-center gap-1 mt-3 text-xs sm:text-sm font-semibold text-[#f63a9e]'>
            Continue
            <ChevronRight className='w-3.5 h-3.5' />
          </span>
        </motion.button>

        <motion.button
          type='button'
          whileHover={{ y: -3 }}
          onClick={onPickTemplate}
          className='group text-left p-5 sm:p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#f63a9e] shadow-sm hover:shadow-lg transition-all'
        >
          <div className='w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-100 to-pink-50 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform'>
            <LayoutGrid className='w-6 h-6 sm:w-7 sm:h-7 text-[#b8336a]' />
          </div>
          <h3 className='font-bold text-gray-900 text-base sm:text-lg mb-1'>
            Use a template
          </h3>
          <p className='text-xs sm:text-sm text-gray-600 leading-relaxed'>
            Pick a design for your occasion — birthdays, weddings, more — then
            personalise the text and add your own photos.
          </p>
          <span className='inline-flex items-center gap-1 mt-3 text-xs sm:text-sm font-semibold text-[#f63a9e]'>
            Browse templates
            <ChevronRight className='w-3.5 h-3.5' />
          </span>
        </motion.button>
      </div>

      <div className='mt-6 sm:mt-8 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 max-w-xl mx-auto'>
        <div className='flex items-start gap-2 sm:gap-3'>
          <MessageCircle className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5' />
          <div className='flex-1'>
            <h4 className='font-semibold text-gray-900 mb-0.5 text-xs sm:text-sm'>
              Need design help?
            </h4>
            <p className='text-[11px] sm:text-xs text-gray-600 mb-2 leading-snug'>
              Our team can put together a custom poster for you on WhatsApp.
            </p>
            <Button
              onClick={onWhatsAppDesign}
              size='sm'
              className='bg-[#25D366] hover:bg-[#20BA5A] text-white text-[10px] xs:text-[11px] sm:text-xs h-7 sm:h-8 px-2.5 sm:px-3 rounded-md'
            >
              <MessageCircle className='w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5' />
              WhatsApp Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadStep({
  isDragging,
  isUploading,
  onDragOver,
  onDragLeave,
  onDrop,
  onPickFile,
  onWhatsAppDesign,
}: {
  isDragging: boolean;
  isUploading: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onPickFile: () => void;
  onWhatsAppDesign: () => void;
}) {
  return (
    <div className='w-full max-w-2xl'>
      <div className='text-center mb-6 sm:mb-8'>
        <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-[#f63a9e] text-[11px] sm:text-xs font-semibold mb-2'>
          <Sparkles className='w-3 h-3' />
          Step 2 of 3
        </div>
        <h2
          className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-xl sm:text-2xl md:text-3xl mb-1.5"
          style={{ fontWeight: '700' }}
        >
          Upload your banner design
        </h2>
        <p className='text-xs sm:text-sm text-gray-600 max-w-xl mx-auto'>
          We&apos;ll print it on premium canvas, perfect for easel display.
        </p>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onPickFile}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 md:p-14 text-center transition-all cursor-pointer bg-white ${
          isDragging
            ? 'border-[#f63a9e] bg-pink-50'
            : 'border-gray-300 hover:border-[#f63a9e] hover:bg-pink-50'
        }`}
      >
        <div className='mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center mb-3 sm:mb-4'>
          {isUploading ? (
            <Loader2 className='w-7 h-7 sm:w-8 sm:h-8 text-[#f63a9e] animate-spin' />
          ) : (
            <Upload className='w-7 h-7 sm:w-8 sm:h-8 text-[#f63a9e]' />
          )}
        </div>
        <p className='text-sm sm:text-base font-semibold text-gray-900 mb-1'>
          {isUploading
            ? 'Uploading...'
            : isDragging
              ? 'Drop your poster here'
              : 'Click or drag to upload'}
        </p>
        <p className='text-[11px] sm:text-xs text-gray-500'>
          JPG, PNG, PDF · Max 25MB
        </p>
      </div>

      <div className='mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200'>
        <div className='flex items-start gap-2 sm:gap-3'>
          <MessageCircle className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5' />
          <div className='flex-1'>
            <h4 className='font-semibold text-gray-900 mb-0.5 text-xs sm:text-sm'>
              Don&apos;t have a design yet?
            </h4>
            <p className='text-[11px] sm:text-xs text-gray-600 mb-2 leading-snug'>
              Our team can put together a custom poster for you on WhatsApp.
            </p>
            <Button
              onClick={e => {
                e.stopPropagation();
                onWhatsAppDesign();
              }}
              size='sm'
              className='bg-[#25D366] hover:bg-[#20BA5A] text-white text-[10px] xs:text-[11px] sm:text-xs h-7 sm:h-8 px-2.5 sm:px-3 rounded-md'
            >
              <MessageCircle className='w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5' />
              WhatsApp Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
