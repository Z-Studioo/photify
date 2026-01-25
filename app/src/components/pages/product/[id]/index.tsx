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
  Share2,
  Star,
  Truck,
  RotateCcw,
  Shield,
  Sparkles,
  Clock,
  Eye,
  Package,
  Palette,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConfigurerById } from '@/lib/configures/registry';
import { createClient } from '@/lib/supabase/client';

// Mock reviews data
const mockReviews = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    rating: 5,
    date: '2 weeks ago',
    text: 'Absolutely stunning quality! The colors are so vibrant and the canvas feels premium. My living room looks amazing now.',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    verified: true,
  },
  {
    id: 2,
    name: 'James Wilson',
    rating: 5,
    date: '1 month ago',
    text: 'Perfect gift for my parents anniversary. They loved it! Delivery was super fast too.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    verified: true,
  },
  {
    id: 3,
    name: 'Emma Thompson',
    rating: 5,
    date: '3 weeks ago',
    text: 'Third canvas I have ordered and each one has been flawless. The gallery wrap edges are beautifully done.',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    verified: true,
  },
];

// Room backgrounds for visualization
const roomBackgrounds = [
  {
    id: 'living',
    name: 'Living Room',
    image:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=800&fit=crop',
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    image:
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&h=800&fit=crop',
  },
  {
    id: 'office',
    name: 'Office',
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop',
  },
  {
    id: 'dining',
    name: 'Dining',
    image:
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1200&h=800&fit=crop',
  },
];

interface ProductDetailPageProps {
  initialProduct: any;
  productSlug: string;
}

