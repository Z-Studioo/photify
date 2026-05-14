import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  FolderOpen,
  Frame,
  Search,
  Sparkles,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';

export interface CategoriesListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  bg_color: string | null;
  display_order: number | null;
  is_active: boolean;
  product_count?: number | null;
}

interface CategoriesPageProps {
  initialCategories: CategoriesListItem[];
}

function CategoryCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className='rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm'
    >
      <div className='animate-pulse'>
        <div className='aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200' />
        <div className='p-5 space-y-3'>
          <div className='h-5 bg-gray-200 rounded-lg w-3/5' />
          <div className='h-4 bg-gray-100 rounded-lg w-4/5' />
          <div className='h-4 bg-gray-100 rounded-lg w-2/3' />
        </div>
      </div>
    </motion.div>
  );
}

function categoryHref(slug: string): string {
  // Mirrors the behaviour of the existing category nav.
  return slug === 'art-collection' ? '/stock-images' : `/category/${slug}`;
}

function CategoryCard({
  category,
  index,
}: {
  category: CategoriesListItem;
  index: number;
}) {
  const IconComponent =
    (category.icon && (Icons as Record<string, unknown>)[category.icon]) ||
    Frame;
  const Icon = IconComponent as React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;

  const href = categoryHref(category.slug);
  const productCount = category.product_count ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        to={href}
        className='group relative block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#f63a9e]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f63a9e]/40'
      >
        <div className='relative aspect-[4/3] overflow-hidden'>
          {category.image_url ? (
            <ImageWithFallback
              src={category.image_url}
              alt={category.name}
              className='h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105'
            />
          ) : (
            <div
              className='flex h-full w-full items-center justify-center'
              style={{
                backgroundColor: category.bg_color || '#f3efe9',
              }}
            >
              <Icon
                className='h-16 w-16 text-gray-700 transition-transform duration-500 group-hover:scale-110'
                strokeWidth={1.4}
              />
            </div>
          )}

          <div className='absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95' />

          {productCount !== null && productCount > 0 && (
            <div className='absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur'>
              <Sparkles className='h-3.5 w-3.5 text-[#f63a9e]' />
              {productCount} {productCount === 1 ? 'product' : 'products'}
            </div>
          )}

          <div className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-md transition-all duration-300 group-hover:bg-[#f63a9e] group-hover:text-white'>
            <ArrowUpRight className='h-5 w-5' />
          </div>

          <div className='absolute inset-x-0 bottom-0 p-5'>
            <h3
              className="font-['Bricolage_Grotesque',_sans-serif] text-white"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                lineHeight: '1.2',
              }}
            >
              {category.name}
            </h3>
          </div>
        </div>

        <div className='p-5'>
          <p className='line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-gray-600'>
            {category.description ||
              `Explore our ${category.name.toLowerCase()} collection — curated, customisable, and crafted in premium quality.`}
          </p>

          <div className='mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f63a9e] transition-all duration-300 group-hover:gap-2.5'>
            Browse collection
            <ArrowUpRight className='h-4 w-4 transition-transform duration-300 group-hover:rotate-12' />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CategoriesPage({ initialCategories }: CategoriesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return initialCategories;
    return initialCategories.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
    );
  }, [initialCategories, searchQuery]);

  const totalProducts = useMemo(
    () =>
      initialCategories.reduce(
        (sum, c) => sum + (c.product_count ?? 0),
        0
      ),
    [initialCategories]
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['Mona_Sans',_sans-serif]">
      <Header />

      {/* Hero */}
      <div className='relative overflow-hidden bg-white'>
        <div className='pointer-events-none absolute inset-0 overflow-hidden'>
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className='absolute -top-40 -left-32 h-[560px] w-[560px] rounded-full bg-gradient-to-br from-pink-200/50 to-purple-300/40 blur-3xl'
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
            className='absolute -top-20 -right-32 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-blue-200/40 to-cyan-300/30 blur-3xl'
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
            className='absolute top-16 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#f63a9e]/20 to-pink-300/30 blur-3xl'
          />
          <div className='absolute inset-0 opacity-[0.025]'>
            <div
              className='h-full w-full'
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.18) 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>
        </div>

        <div className='relative z-10 mx-auto max-w-[1400px] px-4 pb-10 pt-10 md:px-8 md:pb-12 md:pt-14'>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className='text-center'
          >
            <span className='mb-4 inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#f63a9e] shadow-sm backdrop-blur'>
              <Sparkles className='h-3.5 w-3.5' />
              Shop by category
            </span>
            <h1
              className="font-['Bricolage_Grotesque',_sans-serif] mb-4 text-gray-900"
              style={{
                fontSize: 'clamp(32px, 6vw, 56px)',
                lineHeight: '1.1',
                fontWeight: 700,
                letterSpacing: '-0.03em',
              }}
            >
              Explore Our Collections
            </h1>
            <p className='mx-auto max-w-2xl text-base text-gray-600 md:text-lg'>
              From single canvases and gallery walls to collages and framed
              prints — find the perfect way to bring your story to life.
            </p>

            <div className='mx-auto mt-7 max-w-xl'>
              <div className='relative'>
                <Search className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search categories...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full rounded-xl border border-gray-200 bg-white/95 py-3.5 pl-12 pr-4 shadow-sm backdrop-blur-sm transition-all focus:border-[#f63a9e] focus:outline-none focus:ring-2 focus:ring-[#f63a9e]/20'
                />
              </div>
            </div>

            {(initialCategories.length > 0 || totalProducts > 0) && (
              <div className='mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500'>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 backdrop-blur'>
                  <span className='font-semibold text-gray-800'>
                    {initialCategories.length}
                  </span>
                  {initialCategories.length === 1 ? 'category' : 'categories'}
                </span>
                {totalProducts > 0 && (
                  <span className='inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 backdrop-blur'>
                    <span className='font-semibold text-gray-800'>
                      {totalProducts}
                    </span>
                    {totalProducts === 1 ? 'product' : 'products'} total
                  </span>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Grid */}
      <div className='mx-auto max-w-[1400px] px-4 pb-16 pt-8 md:px-8'>
        {initialCategories.length === 0 ? (
          // Loader returned nothing — show skeletons briefly while category data is wired up
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8'>
            {[...Array(6)].map((_, i) => (
              <CategoryCardSkeleton key={i} index={i} />
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8'
          >
            {filteredCategories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={index}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='py-20 text-center'
          >
            <div className='mx-auto max-w-md'>
              <div className='relative mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner'>
                <FolderOpen className='h-12 w-12 text-gray-300' />
              </div>
              <h3
                className="font-['Bricolage_Grotesque',_sans-serif] mb-2 text-gray-900"
                style={{ fontSize: '24px', fontWeight: 700 }}
              >
                No matching categories
              </h3>
              <p className='mb-6 text-gray-500'>
                Try a different search term, or browse all categories.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className='inline-flex items-center gap-2 rounded-full bg-[#f63a9e] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition-all hover:shadow-xl hover:shadow-pink-500/40'
              >
                Clear search
              </button>
            </div>
          </motion.div>
        )}

        <div className='h-8' />
      </div>

      <Footer />
    </div>
  );
}
