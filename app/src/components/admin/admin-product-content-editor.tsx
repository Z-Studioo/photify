import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Save, Loader2, Info } from 'lucide-react';
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
import {
  PRODUCT_FEATURE_ICON_OPTIONS,
  getFeatureLucideIcon,
  isFeatureIconUrl,
} from '@/lib/product-feature-icons';

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
    <div className='space-y-5'>
      {/* Basic Product Information */}
      <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='mb-5 flex items-center gap-2'>
          <Info className='w-5 h-5 text-[#f63a9e]' />
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Basic Product Information
            </h3>
            <p className='text-sm text-gray-500'>
              Core details shown on product pages and listings
            </p>
          </div>
        </div>

        <div className='mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3'>
          <div>
            <p className='text-sm font-semibold text-gray-900'>
              Product Visibility
            </p>
            <p className='text-xs text-gray-500'>
              Control whether this product is shown to customers
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <div className='rounded-full border border-gray-200 bg-white px-2 py-1'>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </div>

        {/* Product Name */}
        <div className='mb-6'>
          <Label htmlFor='product-name'>Product Name *</Label>
          <Input
            id='product-name'
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='e.g., Single Canvas Print'
            className='mt-2 bg-white'
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
            className='mt-2 bg-white'
          />
          <p className='text-xs text-gray-500 mt-1'>
            Brief product description
          </p>
        </div>

        {/* Slug Row */}
        <div className='mb-6'>
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
            className='mt-2 bg-white'
            required
          />
          <p className='text-xs text-gray-500 mt-1'>
            URL-friendly identifier (lowercase, dashes)
          </p>
        </div>
      </div>

      {/* Page Settings */}
      <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <h3 className='mb-1 text-lg font-semibold text-gray-900'>Page Settings</h3>
        <p className='mb-6 text-sm text-gray-500'>
          SEO metadata that helps search engines and previews
        </p>

        {/* Meta Title */}
        <div className='mb-6'>
          <Label htmlFor='meta-title'>Page Title</Label>
          <Input
            id='meta-title'
            value={metaTitle}
            onChange={e => setMetaTitle(e.target.value)}
            placeholder='Single Canvas Print - Custom Photo Canvas | Photify'
            className='mt-2 bg-white'
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
            className='mt-2 bg-white'
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
              className='bg-white'
            />
            <Button type='button' onClick={addKeyword} variant='outline' className='px-4'>
              <Plus className='w-4 h-4' />
              Add
            </Button>
          </div>
          <div className='flex flex-wrap gap-2 mt-3'>
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className='inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700'
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
            className='mt-2 bg-white'
          />
          <p className='text-xs text-gray-500 mt-1'>
            The preferred URL for this page
          </p>
        </div>
      </div>

      {/* Social Media Preview */}
      <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <h3 className='mb-1 text-lg font-semibold text-gray-900'>
          Social Media Preview
        </h3>
        <p className='mb-6 text-sm text-gray-500'>
          Configure title, description, and image for shared links
        </p>

        <div className='mb-6'>
          <Label htmlFor='og-title'>Social Title</Label>
          <Input
            id='og-title'
            value={ogTitle}
            onChange={e => setOgTitle(e.target.value)}
            placeholder='Leave empty to use Page Title'
            className='mt-2 bg-white'
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
            className='mt-2 bg-white'
          />
        </div>

        <div>
          <Label htmlFor='og-image'>Social Image URL</Label>
          <Input
            id='og-image'
            value={ogImage}
            onChange={e => setOgImage(e.target.value)}
            placeholder='https://example.com/image.jpg'
            className='mt-2 bg-white'
          />
          <p className='text-xs text-gray-500 mt-1'>Recommended: 1200×630px</p>
        </div>
      </div>

      {/* Product Features */}
      <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-lg font-semibold'>Features</h3>
            <p className='text-sm text-gray-500 mt-1'>
              Pick an icon for each line (shown on the product page trust row)
            </p>
          </div>
          <Button type='button' onClick={addFeature} size='sm' variant='outline'>
            <Plus className='w-4 h-4 mr-2' />
            Add Feature
          </Button>
        </div>

        <div className='space-y-4'>
          {features.map((feature, index) => {
            const PickedIcon = getFeatureLucideIcon(feature.icon);
            const legacyUrl =
              feature.icon && isFeatureIconUrl(feature.icon)
                ? feature.icon
                : null;
            return (
              <div
                key={index}
                className='rounded-lg border border-gray-200 bg-gray-50 p-4'
              >
                <div className='flex flex-col gap-3 md:flex-row md:items-start'>
                  <div className='flex flex-shrink-0 gap-3'>
                    <div className='flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg border-2 border-gray-200 bg-white'>
                      {legacyUrl ? (
                        <img
                          src={legacyUrl}
                          alt=''
                          className='max-h-16 max-w-16 object-contain'
                        />
                      ) : PickedIcon ? (
                        <PickedIcon className='h-9 w-9 text-[#f63a9e]' />
                      ) : (
                        <span className='text-xs text-gray-400 text-center px-1'>
                          No icon
                        </span>
                      )}
                    </div>
                    <div className='min-w-[200px] space-y-1'>
                      <Label className='text-xs text-gray-600'>Icon</Label>
                      <Select
                        value={
                          legacyUrl
                            ? '_legacy_url'
                            : feature.icon || 'none'
                        }
                        onValueChange={value => {
                          if (value === 'none') {
                            updateFeature(index, 'icon', null);
                          } else if (value === '_legacy_url') {
                            return;
                          } else {
                            updateFeature(index, 'icon', value);
                          }
                        }}
                      >
                        <SelectTrigger className='h-10 bg-white'>
                          <SelectValue placeholder='Choose icon' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='none'>No icon</SelectItem>
                          {legacyUrl && (
                            <SelectItem value='_legacy_url' disabled>
                              Uploaded image (legacy) — pick an icon to replace
                            </SelectItem>
                          )}
                          {PRODUCT_FEATURE_ICON_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {legacyUrl && (
                        <p className='text-xs text-amber-700'>
                          This row uses an old uploaded image. Select an icon
                          above to replace it.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='flex flex-1 gap-2 min-w-0'>
                    <Input
                      value={feature.text}
                      onChange={e =>
                        updateFeature(index, 'text', e.target.value)
                      }
                      placeholder='e.g., Free UK shipping'
                      className='flex-1 bg-white'
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
              </div>
            );
          })}
          {features.length === 0 && (
            <p className='text-sm text-gray-500 text-center py-4'>
              No features added yet. Click &quot;Add Feature&quot; to start.
            </p>
          )}
        </div>
      </div>

      {/* Specifications */}
      <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold'>Specifications</h3>
          <Button type='button' onClick={addSpecification} size='sm' variant='outline'>
            <Plus className='w-4 h-4 mr-2' />
            Add Specification
          </Button>
        </div>

        <div className='space-y-3'>
          {specifications.map((spec, index) => (
            <div
              key={index}
              className='grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-[1fr_1fr_auto]'
            >
              <Input
                value={spec.label}
                onChange={e =>
                  updateSpecification(index, 'label', e.target.value)
                }
                placeholder='Label (e.g., Material)'
                className='bg-white'
              />
              <Input
                value={spec.value}
                onChange={e =>
                  updateSpecification(index, 'value', e.target.value)
                }
                placeholder='Value (e.g., 100% Cotton Canvas)'
                className='bg-white'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => removeSpecification(index)}
                className='md:self-center'
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
      <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold'>Trust Badges</h3>
          <Button type='button' onClick={addTrustBadge} size='sm' variant='outline'>
            <Plus className='w-4 h-4 mr-2' />
            Add Badge
          </Button>
        </div>

        <div className='space-y-3'>
          {trustBadges.map((badge, index) => (
            <div
              key={index}
              className='grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-[120px_1fr_1fr_auto]'
            >
              <Input
                value={badge.icon}
                onChange={e => updateTrustBadge(index, 'icon', e.target.value)}
                placeholder='Icon name'
                className='bg-white'
              />
              <Input
                value={badge.title}
                onChange={e => updateTrustBadge(index, 'title', e.target.value)}
                placeholder='Title'
                className='bg-white'
              />
              <Input
                value={badge.subtitle}
                onChange={e =>
                  updateTrustBadge(index, 'subtitle', e.target.value)
                }
                placeholder='Subtitle'
                className='bg-white'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => removeTrustBadge(index)}
                className='md:self-center'
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
      <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <h3 className='text-lg font-semibold mb-6'>Reviews & Rating</h3>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
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
      <div className='flex justify-end border-t border-gray-200 pt-6'>
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