export function ProductDetailPage({
  initialProduct,
  productSlug,
}: ProductDetailPageProps) {
  const navigate = useNavigate();
  const supabase = createClient();

  // State
  const [mainImage, setMainImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('living');
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [viewersCount] = useState(() => Math.floor(Math.random() * 20) + 15);

  // Refs
  const heroRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Scroll tracking for sticky bar
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

  // Fetch related products
  useEffect(() => {
    async function fetchRelated() {
      if (!initialProduct?.id) return;

      const { data } = await supabase
        .from('products')
        .select('id, name, slug, images, price, is_featured')
        .neq('id', initialProduct.id)
        .eq('active', true)
        .limit(4);

      if (data) setRelatedProducts(data);
    }
    fetchRelated();
  }, [initialProduct?.id]);

  // Product data
  const productData = initialProduct;
  const product = {
    id: initialProduct.id,
    title: initialProduct.name,
    price: initialProduct.price,
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
    reviewCount: 128,
  };

  // Check if product has configurator
  const hasConfigurer = productData?.config?.configurerType;
  const configurerType = productData?.config?.configurerType;
  const isCollageProduct =
    productSlug === 'photo-collage-creator' ||
    productSlug === '1PhotoCollageCreator';

  // Handlers
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
    navigate('/customize/photo-collage-creator');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
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
            <div className='max-w-[1400px] mx-auto px-6 py-3'>
              <div className='flex items-center justify-between gap-4'>
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                    <ImageWithFallback
                      src={product.images[0]}
                      alt={product.title}
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <div className='hidden sm:block'>
                    <h3 className='font-semibold text-gray-900 text-sm line-clamp-1'>
                      {product.title}
                    </h3>
                    <p className='text-[#f63a9e] font-bold'>
                      From £{product.price}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
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
                    className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white px-6 h-10 rounded-full font-bold text-sm shadow-lg shadow-pink-500/25'
                  >
                    <Sparkles className='w-4 h-4 mr-2' />
                    Customize Now
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
        className='bg-gradient-to-br from-[#FFF5FB] via-white to-pink-50/30'
      >
        {/* Back Button Row */}
        <div className='max-w-[1400px] mx-auto px-6 pt-6'>
          <div className='flex items-center justify-between'>
            <motion.button
              onClick={() => navigate(-1)}
              className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group'
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className='w-10 h-10 rounded-full bg-white border-2 border-gray-200 group-hover:border-[#f63a9e] flex items-center justify-center transition-all shadow-sm group-hover:shadow-md'>
                <ArrowLeft className='w-5 h-5 group-hover:text-[#f63a9e] transition-colors' />
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
              <motion.button
                onClick={handleShare}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className='w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#f63a9e] hover:text-[#f63a9e] transition-all shadow-sm'
              >
                <Share2 className='w-5 h-5' />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Main Hero Content */}
        <div className='max-w-[1400px] mx-auto px-6 py-8 lg:py-12'>
          <div className='grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-16'>
            {/* Left: Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Main Image */}
              <div className='relative bg-white rounded-3xl overflow-hidden shadow-2xl shadow-pink-500/10 group'>
                {/* Badge */}
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
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className='aspect-square'
                  >
                    <ImageWithFallback
                      src={product.images[mainImage]}
                      alt={product.title}
                      className='w-full h-full object-cover'
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                {product.images.length > 1 && (
                  <>
                    <motion.button
                      onClick={handlePrevImage}
                      className='absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110'
                      whileTap={{ scale: 0.9 }}
                    >
                      <ChevronLeft className='w-6 h-6 text-gray-900' />
                    </motion.button>

                    <motion.button
                      onClick={handleNextImage}
                      className='absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110'
                      whileTap={{ scale: 0.9 }}
                    >
                      <ChevronRight className='w-6 h-6 text-gray-900' />
                    </motion.button>
                  </>
                )}

                {/* Image Counter */}
                {product.images.length > 1 && (
                  <div className='absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium'>
                    {mainImage + 1} / {product.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className='flex gap-3 mt-4 overflow-x-auto pb-2'>
                  {product.images.map((img: string, index: number) => (
                    <motion.button
                      key={index}
                      onClick={() => setMainImage(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        mainImage === index
                          ? 'border-[#f63a9e] shadow-lg shadow-pink-500/20'
                          : 'border-gray-200 hover:border-gray-300'
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
              className='flex flex-col'
            >
              {/* Title & Rating */}
              <div className='mb-6'>
                <h1
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                  style={{
                    fontSize: '42px',
                    fontWeight: '700',
                    lineHeight: '1.1',
                  }}
                >
                  {product.title}
                </h1>

                {/* Rating Row */}
                <div className='flex items-center gap-4 mb-4'>
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

                {/* Price */}
                <div className='flex items-baseline gap-3'>
                  <span
                    className='text-[#f63a9e]'
                    style={{ fontSize: '36px', fontWeight: '700' }}
                  >
                    £{product.price}
                  </span>
                  <span className='text-gray-500 text-lg'>per sq in</span>
                </div>
              </div>

              {/* Description */}
              <p className='text-gray-600 text-lg leading-relaxed mb-6'>
                {product.description}
              </p>

              {/* Quick Trust Signals */}
              <div className='grid grid-cols-2 gap-3 mb-6'>
                {[
                  { icon: Truck, text: 'Free UK Shipping' },
                  { icon: RotateCcw, text: '30-Day Returns' },
                  { icon: Shield, text: 'Quality Guarantee' },
                  { icon: Clock, text: 'Ships in 3-5 Days' },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className='flex items-center gap-2 text-gray-700'
                  >
                    <div className='w-8 h-8 rounded-full bg-green-50 flex items-center justify-center'>
                      <item.icon className='w-4 h-4 text-green-600' />
                    </div>
                    <span className='text-sm font-medium'>{item.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA Section */}
              <div ref={ctaRef} className='space-y-4 mb-6'>
                {(isCollageProduct || hasConfigurer) && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={
                        isCollageProduct
                          ? handleOpenCollageCreator
                          : handleCustomize
                      }
                      className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-14 rounded-2xl text-lg shadow-xl shadow-pink-500/30 transition-all'
                      style={{ fontWeight: '700' }}
                    >
                      <Sparkles className='w-5 h-5 mr-2' />
                      {isCollageProduct
                        ? 'Create Your Photo Collage'
                        : (() => {
                            const configurer = getConfigurerById(
                              configurerType || ''
                            );
                            return configurer
                              ? `Start ${configurer.name}`
                              : 'Customize Your Canvas';
                          })()}
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Live Viewers */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className='flex items-center gap-2 text-gray-600'
              >
                <div className='flex items-center gap-1'>
                  <span className='relative flex h-3 w-3'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75' />
                    <span className='relative inline-flex rounded-full h-3 w-3 bg-green-500' />
                  </span>
                </div>
                <Eye className='w-4 h-4' />
                <span className='text-sm'>
                  <strong className='text-gray-900'>
                    {viewersCount} people
                  </strong>{' '}
                  are viewing this right now
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Trust Strip */}
      <div className='bg-gray-900 text-white py-4 overflow-hidden'>
        <div className='max-w-[1400px] mx-auto px-6'>
          <div className='flex flex-wrap justify-center md:justify-between items-center gap-6 md:gap-8'>
            {[
              { icon: Truck, text: 'Free UK Shipping Over £50' },
              { icon: Clock, text: 'Fast 3-5 Day Production' },
              { icon: RotateCcw, text: '30-Day Easy Returns' },
              { icon: Users, text: '10,000+ Happy Customers' },
              { icon: Star, text: '4.9 Average Rating' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className='flex items-center gap-2 text-sm'
              >
                <item.icon className='w-4 h-4 text-[#f63a9e]' />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Cards Section */}
      <div className='py-16 bg-white'>
        <div className='max-w-[1400px] mx-auto px-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
              style={{ fontSize: '32px', fontWeight: '700' }}
            >
              Why Choose Our Canvas Prints
            </h2>
            <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
              Premium quality materials and craftsmanship in every detail
            </p>
          </motion.div>

          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {[
              {
                icon: Palette,
                title: 'Museum Quality',
                desc: 'Gallery-grade canvas',
              },
              {
                icon: Sparkles,
                title: 'Fade Resistant',
                desc: 'Archival inks last 100+ years',
              },
              {
                icon: Package,
                title: 'Premium Frames',
                desc: 'Kiln-dried pine wood',
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
                className='bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#f63a9e]/30 transition-all text-center group'
              >
                <div className='w-14 h-14 rounded-2xl bg-[#f63a9e]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#f63a9e]/20 transition-colors'>
                  <feature.icon className='w-7 h-7 text-[#f63a9e]' />
                </div>
                <h3 className='font-bold text-gray-900 mb-1'>
                  {feature.title}
                </h3>
                <p className='text-sm text-gray-500'>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Visualization Section */}
      <div className='py-16 bg-gradient-to-br from-gray-50 to-white'>
        <div className='max-w-[1400px] mx-auto px-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-8'
          >
            <h2
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
              style={{ fontSize: '32px', fontWeight: '700' }}
            >
              See It In Your Space
            </h2>
            <p className='text-gray-600 text-lg'>
              Visualize how your canvas will look in different rooms
            </p>
          </motion.div>

          {/* Room Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className='relative rounded-3xl overflow-hidden shadow-2xl mb-6'
          >
            <div className='aspect-[16/9] md:aspect-[21/9] relative'>
              <ImageWithFallback
                src={
                  roomBackgrounds.find(r => r.id === selectedRoom)?.image ||
                  roomBackgrounds[0].image
                }
                alt='Room preview'
                className='w-full h-full object-cover'
              />
              {/* Canvas Overlay */}
              <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25%] aspect-square shadow-2xl'>
                <ImageWithFallback
                  src={product.images[0]}
                  alt={product.title}
                  className='w-full h-full object-cover rounded-sm'
                />
              </div>
            </div>
          </motion.div>

          {/* Room Selector */}
          <div className='flex justify-center gap-3 flex-wrap'>
            {roomBackgrounds.map(room => (
              <motion.button
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                  selectedRoom === room.id
                    ? 'bg-[#f63a9e] text-white shadow-lg shadow-pink-500/30'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#f63a9e]'
                }`}
              >
                {room.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Accordion Specs Section */}
      <div className='py-16 bg-white'>
        <div className='max-w-3xl mx-auto px-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-8'
          >
            <h2
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
              style={{ fontSize: '32px', fontWeight: '700' }}
            >
              Product Details
            </h2>
          </motion.div>

          <Accordion type='single' collapsible className='space-y-3'>
            <AccordionItem
              value='specs'
              className='border-2 border-gray-100 rounded-2xl px-6 overflow-hidden'
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
              className='border-2 border-gray-100 rounded-2xl px-6 overflow-hidden'
            >
              <AccordionTrigger className='py-5 hover:no-underline'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-[#f63a9e]/10 flex items-center justify-center'>
                    <Truck className='w-5 h-5 text-[#f63a9e]' />
                  </div>
                  <span className='font-semibold text-gray-900 text-lg'>
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
                    Production time:{' '}
                    <strong className='text-gray-900'>3-5 business days</strong>
                  </p>
                  <p>
                    Standard delivery:{' '}
                    <strong className='text-gray-900'>3-5 business days</strong>{' '}
                    after production
                  </p>
                  <p>
                    Express delivery available at checkout for faster arrival
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
                      30-Day Satisfaction Guarantee
                    </strong>
                  </p>
                  <p>
                    Not completely satisfied? Return your canvas within 30 days
                    for a full refund or replacement.
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

      {/* Reviews Section */}
      <div className='py-16 bg-gradient-to-br from-[#FFF5FB] to-white'>
        <div className='max-w-[1400px] mx-auto px-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='flex flex-col md:flex-row md:items-center justify-between mb-12'
          >
            <div>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2"
                style={{ fontSize: '32px', fontWeight: '700' }}
              >
                Customer Reviews
              </h2>
              <div className='flex items-center gap-3'>
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

          <div className='grid md:grid-cols-3 gap-6'>
            {mockReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className='bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow'
              >
                <div className='flex items-center gap-4 mb-4'>
                  <img
                    src={review.image}
                    alt={review.name}
                    className='w-12 h-12 rounded-full object-cover'
                  />
                  <div>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold text-gray-900'>
                        {review.name}
                      </span>
                      {review.verified && (
                        <span className='px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full'>
                          Verified
                        </span>
                      )}
                    </div>
                    <span className='text-sm text-gray-500'>{review.date}</span>
                  </div>
                </div>

                <div className='flex items-center gap-1 mb-3'>
                  {[...Array(review.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className='w-4 h-4 text-amber-400 fill-current'
                    />
                  ))}
                </div>

                <p className='text-gray-600 leading-relaxed'>{review.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className='py-16 bg-white'>
          <div className='max-w-[1400px] mx-auto px-6'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className='flex items-center justify-between mb-8'
            >
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                style={{ fontSize: '32px', fontWeight: '700' }}
              >
                You Might Also Like
              </h2>
              <Button
                variant='outline'
                onClick={() => navigate('/products')}
                className='border-2 border-gray-200 hover:border-[#f63a9e] hover:text-[#f63a9e] rounded-full px-6'
              >
                View All Products
              </Button>
            </motion.div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
              {relatedProducts.map((relProduct, index) => (
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
                  <div className='relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100'>
                    {relProduct.is_featured && (
                      <div className='absolute top-3 left-3 z-10'>
                        <div className='px-2 py-1 bg-gradient-to-r from-[#f63a9e] to-[#e02d8d] text-white rounded-full text-xs font-bold'>
                          ⭐ BESTSELLER
                        </div>
                      </div>
                    )}

                    <div className='aspect-square overflow-hidden'>
                      <ImageWithFallback
                        src={
                          relProduct.images?.[0] || '/assets/placeholder.png'
                        }
                        alt={relProduct.name}
                        className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                      />
                    </div>

                    <div className='p-4'>
                      <h3 className='font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#f63a9e] transition-colors'>
                        {relProduct.name}
                      </h3>
                      <p className='text-[#f63a9e] font-bold'>
                        £{relProduct.price}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Final CTA Section */}
      <div className='py-20 bg-gradient-to-r from-[#f63a9e] to-[#e02d8d]'>
        <div className='max-w-3xl mx-auto px-6 text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="font-['Bricolage_Grotesque',_sans-serif] text-white mb-4"
              style={{ fontSize: '36px', fontWeight: '700' }}
            >
              Ready to Create Your Masterpiece?
            </h2>
            <p className='text-white/90 text-lg mb-8'>
              Transform your memories into stunning wall art today
            </p>

            {(isCollageProduct || hasConfigurer) && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={
                    isCollageProduct
                      ? handleOpenCollageCreator
                      : handleCustomize
                  }
                  className='bg-white text-[#f63a9e] hover:bg-gray-100 h-14 px-10 rounded-2xl text-lg shadow-xl'
                  style={{ fontWeight: '700' }}
                >
                  <Sparkles className='w-5 h-5 mr-2' />
                  Start Customizing
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
