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
    setSelectedId(currentConfigurerId || null);
  }, [currentConfigurerId]);

  const handleChange = (value: string) => {    
    const newValue = value === 'none' ? null : value;
    setSelectedId(newValue);
    onSelect(newValue);
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
        <Label className='flex items-center gap-2 text-sm font-semibold text-gray-800'>
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
          <SelectTrigger className='h-11 w-full bg-white'>
            <SelectValue
              placeholder='No configurator (standard product)'
              className='truncate'
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>No Configurator</SelectItem>

            {configurers.map(configurer => (
              <SelectItem key={configurer.id} value={configurer.id}>
                {configurer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selected Configurer Info */}
        {selectedConfigurer && (
          <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span className='text-sm font-semibold text-gray-900'>
                    {selectedConfigurer.name}
                  </span>
                </div>
                <p className='mb-2 text-xs text-gray-600'>
                  {selectedConfigurer.description}
                </p>
                <div className='flex flex-wrap items-center gap-3 text-xs text-gray-600'>
                  <span>Route: {selectedConfigurer.customUrl ?? `/customize/${selectedConfigurer.route}`}</span>
                  {selectedConfigurer.requiresProductId && (
                    <span className='rounded bg-gray-200 px-2 py-0.5'>
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
          <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
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
      <div className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-3'>
        <div className='flex items-start gap-2'>
          <AlertCircle className='mt-0.5 h-4 w-4 text-amber-600' />
          <div className='text-xs text-amber-800'>
            <strong>Note:</strong> After selecting a configurator, make sure to
            save the product. The configurator will only work if the product has
            a properly configured price and available sizes in the config.
          </div>
        </div>
      </div>
    </div>
  );
}
