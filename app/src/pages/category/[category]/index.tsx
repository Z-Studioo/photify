import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ProductCard } from '@/components/shared/product-card';
import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';

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

  // Filter products by size
  const filteredProducts =
    selectedSize === 'All'
      ? products
      : products.filter(p => getSizeCategory(p.size) === selectedSize);

  // Empty state - no products in category
  if (filteredProducts.length === 0 && products.length === 0) {
    return (
      <>
        <Helmet>
          <title>{categoryData.name} | Photify</title>
          <meta
            name="description"
            content={`Explore products in the ${categoryData.name} category on Photify.`}
          />
          <meta name="robots" content="index,follow" />
        </Helmet>
        <div className="min-h-screen font-['Mona_Sans',_sans-serif]">
          <Header />
          <div className='max-w-[1400px] mx-auto px-4 py-8'>
            <h1
              className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
              style={{ fontSize: '32px', lineHeight: '1.2', fontWeight: '600' }}
            >
              {categoryData.name}
            </h1>
            {categoryData.description && (
              <p className='text-gray-600 mb-8'>{categoryData.description}</p>
            )}
            <div className='text-center py-16'>
              <p className='text-gray-600 text-lg'>
                No products available in this category yet.
              </p>
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{categoryData.name} | Photify</title>
        <meta
          name="description"
          content={`Explore products in the ${categoryData.name} category on Photify.`}
        />
        <meta name="robots" content="index,follow" />
      </Helmet>
      <div className="min-h-screen font-['Mona_Sans',_sans-serif]">
        <Header />

        <div className='max-w-[1400px] mx-auto px-4 py-8'>
          {/* Category Title */}
          <h1
            className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
            style={{ fontSize: '32px', lineHeight: '1.2', fontWeight: '600' }}
          >
            {categoryData.name}
          </h1>

          {/* Category Description (if available) */}
          {categoryData.description && (
            <p className='text-gray-600 mb-8'>{categoryData.description}</p>
          )}

          {/* Size Filters */}
          <div className='flex gap-3 mb-8'>
            <button
              onClick={() => setSelectedSize('All')}
              className={`px-6 py-2 rounded-full transition-colors ${
                selectedSize === 'All'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedSize('Small')}
              className={`px-6 py-2 rounded-full transition-colors ${
                selectedSize === 'Small'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Small
            </button>
            <button
              onClick={() => setSelectedSize('Medium')}
              className={`px-6 py-2 rounded-full transition-colors ${
                selectedSize === 'Medium'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setSelectedSize('Large')}
              className={`px-6 py-2 rounded-full transition-colors ${
                selectedSize === 'Large'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Large
            </button>
          </div>

          {/* Products Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16'>
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
          </div>

          {/* Empty filter state */}
          {filteredProducts.length === 0 && products.length > 0 && (
            <div className='text-center py-16'>
              <p className='text-gray-600 text-lg mb-4'>
                No products match the selected size filter.
              </p>
              <button
                onClick={() => setSelectedSize('All')}
                className='px-6 py-2 bg-gray-200 text-gray-900 rounded-full hover:bg-gray-300 transition-colors'
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}
