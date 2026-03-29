import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  Check,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

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
  fixed_price: number | null;
  active: boolean;
  aspect_ratios?: AspectRatio;
}

interface SizeWithRatio extends Size {
  ratioLabel: string;
  orientation: string;
}

export function AdminSizePricingManager() {
  const navigate = useNavigate();
  const supabase = createClient();

  const [sizes, setSizes] = useState<SizeWithRatio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orientationFilter, setOrientationFilter] = useState<string>('all');
  const [ratioFilter, setRatioFilter] = useState<string>('all');

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sizes')
        .select('*, aspect_ratios(*)')
        .eq('active', true)
        .order('area_in2', { ascending: true });

      if (error) throw error;

      const sizesWithRatio: SizeWithRatio[] = (data || []).map(size => ({
        ...size,
        ratioLabel: size.aspect_ratios?.label || 'Unknown',
        orientation: size.aspect_ratios?.orientation || 'unknown',
      }));

      setSizes(sizesWithRatio);
    } catch (error: any) {
      console.error('Error fetching sizes:', error);
      toast.error('Failed to load sizes');
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = (sizeId: string, value: string) => {
    const numericValue = value === '' ? null : parseFloat(value);
    if (value !== '' && isNaN(numericValue!)) return;

    setSizes(prev =>
      prev.map(size =>
        size.id === sizeId ? { ...size, fixed_price: numericValue } : size
      )
    );
    setHasChanges(true);
  };

  const bulkUpdatePrices = (aspectRatioId: string, basePrice: number) => {
    setSizes(prev =>
      prev.map(size => {
        if (size.aspect_ratio_id === aspectRatioId) {
          // Calculate price based on area relative to smallest size
          const smallestArea = Math.min(
            ...prev
              .filter(s => s.aspect_ratio_id === aspectRatioId)
              .map(s => s.area_in2)
          );
          const multiplier = size.area_in2 / smallestArea;
          return {
            ...size,
            fixed_price: Math.round(basePrice * multiplier * 100) / 100,
          };
        }
        return size;
      })
    );
    setHasChanges(true);
    toast.success(`Bulk updated prices for this ratio`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = sizes.map(size => ({
        id: size.id,
        fixed_price: size.fixed_price,
      }));

      // Update sizes one by one or use a bulk update
      const { error } = await supabase
        .from('sizes')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      toast.success('Fixed pricing updated successfully!');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving prices:', error);
      toast.error('Failed to save pricing: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (
      !confirm(
        'Are you sure you want to reset all prices to null? This will remove all fixed pricing.'
      )
    )
      return;

    setSizes(prev => prev.map(size => ({ ...size, fixed_price: null })));
    setHasChanges(true);
    toast.info('All prices reset to null');
  };

  // Filter sizes
  const filteredSizes = sizes.filter(size => {
    const matchesSearch =
      searchTerm === '' ||
      size.display_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      size.ratioLabel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOrientation =
      orientationFilter === 'all' || size.orientation === orientationFilter;

    const matchesRatio =
      ratioFilter === 'all' || size.aspect_ratio_id === ratioFilter;

    return matchesSearch && matchesOrientation && matchesRatio;
  });

  // Group by aspect ratio for display
  const groupedSizes = filteredSizes.reduce(
    (acc, size) => {
      if (!acc[size.aspect_ratio_id]) {
        acc[size.aspect_ratio_id] = {
          ratioLabel: size.ratioLabel,
          orientation: size.orientation,
          sizes: [],
        };
      }
      acc[size.aspect_ratio_id].sizes.push(size);
      return acc;
    },
    {} as Record<
      string,
      { ratioLabel: string; orientation: string; sizes: SizeWithRatio[] }
    >
  );

  // Get unique aspect ratios for filter
  const aspectRatios = Array.from(
    new Set(sizes.map(s => s.aspect_ratio_id))
  ).map(id => sizes.find(s => s.aspect_ratio_id === id)!);

  const pricedCount = sizes.filter(s => s.fixed_price !== null).length;
  const totalCount = sizes.length;
  const completionRate = Math.round((pricedCount / totalCount) * 100);

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e]' />
          <span className='ml-2 text-gray-600'>Loading size pricing...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <button
            onClick={() => navigate('/admin/settings')}
            className='flex items-center gap-2 text-gray-600 hover:text-[#f63a9e] mb-6 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            Back to Settings
          </button>

          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-4'>
              <div className='w-14 h-14 rounded-2xl bg-[#f63a9e] flex items-center justify-center shadow-lg'>
                <Package className='w-7 h-7 text-white' />
              </div>
              <div>
                <h1
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-1"
                  style={{ fontSize: '32px', fontWeight: '600' }}
                >
                  Size Pricing Manager
                </h1>
                <p className='text-gray-600 text-sm'>
                  Set fixed prices for each size. These prices apply globally to all
                  products.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className='mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-6'>
              <div>
                <div className='text-xs text-gray-600 uppercase font-semibold'>
                  Total Sizes
                </div>
                <div className='text-2xl font-bold text-gray-900'>
                  {totalCount}
                </div>
              </div>
              <div>
                <div className='text-xs text-gray-600 uppercase font-semibold'>
                  Priced
                </div>
                <div className='text-2xl font-bold text-green-600'>
                  {pricedCount}
                </div>
              </div>
              <div>
                <div className='text-xs text-gray-600 uppercase font-semibold'>
                  Completion
                </div>
                <div className='text-2xl font-bold text-[#f63a9e]'>
                  {completionRate}%
                </div>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              {completionRate === 100 && pricedCount > 0 && (
                <div className='flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-sm font-medium'>
                  <Check className='w-4 h-4' />
                  All sizes priced
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='mb-6 rounded-lg border border-gray-200 bg-white p-4'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex-1 min-w-[200px]'>
              <Label className='text-xs font-semibold text-gray-600 mb-1'>
                Search
              </Label>
              <Input
                type='text'
                placeholder='Search by label or ratio...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10'
              />
            </div>
            <div className='w-48'>
              <Label className='text-xs font-semibold text-gray-600 mb-1'>
                Orientation
              </Label>
              <select
                value={orientationFilter}
                onChange={e => setOrientationFilter(e.target.value)}
                className='w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f63a9e]'
              >
                <option value='all'>All Orientations</option>
                <option value='portrait'>Portrait</option>
                <option value='landscape'>Landscape</option>
                <option value='square'>Square</option>
              </select>
            </div>
            <div className='w-48'>
              <Label className='text-xs font-semibold text-gray-600 mb-1'>
                Aspect Ratio
              </Label>
              <select
                value={ratioFilter}
                onChange={e => setRatioFilter(e.target.value)}
                className='w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f63a9e]'
              >
                <option value='all'>All Ratios</option>
                {aspectRatios.map(ratio => (
                  <option key={ratio.id} value={ratio.id}>
                    {ratio.ratioLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className='space-y-6'>
          {Object.entries(groupedSizes).map(([ratioId, group]) => (
            <div
              key={ratioId}
              className='rounded-lg border border-gray-200 bg-white overflow-hidden'
            >
              {/* Header */}
              <div className='border-b border-gray-200 bg-gray-50 px-5 py-3'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='font-semibold text-gray-900'>
                      {group.ratioLabel}
                    </h3>
                    <p className='text-sm text-gray-600 capitalize'>
                      {group.orientation} • {group.sizes.length} sizes
                    </p>
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='text-right'>
                      <div className='text-xs text-gray-600'>Priced</div>
                      <div className='text-sm font-semibold text-gray-900'>
                        {group.sizes.filter(s => s.fixed_price !== null).length} /{' '}
                        {group.sizes.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sizes Grid */}
              <div className='p-5'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                  {group.sizes.map(size => (
                    <div
                      key={size.id}
                      className={`rounded-lg border p-4 transition-all ${
                        size.fixed_price !== null
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className='mb-3'>
                        <div className='font-semibold text-gray-900'>
                          {size.display_label}
                        </div>
                        <div className='text-sm text-gray-600'>
                          {size.width_in}" × {size.height_in}"
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {size.area_in2} sq in
                        </div>
                      </div>

                      <div>
                        <Label className='text-xs font-semibold text-gray-600 mb-1'>
                          Fixed Price (£)
                        </Label>
                        <div className='relative'>
                          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm'>
                            £
                          </span>
                          <Input
                            type='number'
                            min='0'
                            step='0.01'
                            placeholder='0.00'
                            value={size.fixed_price ?? ''}
                            onChange={e => updatePrice(size.id, e.target.value)}
                            className='pl-7 h-9'
                          />
                        </div>
                      </div>

                      {size.fixed_price !== null && (
                        <div className='mt-2 flex items-center gap-1 text-xs text-green-600'>
                          <Check className='w-3 h-3' />
                          <span>Priced</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className='mt-8 flex items-center justify-between border-t border-gray-200 pt-6'>
          <Button
            variant='outline'
            onClick={resetToDefault}
            disabled={saving}
          >
            <X className='w-4 h-4 mr-2' />
            Reset All Prices
          </Button>

          <div className='flex items-center gap-3'>
            {hasChanges && (
              <span className='text-sm text-orange-600 font-medium'>
                You have unsaved changes
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
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
                  Save All Prices
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
