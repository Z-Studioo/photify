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
      image: 'https://images.unsplash.com/photo-1686644472082-75dd48820a5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjBwcmludCUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNjQ1ODU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      badge: 'New',
      badgeColor: 'bg-[#f63a9e]',
      title: 'Single Customized Canvas',
      price: '$89.99',
      productId: 'single-canvas',
    },
    {
      image: 'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjB3YWxsfGVufDF8fHx8MTc2MDY0NTg1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      badge: 'Limited Edition',
      badgeColor: 'bg-[#FFC739]',
      title: '3 Piece Collage',
      price: '$149.99',
      productId: 'collage-3',
    },
    {
      image: 'https://images.unsplash.com/photo-1686644472126-0d71b11d51a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHByaW50c3xlbnwxfHx8fDE3NjA2NDU4NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      badge: 'New',
      badgeColor: 'bg-[#f63a9e]',
      title: 'Framed Photo Prints',
      price: '$119.99',
      productId: 'framed-prints',
    },
    {
      image: 'https://images.unsplash.com/photo-1621781727100-c54d5cb67096?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGN1c2hpb24lMjBwaWxsb3d8ZW58MXx8fHwxNjYwNjQ1ODU5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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
        .select('id, name, slug, price, featured_index, featured_image')
        .eq('is_featured', true)
        .not('featured_index', 'is', null)
        .order('featured_index', { ascending: true })
        .limit(4);

      if (error) throw error;

      if (data && data.length > 0) {
        // Transform database products to FeaturedCollection format
        const transformedCollections = data.map((product) => ({
          image: product.featured_image || '',
          badge: 'Featured',
          badgeColor: 'bg-[#f63a9e]',
          title: product.name,
          price: `From £${product.price}`,
          productId: product.slug || product.id,
        }));

        setCollections(transformedCollections);
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
      <section className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[450px] bg-gray-50 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-[#f63a9e]" />
        </div>
      </section>
    );
  }

  // Ensure we always have 4 items (pad with fallback if needed)
  const displayCollections = [...collections];
  while (displayCollections.length < 4) {
    displayCollections.push(fallbackCollections[displayCollections.length] || fallbackCollections[0]);
  }

  return (
    <section className="max-w-[1400px] mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[450px]">
        {/* Large featured item - left */}
        <button 
          onClick={() => navigate(`/product/${displayCollections[0].productId}`)}
          className="relative overflow-hidden rounded-sm group h-full cursor-pointer border-0 p-0"
        >
          <ImageWithFallback
            src={displayCollections[0].image}
            alt={displayCollections[0].title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white text-left">
            <span className={`inline-block ${displayCollections[0].badgeColor} text-white text-sm px-3 py-1 rounded-sm mb-3`}>
              {displayCollections[0].badge}
            </span>
            <h3 className="font-['Bricolage_Grotesque',_sans-serif] mb-3 max-w-md text-left" style={{ fontSize: '28px', lineHeight: '1.2', fontWeight: '600' }}>
              {displayCollections[0].title}
            </h3>
            <p className="text-xl mb-3 text-left" style={{ fontWeight: '700' }}>From {displayCollections[0].price}</p>
            <ArrowRight className="w-6 h-6" />
          </div>
        </button>

        {/* Grid of 3 items - right */}
        <div className="grid grid-rows-2 gap-3 h-full">
          {/* Top row - 2 items */}
          <div className="grid grid-cols-2 gap-3">
            {displayCollections.slice(1, 3).map((collection, index) => (
              <button
                key={index}
                onClick={() => navigate(`/product/${collection.productId}`)}
                className="relative overflow-hidden rounded-sm group h-full cursor-pointer border-0 p-0"
              >
                <ImageWithFallback
                  src={collection.image}
                  alt={collection.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-3 md:p-4 text-white text-left">
                  <span className={`inline-block ${collection.badgeColor} text-white text-xs px-2 py-1 rounded-sm mb-2`}>
                    {collection.badge}
                  </span>
                  <h3 className="font-['Bricolage_Grotesque',_sans-serif] mb-2 line-clamp-2 text-left" style={{ fontSize: '16px', lineHeight: '1.3', fontWeight: '600' }}>
                    {collection.title}
                  </h3>
                  <p className="mb-2 text-left" style={{ fontSize: '14px', fontWeight: '700' }}>From {collection.price}</p>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </button>
            ))}
          </div>

          {/* Bottom row - 1 item spanning full width */}
          <button
            onClick={() => navigate(`/product/${displayCollections[3].productId}`)}
            className="relative overflow-hidden rounded-sm group h-full cursor-pointer border-0 p-0"
          >
            <ImageWithFallback
              src={displayCollections[3].image}
              alt={displayCollections[3].title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 text-white text-left">
              <span className={`inline-block ${displayCollections[3].badgeColor} text-white text-xs px-2 py-1 rounded-sm mb-2`}>
                {displayCollections[3].badge}
              </span>
              <h3 className="font-['Bricolage_Grotesque',_sans-serif] mb-2 text-left" style={{ fontSize: '18px', lineHeight: '1.3', fontWeight: '600' }}>
                {displayCollections[3].title}
              </h3>
              <p className="mb-2 text-left" style={{ fontSize: '16px', fontWeight: '700' }}>From {displayCollections[3].price}</p>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
