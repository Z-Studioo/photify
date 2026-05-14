import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Heart,
  Star,
  Truck,
  RotateCcw,
  Shield,
  Sparkles,
  Clock,
  Eye,
  Package,
  Palette,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConfigurerById } from '@/lib/configures/registry';
import { createClient } from '@/lib/supabase/client';
import {
  getFeatureLucideIcon,
  isFeatureIconUrl,
} from '@/lib/product-feature-icons';
import {
  formatGbpAmount,
  getLowestSizePriceFromConfig,
} from '@/lib/product-starting-price';

const mockReviews = [
  {
    id: 1,
    name: 'Charlotte Henderson',
    rating: 5,
    date: '2 weeks ago',
    text: 'I was honestly blown away by the print quality. The colors are incredibly sharp and the canvas feels thick and premium. I ordered the 3 Canvas Collage Set for our hallway and it completely transformed the space. Worth every penny.',
    image:
      'https://ui-avatars.com/api/?name=Charlotte+Henderson&background=f63a9e&color=fff&size=100&bold=true',
    verified: true,
  },
  {
    id: 2,
    name: 'Oliver Chambers',
    rating: 5,
    date: '3 weeks ago',
    text: 'I\'ve tried other canvas print companies before, but Photify\'s quality stands out. The frames are sturdy, the wrapping is clean, and the photos look exactly like the previews. Delivery arrived within 4 days. Highly recommend!',
    image:
      'https://ui-avatars.com/api/?name=Oliver+Chambers&background=6366f1&color=fff&size=100&bold=true',
    verified: true,
  },
  {
    id: 3,
    name: 'Amelia Whitmore',
    rating: 5,
    date: '1 month ago',
    text: 'Ordered this as a housewarming gift and it was a huge hit. The collage layout made the photos look like a professional gallery wall. Packaging was secure and everything arrived in perfect condition.',
    image:
      'https://ui-avatars.com/api/?name=Amelia+Whitmore&background=ec4899&color=fff&size=100&bold=true',
    verified: true,
  },
];

interface ProductDetailPageProps {
  initialProduct: any;
  productSlug: string;
}

type FeatureRow = { text: string; icon: string | null };

function normalizeFeatureRows(raw: unknown): FeatureRow[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((f: any) =>
    typeof f === 'string'
      ? { text: f, icon: null }
      : { text: f?.text || '', icon: f?.icon || null }
  );
}

const DEFAULT_QUICK_TRUST_SIGNALS: FeatureRow[] = [
  { text: 'Free UK Shipping', icon: null },
  { text: '7-Day Returns', icon: null },
  { text: 'Quality Guarantee', icon: null },
  { text: 'Ships in 3–6 Days', icon: null },
];

const QUICK_TRUST_FALLBACK_ICONS = [Truck, RotateCcw, Shield, Clock] as const;

const WISHLIST_STORAGE_KEY = 'photify:wishlist';

