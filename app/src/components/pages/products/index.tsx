import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/shared/product-card';
import {
  Filter,
  X,
  Search,
  SlidersHorizontal,
  Tag,
  Package,
  Ruler,
  ArrowRight,
  Frame,
  Image as ImageIcon,
  Camera,
  Palette,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  size: string | null;
  price: number;
  is_featured: boolean;
  active: boolean;
  product_type: string;
  product_categories?: Array<{
    category: Category;
  }>;
}

interface ProductsPageProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

type SizeFilter = 'All' | 'Small' | 'Medium' | 'Large';
type SortOption = 'newest' | 'price-low' | 'price-high' | 'name';

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
  initialCategories,
}: ProductsPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSize, setSelectedSize] = useState<SizeFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Set initial filters from URL params on mount
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    const categoryFromUrl = searchParams.get('category');
    const sizeFromUrl = searchParams.get('size');
    const sortFromUrl = searchParams.get('sort');

    if (searchFromUrl) setSearchQuery(searchFromUrl);
    if (categoryFromUrl) setSelectedCategory(categoryFromUrl);
    if (
      sizeFromUrl &&
      ['All', 'Small', 'Medium', 'Large'].includes(sizeFromUrl)
    ) {
      setSelectedSize(sizeFromUrl as SizeFilter);
    }
    if (
      sortFromUrl &&
      ['newest', 'price-low', 'price-high', 'name'].includes(sortFromUrl)
    ) {
      setSortBy(sortFromUrl as SortOption);
    }
  }, [searchParams]);

  // Helper: Categorize size
  const getSizeCategory = (size: string | null): SizeFilter => {
    if (!size) return 'Medium';

    const numbers = size.match(/\d+/g)?.map(Number) || [];
    if (numbers.length === 0) return 'Medium';

    const maxDimension = Math.max(...numbers);

    if (maxDimension < 50) return 'Small';
    if (maxDimension > 80) return 'Large';
    return 'Medium';
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => {
        if (!p.product_categories || p.product_categories.length === 0)
          return false;
        return p.product_categories.some(
          pc => pc.category.slug === selectedCategory
        );
      });
    }

    if (selectedSize !== 'All') {
      filtered = filtered.filter(p => getSizeCategory(p.size) === selectedSize);
    }

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, selectedSize, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedSize('All');
    setSortBy('newest');
    navigate('/products');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== 'All' ||
    selectedSize !== 'All' ||
    sortBy !== 'newest';

  // Get category name from slug
  const getCategoryName = (slug: string) => {
    return categories.find(c => c.slug === slug)?.name || slug;
  };

  // Remove individual filter
  const removeFilter = (
    filterType: 'search' | 'category' | 'size' | 'sort'
  ) => {
    switch (filterType) {
      case 'search':
        setSearchQuery('');
        break;
      case 'category':
        setSelectedCategory('All');
        break;
      case 'size':
        setSelectedSize('All');
        break;
      case 'sort':
        setSortBy('newest');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['Mona_Sans',_sans-serif]">
      <Header />

      {/* Hero Section with Full-Width Background */}
      <div className='relative overflow-hidden bg-gradient-to-b from-[#FFF5FB] via-white to-[#FAFAFA]'>
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
        <div className='max-w-[1400px] mx-auto px-4 md:px-8 pt-16 pb-12 relative z-10'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className='text-center'
          >
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className='inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm text-[#f63a9e] rounded-full text-sm font-semibold mb-6 shadow-lg shadow-pink-200/50 border border-pink-100'
            >
              <Package className='w-4 h-4' />
              <span>{products.length} Premium Products</span>
              <ArrowRight className='w-4 h-4' />
            </motion.div>

            {/* Main Heading */}
            <h1
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-6"
              style={{
                fontSize: 'clamp(32px, 6vw, 56px)',
                lineHeight: '1.1',
                fontWeight: '700',
                letterSpacing: '-0.03em',
              }}
            >
              Discover Our{' '}
              <span className='relative'>
                <span className='relative z-10 bg-gradient-to-r from-[#f63a9e] to-purple-500 bg-clip-text text-transparent'>
                  Collection
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className='absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-[#f63a9e]/20 to-purple-500/20 rounded-full origin-left'
                />
              </span>
            </h1>

            <p className='text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed'>
              Transform your photos into stunning wall art with our{' '}
              <span className='text-gray-900 font-medium'>
                customizable prints
              </span>{' '}
              and <span className='text-gray-900 font-medium'>canvases</span>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='max-w-[1400px] mx-auto px-4 md:px-8 pb-16'>
        {/* Search & Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='relative -mt-6 mb-10'
        >
          {/* Search Bar - Standalone */}
          <div className='relative mb-4'>
            <div className='absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-[#f63a9e] to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-300/50'>
              <Search className='w-6 h-6 text-white' />
            </div>
            <input
              type='text'
              placeholder='Search for canvas, prints, frames...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full pl-20 pr-6 py-5 text-lg bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#f63a9e]/20 focus:border-[#f63a9e] transition-all placeholder:text-gray-400 shadow-lg shadow-gray-100/50'
            />
          </div>

          {/* Filters Row */}
          <div className='bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 p-4'>
            <div className='flex flex-wrap gap-3 items-center'>
              {/* Filter Label */}
              <div className='flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-xl font-medium'>
                <SlidersHorizontal className='w-4 h-4' />
                <span className='text-sm'>Filters</span>
              </div>

              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger
                  className={`w-auto min-w-[150px] border-2 transition-all rounded-xl h-11 font-medium ${
                    selectedCategory !== 'All'
                      ? 'bg-[#f63a9e]/10 border-[#f63a9e] text-[#f63a9e]'
                      : 'bg-white border-gray-200 hover:border-[#f63a9e] text-gray-700'
                  }`}
                >
                  <Tag
                    className={`w-4 h-4 mr-2 ${selectedCategory !== 'All' ? 'text-[#f63a9e]' : 'text-gray-400'}`}
                  />
                  <SelectValue placeholder='Category' />
                </SelectTrigger>
                <SelectContent className='rounded-xl border-2 shadow-xl'>
                  <SelectItem value='All' className='rounded-lg'>
                    All Categories
                  </SelectItem>
                  {categories.map(cat => (
                    <SelectItem
                      key={cat.id}
                      value={cat.slug}
                      className='rounded-lg'
                    >
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Size Filter */}
              <Select
                value={selectedSize}
                onValueChange={value => setSelectedSize(value as SizeFilter)}
              >
                <SelectTrigger
                  className={`w-auto min-w-[130px] border-2 transition-all rounded-xl h-11 font-medium ${
                    selectedSize !== 'All'
                      ? 'bg-purple-50 border-purple-400 text-purple-600'
                      : 'bg-white border-gray-200 hover:border-purple-400 text-gray-700'
                  }`}
                >
                  <Ruler
                    className={`w-4 h-4 mr-2 ${selectedSize !== 'All' ? 'text-purple-500' : 'text-gray-400'}`}
                  />
                  <SelectValue placeholder='Size' />
                </SelectTrigger>
                <SelectContent className='rounded-xl border-2 shadow-xl'>
                  <SelectItem value='All' className='rounded-lg'>
                    All Sizes
                  </SelectItem>
                  <SelectItem value='Small' className='rounded-lg'>
                    Small (&lt; 50cm)
                  </SelectItem>
                  <SelectItem value='Medium' className='rounded-lg'>
                    Medium (50-80cm)
                  </SelectItem>
                  <SelectItem value='Large' className='rounded-lg'>
                    Large (&gt; 80cm)
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select
                value={sortBy}
                onValueChange={value => setSortBy(value as SortOption)}
              >
                <SelectTrigger
                  className={`w-auto min-w-[160px] border-2 transition-all rounded-xl h-11 font-medium ${
                    sortBy !== 'newest'
                      ? 'bg-blue-50 border-blue-400 text-blue-600'
                      : 'bg-white border-gray-200 hover:border-blue-400 text-gray-700'
                  }`}
                >
                  <Filter
                    className={`w-4 h-4 mr-2 ${sortBy !== 'newest' ? 'text-blue-500' : 'text-gray-400'}`}
                  />
                  <SelectValue placeholder='Sort By' />
                </SelectTrigger>
                <SelectContent className='rounded-xl border-2 shadow-xl'>
                  <SelectItem value='newest' className='rounded-lg'>
                    Newest First
                  </SelectItem>
                  <SelectItem value='price-low' className='rounded-lg'>
                    Price: Low to High
                  </SelectItem>
                  <SelectItem value='price-high' className='rounded-lg'>
                    Price: High to Low
                  </SelectItem>
                  <SelectItem value='name' className='rounded-lg'>
                    Name: A-Z
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Spacer */}
              <div className='flex-1' />

              {/* Clear All Button */}
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={clearFilters}
                    className='flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all font-medium'
                  >
                    <X className='w-4 h-4' />
                    <span>Clear All</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Active Filter Tags */}
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='overflow-hidden'
                >
                  <div className='flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100'>
                    <span className='text-sm text-gray-500 mr-1 py-1'>
                      Active:
                    </span>

                    {searchQuery && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => removeFilter('search')}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f63a9e] text-white rounded-lg text-sm font-medium hover:bg-[#e02d8d] transition-colors'
                      >
                        <Search className='w-3 h-3' />
                        <span>&quot;{searchQuery}&quot;</span>
                        <X className='w-3 h-3 ml-1' />
                      </motion.button>
                    )}

                    {selectedCategory !== 'All' && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => removeFilter('category')}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f63a9e] text-white rounded-lg text-sm font-medium hover:bg-[#e02d8d] transition-colors'
                      >
                        <Tag className='w-3 h-3' />
                        <span>{getCategoryName(selectedCategory)}</span>
                        <X className='w-3 h-3 ml-1' />
                      </motion.button>
                    )}

                    {selectedSize !== 'All' && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => removeFilter('size')}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors'
                      >
                        <Ruler className='w-3 h-3' />
                        <span>{selectedSize}</span>
                        <X className='w-3 h-3 ml-1' />
                      </motion.button>
                    )}

                    {sortBy !== 'newest' && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => removeFilter('sort')}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors'
                      >
                        <Filter className='w-3 h-3' />
                        <span>
                          {sortBy === 'price-low'
                            ? 'Low-High'
                            : sortBy === 'price-high'
                              ? 'High-Low'
                              : 'A-Z'}
                        </span>
                        <X className='w-3 h-3 ml-1' />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className='flex items-center justify-between mb-8'
        >
          <div className='flex items-center gap-3'>
            <div className='w-1.5 h-8 bg-gradient-to-b from-[#f63a9e] to-purple-500 rounded-full' />
            <p className='text-gray-900 text-xl font-semibold'>
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'Product' : 'Products'}
              <span className='text-gray-400 font-normal ml-2'>found</span>
            </p>
          </div>

          {!isLoading && filteredProducts.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-sm text-gray-500 hidden md:block'
            >
              Showing {filteredProducts.length} of {products.length} products
            </motion.p>
          )}
        </motion.div>

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
                    {hasActiveFilters
                      ? "We couldn't find any products matching your filters. Try adjusting your search criteria."
                      : 'No products available at the moment. Check back soon!'}
                  </p>
                  {hasActiveFilters && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={clearFilters}
                      className='inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#f63a9e] to-pink-500 text-white rounded-2xl hover:from-[#e02d8d] hover:to-pink-600 transition-all font-semibold shadow-xl shadow-pink-200/50'
                    >
                      <X className='w-5 h-5' />
                      Clear All Filters
                    </motion.button>
                  )}
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
