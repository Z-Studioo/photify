import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import { AdminArtSizeManager } from './admin-art-size-manager';
import { AdminArtContentEditor } from './admin-art-content-editor';
import { AdminArtProductTagsEditor } from './admin-art-product-tags-editor';
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog';
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  FileText,
  Settings,
  Image as ImageIcon,
  Package,
  Plus,
  Tag,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Product types (hardcoded for now)
const PRODUCT_TYPES = [
  'Canvas',
  'Framed Print',
  'Poster',
  'T-shirt',
  'Mug',
  'Phone Case',
  'Tote Bag',
  'Pillow',
  'Wall Tapestry',
];

interface ArtProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category: string;
  price: string;

  // New fields
  images: string[];
  product_type: string;
  customization_product_id?: string | null;
  allow_customization: boolean;

  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string[];

  features?: string[];
  specifications?: any[];

  aspect_ratio_id?: string | null;
  available_sizes?: any[];

  stock_quantity: number;
  status: string;
  is_bestseller: boolean;
}

export function AdminArtEditPage() {
  const navigate = useNavigate();
  const { id: productId } = useParams<{ id: string }>();
  const supabase = createClient();
  const isNewProduct = !productId || productId === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ArtProduct | null>(null);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState('basic');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch product data and available products for customization
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        if (isNewProduct) {
          // Initialize empty product - use null for optional UUIDs
          setProduct({
            id: '',
            name: '',
            slug: '',
            description: '',
            category: 'Abstract',
            price: '',
            images: [],
            product_type: 'Canvas',
            allow_customization: false,
            customization_product_id: null,
            meta_title: '',
            meta_description: '',
            meta_keywords: [],
            features: [],
            specifications: [],
            aspect_ratio_id: null,
            available_sizes: [],
            stock_quantity: 0,
            status: 'draft',
            is_bestseller: false,
          });
        } else {
          // Fetch existing product
          const { data, error } = await supabase
            .from('art_products')
            .select('*')
            .eq('id', productId)
            .single();

          if (error) {
            throw new Error(
              error.message || error.hint || 'Failed to fetch art product'
            );
          }

          if (data) {
            // Handle both old and new data structures
            setProduct({
              id: data.id,
              name: data.name || '',
              slug: data.slug || '',
              description: data.description || '',
              category: data.category || 'Abstract',
              price: data.price || '£0.00',

              // New fields - with fallbacks
              images: data.images || (data.image ? [data.image] : []), // Fallback to old 'image' field
              product_type: data.product_type || 'Canvas',
              customization_product_id: data.customization_product_id,
              allow_customization: data.allow_customization || false,

              meta_title: data.meta_title || '',
              meta_description: data.meta_description || '',
              meta_keywords: data.meta_keywords || [],

              features: data.features || [],
              specifications: data.specifications || [],

              aspect_ratio_id: data.aspect_ratio_id,
              available_sizes: data.available_sizes || [],

              stock_quantity: data.stock_quantity || 0,
              status: data.status || 'active',
              is_bestseller: data.is_bestseller || false,
            });
          } else {
            throw new Error(
              'Art product not found - no data returned from database'
            );
          }
        }

        // Fetch available products for customization dropdown
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, slug')
          .order('name');

        if (productsError) {
          // console.warn(
          //   'Failed to fetch products for customization:',
          //   productsError
          // );
          // Don't fail the whole page if customization products can't load
        } else {
          // console.log(
          //   'Loaded products for customization:',
          //   products?.length || 0
          // );
        }

        setAvailableProducts(products || []);

      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.error_description ||
          error?.hint ||
          'Failed to load art product. Check console for details.';
        toast.error(errorMessage);

        if (!isNewProduct) {
          // Only redirect if we're trying to edit an existing product
          setTimeout(() => navigate('/admin/art-collection'), 2000);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [productId, isNewProduct, supabase]);

  const handleSave = async () => {
    if (!product) return;

    // Validation
    if (!product.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!product.slug.trim()) {
      toast.error('Product slug is required');
      return;
    }

    if (!product.price.trim() || product.price === '£') {
      toast.error('Base price is required');
      return;
    }

    if (isNewProduct && product.images.length === 0) {
      toast.error('Please upload at least one image before creating the product');
      return;
    }

    // Normalise price — ensure it has £ prefix
    const normalisedPrice = product.price.startsWith('£')
      ? product.price
      : `£${product.price}`;

    try {
      setSaving(true);

      if (isNewProduct) {
        // Check slug uniqueness
        const { data: existing } = await supabase
          .from('art_products')
          .select('id')
          .eq('slug', product.slug.trim())
          .maybeSingle();
        if (existing) {
          toast.error('An art product with this slug already exists. Please choose a different slug.');
          setSaving(false);
          return;
        }

        // Create new product
        const { data, error } = await supabase
          .from('art_products')
          .insert([
            {
              name: product.name.trim(),
              slug: product.slug.trim(),
              description: product.description?.trim() || null,
              category: product.category,
              price: normalisedPrice,
              image: product.images[0],  // legacy NOT NULL column
              size: '',  // legacy NOT NULL column (superseded by available_sizes)
              images: product.images,
              product_type: product.product_type,
              customization_product_id:
                product.allow_customization && product.customization_product_id
                  ? product.customization_product_id
                  : null,
              allow_customization: product.allow_customization,
              meta_title: product.meta_title?.trim() || null,
              meta_description: product.meta_description?.trim() || null,
              meta_keywords: product.meta_keywords ?? [],
              features: product.features ?? [],
              specifications: product.specifications ?? [],
              aspect_ratio_id: product.aspect_ratio_id || null,
              available_sizes: product.available_sizes ?? [],
              stock_quantity: product.stock_quantity || 0,
              status: product.status,
              is_bestseller: product.is_bestseller || false,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        toast.success('Art product created successfully');
        navigate(`/admin/art-collection/edit/${data.id}`);
      } else {
        // Update existing product
        const { error } = await supabase
          .from('art_products')
          .update({
            name: product.name.trim(),
            slug: product.slug.trim(),
            description: product.description?.trim() || null,
            category: product.category,
            price: normalisedPrice,
            image: product.images[0] ?? '',  // keep legacy column in sync
            size: '',  // legacy NOT NULL column (superseded by available_sizes)
            images: product.images,
            product_type: product.product_type,
            customization_product_id:
              product.allow_customization && product.customization_product_id
                ? product.customization_product_id
                : null,
            allow_customization: product.allow_customization,
            meta_title: product.meta_title?.trim() || null,
            meta_description: product.meta_description?.trim() || null,
            meta_keywords: product.meta_keywords ?? [],
            features: product.features ?? [],
            specifications: product.specifications ?? [],
            aspect_ratio_id: product.aspect_ratio_id || null,
            available_sizes: product.available_sizes ?? [],
            stock_quantity: product.stock_quantity || 0,
            status: product.status,
            is_bestseller: product.is_bestseller || false,
          })
          .eq('id', productId);

        if (error) {
          // console.error('Update error:', error);
          throw error;
        }
        toast.success('Art product updated successfully');
      }
    } catch (error: any) {
      // console.error('Error saving:', error);
      toast.error(error.message || 'Failed to save art product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('art_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast.success('Art product deleted successfully');
      navigate('/admin/art-collection');
    } catch (error) {
      toast.error('Failed to delete art product');
      console.warn(error);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    if (!product) return;
    setProduct({
      ...product,
      name,
      slug: isNewProduct ? generateSlug(name) : product.slug,
    });
  };

  // Image management for Tab 2
  const handleImagesUpdate = (newImages: string[]) => {
    if (!product) return;
    setProduct({ ...product, images: newImages });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e]' />
          <span className='ml-2'>Loading...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className='text-center py-12'>
          <p className='text-red-600'>Product not found</p>
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
            onClick={() => navigate('/admin/art-collection')}
            className='mb-4 -ml-2'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Art Collection
          </Button>

          <div className='flex items-start justify-between'>
            <div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
                style={{ fontSize: '32px', fontWeight: '600' }}
              >
                {isNewProduct ? 'Add New Art Product' : 'Edit Art Product'}
              </h1>
              <p className='text-gray-600'>
                {isNewProduct
                  ? 'Create a new art product for your collection'
                  : product.name}
              </p>
            </div>
            <div className='flex gap-2'>
              {!isNewProduct && (
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant='outline'
                  className='border-red-200 text-red-600 hover:bg-red-50'
                  disabled={saving}
                >
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
                style={{ height: '50px' }}
              >
                <Save className='w-4 h-4' />
                {saving
                  ? 'Saving...'
                  : isNewProduct
                    ? 'Create Product'
                    : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-5 h-auto p-1 bg-gray-100'>
            <TabsTrigger value='basic' className='gap-2 py-3'>
              <Settings className='w-4 h-4' />
              <span className='hidden sm:inline'>Basic Info</span>
            </TabsTrigger>
            <TabsTrigger value='images' className='gap-2 py-3'>
              <ImageIcon className='w-4 h-4' />
              <span className='hidden sm:inline'>Images</span>
            </TabsTrigger>
            <TabsTrigger value='sizes' className='gap-2 py-3'>
              <Package className='w-4 h-4' />
              <span className='hidden sm:inline'>Sizes & Pricing</span>
            </TabsTrigger>
            <TabsTrigger value='tags' className='gap-2 py-3'>
              <Tag className='w-4 h-4' />
              <span className='hidden sm:inline'>Tags</span>
            </TabsTrigger>
            <TabsTrigger value='content' className='gap-2 py-3'>
              <FileText className='w-4 h-4' />
              <span className='hidden sm:inline'>SEO & Content</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Information */}
          <TabsContent value='basic' className='space-y-6'>
            <div className='bg-white rounded-lg border border-gray-200 p-6 space-y-4'>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif]"
                style={{ fontSize: '20px', fontWeight: '600' }}
              >
                Basic Information
              </h2>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='name'>Product Name *</Label>
                  <Input
                    id='name'
                    value={product.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder='e.g., Ocean Dreams'
                  />
                </div>

                <div>
                  <Label htmlFor='slug'>URL Slug *</Label>
                  <Input
                    id='slug'
                    value={product.slug}
                    onChange={e =>
                      setProduct({ ...product, slug: e.target.value })
                    }
                    placeholder='ocean-dreams'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  value={product.description || ''}
                  onChange={e =>
                    setProduct({ ...product, description: e.target.value })
                  }
                  placeholder='Describe the artwork...'
                  rows={4}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='product-type'>Product Type *</Label>
                  <Select
                    value={product.product_type}
                    onValueChange={value =>
                      setProduct({ ...product, product_type: value })
                    }
                  >
                    <SelectTrigger id='product-type'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='category'>Category *</Label>
                  <Select
                    value={product.category}
                    onValueChange={value =>
                      setProduct({ ...product, category: value })
                    }
                  >
                    <SelectTrigger id='category'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Abstract'>Abstract</SelectItem>
                      <SelectItem value='Religion'>Religion</SelectItem>
                      <SelectItem value='Animals'>Animals</SelectItem>
                      <SelectItem value='Nepal'>Nepal</SelectItem>
                      <SelectItem value='Nature'>Nature</SelectItem>
                      <SelectItem value='Modern'>Modern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <Label htmlFor='base-price'>Base Price *</Label>
                  <div className='relative mt-1'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>£</span>
                    <Input
                      id='base-price'
                      type='number'
                      step='0.01'
                      min='0.01'
                      value={product.price.replace('£', '')}
                      onChange={e =>
                        setProduct({ ...product, price: e.target.value })
                      }
                      placeholder='68.00'
                      className='pl-7'
                    />
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    Reference price (individual size prices set in Sizes tab)
                  </p>
                </div>

                <div>
                  <Label htmlFor='stock'>Stock Quantity</Label>
                  <Input
                    id='stock'
                    type='number'
                    value={product.stock_quantity}
                    onChange={e =>
                      setProduct({
                        ...product,
                        stock_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder='50'
                  />
                </div>

                <div>
                  <Label htmlFor='status'>Status *</Label>
                  <Select
                    value={product.status}
                    onValueChange={value =>
                      setProduct({ ...product, status: value })
                    }
                  >
                    <SelectTrigger id='status'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='inactive'>Inactive</SelectItem>
                      <SelectItem value='draft'>Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='bestseller'
                  checked={product.is_bestseller}
                  onChange={e =>
                    setProduct({ ...product, is_bestseller: e.target.checked })
                  }
                  className='w-4 h-4 text-[#f63a9e] border-gray-300 rounded focus:ring-[#f63a9e]'
                />
                <Label htmlFor='bestseller' className='cursor-pointer'>
                  Mark as Best Seller
                </Label>
              </div>
            </div>

            {/* Customization Section */}
            <div className='bg-white rounded-lg border border-gray-200 p-6 space-y-4'>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif]"
                style={{ fontSize: '20px', fontWeight: '600' }}
              >
                Customization Options
              </h2>

              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='allow-customization'
                  checked={product.allow_customization}
                  onChange={e =>
                    setProduct({
                      ...product,
                      allow_customization: e.target.checked,
                    })
                  }
                  className='w-4 h-4 text-[#f63a9e] border-gray-300 rounded focus:ring-[#f63a9e]'
                />
                <Label htmlFor='allow-customization' className='cursor-pointer'>
                  Allow customization for this art product
                </Label>
              </div>

              {product.allow_customization && (
                <div>
                  <Label htmlFor='customization-product'>
                    Customization Product
                  </Label>
                  <Select
                    value={product.customization_product_id || ''}
                    onValueChange={value =>
                      setProduct({
                        ...product,
                        customization_product_id: value,
                      })
                    }
                  >
                    <SelectTrigger id='customization-product'>
                      <SelectValue placeholder='Select a product...' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-gray-500 mt-1'>
                    Users will be redirected to this product for customization
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Product Images */}
          <TabsContent value='images'>
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] mb-4"
                style={{ fontSize: '20px', fontWeight: '600' }}
              >
                Product Images
              </h2>
              <p className='text-sm text-gray-600 mb-2'>
                Upload and manage product images. First image will be the
                featured image.
              </p>
              {isNewProduct && (
                <div className='mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                  <p className='text-sm text-amber-700'>
                    <strong>Required:</strong> Upload at least one image before creating this art product.
                  </p>
                </div>
              )}

              {/* Image gallery */}
              <div className='space-y-4'>
                {product.images.map((img, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-4 p-4 border rounded-lg bg-gray-50'
                  >
                    <img
                      src={img}
                      alt={`Image ${index + 1}`}
                      className='w-20 h-20 object-cover rounded border border-gray-200'
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23ddd" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3EError%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className='flex-1'>
                      <p className='font-medium'>Image {index + 1}</p>
                      {index === 0 && (
                        <span className='text-xs bg-[#f63a9e] text-white px-2 py-0.5 rounded'>
                          Featured
                        </span>
                      )}
                      <p className='text-xs text-gray-500 mt-1 break-all'>
                        {img}
                      </p>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        const newImages = product.images.filter(
                          (_, i) => i !== index
                        );
                        handleImagesUpdate(newImages);
                      }}
                      className='text-red-600 hover:bg-red-50'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                ))}

                {product.images.length === 0 && (
                  <div className='text-center py-12 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50'>
                    <ImageIcon className='w-12 h-12 mx-auto mb-3 text-gray-400' />
                    <p className='font-medium'>No images uploaded yet</p>
                    <p className='text-sm mt-1'>
                      Click the button below to upload images
                    </p>
                  </div>
                )}

                {/* Upload section */}
                <div className='pt-4 border-t'>
                  <input
                    type='file'
                    id='image-upload'
                    accept='image/jpeg,image/png,image/webp,image/gif'
                    multiple
                    className='hidden'
                    onChange={async e => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;

                      for (const file of files) {
                        // Validate file size (5MB max)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error(`${file.name} is too large (max 5MB)`);
                          continue;
                        }

                        const fileName = `art-products/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;

                        try {
                          toast.loading(`Uploading ${file.name}...`, {
                            id: fileName,
                          });

                          // Upload to Supabase Storage
                          const { error: uploadError } = await supabase.storage
                            .from('photify')
                            .upload(fileName, file, {
                              cacheControl: '3600',
                              upsert: false,
                            });

                          if (uploadError) throw uploadError;

                          // Get public URL
                          const {
                            data: { publicUrl },
                          } = supabase.storage
                            .from('photify')
                            .getPublicUrl(fileName);

                          handleImagesUpdate([...product.images, publicUrl]);
                          toast.success(`${file.name} uploaded`, {
                            id: fileName,
                          });
                        } catch (error: any) {
                          console.error('Upload error:', error);
                          toast.error(`Failed to upload ${file.name}`, {
                            id: fileName,
                          });
                        }
                      }

                      // Reset input
                      e.target.value = '';
                    }}
                  />
                  <Button
                    variant='outline'
                    onClick={() =>
                      document.getElementById('image-upload')?.click()
                    }
                    className='gap-2 w-full sm:w-auto'
                  >
                    <Plus className='w-4 h-4' />
                    Upload Images
                  </Button>
                  <p className='text-xs text-gray-500 mt-2'>
                    Supported formats: JPG, PNG, WebP, GIF (max 5MB per image)
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Sizes & Pricing */}
          <TabsContent value='sizes'>
            <AdminArtSizeManager
              availableSizes={product.available_sizes || []}
              images={product.images}
              onSizesChange={sizes =>
                setProduct({ ...product, available_sizes: sizes })
              }
              aspectRatioId={product.aspect_ratio_id || undefined}
              onAspectRatioChange={ratioId =>
                setProduct({ ...product, aspect_ratio_id: ratioId })
              }
            />
          </TabsContent>

          {/* Tab 4: Tags */}
          <TabsContent value='tags'>
            {!isNewProduct ? (
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <AdminArtProductTagsEditor artProductId={product.id} />
              </div>
            ) : (
              <div className='bg-gray-50 rounded-lg border border-gray-200 p-8 text-center'>
                <Package className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                <h3 className='font-semibold text-gray-900 mb-2'>
                  Save Product First
                </h3>
                <p className='text-gray-600'>
                  Save the basic information first before adding tags to this
                  art product.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Tab 5: SEO & Content */}
          <TabsContent value='content'>
            <AdminArtContentEditor
              metaTitle={product.meta_title || ''}
              metaDescription={product.meta_description || ''}
              metaKeywords={product.meta_keywords || []}
              onMetaTitleChange={value =>
                setProduct({ ...product, meta_title: value })
              }
              onMetaDescriptionChange={value =>
                setProduct({ ...product, meta_description: value })
              }
              onMetaKeywordsChange={value =>
                setProduct({ ...product, meta_keywords: value })
              }
              features={product.features || []}
              specifications={product.specifications || []}
              onFeaturesChange={features =>
                setProduct({ ...product, features })
              }
              onSpecificationsChange={specs =>
                setProduct({ ...product, specifications: specs })
              }
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      {!isNewProduct && product && (
        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteConfirm}
          title='Delete Art Product?'
          itemName={product.name}
          itemType='art product'
          loading={deleting}
          warningMessage='This action cannot be undone.'
        />
      )}
    </AdminLayout>
  );
}
