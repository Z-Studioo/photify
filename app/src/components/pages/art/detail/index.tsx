import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import {
  ArrowLeft,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Image as ImageIcon,
  Frame,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ArtDetailPageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  artProduct: Record<string, unknown> & { [key: string]: any };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  config: { configurerType?: string };
}

interface SimilarArt {
  id: string;
  slug: string;
  name: string;
  image: string;
  images: string[];
  price: string;
  category: string;
}

const PRODUCT_TYPE_OPTIONS = [
  {
    configurerType: 'single-canvas',
    label: 'Single Canvas Print',
    description: 'Print this artwork on a single premium canvas in your chosen size.',
    icon: ImageIcon,
    accent: '#f63a9e',
    bg: 'from-pink-50 to-white',
  },
  {
    configurerType: 'multi-canvas-wall',
    label: '3-Canvas Gallery Wall',
    description: 'Split or repeat this artwork across 3 side-by-side canvases for a statement wall.',
    icon: LayoutGrid,
    accent: '#6366f1',
    bg: 'from-indigo-50 to-white',
  },
  {
    configurerType: 'poster-collage',
    label: 'Poster / Event Stand',
    description: 'Print as a large poster displayed on a premium canvas stand.',
    icon: Frame,
    accent: '#10b981',
    bg: 'from-emerald-50 to-white',
  },
];

