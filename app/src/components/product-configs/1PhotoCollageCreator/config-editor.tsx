import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { type CollageConfig, DEFAULT_COLLAGE_CONFIG } from './types';

interface ConfigEditorProps {
  productId: string;
  initialConfig?: CollageConfig;
  onSave?: (config: CollageConfig) => void;
}

export function CollageConfigEditor({
  initialConfig,
  onSave,
}: ConfigEditorProps) {
  const [config, setConfig] = useState<CollageConfig>(
    initialConfig || DEFAULT_COLLAGE_CONFIG
  );
  const [saving, setSaving] = useState(false);
  const [loading] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    try {
      // In a real implementation, save to Supabase
      // await supabase.from('products').update({ config }).eq('id', productId);

      toast.success('Configuration saved successfully!');

      if (onSave) {
        onSave(config);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e]' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3'>
        <AlertCircle className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
        <div className='text-sm text-blue-900'>
          <p className='font-semibold mb-1'>Collage Product Configuration</p>
          <p>
            Configure templates, canvas sizes, and collage settings for
            customers.
          </p>
        </div>
      </div>

      {/* Photo Limits */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold mb-4'>Photo Limits</h3>

        <div className='space-y-4'>
          <div>
            <Label htmlFor='minPhotos'>Minimum Photos</Label>
            <input
              id='minPhotos'
              type='number'
              min='1'
              max='20'
              value={config.minPhotos}
              onChange={e =>
                setConfig({ ...config, minPhotos: parseInt(e.target.value) })
              }
              className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md'
            />
          </div>

          <div>
            <Label htmlFor='maxPhotos'>Maximum Photos</Label>
            <input
              id='maxPhotos'
              type='number'
              min='1'
              max='50'
              value={config.maxPhotos}
              onChange={e =>
                setConfig({ ...config, maxPhotos: parseInt(e.target.value) })
              }
              className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md'
            />
          </div>
        </div>
      </div>

      {/* Enable Freeform */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold mb-4'>Layout Options</h3>

        <div className='flex items-center justify-between'>
          <div>
            <Label htmlFor='enableFreeform'>Enable Freeform Layout</Label>
            <p className='text-sm text-gray-600'>
              Allow customers to place photos anywhere on canvas
            </p>
          </div>
          <Switch
            id='enableFreeform'
            checked={config.enableFreeform}
            onCheckedChange={checked =>
              setConfig({ ...config, enableFreeform: checked })
            }
          />
        </div>
      </div>

      {/* Backgrounds */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold mb-4'>Background Colors</h3>

        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          {config.allowedBackgrounds.map(bg => (
            <div
              key={bg.id}
              className='flex items-center gap-2 p-3 border border-gray-200 rounded-lg'
            >
              <div
                className='w-8 h-8 rounded border border-gray-300'
                style={{ backgroundColor: bg.value }}
              />
              <div className='flex-1'>
                <div className='text-sm font-medium'>{bg.name}</div>
                <Switch
                  checked={bg.active}
                  onCheckedChange={checked => {
                    setConfig({
                      ...config,
                      allowedBackgrounds: config.allowedBackgrounds.map(b =>
                        b.id === bg.id ? { ...b, active: checked } : b
                      ),
                    });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className='flex justify-end gap-3'>
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
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
