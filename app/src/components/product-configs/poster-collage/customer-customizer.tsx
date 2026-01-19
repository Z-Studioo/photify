import { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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

export function PosterCollageCustomizer() {
  const navigate = useNavigate();
  const supabase = createClient();
  const { addToCart } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [productPrice, setProductPrice] = useState(0.5); // Default price per sq inch

  const [state, setState] = useState<PosterUploadState>({
    imageUrl: null,
    imageFile: null,
    selectedSizeId: null,
    posterWidth: DEFAULT_POSTER_SIZE.width,
    posterHeight: DEFAULT_POSTER_SIZE.height,
    isUploading: false,
    uploadProgress: 0,
  });

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

      setState(prev => ({ ...prev, uploadProgress: 50 }));
      toast.loading('Processing poster...', { id: uploadToast });

      // Analyze image dimensions
      const reader = new FileReader();
      reader.onload = e => {
        const imageUrl = e.target?.result as string;

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
            imageUrl: publicUrl,
            imageFile: file,
            posterWidth: bestSize.width,
            posterHeight: bestSize.height,
            isUploading: false,
            uploadProgress: 100,
          }));

          toast.success(
            `Poster uploaded! Recommended size: ${bestSize.label}`,
            { id: uploadToast }
          );
        };

        img.src = imageUrl;
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

  // Calculate price
  const calculatePrice = () => {
    const area = state.posterWidth * state.posterHeight;
    return (area * productPrice).toFixed(2);
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (!state.imageUrl) {
      toast.error('Please upload a poster first');
      return;
    }

    try {
      const area = state.posterWidth * state.posterHeight;
      const price = parseFloat((area * productPrice).toFixed(2));

      await addToCart({
        id: POSTER_COLLAGE_PRODUCT.id,
        name: `${POSTER_COLLAGE_PRODUCT.name} - ${state.posterWidth}" × ${state.posterHeight}"`,
        quantity: 1,
        price: price,
        image: state.imageUrl,
        size: `${state.posterWidth}" × ${state.posterHeight}"`,
      });

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
    <div className='min-h-screen bg-white'>
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

      {/* Back Button */}
      <div className='absolute top-4 left-4 md:top-6 md:left-6 z-20'>
        <Button
          variant='outline'
          size='sm'
          className='bg-white/90 backdrop-blur-md hover:bg-white h-9 md:h-10 px-3 md:px-4'
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className='w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2' />
          <span className='hidden md:inline'>Back</span>
        </Button>
      </div>

      {/* Main Content - Split Layout */}
      <div className='w-full min-h-screen md:h-screen flex'>
        <div className='flex flex-col lg:flex-row w-full h-full'>
          {/* LEFT SIDE - 3D Canvas Preview */}
          <div className='flex-[2] relative h-[50vh] md:h-full lg:h-full'>
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
                  className='w-full h-full'
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
                  className='w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center'
                >
                  <div className='text-center max-w-md px-4'>
                    <div className='w-32 h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 border-2 border-dashed border-gray-300 mx-auto'>
                      <Eye className='w-16 h-16 text-gray-300' />
                    </div>
                    <h3 className='text-2xl font-bold text-gray-900 mb-2'>
                      Upload Your Poster
                    </h3>
                    <p className='text-gray-600 mb-6'>
                      Upload your design to see it in 3D preview
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={state.isUploading}
                      className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-12 px-8 rounded-xl text-base font-semibold'
                    >
                      {state.isUploading ? (
                        <>
                          <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className='w-5 h-5 mr-2' />
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
                className='absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-10'
              >
                <div className='bg-white/95 backdrop-blur-md rounded-xl md:rounded-2xl shadow-2xl px-4 py-3 md:px-6 md:py-4 flex items-center gap-2 border border-gray-200'>
                  <button
                    className={`flex flex-col items-center gap-1 md:gap-1.5 px-3 py-1.5 md:px-4 md:py-2 hover:bg-gray-50 rounded-lg md:rounded-xl transition-colors group ${
                      showRuler ? 'bg-[#f63a9e]/10' : ''
                    }`}
                    onClick={() => setShowRuler(!showRuler)}
                  >
                    <Ruler
                      className={`w-5 h-5 md:w-6 md:h-6 ${showRuler ? 'text-[#f63a9e]' : 'text-gray-700 group-hover:text-[#f63a9e]'}`}
                    />
                    <span
                      className={`text-[10px] md:text-xs font-medium ${showRuler ? 'text-[#f63a9e]' : 'text-gray-600'}`}
                    >
                      Ruler
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT SIDE - Configuration Panel */}
          <div className='w-full lg:w-[420px] h-auto lg:h-full overflow-y-auto bg-white py-6 px-4 md:py-8 md:px-8 space-y-6 md:space-y-8'>
            {/* Title */}
            <div>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2 text-xl md:text-2xl"
                style={{ fontWeight: '600' }}
              >
                {POSTER_COLLAGE_PRODUCT.name}
              </h2>
              <p className='text-gray-600 text-sm'>
                Upload your custom poster design for weddings, birthdays, and
                special events
              </p>
              <div className='flex items-baseline gap-2 mt-4'>
                <span className='text-[#f63a9e] text-2xl md:text-3xl font-bold'>
                  £{state.imageUrl ? calculatePrice() : '21.60'}
                </span>
                <span className='text-sm text-gray-600'>
                  ({state.posterWidth}&quot; × {state.posterHeight}&quot;)
                </span>
              </div>

              {/* Add to Cart Button */}
              <Button
                className='w-full mt-4 md:mt-6 h-[48px] md:h-[56px] bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-base md:text-lg font-semibold'
                onClick={handleAddToCart}
                disabled={!state.imageUrl}
              >
                <ShoppingCart className='w-4 h-4 md:w-5 md:h-5 mr-2' />
                Add to basket
              </Button>
            </div>

            {/* Upload Section */}
            {!state.imageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='border-t border-gray-200 pt-6'
              >
                <h3 className='font-semibold text-gray-900 mb-4 text-base md:text-lg'>
                  Upload Your Design
                </h3>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-[#f63a9e] bg-pink-50'
                      : 'border-gray-300 bg-gray-50 hover:border-[#f63a9e] hover:bg-pink-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className='w-12 h-12 text-[#f63a9e] mx-auto mb-3' />
                  <p className='text-sm font-medium text-gray-900 mb-1'>
                    {isDragging
                      ? 'Drop your poster here'
                      : 'Click or drag to upload'}
                  </p>
                  <p className='text-xs text-gray-500'>
                    JPG, PNG, PDF (Max 25MB)
                  </p>
                </div>

                {/* WhatsApp Design Service */}
                <div className='mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200'>
                  <div className='flex items-start gap-3'>
                    <MessageCircle className='w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5' />
                    <div className='flex-1'>
                      <h4 className='font-semibold text-gray-900 mb-1 text-sm'>
                        Need Design Help?
                      </h4>
                      <p className='text-xs text-gray-600 mb-3'>
                        Our design team can create a beautiful custom poster for
                        your event
                      </p>
                      <Button
                        onClick={handleWhatsAppDesign}
                        size='sm'
                        className='bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs h-8'
                      >
                        <MessageCircle className='w-3.5 h-3.5 mr-1.5' />
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
                className='border-t border-gray-200 pt-6'
              >
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-semibold text-gray-900 text-base md:text-lg'>
                    Poster Size
                  </h3>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setState(prev => ({
                        ...prev,
                        imageUrl: null,
                        imageFile: null,
                      }))
                    }
                    className='text-xs'
                  >
                    Change Poster
                  </Button>
                </div>

                <Label className='text-xs md:text-sm font-medium text-gray-700 mb-3 block'>
                  Select Size
                </Label>
                <div className='space-y-2'>
                  {POSTER_SIZES.map(size => {
                    const area = size.width * size.height;
                    const price = (area * productPrice).toFixed(2);
                    const isSelected =
                      state.posterWidth === size.width &&
                      state.posterHeight === size.height;

                    return (
                      <button
                        key={size.label}
                        onClick={() => handleSizeSelect(size)}
                        className={`w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-[#f63a9e] bg-pink-50'
                            : 'border-gray-200 hover:border-[#f63a9e] hover:bg-pink-50'
                        }`}
                      >
                        <div className='flex items-center justify-between mb-1'>
                          <div className='flex items-center gap-2'>
                            <h4 className='font-bold text-gray-900 text-sm md:text-base'>
                              {size.label}
                            </h4>
                            {size.recommended && (
                              <span className='px-2 py-0.5 bg-[#f63a9e] text-white text-[10px] rounded-full font-medium'>
                                Popular
                              </span>
                            )}
                          </div>
                          <span className='text-[#f63a9e] font-semibold text-sm md:text-base'>
                            £{price}
                          </span>
                        </div>
                        <p className='text-xs text-gray-600'>
                          {size.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Info Banner */}
                <div className='mt-4 p-3 bg-green-50 rounded-lg border border-green-200'>
                  <div className='flex items-start gap-2 text-xs text-green-800'>
                    <Info className='w-4 h-4 flex-shrink-0 mt-0.5' />
                    <p>
                      Your poster will be printed on premium canvas with white
                      sides, perfect for easel display at events
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
