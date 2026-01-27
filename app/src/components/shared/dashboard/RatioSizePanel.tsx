import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpload } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';
import { AspectRatioIcon } from '../common/icons';
import {
  fetchRatios,
  getAllPrintSizes,
  type InchData,
  type RatioData,
} from '@/utils/ratio-sizes';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface RatioSizePanelProps {
  onSelectionChange?: (ratio: string, size: InchData | null) => void;
}

const RatioSizePanel: React.FC<RatioSizePanelProps> = ({
  onSelectionChange,
}) => {
  const {
    selectedRatio,
    setSelectedRatio,
    selectedSize,
    setSelectedSize,
    selectedProduct,
  } = useUpload();

  const { setSelectedView } = useView();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [ratios, setRatios] = useState<RatioData[]>([]);
  const [inches, setInches] = useState<InchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch ratios + sizes
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchRatios();
        setRatios(data);
        setInches(getAllPrintSizes(data));
      } catch (e: any) {
        toast.error('Failed to load ratios');
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Default selection
  useEffect(() => {
    if (!ratios.length) return;

    const ratio =
      ratios.find(r => r.label === selectedRatio) ||
      ratios.find(r => r.label === '1:1') ||
      ratios[0];

    if (!ratio) return;

    const sizes = inches
      .filter(i => ratio.sizes.includes(i))
      .sort((a, b) => a.area_in2 - b.area_in2);

    const smallest = sizes[0] ?? null;

    if (!selectedRatio) setSelectedRatio(ratio.label);
    if (!selectedSize && smallest) setSelectedSize(smallest);

    onSelectionChange?.(ratio.label, smallest);
  }, [ratios]);

  const handleRatioClick = (ratio: RatioData) => {
    const sizes = inches
      .filter(i => ratio.sizes.includes(i))
      .sort((a, b) => a.area_in2 - b.area_in2);

    const smallest = sizes[0] ?? null;

    setSelectedRatio(ratio.label);
    setSelectedSize(smallest);
    onSelectionChange?.(ratio.label, smallest);
    setSelectedView('crop');

    sectionRefs.current[ratio.id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleSizeClick = (size: InchData) => {
    setSelectedSize(size);
    onSelectionChange?.(selectedRatio!, size);
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
        <p>{error.message}</p>
        <Button
          variant='outline'
          className='mt-2'
          onClick={() => location.reload()}
        >
          Retry
        </Button>
      </div>
    );

  const currentRatio = ratios.find(r => r.label === selectedRatio);
  const sizes =
    currentRatio?.sizes
      .map(s => inches.find(i => i.id === s.id))
      .filter(Boolean) ?? [];

  return (
    <>
      {/* Ratio Selector */}
      <div className='border-b bg-white sticky top-0 z-10'>
        <div className='flex overflow-x-auto gap-2 px-3 py-3 scrollbar-hide'>
          {ratios.map(ratio => {
            const active = selectedRatio === ratio.label;
            if(ratio.sizes.length === 0) return null;
            return (
              <button
                key={ratio.id}
                onClick={() => handleRatioClick(ratio)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  active
                    ? 'bg-primary text-white shadow'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <AspectRatioIcon ratio={ratio.label} />
                {ratio.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizes */}
      <div className='p-4 space-y-3 bg-gray-50'>
        {sizes.map(size => {
          const isSelected = selectedSize?.id === size?.id;
          const price = selectedProduct
            ? (+selectedProduct.price * size!.area_in2).toFixed(2)
            : '0.00';

          return (
            <motion.button
              key={size!.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSizeClick(size!)}
              className={`w-full p-4 rounded-xl text-left transition border-2 ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'bg-white border-gray-100 hover:border-primary/40'
              }`}
            >
              <div className='flex justify-between items-center'>
                <div>
                  <div className='font-bold text-gray-900'>
                    {size!.width_in}" × {size!.height_in}"
                  </div>
                  <div className='text-xs text-gray-500'>
                    {size!.display_label}
                  </div>
                </div>
                <div className='font-bold text-lg text-primary'>${price}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </>
  );
};

export default RatioSizePanel;
