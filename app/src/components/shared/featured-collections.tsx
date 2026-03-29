import { useState, useEffect } from 'react';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';

interface FeaturedCollection {
  image: string;
  badge: string;
  badgeColor?: string;
  title: string;
  price: string;
  productId: string;
}

export function FeaturedCollections() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<FeaturedCollection[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback collections if database query fails
  const fallbackCollections: FeaturedCollection[] = [
    {
      image:
        'https://images.unsplash.com/photo-1686644472082-75dd48820a5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNjQ1ODU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      badge: 'New',
      badgeColor: 'bg-[#f63a9e]',
      title: 'Single Customized Canvas',
      price: '$89.99',
      productId: 'single-canvas',
    },
    {
      image:
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjB3YWxsfGVufDF8fHx8MTc2MDY0NTg1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      badge: 'Limited Edition',
      badgeColor: 'bg-[#FFC739]',
      title: '3 Piece Collage',
      price: '$149.99',
      productId: 'collage-3',
    },
    {
      image:
        'https://images.unsplash.com/photo-1686644472126-0d71b11d51a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHByaW50c3xlbnwxfHx8fDE3NjA2NDU4NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      badge: 'New',
      badgeColor: 'bg-[#f63a9e]',
      title: 'Framed Photo Prints',
      price: '$119.99',
      productId: 'framed-prints',
    },
    {
      image:
        'https://images.unsplash.com/photo-1621781727100-c54d5cb67096?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGN1c2hpb24lMjBwaWxsb3d8ZW58MXx8fHwxNjYwNjQ1ODU5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      badge: 'Special Offer',
      badgeColor: 'bg-[#0051BA]',
      title: 'Photo Cushions',
      price: '$39.99',
      productId: 'photo-cushions',
    },
  ];

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, fixed_price, featured_index, featured_image, config')
        .eq('is_featured', true)
        .not('featured_index', 'is', null)
        .order('featured_index', { ascending: true })
        .limit(4);

      if (error) throw error;

      if (data && data.length > 0) {
        // Transform database products to FeaturedCollection format
        const transformedCollections = data.map(product => {
          // Use fixed_price if available, otherwise fall back to base price
          const displayPrice = product.fixed_price ?? product.price;
          return {
            image: product.featured_image || '',
            badge: 'Featured',
            badgeColor: 'bg-[#f63a9e]',
            title: product.name,
            price: `£${displayPrice}`,
            productId: product.slug || product.id,
          };
        });

        const repeatedCollections: FeaturedCollection[] = [];
        while (repeatedCollections.length < 4) {
          repeatedCollections.push(
            transformedCollections[
              repeatedCollections.length % transformedCollections.length
            ]
          );
        }

        setCollections(repeatedCollections);
      } else {
        // No featured products in database, use fallback
        setCollections(fallbackCollections);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setCollections(fallbackCollections);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className='max-w-[1400px] mx-auto px-3 xs:px-4 py-3 xs:py-4 sm:py-5 md:py-6'>
        <div className='flex items-center justify-center h-[300px] xs:h-[350px] sm:h-[400px] md:h-[450px] bg-gray-50 rounded-lg'>
          <Loader2 className='w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 animate-spin text-[#f63a9e]' />
        </div>
      </section>
    );
  }

  // Ensure we always have 4 items (pad with fallback if needed)
  const displayCollections = [...collections];
  // while (displayCollections.length < 4) {
  //   displayCollections.push(
  //     fallbackCollections[displayCollections.length] || fallbackCollections[0]
  //   );
  // }

  return (
    <section className='max-w-[1400px] mx-auto px-3 xs:px-4 py-3 xs:py-4 sm:py-5 md:py-6'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-2.5 sm:gap-3 h-auto min-h-[280px] xs:min-h-[320px] sm:min-h-[380px] md:min-h-[420px] lg:h-[450px]'>
        {/* Large featured item - left */}
        <button
          onClick={() =>
            navigate(`/product/${displayCollections[0].productId}`)
          }
          className='relative overflow-hidden rounded-sm group h-[280px] xs:h-[320px] sm:h-[380px] md:h-[420px] lg:h-full cursor-pointer border-0 p-0'
        >
          <ImageWithFallback
            src={displayCollections[0].image}
            alt={displayCollections[0].title}
            className='absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />
          <div className='absolute bottom-0 left-0 p-3 xs:p-4 sm:p-5 md:p-6 text-white text-left'>
            <span
              className={`inline-block ${displayCollections[0].badgeColor} text-white text-[10px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-0.5 xs:py-0.5 sm:py-1 rounded-sm mb-1.5 xs:mb-2 sm:mb-2.5 md:mb-3`}
            >
              {displayCollections[0].badge}
            </span>
            <h3
              className="font-['Bricolage_Grotesque',_sans-serif] mb-1.5 xs:mb-2 sm:mb-2.5 md:mb-3 max-w-md text-left text-lg xs:text-xl sm:text-2xl md:text-[28px]"
              style={{ lineHeight: '1.2', fontWeight: '600' }}
            >
              {displayCollections[0].title}
            </h3>
            <div className='flex items-baseline gap-1 xs:gap-1.5 sm:gap-2 mb-1.5 xs:mb-2 sm:mb-2.5 md:mb-3'>
              <p className='text-sm xs:text-base sm:text-lg md:text-xl text-left' style={{ fontWeight: '700' }}>
                From {displayCollections[0].price}
              </p>
            </div>
            <ArrowRight className='w-4 h-4 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6' />
          </div>
        </button>

        {/* Grid of 3 items - right */}
        <div className='grid grid-rows-2 gap-2 xs:gap-2.5 sm:gap-3 h-auto lg:h-full'>
          {/* Top row - 2 items */}
          <div className='grid grid-cols-2 gap-2 xs:gap-2.5 sm:gap-3'>
            {displayCollections.slice(1, 3).map((collection, index) => (
              <button
                key={index}
                onClick={() => navigate(`/product/${collection.productId}`)}
                className='relative overflow-hidden rounded-sm group h-[135px] xs:h-[155px] sm:h-[185px] md:h-[205px] lg:h-full cursor-pointer border-0 p-0'
              >
                <ImageWithFallback
                  src={collection.image}
                  alt={collection.title}
                  className='absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />
                <div className='absolute bottom-0 left-0 p-2 xs:p-2.5 sm:p-3 md:p-4 text-white text-left'>
                  <span
                    className={`inline-block ${collection.badgeColor} text-white text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs px-1.5 xs:px-2 py-0.5 xs:py-0.5 sm:py-1 rounded-sm mb-1 xs:mb-1.5 sm:mb-2`}
                  >
                    {collection.badge}
                  </span>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] mb-1 xs:mb-1.5 sm:mb-2 line-clamp-2 text-left text-xs xs:text-sm sm:text-[15px] md:text-[16px]"
                    style={{
                      lineHeight: '1.3',
                      fontWeight: '600',
                    }}
                  >
                    {collection.title}
                  </h3>
                  <div className='flex items-baseline gap-1 xs:gap-1.5 sm:gap-2 mb-1 xs:mb-1.5 sm:mb-2'>
                    <p
                      className='text-left text-[11px] xs:text-xs sm:text-[13px] md:text-[14px]'
                      style={{ fontWeight: '700' }}
                    >
                      From {collection.price}
                    </p>
                  </div>
                  <ArrowRight className='w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5' />
                </div>
              </button>
            ))}
          </div>

          {/* Bottom row - 1 item spanning full width */}
          <button
            onClick={() =>
              navigate(`/product/${displayCollections[3].productId}`)
            }
            className='relative overflow-hidden rounded-sm group h-[135px] xs:h-[155px] sm:h-[185px] md:h-[205px] lg:h-full cursor-pointer border-0 p-0'
          >
            <ImageWithFallback
              src={displayCollections[3].image}
              alt={displayCollections[3].title}
              className='absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />
            <div className='absolute bottom-0 left-0 p-2.5 xs:p-3 sm:p-3.5 md:p-4 text-white text-left'>
              <span
                className={`inline-block ${displayCollections[3].badgeColor} text-white text-[9px] xs:text-[10px] sm:text-xs px-1.5 xs:px-2 py-0.5 xs:py-0.5 sm:py-1 rounded-sm mb-1 xs:mb-1.5 sm:mb-2`}
              >
                {displayCollections[3].badge}
              </span>
              <h3
                className="font-['Bricolage_Grotesque',_sans-serif] mb-1 xs:mb-1.5 sm:mb-2 text-left text-sm xs:text-base sm:text-[17px] md:text-[18px]"
                style={{
                  lineHeight: '1.3',
                  fontWeight: '600',
                }}
              >
                {displayCollections[3].title}
              </h3>
              <div className='flex items-baseline gap-1 xs:gap-1.5 sm:gap-2 mb-1 xs:mb-1.5 sm:mb-2'>
                <p
                  className='text-left text-xs xs:text-sm sm:text-[15px] md:text-[16px]'
                  style={{ fontWeight: '700' }}
                >
                  From {displayCollections[3].price}
                </p>
              </div>
              <ArrowRight className='w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5' />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
