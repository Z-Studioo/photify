import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Save, Loader2, Upload, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Feature {
  text: string;
  icon: string | null;
}

interface Specification {
  label: string;
  value: string;
}

interface TrustBadge {
  icon: string;
  title: string;
  subtitle: string;
}

interface ProductContentEditorProps {
  productId: string;
}

export function AdminProductContentEditor({
  productId,
}: ProductContentEditorProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Basic Product Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [slug, setSlug] = useState('');
  const [productType, setProductType] = useState('');
  const [configStatus, setConfigStatus] = useState('');
  const [isActive, setIsActive] = useState(false);

  // SEO Meta Fields
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');

  // Content Fields
  const [features, setFeatures] = useState<Feature[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [trustBadges, setTrustBadges] = useState<TrustBadge[]>([]);

  // Review Fields
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchProductContent();
  }, [productId]);

  const fetchProductContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data) {
        // Basic Product Fields
        setName(data.name || '');
        setDescription(data.description || '');
        setPrice(data.price?.toString() || '');
        setSlug(data.slug || '');
        setProductType(data.product_type || '');
        setConfigStatus(data.config_status || '');
        setIsActive(data.active ?? false);

        // SEO Fields
        setMetaTitle(data.seo_title || '');
        setMetaDescription(data.seo_description || '');
        setKeywords(data.seo_keywords || []);
        setCanonicalUrl(data.canonical_url || '');
        setOgTitle(data.og_title || '');
        setOgDescription(data.og_description || '');
        setOgImage(data.og_image || '');

        // Content Fields
        setFeatures(data.features || []);
        setSpecifications(data.specifications || []);
        setTrustBadges(data.trust_badges || []);

        // Review Fields
        setAverageRating(data.average_rating || 0);
        setReviewCount(data.review_count || 0);
      }
    } catch (error: any) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    if (!slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    setSaving(true);
    try {
      // Update product content
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: name.trim(),
          description: description.trim(),
          price: parseFloat(price),
          slug: slug.trim(),
          product_type: productType,
          active: isActive,
          config_status: configStatus,
          seo_title: metaTitle,
          seo_description: metaDescription,
          seo_keywords: keywords,
          canonical_url: canonicalUrl,
          og_title: ogTitle,
          og_description: ogDescription,
          og_image: ogImage,
          features,
          specifications,
          trust_badges: trustBadges,
          average_rating: averageRating,
          review_count: reviewCount,
        })
        .eq('id', productId);

      if (productError) throw productError;

      toast.success('Product saved successfully');

      // Reload the page to update the header
      // window.location.reload();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Features Management
  const addFeature = () => {
    setFeatures([...features, { text: '', icon: null }]);
  };

  const updateFeature = (
    index: number,
    field: 'text' | 'icon',
    value: string | null
  ) => {
    const updated = [...features];
    updated[index][field] = value as any;
    setFeatures(updated);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleIconUpload = async (index: number, file: File) => {
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `feature-icon-${Date.now()}.${fileExt}`;
      const filePath = `product-icons/${fileName}`;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { error: uploadError } = await supabase.storage
        .from('photify')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('photify').getPublicUrl(filePath);

      // Update feature with icon URL
      updateFeature(index, 'icon', publicUrl);
      toast.success('Icon uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading icon:', error);
      toast.error('Failed to upload icon');
    }
  };

  const removeIcon = (index: number) => {
    updateFeature(index, 'icon', null);
  };

  // Specifications Management
  const addSpecification = () => {
    setSpecifications([...specifications, { label: '', value: '' }]);
  };

  const updateSpecification = (
    index: number,
    field: 'label' | 'value',
    value: string
  ) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  // Trust Badges Management
  const addTrustBadge = () => {
    setTrustBadges([
      ...trustBadges,
      { icon: 'Shield', title: '', subtitle: '' },
    ]);
  };

  const updateTrustBadge = (
    index: number,
    field: 'icon' | 'title' | 'subtitle',
    value: string
  ) => {
    const updated = [...trustBadges];
    updated[index][field] = value;
    setTrustBadges(updated);
  };

  const removeTrustBadge = (index: number) => {
    setTrustBadges(trustBadges.filter((_, i) => i !== index));
  };

  // Keywords Management
  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e]' />
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Basic Product Information */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <div className='flex items-center gap-2 mb-6'>
          <Info className='w-5 h-5 text-[#f63a9e]' />
          <h3 className='text-lg font-semibold'>Basic Product Information</h3>
        </div>

        {/* Product Name */}
        <div className='mb-6'>
          <Label htmlFor='product-name'>Product Name *</Label>
          <Input
            id='product-name'
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='e.g., Single Canvas Print'
            className='mt-2'
            required
          />
          <p className='text-xs text-gray-500 mt-1'>
            The main product name shown to customers
          </p>
        </div>

        {/* Description */}
        <div className='mb-6'>
          <Label htmlFor='product-description'>Description</Label>
          <Textarea
            id='product-description'
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder='Short description of the product...'
            rows={3}
            className='mt-2'
          />
          <p className='text-xs text-gray-500 mt-1'>
            Brief product description
          </p>
        </div>

        {/* Price and Slug Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          <div>
            <Label htmlFor='product-price'>Base Price (£/sq in) *</Label>
            <Input
              id='product-price'
              type='number'
              step='0.01'
              min='0'
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder='0.00'
              className='mt-2'
              required
            />
            <p className='text-xs text-gray-500 mt-1'>Price per square inch</p>
          </div>

          <div>
            <Label htmlFor='product-slug'>URL Slug *</Label>
            <Input
              id='product-slug'
              value={slug}
              onChange={e =>
                setSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                )
              }
              placeholder='single-canvas-print'
              className='mt-2'
              required
            />
            <p className='text-xs text-gray-500 mt-1'>
              URL-friendly identifier (lowercase, dashes)
            </p>
          </div>
        </div>

        {/* Active / Inactive toggle */}
        <div className='flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl'>
          <div>
            <p className='font-semibold text-gray-900 text-sm'>Product Visibility</p>
            <p className='text-xs text-gray-500 mt-0.5'>
              {isActive
                ? 'Product is live and visible to customers'
                : 'Product is hidden from customers (draft mode)'}
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        {/* Product Type and Status Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <Label htmlFor='product-type'>Product Type *</Label>
            <Select value={productType} onValueChange={setProductType}>
              <SelectTrigger className='mt-2'>
                <SelectValue placeholder='Select product type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='canvas'>Canvas Print</SelectItem>
                <SelectItem value='framed_canvas'>Framed Canvas</SelectItem>
                <SelectItem value='metal_print'>Metal Print</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-gray-500 mt-1'>
              Type of product (affects configuration options)
            </p>
          </div>

          <div>
            <Label htmlFor='config-status'>Configuration Status *</Label>
            <Select value={configStatus} onValueChange={setConfigStatus}>
              <SelectTrigger className='mt-2'>
                <SelectValue placeholder='Select status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='active'>Active (Ready for Sale)</SelectItem>
                <SelectItem value='draft'>Draft (Work in Progress)</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-gray-500 mt-1'>
              Product availability status
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Page Settings */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold mb-6'>Page Settings</h3>

        {/* Meta Title */}
        <div className='mb-6'>
          <Label htmlFor='meta-title'>Page Title</Label>
          <Input
            id='meta-title'
            value={metaTitle}
            onChange={e => setMetaTitle(e.target.value)}
            placeholder='Single Canvas Print - Custom Photo Canvas | Photify'
            className='mt-2'
          />
          <div className='flex items-center justify-between mt-1'>
            <p className='text-xs text-gray-500'>Optimal: 50-60 characters</p>
            <p
              className={`text-xs ${metaTitle.length > 60 ? 'text-red-600' : 'text-gray-500'}`}
            >
              {metaTitle.length} / 60
            </p>
          </div>
        </div>

        {/* Meta Description */}
        <div className='mb-6'>
          <Label htmlFor='meta-description'>Page Description</Label>
          <Textarea
            id='meta-description'
            value={metaDescription}
            onChange={e => setMetaDescription(e.target.value)}
            placeholder='Transform your memories into stunning canvas art...'
            rows={3}
            className='mt-2'
          />
          <div className='flex items-center justify-between mt-1'>
            <p className='text-xs text-gray-500'>Optimal: 150-160 characters</p>
            <p
              className={`text-xs ${metaDescription.length > 160 ? 'text-red-600' : 'text-gray-500'}`}
            >
              {metaDescription.length} / 160
            </p>
          </div>
        </div>

        {/* Keywords */}
        <div className='mb-6'>
          <Label htmlFor='keywords'>Keywords</Label>
          <div className='flex gap-2 mt-2'>
            <Input
              id='keywords'
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyPress={e =>
                e.key === 'Enter' && (e.preventDefault(), addKeyword())
              }
              placeholder='Add keyword and press Enter'
            />
            <Button type='button' onClick={addKeyword}>
              <Plus className='w-4 h-4' />
            </Button>
          </div>
          <div className='flex flex-wrap gap-2 mt-3'>
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className='inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm'
              >
                {keyword}
                <button
                  onClick={() => removeKeyword(keyword)}
                  className='hover:text-red-600'
                >
                  <X className='w-3 h-3' />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Canonical URL */}
        <div>
          <Label htmlFor='canonical'>Canonical URL</Label>
          <Input
            id='canonical'
            value={canonicalUrl}
            onChange={e => setCanonicalUrl(e.target.value)}
            placeholder='https://photify.com/product/single-canvas'
            className='mt-2'
          />
          <p className='text-xs text-gray-500 mt-1'>
            The preferred URL for this page
          </p>
        </div>
      </div>

      {/* Social Media Preview */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold mb-6'>Social Media Preview</h3>

        <div className='mb-6'>
          <Label htmlFor='og-title'>Social Title</Label>
          <Input
            id='og-title'
            value={ogTitle}
            onChange={e => setOgTitle(e.target.value)}
            placeholder='Leave empty to use Page Title'
            className='mt-2'
          />
        </div>

        <div className='mb-6'>
          <Label htmlFor='og-description'>Social Description</Label>
          <Textarea
            id='og-description'
            value={ogDescription}
            onChange={e => setOgDescription(e.target.value)}
            placeholder='Leave empty to use Page Description'
            rows={2}
            className='mt-2'
          />
        </div>

        <div>
          <Label htmlFor='og-image'>Social Image URL</Label>
          <Input
            id='og-image'
            value={ogImage}
            onChange={e => setOgImage(e.target.value)}
            placeholder='https://example.com/image.jpg'
            className='mt-2'
          />
          <p className='text-xs text-gray-500 mt-1'>Recommended: 1200×630px</p>
        </div>
      </div>

      {/* Product Features */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-lg font-semibold'>Features</h3>
            <p className='text-sm text-gray-500 mt-1'>
              Add custom icons (PNG, 64x64px recommended)
            </p>
          </div>
          <Button type='button' onClick={addFeature} size='sm'>
            <Plus className='w-4 h-4 mr-2' />
            Add Feature
          </Button>
        </div>

        <div className='space-y-4'>
          {features.map((feature, index) => (
            <div key={index} className='border border-gray-200 rounded-lg p-4'>
              <div className='flex gap-3'>
                {/* Icon Upload Section */}
                <div className='flex-shrink-0'>
                  {feature.icon ? (
                    <div className='relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden group'>
                      <img
                        src={feature.icon}
                        alt='Feature icon'
                        className='w-full h-full object-contain p-3'
                      />
                      <button
                        onClick={() => removeIcon(index)}
                        className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'
                      >
                        <X className='w-6 h-6 text-white' />
                      </button>
                    </div>
                  ) : (
                    <label className='w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#f63a9e] hover:bg-pink-50 transition-colors'>
                      <input
                        type='file'
                        accept='image/png,image/jpeg,image/svg+xml'
                        className='hidden'
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleIconUpload(index, file);
                        }}
                      />
                      <Upload className='w-8 h-8 text-gray-400' />
                    </label>
                  )}
                </div>

                {/* Feature Text Input */}
                <div className='flex-1 flex gap-2'>
                  <Input
                    value={feature.text}
                    onChange={e => updateFeature(index, 'text', e.target.value)}
                    placeholder='e.g., Museum-quality canvas material'
                    className='flex-1'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => removeFeature(index)}
                    className='flex-shrink-0'
                  >
                    <X className='w-4 h-4' />
                  </Button>
                </div>
              </div>

              {feature.icon && (
                <p className='text-xs text-gray-500 mt-2 ml-19'>
                  Icon uploaded • Click to remove
                </p>
              )}
            </div>
          ))}
          {features.length === 0 && (
            <p className='text-sm text-gray-500 text-center py-4'>
              No features added yet. Click &quot;Add Feature&quot; to start.
            </p>
          )}
        </div>
      </div>

      {/* Specifications */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold'>Specifications</h3>
          <Button type='button' onClick={addSpecification} size='sm'>
            <Plus className='w-4 h-4 mr-2' />
            Add Specification
          </Button>
        </div>

        <div className='space-y-3'>
          {specifications.map((spec, index) => (
            <div key={index} className='grid grid-cols-[1fr_1fr_auto] gap-2'>
              <Input
                value={spec.label}
                onChange={e =>
                  updateSpecification(index, 'label', e.target.value)
                }
                placeholder='Label (e.g., Material)'
              />
              <Input
                value={spec.value}
                onChange={e =>
                  updateSpecification(index, 'value', e.target.value)
                }
                placeholder='Value (e.g., 100% Cotton Canvas)'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => removeSpecification(index)}
              >
                <X className='w-4 h-4' />
              </Button>
            </div>
          ))}
          {specifications.length === 0 && (
            <p className='text-sm text-gray-500 text-center py-4'>
              No specifications added yet. Click &quot;Add Specification&quot; to start.
            </p>
          )}
        </div>
      </div>

      {/* Trust Badges */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold'>Trust Badges</h3>
          <Button type='button' onClick={addTrustBadge} size='sm'>
            <Plus className='w-4 h-4 mr-2' />
            Add Badge
          </Button>
        </div>

        <div className='space-y-3'>
          {trustBadges.map((badge, index) => (
            <div
              key={index}
              className='grid grid-cols-[120px_1fr_1fr_auto] gap-2'
            >
              <Input
                value={badge.icon}
                onChange={e => updateTrustBadge(index, 'icon', e.target.value)}
                placeholder='Icon name'
              />
              <Input
                value={badge.title}
                onChange={e => updateTrustBadge(index, 'title', e.target.value)}
                placeholder='Title'
              />
              <Input
                value={badge.subtitle}
                onChange={e =>
                  updateTrustBadge(index, 'subtitle', e.target.value)
                }
                placeholder='Subtitle'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => removeTrustBadge(index)}
              >
                <X className='w-4 h-4' />
              </Button>
            </div>
          ))}
          {trustBadges.length === 0 && (
            <p className='text-sm text-gray-500 text-center py-4'>
              No trust badges added yet. Click &quot;Add Badge&quot; to start.
            </p>
          )}
        </div>
        <p className='text-xs text-gray-500 mt-3'>
          Icon names: Shield, Truck, RefreshCw, Star, Check, etc. (Lucide icons)
        </p>
      </div>

      {/* Reviews */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold mb-6'>Reviews & Rating</h3>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='rating'>Average Rating</Label>
            <Input
              id='rating'
              type='number'
              min='0'
              max='5'
              step='0.1'
              value={averageRating}
              onChange={e => setAverageRating(parseFloat(e.target.value) || 0)}
              className='mt-2'
            />
            <p className='text-xs text-gray-500 mt-1'>0.0 - 5.0</p>
          </div>

          <div>
            <Label htmlFor='review-count'>Review Count</Label>
            <Input
              id='review-count'
              type='number'
              min='0'
              value={reviewCount}
              onChange={e => setReviewCount(parseInt(e.target.value) || 0)}
              className='mt-2'
            />
            <p className='text-xs text-gray-500 mt-1'>Number of reviews</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className='flex justify-end gap-3 pt-6 border-t'>
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
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
