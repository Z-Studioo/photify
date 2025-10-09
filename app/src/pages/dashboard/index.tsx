import type React from 'react';
import { useState } from 'react';
import {
  Box,
  ImagePlus,
  Eye,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navbar from '@/components/shared/dashboard/Navbar';
import Wall from '@/assets/images/wall.jpg';
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
  const { selectedFeature, setSelectedFeature } = useFeature();
  const { shape, setFile, setPreview, applyPendingChanges } = useUpload();
  const { selectedView, setSelectedView } = useView();
  const pricePerItem: number = 100;

  // Create dynamic features with updated shape subtitle
  const features = featuresBase.map(feature => {
    if (feature.name === 'ROUND FORMATS AND SHAPES') {
      return {
        ...feature,
        subtitle: shape.charAt(0).toUpperCase() + shape.slice(1),
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

  const triggerFileUpload = () => {
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fileInput?.click();
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
            <img src={Wall} alt='Room' className='w-full h-full object-cover' />
            <RoomFrame3D onInteraction={() => setSelectedView('3d')} />
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

          {/* Top left add button - Hidden in 3D view */}
          {selectedView !== '3d' && (
            <div className='absolute top-0 left-0 md:top-4 md:left-4'>
              <button
                className='flex flex-col items-center justify-center p-2 md:px-4 md:py-3 bg-primary text-white hover:bg-primary/90 cursor-pointer'
                onClick={triggerFileUpload}
                type='button'
              >
                <ImagePlus className='h-4 w-4 md:h-5 md:w-5 mb-0 md:mb-1' />
                <span className='hidden md:inline text-xs md:text-sm font-medium'>
                  Add
                </span>
              </button>
            </div>
          )}

          {/* Top right view buttons */}
          <div className='absolute top-0 right-0 flex border border-gray-300 divide-x divide-gray-300 md:top-4 md:right-4'>
            <button
              onClick={() => setSelectedView('room')}
              className={`flex items-center justify-center px-2 py-2 md:px-5 md:py-3 text-xs md:text-sm font-medium rounded-none cursor-pointer transition-all ${
                selectedView === 'room'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              type='button'
            >
              <Eye className='h-4 w-4 md:h-5 md:w-5' />
              <span className='hidden md:inline ml-1'>Room View</span>
            </button>
            <button
              onClick={() => setSelectedView('3d')}
              className={`flex items-center justify-center px-2 py-2 md:px-5 md:py-3 text-xs md:text-sm font-medium rounded-none cursor-pointer transition-all ${
                selectedView === '3d'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              type='button'
            >
              <Box className='h-4 w-4 md:h-5 md:w-5' />
              <span className='hidden md:inline ml-1'>3D View</span>
            </button>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className='md:w-1/3 w-full flex flex-col border-l md:h-full flex-1 md:flex-none md:overflow-hidden overflow-y-auto'>
          {/* Top: Title + Thumbnail */}
          {!selectedFeature && (
            <div className='flex items-center justify-between p-4'>
              <div className='flex-1 min-w-0'>
                <h2 className='text-base md:text-lg font-bold leading-tight truncate'>
                  Photo Print Under Acrylic Glass
                </h2>
                <p
                  className='text-sm cursor-pointer mt-1'
                  style={{ color: 'var(--primary)' }}
                >
                  Change Product
                </p>
              </div>
              <img
                src='/api/placeholder/48/48'
                alt='Thumbnail'
                className='w-12 h-12 object-cover rounded ml-2 flex-shrink-0'
              />
            </div>
          )}

          <div className='border-b border-gray-300 w-full' />
          {/* Features list + Feature Panel */}
          <div className='relative md:flex-1 md:overflow-hidden'>
            <div
              className={`md:absolute md:inset-0 transition-transform duration-300 ease-in-out ${selectedFeature ? 'md:-translate-x-full' : 'md:translate-x-0'}`}
            >
              <ScrollArea className='md:h-full'>
                <div className='space-y-0'>
                  {features.map((item, index) => (
                    <div key={item.id}>
                      <div
                        className={`flex items-center justify-between p-4 md:p-6 cursor-pointer hover:bg-gray-50 ${selectedFeature?.id === item.id ? 'bg-blue-50 border-l-4 border-primary' : ''}`}
                        onClick={() => handleFeatureClick(item)}
                      >
                        <div className='flex items-center space-x-2 flex-1 min-w-0'>
                          <item.icon
                            className={`h-5 w-5 flex-shrink-0 ${selectedFeature?.id === item.id ? 'text-primary' : 'text-gray-500'}`}
                          />
                          <div className='min-w-0'>
                            <p
                              className={`font-semibold text-sm leading-tight ${selectedFeature?.id === item.id ? 'text-primary' : 'text-gray-900'}`}
                            >
                              {item.name}
                            </p>
                            <p className='text-xs text-gray-500 leading-tight'>
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className='h-4 w-4 text-gray-400 flex-shrink-0' />
                      </div>
                      {index !== features.length - 1 && (
                        <div className='border-b border-gray-200 w-full' />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Feature panel component */}
            <FeaturePanel />
          </div>

          <div className='border-b border-gray-300 w-full' />

          <div className='flex-shrink-0 p-4'>
            {!selectedFeature ? (
              // Default quantity + Add to Cart
              <div className='flex items-center justify-between gap-3'>
                <div className='flex items-center justify-center space-x-2'>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={handleDecrement}
                    className='h-12 w-12 rounded-none'
                  >
                    <MinusCircle className='h-6 w-6' />
                  </Button>
                  <Badge className='px-4 py-2 text-base rounded-none'>
                    {quantity}
                  </Badge>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={handleIncrement}
                    className='h-12 w-12 rounded-none'
                  >
                    <PlusCircle className='h-6 w-6' />
                  </Button>
                </div>

                <Button
                  variant='default'
                  className='flex-1 flex items-center justify-center px-8 py-4 text-base rounded-none'
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className='h-5 w-5 mr-2' />
                  ADD TO CART
                </Button>
              </div>
            ) : (
              // Feature panel open -> Price + Apply Changes in same line
              <div className='flex items-center justify-between gap-3 flex-shrink-0'>
                <span className='text-xl font-semibold'>
                  ${pricePerItem * quantity}
                </span>
                <Button
                  variant='default'
                  className='px-6 py-2 rounded-none whitespace-nowrap'
                  onClick={() => {
                    applyPendingChanges();
                    setSelectedFeature(null);
                  }}
                >
                  Apply Changes
                </Button>
              </div>
            )}
          </div>
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
