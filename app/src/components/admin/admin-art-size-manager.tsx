import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

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
  display_label: string;
  width_in: number;
  height_in: number;
  aspect_ratio_id: string;
  active: boolean;
}

interface ArtSize {
  size_id: string;
  price: number;
  image_url: string; // Each size has its own image URL
}

interface AdminArtSizeManagerProps {
  availableSizes: ArtSize[];
  images: string[]; // Main product images for reference
  onSizesChange: (sizes: ArtSize[]) => void;
  aspectRatioId?: string;
  onAspectRatioChange: (ratioId: string) => void;
}

export function AdminArtSizeManager({
  availableSizes,
  onSizesChange,
  aspectRatioId,
  onAspectRatioChange,
}: AdminArtSizeManagerProps) {
  const supabase = createClient();
  
  const [aspectRatios, setAspectRatios] = useState<AspectRatio[]>([]);
  const [allSizes, setAllSizes] = useState<Size[]>([]);
  const [filteredSizes, setFilteredSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch aspect ratios and sizes from database
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        console.log('Fetching aspect ratios and sizes...');
        
        // Fetch aspect ratios
        const { data: ratios, error: ratiosError } = await supabase
          .from('aspect_ratios')
          .select('id, label, width_ratio, height_ratio, orientation, active')
          .eq('active', true)
          .order('label', { ascending: true });
        
        if (ratiosError) {
          console.error('Error fetching aspect ratios:', ratiosError);
          throw ratiosError;
        }
        console.log(`Loaded ${ratios?.length || 0} aspect ratios`);
        setAspectRatios(ratios || []);

        // Fetch all sizes
        const { data: sizes, error: sizesError } = await supabase
          .from('sizes')
          .select('id, display_label, width_in, height_in, aspect_ratio_id, active')
          .eq('active', true)
          .order('width_in', { ascending: true });
        
        if (sizesError) {
          console.error('Error fetching sizes:', sizesError);
          throw sizesError;
        }
        console.log(`Loaded ${sizes?.length || 0} sizes`);
        setAllSizes(sizes || []);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        const errorMessage = error?.message || error?.hint || 'Failed to load sizes and ratios';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  // Filter sizes based on selected aspect ratio
  useEffect(() => {
    if (aspectRatioId && allSizes.length > 0) {
      const filtered = allSizes.filter(size => size.aspect_ratio_id === aspectRatioId);
      setFilteredSizes(filtered);
    } else {
      setFilteredSizes([]);
    }
  }, [aspectRatioId, allSizes]);

  const handleAspectRatioChange = (newRatioId: string) => {
    // Warn if changing aspect ratio with existing sizes
    if (availableSizes.length > 0) {
      if (confirm('Changing aspect ratio will clear all existing sizes. Continue?')) {
        onAspectRatioChange(newRatioId);
        onSizesChange([]);
      }
    } else {
      onAspectRatioChange(newRatioId);
    }
  };

  const handleAddSize = () => {
    if (!aspectRatioId) {
      toast.error('Please select an aspect ratio first');
      return;
    }
    
    if (filteredSizes.length === 0) {
      toast.error('No sizes available for this aspect ratio');
      return;
    }

    // Add first available size that hasn't been added yet
    const usedSizeIds = new Set(availableSizes.map(s => s.size_id));
    const availableSize = filteredSizes.find(s => !usedSizeIds.has(s.id));
    
    if (!availableSize) {
      toast.error('All sizes for this aspect ratio have been added');
      return;
    }

    onSizesChange([
      ...availableSizes,
      {
        size_id: availableSize.id,
        price: 0,
        image_url: '', // Empty by default, admin will add
      },
    ]);
  };

  const handleRemoveSize = (index: number) => {
    const newSizes = availableSizes.filter((_, i) => i !== index);
    onSizesChange(newSizes);
  };

  const handleSizeChange = (index: number, field: keyof ArtSize, value: any) => {
    const newSizes = [...availableSizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    onSizesChange(newSizes);
  };

  const getSizeById = (sizeId: string): Size | undefined => {
    return allSizes.find(s => s.id === sizeId);
  };

  const getSelectedRatioName = (): string => {
    const ratio = aspectRatios.find(r => r.id === aspectRatioId);
    return ratio ? `${ratio.label} (${ratio.width_ratio}:${ratio.height_ratio})` : 'Not selected';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Loading sizes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aspect Ratio Selection */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="aspect-ratio" className="text-base font-semibold">
              Aspect Ratio *
            </Label>
            <p className="text-sm text-gray-600 mt-1 mb-3">
              Select one aspect ratio. All sizes must match this ratio.
            </p>
          </div>

          <Select value={aspectRatioId || ''} onValueChange={handleAspectRatioChange}>
            <SelectTrigger id="aspect-ratio" className="max-w-md">
              <SelectValue placeholder="Select aspect ratio..." />
            </SelectTrigger>
            <SelectContent>
              {aspectRatios.map((ratio) => (
                <SelectItem key={ratio.id} value={ratio.id}>
                  {ratio.label} ({ratio.width_ratio}:{ratio.height_ratio})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {aspectRatioId && availableSizes.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>
                <strong>Locked:</strong> Aspect ratio is locked because sizes have been added. 
                To change it, remove all sizes first.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Sizes Grid */}
      {aspectRatioId && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Available Sizes</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add sizes for aspect ratio: {getSelectedRatioName()}
                </p>
              </div>
              <Button
                onClick={handleAddSize}
                className="bg-[#f63a9e] hover:bg-[#e02d8d] gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Add Size
              </Button>
            </div>

            {availableSizes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <p>No sizes added yet. Click &quot;Add Size&quot; to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableSizes.map((artSize, index) => {
                  const size = getSizeById(artSize.size_id);
                  if (!size) return null;

                  return (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
                    >
                      <div className="grid grid-cols-12 gap-4 items-end">
                        {/* Size Name */}
                        <div className="col-span-3">
                        <Label className="text-xs">Size</Label>
                        <Select
                          value={artSize.size_id}
                          onValueChange={(value) => handleSizeChange(index, 'size_id', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredSizes.map((s) => (
                              <SelectItem 
                                key={s.id} 
                                value={s.id}
                                disabled={availableSizes.some((as, i) => as.size_id === s.id && i !== index)}
                              >
                                {s.display_label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Dimensions Display */}
                      <div className="col-span-3">
                        <Label className="text-xs">Dimensions</Label>
                        <div className="mt-1 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-700">
                          {size.width_in}″ × {size.height_in}″
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-2">
                        <Label htmlFor={`price-${index}`} className="text-xs">
                          Price (£) *
                        </Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={artSize.price || ''}
                          onChange={(e) =>
                            handleSizeChange(index, 'price', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>

                      {/* Image Upload */}
                      <div className="col-span-3">
                        <Label htmlFor={`image-${index}`} className="text-xs">
                          Image *
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="file"
                            id={`file-${index}`}
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              // Validate file size (5MB max)
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Image must be less than 5MB');
                                return;
                              }
                              
                              try {
                                const fileName = `art-products/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
                                
                                toast.loading('Uploading image...', { id: `upload-${index}` });
                                
                                // Upload to Supabase Storage
                                const { error: uploadError } = await supabase
                                  .storage
                                  .from('photify')
                                  .upload(fileName, file, {
                                    cacheControl: '3600',
                                    upsert: false
                                  });
                                
                                if (uploadError) throw uploadError;
                                
                                // Get public URL
                                const { data: { publicUrl } } = supabase
                                  .storage
                                  .from('photify')
                                  .getPublicUrl(fileName);
                                
                                handleSizeChange(index, 'image_url', publicUrl);
                                toast.success('Image uploaded successfully', { id: `upload-${index}` });
                              } catch (error: any) {
                                console.error('Upload error:', error);
                                toast.error(error.message || 'Failed to upload image', { id: `upload-${index}` });
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`file-${index}`)?.click()}
                            className="w-full"
                          >
                            {artSize.image_url ? 'Change Image' : 'Upload Image'}
                          </Button>
                          {artSize.image_url && (
                            <a
                              href={artSize.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors shrink-0"
                              title="Preview image"
                            >
                              👁️
                            </a>
                          )}
                        </div>
                      </div>

                        {/* Delete Button */}
                        <div className="col-span-1 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSize(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Image Preview */}
                      {artSize.image_url && (
                        <div className="mt-2 p-3 bg-white rounded-md border border-gray-200">
                          <div className="flex items-start gap-3">
                            <img 
                              src={artSize.image_url} 
                              alt={`${size.display_label} preview`}
                              className="w-24 h-24 object-cover rounded border border-gray-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="flex-1 text-xs text-gray-600">
                              <p className="font-medium text-gray-800 mb-1">Preview for {size.display_label}</p>
                              <p className="text-gray-500 break-all">{artSize.image_url}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary */}
            {availableSizes.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>{availableSizes.length}</strong> size{availableSizes.length !== 1 ? 's' : ''} configured
                  {' • '}
                  Price range: £
                  {Math.min(...availableSizes.map(s => s.price)).toFixed(2)} - £
                  {Math.max(...availableSizes.map(s => s.price)).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {!aspectRatioId && (
        <Card className="p-6">
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-gray-400" />
            <p>Select an aspect ratio above to start adding sizes.</p>
          </div>
        </Card>
      )}
    </div>
  );
}

