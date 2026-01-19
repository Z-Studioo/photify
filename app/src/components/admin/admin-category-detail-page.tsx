import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Save,
  Package,
  Eye,
  FileText,
  Image as ImageIcon,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  image_url?: string;
  bg_color: string;
  display_order: number;
  is_active: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  meta_robots?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  active: boolean;
  description?: string;
}

export function AdminCategoryDetailPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    bgColor: '#e8e4df',
    isActive: true,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    metaRobots: 'index, follow',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
  });

  const supabase = createClient();

  useEffect(() => {
    fetchCategory();
    fetchProducts();
  }, [categoryId]);

  const fetchCategory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;

      if (data) {
        setCategory(data);
        setFormData({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          imageUrl: data.image_url || '',
          bgColor: data.bg_color,
          isActive: data.is_active,
          seoTitle: data.seo_title || '',
          seoDescription: data.seo_description || '',
          seoKeywords: data.seo_keywords?.join(', ') || '',
          metaRobots: data.meta_robots || 'index, follow',
          canonicalUrl: data.canonical_url || '',
          ogTitle: data.og_title || '',
          ogDescription: data.og_description || '',
          ogImage: data.og_image || '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching category:', error);
      toast.error('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      // Try using the RPC function first
      // eslint-disable-next-line prefer-const
      let { data, error } = await supabase.rpc('get_category_products', {
        category_uuid: categoryId,
      });

      // Fallback to manual query
      if (
        error &&
        (error.code === '42883' || error.message?.includes('function'))
      ) {
        const response = await supabase
          .from('product_categories')
          .select(
            `
            products:product_id (
              id,
              name,
              slug,
              price,
              images,
              active,
              description
            )
          `
          )
          .eq('category_id', categoryId);

        if (response.error) throw response.error;
        data =
          response.data?.map((item: any) => item.products).filter(Boolean) ||
          [];
      } else if (error) {
        throw error;
      }

      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `category-${categoryId}-${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      // Upload to Supabase Storage bucket "photify"
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photify')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('photify').getPublicUrl(filePath);

      setFormData({ ...formData, imageUrl: publicUrl });
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);

      // Show helpful error messages
      if (error.message?.includes('Bucket not found')) {
        toast.error('Storage bucket "photify" not found.');
        toast.info('Please create a "photify" bucket in Supabase Storage');
      } else if (error.message?.includes('policy')) {
        toast.error('Storage permissions error.');
        toast.info('Check storage policies for the "photify" bucket');
      } else {
        toast.error('Failed to upload image: ' + error.message);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      // Convert keywords string to array
      const keywordsArray = formData.seoKeywords
        ? formData.seoKeywords
            .split(',')
            .map(k => k.trim())
            .filter(Boolean)
        : [];

      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          image_url: formData.imageUrl || null,
          bg_color: formData.bgColor,
          is_active: formData.isActive,
          seo_title: formData.seoTitle || null,
          seo_description: formData.seoDescription || null,
          seo_keywords: keywordsArray.length > 0 ? keywordsArray : null,
          meta_robots: formData.metaRobots,
          canonical_url: formData.canonicalUrl || null,
          og_title: formData.ogTitle || null,
          og_description: formData.ogDescription || null,
          og_image: formData.ogImage || null,
        })
        .eq('id', categoryId);

      if (error) throw error;

      toast.success('Category updated successfully!');
      fetchCategory();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
        </div>
      </AdminLayout>
    );
  }

  if (!category) {
    return (
      <AdminLayout>
        <div className='text-center py-12'>
          <p className='text-gray-600'>Category not found</p>
          <Button
            onClick={() => navigate('/admin/categories')}
            className='mt-4'
          >
            Back to Categories
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <Button
            variant='ghost'
            onClick={() => navigate('/admin/categories')}
            className='mb-4'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Categories
          </Button>

          <div className='flex items-start justify-between'>
            <div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
                style={{ fontSize: '32px', fontWeight: '600' }}
              >
                Edit Category
              </h1>
              <p className='text-gray-600'>
                Manage category details and associated products
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
              style={{ height: '50px' }}
            >
              {saving ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <Save className='w-5 h-5' />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column - Tabbed Content */}
          <div className='lg:col-span-2'>
            <Tabs defaultValue='basic' className='w-full'>
              <TabsList className='grid w-full grid-cols-3 mb-6'>
                <TabsTrigger value='basic' className='flex items-center gap-2'>
                  <FileText className='w-4 h-4' />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value='images' className='flex items-center gap-2'>
                  <ImageIcon className='w-4 h-4' />
                  Images
                </TabsTrigger>
                <TabsTrigger value='seo' className='flex items-center gap-2'>
                  <Search className='w-4 h-4' />
                  SEO
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value='basic' className='space-y-6'>
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h2 className="font-['Bricolage_Grotesque',_sans-serif] text-xl font-semibold mb-6">
                    Basic Information
                  </h2>

                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor='name'>Category Name *</Label>
                      <Input
                        id='name'
                        value={formData.name}
                        onChange={e => {
                          const name = e.target.value;
                          setFormData({
                            ...formData,
                            name,
                            slug: generateSlug(name),
                          });
                        }}
                        placeholder='e.g., Custom Frames'
                      />
                    </div>

                    <div>
                      <Label htmlFor='slug'>URL Slug *</Label>
                      <Input
                        id='slug'
                        value={formData.slug}
                        onChange={e =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        placeholder='e.g., custom-frames'
                      />
                      <p className='text-xs text-gray-500 mt-1'>
                        Used in URLs: /category/{formData.slug}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor='description'>Description</Label>
                      <Textarea
                        id='description'
                        value={formData.description}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder='Brief description of the category'
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor='isActive'>Status</Label>
                      <select
                        id='isActive'
                        value={formData.isActive ? 'active' : 'inactive'}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            isActive: e.target.value === 'active',
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-200 rounded-lg'
                      >
                        <option value='active'>
                          Active (visible on website)
                        </option>
                        <option value='inactive'>
                          Inactive (hidden from website)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value='images' className='space-y-6'>
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h2 className="font-['Bricolage_Grotesque',_sans-serif] text-xl font-semibold mb-6">
                    Category Image
                  </h2>

                  <div className='space-y-4'>
                    {/* Image Preview */}
                    <div className='relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100'>
                      {formData.imageUrl ? (
                        <>
                          <ImageWithFallback
                            src={formData.imageUrl}
                            alt={formData.name}
                            className='w-full h-full object-cover'
                          />
                          <button
                            onClick={() =>
                              setFormData({ ...formData, imageUrl: '' })
                            }
                            className='absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors'
                          >
                            <X className='w-4 h-4' />
                          </button>
                        </>
                      ) : (
                        <div
                          className='w-full h-full flex items-center justify-center'
                          style={{ backgroundColor: formData.bgColor }}
                        >
                          <Upload className='w-12 h-12 text-gray-400' />
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <div>
                      <Label className='text-sm text-gray-600 mb-2 block'>
                        Upload Category Image
                      </Label>
                      <div className='flex items-center gap-3'>
                        <input
                          ref={fileInputRef}
                          type='file'
                          accept='image/*'
                          onChange={handleFileUpload}
                          className='hidden'
                        />
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className='flex-1'
                        >
                          {uploading ? (
                            <>
                              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                              Uploading to Supabase Storage...
                            </>
                          ) : (
                            <>
                              <Upload className='w-4 h-4 mr-2' />
                              {formData.imageUrl
                                ? 'Change Image'
                                : 'Upload Image'}
                            </>
                          )}
                        </Button>
                      </div>
                      <p className='text-xs text-gray-500 mt-1'>
                        Recommended: 800x600px, max 5MB (JPG, PNG, WebP)
                      </p>
                      <p className='text-xs text-gray-400 mt-1'>
                        Uploads to:{' '}
                        <span className='font-mono font-semibold'>
                          photify/categories/
                        </span>
                      </p>
                    </div>

                    {/* Fallback Color */}
                    <div>
                      <Label htmlFor='bgColor'>Fallback Background Color</Label>
                      <div className='flex items-center gap-3'>
                        <Input
                          id='bgColor'
                          type='color'
                          value={formData.bgColor}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              bgColor: e.target.value,
                            })
                          }
                          className='w-20 h-10'
                        />
                        <Input
                          value={formData.bgColor}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              bgColor: e.target.value,
                            })
                          }
                          placeholder='#e8e4df'
                        />
                      </div>
                      <p className='text-xs text-gray-500 mt-1'>
                        Used if image fails to load
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value='seo' className='space-y-6'>
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h2 className="font-['Bricolage_Grotesque',_sans-serif] text-xl font-semibold mb-6">
                    SEO & Metadata
                  </h2>

                  <div className='space-y-4'>
                    {/* SEO Title */}
                    <div>
                      <Label htmlFor='seoTitle'>SEO Title</Label>
                      <Input
                        id='seoTitle'
                        value={formData.seoTitle}
                        onChange={e =>
                          setFormData({ ...formData, seoTitle: e.target.value })
                        }
                        placeholder={
                          // eslint-disable-next-line no-constant-binary-expression
                          `${formData.name} | Your Store Name` ||
                          'Category Name | Your Store Name'
                        }
                        maxLength={60}
                      />
                      <div className='flex items-center justify-between mt-1'>
                        <p className='text-xs text-gray-500'>
                          Shown in search results and browser tabs
                        </p>
                        <span className='text-xs text-gray-400'>
                          {formData.seoTitle.length}/60
                        </span>
                      </div>
                    </div>

                    {/* SEO Description */}
                    <div>
                      <Label htmlFor='seoDescription'>SEO Description</Label>
                      <Textarea
                        id='seoDescription'
                        value={formData.seoDescription}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            seoDescription: e.target.value,
                          })
                        }
                        placeholder='Brief description of this category for search engines...'
                        rows={3}
                        maxLength={160}
                      />
                      <div className='flex items-center justify-between mt-1'>
                        <p className='text-xs text-gray-500'>
                          Shown in search results below the title
                        </p>
                        <span className='text-xs text-gray-400'>
                          {formData.seoDescription.length}/160
                        </span>
                      </div>
                    </div>

                    {/* SEO Keywords */}
                    <div>
                      <Label htmlFor='seoKeywords'>Keywords</Label>
                      <Input
                        id='seoKeywords'
                        value={formData.seoKeywords}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            seoKeywords: e.target.value,
                          })
                        }
                        placeholder='canvas prints, custom frames, wall art'
                      />
                      <p className='text-xs text-gray-500 mt-1'>
                        Comma-separated keywords (e.g., canvas prints, wall art,
                        custom frames)
                      </p>
                    </div>

                    {/* Meta Robots */}
                    <div>
                      <Label htmlFor='metaRobots'>Search Engine Indexing</Label>
                      <select
                        id='metaRobots'
                        value={formData.metaRobots}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            metaRobots: e.target.value,
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-200 rounded-lg'
                      >
                        <option value='index, follow'>
                          Index & Follow (Default)
                        </option>
                        <option value='index, nofollow'>
                          Index but Don&apos;t Follow Links
                        </option>
                        <option value='noindex, follow'>
                          Don&apos;t Index but Follow Links
                        </option>
                        <option value='noindex, nofollow'>
                          Don&apos;t Index & Don&apos;t Follow
                        </option>
                      </select>
                      <p className='text-xs text-gray-500 mt-1'>
                        Control how search engines index this category
                      </p>
                    </div>

                    {/* Canonical URL */}
                    <div>
                      <Label htmlFor='canonicalUrl'>Canonical URL</Label>
                      <Input
                        id='canonicalUrl'
                        value={formData.canonicalUrl}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            canonicalUrl: e.target.value,
                          })
                        }
                        placeholder={`https://yoursite.com/category/${formData.slug}`}
                      />
                      <p className='text-xs text-gray-500 mt-1'>
                        Preferred URL for this category (prevents duplicate
                        content)
                      </p>
                    </div>

                    <Separator className='my-6' />

                    {/* Open Graph Section */}
                    <div>
                      <h3 className="font-['Bricolage_Grotesque',_sans-serif] text-lg font-semibold mb-4">
                        Social Media Preview
                      </h3>
                      <p className='text-sm text-gray-600 mb-4'>
                        How this category appears when shared on social media
                      </p>
                    </div>

                    {/* OG Title */}
                    <div>
                      <Label htmlFor='ogTitle'>Social Media Title</Label>
                      <Input
                        id='ogTitle'
                        value={formData.ogTitle}
                        onChange={e =>
                          setFormData({ ...formData, ogTitle: e.target.value })
                        }
                        placeholder={formData.seoTitle || formData.name}
                      />
                      <p className='text-xs text-gray-500 mt-1'>
                        Defaults to SEO title if not set
                      </p>
                    </div>

                    {/* OG Description */}
                    <div>
                      <Label htmlFor='ogDescription'>
                        Social Media Description
                      </Label>
                      <Textarea
                        id='ogDescription'
                        value={formData.ogDescription}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            ogDescription: e.target.value,
                          })
                        }
                        placeholder={
                          formData.seoDescription || formData.description
                        }
                        rows={2}
                      />
                      <p className='text-xs text-gray-500 mt-1'>
                        Defaults to SEO description if not set
                      </p>
                    </div>

                    {/* OG Image */}
                    <div>
                      <Label htmlFor='ogImage'>Social Media Image URL</Label>
                      <Input
                        id='ogImage'
                        value={formData.ogImage}
                        onChange={e =>
                          setFormData({ ...formData, ogImage: e.target.value })
                        }
                        placeholder={formData.imageUrl || 'https://...'}
                      />
                      <p className='text-xs text-gray-500 mt-1'>
                        Defaults to category image if not set. Recommended:
                        1200x630px
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Products */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg border border-gray-200 p-6 sticky top-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className="font-['Bricolage_Grotesque',_sans-serif] text-xl font-semibold">
                  Associated Products
                </h2>
                <span className='text-sm text-gray-600'>
                  {products.length} product{products.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loadingProducts ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
                </div>
              ) : products.length === 0 ? (
                <div className='text-center py-12'>
                  <Package className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                  <p className='text-sm text-gray-600 mb-4'>
                    No products in this category yet
                  </p>
                  <p className='text-xs text-gray-500'>
                    Assign products to this category from the product editor
                  </p>
                </div>
              ) : (
                <div className='space-y-3 max-h-[600px] overflow-y-auto'>
                  {products.map(product => (
                    <div
                      key={product.id}
                      className='flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow'
                    >
                      <div className='relative w-12 h-12 rounded overflow-hidden flex-shrink-0'>
                        {product.images && product.images.length > 0 ? (
                          <ImageWithFallback
                            src={product.images[0]}
                            alt={product.name}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                            <Package className='w-6 h-6 text-gray-400' />
                          </div>
                        )}
                      </div>

                      <div className='flex-1 min-w-0'>
                        <p className='font-semibold text-sm truncate'>
                          {product.name}
                        </p>
                        <p className='text-xs text-gray-600'>
                          £{product.price.toFixed(2)}/sq in
                        </p>
                      </div>

                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          window.open(
                            `/admin/products/edit/${product.slug}`,
                            '_blank'
                          )
                        }
                        className='flex-shrink-0'
                      >
                        <Eye className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