export function ArtDetailPage({ artProduct }: ArtDetailPageProps) {
  const navigate = useNavigate();
  const supabase = createClient();

  const [mainImage, setMainImage] = useState(0);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<SimilarArt[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  const images: string[] =
    artProduct.images?.length > 0
      ? artProduct.images
      : artProduct.image_url
      ? [artProduct.image_url]
      : [
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=800&fit=crop',
        ];

  // Pre-fetch products when selector opens
  useEffect(() => {
    if (!showProductSelector || products.length > 0) return;
    const fetch = async () => {
      setLoadingProducts(true);
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, description, images, config')
        .eq('active', true)
        .not('config->>configurerType', 'is', null);
      if (data) setProducts(data as Product[]);
      setLoadingProducts(false);
    };
    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProductSelector, supabase]);

  // Fetch similar art products based on shared tags
  useEffect(() => {
    const fetchSimilar = async () => {
      setLoadingSimilar(true);
      try {
        // Extract tag IDs from current product's junction records
        const tagIds: string[] = ((artProduct.art_product_tags || []) as { tag_id: string }[]).map((apt) => apt.tag_id).filter(Boolean);

        if (tagIds.length === 0) {
          setSimilarProducts([]);
          setLoadingSimilar(false);
          return;
        }

        // Find other art products sharing any of these tags
        const { data: junctions } = await supabase
          .from('art_product_tags')
          .select('art_product_id')
          .in('tag_id', tagIds)
          .neq('art_product_id', artProduct.id as string);

        const similarIds = [...new Set((junctions || []).map((j: { art_product_id: string }) => j.art_product_id))].slice(0, 6);

        if (similarIds.length === 0) {
          setSimilarProducts([]);
          setLoadingSimilar(false);
          return;
        }

        const { data: similarData } = await supabase
          .from('art_products')
          .select('id, slug, name, image, images, price, category')
          .in('id', similarIds)
          .eq('status', 'active');

        setSimilarProducts((similarData || []) as SimilarArt[]);
      } finally {
        setLoadingSimilar(false);
      }
    };
    fetchSimilar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artProduct.id]);

  const artImageUrl = images[0]; // Primary art image to pre-feed

  const handleSelectProductType = (configurerType: string) => {
    const product = products.find(p => p.config?.configurerType === configurerType);
    const encodedArt = encodeURIComponent(artImageUrl);

    if (configurerType === 'single-canvas') {
      navigate(
        `/customize/single-canvas?artImageUrl=${encodedArt}${product ? `&productId=${product.id}` : ''}`
      );
    } else if (configurerType === 'multi-canvas-wall') {
      navigate(
        `/customize/multi-canvas-wall?artImageUrl=${encodedArt}${product ? `&productId=${product.id}` : ''}`
      );
    } else if (configurerType === 'poster-collage') {
      navigate(
        `/customize/poster-collage?artImageUrl=${encodedArt}${product ? `&productId=${product.id}` : ''}`
      );
    }
  };

  return (
    <div className="min-h-screen font-['Mona_Sans',_sans-serif] bg-white">
      <Header />

      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10'>
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className='flex items-center gap-2 text-gray-500 hover:text-[#f63a9e] transition-colors mb-6 group'
        >
          <ArrowLeft className='w-4 h-4 group-hover:-translate-x-1 transition-transform' />
          <span className='text-sm font-medium'>Back</span>
        </button>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16'>
          {/* Images */}
          <div className='space-y-4'>
            {/* Main image */}
            <div className='relative rounded-2xl overflow-hidden bg-gray-50 aspect-square'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={mainImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className='w-full h-full'
                >
                  <ImageWithFallback
                    src={images[mainImage]}
                    alt={artProduct.name || 'Artwork'}
                    className='w-full h-full object-contain'
                  />
                </motion.div>
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setMainImage(i => (i === 0 ? images.length - 1 : i - 1))}
                    className='absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors'
                  >
                    <ChevronLeft className='w-4 h-4 text-gray-700' />
                  </button>
                  <button
                    onClick={() => setMainImage(i => (i === images.length - 1 ? 0 : i + 1))}
                    className='absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors'
                  >
                    <ChevronRight className='w-4 h-4 text-gray-700' />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className='flex gap-2 overflow-x-auto pb-1'>
                {images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setMainImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      mainImage === i ? 'border-[#f63a9e] shadow-md' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt='' className='w-full h-full object-cover' />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className='flex flex-col'>
            {artProduct.collection_name && (
              <p className='text-sm font-semibold text-[#f63a9e] uppercase tracking-wide mb-2'>
                {artProduct.collection_name}
              </p>
            )}

            <h1
              className="font-['Bricolage_Grotesque',_sans-serif] text-3xl sm:text-4xl text-gray-900 mb-3"
              style={{ fontWeight: '700' }}
            >
              {artProduct.name}
            </h1>

            {/* Rating */}
            <div className='flex items-center gap-2 mb-4'>
              <div className='flex text-amber-400'>
                {[...Array(5)].map((_, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <Star key={`star-${i}`} className='w-4 h-4 fill-current' />
                ))}
              </div>
              <span className='text-sm text-gray-500'>4.9 · 128 reviews</span>
            </div>

            {artProduct.description && (
              <p className='text-gray-600 leading-relaxed mb-6'>{artProduct.description}</p>
            )}

            {/* Tags */}
            {artProduct.tags?.length > 0 && (
              <div className='flex flex-wrap gap-2 mb-6'>
                {artProduct.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className='px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium'
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className='mt-auto pt-6 border-t border-gray-100 space-y-3'>
              <Button
                onClick={() => setShowProductSelector(true)}
                className='w-full h-14 bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl text-base'
                style={{ fontWeight: '700' }}
              >
                Use This Artwork
                <ArrowRight className='ml-2 w-5 h-5' />
              </Button>
              <p className='text-center text-xs text-gray-400'>
                Choose a product type on the next step
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products Section */}
      {!loadingSimilar && similarProducts.length > 0 && (
        <section className='border-t border-gray-100 py-12'>
          <div className='max-w-[1400px] mx-auto px-4 sm:px-6'>
            <div className='flex items-center gap-2 mb-6'>
              <Sparkles className='w-5 h-5 text-[#f63a9e]' />
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] text-2xl text-gray-900"
                style={{ fontWeight: '700' }}
              >
                You Might Also Like
              </h2>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'>
              {similarProducts.map((product) => {
                const thumb =
                  (Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0]
                    : null) || product.image || '';
                return (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className='group cursor-pointer'
                    onClick={() => navigate(`/art/${product.slug || product.id}`)}
                  >
                    <div className='aspect-square rounded-xl overflow-hidden bg-gray-50 mb-2'>
                      <ImageWithFallback
                        src={thumb}
                        alt={product.name}
                        className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                      />
                    </div>
                    <p className='text-sm font-semibold text-gray-900 truncate'>{product.name}</p>
                    {product.price && (
                      <p className='text-sm text-[#f63a9e] font-medium mt-0.5'>{product.price}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Product Type Selector Modal */}
      <AnimatePresence>
        {showProductSelector && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProductSelector(false)}
              className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50'
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className='fixed inset-0 z-50 flex items-center justify-center p-4'
            >
              <div className='bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                {/* Header */}
                <div className='flex items-start justify-between px-6 py-5 border-b border-gray-100'>
                  <div>
                    <h2
                      className="font-['Bricolage_Grotesque',_sans-serif] text-xl text-gray-900"
                      style={{ fontWeight: '700' }}
                    >
                      Choose a Product Type
                    </h2>
                    <p className='text-sm text-gray-500 mt-0.5'>
                      Your artwork will be pre-loaded and ready to customise
                    </p>
                  </div>
                  <button
                    onClick={() => setShowProductSelector(false)}
                    className='w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0 ml-4'
                  >
                    <X className='w-4 h-4 text-gray-600' />
                  </button>
                </div>

                {/* Art preview strip */}
                <div className='flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100'>
                  <div className='w-14 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0'>
                    <img src={artImageUrl} alt='' className='w-full h-full object-cover' />
                  </div>
                  <div>
                    <p className='text-xs text-gray-500'>Selected artwork</p>
                    <p className='text-sm font-semibold text-gray-900 truncate max-w-xs'>
                      {artProduct.name}
                    </p>
                  </div>
                  <Check className='ml-auto w-5 h-5 text-[#f63a9e] flex-shrink-0' />
                </div>

                {/* Options */}
                <div className='p-6 space-y-3'>
                  {loadingProducts ? (
                    <div className='flex items-center justify-center py-8'>
                      <div className='w-8 h-8 border-2 border-[#f63a9e] border-t-transparent rounded-full animate-spin' />
                    </div>
                  ) : (
                    PRODUCT_TYPE_OPTIONS.map(option => {
                      const Icon = option.icon;
                      return (
                        <motion.button
                          key={option.configurerType}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleSelectProductType(option.configurerType)}
                          className={`w-full text-left p-4 rounded-2xl border-2 border-gray-100 bg-gradient-to-r ${option.bg} hover:border-gray-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4`}
                        >
                          <div
                            className='w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0'
                            style={{ backgroundColor: `${option.accent}18` }}
                          >
                            <Icon className='w-6 h-6' style={{ color: option.accent }} />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='font-semibold text-gray-900 text-sm'>
                              {option.label}
                            </p>
                            <p className='text-xs text-gray-500 mt-0.5 leading-relaxed'>
                              {option.description}
                            </p>
                          </div>
                          <ArrowRight className='w-4 h-4 text-gray-400 flex-shrink-0' />
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