export function ProductDetailPage({
  initialProduct,
  productSlug,
}: ProductDetailPageProps) {
  const navigate = useNavigate();
  const supabase = createClient();
  const [mainImage, setMainImage] = useState(0);
  const productId = initialProduct?.id as string | undefined;
  const [isWishlisted, setIsWishlisted] = useState(() => {
    if (typeof window === 'undefined' || !productId) return false;
    try {
      const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      return Array.isArray(ids) && ids.includes(productId);
    } catch {
      return false;
    }
  });
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (ctaRef.current) {
        const ctaRect = ctaRef.current.getBoundingClientRect();
        setShowStickyBar(ctaRect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !productId) return;
    try {
      const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const set = new Set(Array.isArray(ids) ? ids : []);
      if (isWishlisted) set.add(productId);
      else set.delete(productId);
      window.localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(Array.from(set))
      );
    } catch {
      /* ignore storage errors */
    }
  }, [isWishlisted, productId]);

  useEffect(() => {
    async function fetchRelated() {
      if (!initialProduct?.id) return;
      const { data } = await supabase
        .from('products')
        .select('id,name,slug,images,is_featured,config')
        .neq('id', initialProduct.id)
        .eq('active', true)
        .limit(4);
      if (data) setRelatedProducts(data);
    }
    fetchRelated();
  }, [initialProduct?.id]);

  const productData = initialProduct;
  /** Lowest configured size price (same source as generic admin, e.g. dual-metal-harmony) */
  const startingPrice = getLowestSizePriceFromConfig(initialProduct.config);

  const product = {
    id: initialProduct.id,
    title: initialProduct.name,
    startingPrice,
    description:
      initialProduct.description ||
      'Transform your favorite memories into stunning canvas art. Our premium quality canvas prints are professionally stretched and ready to hang.',
    images:
      initialProduct.images?.length > 0
        ? initialProduct.images
        : [
            'https://images.unsplash.com/photo-1686644472082-75dd48820a5d?w=800&h=800&fit=crop',
          ],
    features: initialProduct.features
      ? Array.isArray(initialProduct.features)
        ? initialProduct.features.map((f: any) =>
            typeof f === 'string'
              ? { text: f, icon: null }
              : { text: f.text || '', icon: f.icon || null }
          )
        : []
      : [
          { text: 'Museum-quality canvas material', icon: null },
          { text: 'Fade-resistant inks for lasting vibrancy', icon: null },
          { text: 'Hand-stretched on wooden frames', icon: null },
          { text: 'Ready to hang with included hardware', icon: null },
          { text: 'Protective coating for durability', icon: null },
        ],
    specifications: initialProduct.specifications || [
      { label: 'Material', value: '100% Cotton Canvas' },
      { label: 'Frame', value: 'Premium Kiln-Dried Pine Wood' },
      { label: 'Print Resolution', value: '300 DPI Giclée Quality' },
      { label: 'Finish', value: 'Matte or Glossy Available' },
      { label: 'Depth', value: '1.5" Gallery Wrap' },
    ],
    isFeatured: initialProduct.is_featured,
    averageRating: 4.9,
    reviewCount:
      typeof initialProduct.review_count === 'number'
        ? initialProduct.review_count
        : 0,
  };

  const adminQuickTrustFeatures = normalizeFeatureRows(
    initialProduct.features
  ).filter(f => f.text.trim().length > 0);
  const quickTrustSignals =
    adminQuickTrustFeatures.length > 0
      ? adminQuickTrustFeatures
      : DEFAULT_QUICK_TRUST_SIGNALS;

  const hasConfigurer = productData?.config?.configurerType;
  const configurerType = productData?.config?.configurerType;
  const isCollageProduct =
    configurerType === 'photo-collage-creator' ||
    configurerType === '1PhotoCollageCreator' ||
    configurerType === 'event-canvas' ||
    configurerType === 'multi-canvas-wall' ||
    productSlug === 'photo-collage-creator' ||
    productSlug === '1PhotoCollageCreator';

  const handlePrevImage = () => {
    setMainImage(prev => (prev === 0 ? product.images.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setMainImage(prev => (prev === product.images.length - 1 ? 0 : prev + 1));
  };
  const handleCustomize = () => {
    if (!productData?.config?.configurerType) return;
    navigate(
      `/upload?productId=${productData.id}&configurerType=${productData.config.configurerType}`
    );
  };
  const handleOpenCollageCreator = () => {
    if (!isCollageProduct) return;
    // Always pass productId so the customizer reads the configured ratios,
    // sizes and prices from the actual product the customer landed on,
    // instead of falling back to a hardcoded default product.
    navigate(
      `/customize/${productData.config.configurerType}?productId=${productData.id}`
    );
  };
  return (
    <>
      <div className="min-h-screen font-['Mona_Sans',_sans-serif] bg-white">
        <Header />
        {/* Sticky Purchase Bar */}
        <AnimatePresence>
          {showStickyBar && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className='fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-lg'
            >
              <div className='max-w-[1400px] mx-auto px-4 sm:px-6 py-2 sm:py-3'>
                <div className='flex items-center justify-between gap-2 sm:gap-4'>
                  <div className='flex items-center gap-2 sm:gap-4 flex-1 min-w-0'>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                      <ImageWithFallback
                        src={product.images[0]}
                        alt={product.title}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div className='hidden sm:block min-w-0'>
                      <h3 className='font-semibold text-gray-900 text-xs sm:text-sm line-clamp-1'>
                        {product.title}
                      </h3>
                      <p className='text-[#f63a9e] font-bold text-sm sm:text-base'>
                        {product.startingPrice != null
                          ? `From £${formatGbpAmount(product.startingPrice)}`
                          : 'From —'}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 sm:gap-3 flex-shrink-0'>
                    <div className='hidden md:flex items-center gap-1 text-amber-500'>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className='w-4 h-4 fill-current' />
                      ))}
                      <span className='text-gray-600 text-sm ml-1'>
                        ({product.reviewCount})
                      </span>
                    </div>

                    <Button
                      onClick={
                        hasConfigurer
                          ? isCollageProduct
                            ? handleOpenCollageCreator
                            : handleCustomize
                          : undefined
                      }
                      className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white px-4 sm:px-5 h-9 sm:h-10 rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-pink-500/25'
                    >
                      <Sparkles className='w-3 h-3 sm:w-4 sm:h-4 mr-1.5' />
                      Upload Your Photo
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <div
          ref={heroRef}
          className='bg-white'
        >
          {/* Back Button Row */}

          <div className='max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6'>
            <div className='flex items-center justify-between'>
              <motion.button
                onClick={() => navigate(-1)}
                className='flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors group'
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-gray-200 group-hover:border-[#f63a9e] flex items-center justify-center transition-all shadow-sm group-hover:shadow-md'>
                  <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5 group-hover:text-[#f63a9e] transition-colors' />
                </div>
                <span className='font-medium hidden sm:block'>
                  Back to Products
                </span>
              </motion.button>

              <div className='flex items-center gap-2'>
                <motion.button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${
                    isWishlisted
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`}
                  />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Main Hero Content */}
          <div className='max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8 lg:py-12'>
            <div className='grid lg:grid-cols-[1.2fr_1fr] gap-4 sm:gap-8 lg:gap-16 min-w-0'>
              {/* Left: Image Gallery */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className='w-full min-w-0'
              >
                <div className='flex gap-3 sm:gap-4'>
                  {/* Vertical thumbnail rail — desktop */}
                  {product.images.length > 1 && (
                    <div className='hidden sm:flex flex-col gap-2 w-[68px] lg:w-[80px] flex-shrink-0'>
                      {product.images.map((img: string, index: number) => (
                        <motion.button
                          key={index}
                          onClick={() => setMainImage(index)}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          className={`w-full aspect-square rounded-none overflow-hidden border-2 transition-all ${
                            mainImage === index
                              ? 'border-[#f63a9e] shadow-md shadow-pink-500/20'
                              : 'border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <ImageWithFallback
                            src={img}
                            alt={`View ${index + 1}`}
                            className='w-full h-full object-cover'
                          />
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Main Image */}
                  <div className='relative bg-gray-50 rounded-none overflow-hidden shadow-lg shadow-gray-200/70 group flex-1'>
                    {product.isFeatured && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className='absolute top-4 left-4 z-10'
                      >
                        <div className='px-4 py-2 bg-gradient-to-r from-[#f63a9e] to-[#e02d8d] text-white rounded-full text-sm font-bold shadow-lg flex items-center gap-1.5'>
                          <Star className='w-4 h-4 fill-white' />
                          BESTSELLER
                        </div>
                      </motion.div>
                    )}

                    <AnimatePresence mode='wait'>
                      <motion.div
                        key={mainImage}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.35 }}
                        className='aspect-square w-full max-w-full'
                      >
                        <ImageWithFallback
                          src={product.images[mainImage]}
                          alt={product.title}
                          className='w-full h-full object-cover max-w-full'
                        />
                      </motion.div>
                    </AnimatePresence>

                    {product.images.length > 1 && (
                      <>
                        <motion.button
                          onClick={handlePrevImage}
                          className='absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110'
                          whileTap={{ scale: 0.9 }}
                        >
                          <ChevronLeft className='w-5 h-5 text-gray-900' />
                        </motion.button>
                        <motion.button
                          onClick={handleNextImage}
                          className='absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110'
                          whileTap={{ scale: 0.9 }}
                        >
                          <ChevronRight className='w-5 h-5 text-gray-900' />
                        </motion.button>
                      </>
                    )}

                    {/* Dot indicators */}
                    {product.images.length > 1 && (
                      <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5'>
                        {product.images.map((_: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => setMainImage(i)}
                            className={`transition-all rounded-full ${
                              mainImage === i ? 'w-5 h-2 bg-white shadow-md' : 'w-2 h-2 bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Horizontal thumbnail row — mobile only */}
                {product.images.length > 1 && (
                  <div className='sm:hidden flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide'>
                    {product.images.map((img: string, index: number) => (
                      <motion.button
                        key={index}
                        onClick={() => setMainImage(index)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-shrink-0 w-16 h-16 rounded-none overflow-hidden border-2 transition-all ${
                          mainImage === index
                            ? 'border-[#f63a9e] shadow-md shadow-pink-500/20'
                            : 'border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <ImageWithFallback
                          src={img}
                          alt={`View ${index + 1}`}
                          className='w-full h-full object-cover'
                        />
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Right: Product Info */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className='flex flex-col min-w-0'
              >
                {/* Title & Rating */}
                <div className='mb-4 sm:mb-6 min-w-0'>
                  <div className='mb-3 sm:mb-4 flex items-start justify-between gap-3 min-w-0'>
                    <h1
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-2xl sm:text-3xl lg:text-4xl min-w-0 break-words"
                      style={{ fontWeight: '700', lineHeight: '1.1' }}
                    >
                      {product.title}
                    </h1>
                    <div className='flex items-center gap-1.5 text-[11px] sm:text-sm text-gray-500 whitespace-nowrap pt-1 flex-shrink-0'>
                      <span className='relative flex h-2.5 w-2.5 flex-shrink-0'>
                        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f63a9e] opacity-50' />
                        <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-[#f63a9e] shadow-[0_0_10px_rgba(246,58,158,0.65)]' />
                      </span>
                      <Eye className='w-3.5 h-3.5 text-[#f63a9e]' />
                      <span>
                        <strong className='text-gray-900'>15</strong> viewing now
                      </span>
                    </div>
                  </div>

                  {/* Rating Row */}
                  <div className='flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 flex-wrap'>
                    <div className='flex items-center gap-1'>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className='w-5 h-5 text-amber-400 fill-current'
                        />
                      ))}
                    </div>
                    <span className='text-gray-900 font-semibold'>
                      {product.averageRating}
                    </span>
                    <span className='text-gray-500'>
                      ({product.reviewCount} reviews)
                    </span>
                  </div>

                  {/* Price — lowest from config.sizePrices (admin), not products.price */}
                  <div className='flex items-baseline gap-2'>
                    <span className='text-gray-400 text-sm font-medium'>Starting at</span>
                    {product.startingPrice != null ? (
                      <span
                        className='text-[#f63a9e] text-3xl sm:text-4xl'
                        style={{ fontWeight: '800' }}
                      >
                        £{formatGbpAmount(product.startingPrice)}
                      </span>
                    ) : (
                      <span
                        className='text-gray-400 text-2xl sm:text-3xl'
                        style={{ fontWeight: '800' }}
                      >
                        —
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className='text-gray-600 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6'>
                  {product.description}
                </p>

                {/* Quick Trust Signals — copy + icons from admin Features */}
                <div className='grid grid-cols-2 gap-x-4 gap-y-2.5 mb-4 sm:mb-6'>
                  {quickTrustSignals.map((item, index) => {
                    const FallbackIcon =
                      QUICK_TRUST_FALLBACK_ICONS[
                        index % QUICK_TRUST_FALLBACK_ICONS.length
                      ];
                    const PickedLucide = getFeatureLucideIcon(item.icon);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.07 }}
                        className='flex items-center gap-2.5 text-gray-600'
                      >
                        <div className='w-7 h-7 rounded-full bg-[#f63a9e]/10 flex items-center justify-center flex-shrink-0 overflow-hidden'>
                          {item.icon && isFeatureIconUrl(item.icon) ? (
                            <img
                              src={item.icon}
                              alt=''
                              className='w-4 h-4 object-contain'
                            />
                          ) : PickedLucide ? (
                            <PickedLucide className='w-3.5 h-3.5 text-[#f63a9e]' />
                          ) : (
                            <FallbackIcon className='w-3.5 h-3.5 text-[#f63a9e]' />
                          )}
                        </div>
                        <span className='text-xs sm:text-sm font-medium'>
                          {item.text}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* CTA Section */}
                <div className='border-t border-gray-100 mb-4 sm:mb-5' />
                <div
                  ref={ctaRef}
                  className='space-y-3 sm:space-y-4 mb-4 sm:mb-6'
                >
                  {(isCollageProduct || hasConfigurer) && (
                    <motion.div>
                      <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0'>
                        <Button
                          onClick={
                            isCollageProduct
                              ? handleOpenCollageCreator
                              : handleCustomize
                          }
                          className='w-full sm:flex-1 min-w-0 bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-12 sm:h-14 rounded-2xl text-base sm:text-lg shadow-xl shadow-pink-500/30 transition-all'
                          style={{ fontWeight: '700' }}
                        >
                          <Sparkles className='w-5 h-5 mr-2 flex-shrink-0' />
                          <span className='truncate'>
                            {isCollageProduct
                              ? 'Create Your Photo Collage'
                              : (() => {
                                  const configurer = getConfigurerById(
                                    configurerType || ''
                                  );
                                  return configurer
                                    ? configurer.name === 'Single Canvas Editor'
                                      ? 'Upload Your Photo'
                                      : `Start ${configurer.name}`
                                    : 'Customize Your Canvas';
                                })()}
                          </span>
                        </Button>
                        <button
                          type='button'
                          onClick={() => navigate('/stock-images')}
                          className='text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors text-center sm:text-left sm:whitespace-nowrap'
                        >
                          or choose art from our collection
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className='mb-4 sm:mb-5 rounded-2xl border border-gray-200 bg-white p-3 sm:p-4'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                    <div>
                      <p className='text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'>
                        Estimated delivery:
                      </p>
                      <p className='mt-1.5 text-base sm:text-lg font-semibold text-[#f63a9e]'>
                        2-4 days
                      </p>
                    </div>
                    <div>
                      <p className='text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'>
                        Estimated delivery cost:
                      </p>
                      <p className='text-xl sm:text-2xl font-semibold text-[#f63a9e]'>
                        £5.99
                      </p>
                    </div>
                  </div>
                </div>

              </motion.div>
            </div>
          </div>
        </div>

        {/* Features + Product Details (Two Columns) */}
        <div className='py-6 sm:py-8 lg:py-10 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100'>
          <div className='max-w-[1400px] mx-auto px-4 sm:px-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 items-start'>
              <div className='rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm'>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className='text-center lg:text-left mb-5 sm:mb-6'
                >
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3 sm:mb-4 text-2xl sm:text-3xl"
                    style={{ fontWeight: '700' }}
                  >
                    Why Choose Our Prints
                  </h2>
                  <p className='text-gray-600 text-base sm:text-lg max-w-2xl lg:max-w-none mx-auto lg:mx-0'>
                    Premium quality materials and craftsmanship in every detail
                  </p>
                </motion.div>

                <div className='grid grid-cols-2 gap-3 sm:gap-4'>
                  {[
                    {
                      icon: Palette,
                      title: 'Museum Quality',
                      desc: 'Gallery-grade prints',
                    },
                    {
                      icon: Sparkles,
                      title: 'Fade Resistant',
                      desc: 'Archival inks last 100+ years',
                    },
                    {
                      icon: Truck,
                      title: 'Fast Delivery',
                      desc: 'Ships in 3-5 business days',
                    },
                    {
                      icon: Shield,
                      title: 'Guaranteed',
                      desc: '100% satisfaction promise',
                    },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className='bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#f63a9e]/30 transition-all text-center group'
                    >
                      <div className='w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#f63a9e]/10 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-[#f63a9e]/20 transition-colors'>
                        <feature.icon className='w-6 h-6 sm:w-7 sm:h-7 text-[#f63a9e]' />
                      </div>
                      <h3 className='font-bold text-gray-900 mb-1'>
                        {feature.title}
                      </h3>
                      <p className='text-sm text-gray-500'>{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className='rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm'>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className='text-center lg:text-left mb-5 sm:mb-6'
                >
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3 sm:mb-4 text-2xl sm:text-3xl"
                    style={{ fontWeight: '700' }}
                  >
                    Product Details
                  </h2>
                </motion.div>

                <Accordion
                  type='single'
                  collapsible
                  className='space-y-2 sm:space-y-3'
                >
                  <AccordionItem
                    value='specs'
                    className='border-2 border-gray-100 rounded-2xl px-4 sm:px-6 overflow-hidden'
                  >
                    <AccordionTrigger className='py-5 hover:no-underline'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-xl bg-[#f63a9e]/10 flex items-center justify-center'>
                          <Package className='w-5 h-5 text-[#f63a9e]' />
                        </div>
                        <span className='font-semibold text-gray-900 text-lg'>
                          Specifications
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='pb-6'>
                      <div className='grid grid-cols-2 gap-4'>
                        {product.specifications.map((spec: any, index: number) => (
                          <div key={index} className='bg-gray-50 rounded-xl p-4'>
                            <div className='text-sm text-gray-500 mb-1'>
                              {spec.label}
                            </div>
                            <div className='font-semibold text-gray-900'>
                              {spec.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem
                    value='shipping'
                    className='border-2 border-gray-100 rounded-2xl px-4 sm:px-6 overflow-hidden'
                  >
                    <AccordionTrigger className='py-4 sm:py-5 hover:no-underline'>
                      <div className='flex items-center gap-2 sm:gap-3'>
                        <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#f63a9e]/10 flex items-center justify-center'>
                          <Truck className='w-4 h-4 sm:w-5 sm:h-5 text-[#f63a9e]' />
                        </div>
                        <span className='font-semibold text-gray-900 text-base sm:text-lg'>
                          Shipping & Delivery
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='pb-6'>
                      <div className='space-y-4 text-gray-600'>
                        <p>
                          <strong className='text-gray-900'>
                            Free Standard UK Shipping
                          </strong>{' '}
                          on orders over £50
                        </p>
                        <p>
                          Standard delivery:{' '}
                          <strong className='text-gray-900'>
                            6 working days
                          </strong>
                        </p>
                        <p>
                          Express delivery:{' '}
                          <strong className='text-gray-900'>
                            3 working days
                          </strong>{' '}
                          — select at checkout
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem
                    value='care'
                    className='border-2 border-gray-100 rounded-2xl px-6 overflow-hidden'
                  >
                    <AccordionTrigger className='py-5 hover:no-underline'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-xl bg-[#f63a9e]/10 flex items-center justify-center'>
                          <Shield className='w-5 h-5 text-[#f63a9e]' />
                        </div>
                        <span className='font-semibold text-gray-900 text-lg'>
                          Care Instructions
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='pb-6'>
                      <ul className='space-y-3 text-gray-600'>
                        <li className='flex items-start gap-2'>
                          <Check className='w-4 h-4 text-green-500 mt-1 flex-shrink-0' />
                          <span>Dust gently with a soft, dry cloth</span>
                        </li>
                        <li className='flex items-start gap-2'>
                          <Check className='w-4 h-4 text-green-500 mt-1 flex-shrink-0' />
                          <span>Avoid direct sunlight to preserve colors</span>
                        </li>
                        <li className='flex items-start gap-2'>
                          <Check className='w-4 h-4 text-green-500 mt-1 flex-shrink-0' />
                          <span>Keep away from moisture and humidity</span>
                        </li>
                        <li className='flex items-start gap-2'>
                          <Check className='w-4 h-4 text-green-500 mt-1 flex-shrink-0' />
                          <span>Hang securely using provided hardware</span>
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem
                    value='returns'
                    className='border-2 border-gray-100 rounded-2xl px-6 overflow-hidden'
                  >
                    <AccordionTrigger className='py-5 hover:no-underline'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-xl bg-[#f63a9e]/10 flex items-center justify-center'>
                          <RotateCcw className='w-5 h-5 text-[#f63a9e]' />
                        </div>
                        <span className='font-semibold text-gray-900 text-lg'>
                          Returns & Guarantee
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='pb-6'>
                      <div className='space-y-4 text-gray-600'>
                        <p>
                          <strong className='text-gray-900'>
                            7-Day Satisfaction Guarantee
                          </strong>
                        </p>
                        <p>
                          Not completely satisfied? Report your issue within 7 days
                          and we'll arrange a replacement or refund.
                        </p>
                        <p>
                          If your canvas arrives damaged, we&apos;ll send a
                          replacement immediately at no extra cost.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className='py-6 sm:py-8 lg:py-10 bg-gradient-to-br from-[#FFF5FB] to-white border-t border-gray-100'>
          <div className='max-w-[1400px] mx-auto px-4 sm:px-6'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className='flex flex-col md:flex-row md:items-center justify-between mb-6 sm:mb-8 gap-4'
            >
              <div>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2 text-2xl sm:text-3xl"
                  style={{ fontWeight: '700' }}
                >
                  Customer Reviews
                </h2>
                <div className='flex items-center gap-2 sm:gap-3 flex-wrap'>
                  <div className='flex items-center gap-1'>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className='w-6 h-6 text-amber-400 fill-current'
                      />
                    ))}
                  </div>
                  <span className='text-2xl font-bold text-gray-900'>
                    {product.averageRating}
                  </span>
                  <span className='text-gray-500'>
                    ({product.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </motion.div>

            <div className='grid md:grid-cols-3 gap-4 sm:gap-6'>
              {mockReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className='relative bg-white rounded-3xl p-6 sm:p-7 shadow-md border border-gray-100 hover:shadow-2xl hover:border-[#f63a9e]/20 transition-all duration-300 overflow-hidden group'
                >
                  {/* Decorative quote */}
                  <div className='absolute top-4 right-5 text-7xl font-serif text-[#f63a9e]/8 leading-none select-none group-hover:text-[#f63a9e]/15 transition-colors'>&ldquo;</div>

                  {/* Stars */}
                  <div className='flex items-center gap-0.5 mb-4'>
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className='w-4 h-4 text-amber-400 fill-current' />
                    ))}
                    <span className='ml-2 text-xs text-gray-500 font-medium'>{review.date}</span>
                  </div>

                  {/* Review text */}
                  <p className='text-gray-600 leading-relaxed text-sm sm:text-base mb-5 relative z-10'>{review.text}</p>

                  {/* Author */}
                  <div className='flex items-center gap-3 pt-4 border-t border-gray-100'>
                    <img
                      src={review.image}
                      alt={review.name}
                      className='w-10 h-10 rounded-full object-cover ring-2 ring-[#f63a9e]/20'
                    />
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold text-gray-900 text-sm'>{review.name}</span>
                        {review.verified && (
                          <span className='flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-semibold rounded-full'>
                            <Check className='w-2.5 h-2.5' /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className='py-6 xs:py-7 sm:py-10 md:py-12 lg:py-16 bg-white'>
            <div className='max-w-[1400px] mx-auto px-3 xs:px-4 sm:px-6'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 xs:mb-5 sm:mb-6 md:mb-8 gap-2 xs:gap-3 sm:gap-0'
              >
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-lg xs:text-xl sm:text-2xl md:text-3xl"
                  style={{ fontWeight: '700' }}
                >
                  You Might Also Like
                </h2>
                <Button
                  variant='outline'
                  onClick={() => navigate('/products')}
                  className='border-2 border-gray-200 hover:border-[#f63a9e] hover:text-[#f63a9e] rounded-full px-3 xs:px-4 sm:px-6 text-xs xs:text-sm sm:text-base h-8 xs:h-9 sm:h-10'
                >
                  View All Products
                </Button>
              </motion.div>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-2 xs:gap-2.5 sm:gap-4 md:gap-6'>
                {relatedProducts.map((relProduct, index) => {
                  const relStarting = getLowestSizePriceFromConfig(
                    relProduct.config
                  );
                  return (
                  <motion.div
                    key={relProduct.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    onClick={() =>
                      navigate(`/product/${relProduct.slug || relProduct.id}`)
                    }
                    className='group cursor-pointer'
                  >
                    <div className='relative bg-white rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100'>
                      <div className='aspect-square overflow-hidden'>
                        <ImageWithFallback
                          src={
                            relProduct.images?.[0] || '/assets/placeholder.png'
                          }
                          alt={relProduct.name}
                          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                        />
                      </div>

                      <div className={`flex items-center justify-between p-2 xs:p-2.5 sm:p-3 md:p-4`}>
                        <div className='flex flex-col'>
                          <span className='text-gray-500 text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-0.5 xs:mb-1'>
                            Starting At
                          </span>

                          <div className='flex items-start'>
                            <div className='flex items-start text-[#f63a9e]'>
                              <span className='font-bold text-xs xs:text-sm sm:text-base md:text-lg mt-1 xs:mt-1.5 sm:mt-2 mr-0.5'>
                                £
                              </span>

                              <span className='font-extrabold text-xl xs:text-2xl sm:text-3xl md:text-4xl tracking-tighter leading-none font-bricolage'>
                                {relStarting != null
                                  ? formatGbpAmount(relStarting).split('.')[0]
                                  : '—'}
                              </span>

                              <span className='font-bold text-sm xs:text-base sm:text-lg md:text-xl mt-1 xs:mt-1.5 sm:mt-2'>
                                {relStarting != null &&
                                formatGbpAmount(relStarting).includes('.')
                                  ? `.${formatGbpAmount(relStarting).split('.')[1]}`
                                  : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className='w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-[#f63a9e] text-white rounded-full flex items-center justify-center hover:bg-[#e02d8d] transition-colors shadow-md flex-shrink-0'>
                          <span className='text-sm xs:text-base sm:text-lg font-bold'>→</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
                })}
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}
