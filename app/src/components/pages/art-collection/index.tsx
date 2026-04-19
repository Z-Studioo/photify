'use client';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArtProductCard } from '@/components/shared/art-product-card';
import { useSearchParams } from 'react-router';

interface ArtProduct {
  id: string;
  slug?: string;
  name: string;
  image: string;
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
  // Abstract
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
    id: 'art17',
    name: 'Geometric Harmony',
    image:
      'https://images.unsplash.com/photo-1744096641619-646e1f6fbcd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGFydCUyMHByaW50fGVufDF8fHx8MTc2MDYyODI1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    size: '30cm x 40cm',
    price: '£48.00',
    isBestSeller: false,
    category: 'Abstract',
  },
  {
    id: 'art18',
    name: 'Modern Lines',
    image:
      'https://images.unsplash.com/photo-1678117699040-b89738399ca7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3YWxsJTIwYXJ0fGVufDF8fHx8MTc2MDcwNDYyOHww&ixlib=rb-4.1.0&q=80&w=1080',
    size: '45cm x 60cm',
    price: '£62.00',
    isBestSeller: true,
    category: 'Abstract',
  },

  // Religion
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

  // Animals
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
    id: 'art19',
    name: 'Deer in Forest',
    image:
      'https://images.unsplash.com/photo-1683027062130-e70ca0fbc20f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYWwlMjB3aWxkbGlmZSUyMGFydHxlbnwxfHx8fDE3NjA3MDU3Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '55cm x 75cm',
    price: '£85.00',
    isBestSeller: false,
    category: 'Animals',
  },
  {
    id: 'art20',
    name: 'Ocean Creatures',
    image:
      'https://images.unsplash.com/photo-1683027062130-e70ca0fbc20f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYWwlMjB3aWxkbGlmZSUyMGFydHxlbnwxfHx8fDE3NjA3MDU3Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    size: '50cm x 70cm',
    price: '£75.00',
    isBestSeller: false,
    category: 'Animals',
  },

  // Nepal
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

export function ArtCollectionPage({
  initialArtProducts,
  initialCategories,
}: ArtCollectionPageProps) {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Use server-fetched data if available, otherwise use mock data
  // If initialCategories only has 'All', use fallback categories
  const categories =
    initialCategories.length > 1
      ? initialCategories
      : ['All', 'Abstract', 'Religion', 'Animals', 'Nepal', 'Nature', 'Modern'];
  const artProducts =
    initialArtProducts.length > 0
      ? initialArtProducts.map((art: any) => ({
          id: art.id,
          slug: art.slug,
          name: art.name,
          image: (Array.isArray(art.images) && art.images.length > 0 ? art.images[0] : null) || art.image || '',
          size: art.size || '',
          sizeCount: Array.isArray(art.available_sizes) ? art.available_sizes.length : 0,
          price: art.price || '',
          isBestSeller: art.is_bestseller || false,
          category: art.category || '',
          tags: (art.art_product_tags || []).map((apt: any) => {
            const t = Array.isArray(apt.tags) ? apt.tags[0] : apt.tags;
            return t?.name ?? null;
          }).filter(Boolean),
        }))
      : mockArtProducts;

  // Set initial category from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categories.includes(categoryParam)) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams, categories]);

  const filteredProducts =
    selectedCategory === 'All'
      ? artProducts
      : artProducts.filter(p =>
          p.tags && p.tags.length > 0
            ? p.tags.includes(selectedCategory)
            : p.category === selectedCategory
        );

  return (
    <>
      <div className="min-h-screen font-['Mona_Sans',_sans-serif]">
        <Header />

        <div className='max-w-[1400px] mx-auto px-4 py-8'>
          {/* Page Title */}
          <h1
            className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
            style={{ fontSize: '32px', lineHeight: '1.2', fontWeight: '600' }}
          >
            Browse our curated art collections
          </h1>

          {/* Category Filters */}
          <div className='flex flex-wrap gap-3 mb-8'>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-8 py-3 rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-pink-100 text-[#f63a9e]'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {filteredProducts.map((product: ArtProduct, index: number) => (
              <ArtProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                image={product.image}
                price={product.price}
                isBestSeller={product.isBestSeller}
                index={index}
              />
            ))}
          </div>

          {/* No Results */}
          {filteredProducts.length === 0 && (
            <div className='text-center py-16'>
              <p className='text-gray-500 text-lg'>
                No products found in this category.
              </p>
            </div>
          )}

          {/* AI Generation CTA - Commented Out */}
          {/* <div className='relative bg-gradient-to-br from-[#f63a9e]/10 via-purple-50 to-pink-50 rounded-3xl overflow-hidden my-16 max-h-[400px]'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-center h-[400px]'>
              <div className='py-6 px-8 lg:pl-12 flex flex-col justify-center h-full'>
                <div className='flex gap-3 mb-6'>
                  <motion.div
                    className='bg-white rounded-xl p-3 shadow-sm'
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sparkles className='w-6 h-6 text-[#f63a9e]' />
                  </motion.div>
                  <motion.div
                    className='bg-white rounded-xl p-3 shadow-sm'
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Wand2 className='w-6 h-6 text-purple-600' />
                  </motion.div>
                  <motion.div
                    className='bg-white rounded-xl p-3 shadow-sm'
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Zap className='w-6 h-6 text-pink-500' />
                  </motion.div>
                </div>

                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-5"
                  style={{
                    fontSize: '28px',
                    lineHeight: '1.2',
                    fontWeight: '600',
                  }}
                >
                  Can&apos;t find one?
                  <br />
                  Our AI Will Generate on the GO
                </h2>
                <p className='text-gray-600 mb-7'>
                  Create custom artwork tailored to your preferences with our
                  AI-powered tools.
                </p>

                <button
                  onClick={() => navigate('/ai-generate')}
                  className='bg-[#f63a9e] text-white px-6 rounded-full hover:bg-[#e02d8d] transition-all hover:shadow-lg inline-flex items-center gap-2 w-fit'
                  style={{ height: '50px' }}
                >
                  <Sparkles className='w-5 h-5' />
                  Try it now
                </button>
              </div>

              <div className='relative h-[400px]'>
                <ImageWithFallback
                  src='https://images.unsplash.com/photo-1686749115331-e117fb58b46c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMHRlY2hub2xvZ3klMjBjcmVhdGl2ZXxlbnwxfHx8fDE3NjA3MDY4Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
                  alt='AI Art Generation'
                  className='w-full h-full object-cover rounded-r-3xl'
                />
                <div className='absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-pink-50/80 lg:to-pink-50/50 rounded-r-3xl' />
              </div>
            </div>
          </div> */}
        </div>

        <Footer />
      </div>
    </>
  );
}
