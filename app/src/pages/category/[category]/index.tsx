import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ProductCard } from '@/components/shared/product-card';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
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
}

type SizeFilter = 'All' | 'Small' | 'Medium' | 'Large';

interface CategoryPageProps {
  initialCategoryData: Category;
  initialProducts: Product[];
}

// ------------------ Animation Variants ------------------
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function getSizeCategory(size: string | null): SizeFilter {
  if (!size) return 'Medium';

  const sizeStr = size.toLowerCase();

  const hasSmallIndicators =
    sizeStr.includes('cm') &&
    (parseInt(sizeStr) < 50 ||
      sizeStr.includes('20') ||
      sizeStr.includes('15') ||
      sizeStr.includes('25') ||
      sizeStr.includes('30') ||
      sizeStr.includes('35'));

  const hasLargeIndicators =
    sizeStr.includes('cm') &&
    (parseInt(sizeStr) > 80 ||
      sizeStr.includes('100') ||
      sizeStr.includes('120') ||
      sizeStr.includes('150'));

  if (hasSmallIndicators) return 'Small';
  if (hasLargeIndicators) return 'Large';
  return 'Medium';
}

export function CategoryPage({
  initialCategoryData,
  initialProducts,
}: CategoryPageProps) {
  const [selectedSize, setSelectedSize] = useState<SizeFilter>('All');

  const categoryData = initialCategoryData;
  const products = initialProducts;

  const filteredProducts =
    selectedSize === 'All'
      ? products
      : products.filter(p => getSizeCategory(p.size) === selectedSize);

  if (filteredProducts.length === 0 && products.length === 0) {
    return (
      <motion.div
        className="min-h-screen font-['Mona_Sans',_sans-serif]"
        variants={pageVariants}
        initial='hidden'
        animate='visible'
      >
        <Header />

        <div className='max-w-[1400px] mx-auto px-4 py-8'>
          <motion.h1
            variants={itemVariants}
            initial='hidden'
            animate='visible'
            className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
            style={{ fontSize: '32px', lineHeight: '1.2', fontWeight: '600' }}
          >
            {categoryData.name}
          </motion.h1>

          {categoryData.description && (
            <motion.p
              variants={itemVariants}
              initial='hidden'
              animate='visible'
              className='text-gray-600 mb-8'
            >
              {categoryData.description}
            </motion.p>
          )}

          <motion.div
            variants={itemVariants}
            initial='hidden'
            animate='visible'
            className='text-center py-16'
          >
            <p className='text-gray-600 text-lg'>
              No products available in this category yet.
            </p>
          </motion.div>
        </div>

        <Footer />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen font-['Mona_Sans',_sans-serif]"
      variants={pageVariants}
      initial='hidden'
      animate='visible'
    >
      <Header />

      <div className='max-w-[1400px] mx-auto px-4 py-8'>
        <motion.h1
          variants={itemVariants}
          initial='hidden'
          animate='visible'
          className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
          style={{ fontSize: '32px', lineHeight: '1.2', fontWeight: '600' }}
        >
          {categoryData.name}
        </motion.h1>

        {categoryData.description && (
          <motion.p
            variants={itemVariants}
            initial='hidden'
            animate='visible'
            className='text-gray-600 mb-8'
          >
            {categoryData.description}
          </motion.p>
        )}

        <motion.div
          className='flex gap-3 mb-8'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {(['All', 'Small', 'Medium', 'Large'] as SizeFilter[]).map(size => (
            <motion.button
              key={size}
              variants={itemVariants}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSize(size)}
              className={`px-6 py-2 rounded-full transition-colors ${
                selectedSize === size
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {size}
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          <AnimatePresence mode='popLayout'>
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                initial='hidden'
                animate='visible'
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  images={product.images}
                  price={product.price}
                  size={product.size}
                  isFeatured={product.is_featured}
                  index={index}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProducts.length === 0 && products.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial='hidden'
            animate='visible'
            className='text-center py-16'
          >
            <p className='text-gray-600 text-lg mb-4'>
              No products match the selected size filter.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSize('All')}
              className='px-6 py-2 bg-gray-200 text-gray-900 rounded-full hover:bg-gray-300 transition-colors'
            >
              Clear Filter
            </motion.button>
          </motion.div>
        )}
      </div>

      <Footer />
    </motion.div>
  );
}
