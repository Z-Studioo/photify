import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { ArtPrintProductSelectorModal } from '@/components/shared/art-print-product-selector-modal';
import {
  buildImageSrcSet,
  getTransformedImageUrl,
} from '@/lib/supabase/image-url';
import { ArrowUpRight, Heart } from 'lucide-react';

// Tile widths in CSS pixels at various breakpoints (matches the masonry
// `columns-{2,3,4,5}` layout in the gallery — keep in sync with the parent).
// We request 2 variants per tile so retina screens still get a crisp image
// without forcing every visitor to download the multi-MB original.
const TILE_THUMBNAIL_WIDTHS = [400, 800];
const TILE_SIZES_ATTR =
  '(min-width: 1280px) 280px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';

export interface ArtPhotoTileProps {
  id: string;
  /** Slug is accepted for backward compatibility but no longer used for navigation. */
  slug?: string;
  name: string;
  image?: string;
  images?: string[];
  category?: string;
  /** Optional fixed art fee (e.g. "£12.00"). Defaults to no extra fee. */
  price?: string | number | null;
  isBestSeller?: boolean;
  index?: number;
}

/**
 * Photo-first tile in the spirit of Pixabay's gallery.
 *
 * Clicking opens a "How would you like to print this?" modal where the user
 * picks a product type (single canvas, event canvas, etc.) — the artwork is
 * then preloaded into that customizer flow. There is no longer a dedicated
 * /art/:id detail page.
 */
export function ArtPhotoTile({
  id,
  // slug intentionally unused — kept for prop compatibility with existing callers.
  slug: _slug,
  name,
  image,
  images = [],
  category,
  price,
  isBestSeller: _isBestSeller = false,
  index = 0,
}: ArtPhotoTileProps) {
  const [showSelector, setShowSelector] = useState(false);

  const primaryImage =
    (Array.isArray(images) && images.length > 0 ? images[0] : null) ||
    image ||
    '/assets/placeholder.png';

  // Mockups are stored as `images.slice(1)` — index 0 is the original art.
  // Originals are kept untouched; we only resize for the *display* layer.
  const mockups =
    Array.isArray(images) && images.length > 1 ? images.slice(1) : [];

  const thumbnailSrc = getTransformedImageUrl(primaryImage, {
    width: 600,
    quality: 75,
  });
  const thumbnailSrcSet = buildImageSrcSet(
    primaryImage,
    TILE_THUMBNAIL_WIDTHS,
    { quality: 75 }
  );

  return (
    <>
      <motion.button
        type='button'
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
        onClick={() => setShowSelector(true)}
        aria-label={`Print ${name}`}
        className='group relative block w-full overflow-hidden bg-gray-100 mb-3 sm:mb-4 break-inside-avoid cursor-pointer text-left border-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f63a9e] focus-visible:ring-offset-2'
      >
        {/* Image dictates the tile height — no cropping, full photo visible.
            We serve a Supabase render-image variant (~600w base, srcset for
            retina) instead of the multi-MB original the admin uploaded. */}
        <ImageWithFallback
          src={thumbnailSrc}
          srcSet={thumbnailSrcSet}
          sizes={TILE_SIZES_ATTR}
          alt={name}
          className='block w-full h-auto transition-transform duration-700 ease-out group-hover:scale-[1.04]'
        />

        {/* Quick-favorite (decorative; no behavior change) */}
        <span
          aria-hidden='true'
          className='absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/0 group-hover:bg-white/95 backdrop-blur-sm flex items-center justify-center text-white/0 group-hover:text-gray-700 transition-all duration-300 shadow-sm'
        >
          <Heart className='w-4 h-4' />
        </span>

        {/* Bottom info gradient + content (revealed on hover) */}
        <div className='absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300'>
          <div className='flex items-end justify-between gap-3'>
            <div className='min-w-0 text-white'>
              {category && (
                <p className='text-[10px] sm:text-[11px] uppercase tracking-wider text-white/80 mb-0.5'>
                  {category}
                </p>
              )}
              <p className="font-['Bricolage_Grotesque',_sans-serif] text-sm sm:text-base font-semibold leading-tight line-clamp-2">
                {name}
              </p>
            </div>
            <span className='flex-shrink-0 w-9 h-9 rounded-full bg-[#f63a9e] flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110'>
              <ArrowUpRight className='w-4 h-4' />
            </span>
          </div>
        </div>
      </motion.button>

      <ArtPrintProductSelectorModal
        open={showSelector}
        onOpenChange={setShowSelector}
        art={
          showSelector
            ? {
                id,
                name,
                image: primaryImage,
                mockups,
                price: price ?? null,
              }
            : null
        }
      />
    </>
  );
}
