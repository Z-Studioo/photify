import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Loader2, Lock, X } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import Wall from '@/assets/images/wall.jpg';
import Wall1 from '@/assets/images/wall1.jpg';
import Wall2 from '@/assets/images/wall2.jpg';
import featuresBase from '@/constants/dashboard/index';
import { dashboardTourSteps } from '@/constants/dashboard/tourSteps';
import { useFeature } from '@/context/dashboard/FeatureContext';
import { useUpload } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import { useEdge } from '@/context/EdgeContext';
import { useWallCarousel } from '@/hooks/useWallCarousel';
import TourGuide from '@/components/shared/dashboard/TourGuide';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navbar from '@/components/shared/dashboard/Navbar';
import FeaturePanel from '@/components/shared/dashboard/FeaturePanel';
import ThreeDCanvas from '@/components/shared/dashboard/ThreeDCanvas';
// import RoomFrame3D from '@/components/shared/dashboard/RoomFrame3D';
import ImageCropper from '@/components/shared/common/ImageCropper';
import OptimizationView from '@/components/shared/dashboard/OptimizationView';
// import WallCarousel from '@/components/shared/dashboard/WallCarousel';
import ViewControls from '@/components/shared/dashboard/ViewControls';
import QuantityControl from '@/components/shared/dashboard/QuantityControl';
import ApplyChangesControl from '@/components/shared/dashboard/ApplyChangesControl';
import { Room3DView } from '@/components/shared/dashboard/Room3DView';
import { resolveCanvasSizePrice } from '@/lib/canvas-size-price';
import { useProductCanvasPricingProduct } from '@/hooks/use-product-canvas-pricing';
import { cn } from '@/lib/utils';
import { buildMeta } from '@/lib/seo';
import { track } from '@/lib/analytics';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Canvas Configurer | Photify',
    description: 'Configure your custom photo canvas on Photify.',
    path: '/canvas-configurer',
    noindex: true,
  });

/** Sentence-case labels for the main feature list (constants stay ALL CAPS for logic). */
const FEATURE_LIST_LABEL: Record<string, string> = {
  'SELECT PHOTO': 'Photo and crop',
  'IMAGE SIZE AND CROP PHOTO': 'Canvas size',
  'SIDE APPEARANCE': 'Side appearance',
  'IMAGE OPTIMIZATION': 'Image optimization',
  'ROUND FORMATS AND SHAPES': 'Round formats & shapes',
  CORNERS: 'Corners',
  MULTIPANEL: 'Multipanel',
};

interface MenuFeature {
  id: number;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  subtitle: string;
  step: number;
  component: string | null;
}

