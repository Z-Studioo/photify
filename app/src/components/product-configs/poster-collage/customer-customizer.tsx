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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { uploadFileToStorage } from '@/lib/supabase/storage';
import { useCart } from '@/context/CartContext';
import {
  POSTER_COLLAGE_PRODUCT,
  POSTER_SIZES,
  DEFAULT_POSTER_SIZE,
  WHATSAPP_DESIGN_SERVICE,
} from './config';
import type { PosterSize, PosterUploadState } from './types';
import PosterEaselPreview from './poster-ease-ipreview.client';

const POSTER_SESSION_KEY = 'photify_poster_state';

function loadPersistedPosterState(): {
  imageUrl: string | null;
  posterWidth: number;
  posterHeight: number;
} {
  try {
    const raw = sessionStorage.getItem(POSTER_SESSION_KEY);
    if (!raw)
      return {
        imageUrl: null,
        posterWidth: DEFAULT_POSTER_SIZE.width,
        posterHeight: DEFAULT_POSTER_SIZE.height,
      };
    const parsed = JSON.parse(raw);
    return {
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
    return {
      imageUrl: null,
      posterWidth: DEFAULT_POSTER_SIZE.width,
      posterHeight: DEFAULT_POSTER_SIZE.height,
    };
  }
}

function clearPersistedPosterState() {
  try {
    sessionStorage.removeItem(POSTER_SESSION_KEY);
  } catch {
    /* noop */
  }
}

export function PosterCollageCustomizer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const artImageUrl = searchParams.get('artImageUrl')
    ? decodeURIComponent(searchParams.get('artImageUrl')!)
    : null;
  const artFixedPrice = parseFloat(searchParams.get('artFixedPrice') || '0') || 0;
  const artName = searchParams.get('artName') ? decodeURIComponent(searchParams.get('artName')!) : '';
  const supabase = createClient();
  const { addToCart } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [productPrice, setProductPrice] = useState(0.5); // Default price per sq inch
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  const [state, setState] = useState<PosterUploadState>(() => {
    // artImageUrl (from art detail page deep-link) always takes precedence.
    // Otherwise, restore whatever the user uploaded before the refresh.
    const persisted = loadPersistedPosterState();
    const restoredUrl = artImageUrl ?? persisted.imageUrl;
    return {
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

  // Persist uploaded image URL and chosen size so a browser refresh doesn't reset the editor
  useEffect(() => {
    if (state.imageUrl) {
      try {
        sessionStorage.setItem(
          POSTER_SESSION_KEY,
          JSON.stringify({
            imageUrl: state.imageUrl,
            posterWidth: state.posterWidth,
            posterHeight: state.posterHeight,
          })
        );
      } catch {
        /* storage quota exceeded — ignore */
      }
    }
  }, [state.imageUrl, state.posterWidth, state.posterHeight]);

  // Fetch product price
  useEffect(() => {
    const fetchProductPrice = async () => {
      try {
        const { data: productData, error } = await supabase
          .from('products')
          .select('price')
          .eq('slug', POSTER_COLLAGE_PRODUCT.slug)
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

  // Handle image upload
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

      // Upload to Supabase storage
      const publicUrl = await uploadFileToStorage(file, 'poster-uploads');

      if (!publicUrl) {
        toast.error('Failed to upload poster. Please try again.', {
          id: uploadToast,
        });
        setState(prev => ({ ...prev, isUploading: false }));
        return;
      }

      // Set the image URL immediately — do NOT wait for FileReader/Image callbacks.
      // If we delay inside nested async callbacks, any re-render triggered by
      // Supabase auth events can cause the component to remount and lose the URL.
      setState(prev => ({
        ...prev,
        imageUrl: publicUrl,
        imageFile: file,
        isUploading: false,
        uploadProgress: 100,
      }));

      toast.success('Poster uploaded!', { id: uploadToast });

      // Detect image dimensions in the background to auto-select the best size.
      // This only updates posterWidth/posterHeight — imageUrl is already set above.
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;

        const img = new Image();
        img.onload = () => {
          const imageAspectRatio = img.width / img.height;

          // Find best matching poster size
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

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  // Handle size selection
  const handleSizeSelect = (size: PosterSize) => {
    setState(prev => ({
      ...prev,
      posterWidth: size.width,
      posterHeight: size.height,
    }));
    toast.success(`Size selected: ${size.label}`);
  };

  // Calculate canvas-only price
  const calculateCanvasPrice = () => {
    return state.posterWidth * state.posterHeight * productPrice;
  };

  // Calculate total price (canvas + art fixed price)
  const calculatePrice = () => {
    return (calculateCanvasPrice() + artFixedPrice).toFixed(2);
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (!state.imageUrl) {
      toast.error('Please upload a poster first');
      return;
    }

    try {
      const canvasPrice = calculateCanvasPrice();
      const totalPrice = parseFloat((canvasPrice + artFixedPrice).toFixed(2));
      const itemName = artName
        ? `${artName} — Poster ${state.posterWidth}" × ${state.posterHeight}"`
        : `${POSTER_COLLAGE_PRODUCT.name} - ${state.posterWidth}" × ${state.posterHeight}"`;

      await addToCart({
        id: POSTER_COLLAGE_PRODUCT.id,
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

  // Open WhatsApp
  const handleWhatsAppDesign = () => {
    const url = WHATSAPP_DESIGN_SERVICE.url();
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-[#FFF5FB]'>
        <div className='text-center'>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className='w-12 h-12 border-4 border-[#f63a9e] border-t-transparent rounded-full mx-auto mb-4'
          />
          <p className='text-gray-600'>Loading poster customizer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30'>
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
                This will remove your uploaded poster and all size choices. You&apos;ll start fresh from the upload screen. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className='flex-col sm:flex-row gap-2 mt-5'>
              <AlertDialogCancel className='w-full sm:w-auto rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium'>
                Keep my poster
              </AlertDialogCancel>
              <AlertDialogAction
                className='w-full sm:w-auto rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md shadow-red-200/50'
                onClick={() => {
                  clearPersistedPosterState();
                  setState(prev => ({
                    ...prev,
                    imageUrl: null,
                    imageFile: null,
                    posterWidth: DEFAULT_POSTER_SIZE.width,
                    posterHeight: DEFAULT_POSTER_SIZE.height,
                  }));
                  if (fileInputRef.current) fileInputRef.current.value = '';
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
          {/* Coloured top strip */}
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
                You&apos;ve already uploaded your poster and chosen a size. If you go
                back now your progress will be saved and you can return to
                continue — but if you&apos;re done you can also start over.
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

      {/* Header Section */}
      <div className='bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm'>
        <div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4'>
          <div className='flex items-center justify-between gap-2'>
            {/* Back Button */}
            <Button
              variant='outline'
              size='sm'
              className='flex-shrink-0 bg-white hover:bg-gray-50 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 border-2 border-gray-200 rounded-lg'
              onClick={() =>
                state.imageUrl ? setShowBackDialog(true) : navigate(-1)
              }
            >
              <ArrowLeft className='w-4 h-4 md:w-4 md:h-4' />
              <span className='hidden sm:inline ml-1 md:ml-2 text-sm'>
                Back
              </span>
            </Button>

            {/* Title */}
            <div className='flex-1 text-center px-2 sm:px-4'>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-base sm:text-lg md:text-2xl lg:text-3xl"
                style={{ fontWeight: '700', lineHeight: '1.2' }}
              >
                {POSTER_COLLAGE_PRODUCT.name}
              </h1>
              <p className='text-[10px] sm:text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 hidden xs:block'>
                Create custom poster
              </p>
            </div>

            {/* Start Over — only shown once an image is loaded */}
            {state.imageUrl ? (
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

      {/* Main Content - Split Layout */}
      <div className='w-full flex flex-col lg:flex-row'>
        <div className='w-full flex flex-col lg:flex-row lg:h-[calc(100vh-73px)]'>
          {/* LEFT SIDE - 3D Canvas Preview */}
          <div className='flex-1 lg:flex-[2] relative h-[40vh] xs:h-[42vh] sm:h-[45vh] md:h-[50vh] lg:h-full bg-gradient-to-br from-gray-50 to-gray-100 order-1 lg:order-1'>
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
                  className='w-full h-[350px] sm:h-[400px] md:h-[450px] lg:h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-3 sm:p-4'
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-3 sm:p-4'
                >
                  <div className='text-center max-w-md px-3 sm:px-4'>
                    <div className='w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-white rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 border-2 border-dashed border-gray-300 mx-auto'>
                      <Eye className='w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-300' />
                    </div>
                    <h3 className='text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2'>
                      Upload Your Poster
                    </h3>
                    <p className='text-xs xs:text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 md:mb-6'>
                      See your design in 3D preview
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={state.isUploading}
                      className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-9 xs:h-10 sm:h-11 md:h-12 px-4 xs:px-5 sm:px-6 md:px-8 rounded-lg sm:rounded-xl text-xs xs:text-sm sm:text-base font-semibold shadow-lg transition-all active:scale-[0.98]'
                    >
                      {state.isUploading ? (
                        <>
                          <Loader2 className='w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 animate-spin' />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className='w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2' />
                          Choose Poster
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </Suspense>

            {/* Bottom Toolbar - Ruler Toggle */}
            {state.imageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='absolute bottom-2 xs:bottom-3 sm:bottom-4 md:bottom-6 lg:bottom-8 left-1/2 transform -translate-x-1/2 z-10'
              >
                <div className='bg-white/95 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg sm:shadow-xl md:shadow-2xl px-2.5 py-1.5 xs:px-3 xs:py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 lg:py-4 flex items-center gap-2 border border-gray-200'>
                  <button
                    className={`flex flex-col items-center gap-0.5 xs:gap-1 md:gap-1.5 px-1.5 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 hover:bg-gray-50 rounded-md sm:rounded-lg md:rounded-xl transition-colors group ${
                      showRuler ? 'bg-[#f63a9e]/10' : ''
                    }`}
                    onClick={() => setShowRuler(!showRuler)}
                  >
                    <Ruler
                      className={`w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${showRuler ? 'text-[#f63a9e]' : 'text-gray-700 group-hover:text-[#f63a9e]'}`}
                    />
                    <span
                      className={`text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-medium ${showRuler ? 'text-[#f63a9e]' : 'text-gray-600'}`}
                    >
                      Ruler
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT SIDE - Configuration Panel */}
          <div className='w-full lg:w-[400px] xl:w-[450px] 2xl:w-[480px] h-auto lg:h-full overflow-y-auto bg-white border-t lg:border-t-0 lg:border-l border-gray-200 shadow-lg lg:shadow-xl order-2 lg:order-2'>
            <div className='py-3 px-3 sm:py-4 sm:px-4 md:py-6 md:px-6 lg:py-8 lg:px-8 space-y-3 sm:space-y-4 md:space-y-6'>
              {/* Title */}
              <div>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-1.5 sm:mb-2 text-base sm:text-lg md:text-xl lg:text-2xl"
                  style={{ fontWeight: '600' }}
                >
                  Configure Poster
                </h2>
                <p className='text-gray-600 text-[11px] xs:text-xs sm:text-sm leading-snug'>
                  Upload your custom design for special events
                </p>
                <div className='mt-2 sm:mt-3'>
                  <div className='flex items-baseline gap-1.5 sm:gap-2'>
                    <span className='text-[#f63a9e] text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold'>
                      £{state.imageUrl ? calculatePrice() : (artFixedPrice > 0 ? (21.60 + artFixedPrice).toFixed(2) : '21.60')}
                    </span>
                    <span className='text-[10px] xs:text-xs sm:text-sm text-gray-600'>
                      ({state.posterWidth}&quot; × {state.posterHeight}&quot;)
                    </span>
                  </div>
                  {artFixedPrice > 0 && (
                    <p className='text-[10px] xs:text-xs text-gray-400 mt-0.5'>
                      Art £{artFixedPrice.toFixed(2)} + Poster £{state.imageUrl ? calculateCanvasPrice().toFixed(2) : '21.60'}
                    </p>
                  )}
                </div>

                {/* Add to Cart Button */}
                <Button
                  className='w-full mt-2.5 sm:mt-3 md:mt-4 h-[42px] xs:h-[44px] sm:h-[48px] md:h-[52px] lg:h-[56px] bg-teal-600 hover:bg-teal-700 text-white rounded-lg sm:rounded-xl text-xs xs:text-sm sm:text-base md:text-lg font-semibold shadow-lg transition-all active:scale-[0.98]'
                  onClick={handleAddToCart}
                  disabled={!state.imageUrl}
                >
                  <ShoppingCart className='w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2' />
                  Add to basket
                </Button>
              </div>

              {/* Upload Section */}
              {!state.imageUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='border-t border-gray-200 pt-3 sm:pt-4 md:pt-6'
                >
                  <h3 className='font-semibold text-gray-900 mb-2.5 sm:mb-3 md:mb-4 text-xs xs:text-sm sm:text-base md:text-lg'>
                    Upload Design
                  </h3>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg sm:rounded-xl p-4 xs:p-5 sm:p-6 md:p-8 text-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-[#f63a9e] bg-pink-50'
                        : 'border-gray-300 bg-gray-50 hover:border-[#f63a9e] hover:bg-pink-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className='w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-[#f63a9e] mx-auto mb-2 sm:mb-3' />
                    <p className='text-xs xs:text-xs sm:text-sm font-medium text-gray-900 mb-1'>
                      {isDragging
                        ? 'Drop your poster here'
                        : 'Click or drag to upload'}
                    </p>
                    <p className='text-[10px] xs:text-[10px] sm:text-xs text-gray-500'>
                      JPG, PNG, PDF (Max 25MB)
                    </p>
                  </div>

                  {/* WhatsApp Design Service */}
                  <div className='mt-3 sm:mt-4 md:mt-6 p-2.5 xs:p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border-2 border-blue-200'>
                    <div className='flex items-start gap-2 sm:gap-3'>
                      <MessageCircle className='w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5' />
                      <div className='flex-1'>
                        <h4 className='font-semibold text-gray-900 mb-0.5 sm:mb-1 text-[11px] xs:text-xs sm:text-sm'>
                          Need Design Help?
                        </h4>
                        <p className='text-[10px] xs:text-[10px] sm:text-xs text-gray-600 mb-1.5 sm:mb-2 md:mb-3 leading-snug'>
                          Our team can create a custom poster
                        </p>
                        <Button
                          onClick={handleWhatsAppDesign}
                          size='sm'
                          className='bg-[#25D366] hover:bg-[#20BA5A] text-white text-[10px] xs:text-[10px] sm:text-xs h-6 xs:h-7 sm:h-8 px-2 xs:px-2.5 sm:px-3 rounded-md'
                        >
                          <MessageCircle className='w-3 h-3 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5' />
                          WhatsApp Us
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Size Selection - Show after upload */}
              {state.imageUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='border-t border-gray-200 pt-3 sm:pt-4 md:pt-6'
                >
                  <div className='flex items-center justify-between mb-2.5 sm:mb-3 md:mb-4'>
                    <h3 className='font-semibold text-gray-900 text-xs xs:text-sm sm:text-base md:text-lg'>
                      Poster Size
                    </h3>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        clearPersistedPosterState();
                        setState(prev => ({
                          ...prev,
                          imageUrl: null,
                          imageFile: null,
                        }));
                      }}
                      className='text-[10px] xs:text-[10px] sm:text-xs h-6 xs:h-7 sm:h-8 px-1.5 xs:px-2 sm:px-3 border rounded-md'
                    >
                      Change
                    </Button>
                  </div>

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

                      const totalSizePrice = (parseFloat(price) + artFixedPrice).toFixed(2);
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
                                £{artFixedPrice > 0 ? totalSizePrice : price}
                              </span>
                              {artFixedPrice > 0 && (
                                <span className='text-[8px] xs:text-[9px] text-gray-400 leading-tight'>
                                  Art £{artFixedPrice.toFixed(2)} + Poster £{price}
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

                  {/* Info Banner */}
                  <div className='mt-2.5 sm:mt-3 md:mt-4 p-2 xs:p-2.5 sm:p-3 bg-green-50 rounded-lg sm:rounded-lg border border-green-200'>
                    <div className='flex items-start gap-1 xs:gap-1.5 sm:gap-2 text-[10px] xs:text-[10px] sm:text-xs text-green-800 leading-snug'>
                      <Info className='w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5' />
                      <p>
                        Premium canvas with white sides, perfect for easel
                        display
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
