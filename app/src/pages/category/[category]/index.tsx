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
  config?: unknown;
  fixed_price?: number | null;
  is_featured: boolean;
  active: boolean;
  tags: Tag[];
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

type SizeFilter = 'All' | 'Small' | 'Medium' | 'Large';

interface CategoryPageProps {
  initialCategoryData: Category;
  initialProducts: Product[];
  tags: Tag[];
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
  tags,
}: CategoryPageProps) {
  const [selectedSize, setSelectedSize] = useState<SizeFilter>('All');
  const categoryData = initialCategoryData;
  const products = initialProducts;
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const toggleTag = (tagId: string | null) => {
    setSelectedTagId(prev => (prev === tagId ? null : tagId));
  };

  // Filter products by size & tag
  const filteredProducts = products.filter(product => {
    // Size filter
    const matchesSize =
      selectedSize === 'All' || getSizeCategory(product.size) === selectedSize;

    // Tag filter
    const matchesTags =
      !selectedTagId || product.tags?.some(tag => tag.id === selectedTagId);

    return matchesSize && matchesTags;
  });

  // Empty state - no products in category
  if (filteredProducts.length === 0 && products.length === 0) {
    return (
      <>
        <Helmet>
          <title>{categoryData.name} | Photify</title>
          <meta
            name='description'
            content={`Explore products in the ${categoryData.name} category on Photify.`}
          />
          <meta name='robots' content='index,follow' />
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
          name='description'
          content={`Explore products in the ${categoryData.name} category on Photify.`}
        />
        <meta name='robots' content='index,follow' />
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
            <div className='flex flex-wrap gap-3 mb-10'>
              {/* ALL BUTTON */}
              <button
                type='button'
                onClick={() => toggleTag(null)}
                aria-pressed={selectedTagId === null}
                className={`
                relative inline-flex items-center gap-2
                px-5 py-2.5 rounded-full text-sm font-semibold
                transition-all duration-300 ease-out
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f63a9e]/40
                ${
                  selectedTagId === null
                    ? `
                      bg-gradient-to-r from-[#f63a9e] to-pink-500
                      text-white
                      shadow-lg shadow-pink-500/30
                    `
                    : `
                      bg-white
                      text-[#f63a9e]
                      hover:bg-pink-50
                      hover:border-[#f63a9e]
                    `
                }
              `}
              >
                <span className='text-base'>✨</span>
                All
              </button>

              {tags.map(tag => {
                const isSelected = selectedTagId === tag.id;

                return (
                  <button
                    key={tag.id}
                    type='button'
                    onClick={() => toggleTag(tag.id)}
                    aria-pressed={isSelected}
                    className={`
                      group relative inline-flex items-center gap-2
                      px-4 py-2 rounded-full text-sm font-medium
                      transition-all duration-300 ease-out
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f63a9e]/40
                      ${
                        isSelected
                          ? `
                            bg-gradient-to-r from-[#f63a9e] to-pink-500
                            text-white border border-transparent
                            shadow-lg shadow-pink-500/25
                          `
                          : `
                            bg-white/70 backdrop-blur
                            border border-gray-300
                            text-gray-700
                            hover:bg-gray-100
                            hover:border-gray-400
                          `
                      }
                      `}
                  >
                    {/* Optional color dot */}
                    <span
                      className={`
                          h-2.5 w-2.5 rounded-full
                          ${isSelected ? 'bg-white' : ''}
                        `}
                      style={!isSelected ? { backgroundColor: tag.color } : {}}
                    />

                    {tag.name}

                    {/* Subtle hover glow */}
                    {!isSelected && (
                      <span className='absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-pink-500/5' />
                    )}
                  </button>
                );
              })}
            </div>
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
                config={product.config}
                fixed_price={product.fixed_price}
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
                No products match the selected filters.
              </p>
              <button
                onClick={() => {
                  setSelectedSize('All');
                  setSelectedTagId(null);
                }}
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
