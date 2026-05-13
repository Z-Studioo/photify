import { Header } from '@/components/layout/header';
import { FeaturedCollections } from '@/components/shared/featured-collections';
import { ProductCard, type ProductCardProps } from '@/components/shared/product-card';
import { RoomInspiration } from '@/components/shared/room-inspiration';
import { ArtPhotoTile } from '@/components/shared/art-photo-tile';
// import { AIToolsSection } from '@/components/ai-tools/ai-tools-section';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface HomePageProps {
  initialFeaturedProducts: any[];
  initialRooms: any[];
  initialArtProducts: any[];
  initialArtTags?: string[];
}

export function HomePage({
  initialFeaturedProducts,
  initialRooms,
  initialArtProducts,
  initialArtTags = [],
}: HomePageProps) {
  const navigate = useNavigate();

  // Fallback mock data
  const mockFeaturedProducts = [
    {
      id: 'collage-3',
      slug: 'collage-3',
      images: [
        'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNTMxMjY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjB3YWxsfGVufDF8fHx8MTc2MDY0NTg1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Parallel Triplet',
      size: '74cm x 28cm',
      price: '69',
      fixed_price: null,
      productId: 'collage-3',
    },
    {
      id: 'framed-prints',
      slug: 'framed-prints',
      images: [
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNTMxMjY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Timeless Quartet',
      size: '69cm x 89cm',
      price: '106',
      fixed_price: null,
      oldPrice: '140',
      productId: 'framed-prints',
    },
    {
      id: 'single-canvas',
      slug: 'single-canvas',
      images: [
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjB3YWxsfGVufDF8fHx8MTc2MDY0NTg1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Harmony In Four',
      size: '102cm x 119cm',
      price: '237',
      fixed_price: null,
      oldPrice: '318',
      productId: 'single-canvas',
    },
    {
      id: 'photo-cushions',
      slug: 'photo-cushions',
      images: [
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjB3YWxsfGVufDF8fHx8MTc2MDY0NTg1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Solo Vista',
      size: '51cm x 61cm',
      price: '51',
      fixed_price: null,
      productId: 'photo-cushions',
    },
    {
      id: 'collage-3-2',
      slug: 'collage-3',
      images: [
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNTMxMjY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Dual Harmony',
      size: '81cm x 31cm',
      price: '111',
      fixed_price: null,
      oldPrice: '144',
      productId: 'collage-3',
    },
    {
      id: 'framed-prints-2',
      slug: 'framed-prints',
      images: [
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjB3YWxsfGVufDF8fHx8MTc2MDY0NTg1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Classic Trio',
      size: '84cm x 52cm',
      price: '174',
      fixed_price: null,
      oldPrice: '216',
      productId: 'framed-prints',
    },
    {
      id: 'single-canvas-2',
      slug: 'single-canvas',
      images: [
        'https://images.unsplash.com/photo-1560036040-7c5ce74043ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YWxsJTIwYXJ0JTIwYWJzdHJhY3R8ZW58MXx8fHwxNzYwNzAyNjY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNTMxMjY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Abstract Vision',
      size: '92cm x 72cm',
      price: '89',
      fixed_price: null,
      productId: 'single-canvas',
    },
  ];

  const mockRoomInspirations = [
    {
      image:
        'https://images.unsplash.com/photo-1667584523543-d1d9cc828a15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaXZpbmclMjByb29tJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwOTAzMzkzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Modern Living Room',
      roomId: 'modern-living-room',
      productCount: 3,
    },
    {
      image:
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWRyb29tJTIwaW50ZXJpb3IlMjBkZXNpZ258ZW58MXx8fHwxNzYwODY0NzY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Cozy Bedroom',
      roomId: 'cozy-bedroom',
      productCount: 2,
    },
    {
      image:
        'https://images.unsplash.com/photo-1704040686487-a39bb894fc93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaW5pbmclMjByb29tJTIwZnVybml0dXJlfGVufDF8fHx8MTc2MDk2NjQ5OHww&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Elegant Dining Room',
      roomId: 'dining-room',
      productCount: 2,
    },
    {
      image:
        'https://images.unsplash.com/photo-1669723008642-b00fa9d10b76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwb2ZmaWNlJTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MDkxMDE5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Creative Home Office',
      roomId: 'home-office',
      productCount: 2,
    },
  ];

  // Use server-fetched data if available, otherwise use mock data
  const featuredProducts =
    initialFeaturedProducts.length > 0
      ? initialFeaturedProducts
          .map((product: any) => {
            const transformed = {
              id: product.id,
              slug: product.slug,
              images: product.images || [],
              name: product.name,
              price: product.price,
              config: product.config,
              fixed_price: product.fixed_price,
              oldPrice: product.old_price,
              productId: product.slug || product.id,
              productType: product.product_type || 'canvas',
              active: product.active !== false,
            };
            console.log('Transforming product:', {
              name: product.name,
              hasFixedPrice: !!transformed.fixed_price,
              fixedPrice: transformed.fixed_price,
            });
            return transformed;
          })
          .filter(product => {
            const passes = product.active;
            console.log('Filtering product:', product.name, '→', passes ? 'KEEP' : 'REMOVE');
            return passes;
          })
      : mockFeaturedProducts;

  const roomInspirations =
    initialRooms.length > 0
      ? initialRooms.map((room: any) => ({
          image: room.image,
          title: room.title,
          roomId: room.slug || room.id,
          productCount: room.product_count || 0,
        }))
      : mockRoomInspirations;

  // Transform art products for display
  const artProducts =
    initialArtProducts.length > 0
      ? initialArtProducts.map((product: any) => ({
          images: product.images || (product.image ? [product.image] : []),
          name: product.name,
          price: product.price?.replace('£', '').replace('.00', ''),
          productId: product.slug || product.id,
          productType: product.product_type || 'canvas',
          category: product.category,
        }))
      : [];

  return (
    <div className="min-h-screen font-['Mona_Sans',_sans-serif] relative">
      <Header />
      <h1 className='sr-only'>
        Photify — Personalised canvas prints, framed wall art, and photo gifts in
        the UK
      </h1>
      {/* CategoryNav hidden on home page */}

      {/* Our Best Sellers Section */}
      <section className='pt-4 xs:pt-5 sm:pt-6 md:pt-8 pb-2 xs:pb-2.5 sm:pb-3'>
        <div className='max-w-[1400px] mx-auto px-3 xs:px-4'>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-['Bricolage_Grotesque',_sans-serif] text-left text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-[24px]"
            style={{ lineHeight: '1.2', fontWeight: '600' }}
          >
            Our Best Sellers
          </motion.h2>
          <p className='text-gray-600 text-xs xs:text-sm sm:text-base md:text-lg mt-1.5 xs:mt-2 sm:mt-2.5 md:mt-3'>
            Discover our most-loved designs, handpicked by customers just like
            you
          </p>
        </div>
      </section>

      <FeaturedCollections />

      {/* Create Your Custom Print Section */}
      <section className='py-8'>
        <div className='max-w-[1400px] mx-auto px-4'>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-['Bricolage_Grotesque',_sans-serif] text-left"
            style={{ fontSize: '24px', lineHeight: '1.2', fontWeight: '600' }}
          >
            Create Your Custom Print 📷
          </motion.h2>
          <p className='text-gray-600 text-lg mt-3 mb-6'>
            Upload your photos and we&apos;ll turn them into stunning canvas
            prints, framed art, and more
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {featuredProducts.slice(0, 5).map((product, index) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                images={product.images}
                price={product.price}
                config={(product as ProductCardProps).config}
                fixed_price={(product as ProductCardProps).fixed_price}
                isFeatured={false}
                index={index}
              />
            ))}

            {/* Browse All Card */}
            <div
              onClick={() => navigate('/products')}
              className='cursor-pointer group'
            >
              <div className='relative aspect-square mb-3 rounded-lg bg-[#f63a9e] hover:bg-[#e02a8e] transition-colors flex flex-col items-center justify-center p-8 text-center'>
                <p
                  className='text-white mb-4'
                  style={{
                    fontSize: '18px',
                    lineHeight: '1.4',
                    fontWeight: '500',
                  }}
                >
                  Can&apos;t find what you looking for?
                </p>
                <p
                  className='text-white mb-6'
                  style={{
                    fontSize: '32px',
                    lineHeight: '1.2',
                    fontWeight: '700',
                  }}
                >
                  Browse All
                </p>
                <div className='w-12 h-12 rounded-full border-2 border-white flex items-center justify-center group-hover:scale-110 transition-transform'>
                  <svg
                    className='w-6 h-6 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Room Inspiration — temporarily disabled (kept for future re-enable) */}
      {/* <section className='py-16'>
        <div className='max-w-[1400px] mx-auto px-4'>
          <div className='text-left mb-12'>
            <h2
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '24px', lineHeight: '1.2', fontWeight: '600' }}
            >
              Room Inspiration
            </h2>
            <p className='text-gray-600 mt-2'>
              Discover how to transform your space
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {roomInspirations.map(room => (
              <RoomInspiration key={room.roomId} {...room} />
            ))}
          </div>
        </div>
      </section> */}

      {/* Art Collections Section — Pixabay-style photo gallery */}
      <section className='py-10 sm:py-14'>
        <div className='max-w-[1400px] mx-auto px-4'>
          <div className='flex items-end justify-between gap-4 mb-6 sm:mb-8'>
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="font-['Bricolage_Grotesque',_sans-serif] text-left"
                style={{
                  fontSize: '24px',
                  lineHeight: '1.2',
                  fontWeight: '600',
                }}
              >
                Art Collections
              </motion.h2>
              <p className='text-gray-600 text-base sm:text-lg mt-2 sm:mt-3 max-w-2xl'>
                A curated gallery of prints — from abstract to traditional.
                Tap any photo to make it yours.
              </p>
            </div>
            <button
              onClick={() => navigate('/art-collections')}
              className='hidden sm:inline-flex items-center gap-1.5 text-[#f63a9e] hover:text-[#e02a8e] font-semibold text-sm transition-colors'
            >
              View all
              <ArrowRight className='w-4 h-4' />
            </button>
          </div>

          {/* Category chips */}
          {initialArtTags.length > 0 && (
            <div className='flex flex-nowrap sm:flex-wrap gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible'>
              <span className='flex-shrink-0 px-4 py-1.5 rounded-full bg-[#f63a9e] text-white text-xs sm:text-sm font-semibold'>
                All
              </span>
              {initialArtTags.slice(0, 8).map(tag => (
                <button
                  key={tag}
                  onClick={() =>
                    navigate(`/art-collections?category=${encodeURIComponent(tag)}`)
                  }
                  className='flex-shrink-0 px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 text-xs sm:text-sm font-medium transition-colors'
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Masonry photo grid */}
          {artProducts.length > 0 ? (
            <div className='columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4'>
              {artProducts.slice(0, 9).map((product, index) => (
                <ArtPhotoTile
                  key={product.productId}
                  id={product.productId}
                  slug={product.productId}
                  name={product.name}
                  images={product.images}
                  category={product.category}
                  price={product.price}
                  index={index}
                />
              ))}

              {/* Browse-all promo tile, sized to blend with masonry */}
              <button
                onClick={() => navigate('/art-collections')}
                className='group relative block w-full overflow-hidden mb-3 sm:mb-4 break-inside-avoid aspect-[3/4] bg-gradient-to-br from-[#f63a9e] via-[#ff5fb1] to-[#7c2bd1] text-left border-0 p-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f63a9e] focus-visible:ring-offset-2'
              >
                <span
                  aria-hidden='true'
                  className='pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 blur-2xl transition-transform duration-500 group-hover:scale-110'
                />
                <div className='relative h-full w-full flex flex-col justify-end p-4 sm:p-5 text-white'>
                  <p className='text-xs uppercase tracking-wider text-white/80 mb-1'>
                    Explore
                  </p>
                  <p className="font-['Bricolage_Grotesque',_sans-serif] text-xl sm:text-2xl font-bold leading-tight mb-2">
                    The full gallery awaits
                  </p>
                  <span className='inline-flex items-center gap-1.5 text-sm font-semibold transition-transform duration-300 group-hover:translate-x-1'>
                    Browse all
                    <ArrowRight className='w-4 h-4' />
                  </span>
                </div>
              </button>
            </div>
          ) : (
            // Fallback: when no art products yet, show featured products in same masonry feel
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {featuredProducts.slice(0, 7).map((product, index) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  images={product.images}
                  price={product.price}
                  config={(product as ProductCardProps).config}
                  fixed_price={(product as ProductCardProps).fixed_price}
                  isFeatured={false}
                  index={index}
                />
              ))}
            </div>
          )}

          <div className='mt-6 sm:hidden text-center'>
            <button
              onClick={() => navigate('/art-collections')}
              className='inline-flex items-center gap-1.5 text-[#f63a9e] font-semibold text-sm'
            >
              View all
              <ArrowRight className='w-4 h-4' />
            </button>
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      {/* <AIToolsSection /> */}

      <Footer />
    </div>
  );
}
