import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, Settings } from 'lucide-react';
import {
  getAttachableConfigurers,
  buildConfiguratorUrl,
} from '@/lib/configures/registry';

interface AdminConfigurerSelectorProps {
  productId: string;
  currentConfigurerId?: string | null;
  onSelect: (configurerId: string | null) => void;
  disabled?: boolean;
}

export function AdminConfigurerSelector({
  productId,
  currentConfigurerId,
  onSelect,
  disabled = false,
}: AdminConfigurerSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    currentConfigurerId || null
  );
  const configurers = getAttachableConfigurers();
  const selectedConfigurer = configurers.find(c => c.id === selectedId);

  // Sync local state with prop changes (e.g., after refresh or save)
  useEffect(() => {
    console.log(
      '🔄 AdminConfigurerSelector: Syncing currentConfigurerId:',
      currentConfigurerId
    );
    setSelectedId(currentConfigurerId || null);
  }, [currentConfigurerId]);

  const handleChange = (value: string) => {
    console.log('\n🎯 === CONFIGURER DROPDOWN CHANGED ===');
    console.log('📝 Raw value:', value);
    const newValue = value === 'none' ? null : value;
    console.log('✅ Processed value:', newValue);
    console.log('🔄 Updating local selectedId state...');
    setSelectedId(newValue);
    console.log('📤 Calling onSelect callback...');
    onSelect(newValue);
    console.log('=== DROPDOWN CHANGE COMPLETE ===\n');
  };

  const handleTestConfigurer = () => {
    if (selectedId) {
      const url = buildConfiguratorUrl(selectedId, productId);
      window.open(url, '_blank');
    }
  };

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div>
        <Label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
          <Settings className='w-4 h-4' />
          Product Configurator
        </Label>
        <p className='text-xs text-gray-500 mt-1'>
          Select which configurator users will see when they click
          &quot;Customize&quot; on this product
        </p>
      </div>

      {/* Selector */}
      <div className='space-y-2'>
        <Select
          value={selectedId || 'none'}
          onValueChange={handleChange}
          disabled={disabled}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='No configurator (standard product)' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>
              <div className='flex flex-col'>
                <span className='font-medium'>No Configurator</span>
                <span className='text-xs text-gray-500'>
                  Standard product without customization
                </span>
              </div>
            </SelectItem>

            {configurers.map(configurer => (
              <SelectItem key={configurer.id} value={configurer.id}>
                <div className='flex flex-col py-1'>
                  <span className='font-medium'>{configurer.name}</span>
                  <span className='text-xs text-gray-500'>
                    {configurer.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selected Configurer Info */}
        {selectedConfigurer && (
          <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  <div className='w-2 h-2 rounded-full bg-blue-500' />
                  <span className='text-sm font-medium text-blue-900'>
                    {selectedConfigurer.name}
                  </span>
                </div>
                <p className='text-xs text-blue-700 mb-2'>
                  {selectedConfigurer.description}
                </p>
                <div className='flex items-center gap-4 text-xs text-blue-600'>
                  <span>Route: /customize/{selectedConfigurer.route}</span>
                  {selectedConfigurer.requiresProductId && (
                    <span className='px-2 py-0.5 bg-blue-100 rounded'>
                      Requires Product ID
                    </span>
                  )}
                </div>
              </div>
              <Button
                size='sm'
                variant='outline'
                onClick={handleTestConfigurer}
                className='shrink-0'
              >
                <ExternalLink className='w-3 h-3 mr-1' />
                Test
              </Button>
            </div>
          </div>
        )}

        {/* No Configurator Selected */}
        {!selectedId && (
          <div className='p-3 bg-gray-50 rounded-lg border border-gray-200'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='w-4 h-4 text-gray-500 mt-0.5' />
              <div className='flex-1'>
                <p className='text-xs text-gray-600'>
                  No configurator selected. This product will be sold as-is
                  without customization options. The &quot;Customize&quot;
                  button will not appear on the product page.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className='p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
        <div className='flex items-start gap-2'>
          <AlertCircle className='w-4 h-4 text-yellow-600 mt-0.5' />
          <div className='text-xs text-yellow-800'>
            <strong>Note:</strong> After selecting a configurator, make sure to
            save the product. The configurator will only work if the product has
            a properly configured price and available sizes in the config.
          </div>
        </div>
      </div>
    </div>
  );
}
