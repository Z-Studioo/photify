import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import { ArrowLeft, Save, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function AdminProductNewPage() {
  const navigate = useNavigate();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [productType, setProductType] = useState('canvas');
  const [saving, setSaving] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!slug.trim()) {
      toast.error('Slug is required');
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      toast.error('A valid base price is required');
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error('You must be logged in to create a product');
        return;
      }

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug.trim())
        .maybeSingle();

      if (existing) {
        toast.error('A product with this slug already exists. Please choose a different slug.');
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          price: parseFloat(price),
          product_type: productType,
          config_status: 'draft',
          active: false,
          images: [],
          config: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        toast.error(`Failed to create product: ${error.message}`);
        return;
      }

      toast.success('Product created! Now configure it.');
      navigate(`/admin/products/edit/${data.id}`);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className='max-w-3xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <button
            onClick={() => navigate('/admin/products')}
            className='flex items-center gap-2 text-gray-600 hover:text-[#f63a9e] mb-6 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            Back to Products
          </button>

          <div className='flex items-center gap-4'>
            <div className='w-14 h-14 rounded-2xl bg-[#f63a9e] flex items-center justify-center shadow-lg'>
              <Package className='w-7 h-7 text-white' />
            </div>
            <div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] mb-1"
                style={{ fontSize: '32px', fontWeight: '600' }}
              >
                Add New Product
              </h1>
              <p className='text-gray-500 text-sm'>
                Fill in the basics — you can configure sizes, images, and categories after creating.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6'>

            {/* Name */}
            <div className='space-y-2'>
              <Label htmlFor='name' className='text-sm font-semibold text-gray-700'>
                Product Name <span className='text-[#f63a9e]'>*</span>
              </Label>
              <Input
                id='name'
                placeholder='e.g. Single Canvas Print'
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                className='h-11'
                required
              />
            </div>

            {/* Slug */}
            <div className='space-y-2'>
              <Label htmlFor='slug' className='text-sm font-semibold text-gray-700'>
                URL Slug <span className='text-[#f63a9e]'>*</span>
              </Label>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-gray-400 whitespace-nowrap'>/product/</span>
                <Input
                  id='slug'
                  placeholder='single-canvas-print'
                  value={slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  className='h-11 font-mono text-sm'
                  required
                />
              </div>
              <p className='text-xs text-gray-400'>
                Auto-generated from the name. Only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            {/* Description */}
            <div className='space-y-2'>
              <Label htmlFor='description' className='text-sm font-semibold text-gray-700'>
                Short Description
              </Label>
              <Textarea
                id='description'
                placeholder='Brief description of the product...'
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className='resize-none'
              />
            </div>

            {/* Price & Type row */}
            <div className='grid grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='price' className='text-sm font-semibold text-gray-700'>
                  Base Price (£/sq in) <span className='text-[#f63a9e]'>*</span>
                </Label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>£</span>
                  <Input
                    id='price'
                    type='number'
                    step='0.01'
                    min='0.01'
                    placeholder='0.15'
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className='h-11 pl-7'
                    required
                  />
                </div>
                <p className='text-xs text-gray-400'>Price per square inch</p>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-semibold text-gray-700'>
                  Product Type <span className='text-[#f63a9e]'>*</span>
                </Label>
                <Select value={productType} onValueChange={setProductType}>
                  <SelectTrigger className='h-11'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='canvas'>Canvas Print</SelectItem>
                    <SelectItem value='framed_canvas'>Framed Canvas</SelectItem>
                    <SelectItem value='metal_print'>Metal Print</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Info note */}
            <div className='p-4 bg-blue-50 border border-blue-200 rounded-xl'>
              <p className='text-sm text-blue-700'>
                <strong>Next steps after creating:</strong> You&apos;ll be taken directly to the product editor where you can add images, configure sizes &amp; pricing, assign categories, and set up the product configurator.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 mt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => navigate('/admin/products')}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={saving}
              className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white gap-2 px-6'
            >
              {saving ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Creating...
                </>
              ) : (
                <>
                  <Save className='w-4 h-4' />
                  Create Product
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