const Dashboard: React.FC = () => {
  const wallImageInputRef = useRef<HTMLInputElement>(null);
  const { selectedFeature, setSelectedFeature } = useFeature();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isApplyingEditView, setIsApplyingEditView] = useState(false);

  useEffect(() => {
    const defaultFeature = featuresBase.find(
      feature => feature.name === 'IMAGE SIZE AND CROP PHOTO'
    );
    if (defaultFeature) {
      setSelectedFeature(defaultFeature);
    }

    // GA4 customizer_start — fires once when the canvas configurer
    // mounts. We default to single_canvas here since this dashboard is
    // the entry point for the single-canvas flow; the dedicated
    // multi-canvas / event / collage pages emit their own product_type.
    try {
      track({
        name: 'customizer_start',
        params: { product_type: 'single_canvas' },
      });
    } catch {
      /* swallow */
    }
  }, [setSelectedFeature]);

  const handleConfirmAndApply = async () => {
    setIsConfirming(true);
    try {
      applyPendingChanges();
      applyPendingEdgeType();

      if (selectedView === 'crop' || selectedView === 'optimization') {
        setSelectedView('3droom');
      }
      setSelectedFeature(null);
    } catch (error) {
      console.error('Failed to confirm changes:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const {
    // currentWallIndex,
    // slideDirection,
    // wallImages,
    // handlePreviousWall: handlePrevWall,
    // handleNextWall: handleNext,
    // handleSelectIndex,
    addCustomWall,
  } = useWallCarousel({ defaultWalls: [Wall, Wall1, Wall2] });

  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  const listItemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    }),
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  const {
    quantity,
    shape,
    setFile,
    setPreview,
    applyPendingChanges,
    cancelPendingCropChanges,
    setPendingFile,
    setPendingPreview,
    selectedRatio,
    selectedSize,
    quality,
    selectedProduct,
  } = useUpload();

  const pricingProduct = useProductCanvasPricingProduct(selectedProduct);

  const { selectedView, setSelectedView } = useView();
  const { edgeType, applyPendingEdgeType, cancelPendingEdgeType } = useEdge();
  const [pricePerItem, setPricePerItem] = useState<number>(0);

  useEffect(() => {
    if (!pricingProduct || !selectedSize) {
      setPricePerItem(0);
      return;
    }
    setPricePerItem(
      resolveCanvasSizePrice(selectedSize, pricingProduct) ?? 0
    );
  }, [pricingProduct, selectedSize]);

  const features = featuresBase.map(feature => {
    if (feature.name === 'ROUND FORMATS AND SHAPES') {
      return {
        ...feature,
        subtitle: shape.charAt(0).toUpperCase() + shape.slice(1),
      };
    }
    if (feature.name === 'IMAGE SIZE AND CROP PHOTO') {
      return {
        ...feature,
        subtitle: selectedSize
          ? `${selectedSize.width_in}" × ${selectedSize.height_in}" (${selectedRatio})`
          : '24 by 16 (External: 24 by 16)',
      };
    }
    if (feature.name === 'IMAGE OPTIMIZATION') {
      return {
        ...feature,
        subtitle: `${quality[0]}%`,
      };
    }
    if (feature.name === 'SIDE APPEARANCE') {
      return {
        ...feature,
        subtitle: edgeType === 'wrapped' ? 'Wrapped edges' : 'Mirrored edges',
      };
    }
    return feature;
  });

  const handleFeatureClick = (item: MenuFeature) => {
    setSelectedFeature(selectedFeature?.id === item.id ? null : item);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const newPreview = URL.createObjectURL(f);
      setFile(f);
      setPreview(newPreview);
    }
  };

  const handleWallImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const imageUrl = URL.createObjectURL(f);
      addCustomWall(imageUrl);
    }
  };

  const handleAddImageClick = () => {
    wallImageInputRef.current?.click();
  };

  const isEditingView =
    selectedView === 'crop' || selectedView === 'optimization';

  const handleDoneEditingView = async () => {
    setIsApplyingEditView(true);
    try {
      await applyPendingChanges();
      applyPendingEdgeType();
      setSelectedView('3droom');
      // Intentionally keep `selectedFeature` set: after applying a crop the
      // user should return to the feature panel they came from (e.g. Canvas
      // size) so they can continue adjusting, rather than being kicked back
      // to the top-level feature list.
    } finally {
      setIsApplyingEditView(false);
    }
  };

  const handleCancelEditingView = () => {
    if (selectedView === 'crop') {
      cancelPendingCropChanges();
      setPendingFile(null);
      setPendingPreview(null);
    }
    cancelPendingEdgeType();
    setSelectedView('3droom');
    // Same reasoning as above: stay on the feature panel so cancelling a
    // crop doesn't also close Canvas size.
  };

  return (
    <div className='h-[calc(var(--vh,1vh)*100)] flex flex-col overflow-hidden'>
      <Navbar immersive />
      <div className='flex min-h-0 flex-1 w-full flex-col gap-0 overflow-hidden md:flex-row-reverse'>
        <div
          className={`
    relative 
    flex min-h-0 flex-col
    overflow-hidden 
    w-full 
    ${isEditingView ? 'min-h-0 flex-1 md:h-full' : 'h-96 md:h-full'} 
   md:w-[58%] lg:w-[64%] xl:w-[70%]
  `}
        >
          {selectedView === 'crop' && (
            <div className='flex min-h-0 flex-1 flex-col'>
              <ImageCropper isVisible={true} />
            </div>
          )}
          {selectedView === 'optimization' && (
            <OptimizationView isVisible={true} />
          )}
          {!isEditingView && (
            <>
              {/* Room View (2D wall carousel) temporarily hidden
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  selectedView === 'room'
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <WallCarousel
                  images={wallImages}
                  currentIndex={currentWallIndex}
                  slideDirection={slideDirection}
                  onPrevious={handlePrevWall}
                  onNext={handleNext}
                  onSelectIndex={handleSelectIndex}
                />
                <div
                  className='
                  absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[280px] h-[210px] md:w-80 md:h-60
                '
                >
                  <RoomFrame3D onInteraction={() => setSelectedView('3d')} />
                </div>
              </div>
              */}

              <div
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  selectedView === '3d'
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-110 pointer-events-none'
                }`}
              >
                <div
                  className='
                  w-full h-full 
                  flex items-center justify-center
                   md:p-0
                '
                >
                  <div className='w-full h-full'>
                    <ThreeDCanvas
                      isVisible={selectedView === '3d'}
                      focusOnEdge={selectedFeature?.name === 'SIDE APPEARANCE'}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  selectedView === '3droom'
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-110 pointer-events-none'
                }`}
              >
                <Room3DView isVisible={selectedView === '3droom'} />
              </div>

              <ViewControls
                selectedView={selectedView}
                onViewChange={view => {
                  setSelectedView(view);
                  setSelectedFeature(null);
                }}
                onAddImage={handleAddImageClick}
              />
            </>
          )}
        </div>

        {(!isEditingView || window.innerWidth >= 768) && (
          <div className='flex h-full w-full flex-col overflow-hidden border-l border-zinc-200/80 bg-zinc-50/90 md:h-full md:w-[42%] lg:w-[36%] xl:w-[30%]'>
            <AnimatePresence mode='wait'>
              {!selectedFeature && (
                <motion.div
                  key='header'
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: -10,
                    height: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className='w-full flex-shrink-0 border-b border-zinc-100 bg-white/90 px-4 pb-4 pt-5 sm:px-5'
                >
                  <div className='min-w-0'>
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      className='truncate text-lg font-semibold leading-snug tracking-tight text-zinc-900'
                    >
                      Single Frame Stretched Canvas
                    </motion.h2>
                    <p className='mt-1.5 text-xs leading-relaxed text-zinc-500'>
                      Choose each step to configure your print.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className='w-full flex-shrink-0 border-b border-zinc-100'
              animate={{
                opacity: selectedFeature ? 0 : 1,
                height: selectedFeature ? 0 : 'auto',
              }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />

            <div className='flex-1 min-h-0 overflow-hidden'>
              <motion.div
                className='relative md:overflow-hidden h-full'
                layout
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className='md:absolute md:inset-0 flex flex-col h-full'
                  animate={{ x: selectedFeature ? '-100%' : '0%' }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className='flex-1 min-h-0 overflow-hidden'>
                    <ScrollArea className='h-full'>
                      <motion.div
                        className='space-y-2 p-3 sm:p-4'
                        initial='hidden'
                        animate='visible'
                        variants={{
                          visible: {
                            transition: {
                              staggerChildren: 0.04,
                            },
                          },
                        }}
                      >
                        {features.map((item, index) => {
                          const label =
                            FEATURE_LIST_LABEL[item.name] ?? item.name;
                          const isActive = selectedFeature?.id === item.id;
                          return (
                            <motion.div
                              key={item.id}
                              custom={index}
                              variants={listItemVariants}
                            >
                              <motion.button
                                type='button'
                                disabled={item.disabled}
                                onClick={() =>
                                  !item.disabled && handleFeatureClick(item)
                                }
                                className={cn(
                                  'group relative flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors md:px-3.5 md:py-3.5',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2',
                                  item.disabled &&
                                    'cursor-not-allowed border-zinc-100/90 bg-zinc-100/40 opacity-[0.72]',
                                  !item.disabled &&
                                    !isActive &&
                                    'border-zinc-100 bg-white shadow-sm hover:border-zinc-200 hover:bg-white',
                                  !item.disabled &&
                                    isActive &&
                                    'border-primary/40 bg-primary/[0.07] shadow-sm ring-1 ring-primary/15'
                                )}
                                whileTap={
                                  item.disabled
                                    ? undefined
                                    : { scale: 0.992 }
                                }
                              >
                                <div
                                  className={cn(
                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                                    item.disabled && 'bg-zinc-100/80 text-zinc-300',
                                    !item.disabled &&
                                      'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200/80',
                                    !item.disabled &&
                                      isActive &&
                                      'bg-primary/15 text-primary'
                                  )}
                                >
                                  <item.icon className='h-[1.125rem] w-[1.125rem]' />
                                </div>
                                <div className='min-w-0 flex-1'>
                                  <div className='flex flex-wrap items-center gap-2'>
                                    <p
                                      className={cn(
                                        'text-sm font-medium leading-snug',
                                        item.disabled && 'text-zinc-400',
                                        !item.disabled &&
                                          !isActive &&
                                          'text-zinc-900',
                                        !item.disabled &&
                                          isActive &&
                                          'text-primary'
                                      )}
                                    >
                                      {label}
                                    </p>
                                    {item.disabled && (
                                      <span className='inline-flex items-center rounded-full border border-amber-200/90 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800'>
                                        Soon
                                      </span>
                                    )}
                                  </div>
                                  <p
                                    className={cn(
                                      'mt-0.5 text-xs leading-relaxed',
                                      item.disabled
                                        ? 'text-zinc-400'
                                        : 'text-zinc-500'
                                    )}
                                  >
                                    {item.subtitle}
                                  </p>
                                </div>
                                {!item.disabled ? (
                                  <ChevronRight
                                    className={cn(
                                      'h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-primary',
                                      isActive && 'text-primary'
                                    )}
                                  />
                                ) : (
                                  <Lock
                                    className='h-4 w-4 shrink-0 text-zinc-300'
                                    aria-hidden
                                  />
                                )}
                              </motion.button>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </ScrollArea>
                  </div>
                </motion.div>

                <FeaturePanel />
              </motion.div>
            </div>

            <div className='h-px w-full flex-shrink-0 bg-zinc-100' />

            <motion.div
              className='flex-shrink-0 border-t border-zinc-200/80 bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2 shadow-[0_-4px_20px_rgba(15,23,42,0.05)] sm:px-4 sm:pb-3 sm:pt-2.5 md:border-t-0 md:p-3 md:shadow-none'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <AnimatePresence mode='wait'>
                {isEditingView ? (
                  <motion.div
                    key='editing-view-footer'
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.2 }}
                    className='flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4'
                  >
                    <p className='text-[11px] leading-snug text-zinc-500 sm:text-sm sm:text-zinc-600'>
                      {selectedView === 'crop'
                        ? 'Save your crop to update the print preview. This does not place an order.'
                        : 'Save your enhancement settings to return to the room view.'}
                    </p>
                    <div className='flex shrink-0 items-center gap-2 sm:gap-3'>
                      <Button
                        type='button'
                        variant='outline'
                        disabled={isApplyingEditView}
                        className='h-9 shrink-0 rounded-lg px-3 text-xs font-semibold sm:h-11 sm:rounded-xl sm:px-5 sm:text-sm'
                        onClick={handleCancelEditingView}
                      >
                        Cancel
                      </Button>
                      <Button
                        type='button'
                        variant='default'
                        disabled={isApplyingEditView}
                        className='h-9 shrink-0 rounded-lg px-4 text-xs font-semibold shadow-sm sm:h-11 sm:min-w-[10rem] sm:rounded-xl sm:px-6 sm:text-sm'
                        onClick={() => void handleDoneEditingView()}
                      >
                        {isApplyingEditView ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Saving…
                          </>
                        ) : selectedView === 'crop' ? (
                          'Apply crop'
                        ) : (
                          'Save enhancement'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ) : !selectedFeature ? (
                  <QuantityControl
                    onConfirm={handleConfirmAndApply}
                    isConfirming={isConfirming}
                  />
                ) : (
                  <ApplyChangesControl
                    pricePerItem={pricePerItem}
                    quantity={quantity}
                    selectedSize={{
                      actual_price: pricePerItem,
                      sell_price: pricePerItem,
                    }}
                    onApply={() => {
                      void applyPendingChanges();
                      applyPendingEdgeType();
                      setSelectedFeature(null);
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {isEditingView && window.innerWidth < 768 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className='fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/80 bg-white px-3 py-2'
            style={{
              bottom: 'env(safe-area-inset-bottom, 0px)',
              paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div className='flex items-center justify-between gap-2'>
              <motion.div
                className='flex min-w-0 flex-col'
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <motion.span
                  className='text-base font-semibold tabular-nums sm:text-lg'
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  £{(pricePerItem * quantity).toFixed(2)}
                </motion.span>
                {selectedSize &&
                  +(selectedProduct?.oldPrice || 0) > pricePerItem && (
                    <motion.div
                      className='text-sm'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className='line-through text-gray-500'>
                        £{(pricePerItem * quantity).toFixed(2)}
                      </span>
                      <span className='ml-2 text-green-600 font-medium'>
                        {Math.round(
                          ((+(selectedProduct?.oldPrice || 0) - pricePerItem) /
                            +(selectedProduct?.oldPrice || 0)) *
                            100
                        )}
                        % OFF
                      </span>
                    </motion.div>
                  )}
              </motion.div>
              <motion.div
                className='flex items-center gap-2'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Button
                  variant='outline'
                  size='icon'
                  className='h-9 w-9 shrink-0 rounded-lg sm:h-11 sm:w-11 sm:rounded-xl'
                  disabled={isApplyingEditView}
                  onClick={handleCancelEditingView}
                  aria-label='Cancel'
                >
                  <X className='h-4 w-4' />
                </Button>
                <Button
                  variant='default'
                  className='h-9 shrink-0 whitespace-nowrap rounded-lg px-4 text-xs font-semibold transition-all duration-200 sm:h-11 sm:rounded-xl sm:px-5 sm:text-sm'
                  disabled={isApplyingEditView}
                  onClick={() => void handleDoneEditingView()}
                >
                  {isApplyingEditView ? (
                    <>
                      <Loader2 className='mr-2 inline h-4 w-4 animate-spin' />
                      Saving…
                    </>
                  ) : selectedView === 'crop' ? (
                    'Apply crop'
                  ) : (
                    'Save enhancement'
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      <input
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleFileChange}
      />
      <input
        ref={wallImageInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleWallImageUpload}
      />

      <TourGuide steps={dashboardTourSteps} />
    </div>
  );
};

export default Dashboard;
