import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Eye,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  ChevronLeft,
  ImagePlus,
  RefreshCw,
  Package,
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navbar from '@/components/shared/dashboard/Navbar';
import Wall from '@/assets/images/wall.jpg';
import Wall1 from '@/assets/images/wall1.jpg';
import Wall2 from '@/assets/images/wall2.jpg';
import featuresBase from '@/constants/dashboard/index';
import { useFeature } from '@/context/dashboard/FeatureContext';
import FeaturePanel from '@/components/shared/dashboard/FeaturePanel';

import ThreeDCanvas from '@/components/shared/dashboard/ThreeDCanvas';
import RoomFrame3D from '@/components/shared/dashboard/RoomFrame3D';
import { useUpload } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import ImageCropper from '@/components/shared/common/ImageCropper';
import { useEdge } from '@/context/EdgeContext';
import { useGlobalReset } from '@/hooks/useGlobalReset';
import OptimizationView from '@/components/shared/dashboard/OptimizationView';
import { useMutation } from '@tanstack/react-query';

interface MenuFeature {
  id: number;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  subtitle: string;
  step: number;
  component: string | null;
}

const Dashboard: React.FC = () => {
  const [quantity, setQuantity] = useState<number>(1);
  const [currentWallIndex, setCurrentWallIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>(
    'right'
  );
  const [customWalls, setCustomWalls] = useState<string[]>([]);
  const wallImageInputRef = useRef<HTMLInputElement>(null);
  const { selectedFeature, setSelectedFeature } = useFeature();
  const { resetAll } = useGlobalReset();

  // Fix for mobile viewport height issues
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

  // Animation variants
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

  const slideVariants: Variants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? '100%' : '-100%',
    }),
    center: { x: 0 },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? '-100%' : '100%',
    }),
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  };

  const {
    shape,
    setFile,
    setPreview,
    setOriginalPreview,
    applyPendingChanges,
    selectedRatio,
    selectedSize,
    quality,
  } = useUpload();
  const { selectedView, setSelectedView } = useView();
  const { edgeType } = useEdge();
  const pricePerItem: number = selectedSize?.sell_price || 100;

  const wallImages = [...[Wall, Wall1, Wall2], ...customWalls];

  const handlePreviousWall = () => {
    setSlideDirection('left');
    setCurrentWallIndex(prev =>
      prev === 0 ? wallImages.length - 1 : prev - 1
    );
  };

  const handleNextWall = () => {
    setSlideDirection('right');
    setCurrentWallIndex(prev =>
      prev === wallImages.length - 1 ? 0 : prev + 1
    );
  };

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
          ? `${selectedSize.width}" × ${selectedSize.height}" (${selectedRatio})`
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

  const handleIncrement = () => setQuantity(q => q + 1);
  const handleDecrement = () => setQuantity(q => Math.max(1, q - 1));

  const handleFeatureClick = (item: MenuFeature) => {
    setSelectedFeature(selectedFeature?.id === item.id ? null : item);
  };

  const handleAddToCart = () => {};

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const newPreview = URL.createObjectURL(f);
      setFile(f);
      setPreview(newPreview);
      setOriginalPreview(newPreview); // Set as original when uploading new image
    }
  };

  const handleWallImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const imageUrl = URL.createObjectURL(f);
      setCustomWalls(prev => [...prev, imageUrl]);
      // Set to the newly added wall
      setCurrentWallIndex(wallImages.length);
      setSlideDirection('right');
    }
  };

  const handleAddImageClick = () => {
    wallImageInputRef.current?.click();
  };

  // Fix: Use type assertion to handle the view types properly
  const isEditingView =
    selectedView === ('crop' as any) ||
    selectedView === ('optimization' as any);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: resetAll,
    onError: err => console.error('Reset failed:', err),
    onSuccess: () => console.log('Reset complete'),
  });

  return (
    <div className='h-[calc(var(--vh,1vh)*100)] flex flex-col overflow-hidden'>
      <Navbar />
      <div className='flex-1 w-full flex flex-col md:flex-row-reverse gap-0 overflow-hidden'>
        {/* Main content area */}
        <div
          className={`
          ${isEditingView ? 'w-full h-full' : 'md:w-3/4 w-full'} 
          relative 
          ${isEditingView ? 'h-full' : 'h-64 md:h-full'} 
          overflow-hidden
        `}
        >
          {selectedView === ('crop' as any) && (
            <ImageCropper isVisible={true} />
          )}
          {selectedView === ('optimization' as any) && (
            <OptimizationView isVisible={true} />
          )}
          {!isEditingView && (
            <>
              {/* Room View with 3D Frame */}
              <div
                className={`absolute inset-0 transition-all duration-500 ${selectedView === 'room'
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-95 pointer-events-none'
                  }`}
              >
                {/* Sliding Background Container - Full size for room context */}
                <div className='relative w-full h-full overflow-hidden'>
                  <AnimatePresence mode='wait' custom={slideDirection}>
                    <motion.img
                      key={currentWallIndex}
                      src={wallImages[currentWallIndex]}
                      alt='Room'
                      className='w-full h-full object-cover'
                      custom={slideDirection}
                      variants={slideVariants}
                      initial='enter'
                      animate='center'
                      exit='exit'
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        duration: 0.6,
                      }}
                    />
                  </AnimatePresence>
                </div>
                
                {/* Room Frame positioned properly within the room */}
                <div className="
                  absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[280px] h-[210px] md:w-80 md:h-60
                ">
                  <RoomFrame3D onInteraction={() => setSelectedView('3d')} />
                </div>

                {/* Left Arrow */}
                <motion.button
                  onClick={handlePreviousWall}
                  className='cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 
             bg-white/80 hover:bg-white 
             p-2 sm:p-3 rounded-full shadow-lg transition-all z-10'
                  type='button'
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow:
                      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    whileHover={{ x: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <ChevronLeft className='h-4 w-4 sm:h-6 sm:w-6 text-gray-800' />
                  </motion.div>
                </motion.button>

                {/* Right Arrow */}
                <motion.button
                  onClick={handleNextWall}
                  className='cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 
             bg-white/80 hover:bg-white 
             p-2 sm:p-3 rounded-full shadow-lg transition-all z-10'
                  type='button'
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow:
                      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    whileHover={{ x: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <ChevronRight className='h-4 w-4 sm:h-6 sm:w-6 text-gray-800' />
                  </motion.div>
                </motion.button>


                {/* Wall Indicator Dots */}
                <motion.div
                  className='absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1 sm:space-x-1.5 z-10'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                >
                  {wallImages.map((_, index) => (
                    <motion.button
                      key={_}
                      onClick={() => {
                        setSlideDirection(index > currentWallIndex ? 'right' : 'left');
                        setCurrentWallIndex(index);
                      }}
                      className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 ${index === currentWallIndex
                          ? 'bg-white shadow-md'
                          : 'bg-white/50 hover:bg-white/75'
                        }`}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.9 }}
                      animate={{
                        scale: index === currentWallIndex ? 1.3 : 1,
                        opacity: index === currentWallIndex ? 1 : 0.6,
                      }}
                    />
                  ))}
                </motion.div>

              </div>

              {/* 3D View */}
              <div
                className={`absolute inset-0 transition-all duration-700 ease-out ${selectedView === '3d'
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-110 pointer-events-none'
                  }`}
              >
                {/* Responsive container for 3D view only */}
                <div className="
                  w-full h-full 
                  flex items-center justify-center
                   md:p-0
                ">
<div className="w-full h-full">
                    <ThreeDCanvas isVisible={selectedView === '3d'} />
                  </div>
                </div>
              </div>

              {/* Top overlay buttons */}
              <div
                className='absolute top-0 left-0 right-0 flex justify-between items-start md:top-4 md:px-4'
                style={{ pointerEvents: 'none' }}
              >
                {/* Add Image Button or Placeholder */}
                <motion.button
                  onClick={handleAddImageClick}
                  className={`flex flex-col items-center justify-center px-2 py-2 md:px-2 md:py-2 bg-[var(--primary)] border border-gray-300 text-white hover:transition-all cursor-pointer shadow-sm ${selectedView !== 'room'
                    ? 'invisible pointer-events-none'
                    : 'pointer-events-auto'
                    }`}
                  type='button'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ImagePlus className='h-4 w-4 md:h-5 md:w-5 mb-1' />
                  <span className='text-sm font-medium hidden sm:block'>
                    Add Image
                  </span>
                </motion.button>

                {/* Room + 3D View buttons */}
                <motion.div
                  className='flex gap-2 pointer-events-auto'
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.5,
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className='flex border border-gray-300 divide-x divide-gray-300'>
                    <motion.button
                      onClick={() => setSelectedView('room')}
                      className={`flex items-center justify-center px-2 py-2 md:px-5 md:py-3 text-xs md:text-sm font-medium rounded-none cursor-pointer transition-all ${selectedView === 'room'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      type='button'
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        animate={{
                          rotate: selectedView === 'room' ? 360 : 0,
                          scale: selectedView === 'room' ? 1.1 : 1,
                        }}
                        transition={{
                          rotate: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                          scale: { duration: 0.2 },
                        }}
                      >
                        <Eye className='h-4 w-4 md:h-5 md:w-5' />
                      </motion.div>
                      <span className='hidden md:inline ml-1'>Room View</span>
                    </motion.button>
                    <motion.button
                      onClick={() => setSelectedView('3d')}
                      className={`flex items-center justify-center px-2 py-2 md:px-5 md:py-3 text-xs md:text-sm font-medium rounded-none cursor-pointer transition-all ${selectedView === '3d'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      type='button'
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        animate={{
                          rotateY: selectedView === '3d' ? 360 : 0,
                          scale: selectedView === '3d' ? 1.1 : 1,
                        }}
                        transition={{
                          rotateY: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                          scale: { duration: 0.2 },
                        }}
                      >
                        <Box className='h-4 w-4 md:h-5 md:w-5' />
                      </motion.div>
                      <span className='hidden md:inline ml-1'>3D View</span>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </div>

        {/* Right: Sidebar - Hidden during editing views on mobile, shown on desktop */}
        {(!isEditingView || window.innerWidth >= 768) && (
          <div className='md:w-1/4 w-full flex flex-col border-l md:h-full flex-1 md:flex-none overflow-hidden'>
            {/* Top: Title + Thumbnail */}
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

            {/* Scrollable Features Area */}
            <div className='flex-1 min-h-0 overflow-hidden'>
              {/* Features list + Feature Panel */}
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
                  {/* Scrollable features list */}
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
                              className={`flex items-center justify-between p-4 md:p-6 relative overflow-hidden group ${selectedFeature?.id === item.id
                                ? 'bg-blue-50 border-l-4 border-primary'
                                : ''
                                } ${item.disabled
                                  ? 'cursor-not-allowed bg-gray-50/50'
                                  : 'cursor-pointer'
                                }`}
                              onClick={() =>
                                !item.disabled && handleFeatureClick(item)
                              }
                              whileHover={!item.disabled ? { scale: 1.002 } : {}}
                              whileTap={!item.disabled ? { scale: 0.998 } : {}}
                              transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 25,
                              }}
                            >
                              {/* Disabled overlay with subtle pattern */}
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

                              {/* Background effects for enabled items */}
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
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                  />
                                </>
                              )}

                              <div className='flex items-center space-x-2 flex-1 min-w-0 relative z-10'>
                                <motion.div
                                  whileHover={
                                    !item.disabled
                                      ? {
                                        rotate: 5,
                                        scale: 1.1,
                                        filter:
                                          'drop-shadow(0 2px 8px rgba(var(--primary-rgb, 59, 130, 246), 0.3))',
                                      }
                                      : {}
                                  }
                                  transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 10,
                                  }}
                                >
                                  <item.icon
                                    className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${item.disabled
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
                                      className={`font-semibold text-sm leading-tight transition-all duration-300 ${item.disabled
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
                                        className='inline-flex items-center px-1 py-0.5 rounded-full text-[9px] font-medium bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200 shadow-sm'
                                      >
                                        Coming Soon
                                      </motion.span>
                                    )}
                                  </div>
                                  <motion.p
                                    className={`text-xs leading-tight transition-colors duration-300 ${item.disabled
                                      ? 'text-gray-300'
                                      : 'text-gray-500 group-hover:text-gray-600'
                                      }`}
                                  >
                                    {item.subtitle}
                                  </motion.p>
                                </div>
                              </div>

                              {/* Chevron icon or lock icon */}
                              {!item.disabled ? (
                                <motion.div
                                  className='relative z-10'
                                  whileHover={{
                                    x: 4,
                                    scale: 1.1,
                                    filter:
                                      'drop-shadow(0 2px 6px rgba(var(--primary-rgb, 59, 130, 246), 0.25))',
                                  }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 10,
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

                {/* Feature panel component */}
                <FeaturePanel />
              </motion.div>
            </div>

            <div className='border-b border-gray-300 w-full flex-shrink-0' />

            {/* Fixed bottom section for mobile */}
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
                  <motion.div
                    key='default-actions'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className='flex items-center justify-between gap-3'
                  >
                    <motion.div
                      className='flex items-center justify-center space-x-2'
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: 0.1,
                        duration: 0.3,
                        type: 'spring',
                        stiffness: 300,
                      }}
                    >
                      <motion.div
                        variants={buttonVariants}
                        initial='idle'
                        whileHover='hover'
                        whileTap='tap'
                      >
                        <Button
                          variant='outline'
                          size='icon'
                          onClick={handleDecrement}
                          className='h-12 w-12 rounded-none transition-all duration-200'
                        >
                          <MinusCircle className='h-6 w-6' />
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.15,
                          type: 'spring',
                          stiffness: 400,
                        }}
                      >
                        <Badge className='px-4 py-2 text-base rounded-none'>
                          {quantity}
                        </Badge>
                      </motion.div>
                      <motion.div
                        variants={buttonVariants}
                        initial='idle'
                        whileHover='hover'
                        whileTap='tap'
                      >
                        <Button
                          variant='outline'
                          size='icon'
                          onClick={handleIncrement}
                          className='h-12 w-12 rounded-none transition-all duration-200'
                        >
                          <PlusCircle className='h-6 w-6' />
                        </Button>
                      </motion.div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant='default'
                        className='flex items-center justify-center px-4 py-3 text-sm rounded-none transition-all duration-200 min-w-[140px] max-w-[180px] w-full'
                        onClick={handleAddToCart}
                      >
                        CONFIRM CHANGES
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key='feature-actions'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className='flex items-center justify-between gap-3 flex-shrink-0'
                  >
                    <motion.div
                      className='flex flex-col'
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <motion.span
                        className='text-xl font-semibold'
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.15,
                          type: 'spring',
                          stiffness: 300,
                        }}
                      >
                        ${(pricePerItem * quantity).toFixed(2)}
                      </motion.span>
                      {selectedSize &&
                        selectedSize.actual_price > selectedSize.sell_price && (
                          <motion.div
                            className='text-sm'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                          >
                            <span className='line-through text-gray-500'>
                              $
                              {(selectedSize.actual_price * quantity).toFixed(
                                2
                              )}
                            </span>
                            <span className='ml-2 text-green-600 font-medium'>
                              {Math.round(
                                ((selectedSize.actual_price -
                                  selectedSize.sell_price) /
                                  selectedSize.actual_price) *
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
                      transition={{ delay: 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant='default'
                        className='px-6 py-2 rounded-none whitespace-nowrap transition-all duration-200'
                        onClick={() => {
                          applyPendingChanges();
                          setSelectedView('room' as any);
                          setSelectedFeature(null);
                        }}
                      >
                        Apply Changes
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {/* Apply Changes Button - Only shown during editing views on mobile */}
        {isEditingView && window.innerWidth < 768 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className='fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50'
            style={{
              bottom: 'env(safe-area-inset-bottom, 0px)',
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'
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
                  selectedSize.actual_price > selectedSize.sell_price && (
                    <motion.div
                      className='text-sm'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className='line-through text-gray-500'>
                        ${(selectedSize.actual_price * quantity).toFixed(2)}
                      </span>
                      <span className='ml-2 text-green-600 font-medium'>
                        {Math.round(
                          ((selectedSize.actual_price -
                            selectedSize.sell_price) /
                            selectedSize.actual_price) *
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
                    setSelectedView('room' as any);
                    setSelectedFeature(null);
                  }}
                >
                  Apply Changes
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Hidden file inputs */}
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
    </div>
  );
};

export default Dashboard;
