import type React from 'react';
import { useState } from 'react';
import {
  Box,
  Eye,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  ChevronLeft,
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
  const { selectedFeature, setSelectedFeature } = useFeature();

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
    applyPendingChanges,
    selectedRatio,
    selectedSize,
  } = useUpload();
  const { selectedView, setSelectedView } = useView();
  const pricePerItem: number = selectedSize?.sell_price || 100;

  const wallImages = [Wall, Wall1, Wall2];

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

  // Create dynamic features with updated subtitles
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
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  return (
    <div className='h-screen flex flex-col overflow-hidden'>
      <Navbar />
      <div className='flex-1 w-full flex flex-col md:flex-row gap-0 overflow-hidden'>
        {/* Left: Image Section */}
        <div className='md:w-8/12 w-full relative h-64 md:h-full overflow-hidden'>
          {/* Room View with 3D Frame */}
          <div
            className={`absolute inset-0 transition-all duration-500 ${
              selectedView === 'room'
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            {/* Sliding Background Container */}
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
            <RoomFrame3D onInteraction={() => setSelectedView('3d')} />

            {/* Left Arrow */}
            <motion.button
              onClick={handlePreviousWall}
              className='cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all z-10'
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
                <ChevronLeft className='h-6 w-6 text-gray-800 ' />
              </motion.div>
            </motion.button>

            {/* Right Arrow */}
            <motion.button
              onClick={handleNextWall}
              className='cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all z-10'
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
                <ChevronRight className='h-6 w-6 text-gray-800' />
              </motion.div>
            </motion.button>

            {/* Wall Indicator Dots */}
            <motion.div
              className='absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              {wallImages.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setSlideDirection(
                      index > currentWallIndex ? 'right' : 'left'
                    );
                    setCurrentWallIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentWallIndex
                      ? 'bg-white shadow-lg'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    scale: index === currentWallIndex ? 1.2 : 1,
                    opacity: index === currentWallIndex ? 1 : 0.6,
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* 3D View */}
          <div
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              selectedView === '3d'
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-110 pointer-events-none'
            }`}
          >
            <ThreeDCanvas isVisible={selectedView === '3d'} />
          </div>

          {/* Top right view buttons */}
          <motion.div
            className='absolute top-0 right-0 flex border border-gray-300 divide-x divide-gray-300 md:top-4 md:right-4'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              onClick={() => setSelectedView('room')}
              className={`flex items-center justify-center px-2 py-2 md:px-5 md:py-3 text-xs md:text-sm font-medium rounded-none cursor-pointer transition-all ${
                selectedView === 'room'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              type='button'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                backgroundColor:
                  selectedView === 'room' ? 'var(--primary)' : '#ffffff',
              }}
              transition={{ duration: 0.2 }}
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
              className={`flex items-center justify-center px-2 py-2 md:px-5 md:py-3 text-xs md:text-sm font-medium rounded-none cursor-pointer transition-all ${
                selectedView === '3d'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              type='button'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                backgroundColor:
                  selectedView === '3d' ? 'var(--primary)' : '#ffffff',
              }}
              transition={{ duration: 0.2 }}
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
          </motion.div>
        </div>

        {/* Right: Sidebar */}
        <div className='md:w-1/3 w-full flex flex-col border-l md:h-full flex-1 md:flex-none md:overflow-hidden overflow-y-auto'>
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
                className='flex items-center justify-between p-4 overflow-hidden'
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
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className='text-sm cursor-pointer mt-1'
                    style={{ color: 'var(--primary)' }}
                  >
                    Change Product
                  </motion.p>
                </div>
                <motion.img
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.1,
                    duration: 0.3,
                    type: 'spring',
                    stiffness: 300,
                  }}
                  src='/api/placeholder/48/48'
                  alt='Thumbnail'
                  className='w-12 h-12 object-cover rounded ml-2 flex-shrink-0'
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className='border-b border-gray-300 w-full'
            animate={{
              opacity: selectedFeature ? 0 : 1,
              height: selectedFeature ? 0 : 'auto',
            }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Features list + Feature Panel */}
          <motion.div
            className='relative md:overflow-hidden flex-1'
            layout
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className='md:absolute md:inset-0'
              animate={{
                x: selectedFeature ? '-100%' : '0%',
              }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <ScrollArea className='md:h-full'>
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
                        className={`flex items-center justify-between p-4 md:p-6 cursor-pointer relative overflow-hidden group ${selectedFeature?.id === item.id ? 'bg-blue-50 border-l-4 border-primary' : ''}`}
                        onClick={() => handleFeatureClick(item)}
                        whileHover={{ scale: 1.002 }}
                        whileTap={{ scale: 0.998 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        }}
                      >
                        {/* Gradient Hover Overlay */}
                        <motion.div
                          className='absolute inset-0 opacity-0 pointer-events-none'
                          style={{
                            background:
                              'linear-gradient(90deg, rgba(var(--primary-rgb, 59, 130, 246), 0.08) 0%, rgba(var(--primary-rgb, 59, 130, 246), 0.03) 50%, transparent 100%)',
                          }}
                          whileHover={{
                            opacity: 1,
                          }}
                          transition={{
                            duration: 0.3,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />

                        {/* Subtle Left Border Animation */}
                        <motion.div
                          className='absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 pointer-events-none'
                          whileHover={{
                            opacity: 1,
                          }}
                          transition={{
                            duration: 0.3,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />

                        {/* Radial Glow Effect */}
                        <motion.div
                          className='absolute inset-0 opacity-0 pointer-events-none'
                          style={{
                            background:
                              'radial-gradient(600px circle at 20% 50%, rgba(var(--primary-rgb, 59, 130, 246), 0.04), transparent 60%)',
                          }}
                          whileHover={{
                            opacity: 1,
                          }}
                          transition={{
                            duration: 0.4,
                            ease: 'easeOut',
                          }}
                        />
                        <div className='flex items-center space-x-2 flex-1 min-w-0 relative z-10'>
                          <motion.div
                            whileHover={{
                              rotate: 5,
                              scale: 1.1,
                              filter:
                                'drop-shadow(0 2px 8px rgba(var(--primary-rgb, 59, 130, 246), 0.3))',
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 400,
                              damping: 10,
                            }}
                          >
                            <item.icon
                              className={`h-5 w-5 flex-shrink-0 transition-all duration-300 group-hover:text-primary ${selectedFeature?.id === item.id ? 'text-primary' : 'text-gray-500'}`}
                            />
                          </motion.div>
                          <div className='min-w-0'>
                            <motion.p
                              className={`font-semibold text-sm leading-tight transition-all duration-300 group-hover:text-primary ${selectedFeature?.id === item.id ? 'text-primary' : 'text-gray-900'}`}
                              whileHover={{
                                textShadow:
                                  '0 0 8px rgba(var(--primary-rgb, 59, 130, 246), 0.3)',
                              }}
                            >
                              {item.name}
                            </motion.p>
                            <motion.p className='text-xs text-gray-500 leading-tight transition-colors duration-300 group-hover:text-gray-600'>
                              {item.subtitle}
                            </motion.p>
                          </div>
                        </div>
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
            </motion.div>

            {/* Feature panel component */}
            <FeaturePanel />
          </motion.div>

          <div className='border-b border-gray-300 w-full' />

          <motion.div
            className='flex-shrink-0 p-4'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode='wait'>
              {!selectedFeature ? (
                // Default quantity + Add to Cart
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
                      className='flex-1 flex items-center justify-center px-8 py-4 text-base rounded-none transition-all duration-200'
                      onClick={handleAddToCart}
                    >
                      CONFIRM CHANGES
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                // Feature panel open -> Price + Apply Changes in same line
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
                    transition={{ delay: 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant='default'
                      className='px-6 py-2 rounded-none whitespace-nowrap transition-all duration-200'
                      onClick={() => {
                        applyPendingChanges();
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
      </div>

      {/* Hidden file input for photo selection */}
      <input
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleFileChange}
      />
    </div>
  );
};

export default Dashboard;
