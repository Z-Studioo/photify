import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ProductConfigEditorProps {
  productId: string;
  productType: 'canvas' | 'framed_canvas' | 'metal_print';
  currentConfig: any;
  onSave?: (config: any) => void;
}

interface AspectRatio {
  id: string;
  label: string;
  width_ratio: number;
  height_ratio: number;
  orientation: string;
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
  aspect_ratios?: AspectRatio;
}

export function AdminProductConfigEditor({
  productId,
  productType,
  currentConfig,
  onSave,
}: ProductConfigEditorProps) {
  const [config, setConfig] = useState(currentConfig || {});
  const [aspectRatios, setAspectRatios] = useState<AspectRatio[]>([]);
  const [allSizes, setAllSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  // Fetch aspect ratios and sizes from database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch aspect ratios
        const { data: ratios, error: ratiosError } = await supabase
          .from('aspect_ratios')
          .select('*')
          .eq('active', true)
          .order('label');

        if (ratiosError) throw ratiosError;

        // Fetch sizes with their aspect ratios
        const { data: sizes, error: sizesError } = await supabase
          .from('sizes')
          .select('*, aspect_ratios(*)')
          .eq('active', true)
          .order('area_in2');

        if (sizesError) throw sizesError;

        setAspectRatios(ratios || []);
        setAllSizes(sizes || []);

        // Initialize config if empty
        if (!currentConfig || Object.keys(currentConfig).length === 0) {
          setConfig({
            allowedRatios: [],
            allowedSizes: [],
          });
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load configuration data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const toggleRatio = (ratioId: string) => {
    const allowedRatios = config.allowedRatios || [];
    const isIncluded = allowedRatios.includes(ratioId);

    const updatedRatios = isIncluded
      ? allowedRatios.filter((id: string) => id !== ratioId)
      : [...allowedRatios, ratioId];

    // Remove sizes that belong to deselected ratios
    const updatedSizes = isIncluded
      ? (config.allowedSizes || []).filter((sizeId: string) => {
          const size = allSizes.find(s => s.id === sizeId);
          return size && updatedRatios.includes(size.aspect_ratio_id);
        })
      : config.allowedSizes || [];

    setConfig({
      ...config,
      allowedRatios: updatedRatios,
      allowedSizes: updatedSizes,
    });
  };

  const toggleSize = (sizeId: string) => {
    const allowedSizes = config.allowedSizes || [];
    const isIncluded = allowedSizes.includes(sizeId);

    setConfig({
      ...config,
      allowedSizes: isIncluded
        ? allowedSizes.filter((id: string) => id !== sizeId)
        : [...allowedSizes, sizeId],
    });
  };

  const selectAllSizesForRatio = (ratioId: string) => {
    const sizesForRatio = allSizes
      .filter(size => size.aspect_ratio_id === ratioId)
      .map(size => size.id);

    const currentSizes = config.allowedSizes || [];
    const allSelected = sizesForRatio.every((id: string) =>
      currentSizes.includes(id)
    );

    const updatedSizes = allSelected
      ? currentSizes.filter((id: string) => !sizesForRatio.includes(id))
      : [...new Set([...currentSizes, ...sizesForRatio])];

    setConfig({
      ...config,
      allowedSizes: updatedSizes,
    });
  };

  const handleSave = async () => {
    // Validate config
    if (!config.allowedRatios || config.allowedRatios.length === 0) {
      toast.error('Please select at least one aspect ratio');
      return;
    }

    if (!config.allowedSizes || config.allowedSizes.length === 0) {
      toast.error('Please select at least one size');
      return;
    }

    setSaving(true);
    try {
      // First, fetch the current config to preserve other properties (like configurerType)
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('config')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      // Merge with current config to preserve other properties
      const mergedConfig = {
        ...(currentProduct?.config || {}),
        ...config,
        version: (currentProduct?.config?.version || 0) + 1,
      };

      const updateData = {
        config: mergedConfig,
        config_status: 'active',
        config_version: mergedConfig.version,
        config_updated_at: new Date().toISOString(),
      };

      // Update database
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select();

      if (error) throw error;

      toast.success('Configuration saved successfully');
      if (onSave) onSave(mergedConfig);
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getSizesCountForRatio = (ratioId: string) => {
    return allSizes.filter(size => size.aspect_ratio_id === ratioId).length;
  };

  const getSelectedSizesCountForRatio = (ratioId: string) => {
    const sizesForRatio = allSizes
      .filter(size => size.aspect_ratio_id === ratioId)
      .map(size => size.id);
    return sizesForRatio.filter(id => (config.allowedSizes || []).includes(id))
      .length;
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e]' />
        <span className='ml-2 text-gray-600'>Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Product Type Badge */}
      <div>
        <Label className='text-sm text-gray-600'>Product Type</Label>
        <div className='mt-2'>
          <span className='inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-700'>
            {productType === 'canvas' && 'Canvas Print'}
            {productType === 'framed_canvas' && 'Framed Canvas'}
            {productType === 'metal_print' && 'Metal Print'}
          </span>
        </div>
      </div>

      <Separator />

      {/* Aspect Ratios Selection */}
      <div>
        <div className='mb-4'>
          <h3 className='text-lg font-semibold mb-1'>Aspect Ratios</h3>
          <p className='text-sm text-gray-600'>
            Select which aspect ratios are available for this product
          </p>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {aspectRatios.map(ratio => {
            const isSelected = config.allowedRatios?.includes(ratio.id);
            const sizesCount = getSizesCountForRatio(ratio.id);
            const selectedSizesCount = getSelectedSizesCountForRatio(ratio.id);

            return (
              <div
                key={ratio.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-[#f63a9e] bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleRatio(ratio.id)}
              >
                <div className='font-semibold text-gray-900'>{ratio.label}</div>
                <div className='text-sm text-gray-600 capitalize mt-1'>
                  {ratio.orientation}
                </div>
                <div className='text-xs text-gray-500 mt-2'>
                  {isSelected && selectedSizesCount > 0
                    ? `${selectedSizesCount} of ${sizesCount} sizes selected`
                    : `${sizesCount} sizes available`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Sizes Selection */}
      <div>
        <div className='mb-4'>
          <h3 className='text-lg font-semibold mb-1'>Available Sizes</h3>
          <p className='text-sm text-gray-600'>
            Select specific sizes for the selected aspect ratios
            {config.allowedRatios?.length === 0 &&
              ' (Select aspect ratios first)'}
          </p>
        </div>

        {config.allowedRatios?.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            Please select at least one aspect ratio to see available sizes
          </div>
        ) : (
          <div className='space-y-6'>
            {config.allowedRatios?.map((ratioId: string) => {
              const ratio = aspectRatios.find(r => r.id === ratioId);
              const sizesForRatio = allSizes.filter(
                size => size.aspect_ratio_id === ratioId
              );
              const allSelected = sizesForRatio.every(size =>
                (config.allowedSizes || []).includes(size.id)
              );

              if (!ratio) return null;

              return (
                <div key={ratioId} className='border rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-4'>
                    <div>
                      <h4 className='font-semibold text-gray-900'>
                        {ratio.label}
                      </h4>
                      <p className='text-sm text-gray-600'>
                        {getSelectedSizesCountForRatio(ratioId)} of{' '}
                        {sizesForRatio.length} selected
                      </p>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => selectAllSizesForRatio(ratioId)}
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
                    {sizesForRatio.map(size => {
                      const isSelected = (config.allowedSizes || []).includes(
                        size.id
                      );

                      return (
                        <div
                          key={size.id}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                            isSelected
                              ? 'border-[#f63a9e] bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleSize(size.id)}
                        >
                          <div className='font-medium text-sm'>
                            {size.display_label}
                          </div>
                          <div className='text-xs text-gray-500 mt-1'>
                            {size.area_in2} sq in
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Summary */}
      <div className='bg-gray-50 rounded-lg p-4'>
        <h4 className='font-semibold mb-2'>Configuration Summary</h4>
        <div className='space-y-1 text-sm text-gray-700'>
          <p>
            <span className='font-medium'>Aspect Ratios:</span>{' '}
            {config.allowedRatios?.length || 0} selected
          </p>
          <p>
            <span className='font-medium'>Sizes:</span>{' '}
            {config.allowedSizes?.length || 0} selected
          </p>
          <p>
            <span className='font-medium'>Status:</span>{' '}
            {config.allowedRatios?.length > 0 &&
            config.allowedSizes?.length > 0 ? (
              <span className='text-green-600'>Ready to activate</span>
            ) : (
              <span className='text-yellow-600'>Incomplete configuration</span>
            )}
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className='flex justify-end gap-3 pt-6 border-t'>
        <Button
          variant='outline'
          onClick={() => window.history.back()}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={
            saving ||
            !config.allowedRatios?.length ||
            !config.allowedSizes?.length
          }
          className='bg-[#f63a9e] hover:bg-[#e02d8d]'
        >
          {saving ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <Save className='w-4 h-4 mr-2' />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
