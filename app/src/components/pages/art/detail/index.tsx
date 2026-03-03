import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpload } from '@/context/UploadContext';
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
  Shield,
  Truck,
  RefreshCw,
  Palette,
  Tag,
  Loader2,
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
  const { setArtFixedPrice, setArtName, setFile, setPreview, setOriginalPreview } = useUpload();

  const [mainImage, setMainImage] = useState(0);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [navigating, setNavigating] = useState(false);
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

  const handleSelectProductType = async (configurerType: string) => {
    const product = products.find(p => p.config?.configurerType === configurerType);
    const encodedArt = encodeURIComponent(artImageUrl);

    if (configurerType === 'single-canvas') {
      // Parse price and name
      const rawPrice = String(artProduct.price || '0').replace(/[^0-9.]/g, '');
      const fixedPrice = parseFloat(rawPrice) || 0;
      const artNameStr = String(artProduct.name || '').trim();

      // Set context values DIRECTLY — the UploadProvider is already mounted during
      // in-app navigation so restore() won't run again.
      setArtFixedPrice(fixedPrice);
      setArtName(artNameStr);

      // Also keep sessionStorage as a page-refresh fallback
      sessionStorage.setItem('photify_art_image_url', artImageUrl);
      if (fixedPrice > 0) sessionStorage.setItem('photify_art_fixed_price', String(fixedPrice));
      if (artNameStr) sessionStorage.setItem('photify_art_name', artNameStr);

      // Fetch the art image and set it in context so the dashboard gets the image immediately
      setNavigating(true);
      try {
        const response = await fetch(artImageUrl);
        const blob = await response.blob();
        const ext = blob.type.split('/')[1] || 'jpg';
        const artFile = new File([blob], `art-${Date.now()}.${ext}`, { type: blob.type });
        // setFile triggers the UploadContext useEffect that converts to base64 and persists to IndexedDB
        setFile(artFile);
      } catch {
        // Fallback: set URL as preview directly
        setPreview(artImageUrl);
        setOriginalPreview(artImageUrl);
      } finally {
        setNavigating(false);
      }

      navigate('/dashboard');
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

      {/* Hero — blurred art backdrop */}
      <div className='relative overflow-hidden'>
        {/* Blurred background */}
        <div
          className='absolute inset-0 scale-110 blur-3xl opacity-20 pointer-events-none'
          style={{
            backgroundImage: `url(${images[0]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className='absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-white pointer-events-none' />

        <div className='relative max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 pb-10'>
          {/* Back */}
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className='flex items-center gap-2 text-gray-500 hover:text-[#f63a9e] transition-colors mb-8 group'
          >
            <ArrowLeft className='w-4 h-4 group-hover:-translate-x-1 transition-transform' />
            <span className='text-sm font-medium'>Back to collection</span>
          </motion.button>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start'>

            {/* ── LEFT: Image gallery ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='space-y-3'
            >
              {/* Main image */}
              <div className='relative rounded-3xl overflow-hidden bg-gray-50 shadow-2xl shadow-gray-200/60 aspect-square'>
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={mainImage}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.3 }}
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
                      className='absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-lg flex items-center justify-center hover:bg-white transition-all hover:scale-110'
                    >
                      <ChevronLeft className='w-5 h-5 text-gray-700' />
                    </button>
                    <button
                      onClick={() => setMainImage(i => (i === images.length - 1 ? 0 : i + 1))}
                      className='absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-lg flex items-center justify-center hover:bg-white transition-all hover:scale-110'
                    >
                      <ChevronRight className='w-5 h-5 text-gray-700' />
                    </button>
                  </>
                )}

                {/* Image count badge */}
                {images.length > 1 && (
                  <div className='absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm'>
                    {mainImage + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className='flex gap-2 overflow-x-auto pb-1'>
                  {images.map((img, i) => (
                    <motion.button
                      key={img}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setMainImage(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        mainImage === i
                          ? 'border-[#f63a9e] shadow-md shadow-pink-200/60'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt='' className='w-full h-full object-cover' />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── RIGHT: Info panel ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className='flex flex-col gap-5 lg:pt-2'
            >
              {/* Category / collection badge */}
              <div className='flex flex-wrap items-center gap-2'>
                {artProduct.category && (
                  <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-[#f63a9e] text-xs font-semibold uppercase tracking-wide border border-pink-100'>
                    <Palette className='w-3 h-3' />
                    {artProduct.category}
                  </span>
                )}
                {artProduct.collection_name && (
                  <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold border border-purple-100'>
                    {artProduct.collection_name}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] text-3xl sm:text-4xl lg:text-5xl text-gray-900 leading-tight"
                style={{ fontWeight: '800' }}
              >
                {artProduct.name}
              </h1>

              {/* Rating row */}
              <div className='flex items-center gap-3'>
                <div className='flex text-amber-400'>
                  {[...Array(5)].map((_, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Star key={`star-${i}`} className='w-4 h-4 fill-current' />
                  ))}
                </div>
                <span className='text-sm font-semibold text-gray-700'>4.9</span>
                <span className='text-sm text-gray-400'>· 128 reviews</span>
              </div>

              {/* Price */}
              {artProduct.price && (
                <div className='flex items-baseline gap-2'>
                  <span className='text-xs text-gray-400 uppercase tracking-wider font-semibold'>Starting at</span>
                  <span className='text-3xl font-extrabold text-[#f63a9e] tracking-tight'>
                    {String(artProduct.price).startsWith('£') ? artProduct.price : `£${artProduct.price}`}
                  </span>
                </div>
              )}

              {/* Description — or a stylised placeholder */}
              {artProduct.description ? (
                <p className='text-gray-600 leading-relaxed text-base'>{artProduct.description}</p>
              ) : (
                <div className='grid grid-cols-2 gap-3'>
                  {[
                    { label: 'Museum-quality print', icon: '🖼️' },
                    { label: 'Fade-resistant inks', icon: '✨' },
                    { label: 'Ready to hang', icon: '🪝' },
                    { label: 'Premium canvas', icon: '🎨' },
                  ].map(f => (
                    <div key={f.label} className='flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100'>
                      <span className='text-lg'>{f.icon}</span>
                      <span className='text-xs font-medium text-gray-700'>{f.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {artProduct.art_product_tags?.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {(artProduct.art_product_tags as { tags: { name: string } | null }[]).map(apt => {
                    const t = apt.tags;
                    if (!t?.name) return null;
                    return (
                      <span
                        key={t.name}
                        className='inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-pink-50 to-purple-50 text-gray-600 rounded-full text-xs font-medium border border-gray-100'
                      >
                        <Tag className='w-2.5 h-2.5 text-[#f63a9e]' />
                        {t.name}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Trust badges */}
              <div className='grid grid-cols-3 gap-3 py-4 border-y border-gray-100'>
                {[
                  { icon: Truck, label: 'Free shipping', sub: 'On all orders' },
                  { icon: RefreshCw, label: '30-day returns', sub: 'Hassle-free' },
                  { icon: Shield, label: 'Secure checkout', sub: '100% protected' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className='flex flex-col items-center text-center gap-1'>
                    <div className='w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center'>
                      <Icon className='w-4 h-4 text-[#f63a9e]' />
                    </div>
                    <span className='text-xs font-semibold text-gray-800'>{label}</span>
                    <span className='text-[10px] text-gray-400'>{sub}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className='space-y-2'>
                <Button
                  onClick={() => setShowProductSelector(true)}
                  className='w-full h-14 bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-2xl text-base shadow-lg shadow-pink-200/50 transition-all hover:shadow-xl hover:shadow-pink-200/60'
                  style={{ fontWeight: '700' }}
                >
                  Use This Artwork
                  <ArrowRight className='ml-2 w-5 h-5' />
                </Button>
                <p className='text-center text-xs text-gray-400'>
                  Choose canvas, gallery wall, or poster print on the next step
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Similar Products Section */}
      {!loadingSimilar && similarProducts.length > 0 && (
        <section className='bg-gray-50 py-14'>
          <div className='max-w-[1400px] mx-auto px-4 sm:px-6'>
            <div className='flex items-center gap-2 mb-8'>
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
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                    className='group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow'
                    onClick={() => navigate(`/art/${product.slug || product.id}`)}
                  >
                    <div className='aspect-square overflow-hidden bg-gray-100'>
                      <ImageWithFallback
                        src={thumb}
                        alt={product.name}
                        className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-108'
                      />
                    </div>
                    <div className='p-3'>
                      <p className='text-sm font-semibold text-gray-900 truncate'>{product.name}</p>
                      {product.price && (
                        <p className='text-sm text-[#f63a9e] font-medium mt-0.5'>{product.price}</p>
                      )}
                    </div>
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
                          whileHover={{ scale: navigating ? 1 : 1.01 }}
                          whileTap={{ scale: navigating ? 1 : 0.99 }}
                          onClick={() => !navigating && handleSelectProductType(option.configurerType)}
                          disabled={navigating}
                          className={`w-full text-left p-4 rounded-2xl border-2 border-gray-100 bg-gradient-to-r ${option.bg} hover:border-gray-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          <div
                            className='w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0'
                            style={{ backgroundColor: `${option.accent}18` }}
                          >
                            {navigating && option.configurerType === 'single-canvas' ? (
                              <Loader2 className='w-6 h-6 animate-spin' style={{ color: option.accent }} />
                            ) : (
                              <Icon className='w-6 h-6' style={{ color: option.accent }} />
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='font-semibold text-gray-900 text-sm'>
                              {option.label}
                            </p>
                            <p className='text-xs text-gray-500 mt-0.5 leading-relaxed'>
                              {navigating && option.configurerType === 'single-canvas'
                                ? 'Loading artwork…'
                                : option.description}
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
