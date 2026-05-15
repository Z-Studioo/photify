import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useUpload } from '@/context/UploadContext';
import { getTransformedImageUrl } from '@/lib/supabase/image-url';
import {
  ArrowRight,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface ArtSelection {
  id: string;
  name: string;
  /** The original art image (gallery thumbnail). */
  image: string;
  /** Mockup images uploaded by the admin specifically for this art. */
  mockups?: string[];
  price?: string | number | null;
}

interface ArtPrintProductSelectorModalProps {
  open: boolean;
  art: ArtSelection | null;
  onOpenChange: (open: boolean) => void;
}

const SLIDE_INTERVAL_MS = 1000;

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function ArtPrintProductSelectorModal({
  open,
  art,
  onOpenChange,
}: ArtPrintProductSelectorModalProps) {
  const navigate = useNavigate();
  const { setArtFixedPrice, setArtName, setFile, setPreview } = useUpload();

  const [navigating, setNavigating] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const mockups = art?.mockups ?? [];
  const hasMockups = mockups.length > 0;

  // Display variants — the originals are still uploaded to Supabase Storage
  // untouched; we only request lighter on-the-fly renders for the on-screen
  // preview. The full-resolution `art.image` is preserved separately and used
  // when the customer actually proceeds to the canvas configurer.
  const displayMockups = useMemo(
    () =>
      mockups.map(src =>
        getTransformedImageUrl(src, { width: 1200, quality: 80, resize: 'cover' })
      ),
    [mockups]
  );
  const previewImage = useMemo(
    () =>
      art?.image
        ? getTransformedImageUrl(art.image, { width: 1000, quality: 80 })
        : '',
    [art?.image]
  );
  const blurredBackdrop = useMemo(
    () =>
      art?.image
        ? getTransformedImageUrl(art.image, {
            width: 80,
            quality: 30,
            resize: 'cover',
          })
        : '',
    [art?.image]
  );

  // Reset slide whenever the art changes or the modal re-opens.
  useEffect(() => {
    setSlideIndex(0);
  }, [art?.id, open]);

  // 1-second auto-slideshow when there are 2+ mockups.
  useEffect(() => {
    if (!open || mockups.length < 2) return;
    const timer = window.setInterval(() => {
      setSlideIndex(idx => (idx + 1) % mockups.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [open, mockups.length]);

  const currentMockup = hasMockups
    ? displayMockups[slideIndex % displayMockups.length]
    : null;

  const handleSelectSingleCanvas = async () => {
    if (!art || navigating) return;
    setNavigating(true);

    const rawPrice = String(art.price ?? '0').replace(/[^0-9.]/g, '');
    const fixedPrice = parseFloat(rawPrice) || 0;
    const artNameStr = String(art.name || '').trim();

    setArtFixedPrice(fixedPrice);
    setArtName(artNameStr);

    sessionStorage.setItem('photify_art_image_url', art.image);
    if (fixedPrice > 0)
      sessionStorage.setItem('photify_art_fixed_price', String(fixedPrice));
    if (artNameStr) sessionStorage.setItem('photify_art_name', artNameStr);

    try {
      const response = await fetch(art.image);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      const artFile = new File([blob], `art-${Date.now()}.${ext}`, {
        type: blob.type,
      });
      setFile(artFile);
    } catch {
      setPreview(art.image);
    }

    navigate('/canvas-configurer');
    setNavigating(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='p-0 gap-0 overflow-hidden border-0 rounded-2xl shadow-2xl w-[calc(100%-2rem)] sm:!max-w-[1000px] max-h-[90vh]'
      >
        <div className='grid md:grid-cols-[1.1fr_1fr] max-h-[90vh]'>
          {/* ===== Left: mockup slideshow / art preview ===== */}
          <div className='relative bg-gray-950 min-h-[280px] md:min-h-[600px] overflow-hidden'>
            {hasMockups ? (
              <>
                {/* Crossfading mockup slideshow (full-bleed, since mockups are pre-composed) */}
                <AnimatePresence mode='sync'>
                  <motion.img
                    key={currentMockup}
                    src={currentMockup ?? undefined}
                    alt={art?.name || 'Mockup'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className='absolute inset-0 w-full h-full object-cover'
                    draggable={false}
                  />
                </AnimatePresence>

                {/* Subtle vignette so overlaid text stays readable */}
                <div className='absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none' />

                {/* Slideshow dots (only for 2+ mockups) */}
                {mockups.length > 1 && (
                  <div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1.5'>
                    {mockups.map((_, i) => {
                      const active = i === slideIndex % mockups.length;
                      return (
                        <button
                          key={i}
                          type='button'
                          onClick={() => setSlideIndex(i)}
                          aria-label={`Show mockup ${i + 1}`}
                          className={`h-1.5 rounded-full transition-all ${
                            active
                              ? 'w-5 bg-white'
                              : 'w-1.5 bg-white/50 hover:bg-white/80'
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Fallback: blurred backdrop + framed canvas of the original art.
                    Backdrop uses a tiny render-image variant since it's
                    aggressively blurred; the framed preview uses a moderate
                    variant. The full-res original is reserved for the
                    configurer step (see handleSelectSingleCanvas). */}
                {art?.image && (
                  <>
                    <div
                      className='absolute inset-0 bg-cover bg-center scale-110 opacity-50 blur-2xl'
                      style={{ backgroundImage: `url(${blurredBackdrop})` }}
                      aria-hidden
                    />
                    <div className='absolute inset-0 bg-gradient-to-br from-black/35 via-transparent to-black/55' />

                    <div className='absolute inset-0 flex items-center justify-center p-8'>
                      <motion.div
                        key={art.id}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className='relative'
                        style={{ maxWidth: '70%', maxHeight: '78%' }}
                      >
                        <div
                          className='absolute -inset-2 rounded-sm blur-2xl bg-black/40 pointer-events-none'
                          aria-hidden
                        />
                        <div
                          className='relative bg-white p-1.5 sm:p-2'
                          style={{
                            boxShadow:
                              '0 18px 40px -12px rgba(0,0,0,0.55), 0 6px 12px -4px rgba(0,0,0,0.35)',
                          }}
                        >
                          <img
                            src={previewImage}
                            alt={art.name}
                            loading='lazy'
                            decoding='async'
                            className='block max-w-[55vw] sm:max-w-[420px] max-h-[44vh] sm:max-h-[420px] object-contain'
                            draggable={false}
                          />
                        </div>
                      </motion.div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Floating artwork name (top-left) */}
            {art?.name && (
              <div className='hidden md:block absolute top-4 left-4 max-w-[60%] text-white drop-shadow-lg pointer-events-none'>
                <p className='text-[10px] uppercase tracking-wider text-white/85 mb-0.5'>
                  Selected artwork
                </p>
                <p className="font-['Bricolage_Grotesque',_sans-serif] text-base font-semibold leading-tight truncate">
                  {art.name}
                </p>
              </div>
            )}
          </div>

          {/* ===== Right: print action ===== */}
          <div className='flex flex-col bg-white max-h-[90vh] min-h-[240px]'>
            <div className='flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-gray-100'>
              <div className='min-w-0'>
                <div className='flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#f63a9e] mb-1'>
                  <Sparkles className='w-3 h-3' />
                  Step 1 of 2
                </div>
                <h2 className="font-['Bricolage_Grotesque',_sans-serif] text-xl sm:text-[22px] font-semibold text-gray-900 leading-tight">
                  Print this artwork on canvas
                </h2>
                <p className='text-sm text-gray-500 mt-1'>
                  We'll take you to the canvas configurator with this image
                  ready to go. Pick the size and finish on the next step.
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                aria-label='Close'
                className='flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            <div className='flex-1 overflow-y-auto px-6 py-5'>
              <button
                type='button'
                onClick={handleSelectSingleCanvas}
                disabled={navigating}
                className='group relative w-full text-left rounded-xl border-2 border-gray-100 hover:border-[#f63a9e] bg-gradient-to-br from-pink-50 to-white px-4 py-4 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <div className='flex items-center gap-4'>
                  <div className='flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm bg-[#f63a9e]'>
                    {navigating ? (
                      <Loader2 className='w-5 h-5 animate-spin' />
                    ) : (
                      <ImageIcon className='w-5 h-5' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3 className="font-['Bricolage_Grotesque',_sans-serif] text-base font-semibold text-gray-900">
                      Single canvas print
                    </h3>
                    <p className='text-sm text-gray-600 mt-0.5 leading-snug'>
                      Print this artwork on a single premium canvas in your
                      chosen size and finish.
                    </p>
                  </div>
                  <ArrowRight className='flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-[#f63a9e] group-hover:translate-x-0.5 transition-all' />
                </div>
              </button>
            </div>

            <div className='px-6 py-3 border-t border-gray-100 bg-gray-50/60'>
              <p className='text-[11px] text-gray-500 leading-relaxed'>
                Free UK shipping on orders over £50 · 30-day satisfaction
                guarantee.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
