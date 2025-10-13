import { useState } from 'react';

const AcrylicGlass = () => {
  const [glassThickness, setGlassThickness] = useState(0.08);

  const products = [
    {
      image:
        'https://swap-configurator-assets.whitewall.com/option/sealingGlass/21.webp',
      title: 'Acrylic glass',
      specs: '0.08", glossy',
      value: 0.08,
    },
    {
      image:
        'https://swap-configurator-assets.whitewall.com/option/sealingGlass/1012.webp',
      title: 'Acrylic glass',
      specs: '0.16", glossy',
      value: 0.16,
    },
    {
      image:
        'https://swap-configurator-assets.whitewall.com/option/sealingGlass/22.webp',
      title: 'Acrylic glass',
      specs: '0.24", glossy',
      value: 0.24,
    },
  ];

  const handleGlassThickness = (value: number) => {
    setGlassThickness(value);
  };

  return (
    <div className='w-full h-auto px-4 py-6 overflow-x-hidden'>
      {/* Desktop: 3 columns */}
      <div className='hidden lg:grid grid-cols-3 gap-6 max-w-4xl mx-auto'>
        {products.map((product, index) => (
          <div
            key={index}
            className={`flex flex-col items-center gap-3 cursor-pointer transition-all rounded-xl p-3 ${
              glassThickness === product.value
                ? 'bg-pink-50 border-2 border-pink-500'
                : 'hover:bg-gray-100 border-2 border-transparent'
            }`}
            onClick={() => handleGlassThickness(product.value)}
          >
            <div className='w-full aspect-square flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden'>
              <img
                src={product.image}
                alt={`${product.title} ${product.specs}`}
                className='w-full h-full object-contain'
              />
            </div>
            <div className='text-center'>
              <p className='font-medium text-gray-900'>{product.title}</p>
              <p className='text-sm text-gray-600'>{product.specs}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet: 2 columns (now interactive like desktop) */}
      <div className='hidden md:grid lg:hidden grid-cols-2 gap-6 max-w-2xl mx-auto'>
        {products.map((product, index) => (
          <div
            key={index}
            className={`flex flex-col items-center gap-3 cursor-pointer transition-all rounded-xl p-3 ${
              glassThickness === product.value
                ? 'bg-pink-50 border-2 border-pink-500'
                : 'hover:bg-gray-100 border-2 border-transparent'
            }`}
            onClick={() => handleGlassThickness(product.value)}
          >
            <div className='w-full aspect-square flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden'>
              <img
                src={product.image}
                alt={`${product.title} ${product.specs}`}
                className='w-full h-full object-contain'
              />
            </div>
            <div className='text-center'>
              <p className='font-medium text-gray-900'>{product.title}</p>
              <p className='text-sm text-gray-600'>{product.specs}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: 1 column with horizontal layout */}
      <div className='md:hidden flex flex-col gap-4'>
        {products.map((product, index) => (
          <div
            key={index}
            className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${
              glassThickness === product.value
                ? 'bg-pink-50 border-2 border-pink-500'
                : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => handleGlassThickness(product.value)}
          >
            <div className='w-24 h-24 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden'>
              <img
                src={product.image}
                alt={`${product.title} ${product.specs}`}
                className='w-full h-full object-contain'
              />
            </div>
            <div className='flex flex-col justify-center'>
              <p className='font-medium text-gray-900'>{product.title}</p>
              <p className='text-sm text-gray-600'>{product.specs}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcrylicGlass;
