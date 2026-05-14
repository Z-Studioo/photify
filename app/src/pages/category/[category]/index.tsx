import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ProductCard } from '@/components/shared/product-card';

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

interface CategoryPageProps {
  initialCategoryData: Category;
  initialProducts: Product[];
  tags: Tag[];
}

export function CategoryPage({
  initialCategoryData,
  initialProducts,
}: CategoryPageProps) {
  const categoryData = initialCategoryData;
  const products = initialProducts;

  if (products.length === 0) {
    return (
      <>
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

          {/* Products Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16'>
            {products.map((product, index) => (
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
        </div>

        <Footer />
      </div>
    </>
  );
}
