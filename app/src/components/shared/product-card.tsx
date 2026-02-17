'use client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { Ruler } from 'lucide-react';

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  size?: string | null;
  isFeatured?: boolean;
  index?: number;
  className?: string;
}

export function ProductCard({
  id,
  name,
  slug,
  images,
  price,
  size,
  isFeatured = false,
  index = 0,
  className = '',
}: ProductCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/product/${slug || id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
      className={`group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 ${className}`}
      onClick={handleClick}
    >
      <div className='relative'>
        {/* Best Seller Badge */}
        {isFeatured && (
          <div className='absolute top-3 left-3 z-10'>
            <div className='px-3 py-1.5 bg-gradient-to-r from-[#f63a9e] to-[#e02d8d] text-white rounded-full text-xs font-bold shadow-lg'>
              ⭐ BEST SELLER
            </div>
          </div>
        )}

        {/* Product Image */}
        <div className='relative aspect-square overflow-hidden bg-gray-100'>
          <ImageWithFallback
            src={
              images && images.length > 0
                ? images[0]
                : '/assets/placeholder.png'
            }
            alt={name}
            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
          />

          {/* Overlay on hover */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4'>
            <span className='text-white text-sm font-medium'>
              View Details →
            </span>
          </div>
        </div>

        {/* Carousel Dots */}
        {images && images.length > 1 && (
          <div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10'>
            {images.slice(0, 5).map((_, idx) => (
              <div
                key={idx}
                className='w-1.5 h-1.5 rounded-full bg-white/80 shadow-sm'
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className='p-4'>
        <h3
          className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2 line-clamp-2 group-hover:text-[#f63a9e] transition-colors"
          style={{ fontSize: '18px', lineHeight: '1.3', fontWeight: '600' }}
        >
          {name}
        </h3>

        {size && (
          <div className='flex items-center gap-2 text-gray-500 text-sm mb-3'>
            <Ruler className='w-4 h-4' />
            <span>{size}</span>
          </div>
        )}

        <div className={`flex items-center justify-between`}>
          <div className='flex flex-col'>
            <span className='text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1'>
              Starting At
            </span>

            <div className='flex items-start'>
              {/* Price */}
              <div className='flex items-start text-[#f63a9e]'>
                <span className='font-bold text-lg mt-2 mr-0.5'>£</span>

                <span className='font-extrabold text-4xl tracking-tighter leading-none font-bricolage'>
                  {typeof price === 'number' ? Math.floor(price) : price}
                </span>

                <span className='font-bold text-xl mt-2'>
                  .
                  {typeof price === 'number'
                    ? price.toFixed(2).split('.')[1]
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
          <div className='w-10 h-10 bg-[#f63a9e] text-white rounded-full flex items-center justify-center hover:bg-[#e02d8d] transition-colors shadow-md'>
            <span className='text-lg font-bold'>→</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
