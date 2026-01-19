import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Crop } from 'lucide-react';
import type { CustomSizeSelectorProps } from '../shared/product-3d-view';

interface AspectRatio {
  id: string;
  label: string;
  width_ratio: number;
  height_ratio: number;
  orientation: 'portrait' | 'landscape' | 'square';
  active: boolean;
}

interface Size {
  id: string;
  aspect_ratio_id: string;
  width_in: number;
  height_in: number;
  display_label: string;
  area_in2: number;
  active: boolean;
}

interface Product {
  id: string;
  price: number;
  config: {
    allowedRatios: string[];
    allowedSizes: string[];
  };
}

export function SingleCanvasSizeSelector({
  productId,
  selectedSizeId,
  selectedAspectRatioId,
  onSizeSelect,
  onImageEdit,
}: CustomSizeSelectorProps) {
  const supabase = createClient();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [aspectRatios, setAspectRatios] = useState<AspectRatio[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [sizeTab, setSizeTab] = useState<'recommended' | 'all'>('recommended');

  // Fetch product configuration
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id, price, config')
          .eq('id', productId)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        if (productData?.config?.allowedRatios) {
          // Fetch ALL aspect ratios
          const { data: ratiosData, error: ratiosError } = await supabase
            .from('aspect_ratios')
            .select('*')
            .in('id', productData.config.allowedRatios)
            .eq('active', true)
            .order('label');

          if (ratiosError) throw ratiosError;
          setAspectRatios(ratiosData || []);

          // Fetch ALL sizes
          const { data: sizesData, error: sizesError } = await supabase
            .from('sizes')
            .select('*')
            .in('id', productData.config.allowedSizes)
            .eq('active', true)
            .order('area_in2');

          if (sizesError) throw sizesError;
          setSizes(sizesData || []);
        }
      } catch (error: any) {
        console.error('Error fetching configuration:', error);
        toast.error('Failed to load size options');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  // Get sizes for selected aspect ratio (Recommended tab)
  const getRecommendedSizes = () => {
    if (!selectedAspectRatioId) return [];
    return sizes.filter(s => s.aspect_ratio_id === selectedAspectRatioId);
  };

  // Get all sizes grouped by aspect ratio (All Sizes tab)
  const getAllSizesGrouped = () => {
    const grouped: { [ratioId: string]: { ratio: AspectRatio; sizes: Size[] } } = {};
    
    sizes.forEach(size => {
      const ratio = aspectRatios.find(r => r.id === size.aspect_ratio_id);
      
      if (!grouped[size.aspect_ratio_id] && ratio) {
        grouped[size.aspect_ratio_id] = {
          ratio,
          sizes: []
        };
      }
      
      if (grouped[size.aspect_ratio_id]) {
        grouped[size.aspect_ratio_id].sizes.push(size);
      }
    });
    
    return grouped;
  };

  // Handle size selection with aspect ratio change detection
  const handleSizeClick = (size: Size) => {
    const previousAspectRatioId = selectedAspectRatioId;
    const newAspectRatioId = size.aspect_ratio_id;
    
    // Update selection
    onSizeSelect(size.id, newAspectRatioId, size.width_in, size.height_in);
    
    // Enforce cropping if aspect ratio changed
    if (newAspectRatioId !== previousAspectRatioId && previousAspectRatioId && onImageEdit) {
      toast.info('Aspect ratio changed. Please crop your image to fit the new size.');
      onImageEdit();
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-600">Loading sizes...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-base md:text-lg">Choose your canvas size</h3>
        {onImageEdit && (
          <button
            onClick={onImageEdit}
            className="flex items-center gap-2 text-sm text-[#f63a9e] hover:text-[#e02d8d] transition-colors"
          >
            <Crop className="w-4 h-4" />
            <span>Edit Image</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            sizeTab === 'recommended'
              ? 'bg-[#f63a9e] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setSizeTab('recommended')}
        >
          Recommended
        </button>
        <button
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            sizeTab === 'all'
              ? 'bg-[#f63a9e] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setSizeTab('all')}
        >
          All Sizes
        </button>
      </div>

      {/* Recommended Sizes */}
      {sizeTab === 'recommended' && (
        <div className="space-y-2">
          <Label className="text-xs md:text-sm font-medium text-gray-700">
            Sizes for {aspectRatios.find(r => r.id === selectedAspectRatioId)?.label}
          </Label>
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            {getRecommendedSizes().map((size) => {
              const price = (size.area_in2 * (product?.price || 0)).toFixed(2);
              const isSelected = selectedSizeId === size.id;
              return (
                <button
                  key={size.id}
                  className={`px-3 py-2.5 md:px-4 md:py-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-[#f63a9e] bg-pink-50'
                      : 'border-gray-200 hover:border-[#f63a9e] hover:bg-pink-50'
                  }`}
                  onClick={() => handleSizeClick(size)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm md:text-base ${isSelected ? 'text-[#f63a9e]' : 'text-gray-900'}`}>
                      {size.display_label}
                    </span>
                    <span className="text-[#f63a9e] font-semibold text-sm md:text-base">£{price}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All Sizes - Grouped by Aspect Ratio */}
      {sizeTab === 'all' && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(getAllSizesGrouped()).map(([ratioId, { ratio, sizes: ratioSizes }]) => (
            <div key={ratioId} className="space-y-2">
              <Label className="text-xs md:text-sm font-semibold text-gray-900 flex items-center gap-2">
                {ratio.label}
                {ratioId === selectedAspectRatioId && (
                  <span className="text-xs font-normal text-[#f63a9e] bg-pink-50 px-2 py-0.5 rounded">
                    Current
                  </span>
                )}
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {ratioSizes.map((size) => {
                  const price = (size.area_in2 * (product?.price || 0)).toFixed(2);
                  const isSelected = selectedSizeId === size.id;
                  return (
                    <button
                      key={size.id}
                      className={`px-3 py-2.5 md:px-4 md:py-3 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-[#f63a9e] bg-pink-50'
                          : 'border-gray-200 hover:border-[#f63a9e] hover:bg-pink-50'
                      }`}
                      onClick={() => handleSizeClick(size)}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium text-sm md:text-base ${isSelected ? 'text-[#f63a9e]' : 'text-gray-900'}`}>
                          {size.display_label}
                        </span>
                        <span className="text-[#f63a9e] font-semibold text-sm md:text-base">£{price}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

