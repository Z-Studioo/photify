import { Link } from 'react-router-dom';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { ArrowRight } from 'lucide-react';

interface RoomInspirationProps {
  image: string;
  title: string;
  roomId: string;
  productCount?: number;
  isActive?: boolean;
}

export function RoomInspiration({ image, title, roomId, productCount = 0, isActive = false }: RoomInspirationProps) {
  return (
    <Link 
      to={`/room/${roomId}`}
      className={`group cursor-pointer relative overflow-hidden rounded-lg aspect-[2/1] ${isActive ? 'ring-4 ring-[#f63a9e]' : ''} hover:shadow-xl transition-all block`}
    >
      <ImageWithFallback
        src={image}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-center p-4 group-hover:from-black/80 transition-all">
        <h3 className="font-['Bricolage_Grotesque',_sans-serif] text-white text-center mb-2" style={{ fontWeight: '600', fontSize: '18px' }}>
          {title}
        </h3>
        {productCount > 0 && (
          <p className="text-white/80 text-sm mb-3">{productCount} products</p>
        )}
        <div className="flex items-center gap-2 text-white/90 group-hover:text-white transition-colors text-sm" style={{ fontWeight: '600' }}>
          <span>Shop this room</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
