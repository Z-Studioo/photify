import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArtPhotoTile } from '@/components/shared/art-photo-tile';
import { useSearchParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, X } from 'lucide-react';

interface ArtProduct {
  id: string;
  slug?: string;
  name: string;
  image: string;
  images?: string[];
  size: string;
  sizeCount?: number;
  price: string;
  isBestSeller: boolean;
  category: string;
  tags?: string[];
}

interface ArtCollectionPageProps {
  initialArtProducts: any[];
  initialCategories: string[];
}

const mockArtProducts: ArtProduct[] = [
  {
    id: 'art1',
    name: 'Ocean Dreams',
    image:
      'https://images.unsplash.com/photo-1744096641619-646e1f6fbcd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGFydCUyMHByaW50fGVufDF8fHx8MTc2MDYyODI1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    size: '50cm x 70cm',
    price: '£68.00',
    isBestSeller: true,
    category: 'Abstract',
  },
  {
    id: 'art2',
    name: 'Sunset Waves',
    image:
      'https://images.unsplash.com/photo-1744096641619-646e1f6fbcd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGFydCUyMHByaW50fGVufDF8fHx8MTc2MDYyODI1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    size: '60cm x 80cm',
    price: '£82.00',
    isBestSeller: false,
    category: 'Abstract',
  },
  {
    id: 'art3',
    name: 'Color Burst',
    image:
      'https://images.unsplash.com/photo-1678117699040-b89738399ca7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3YWxsJTIwYXJ0fGVufDF8fHx8MTc2MDcwNDYyOHww&ixlib=rb-4.1.0&q=80&w=1080',
    size: '40cm x 60cm',
    price: '£56.00',
    isBestSeller: true,
    category: 'Abstract',
  },
  {
    id: 'art4',
    name: 'Fluid Motion',
    image:
      'https://images.unsplash.com/photo-1744096641619-646e1f6fbcd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGFydCUyMHByaW50fGVufDF8fHx8MTc2MDYyODI1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    size: '70cm x 100cm',
    price: '£125.00',
    isBestSeller: false,
    category: 'Abstract',
  },
  {
    id: 'art5',
    name: 'Divine Light',
    image:
      'https://images.unsplash.com/photo-1584727638096-042c45049ebe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWxpZ2lvdXMlMjBhcnQlMjBwYWludGluZ3xlbnwxfHx8fDE3NjA3MDU3MzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '50cm x 70cm',
    price: '£88.00',
    isBestSeller: true,
    category: 'Religion',
  },
  {
    id: 'art6',
    name: 'Sacred Symbols',
    image:
      'https://images.unsplash.com/photo-1584727638096-042c45049ebe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWxpZ2lvdXMlMjBhcnQlMjBwYWludGluZ3xlbnwxfHx8fDE3NjA3MDU3MzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '40cm x 60cm',
    price: '£72.00',
    isBestSeller: false,
    category: 'Religion',
  },
  {
    id: 'art7',
    name: 'Spiritual Journey',
    image:
      'https://images.unsplash.com/photo-1584727638096-042c45049ebe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWxpZ2lvdXMlMjBhcnQlMjBwYWludGluZ3xlbnwxfHx8fDE3NjA3MDU3MzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '60cm x 90cm',
    price: '£115.00',
    isBestSeller: true,
    category: 'Religion',
  },
  {
    id: 'art8',
    name: 'Temple Art',
    image:
      'https://images.unsplash.com/photo-1584727638096-042c45049ebe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWxpZ2lvdXMlMjBhcnQlMjBwYWludGluZ3xlbnwxfHx8fDE3NjA3MDU3MzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '30cm x 40cm',
    price: '£58.00',
    isBestSeller: false,
    category: 'Religion',
  },
  {
    id: 'art9',
    name: 'Wild Lion',
    image:
      'https://images.unsplash.com/photo-1683027062130-e70ca0fbc20f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYWwlMjB3aWxkbGlmZSUyMGFydHxlbnwxfHx8fDE3NjA3MDU3Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '60cm x 80cm',
    price: '£92.00',
    isBestSeller: true,
    category: 'Animals',
  },
  {
    id: 'art10',
    name: 'Elephant Majesty',
    image:
      'https://images.unsplash.com/photo-1683027062130-e70ca0fbc20f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYWwlMjB3aWxkbGlmZSUyMGFydHxlbnwxfHx8fDE3NjA3MDU3Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '50cm x 70cm',
    price: '£78.00',
    isBestSeller: false,
    category: 'Animals',
  },
  {
    id: 'art11',
    name: 'Bird Paradise',
    image:
      'https://images.unsplash.com/photo-1683027062130-e70ca0fbc20f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYWwlMjB3aWxkbGlmZSUyMGFydHxlbnwxfHx8fDE3NjA3MDU3Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '40cm x 60cm',
    price: '£65.00',
    isBestSeller: true,
    category: 'Animals',
  },
  {
    id: 'art12',
    name: 'Wolf Spirit',
    image:
      'https://images.unsplash.com/photo-1683027062130-e70ca0fbc20f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYWwlMjB3aWxkbGlmZSUyMGFydHxlbnwxfHx8fDE3NjA3MDU3Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '70cm x 100cm',
    price: '£135.00',
    isBestSeller: false,
    category: 'Animals',
  },
  {
    id: 'art13',
    name: 'Himalayan Peaks',
    image:
      'https://images.unsplash.com/photo-1718106230088-ef0606677859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXBhbCUyMGxhbmRzY2FwZSUyMGFydHxlbnwxfHx8fDE3NjA3MDU3NDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '60cm x 90cm',
    price: '£105.00',
    isBestSeller: true,
    category: 'Nepal',
  },
  {
    id: 'art14',
    name: 'Kathmandu Valley',
    image:
      'https://images.unsplash.com/photo-1718106230088-ef0606677859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXBhbCUyMGxhbmRzY2FwZSUyMGFydHxlbnwxfHx8fDE3NjA3MDU3NDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '50cm x 70cm',
    price: '£88.00',
    isBestSeller: false,
    category: 'Nepal',
  },
  {
    id: 'art15',
    name: 'Prayer Flags',
    image:
      'https://images.unsplash.com/photo-1718106230088-ef0606677859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXBhbCUyMGxhbmRzY2FwZSUyMGFydHxlbnwxfHx8fDE3NjA3MDU3NDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '40cm x 60cm',
    price: '£72.00',
    isBestSeller: true,
    category: 'Nepal',
  },
  {
    id: 'art16',
    name: 'Mountain Village',
    image:
      'https://images.unsplash.com/photo-1718106230088-ef0606677859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXBhbCUyMGxhbmRzY2FwZSUyMGFydHxlbnwxfHx8fDE3NjA3MDU3NDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '70cm x 100cm',
    price: '£145.00',
    isBestSeller: false,
    category: 'Nepal',
  },
];

