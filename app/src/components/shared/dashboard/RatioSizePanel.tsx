import React, { useState, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpload, type SizeData } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';

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

        const fetchedRatios: RatioData[] = ratiosData.response?.results || [];
        const fetchedInches: InchData[] = inchesData.response?.results || [];

        setRatios(fetchedRatios);
        setInches(fetchedInches);

        let defaultRatio: RatioData | null = null;
        let defaultSize: InchData | null = null;

        // Use existing selectedRatio and selectedSize if available
        if (selectedRatio && selectedSize) {
          defaultRatio =
            fetchedRatios.find(r => r.ratio === selectedRatio) || null;
          defaultSize = selectedSize;
        }

        // Fallback to 1:1 smallest size if no current selection
        if (!defaultRatio || !defaultSize) {
          defaultRatio =
            fetchedRatios.find(r => r.ratio === '1:1') ||
            fetchedRatios[0] ||
            null;

          if (defaultRatio) {
            const availableSizes: InchData[] = fetchedInches
              .filter(inch => defaultRatio!.Inches.includes(inch._id))
              .sort((a, b) => a.width * a.height - b.width * b.height);

            defaultSize = availableSizes[0] || null;
          }
        }

        // Set the context
        if (defaultRatio && defaultSize) {
          setSelectedRatio(defaultRatio.ratio);
          setSelectedSize({
            _id: defaultSize._id,
            width: defaultSize.width,
            height: defaultSize.height,
            w: defaultSize.w,
            h: defaultSize.h,
            Slug: defaultSize.Slug,
            sell_price: defaultSize.sell_price,
            actual_price: defaultSize.actual_price,
          });
          onSelectionChange?.(defaultRatio.ratio, defaultSize);
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

      const isDifferentRatio = selectedRatio !== ratioData.ratio;

      setSelectedRatio(ratioData.ratio);
      setSelectedSize(smallest);
      onSelectionChange?.(ratioData.ratio, smallest);

      // Only trigger crop if the ratio actually changed
      if (isDifferentRatio) {
        setSelectedView('crop');
      }
    }
  };

  const handleSizeChange = (ratio: string, size: InchData) => {
    const isDifferentRatio = selectedRatio !== ratio;

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

    // Only trigger crop if ratio or size of another ratio is selected
    if (isDifferentRatio) {
      setSelectedView('crop');
    }
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
              <h3 className='font-semibold text-lg mb-3 text-gray-800'>
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
                      {isSelected && (
                        <Check className='absolute top-3 right-3 text-primary h-5 w-5' />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Summary */}
      {selectedRatio && selectedSize && (
        <div className='border-t pt-4'>
          <div className='bg-gray-50 p-4 rounded-lg space-y-1 text-sm'>
            <h4 className='font-semibold text-gray-800 mb-2'>Canvas Price</h4>
            <div>
              <span className='text-primary font-bold text-lg'>
                ${selectedSize.sell_price.toFixed(2)}
              </span>{' '}
              <span className='line-through text-gray-400'>
                ${selectedSize.actual_price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatioSizePanel;
