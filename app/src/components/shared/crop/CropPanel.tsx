import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpload, type SizeData } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import { AspectRatioIcon } from '../common/icons';

interface RatioData {
  _id: string;
  ratio: string;
  Inches: string[];
}

interface InchData {
  _id: string;
  width: number;
  height: number;
  w: number;
  h: number;
  Slug: string;
  sell_price: number;
  actual_price: number;
}

interface CropPanelProps {
  onSelectionChange?: (ratio: string, size: InchData | null) => void;
}

const CropPanel: React.FC<CropPanelProps> = ({ onSelectionChange }) => {
  const { selectedRatio, setSelectedRatio, selectedSize, setSelectedSize } =
    useUpload();
  const { setSelectedView } = useView();

  const [ratios, setRatios] = useState<RatioData[]>([]);
  const [inches, setInches] = useState<InchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ratios and sizes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [ratiosResponse, inchesResponse] = await Promise.all([
          fetch('https://photify.co/version-923ig/api/1.1/obj/ratios'),
          fetch('https://photify.co/version-923ig/api/1.1/obj/inches'),
        ]);

        if (!ratiosResponse.ok || !inchesResponse.ok)
          throw new Error('Failed to fetch ratio or size data.');

        const ratiosData = await ratiosResponse.json();
        const inchesData = await inchesResponse.json();

        const fetchedRatios = ratiosData.response?.results || [];
        const fetchedInches = inchesData.response?.results || [];

        setRatios(fetchedRatios);
        setInches(fetchedInches);

        // Default selection: 1:1 smallest size
        const defaultRatio =
          fetchedRatios.find((r: RatioData) => r.ratio === '1:1') ||
          fetchedRatios[0];
        if (defaultRatio) {
          const available: InchData[] = fetchedInches
            .filter((inch: InchData) => defaultRatio.Inches.includes(inch._id))
            .sort(
              (a: InchData, b: InchData) =>
                a.width * a.height - b.width * b.height
            );

          const smallest = available[0] || null;

          if (smallest) {
            setSelectedRatio(defaultRatio.ratio);
            setSelectedSize(smallest);
            onSelectionChange?.(defaultRatio.ratio, smallest);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateDiscount = (actual: number, sell: number) =>
    Math.round(((actual - sell) / actual) * 100);

  // Get available sizes for ratio
  const getAvailableSizes = (ratioData: RatioData): InchData[] => {
    if (!ratioData?.Inches) return [];
    return inches
      .filter(inch => ratioData.Inches.includes(inch._id))
      .sort((a, b) => a.width * a.height - b.width * b.height);
  };

  const handleRatioClick = (ratioData: RatioData) => {
    const available = getAvailableSizes(ratioData);
    if (available.length > 0) {
      const smallest = available[0];
      setSelectedRatio(ratioData.ratio);
      setSelectedSize(smallest);
      onSelectionChange?.(ratioData.ratio, smallest);
      setSelectedView('crop');
    }
  };

  const handleSizeChange = (ratio: string, size: InchData) => {
    setSelectedRatio(ratio);
    const sizeData: SizeData = {
      _id: size._id,
      width: size.width,
      height: size.height,
      w: size.w,
      h: size.h,
      Slug: size.Slug,
      sell_price: size.sell_price,
      actual_price: size.actual_price,
    };
    setSelectedSize(sizeData);
    onSelectionChange?.(ratio, size);
    setSelectedView('crop');
  };

  if (loading)
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <Loader2 className='h-6 w-6 animate-spin text-primary' />
        <p className='text-gray-600 mt-3 text-sm'>Loading canvas options...</p>
      </div>
    );

  if (error)
    return (
      <div className='p-4 text-center text-red-600'>
        <p>Error loading data: {error}</p>
        <Button
          variant='outline'
          className='mt-2'
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  console.log(selectedRatio, selectedSize);
  return (
    <div className='py-6 space-y-6'>
      <h2 className='text-xl font-semibold text-gray-800 mb-2'>
        Customize Image
      </h2>

      {/* Horizontal scroll of ratios */}
      <div className='flex overflow-x-auto gap-3 pb-2'>
        {ratios.map(ratio => (
          <button
            key={ratio._id}
            onClick={() => handleRatioClick(ratio)}
            className={`px-4 py-2 rounded-full whitespace-nowrap border-2 transition-all ${
              selectedRatio === ratio.ratio
                ? 'border-primary bg-primary text-white'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {ratio.ratio}
          </button>
        ))}
      </div>

      {/* Show all sizes for all ratios */}
      <div className='space-y-6'>
        {ratios.map(ratio => {
          const sizes = getAvailableSizes(ratio);
          if (sizes.length === 0) return null;

          return (
            <div key={ratio._id}>
              <h3 className='flex items-center gap-2 font-semibold text-lg mb-3 text-gray-800 ml-4'>
                <AspectRatioIcon ratio={ratio.ratio} />
                {ratio.ratio}
              </h3>

              <div className='grid gap-3'>
                {sizes.map(size => {
                  const discount = calculateDiscount(
                    size.actual_price,
                    size.sell_price
                  );
                  const isSelected =
                    selectedRatio === ratio.ratio &&
                    selectedSize?._id === size._id;

                  return (
                    <button
                      key={size._id}
                      onClick={() => handleSizeChange(ratio.ratio, size)}
                      className={`relative p-4 border-2 rounded-xl text-left transition-all w-full ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className='flex justify-between items-start'>
                        <div>
                          <div className='font-semibold text-gray-800'>
                            {size.width}" × {size.height}"
                          </div>
                          <div className='text-sm text-gray-500'>
                            {size.Slug}
                          </div>
                          {discount > 0 && (
                            <div className='text-green-600 text-sm mt-1 font-medium'>
                              Save {discount}% ($
                              {(size.actual_price - size.sell_price).toFixed(2)}
                              )
                            </div>
                          )}
                        </div>
                        <div className='text-right'>
                          <div className='font-bold text-primary'>
                            ${size.sell_price.toFixed(2)}
                          </div>
                          {discount > 0 && (
                            <div className='text-gray-400 text-sm line-through'>
                              ${size.actual_price.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CropPanel;
