import { useState } from 'react';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { X, ShoppingCart, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function AIPrintSizePage() {
  const navigate = useNavigate();

  // Mock image - in real app would get from previous page
  const selectedImage =
    'https://images.unsplash.com/photo-1741298166997-665f850b8f28?w=800';

  const [selectedSize, setSelectedSize] = useState<string>('medium');

  // Print size options with prices
  const printSizes = [
    { id: 'small', name: '8" × 10"', dimensions: '20cm × 25cm', price: 29.99 },
    {
      id: 'medium',
      name: '12" × 16"',
      dimensions: '30cm × 40cm',
      price: 49.99,
    },
    { id: 'large', name: '18" × 24"', dimensions: '45cm × 60cm', price: 79.99 },
    {
      id: 'xlarge',
      name: '24" × 32"',
      dimensions: '60cm × 80cm',
      price: 129.99,
    },
  ];

  const handleBack = () => {
    navigate(-1);
  };

  const handleAddToCart = () => {
    const selectedSizeData = printSizes.find(size => size.id === selectedSize);
    alert(
      `Added to cart: ${selectedSizeData?.name} print for $${selectedSizeData?.price}`
    );
    // In a real app, this would add to cart and navigate to cart/checkout
  };

  const selectedSizeData = printSizes.find(size => size.id === selectedSize);

  return (
    <div className="h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 font-['Mona_Sans',_sans-serif]">
      {/* Decorative gradient orbs */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-purple-300/20 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-300/20 rounded-full blur-3xl' />
      </div>

      {/* Close Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/')}
        className='fixed top-6 left-6 z-30 w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200/50'
      >
        <X className='w-5 h-5 text-gray-700' />
      </motion.button>

      {/* Main Content - Full Height Two Column Layout */}
      <div className='relative z-20 h-full grid grid-cols-2 gap-0'>
        {/* Left Column - Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className='h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-12 relative overflow-hidden'
        >
          {/* Room Mockup - Full Height */}
          <div className='h-full w-full flex items-center justify-center relative'>
            {/* Wall texture */}
            <div className='absolute inset-0 opacity-10'>
              <div
                className='w-full h-full'
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
            </div>

            {/* Framed Artwork */}
            <motion.div
              key={selectedSize}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className='relative'
              style={{
                width:
                  selectedSize === 'small'
                    ? '280px'
                    : selectedSize === 'medium'
                      ? '340px'
                      : selectedSize === 'large'
                        ? '400px'
                        : '460px',
              }}
            >
              {/* Frame */}
              <div className='relative shadow-2xl'>
                {/* Outer frame */}
                <div
                  className='absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-sm'
                  style={{ padding: '12px' }}
                >
                  {/* Inner frame */}
                  <div
                    className='absolute inset-3 bg-gradient-to-br from-gray-700 to-gray-800 rounded-sm'
                    style={{ padding: '8px' }}
                  />
                </div>

                {/* Mat */}
                <div className='relative bg-white p-6 rounded-sm shadow-inner'>
                  {/* Artwork */}
                  <div className='aspect-[3/4] rounded-sm overflow-hidden shadow-lg'>
                    <ImageWithFallback
                      src={selectedImage}
                      alt='Your artwork'
                      className='w-full h-full object-cover'
                    />
                  </div>
                </div>
              </div>

              {/* Shadow */}
              <div
                className='absolute inset-0 shadow-2xl pointer-events-none'
                style={{
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Right Column - Size Selection */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className='h-full bg-white flex flex-col p-12 overflow-y-auto'
        >
          {/* Header Section */}
          <div className='mb-8'>
            <h1
              className="font-['Bricolage_Grotesque',_sans-serif] bg-gradient-to-r from-[#f63a9e] to-purple-600 bg-clip-text text-transparent mb-2"
              style={{ fontSize: '40px', lineHeight: '1.1', fontWeight: '700' }}
            >
              Choose Your Print Size
            </h1>
            <p className='text-gray-600'>
              Select the perfect size for your AI-generated artwork
            </p>
          </div>

          <h2
            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-6"
            style={{ fontSize: '24px', fontWeight: '600' }}
          >
            Print Sizes
          </h2>

          <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
            <div className='space-y-4'>
              {printSizes.map(size => (
                <motion.div
                  key={size.id}
                  whileHover={{ scale: 1.02 }}
                  className={`relative flex items-center space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedSize === size.id
                      ? 'border-[#f63a9e] bg-[#f63a9e]/5 shadow-lg'
                      : 'border-gray-200 hover:border-[#f63a9e]/50 bg-gray-50'
                  }`}
                >
                  <RadioGroupItem
                    value={size.id}
                    id={size.id}
                    className='border-2'
                  />
                  <Label
                    htmlFor={size.id}
                    className='flex-1 cursor-pointer flex items-center justify-between'
                  >
                    <div>
                      <p
                        className='text-gray-900'
                        style={{ fontWeight: '600', fontSize: '16px' }}
                      >
                        {size.name}
                      </p>
                      <p className='text-sm text-gray-500'>{size.dimensions}</p>
                    </div>
                    <p
                      className='text-[#f63a9e]'
                      style={{ fontSize: '20px', fontWeight: '700' }}
                    >
                      ${size.price}
                    </p>
                  </Label>
                </motion.div>
              ))}
            </div>
          </RadioGroup>

          {/* Price Summary */}
          <div className='mt-8 pt-8 border-t-2 border-gray-200'>
            <div className='flex items-center justify-between mb-6'>
              <span className='text-gray-600' style={{ fontSize: '15px' }}>
                Selected Size:
              </span>
              <span
                className='text-gray-900'
                style={{ fontWeight: '600', fontSize: '16px' }}
              >
                {selectedSizeData?.name}
              </span>
            </div>
            <div className='flex items-center justify-between mb-8'>
              <span
                className="text-gray-900 font-['Bricolage_Grotesque',_sans-serif]"
                style={{ fontSize: '24px', fontWeight: '600' }}
              >
                Total:
              </span>
              <span
                className="text-[#f63a9e] font-['Bricolage_Grotesque',_sans-serif]"
                style={{ fontSize: '32px', fontWeight: '700' }}
              >
                ${selectedSizeData?.price}
              </span>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-4'>
              <Button
                onClick={handleBack}
                variant='outline'
                className='flex-1 border-2'
                style={{ height: '50px' }}
              >
                <ArrowLeft className='w-5 h-5 mr-2' />
                Back
              </Button>
              <Button
                onClick={handleAddToCart}
                className='flex-1 bg-gradient-to-r from-[#f63a9e] to-purple-600 hover:from-[#e02d8d] hover:to-purple-700 text-white'
                style={{ height: '50px' }}
              >
                <ShoppingCart className='w-5 h-5 mr-2' />
                Add to Cart
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
