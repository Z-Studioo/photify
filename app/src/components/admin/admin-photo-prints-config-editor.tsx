import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  PHOTO_PRINTS_DEFAULT_CONFIG,
  resolvePhotoPrintsConfig,
} from '@/components/product-configs/photo-prints/config';
import type {
  PhotoPrintSizeConfig,
  PhotoPrintsProductConfig,
} from '@/components/product-configs/photo-prints/types';

interface AdminPhotoPrintsConfigEditorProps {
  productId: string;
  currentConfig: Record<string, unknown> | null | undefined;
  onSave?: () => void;
}

export function AdminPhotoPrintsConfigEditor({
  productId,
  currentConfig,
  onSave,
}: AdminPhotoPrintsConfigEditorProps) {
  const [photoPrints, setPhotoPrints] = useState<PhotoPrintsProductConfig>(() =>
    resolvePhotoPrintsConfig(currentConfig?.photoPrints)
  );
  const [saving, setSaving] = useState(false);

  const updateSize = (
    sizeId: string,
    patch: Partial<Pick<PhotoPrintSizeConfig, 'price' | 'active'>>
  ) => {
    setPhotoPrints(prev => ({
      ...prev,
      sizes: prev.sizes.map(s =>
        s.id === sizeId ? { ...s, ...patch } : s
      ),
    }));
  };

  const handleSave = async () => {
    const activeWithPrice = photoPrints.sizes.filter(
      s => s.active && s.price > 0
    );
    if (activeWithPrice.length === 0) {
      toast.error('Enable at least one size with a valid price');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('config')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const mergedConfig = {
        ...(currentProduct?.config && typeof currentProduct.config === 'object'
          ? currentProduct.config
          : {}),
        configurerType: 'photo-prints',
        photoPrints: {
          ...photoPrints,
          borderMode: 'borderless' as const,
        },
        version:
          ((currentProduct?.config as { version?: number })?.version ?? 0) + 1,
      };

      const { error: updateError } = await supabase
        .from('products')
        .update({
          config: mergedConfig,
          config_status: 'active',
          config_version: mergedConfig.version,
          config_updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      toast.success('Photo Prints configuration saved');
      onSave?.();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to save configuration'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setPhotoPrints({
      ...PHOTO_PRINTS_DEFAULT_CONFIG,
      sizes: [...PHOTO_PRINTS_DEFAULT_CONFIG.sizes],
    });
    toast.info('Reset to default sizes — click Save to persist');
  };

  return (
    <div className='space-y-6'>
      <div className='rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900'>
        Photo Prints uses product-local sizes stored in{' '}
        <code className='text-xs'>config.photoPrints</code> — not the global
        aspect ratio / size tables.
      </div>

      <div className='grid grid-cols-2 gap-4 max-w-md'>
        <div>
          <Label>Max photos per order</Label>
          <Input
            type='number'
            min={1}
            max={100}
            value={photoPrints.maxPhotos}
            onChange={e =>
              setPhotoPrints(prev => ({
                ...prev,
                maxPhotos: Math.max(1, parseInt(e.target.value, 10) || 50),
              }))
            }
            className='mt-1'
          />
        </div>
        <div>
          <Label>Min DPI (quality warning)</Label>
          <Input
            type='number'
            min={72}
            max={600}
            value={photoPrints.minDpi}
            onChange={e =>
              setPhotoPrints(prev => ({
                ...prev,
                minDpi: Math.max(72, parseInt(e.target.value, 10) || 300),
              }))
            }
            className='mt-1'
          />
        </div>
      </div>

      <div className='rounded-lg border border-gray-200 overflow-hidden'>
        <table className='w-full text-sm'>
          <thead className='bg-gray-50 border-b border-gray-200'>
            <tr>
              <th className='text-left px-4 py-3 font-medium text-gray-700'>
                Size
              </th>
              <th className='text-left px-4 py-3 font-medium text-gray-700'>
                Ratio
              </th>
              <th className='text-left px-4 py-3 font-medium text-gray-700'>
                Price (GBP)
              </th>
              <th className='text-left px-4 py-3 font-medium text-gray-700'>
                Active
              </th>
            </tr>
          </thead>
          <tbody>
            {photoPrints.sizes.map(size => (
              <tr key={size.id} className='border-b border-gray-100'>
                <td className='px-4 py-3 font-medium'>{size.label}</td>
                <td className='px-4 py-3 text-gray-600'>{size.ratio}</td>
                <td className='px-4 py-3'>
                  <Input
                    type='number'
                    min={0}
                    step={0.01}
                    value={size.price}
                    onChange={e =>
                      updateSize(size.id, {
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className='w-24 h-8'
                  />
                </td>
                <td className='px-4 py-3'>
                  <Switch
                    checked={size.active}
                    onCheckedChange={checked =>
                      updateSize(size.id, { active: checked })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='flex justify-between gap-3 border-t border-gray-200 pt-5'>
        <Button variant='outline' onClick={handleResetDefaults} disabled={saving}>
          Reset to defaults
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
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
              Save Photo Prints Config
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