const SUGGESTED_TAGS = ['Abstract', 'Animals', 'Nature', 'Religion', 'Modern'];

export function ArtCollectionPage({
  initialArtProducts,
  initialCategories,
}: ArtCollectionPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = useMemo(
    () => initialCategories.filter(c => c.toLowerCase() !== 'all'),
    [initialCategories]
  );

  const isMinimized =
    searchQuery.trim().length > 0 || selectedCategory.length > 0;

  const artProducts: ArtProduct[] = useMemo(
    () =>
      initialArtProducts.length > 0
        ? initialArtProducts.map((art: any) => ({
            id: art.id,
            slug: art.slug,
            name: art.name,
            image:
              (Array.isArray(art.images) && art.images.length > 0
                ? art.images[0]
                : null) ||
              art.image ||
              '',
            images: Array.isArray(art.images) ? art.images : undefined,
            size: art.size || '',
            sizeCount: Array.isArray(art.available_sizes)
              ? art.available_sizes.length
              : 0,
            price: art.price || '',
            isBestSeller: art.is_bestseller || false,
            category: art.category || '',
            tags: (art.art_product_tags || [])
              .map((apt: any) => {
                const t = Array.isArray(apt.tags) ? apt.tags[0] : apt.tags;
                return t?.name ?? null;
              })
              .filter(Boolean),
          }))
        : mockArtProducts,
    [initialArtProducts]
  );

  // Sync category state with URL ?category=
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categories.includes(categoryParam)) {
      setSelectedCategory(categoryParam);
    } else if (!categoryParam) {
      setSelectedCategory('');
    }
  }, [searchParams, categories]);

  const handleSelectCategory = (category: string) => {
    const next = new URLSearchParams(searchParams);
    const newCategory = selectedCategory === category ? '' : category;
    setSelectedCategory(newCategory);
    if (!newCategory) {
      next.delete('category');
    } else {
      next.set('category', newCategory);
    }
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    setSearchParams(next, { replace: true });
  };

  const filteredProducts = useMemo(() => {
    const byCategory = !selectedCategory
      ? artProducts
      : artProducts.filter(p =>
          p.tags && p.tags.length > 0
            ? p.tags.includes(selectedCategory)
            : p.category === selectedCategory
        );

    const q = searchQuery.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter(p => {
      const haystack = [
        p.name,
        p.category,
        ...(p.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [artProducts, selectedCategory, searchQuery]);

  const heroBackdrops = useMemo(
    () => artProducts.slice(0, 6).map(p => p.image).filter(Boolean),
    [artProducts]
  );

  return (
    <div className="min-h-screen font-['Mona_Sans',_sans-serif] bg-white">
      <Header />

      {/* HERO — Pixabay-style search prompt that collapses once a query/filter is active */}
      <motion.section
        layout
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className='relative overflow-hidden bg-gradient-to-br from-[#fff5fb] via-white to-[#f3e9ff] border-b border-gray-100'
      >
        {/* Decorative photo strip backdrop — only shown in expanded state */}
        <AnimatePresence initial={false}>
          {!isMinimized && heroBackdrops.length > 0 && (
            <motion.div
              key='hero-backdrop'
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.18 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='pointer-events-none absolute inset-0 flex'
            >
              {heroBackdrops.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className='flex-1 h-full bg-cover bg-center hidden md:block'
                  style={{ backgroundImage: `url(${src})` }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div className='absolute inset-0 bg-gradient-to-b from-white/30 via-white/70 to-white pointer-events-none' />

        <motion.div
          layout
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`relative max-w-[1200px] mx-auto px-4 text-center ${
            isMinimized
              ? 'pt-4 sm:pt-5 pb-3 sm:pb-4'
              : 'pt-12 sm:pt-16 md:pt-20 pb-10 sm:pb-12 md:pb-14'
          }`}
        >
          <AnimatePresence initial={false}>
            {!isMinimized && (
              <motion.div
                key='hero-headline'
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className='overflow-hidden'
              >
                <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-[#f63a9e] text-xs sm:text-sm font-semibold mb-4'>
                  <Sparkles className='w-3.5 h-3.5' />
                  Curated wall art gallery
                </div>

                <h1 className="font-['Bricolage_Grotesque',_sans-serif] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 max-w-3xl mx-auto leading-[1.05]">
                  Stunning art prints,{' '}
                  <span className='text-[#f63a9e]'>ready for your wall</span>
                </h1>
                <p className='mt-4 sm:mt-5 text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto'>
                  Browse {artProducts.length}+ original artworks. Search by
                  mood, subject or style — printed on museum-grade paper or
                  canvas.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search bar */}
          <motion.div
            layout
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`max-w-2xl mx-auto ${isMinimized ? 'mt-0' : 'mt-7 sm:mt-9'}`}
          >
            <div className='relative'>
              <Search
                className={`absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400 ${
                  isMinimized
                    ? 'w-4 h-4 sm:w-5 sm:h-5'
                    : 'w-5 h-5 sm:w-6 sm:h-6'
                }`}
              />
              <motion.input
                layout
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                type='search'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search "lions", "abstract", "Himalayas"...'
                className={`w-full pl-12 sm:pl-14 pr-12 sm:pr-14 rounded-full bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-sm sm:text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f63a9e]/40 focus:border-[#f63a9e] transition-colors ${
                  isMinimized ? 'h-11 sm:h-12' : 'h-14 sm:h-16'
                }`}
                aria-label='Search art collection'
              />
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={clearFilters}
                  aria-label='Clear search and filters'
                  className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors ${
                    isMinimized
                      ? 'w-7 h-7 sm:w-8 sm:h-8'
                      : 'w-9 h-9 sm:w-10 sm:h-10'
                  }`}
                >
                  <X className='w-4 h-4 text-gray-600' />
                </button>
              )}
            </div>

            {/* Suggested / category chips */}
            <AnimatePresence initial={false}>
              {!isMinimized && (
                <motion.div
                  key='hero-chips'
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className='overflow-hidden'
                >
                  <div className='mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm'>
                    <span className='text-gray-500'>Try:</span>
                    {(categories.length > 0 ? categories : SUGGESTED_TAGS).map(
                      tag => {
                        const isActiveCat =
                          categories.length > 0 && selectedCategory === tag;
                        return (
                          <button
                            key={tag}
                            onClick={() =>
                              categories.length > 0
                                ? handleSelectCategory(tag)
                                : setSearchQuery(tag.toLowerCase())
                            }
                            className={`px-3 py-1 rounded-full border transition-colors ${
                              isActiveCat
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white border-gray-200 hover:border-[#f63a9e] hover:text-[#f63a9e] text-gray-700'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      }
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* RESULTS HEADER */}
      <div className='max-w-[1400px] mx-auto px-4 pt-6 sm:pt-8 pb-3 flex items-end justify-between gap-3'>
        <div>
          <h2
            className="font-['Bricolage_Grotesque',_sans-serif] text-xl sm:text-2xl font-semibold text-gray-900"
          >
            {selectedCategory || 'All artworks'}
            {searchQuery && (
              <span className='text-gray-500 font-normal'>
                {' '}
                · &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </h2>
          <p className='text-gray-500 text-xs sm:text-sm mt-1'>
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'artwork' : 'artworks'}
          </p>
        </div>
      </div>

      {/* MASONRY GALLERY */}
      <section className='max-w-[1400px] mx-auto px-4 pb-16 sm:pb-20'>
        {filteredProducts.length > 0 ? (
          <div className='columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4'>
            {filteredProducts.map((product, index) => (
              <ArtPhotoTile
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                image={product.image}
                images={product.images}
                category={product.category}
                price={product.price}
                isBestSeller={product.isBestSeller}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className='text-center py-20 sm:py-24'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4'>
              <Search className='w-7 h-7 text-gray-400' />
            </div>
            <h3 className="font-['Bricolage_Grotesque',_sans-serif] text-xl font-semibold text-gray-900 mb-2">
              No artworks match your search
            </h3>
            <p className='text-gray-500 max-w-md mx-auto mb-6'>
              Try a different keyword or clear your filters to browse the full
              gallery.
            </p>
            <button
              onClick={clearFilters}
              className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f63a9e] hover:bg-[#e02a8e] text-white text-sm font-semibold transition-colors'
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Bottom CTA */}
        {filteredProducts.length > 0 && (
          <div className='mt-12 sm:mt-16 text-center'>
            <p className='text-gray-500 text-sm mb-4'>
              Don&apos;t see exactly what you want?
            </p>
            <button
              onClick={() => navigate('/products')}
              className='inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-300 hover:border-[#f63a9e] hover:text-[#f63a9e] text-gray-800 text-sm font-semibold transition-colors'
            >
              Explore custom canvas prints
            </button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
