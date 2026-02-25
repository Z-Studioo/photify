import { useState, useEffect } from 'react';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import {
  ShoppingCart,
  Plus,
  Info,
  ArrowLeft,
  Loader2,
  Upload,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/context/CartContext';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  slug?: string;
  isArtProduct?: boolean;
  sizeId?: string;
  sizeName?: string;
}

interface Hotspot {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  product: Product;
}

interface Room {
  id: string;
  name: string;
  description: string;
  image: string;
  hotspots: Hotspot[];
}

interface RoomInspirationPageProps {
  roomId?: string;
}

export function RoomInspirationPage({
  roomId: propRoomId,
}: RoomInspirationPageProps = {}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
  const { addToCart } = useCart();
  const supabase = createClient();
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());
  const [addedAll, setAddedAll] = useState(false);

  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null || isNaN(price) || price === 0)
      return 'Not Available';
    return `$${price.toFixed(2)}`;
  };

  // Fetch room data from database
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);

        // Fetch all rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*')
          .order('created_at', { ascending: false });

        if (roomsError) throw roomsError;

        if (!roomsData || roomsData.length === 0) {
          toast.error('No rooms found');
          setLoading(false);
          return;
        }

        // Find current room (use first room if no roomId provided)
        const targetRoomId = propRoomId || roomsData[0].id;
        const roomToDisplay =
          roomsData.find(
            (r: any) => r.id === targetRoomId || r.slug === targetRoomId
          ) || roomsData[0];

        // Fetch hotspots for the current room
        const { data: hotspotsData, error: hotspotsError } = await supabase
          .from('room_hotspots')
          .select(
            `
            id,
            position_x,
            position_y,
            label,
            art_size_id,
            products:product_id(id, name, slug, price, images),
            art_products:art_product_id(id, name, slug, price, images, available_sizes),
            sizes:art_size_id(id, width_in, height_in, display_label)
          `
          )
          .eq('room_id', roomToDisplay.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (hotspotsError) console.error('Hotspots error:', hotspotsError);

        // Transform to Room format
        const transformedRoom: Room = {
          id: roomToDisplay.id,
          name: roomToDisplay.title,
          description: roomToDisplay.description || '',
          image: roomToDisplay.image,
          hotspots: (hotspotsData || []).map((h: any) => {
            const product = h.products || h.art_products;
            const isArtProduct = !!h.art_products;
            const selectedSize = h.sizes; // From sizes table

            // For art products, get the price from available_sizes JSONB
            let price = 0;
            let sizeName = '';

            if (
              isArtProduct &&
              selectedSize &&
              h.art_products?.available_sizes
            ) {
              const availableSizes = h.art_products.available_sizes;
              const priceInfo = availableSizes.find(
                (s: any) => s.size_id === selectedSize.id
              );
              price = priceInfo?.price || 0;

              // Convert inches to cm for display
              const widthCm = Math.round(selectedSize.width_in * 2.54);
              const heightCm = Math.round(selectedSize.height_in * 2.54);
              sizeName = `${widthCm}×${heightCm}cm`;
            } else if (product?.price) {
              price =
                typeof product.price === 'string'
                  ? parseFloat(product.price)
                  : product.price;
            }

            return {
              id: h.id,
              x: Number(h.position_x),
              y: Number(h.position_y),
              product: product
                ? {
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price,
                    image: product.images?.[0] || '/placeholder.jpg',
                    category: isArtProduct ? 'Art Print' : 'Custom Product',
                    isArtProduct,
                    sizeId: selectedSize?.id,
                    sizeName: sizeName || selectedSize?.display_label,
                  }
                : {
                    id: 'unknown',
                    name: h.label || 'Unknown Product',
                    price: 0,
                    image: '/placeholder.jpg',
                    category: 'Unknown',
                    isArtProduct: false,
                  },
            };
          }),
        };

        setCurrentRoom(transformedRoom);

        // Transform all rooms for "Explore More" section
        const transformedRooms: Room[] = roomsData.map((r: any) => ({
          id: r.id,
          name: r.title,
          description: r.description || '',
          image: r.image,
          hotspots: [], // We don't need hotspots for the preview cards
        }));

        setAllRooms(transformedRooms);
      } catch (error) {
        console.error('Error fetching room data:', error);
        toast.error('Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [propRoomId]);

  // Fallback hardcoded room data (kept for backwards compatibility)
  const fallbackRooms: Room[] = [
    {
      id: 'modern-living-room',
      name: 'Modern Living Room',
      description:
        'A contemporary living space with minimalist art and cozy furniture',
      image:
        'https://images.unsplash.com/photo-1667584523543-d1d9cc828a15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaXZpbmclMjByb29tJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwOTAzMzkzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      hotspots: [
        {
          id: 'h1',
          x: 25,
          y: 35,
          product: {
            id: 'abstract-1',
            name: 'Abstract Waves Canvas',
            price: 129.99,
            image:
              'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
            category: 'Abstract',
          },
        },
        {
          id: 'h2',
          x: 65,
          y: 40,
          product: {
            id: 'minimal-2',
            name: 'Geometric Lines Print',
            price: 89.99,
            image:
              'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
            category: 'Minimalist',
          },
        },
        {
          id: 'h3',
          x: 45,
          y: 70,
          product: {
            id: 'furniture-1',
            name: 'Modern Coffee Table Book',
            price: 49.99,
            image:
              'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
            category: 'Accessories',
          },
        },
      ],
    },
    {
      id: 'cozy-bedroom',
      name: 'Cozy Bedroom',
      description:
        'Create a peaceful retreat with calming artwork and soft textures',
      image:
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWRyb29tJTIwaW50ZXJpb3IlMjBkZXNpZ258ZW58MXx8fHwxNzYwODY0NzY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      hotspots: [
        {
          id: 'h4',
          x: 30,
          y: 30,
          product: {
            id: 'nature-3',
            name: 'Botanical Print Set',
            price: 159.99,
            image:
              'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400',
            category: 'Nature',
          },
        },
        {
          id: 'h5',
          x: 70,
          y: 35,
          product: {
            id: 'minimal-3',
            name: 'Serene Landscape',
            price: 119.99,
            image:
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
            category: 'Landscape',
          },
        },
      ],
    },
    {
      id: 'dining-room',
      name: 'Elegant Dining Room',
      description: 'Sophisticated dining space with curated art pieces',
      image:
        'https://images.unsplash.com/photo-1704040686487-a39bb894fc93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaW5pbmclMjByb29tJTIwZnVybml0dXJlfGVufDF8fHx8MTc2MDk2NjQ5OHww&ixlib=rb-4.1.0&q=80&w=1080',
      hotspots: [
        {
          id: 'h6',
          x: 50,
          y: 25,
          product: {
            id: 'abstract-4',
            name: 'Contemporary Art Piece',
            price: 199.99,
            image:
              'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400',
            category: 'Abstract',
          },
        },
        {
          id: 'h7',
          x: 20,
          y: 50,
          product: {
            id: 'black-white-1',
            name: 'Monochrome Photography',
            price: 109.99,
            image:
              'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400',
            category: 'Black & White',
          },
        },
      ],
    },
    {
      id: 'home-office',
      name: 'Creative Home Office',
      description:
        'Inspire productivity with motivational art and clean design',
      image:
        'https://images.unsplash.com/photo-1669723008642-b00fa9d10b76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwb2ZmaWNlJTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MDkxMDE5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      hotspots: [
        {
          id: 'h8',
          x: 35,
          y: 30,
          product: {
            id: 'minimal-4',
            name: 'Motivational Typography',
            price: 79.99,
            image:
              'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=400',
            category: 'Typography',
          },
        },
        {
          id: 'h9',
          x: 60,
          y: 45,
          product: {
            id: 'architecture-1',
            name: 'Architectural Lines',
            price: 139.99,
            image:
              'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=400',
            category: 'Architecture',
          },
        },
      ],
    },
  ];

  // Use rooms from allRooms state (dynamically fetched) or fallback to hardcoded
  const rooms = allRooms.length > 0 ? allRooms : fallbackRooms;

  // Use currentRoom from state (dynamically fetched) or fallback
  const displayRoom =
    currentRoom || rooms.find(r => r.id === propRoomId) || rooms[0];

  const handleAddToCart = (product: Product, silent = false) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
    if (!silent) {
      toast.success(`${product.name} added to cart!`);
    }
    setAddedProductIds(prev => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedProductIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1800);
    setSelectedHotspot(null);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white font-['Mona_Sans',_sans-serif]">
        <Header />
        <div className='max-w-[1400px] mx-auto px-6 py-16 flex items-center justify-center'>
          <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
        </div>
        <Footer />
      </div>
    );
  }

  // No room found
  if (!displayRoom) {
    return (
      <div className="min-h-screen bg-white font-['Mona_Sans',_sans-serif]">
        <Header />
        <div className='max-w-[1400px] mx-auto px-6 py-16 text-center'>
          <h1 className='text-2xl mb-4'>Room Not Found</h1>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Helper: is a product's price valid / purchasable
  const hasPriceValid = (price: number | undefined | null) =>
    price !== undefined && price !== null && !isNaN(price) && price > 0;

  // NaN-safe room total
  const roomTotal = displayRoom.hotspots.reduce(
    (sum, h) => sum + (hasPriceValid(h.product.price) ? h.product.price : 0),
    0
  );
  const roomTotalLabel = roomTotal > 0 ? `$${roomTotal.toFixed(2)}` : 'Not Available';

  // Only art products with a valid price can be added to cart
  const canAddToCart = (product: Product) =>
    !!product.isArtProduct && hasPriceValid(product.price);

  // Art products with valid price for "Add All"
  const cartableProducts = displayRoom.hotspots.filter(h =>
    canAddToCart(h.product)
  );

  return (
    <div className="min-h-screen bg-white font-['Mona_Sans',_sans-serif]">
      <Header />

      {/* Page Title Bar */}
      <div className='bg-gray-50 border-b border-gray-200'>
        <div className='max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-8'>
          <Button
            onClick={() => navigate('/')}
            variant='ghost'
            className='mb-4 sm:mb-6 -ml-3 h-auto px-3 py-2 hover:bg-gray-100 rounded-lg'
            style={{ fontWeight: '600' }}
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Home
          </Button>

          <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4'>
            <div>
              <div className='flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap'>
                <span className='text-xs sm:text-sm text-gray-500'>Room Inspiration</span>
                <span className='text-gray-300'>•</span>
                <span className='text-xs sm:text-sm text-gray-900' style={{ fontWeight: '600' }}>
                  {displayRoom.hotspots.length} products
                </span>
              </div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-2xl sm:text-3xl lg:text-4xl"
                style={{ fontWeight: '700' }}
              >
                {displayRoom.name}
              </h1>
              <p className='text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base max-w-2xl'>
                {displayRoom.description}
              </p>
            </div>

            <div className='sm:text-right flex-shrink-0'>
              <p className='text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1'>Complete look</p>
              <p
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-lg sm:text-2xl"
                style={{ fontWeight: '700' }}
              >
                {roomTotalLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8'>

          {/* Room Image with Hotspots */}
          <div className='lg:col-span-8'>
            <div className='lg:sticky lg:top-6'>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className='relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-gray-100'
              >
                <ImageWithFallback
                  src={displayRoom.image}
                  alt={displayRoom.name}
                  className='w-full h-auto'
                />

                {/* Interactive Hotspots */}
                {displayRoom.hotspots.map(hotspot => (
                  <motion.button
                    key={hotspot.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    whileHover={{ scale: 1.2 }}
                    className='absolute group'
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => setSelectedHotspot(hotspot)}
                    onMouseEnter={() => setHoveredHotspot(hotspot.id)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  >
                    <div className='relative'>
                      <div className='absolute inset-0 bg-[#f63a9e] rounded-full opacity-40 animate-ping' />
                      <div className='relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white rounded-full border-2 sm:border-4 border-[#f63a9e] flex items-center justify-center shadow-xl group-hover:bg-[#f63a9e] transition-all'>
                        <Plus className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#f63a9e] group-hover:text-white transition-colors' />
                      </div>
                    </div>

                    <AnimatePresence>
                      {hoveredHotspot === hotspot.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className='absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-10'
                        >
                          <div
                            className='bg-gray-900 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm shadow-xl'
                            style={{ fontWeight: '600' }}
                          >
                            {hotspot.product.name}
                            <div className='absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45' />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </motion.div>

              {/* Info Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className='mt-4 sm:mt-6 bg-gradient-to-r from-[#FFF5FB] to-purple-50/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-[#f63a9e]/20'
              >
                <div className='flex items-start gap-3 sm:gap-4'>
                  <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#f63a9e]/10 flex items-center justify-center flex-shrink-0'>
                    <Info className='w-4 h-4 sm:w-5 sm:h-5 text-[#f63a9e]' />
                  </div>
                  <div>
                    <h3 className='text-gray-900 mb-1 text-sm sm:text-base' style={{ fontWeight: '700' }}>
                      Shop This Room
                    </h3>
                    <p className='text-gray-600 text-xs sm:text-sm'>
                      Tap the{' '}
                      <Plus className='w-3 h-3 sm:w-4 sm:h-4 inline text-[#f63a9e]' /> icons
                      to explore products featured in this room.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Product List Sidebar */}
          <div className='lg:col-span-4'>
            <motion.div
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className='lg:sticky lg:top-6'
            >
              <div className='bg-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border-2 border-gray-100'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 sm:mb-6 text-base sm:text-lg lg:text-xl"
                  style={{ fontWeight: '700' }}
                >
                  Products in This Room
                </h2>

                <div className='space-y-3 sm:space-y-4'>
                  {displayRoom.hotspots.map((hotspot, index) => {
                    const priceOk = hasPriceValid(hotspot.product.price);
                    const isAdded = addedProductIds.has(hotspot.product.id);
                    return (
                      <motion.div
                        key={hotspot.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                        className='bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-gray-100 hover:border-[#f63a9e]/30 transition-all group cursor-pointer'
                        onClick={() => setSelectedHotspot(hotspot)}
                      >
                        <div className='flex gap-3 sm:gap-4'>
                          <div className='w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 flex-shrink-0'>
                            <ImageWithFallback
                              src={hotspot.product.image}
                              alt={hotspot.product.name}
                              className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                            />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h3 className='text-gray-900 mb-0.5 sm:mb-1 truncate text-sm sm:text-base' style={{ fontWeight: '600' }}>
                              {hotspot.product.name}
                            </h3>
                            <p className='text-gray-500 text-xs mb-1 sm:mb-2'>{hotspot.product.category}</p>
                            <p
                              className={priceOk ? 'text-[#f63a9e] text-sm sm:text-base' : 'text-gray-400 text-xs sm:text-sm italic'}
                              style={{ fontWeight: priceOk ? '700' : '500' }}
                            >
                              {formatPrice(hotspot.product.price)}
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={e => {
                            e.stopPropagation();
                            if (hotspot.product.isArtProduct && priceOk) {
                              handleAddToCart(hotspot.product);
                            } else if (!hotspot.product.isArtProduct) {
                              navigate(`/product/${hotspot.product.slug || hotspot.product.id}`);
                            }
                          }}
                          disabled={hotspot.product.isArtProduct && !priceOk}
                          className={`w-full mt-2 sm:mt-3 rounded-xl h-[40px] sm:h-[45px] text-sm transition-all ${
                            hotspot.product.isArtProduct && !priceOk
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isAdded
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
                          }`}
                          style={{ fontWeight: '700' }}
                        >
                          {hotspot.product.isArtProduct ? (
                            isAdded ? (
                              <><Check className='w-4 h-4 mr-2' />Added!</>
                            ) : priceOk ? (
                              <><ShoppingCart className='w-4 h-4 mr-2' />Add to Cart</>
                            ) : (
                              'Price Not Available'
                            )
                          ) : (
                            <><Upload className='w-4 h-4 mr-2' />Upload Your Photo</>
                          )}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Room Total */}
                <div className='mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-gray-200'>
                  <div className='flex items-center justify-between mb-3 sm:mb-4'>
                    <span className='text-gray-600 text-sm sm:text-base'>Total for this room:</span>
                    <span className='text-gray-900 text-lg sm:text-xl' style={{ fontWeight: '700' }}>
                      {roomTotalLabel}
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      cartableProducts.forEach(h => handleAddToCart(h.product, true));
                      toast.success(`${cartableProducts.length} item${cartableProducts.length !== 1 ? 's' : ''} added to cart!`);
                      setAddedAll(true);
                      setTimeout(() => setAddedAll(false), 1800);
                    }}
                    disabled={cartableProducts.length === 0}
                    variant='outline'
                    className={`w-full border-2 rounded-xl h-[46px] sm:h-[50px] mt-2 transition-all text-sm sm:text-base ${
                      cartableProducts.length === 0
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : addedAll
                          ? 'border-green-400 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-[#f63a9e] hover:bg-[#FFF5FB]'
                    }`}
                    style={{ fontWeight: '700' }}
                  >
                    {addedAll ? (
                      <><Check className='w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500' />All Added!</>
                    ) : (
                      <><ShoppingCart className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                        {cartableProducts.length === 0 ? 'No Items Available' : `Add ${cartableProducts.length === displayRoom.hotspots.length ? 'All' : cartableProducts.length} to Cart`}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Other Rooms Section */}
        <div className='mt-10 sm:mt-16'>
          <h2
            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 sm:mb-6 text-xl sm:text-2xl"
            style={{ fontWeight: '700' }}
          >
            Explore More Rooms
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
            {rooms
              .filter(r => r.id !== displayRoom.id)
              .map(room => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  onClick={() => navigate(`/room/${room.id}`)}
                  className='group cursor-pointer'
                >
                  <div className='relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg'>
                    <ImageWithFallback
                      src={room.image}
                      alt={room.name}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 sm:p-6'>
                      <div>
                        <h3
                          className='text-white mb-0.5 sm:mb-1 text-base sm:text-lg'
                          style={{ fontWeight: '700' }}
                        >
                          {room.name}
                        </h3>
                        <p className='text-white/80 text-xs sm:text-sm'>
                          {room.description || 'View room'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </div>

      {/* Product Detail Dialog */}
      <Dialog
        open={!!selectedHotspot}
        onOpenChange={open => !open && setSelectedHotspot(null)}
      >
        <DialogContent className='w-[95vw] max-w-2xl p-0 overflow-hidden'>
          <DialogTitle className='sr-only'>
            {selectedHotspot?.product.name}
          </DialogTitle>
          {selectedHotspot && (() => {
            const p = selectedHotspot.product;
            const priceOk = hasPriceValid(p.price);
            const isAdded = addedProductIds.has(p.id);
            return (
              <div className='flex flex-col sm:grid sm:grid-cols-2 gap-0'>
                {/* Product Image */}
                <div className='bg-gray-50 aspect-square sm:aspect-auto max-h-48 sm:max-h-none overflow-hidden'>
                  <ImageWithFallback
                    src={p.image}
                    alt={p.name}
                    className='w-full h-full object-cover'
                  />
                </div>

                {/* Product Details */}
                <div className='p-5 sm:p-8 flex flex-col max-h-[70vh] sm:max-h-none overflow-y-auto'>
                  <div className='flex-1'>
                    <h2
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3 sm:mb-4 text-lg sm:text-2xl"
                      style={{ fontWeight: '700' }}
                    >
                      {p.name}
                    </h2>

                    <div className='flex items-baseline gap-2 mb-3 sm:mb-4 flex-wrap'>
                      <p
                        className={`text-xl sm:text-3xl ${priceOk ? 'text-gray-900' : 'text-gray-400 text-base sm:text-lg italic'}`}
                        style={{ fontWeight: '700' }}
                      >
                        {priceOk ? `$${p.price.toFixed(2)}` : 'Price Not Available'}
                      </p>
                      {p.sizeName && (
                        <span className='text-gray-500 text-xs sm:text-sm'>{p.sizeName}</span>
                      )}
                    </div>

                    <p className='text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm leading-relaxed'>
                      {p.isArtProduct
                        ? `Premium art print${p.sizeName ? ` available in ${p.sizeName}` : ''}. Museum-quality printing.`
                        : 'Create your own custom product with your photos. Choose size, style, and more in our editor.'}
                    </p>

                    {p.isArtProduct ? (
                      <>
                        {p.sizeName && (
                          <div className='mb-3 sm:mb-4'>
                            <label className='text-xs sm:text-sm text-gray-900 mb-1.5 sm:mb-2 block' style={{ fontWeight: '600' }}>
                              Size
                            </label>
                            <div className='px-3 py-2 sm:px-4 sm:py-3 border-2 border-[#f63a9e] bg-pink-50 rounded text-xs sm:text-sm text-gray-900'>
                              <span style={{ fontWeight: '600' }}>{p.sizeName}</span>
                            </div>
                          </div>
                        )}
                        {priceOk && (
                          <div className='mb-4 sm:mb-6 flex items-center gap-2 text-xs sm:text-sm text-green-700'>
                            <span style={{ fontWeight: '600' }}>● In stock - Ready to ship</span>
                          </div>
                        )}
                        {!priceOk && (
                          <div className='mb-4 sm:mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                            <p className='text-xs sm:text-sm text-amber-800'>
                              Pricing is not available for this item right now.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className='mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                        <p className='text-xs sm:text-sm text-blue-900'>
                          <span style={{ fontWeight: '600' }}>Customizable Product:</span>{' '}
                          Upload your photo and personalize this product in our editor.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className='space-y-2 sm:space-y-3 mt-2'>
                    {p.isArtProduct ? (
                      <>
                        <Button
                          onClick={() => handleAddToCart(p)}
                          disabled={!priceOk}
                          className={`w-full rounded h-[44px] sm:h-[50px] text-sm sm:text-base transition-all ${
                            isAdded
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : !priceOk
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
                          }`}
                          style={{ fontWeight: '700' }}
                        >
                          {isAdded ? (
                            <><Check className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />Added to Cart!</>
                          ) : priceOk ? (
                            <><ShoppingCart className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />Add to Cart — ${p.price.toFixed(2)}</>
                          ) : (
                            'Price Not Available'
                          )}
                        </Button>
                        <button
                          onClick={() => handleProductClick(p.slug || p.id)}
                          className='text-gray-900 text-xs sm:text-sm w-full hover:underline py-1'
                          style={{ fontWeight: '600' }}
                        >
                          View Full Details
                        </button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => navigate(`/product/${p.slug || p.id}`)}
                          className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded h-[44px] sm:h-[50px] text-sm sm:text-base'
                          style={{ fontWeight: '700' }}
                        >
                          <Upload className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                          Upload Your Photo
                        </Button>
                        <button
                          onClick={() => handleProductClick(p.slug || p.id)}
                          className='text-gray-900 text-xs sm:text-sm w-full hover:underline py-1'
                          style={{ fontWeight: '600' }}
                        >
                          View Product Details
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
