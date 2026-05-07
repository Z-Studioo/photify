import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2, Lock, PencilLine, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  getConfigurerById,
  getSupportedAspectRatioKeys,
  getRequiredAspectRatioKeys,
  ratioKey,
} from '@/lib/configures/registry';

interface ProductConfigEditorProps {
  productId: string;
  productType: 'canvas' | 'framed_canvas' | 'metal_print';
  /**
   * Configurer currently attached to this product (from `products.config.configurerType`).
   * When set and the configurer declares `supportedAspectRatios`, the ratio list is
   * filtered accordingly so the admin doesn't configure ratios the customer will
   * never see.
   */
  configurerType?: string | null;
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
  configurerType,
  currentConfig,
  onSave,
}: ProductConfigEditorProps) {
  const [config, setConfig] = useState(currentConfig || {});
  const [aspectRatios, setAspectRatios] = useState<AspectRatio[]>([]);
  const [allSizes, setAllSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /** When false, ratio/size toggles and price fields are read-only to avoid accidental edits */
  const [aspectSectionUnlocked, setAspectSectionUnlocked] = useState(false);
  const supabase = createClient();

  // Configurer-driven filtering: when a configurer declares the ratios it
  // supports, hide unrelated ones from the admin UI to avoid pointless config.
  const supportedRatioKeys = useMemo(
    () => getSupportedAspectRatioKeys(configurerType),
    [configurerType]
  );
  const requiredRatioKeys = useMemo(
    () => getRequiredAspectRatioKeys(configurerType),
    [configurerType]
  );
  const configurerMeta = useMemo(
    () => (configurerType ? getConfigurerById(configurerType) : null),
    [configurerType]
  );

  const isRatioSupported = (ratio: AspectRatio): boolean => {
    if (!supportedRatioKeys) return true;
    return supportedRatioKeys.includes(ratioKey(ratio));
  };

  // Aspect ratios visible in the UI given the current configurer restriction.
  // Non-supported ratios are simply not rendered — they have no effect on the
  // customer flow and showing them is confusing.
  const visibleAspectRatios = useMemo(
    () => aspectRatios.filter(isRatioSupported),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aspectRatios, supportedRatioKeys]
  );

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
            sizePrices: {},
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

  // When the configurer restricts ratios, auto-prune any stored ratios/sizes/prices
  // that no longer belong to the allowed set. This prevents orphaned config from
  // lingering after a configurer switch and keeps the summary counters honest.
  // Nothing is persisted until the admin clicks Save, so this is a safe in-memory clean-up.
  useEffect(() => {
    if (loading) return;
    if (!supportedRatioKeys) return;
    if (aspectRatios.length === 0) return;

    const allowedRatioIdSet = new Set(
      aspectRatios.filter(isRatioSupported).map(r => r.id)
    );

    const currentAllowedRatios: string[] = config.allowedRatios || [];
    const prunedRatios = currentAllowedRatios.filter(id =>
      allowedRatioIdSet.has(id)
    );

    const sizeRatioMap = new Map(allSizes.map(s => [s.id, s.aspect_ratio_id]));
    const currentAllowedSizes: string[] = config.allowedSizes || [];
    const prunedSizes = currentAllowedSizes.filter(sizeId => {
      const ratioId = sizeRatioMap.get(sizeId);
      return ratioId != null && allowedRatioIdSet.has(ratioId);
    });

    const prunedSizeSet = new Set(prunedSizes);
    const currentSizePrices: Record<string, number> = config.sizePrices || {};
    const prunedSizePrices = Object.fromEntries(
      Object.entries(currentSizePrices).filter(([sizeId]) =>
        prunedSizeSet.has(sizeId)
      )
    );

    const ratiosChanged = prunedRatios.length !== currentAllowedRatios.length;
    const sizesChanged = prunedSizes.length !== currentAllowedSizes.length;
    const pricesChanged =
      Object.keys(prunedSizePrices).length !==
      Object.keys(currentSizePrices).length;

    if (ratiosChanged || sizesChanged || pricesChanged) {
      setConfig({
        ...config,
        allowedRatios: prunedRatios,
        allowedSizes: prunedSizes,
        sizePrices: prunedSizePrices,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, supportedRatioKeys, aspectRatios, allSizes]);

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
    const currentSizePrices = config.sizePrices || {};
    const updatedSizePrices = Object.fromEntries(
      Object.entries(currentSizePrices).filter(([sizeId]) =>
        updatedSizes.includes(sizeId)
      )
    );

    setConfig({
      ...config,
      allowedRatios: updatedRatios,
      allowedSizes: updatedSizes,
      sizePrices: updatedSizePrices,
    });
  };

  const toggleSize = (sizeId: string) => {
    const allowedSizes = config.allowedSizes || [];
    const isIncluded = allowedSizes.includes(sizeId);
    const currentSizePrices = config.sizePrices || {};
    const updatedSizePrices = { ...currentSizePrices };
    if (isIncluded) {
      delete updatedSizePrices[sizeId];
    }

    setConfig({
      ...config,
      allowedSizes: isIncluded
        ? allowedSizes.filter((id: string) => id !== sizeId)
        : [...allowedSizes, sizeId],
      sizePrices: updatedSizePrices,
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
    const currentSizePrices = config.sizePrices || {};
    const updatedSizePrices = Object.fromEntries(
      Object.entries(currentSizePrices).filter(([sizeId]) =>
        updatedSizes.includes(sizeId)
      )
    );

    setConfig({
      ...config,
      allowedSizes: updatedSizes,
      sizePrices: updatedSizePrices,
    });
  };

  const updateSizePrice = (sizeId: string, value: string) => {
    const currentSizePrices = config.sizePrices || {};
    if (value === '') {
      const updatedSizePrices = { ...currentSizePrices };
      delete updatedSizePrices[sizeId];
      setConfig({
        ...config,
        sizePrices: updatedSizePrices,
      });
      return;
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return;

    setConfig({
      ...config,
      sizePrices: {
        ...currentSizePrices,
        [sizeId]: numericValue,
      },
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

    const missingPriceCount = (config.allowedSizes || []).filter(
      (sizeId: string) => {
        const price = config.sizePrices?.[sizeId];
        return typeof price !== 'number' || price <= 0;
      }
    ).length;

    if (missingPriceCount > 0) {
      toast.error(
        `Please add a valid price for all selected sizes (${missingPriceCount} missing)`
      );
      return;
    }

    // Configurer-required ratio validation: if the attached configurer locks
    // the customer onto specific ratios (e.g. collage templates), every one of
    // those ratios must have at least one priced size — otherwise picking the
    // corresponding template in the customizer would hit a dead end.
    if (requiredRatioKeys && requiredRatioKeys.length > 0) {
      const allowedRatioById = new Map(aspectRatios.map(r => [r.id, r]));
      const priceBySizeId: Record<string, number> = config.sizePrices || {};

      const pricedRatioKeys = new Set<string>();
      for (const sizeId of config.allowedSizes || []) {
        const size = allSizes.find(s => s.id === sizeId);
        if (!size) continue;
        const ratio = allowedRatioById.get(size.aspect_ratio_id);
        if (!ratio) continue;
        const price = priceBySizeId[sizeId];
        if (typeof price === 'number' && price > 0) {
          pricedRatioKeys.add(ratioKey(ratio));
        }
      }

      const missingRatios = requiredRatioKeys.filter(
        key => !pricedRatioKeys.has(key)
      );

      if (missingRatios.length > 0) {
        const configurerName = configurerMeta?.name ?? 'this configurator';
        toast.error(
          `${configurerName} needs at least one priced size for each of: ${missingRatios.join(
            ', '
          )}. Customers picking a template with one of these ratios would otherwise have no size to choose.`
        );
        return;
      }
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

      // Merge with current config to preserve other properties.
      // IMPORTANT: only override the fields this editor actually owns
      // (allowedRatios / allowedSizes / sizePrices). Spreading the entire
      // local `config` would clobber fields owned elsewhere — most notably
      // `configurerType`, which is written by the configurer selector above
      // — with whatever stale value this component happened to mount with.
      const mergedConfig = {
        ...(currentProduct?.config || {}),
        allowedRatios: config.allowedRatios ?? [],
        allowedSizes: config.allowedSizes ?? [],
        sizePrices: config.sizePrices ?? {},
        version: (currentProduct?.config?.version || 0) + 1,
      };

      const updateData = {
        config: mergedConfig,
        config_status: 'active',
        config_version: mergedConfig.version,
        config_updated_at: new Date().toISOString(),
      };

      // Update database
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select();

      if (error) throw error;

      toast.success('Configuration saved successfully');
      setAspectSectionUnlocked(false);
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
    <div className='space-y-6'>
      {/* Product Type Badge */}
      <div className='rounded-lg border border-gray-200 bg-gray-50 px-4 py-3'>
        <Label className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
          Product Type
        </Label>
        <div className='mt-2'>
          <span className='inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-800 border border-gray-200'>
            {productType === 'canvas' && 'Canvas Print'}
            {productType === 'framed_canvas' && 'Framed Canvas'}
            {productType === 'metal_print' && 'Metal Print'}
          </span>
        </div>
      </div>

      {/* Aspect Ratios Selection */}
      <div
        className={`rounded-lg border bg-white p-5 transition-colors ${
          aspectSectionUnlocked
            ? 'border-gray-200'
            : 'border-gray-200 ring-1 ring-gray-100'
        }`}
      >
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0 flex-1'>
            <h3 className='mb-1 text-lg font-semibold'>Aspect Ratios & Sizes</h3>
            <p className='text-sm text-gray-600'>
              Enable a ratio to configure its available sizes
            </p>
            {!aspectSectionUnlocked && (
              <p className='mt-2 text-xs text-gray-500'>
                Section is locked. Click{' '}
                <span className='font-medium text-gray-700'>Edit</span> to
                change ratios, sizes, or prices.
              </p>
            )}
          </div>
          <Button
            type='button'
            variant={aspectSectionUnlocked ? 'outline' : 'default'}
            size='sm'
            className={
              aspectSectionUnlocked
                ? 'shrink-0 border-gray-300'
                : 'shrink-0 bg-[#f63a9e] hover:bg-[#e02d8d] text-white font-medium'
            }
            onClick={() => setAspectSectionUnlocked(u => !u)}
          >
            {aspectSectionUnlocked ? (
              <>
                <Lock className='mr-2 h-4 w-4' aria-hidden />
                Lock section
              </>
            ) : (
              <>
                <PencilLine className='mr-2 h-4 w-4' aria-hidden />
                Edit configuration
              </>
            )}
          </Button>
        </div>

        {supportedRatioKeys && configurerMeta && (
          <div className='mb-4 flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900'>
            <Info className='mt-0.5 h-4 w-4 flex-shrink-0' aria-hidden />
            <div>
              <span className='font-semibold'>
                Filtered for {configurerMeta.name}.
              </span>{' '}
              Only the aspect ratios this configurator actually uses are shown
              ({supportedRatioKeys.join(', ')}). Other ratios are hidden because
              they would have no effect on the customer flow.
            </div>
          </div>
        )}

        {supportedRatioKeys && visibleAspectRatios.length === 0 && (
          <div className='rounded-md border border-dashed border-amber-200 bg-amber-50 px-3 py-4 text-sm text-amber-800'>
            No aspect ratios in the database match the ratios required by this
            configurator ({supportedRatioKeys.join(', ')}). Please add them under{' '}
            <span className='font-medium'>Shop Settings → Aspect Ratios</span>.
          </div>
        )}

        <div
          className={`space-y-3 ${!aspectSectionUnlocked ? 'select-none' : ''}`}
        >
          {visibleAspectRatios.map(ratio => {
            const isSelected = config.allowedRatios?.includes(ratio.id);
            const sizesCount = getSizesCountForRatio(ratio.id);
            const selectedSizesCount = getSelectedSizesCountForRatio(ratio.id);
            const sizesForRatio = allSizes.filter(
              size => size.aspect_ratio_id === ratio.id
            );
            const allSelected =
              sizesForRatio.length > 0 &&
              sizesForRatio.every(size =>
                (config.allowedSizes || []).includes(size.id)
              );

            return (
              <div
                key={ratio.id}
                className={`rounded-lg border p-4 transition-all ${
                  isSelected
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <div className='font-semibold text-gray-900'>{ratio.label}</div>
                    <div className='mt-1 text-sm capitalize text-gray-600'>
                      {ratio.orientation}
                    </div>
                    <div className='mt-2 text-xs text-gray-500'>
                      {isSelected
                        ? `${selectedSizesCount} of ${sizesCount} sizes selected`
                        : `${sizesCount} sizes available`}
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? 'text-green-700' : 'text-gray-500'
                      }`}
                    >
                      {isSelected ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={isSelected}
                      disabled={!aspectSectionUnlocked}
                      onCheckedChange={() => toggleRatio(ratio.id)}
                    />
                  </div>
                </div>

                {isSelected && (
                  <div className='mt-4 border-t border-gray-200 pt-4'>
                    {sizesForRatio.length === 0 ? (
                      <div className='rounded-md border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500'>
                        No sizes available for this ratio.
                      </div>
                    ) : (
                      <>
                        <div className='mb-3 flex justify-end'>
                          <Button
                            variant='outline'
                            size='sm'
                            disabled={!aspectSectionUnlocked}
                            onClick={() => selectAllSizesForRatio(ratio.id)}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>

                        <div className='grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6'>
                          {sizesForRatio.map(size => {
                            const isSizeSelected = (config.allowedSizes || []).includes(
                              size.id
                            );

                            return (
                              <div
                                key={size.id}
                                role={aspectSectionUnlocked ? 'button' : undefined}
                                tabIndex={aspectSectionUnlocked ? 0 : undefined}
                                className={`rounded-lg border p-3 text-center transition-all ${
                                  aspectSectionUnlocked
                                    ? 'cursor-pointer'
                                    : 'cursor-default'
                                } ${
                                  isSizeSelected
                                    ? 'border-[#f63a9e] bg-pink-50 shadow-sm'
                                    : `border-gray-200 bg-white${
                                        aspectSectionUnlocked
                                          ? ' hover:border-gray-300'
                                          : ''
                                      }`
                                } ${!aspectSectionUnlocked && !isSizeSelected ? 'opacity-75' : ''}`}
                                onClick={() =>
                                  aspectSectionUnlocked && toggleSize(size.id)
                                }
                              >
                                <div className='text-sm font-medium'>
                                  {size.display_label}
                                </div>
                                <div className='mt-1 text-xs text-gray-500'>
                                  {size.area_in2} sq in
                                </div>
                                {isSizeSelected && (
                                  <div
                                    className='mt-3 border-t border-gray-200 pt-3'
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <Label className='text-[11px] font-medium text-gray-600'>
                                      Price (GBP)
                                    </Label>
                                    {aspectSectionUnlocked ? (
                                      <Input
                                        type='number'
                                        min='0'
                                        step='0.01'
                                        placeholder='0.00'
                                        value={
                                          config.sizePrices?.[size.id] !== undefined
                                            ? String(config.sizePrices[size.id])
                                            : ''
                                        }
                                        onChange={e =>
                                          updateSizePrice(size.id, e.target.value)
                                        }
                                        className='mt-1 h-8 bg-white text-xs'
                                      />
                                    ) : (
                                      <div className='mt-1.5 rounded-md border border-gray-100 bg-white px-2 py-1.5 text-left text-sm font-semibold tabular-nums text-gray-900'>
                                        {typeof config.sizePrices?.[size.id] ===
                                          'number' &&
                                        config.sizePrices[size.id] > 0
                                          ? `£${config.sizePrices[size.id].toFixed(2)}`
                                          : '—'}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
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
            <span className='font-medium'>Priced Sizes:</span>{' '}
            {Object.entries(config.sizePrices || {}).filter(
              ([sizeId, price]) =>
                (config.allowedSizes || []).includes(sizeId) &&
                typeof price === 'number' &&
                price > 0
            ).length}{' '}
            set
          </p>
          <p>
            <span className='font-medium'>Status:</span>{' '}
            {config.allowedRatios?.length > 0 &&
            config.allowedSizes?.length > 0 &&
            (config.allowedSizes || []).every(
              (sizeId: string) =>
                typeof config.sizePrices?.[sizeId] === 'number' &&
                config.sizePrices[sizeId] > 0
            ) ? (
              <span className='text-green-600'>Ready to activate</span>
            ) : (
              <span className='text-yellow-600'>Incomplete configuration</span>
            )}
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className='flex justify-end gap-3 border-t border-gray-200 pt-5'>
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
