import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  AlertCircle,
  Star,
  Upload,
  Save,
  Info,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';

interface AdminFeaturedProductEditorProps {
  productId: string;
}

interface ConflictProduct {
  id: string;
  name: string;
  featured_index: number;
}

export function AdminFeaturedProductEditor({
  productId,
}: AdminFeaturedProductEditorProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState<number | null>(null);
  const [featuredImage, setFeaturedImage] = useState('');
  const [conflictProduct, setConflictProduct] =
    useState<ConflictProduct | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchFeaturedData();
  }, [productId]);

  useEffect(() => {
    if (featuredIndex !== null) {
      checkIndexConflict(featuredIndex);
    } else {
      setConflictProduct(null);
    }
  }, [featuredIndex, productId]);

  const fetchFeaturedData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('is_featured, featured_index, featured_image')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data) {
        setIsFeatured(data.is_featured || false);
        setFeaturedIndex(data.featured_index);
        setFeaturedImage(data.featured_image || '');
      }
    } catch (error: any) {
      console.error('Error fetching featured data:', error);
      toast.error('Failed to load featured settings');
    } finally {
      setLoading(false);
    }
  };

  const checkIndexConflict = async (index: number) => {
    setCheckingConflict(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, featured_index')
        .eq('featured_index', index)
        .neq('id', productId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setConflictProduct(data);
    } catch (error: any) {
      console.error('Error checking conflict:', error);
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `featured-${productId}-${Date.now()}.${fileExt}`;
      const filePath = `featured-products/${fileName}`;

      // Upload to Supabase Storage bucket "photify"
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { error } = await supabase.storage
        .from('photify')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('photify').getPublicUrl(filePath);

      setFeaturedImage(publicUrl);
      setUploadProgress(100);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleSave = async () => {
    // Validation
    if (isFeatured && featuredIndex === null) {
      toast.error('Please select a featured position (1-4)');
      return;
    }

    if (isFeatured && !featuredImage) {
      toast.error('Please provide a featured image');
      return;
    }

    if (conflictProduct) {
      toast.error(
        `Position ${featuredIndex} is already taken by "${conflictProduct.name}"`
      );
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          featured_index: isFeatured ? featuredIndex : null,
          featured_image: isFeatured ? featuredImage : null,
          // is_featured is automatically set by trigger
        })
        .eq('id', productId);

      if (error) throw error;

      toast.success('Featured settings saved successfully');
      await fetchFeaturedData(); // Refresh data
    } catch (error: any) {
      console.error('Error saving featured settings:', error);
      toast.error('Failed to save featured settings');
    } finally {
      setSaving(false);
    }
  };

  const getPositionInfo = (index: number) => {
    const positions = {
      1: {
        name: 'Large Left',
        ratio: '14:9 (Landscape)',
        description: 'Main hero position - largest display area',
        size: 'Full height, left half',
      },
      2: {
        name: 'Top Right Small',
        ratio: '1:1 (Square)',
        description: 'Top right quadrant - compact square',
        size: 'Quarter height, half width',
      },
      3: {
        name: 'Top Right Small',
        ratio: '1:1 (Square)',
        description: 'Top right quadrant - compact square',
        size: 'Quarter height, half width',
      },
      4: {
        name: 'Bottom Right Wide',
        ratio: '21:9 (Ultra-wide)',
        description: 'Bottom banner - wide landscape',
        size: 'Half height, full width',
      },
    };
    return positions[index as keyof typeof positions];
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e]' />
        <span className='ml-2 text-gray-600'>Loading featured settings...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Featured Product Toggle */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <div className='flex items-center gap-2 mb-6'>
          <Star className='w-5 h-5 text-[#f63a9e]' />
          <h3 className='text-lg font-semibold'>Featured Product</h3>
        </div>

        <p className='text-sm text-gray-600 mb-4'>
          Featured products appear in the &quot;Best Sellers&quot; section on
          the homepage. Only 4 products can be featured at once.
        </p>

        <label className='flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all bg-white hover:bg-gray-50'>
          <input
            type='checkbox'
            checked={isFeatured}
            onChange={e => {
              setIsFeatured(e.target.checked);
              if (!e.target.checked) {
                setFeaturedIndex(null);
                setFeaturedImage('');
              }
            }}
            className='w-5 h-5 text-[#f63a9e] border-gray-300 rounded focus:ring-[#f63a9e] cursor-pointer'
          />
          <div>
            <div className='font-medium text-gray-900'>
              Mark as Featured Product
            </div>
            <div className='text-xs text-gray-500 mt-1'>
              Display this product prominently on the homepage
            </div>
          </div>
        </label>
      </div>

      {/* Featured Position & Image (Only show if featured is enabled) */}
      {isFeatured && (
        <>
          {/* Position Selection */}
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold mb-4'>Featured Position</h3>
            <p className='text-sm text-gray-600 mb-4'>
              Select which position this product should occupy on the homepage.
              Each position has different dimensions.
            </p>

            {/* Visual Layout Preview */}
            <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
              <div className='text-xs text-gray-600 mb-3 font-medium'>
                Homepage Layout Preview:
              </div>
              <div className='grid grid-cols-2 gap-2 h-[200px] bg-white rounded border border-gray-300 p-2'>
                {/* Position 1 - Large Left */}
                <button
                  onClick={() => setFeaturedIndex(1)}
                  className={`relative row-span-2 rounded border-2 transition-all ${
                    featuredIndex === 1
                      ? 'border-[#f63a9e] bg-pink-50'
                      : 'border-gray-300 hover:border-gray-400 bg-gray-100'
                  }`}
                >
                  <div className='absolute inset-0 flex flex-col items-center justify-center p-2'>
                    <div className='text-lg font-bold text-gray-700'>1</div>
                    <div className='text-[10px] text-gray-600 text-center mt-1'>
                      Large Left
                    </div>
                    <div className='text-[9px] text-gray-500 text-center'>
                      14:9
                    </div>
                  </div>
                </button>

                {/* Position 2 & 3 - Top Right */}
                <div className='grid grid-cols-2 gap-2'>
                  <button
                    onClick={() => setFeaturedIndex(2)}
                    className={`relative rounded border-2 transition-all ${
                      featuredIndex === 2
                        ? 'border-[#f63a9e] bg-pink-50'
                        : 'border-gray-300 hover:border-gray-400 bg-gray-100'
                    }`}
                  >
                    <div className='absolute inset-0 flex flex-col items-center justify-center p-1'>
                      <div className='text-sm font-bold text-gray-700'>2</div>
                      <div className='text-[8px] text-gray-600 text-center'>
                        Top Right
                      </div>
                      <div className='text-[7px] text-gray-500'>1:1</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setFeaturedIndex(3)}
                    className={`relative rounded border-2 transition-all ${
                      featuredIndex === 3
                        ? 'border-[#f63a9e] bg-pink-50'
                        : 'border-gray-300 hover:border-gray-400 bg-gray-100'
                    }`}
                  >
                    <div className='absolute inset-0 flex flex-col items-center justify-center p-1'>
                      <div className='text-sm font-bold text-gray-700'>3</div>
                      <div className='text-[8px] text-gray-600 text-center'>
                        Top Right
                      </div>
                      <div className='text-[7px] text-gray-500'>1:1</div>
                    </div>
                  </button>
                </div>

                {/* Position 4 - Bottom Right Wide */}
                <button
                  onClick={() => setFeaturedIndex(4)}
                  className={`relative rounded border-2 transition-all ${
                    featuredIndex === 4
                      ? 'border-[#f63a9e] bg-pink-50'
                      : 'border-gray-300 hover:border-gray-400 bg-gray-100'
                  }`}
                >
                  <div className='absolute inset-0 flex flex-col items-center justify-center p-2'>
                    <div className='text-sm font-bold text-gray-700'>4</div>
                    <div className='text-[9px] text-gray-600 text-center'>
                      Bottom Wide
                    </div>
                    <div className='text-[8px] text-gray-500'>21:9</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Selected Position Details */}
            {featuredIndex !== null && (
              <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-start gap-2'>
                  <Info className='w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0' />
                  <div className='text-sm text-blue-900'>
                    <div className='font-semibold mb-2'>
                      Position {featuredIndex}:{' '}
                      {getPositionInfo(featuredIndex).name}
                    </div>
                    <div className='space-y-1 text-xs'>
                      <div>
                        <strong>Aspect Ratio:</strong>{' '}
                        {getPositionInfo(featuredIndex).ratio}
                      </div>
                      <div>
                        <strong>Size:</strong>{' '}
                        {getPositionInfo(featuredIndex).size}
                      </div>
                      <div>
                        <strong>Description:</strong>{' '}
                        {getPositionInfo(featuredIndex).description}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conflict Warning */}
            {checkingConflict && (
              <div className='mt-4 flex items-center gap-2 text-sm text-gray-600'>
                <Loader2 className='w-4 h-4 animate-spin' />
                Checking availability...
              </div>
            )}

            {conflictProduct && (
              <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
                <div className='flex items-start gap-2'>
                  <AlertCircle className='w-4 h-4 text-red-600 mt-0.5 flex-shrink-0' />
                  <div className='text-sm text-red-900'>
                    <div className='font-semibold'>Position Already Taken</div>
                    <div className='mt-1'>
                      Position {featuredIndex} is currently occupied by{' '}
                      <strong>&quot;{conflictProduct.name}&quot;</strong>. You
                      need to unfeature that product first or choose a different
                      position.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Featured Image */}
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold mb-4'>Featured Image</h3>
            <p className='text-sm text-gray-600 mb-4'>
              Upload a dedicated image for the featured display. This image
              should match the aspect ratio for your selected position.
            </p>

            {featuredIndex !== null && (
              <div className='mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                <div className='flex items-start gap-2'>
                  <Upload className='w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0' />
                  <div className='text-sm text-amber-900'>
                    <strong>
                      Required Ratio for Position {featuredIndex}:
                    </strong>{' '}
                    {getPositionInfo(featuredIndex).ratio}
                    <div className='text-xs mt-1'>
                      Recommended minimum size:
                      {featuredIndex === 1 && ' 1400×900px'}
                      {featuredIndex === 2 && ' 800×800px'}
                      {featuredIndex === 3 && ' 800×800px'}
                      {featuredIndex === 4 && ' 1400×600px'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className='space-y-4'>
              {/* File Upload */}
              <div>
                <Label htmlFor='image-upload'>Upload Featured Image</Label>
                <div className='mt-2'>
                  <input
                    type='file'
                    id='image-upload'
                    accept='image/jpeg,image/jpg,image/png,image/webp'
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className='hidden'
                  />
                  <label
                    htmlFor='image-upload'
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      uploading
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 hover:border-[#f63a9e] bg-white hover:bg-pink-50'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className='w-5 h-5 animate-spin text-[#f63a9e]' />
                        <span className='text-sm text-gray-600'>
                          Uploading... {uploadProgress}%
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className='w-5 h-5 text-gray-500' />
                        <span className='text-sm text-gray-700 font-medium'>
                          Click to upload image
                        </span>
                      </>
                    )}
                  </label>
                  <p className='text-xs text-gray-500 mt-2'>
                    Supported: JPG, PNG, WebP • Max 5MB
                  </p>
                </div>
              </div>

              {/* Or Manual URL Input */}
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-200' />
                </div>
                <div className='relative flex justify-center text-xs'>
                  <span className='bg-white px-2 text-gray-500'>
                    Or use external URL
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor='featured-image'>Image URL</Label>
                <Input
                  id='featured-image'
                  value={featuredImage}
                  onChange={e => setFeaturedImage(e.target.value)}
                  placeholder='https://example.com/featured-image.jpg'
                  className='mt-2'
                  disabled={uploading}
                />
              </div>

              {/* Image Preview */}
              {featuredImage && (
                <div>
                  <Label>Preview</Label>
                  <div className='mt-2 relative w-full max-w-md aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-300'>
                    <ImageWithFallback
                      src={featuredImage}
                      alt='Featured image preview'
                      className='w-full h-full object-cover'
                    />
                  </div>
                  {/* Remove Image Button */}
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setFeaturedImage('')}
                    className='mt-2'
                  >
                    <X className='w-4 h-4 mr-2' />
                    Remove Image
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Save Button */}
      <div className='flex justify-end'>
        <Button
          onClick={handleSave}
          disabled={saving || checkingConflict || !!conflictProduct}
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
              Save Featured Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
