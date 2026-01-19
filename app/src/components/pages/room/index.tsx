import { useState, useEffect } from 'react';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import {
  ShoppingCart,
  Plus,
  Info,
  ArrowLeft,
  Loader2,
  Upload,
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

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      // size: '16" × 20"', // Not part of CartItem type
      // frame: "Black Wood", // Not part of CartItem type
    });
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

  return (
    <div className="min-h-screen bg-white font-['Mona_Sans',_sans-serif]">
      <Header />

      {/* Page Title Bar */}
      <div className='bg-gray-50 border-b border-gray-200'>
        <div className='max-w-[1400px] mx-auto px-6 py-8'>
          <Button
            onClick={() => navigate('/')}
            variant='ghost'
            className='mb-6 -ml-3 h-auto px-3 py-2 hover:bg-gray-100 rounded-lg'
            style={{ fontWeight: '600' }}
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Home
          </Button>

          <div className='flex items-end justify-between'>
            <div>
              <div className='flex items-center gap-3 mb-3'>
                <span className='text-sm text-gray-500'>Room Inspiration</span>
                <span className='text-gray-300'>•</span>
                <span
                  className='text-sm text-gray-900'
                  style={{ fontWeight: '600' }}
                >
                  {displayRoom.hotspots.length} products
                </span>
              </div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                style={{ fontWeight: '700', fontSize: '36px' }}
              >
                {displayRoom.name}
              </h1>
              <p className='text-gray-600 mt-2 max-w-2xl'>
                {displayRoom.description}
              </p>
            </div>

            <div className='hidden md:block text-right'>
              <p className='text-sm text-gray-500 mb-1'>Complete look</p>
              <p
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                style={{ fontWeight: '700', fontSize: '24px' }}
              >
                $
                {displayRoom.hotspots
                  .reduce((sum, h) => sum + h.product.price, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-[1400px] mx-auto px-6 py-8'>
        <div className='grid grid-cols-12 gap-8'>
          {/* Room Image with Hotspots */}
          <div className='col-span-8'>
            <div className='sticky top-6'>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className='relative rounded-3xl overflow-hidden shadow-2xl bg-gray-100'
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
                    {/* Hotspot Pulse Animation */}
                    <div className='relative'>
                      <div className='absolute inset-0 bg-[#f63a9e] rounded-full opacity-40 animate-ping' />
                      <div className='relative w-12 h-12 bg-white rounded-full border-4 border-[#f63a9e] flex items-center justify-center shadow-xl group-hover:bg-[#f63a9e] transition-all'>
                        <Plus className='w-6 h-6 text-[#f63a9e] group-hover:text-white transition-colors' />
                      </div>
                    </div>

                    {/* Hotspot Label on Hover */}
                    <AnimatePresence>
                      {hoveredHotspot === hotspot.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className='absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap'
                        >
                          <div
                            className='bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-xl'
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
                className='mt-6 bg-gradient-to-r from-[#FFF5FB] to-purple-50/30 rounded-2xl p-6 border-2 border-[#f63a9e]/20'
              >
                <div className='flex items-start gap-4'>
                  <div className='w-10 h-10 rounded-full bg-[#f63a9e]/10 flex items-center justify-center flex-shrink-0'>
                    <Info className='w-5 h-5 text-[#f63a9e]' />
                  </div>
                  <div>
                    <h3
                      className='text-gray-900 mb-1'
                      style={{ fontWeight: '700' }}
                    >
                      Shop This Room
                    </h3>
                    <p className='text-gray-600 text-sm'>
                      Click on the{' '}
                      <Plus className='w-4 h-4 inline text-[#f63a9e]' /> icons
                      to explore products featured in this room. Each piece has
                      been carefully selected to create a cohesive look.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Product List Sidebar */}
          <div className='col-span-4'>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className='sticky top-6'
            >
              <div className='bg-gray-50 rounded-3xl p-8 border-2 border-gray-100'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-6"
                  style={{
                    fontWeight: '700',
                    fontSize: '20px',
                  }}
                >
                  Products in This Room
                </h2>

                <div className='space-y-4'>
                  {displayRoom.hotspots.map((hotspot, index) => (
                    <motion.div
                      key={hotspot.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.6 + index * 0.1,
                      }}
                      className='bg-white rounded-2xl p-4 border-2 border-gray-100 hover:border-[#f63a9e]/30 transition-all group cursor-pointer'
                      onClick={() => setSelectedHotspot(hotspot)}
                    >
                      <div className='flex gap-4'>
                        <div className='w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0'>
                          <ImageWithFallback
                            src={hotspot.product.image}
                            alt={hotspot.product.name}
                            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3
                            className='text-gray-900 mb-1 truncate'
                            style={{ fontWeight: '600' }}
                          >
                            {hotspot.product.name}
                          </h3>
                          <p className='text-gray-500 text-xs mb-2'>
                            {hotspot.product.category}
                          </p>
                          <p
                            className='text-[#f63a9e]'
                            style={{
                              fontWeight: '700',
                              fontSize: '16px',
                            }}
                          >
                            ${hotspot.product.price}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={e => {
                          e.stopPropagation();
                          if (hotspot.product.isArtProduct) {
                            handleAddToCart(hotspot.product);
                          } else {
                            navigate(
                              `/product/${hotspot.product.slug || hotspot.product.id}`
                            );
                          }
                        }}
                        className='w-full mt-3 bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[45px]'
                        style={{ fontWeight: '700' }}
                      >
                        {hotspot.product.isArtProduct ? (
                          <>
                            <ShoppingCart className='w-4 h-4 mr-2' />
                            Add to Cart
                          </>
                        ) : (
                          <>
                            <Upload className='w-4 h-4 mr-2' />
                            Upload Your Photo
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {/* Room Total */}
                <div className='mt-8 pt-6 border-t-2 border-gray-200'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-gray-600'>Total for this room:</span>
                    <span
                      className='text-gray-900'
                      style={{
                        fontWeight: '700',
                        fontSize: '20px',
                      }}
                    >
                      $
                      {displayRoom.hotspots
                        .reduce((sum, h) => sum + h.product.price, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      displayRoom.hotspots.forEach(h =>
                        handleAddToCart(h.product)
                      );
                    }}
                    variant='outline'
                    className='w-full border-2 border-gray-300 hover:border-[#f63a9e] hover:bg-[#FFF5FB] rounded-xl h-[50px] mt-4'
                    style={{ fontWeight: '700' }}
                  >
                    <ShoppingCart className='w-5 h-5 mr-2' />
                    Add All to Cart
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Other Rooms Section */}
        <div className='mt-16'>
          <h2
            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-6"
            style={{ fontWeight: '700', fontSize: '24px' }}
          >
            Explore More Rooms
          </h2>
          <div className='grid grid-cols-3 gap-6'>
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
                  <div className='relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-lg'>
                    <ImageWithFallback
                      src={room.image}
                      alt={room.name}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6'>
                      <div>
                        <h3
                          className='text-white mb-1'
                          style={{
                            fontWeight: '700',
                            fontSize: '18px',
                          }}
                        >
                          {room.name}
                        </h3>
                        <p className='text-white/80 text-sm'>
                          {room.hotspots.length} products
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
        <DialogContent className='max-w-2xl p-0 overflow-hidden'>
          <DialogTitle className='sr-only'>
            {selectedHotspot?.product.name}
          </DialogTitle>
          {selectedHotspot && (
            <div className='grid grid-cols-2 gap-0'>
              {/* Product Image */}
              <div className='bg-gray-50'>
                <ImageWithFallback
                  src={selectedHotspot.product.image}
                  alt={selectedHotspot.product.name}
                  className='w-full h-full object-cover'
                />
              </div>

              {/* Product Details */}
              <div className='p-8 flex flex-col'>
                <div className='flex-1'>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                    style={{
                      fontWeight: '700',
                      fontSize: '24px',
                    }}
                  >
                    {selectedHotspot.product.name}
                  </h2>

                  <div className='flex items-baseline gap-2 mb-4'>
                    <p
                      className='text-gray-900'
                      style={{
                        fontWeight: '700',
                        fontSize: '28px',
                      }}
                    >
                      £{selectedHotspot.product.price.toFixed(2)}
                    </p>
                    {selectedHotspot.product.sizeName && (
                      <span className='text-gray-500 text-sm'>
                        {selectedHotspot.product.sizeName}
                      </span>
                    )}
                  </div>

                  <p className='text-gray-600 mb-6 text-sm leading-relaxed'>
                    {selectedHotspot.product.isArtProduct
                      ? `Premium art print available in ${selectedHotspot.product.sizeName}. Museum-quality printing.`
                      : 'Create your own custom product with your photos. Choose size, style, and more in our editor.'}
                  </p>

                  {selectedHotspot.product.isArtProduct ? (
                    <>
                      {/* Size Display (Fixed) */}
                      <div className='mb-4'>
                        <label
                          className='text-sm text-gray-900 mb-2 block'
                          style={{ fontWeight: '600' }}
                        >
                          Size
                        </label>
                        <div className='px-4 py-3 border-2 border-[#f63a9e] bg-pink-50 rounded text-sm text-gray-900'>
                          <span style={{ fontWeight: '600' }}>
                            {selectedHotspot.product.sizeName}
                          </span>
                        </div>
                      </div>

                      {/* Stock Status */}
                      <div className='mb-6 flex items-center gap-2 text-sm text-green-700'>
                        <span style={{ fontWeight: '600' }}>
                          ● In stock - Ready to ship
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                      <p className='text-sm text-blue-900'>
                        <span style={{ fontWeight: '600' }}>
                          Customizable Product:
                        </span>{' '}
                        Upload your photo and personalize this product in our
                        editor.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className='space-y-3'>
                  {selectedHotspot.product.isArtProduct ? (
                    <>
                      <Button
                        onClick={() => handleAddToCart(selectedHotspot.product)}
                        className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded h-[50px]'
                        style={{ fontWeight: '700' }}
                      >
                        <ShoppingCart className='w-5 h-5 mr-2' />
                        Add to Cart - £
                        {selectedHotspot.product.price.toFixed(2)}
                      </Button>
                      <button
                        onClick={() =>
                          handleProductClick(
                            selectedHotspot.product.slug ||
                              selectedHotspot.product.id
                          )
                        }
                        className='text-gray-900 text-sm w-full hover:underline'
                        style={{ fontWeight: '600' }}
                      >
                        View Full Details
                      </button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() =>
                          navigate(
                            `/product/${selectedHotspot.product.slug || selectedHotspot.product.id}`
                          )
                        }
                        className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded h-[50px]'
                        style={{ fontWeight: '700' }}
                      >
                        <Upload className='w-5 h-5 mr-2' />
                        Upload Your Photo
                      </Button>
                      <button
                        onClick={() =>
                          handleProductClick(
                            selectedHotspot.product.slug ||
                              selectedHotspot.product.id
                          )
                        }
                        className='text-gray-900 text-sm w-full hover:underline'
                        style={{ fontWeight: '600' }}
                      >
                        View Product Details
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
