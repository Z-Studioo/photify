import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/shared/product-card';
import {
  Frame,
  Search,
  Image as ImageIcon,
  Camera,
  Palette,
  Package,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  size: string | null;
  price: number;
  fixed_price?: number | null;
  is_featured: boolean;
  active: boolean;
  product_type: string;
}

interface ProductsPageProps {
  initialProducts: Product[];
  initialCategories: unknown[];
}

// Premium Skeleton Card Component
function ProductCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className='bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100'
    >
      <div className='animate-pulse'>
        <div className='bg-gradient-to-br from-gray-100 to-gray-200 aspect-square' />
        <div className='p-4 space-y-3'>
          <div className='h-5 bg-gray-200 rounded-lg w-4/5' />
          <div className='h-4 bg-gray-100 rounded-lg w-2/3' />
          <div className='flex items-center justify-between pt-2'>
            <div className='h-6 bg-gradient-to-r from-pink-100 to-pink-200 rounded-lg w-24' />
            <div className='h-10 w-10 bg-gray-200 rounded-full' />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ProductsPage({
  initialProducts,
  initialCategories: _initialCategories,
}: ProductsPageProps) {
  const [products] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Product list for grid
  const filteredProducts = useMemo(() => {
    return products.filter(
      p =>
        p.name !== 'Dual Metal Harmony' &&
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['Mona_Sans',_sans-serif]">
      <Header />

      {/* Hero Section */}
      <div className='relative overflow-hidden bg-white'>
        {/* Decorative Background - Full Width */}
        <div className='absolute inset-0 pointer-events-none overflow-hidden'>
          {/* Animated Gradient Orbs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className='absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-pink-200/50 to-purple-300/40 rounded-full blur-3xl'
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
            className='absolute -top-20 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-blue-200/40 to-cyan-300/30 rounded-full blur-3xl'
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
            className='absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-[#f63a9e]/20 to-pink-300/30 rounded-full blur-3xl'
          />

          {/* Floating Decorative Elements */}
          {/* Frame Icon - Top Left */}
          <motion.div
            animate={{
              y: [0, -12, 0],
              rotate: [-5, 5, -5],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className='absolute top-24 left-[12%] hidden md:block'
          >
            <div className='w-14 h-14 bg-white rounded-2xl shadow-xl shadow-pink-300/40 flex items-center justify-center border-2 border-pink-100'>
              <Frame className='w-7 h-7 text-[#f63a9e]' />
            </div>
          </motion.div>

          {/* Camera Icon - Top Right */}
          <motion.div
            animate={{
              y: [0, -18, 0],
              rotate: [5, -5, 5],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            className='absolute top-20 right-[15%] hidden md:block'
          >
            <div className='w-12 h-12 bg-white rounded-xl shadow-xl shadow-purple-300/40 flex items-center justify-center border-2 border-purple-100'>
              <Camera className='w-6 h-6 text-purple-500' />
            </div>
          </motion.div>

          {/* Image Icon - Bottom Right */}
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [-3, 3, -3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.8,
            }}
            className='absolute top-52 right-[10%] hidden lg:block'
          >
            <div className='w-11 h-11 bg-white rounded-xl shadow-xl shadow-blue-300/40 flex items-center justify-center border-2 border-blue-100'>
              <ImageIcon className='w-5 h-5 text-blue-500' />
            </div>
          </motion.div>

          {/* Star Emoji - Mid Right */}
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className='absolute top-36 right-[25%] hidden md:block'
          >
            <div className='text-2xl'>⭐</div>
          </motion.div>

          {/* Palette Icon - Left Mid */}
          <motion.div
            animate={{
              y: [0, -8, 0],
              x: [0, 5, 0],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.5,
            }}
            className='absolute top-40 left-[22%] hidden lg:block'
          >
            <div className='w-10 h-10 bg-white rounded-lg shadow-xl shadow-green-300/40 flex items-center justify-center border-2 border-green-100'>
              <Palette className='w-5 h-5 text-green-500' />
            </div>
          </motion.div>

          {/* Sparkle Emoji - Top Center */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
            className='absolute top-28 left-[45%] hidden md:block'
          >
            <div className='text-xl'>✨</div>
          </motion.div>

          {/* Art Frame Emoji - Bottom Left */}
          <motion.div
            animate={{
              y: [0, -12, 0],
              rotate: [-8, 8, -8],
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
            className='absolute top-56 left-[18%] hidden lg:block'
          >
            <div className='text-3xl'>🖼️</div>
          </motion.div>

          {/* Subtle Grid Pattern */}
          <div className='absolute inset-0 opacity-[0.02]'>
            <div
              className='w-full h-full'
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>
        </div>

        {/* Hero Content */}
        <div className='max-w-[1400px] mx-auto px-4 md:px-8 pt-10 md:pt-12 pb-8 md:pb-10 relative z-10'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className='text-center'
          >
            {/* Main Heading */}
            <h1
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
              style={{
                fontSize: 'clamp(32px, 6vw, 56px)',
                lineHeight: '1.1',
                fontWeight: '700',
                letterSpacing: '-0.03em',
              }}
            >
              Our Customizable Products
            </h1>

            <div className='mt-6 max-w-xl mx-auto'>
              <div className='relative'>
                <Search className='w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2' />
                <input
                  type='text'
                  placeholder='Search products...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f63a9e]/20 focus:border-[#f63a9e] transition-all'
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='max-w-[1400px] mx-auto px-4 md:px-8 pb-16 pt-8'>

        {/* Products Grid - Loading State */}
        {isLoading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'>
            {[...Array(6)].map((_, i) => (
              <ProductCardSkeleton key={i} index={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Products Grid - Loaded */}
            {filteredProducts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'
              >
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    images={product.images}
                    price={product.price}
                    fixed_price={product.fixed_price}
                    size={product.size}
                    isFeatured={product.is_featured}
                    index={index}
                  />
                ))}
              </motion.div>
            ) : (
              // Premium Empty State
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='text-center py-24'
              >
                <div className='max-w-md mx-auto'>
                  {/* Animated Icon */}
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className='relative mx-auto mb-8'
                  >
                    <div className='w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto shadow-inner'>
                      <Package className='w-14 h-14 text-gray-300' />
                    </div>
                    {/* Floating ring */}
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className='absolute inset-0 rounded-full border-2 border-dashed border-gray-200'
                    />
                  </motion.div>

                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                    style={{ fontSize: '28px', fontWeight: '700' }}
                  >
                    No products found
                  </h3>
                  <p className='text-gray-500 text-lg mb-8 leading-relaxed'>
                    No products available at the moment. Check back soon!
                  </p>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Bottom Spacing for Footer */}
        <div className='h-8' />
      </div>

      <Footer />
    </div>
  );
}
