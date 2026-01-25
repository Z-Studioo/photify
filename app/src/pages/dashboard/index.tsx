import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChevronRight, RefreshCw, Package } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { useMutation } from '@tanstack/react-query';
import Wall from '@/assets/images/wall.jpg';
import Wall1 from '@/assets/images/wall1.jpg';
import Wall2 from '@/assets/images/wall2.jpg';
import featuresBase from '@/constants/dashboard/index';
import { dashboardTourSteps } from '@/constants/dashboard/tourSteps';
import { useFeature } from '@/context/dashboard/FeatureContext';
import { useUpload } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import { useEdge } from '@/context/EdgeContext';
import { useGlobalReset } from '@/hooks/useGlobalReset';
import { useWallCarousel } from '@/hooks/useWallCarousel';
import TourGuide from '@/components/shared/dashboard/TourGuide';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navbar from '@/components/shared/dashboard/Navbar';
import FeaturePanel from '@/components/shared/dashboard/FeaturePanel';
import ThreeDCanvas from '@/components/shared/dashboard/ThreeDCanvas';
import RoomFrame3D from '@/components/shared/dashboard/RoomFrame3D';
import ImageCropper from '@/components/shared/common/ImageCropper';
import OptimizationView from '@/components/shared/dashboard/OptimizationView';
import WallCarousel from '@/components/shared/dashboard/WallCarousel';
import ViewControls from '@/components/shared/dashboard/ViewControls';
import QuantityControl from '@/components/shared/dashboard/QuantityControl';
import ApplyChangesControl from '@/components/shared/dashboard/ApplyChangesControl';
import { handleConfirmChanges } from '@/utils/uploadHandler';

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

  const handleConfirmAndApply = async () => {
    setIsConfirming(true);
    try {
      await handleConfirmChanges();
      applyPendingChanges();
      applyPendingEdgeType();

      if (selectedView === 'crop' || selectedView === 'optimization') {
        setSelectedView('room');
      }
      setSelectedFeature(null);
    } catch (error) {
      console.error('Failed to confirm changes:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const { resetAll } = useGlobalReset();

  const {
    currentWallIndex,
    slideDirection,
    wallImages,
    handlePreviousWall: handlePrevWall,
    handleNextWall: handleNext,
    handleSelectIndex,
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
    setQuantity,
    setPendingQuantity,
    shape,
    setFile,
    setPreview,
    applyPendingChanges,
    selectedRatio,
    selectedSize,
    quality,
    selectedProduct,
  } = useUpload();
  const { selectedView, setSelectedView } = useView();
  const { edgeType, applyPendingEdgeType } = useEdge();
  const [pricePerItem, setPricePerItem] = useState<number>(0);

  useEffect(() => {
    setPricePerItem(
      +(selectedProduct?.price || 0) * +(selectedSize?.area_in2 || 0)
    );
  }, [selectedProduct, selectedSize]);

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

  const handleIncrement = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    setPendingQuantity(newQuantity);
  };

  const handleDecrement = () => {
    const newQuantity = Math.max(1, quantity - 1);
    setQuantity(newQuantity);
    setPendingQuantity(newQuantity);
  };

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

  const { mutateAsync, isPending } = useMutation({
    mutationFn: resetAll,
    onError: () => {},
    onSuccess: () => {},
  });

  return (
    <div className='h-[calc(var(--vh,1vh)*100)] flex flex-col overflow-hidden'>
      <Navbar />
      <div className='flex-1 w-full flex flex-col md:flex-row-reverse gap-0 overflow-hidden'>
        <div
          className={`
    relative 
    overflow-hidden 
    w-full 
    ${isEditingView ? 'h-full' : 'h-64 md:h-full'} 
   md:w-3/4
  `}
        >
          {selectedView === 'crop' && <ImageCropper isVisible={true} />}
          {selectedView === 'optimization' && (
            <OptimizationView isVisible={true} />
          )}
          {!isEditingView && (
            <>
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
          <div className='md:w-1/4 w-full flex flex-col border-l md:h-full h-full overflow-hidden'>
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
                  className='flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 overflow-visible min-h-[80px] md:min-h-[auto] w-full flex-shrink-0'
                >
                  <div className='flex-1 min-w-0'>
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      className='text-base md:text-lg font-bold leading-tight truncate'
                    >
                      Photo Print Under Acrylic Glass
                    </motion.h2>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      className='mt-2 flex items-center gap-2 text-sm'
                    >
                      <Button
                        size='sm'
                        className='flex items-center gap-1 p-1 text-primary border-primary'
                        variant='outline'
                      >
                        <Package className='w-4 h-4' />
                        Change Product
                      </Button>

                      <Button
                        size='sm'
                        variant='outline'
                        className='border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1 p-1'
                        onClick={() => mutateAsync()}
                        disabled={isPending}
                      >
                        <RefreshCw className='w-4 h-4' />
                        {isPending ? 'Resetting...' : 'Reset All'}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className='border-b border-gray-300 w-full flex-shrink-0'
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
                        className='space-y-0'
                        initial='hidden'
                        animate='visible'
                        variants={{
                          visible: {
                            transition: {
                              staggerChildren: 0.05,
                            },
                          },
                        }}
                      >
                        {features.map((item, index) => (
                          <motion.div
                            key={item.id}
                            custom={index}
                            variants={listItemVariants}
                          >
                            <motion.div
                              className={`flex items-center justify-between p-4 md:p-6 relative overflow-hidden group ${
                                selectedFeature?.id === item.id
                                  ? 'bg-blue-50 border-l-4 border-primary'
                                  : ''
                              } ${
                                item.disabled
                                  ? 'cursor-not-allowed bg-gray-50/50'
                                  : 'cursor-pointer'
                              }`}
                              onClick={() =>
                                !item.disabled && handleFeatureClick(item)
                              }
                              whileHover={
                                !item.disabled
                                  ? {
                                      scale: 1.005,
                                      transition: {
                                        duration: 0.2,
                                        ease: [0.4, 0, 0.2, 1],
                                      },
                                    }
                                  : {}
                              }
                              whileTap={
                                !item.disabled
                                  ? {
                                      scale: 0.995,
                                      transition: { duration: 0.1 },
                                    }
                                  : {}
                              }
                              transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 25,
                              }}
                            >
                              {item.disabled && (
                                <motion.div
                                  className='absolute inset-0 bg-gradient-to-r from-gray-100/30 via-transparent to-gray-100/30 pointer-events-none'
                                  initial={{ x: '-100%' }}
                                  animate={{ x: '100%' }}
                                  transition={{
                                    duration: 3,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: 'linear',
                                  }}
                                />
                              )}

                              {!item.disabled && (
                                <>
                                  <motion.div
                                    className='absolute inset-0 opacity-0 pointer-events-none'
                                    style={{
                                      background:
                                        'linear-gradient(90deg, rgba(var(--primary-rgb, 59, 130, 246), 0.08) 0%, rgba(var(--primary-rgb, 59, 130, 246), 0.03) 50%, transparent 100%)',
                                    }}
                                    whileHover={{ opacity: 1 }}
                                    transition={{
                                      duration: 0.3,
                                      ease: [0.22, 1, 0.36, 1],
                                    }}
                                  />
                                  <motion.div
                                    className='absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 pointer-events-none'
                                    whileHover={{ opacity: 1 }}
                                    transition={{
                                      duration: 0.3,
                                      ease: [0.22, 1, 0.36, 1],
                                    }}
                                  />
                                  <motion.div
                                    className='absolute inset-0 opacity-0 pointer-events-none'
                                    style={{
                                      background:
                                        'radial-gradient(600px circle at 20% 50%, rgba(var(--primary-rgb, 59, 130, 246), 0.04), transparent 60%)',
                                    }}
                                    whileHover={{ opacity: 1 }}
                                    transition={{
                                      duration: 0.4,
                                      ease: 'easeOut',
                                    }}
                                  />
                                </>
                              )}

                              <div className='flex items-center space-x-2 flex-1 min-w-0 relative z-10'>
                                <motion.div
                                  whileHover={
                                    !item.disabled
                                      ? {
                                          rotate: 8,
                                          scale: 1.15,
                                          filter:
                                            'drop-shadow(0 4px 12px rgba(var(--primary-rgb, 59, 130, 246), 0.4))',
                                          transition: {
                                            duration: 0.2,
                                            ease: [0.4, 0, 0.2, 1],
                                          },
                                        }
                                      : {}
                                  }
                                  transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 15,
                                  }}
                                >
                                  <item.icon
                                    className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                                      item.disabled
                                        ? 'text-gray-300'
                                        : selectedFeature?.id === item.id
                                          ? 'text-primary'
                                          : 'text-gray-500 group-hover:text-primary'
                                    }`}
                                  />
                                </motion.div>
                                <div className='min-w-0 flex-1'>
                                  <div className='flex items-center gap-2'>
                                    <motion.p
                                      className={`font-semibold text-sm leading-tight transition-all duration-300 ${
                                        item.disabled
                                          ? 'text-gray-400'
                                          : selectedFeature?.id === item.id
                                            ? 'text-primary'
                                            : 'text-gray-900 group-hover:text-primary'
                                      }`}
                                      whileHover={
                                        !item.disabled
                                          ? {
                                              textShadow:
                                                '0 0 8px rgba(var(--primary-rgb, 59, 130, 246), 0.3)',
                                            }
                                          : {}
                                      }
                                    >
                                      {item.name}
                                    </motion.p>
                                    {item.disabled && (
                                      <motion.span
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                          delay: index * 0.05 + 0.3,
                                          type: 'spring',
                                          stiffness: 500,
                                          damping: 15,
                                        }}
                                        className='inline-flex text-center items-center px-1 py-0.5 rounded-full text-[9px] font-medium bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200 shadow-sm'
                                      >
                                        Coming Soon
                                      </motion.span>
                                    )}
                                  </div>
                                  <motion.p
                                    className={`text-xs leading-tight transition-colors duration-300 ${
                                      item.disabled
                                        ? 'text-gray-300'
                                        : 'text-gray-500 group-hover:text-gray-600'
                                    }`}
                                  >
                                    {item.subtitle}
                                  </motion.p>
                                </div>
                              </div>

                              {!item.disabled ? (
                                <motion.div
                                  className='relative z-10'
                                  whileHover={{
                                    x: 6,
                                    scale: 1.2,
                                    filter:
                                      'drop-shadow(0 4px 10px rgba(var(--primary-rgb, 59, 130, 246), 0.3))',
                                    transition: {
                                      duration: 0.2,
                                      ease: [0.4, 0, 0.2, 1],
                                    },
                                  }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 15,
                                  }}
                                >
                                  <ChevronRight className='h-4 w-4 text-gray-400 flex-shrink-0 cursor-pointer transition-all duration-300 group-hover:text-primary' />
                                </motion.div>
                              ) : (
                                <motion.div
                                  className='relative z-10'
                                  initial={{ rotate: 0 }}
                                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                                  transition={{
                                    duration: 0.5,
                                    delay: index * 0.05 + 0.5,
                                  }}
                                >
                                  <svg
                                    className='h-4 w-4 text-gray-300'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                                    />
                                  </svg>
                                </motion.div>
                              )}
                            </motion.div>
                            {index !== features.length - 1 && (
                              <motion.div
                                className='border-b border-gray-200 w-full'
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{
                                  delay: index * 0.05 + 0.2,
                                  duration: 0.3,
                                }}
                              />
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    </ScrollArea>
                  </div>
                </motion.div>

                <FeaturePanel />
              </motion.div>
            </div>

            <div className='border-b border-gray-300 w-full flex-shrink-0' />

            <motion.div
              className='flex-shrink-0 p-4 bg-white border-t border-gray-200 md:border-t-0 md:bg-transparent'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <AnimatePresence mode='wait'>
                {!selectedFeature ? (
                  <QuantityControl
                    quantity={quantity}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
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
                      applyPendingChanges();
                      applyPendingEdgeType();
                      if (
                        selectedView === 'crop' ||
                        selectedView === 'optimization'
                      )
                        setSelectedView('room');
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
            className='fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50'
            style={{
              bottom: 'env(safe-area-inset-bottom, 0px)',
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div className='flex justify-between items-center'>
              <motion.div
                className='flex flex-col'
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <motion.span
                  className='text-xl font-semibold'
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  ${(pricePerItem * quantity).toFixed(2)}
                </motion.span>
                {selectedSize &&
                  +(selectedProduct?.oldPrice || 0) > pricePerItem && (
                    <motion.div
                      className='text-sm'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className='line-through text-gray-500'>
                        ${(pricePerItem * quantity).toFixed(2)}
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant='default'
                  className='px-6 py-2 rounded-none whitespace-nowrap transition-all duration-200'
                  onClick={() => {
                    applyPendingChanges();
                    applyPendingEdgeType();
                    setSelectedView('room');
                    setSelectedFeature(null);
                    if (selectedFeature?.name === 'SIDE APPEARANCE')
                      setSelectedView('room');
                  }}
                >
                  Apply Changes
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
