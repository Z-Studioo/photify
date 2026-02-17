import { Header } from '@/components/layout/header';
import { CategoryNav } from '@/components/shared/category-nav';
import { FeaturedCollections } from '@/components/shared/featured-collections';
import { ProductCard } from '@/components/shared/product-card';
import { RoomInspiration } from '@/components/shared/room-inspiration';
// import { AIToolsSection } from '@/components/ai-tools/ai-tools-section';
import { Footer } from '@/components/layout/footer';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface HomePageProps {
  initialFeaturedProducts: any[];
  initialRooms: any[];
  initialArtProducts: any[];
}

export function HomePage({
  initialFeaturedProducts,
  initialRooms,
  initialArtProducts,
}: HomePageProps) {
  const navigate = useNavigate();

  // Fallback mock data
  const mockFeaturedProducts = [
    {
      images: [
        'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNTMxMjY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjB3YWxsfGVufDF8fHx8MTc2MDY0NTg1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Parallel Triplet',
      size: '74cm x 28cm',
      price: '69',
      productId: 'collage-3',
    },
    {
      images: [
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNTMxMjY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Timeless Quartet',
      size: '69cm x 89cm',
      price: '106',
      oldPrice: '140',
      productId: 'framed-prints',
    },
    {
      images: [
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjB3YWxsfGVufDF8fHx8MTc2MDY0NTg1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Harmony In Four',
      size: '102cm x 119cm',
      price: '237',
      oldPrice: '318',
      productId: 'single-canvas',
    },
    {
      images: [
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjB3YWxsfGVufDF8fHx8MTc2MDY0NTg1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Solo Vista',
      size: '51cm x 61cm',
      price: '51',
      productId: 'photo-cushions',
    },
    {
      images: [
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNTMxMjY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Dual Harmony',
      size: '81cm x 31cm',
      price: '111',
      oldPrice: '144',
      productId: 'collage-3',
    },
    {
      images: [
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjB3YWxsfGVufDF8fHx8MTc2MDY0NTg1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Classic Trio',
      size: '84cm x 52cm',
      price: '174',
      oldPrice: '216',
      productId: 'framed-prints',
    },
    {
      images: [
        'https://images.unsplash.com/photo-1560036040-7c5ce74043ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YWxsJTIwYXJ0JTIwYWJzdHJhY3R8ZW58MXx8fHwxNzYwNzAyNjY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNTMxMjY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzYwNjQ3MzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      ],
      name: 'Abstract Vision',
      size: '92cm x 72cm',
      price: '89',
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
          .map((product: any) => ({
            images: product.images || [],
            name: product.name,
            price: product.price,
            oldPrice: product.old_price,
            productId: product.slug || product.id,
            productType: product.product_type || 'canvas',
            active: product.active !== false,
            isVisible: !!product.config?.configurerType,
          }))
          .filter(product => product.active && product.isVisible)
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
      <CategoryNav />

      {/* Our Best Sellers Section */}
      <section className='pt-8 pb-3'>
        <div className='max-w-[1400px] mx-auto px-4'>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-['Bricolage_Grotesque',_sans-serif] text-left"
            style={{ fontSize: '24px', lineHeight: '1.2', fontWeight: '600' }}
          >
            Our Best Sellers
          </motion.h2>
          <p className='text-gray-600 text-lg mt-3'>
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
                key={product.productId}
                id={product.productId}
                name={product.name}
                slug={product.productId}
                images={product.images}
                price={product.price}
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

      {/* Room Inspiration */}
      <section className='py-16'>
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
      </section>

      {/* Art Collections Section */}
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
            Art Collections
          </motion.h2>
          <p className='text-gray-600 text-lg mt-3 mb-6'>
            From abstract to traditional, find the perfect piece to complete
            your space
          </p>

          {/* Categories */}
          <div className='flex flex-wrap gap-3 mb-8'>
            <button
              onClick={() => navigate('/art-collections')}
              className='px-8 py-3 rounded-full bg-pink-100 text-[#f63a9e] transition-colors hover:bg-pink-200'
            >
              All
            </button>
            <button
              onClick={() => navigate('/art-collections?category=Religion')}
              className='px-8 py-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors'
            >
              Religion
            </button>
            <button
              onClick={() => navigate('/art-collections?category=Abstract')}
              className='px-8 py-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors'
            >
              Abstract
            </button>
            <button
              onClick={() => navigate('/art-collections?category=Animals')}
              className='px-8 py-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors'
            >
              Animals
            </button>
            <button
              onClick={() => navigate('/art-collections?category=Nepal')}
              className='px-8 py-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors'
            >
              Nepal
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {artProducts.length > 0 ? (
              <>
                {artProducts.slice(0, 7).map((product, index) => (
                  <motion.div
                    key={product.productId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className='group cursor-pointer'
                    onClick={() => navigate(`/art/${product.productId}`)}
                  >
                    {/* Product Image */}
                    <div className='relative aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100'>
                      <ImageWithFallback
                        src={product.images[0] || '/assets/placeholder.png'}
                        alt={product.name}
                        className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                      />
                    </div>

                    {/* Product Info */}
                    <div>
                      <h3
                        className="font-['Bricolage_Grotesque',_sans-serif] mb-1"
                        style={{
                          fontSize: '16px',
                          lineHeight: '1.3',
                          fontWeight: '600',
                        }}
                      >
                        {product.name}
                      </h3>
                      <div className={`flex items-center justify-between`}>
                        <div className='flex flex-col'>
                          <span className='text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1'>
                            Starting At
                          </span>

                          <div className='flex items-start'>
                            <div className='flex items-start text-[#f63a9e]'>
                              <span className='font-bold text-lg mt-2 mr-0.5'>
                                £
                              </span>

                              <span className='font-extrabold text-4xl tracking-tighter leading-none font-bricolage'>
                                {typeof product.price === 'number'
                                  ? Math.floor(product.price)
                                  : product.price}
                              </span>

                              <span className='font-bold text-xl mt-2'>
                                .
                                {typeof product.price === 'number'
                                  ? product.price.toFixed(2).split('.')[1]
                                  : '00'}
                              </span>
                            </div>

                            <div className='ml-3 flex flex-col justify-center border-l border-gray-200 pl-3'>
                              <span className='text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none'>
                                Per
                              </span>

                              <span className='text-gray-600 text-sm font-bold leading-tight whitespace-nowrap'>
                                sq in
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              <>
                {featuredProducts.slice(0, 7).map((product, index) => (
                  <ProductCard
                    key={product.productId}
                    id={product.productId}
                    name={product.name}
                    slug={product.productId}
                    images={product.images}
                    price={product.price}
                    isFeatured={false}
                    index={index}
                  />
                ))}
              </>
            )}

            {/* Navigational Card */}
            <div
              onClick={() => navigate('/art-collections')}
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

      {/* AI Tools Section */}
      {/* <AIToolsSection /> */}

      <Footer />
    </div>
  );
}
