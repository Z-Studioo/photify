import React, { useState, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpload, type SizeData } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';

interface RatioData {
  _id: string;
  ratio: string;
  Inches: string[];
  'Created Date': string;
  'Modified Date': string;
  'Created By': string;
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
  'Created Date': string;
  'Modified Date': string;
}

interface RatioSizePanelProps {
  onSelectionChange?: (ratio: string, size: InchData | null) => void;
}

const RatioSizePanel: React.FC<RatioSizePanelProps> = ({
  onSelectionChange,
}) => {
  const { selectedRatio, setSelectedRatio, selectedSize, setSelectedSize } =
    useUpload();
  const { setSelectedView } = useView();
  const [ratios, setRatios] = useState<RatioData[]>([]);
  const [inches, setInches] = useState<InchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ratios and inches data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Starting API fetch...');

        const [ratiosResponse, inchesResponse] = await Promise.all([
          fetch('https://photify.co/version-923ig/api/1.1/obj/ratios'),
          fetch('https://photify.co/version-923ig/api/1.1/obj/inches'),
        ]);

        console.log(
          'API responses:',
          ratiosResponse.status,
          inchesResponse.status
        );

        if (!ratiosResponse.ok || !inchesResponse.ok) {
          throw new Error(
            `Failed to fetch data: ratios ${ratiosResponse.status}, inches ${inchesResponse.status}`
          );
        }

        const ratiosData = await ratiosResponse.json();
        const inchesData = await inchesResponse.json();

        setRatios(ratiosData.response?.results || []);
        setInches(inchesData.response?.results || []);

        console.log(
          'Fetched ratios:',
          ratiosData.response?.results?.length || 0
        );
        console.log(
          'Fetched inches:',
          inchesData.response?.results?.length || 0
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get available sizes for selected ratio
  const getAvailableSizes = (ratioData: RatioData): InchData[] => {
    if (!ratioData.Inches) return [];

    return inches.filter(inch => ratioData.Inches.includes(inch._id));
  };

  const handleRatioChange = (ratio: RatioData) => {
    setSelectedRatio(ratio.ratio);
    setSelectedSize(null);
    onSelectionChange?.(ratio.ratio, null);
    setSelectedView('crop');
  };

  const handleSizeChange = (size: InchData) => {
    // Convert InchData to SizeData format for context
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
    onSelectionChange?.(selectedRatio || '', size);
  };

  const calculateDiscount = (
    actualPrice: number,
    sellPrice: number
  ): number => {
    return Math.round(((actualPrice - sellPrice) / actualPrice) * 100);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-6 w-6 animate-spin' />
        <span className='ml-2'>Loading sizes...</span>
      </div>
    );
  }

  if (error) {
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
  }

  const selectedRatioData = ratios.find(r => r.ratio === selectedRatio);
  const availableSizes = selectedRatioData
    ? getAvailableSizes(selectedRatioData)
    : [];

  return (
    <div className='p-4 space-y-6'>
      {/* Ratio Selection */}
      <div className='space-y-3'>
        <h3 className='font-semibold text-lg'>Select Ratio</h3>
        <div className='grid grid-cols-2 gap-3'>
          {ratios.map(ratio => (
            <button
              key={ratio._id}
              onClick={() => handleRatioChange(ratio)}
              className={`p-4 border-2 rounded-lg transition-all text-center ${
                selectedRatio === ratio.ratio
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className='font-semibold'>{ratio.ratio}</div>
              <div className='text-sm text-gray-600 mt-1'>
                {ratio.ratio.includes(':')
                  ? `${ratio.ratio.split(':')[0]} × ${ratio.ratio.split(':')[1]}`
                  : ratio.ratio}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Size Selection */}
      {selectedRatio && (
        <div className='space-y-3'>
          <h3 className='font-semibold text-lg'>Select Size</h3>
          {availableSizes.length > 0 ? (
            <div className='space-y-2'>
              {availableSizes.map(size => {
                const discount = calculateDiscount(
                  size.actual_price,
                  size.sell_price
                );
                return (
                  <button
                    key={size._id}
                    onClick={() => handleSizeChange(size)}
                    className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                      selectedSize?._id === size._id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <div className='font-semibold'>
                          {size.width}" × {size.height}"
                        </div>
                        <div className='text-sm text-gray-600'>{size.Slug}</div>
                      </div>
                      <div className='text-right'>
                        <div className='font-bold text-primary'>
                          ${size.sell_price.toFixed(2)}
                        </div>
                        {discount > 0 && (
                          <div className='text-sm'>
                            <span className='line-through text-gray-500'>
                              ${size.actual_price.toFixed(2)}
                            </span>
                            <span className='ml-2 text-green-600 font-medium'>
                              {discount}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                      {selectedSize?._id === size._id && (
                        <Check className='h-5 w-5 text-primary ml-2' />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className='text-gray-500 text-center py-4'>
              No sizes available for this ratio
            </p>
          )}
        </div>
      )}

      {/* Selection Summary */}
      {selectedRatio && selectedSize && (
        <div className='border-t pt-4'>
          <div className='bg-gray-50 p-4 rounded-lg'>
            <h4 className='font-semibold mb-2'>Selected Configuration</h4>
            <div className='space-y-1 text-sm'>
              <div>
                Ratio: <span className='font-medium'>{selectedRatio}</span>
              </div>
              <div>
                Size:{' '}
                <span className='font-medium'>
                  {selectedSize.width}" × {selectedSize.height}"
                </span>
              </div>
              <div>
                Price:{' '}
                <span className='font-medium text-primary'>
                  ${selectedSize.sell_price.toFixed(2)}
                </span>
              </div>
              {calculateDiscount(
                selectedSize.actual_price,
                selectedSize.sell_price
              ) > 0 && (
                <div className='text-green-600'>
                  You save $
                  {(
                    selectedSize.actual_price - selectedSize.sell_price
                  ).toFixed(2)}
                  !
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatioSizePanel;
