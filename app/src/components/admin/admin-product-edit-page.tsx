import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import { AdminProductConfigEditor } from './admin-product-config-editor';
import { AdminProductContentEditor } from './admin-product-content-editor';
import { AdminProductCategoriesEditor } from './admin-product-categories-editor';
import { AdminFeaturedProductEditor } from './admin-featured-product-editor';
import { AdminProductImageManager } from './admin-product-image-manager';
import { AdminProductTagsEditor } from './admin-product-tags-editor';
import { AdminConfigurerSelector } from './admin-configurer-selector';
import { AdminProductRoomBackgroundsEditor } from './admin-product-room-backgrounds-editor';
import {
  getProductConfig,
  hasCustomConfigurator,
} from '@/components/product-configs';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Settings as SettingsIcon,
  Tag,
  Images,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Lazy load config editor to optimize bundle size
const SingleCanvasConfigEditor = lazy(() =>
  import('@/components/product-configs/single-canvas/config-editor').then(
    m => ({
      default: m.SingleCanvasConfigEditor,
    })
  )
);

export function AdminProductEditPage() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);

      const supabase = createClient();

      try {
        // Check if productId is a UUID or a slug
        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            productId as string
          );

        const { data, error } = await supabase
          .from('products')
          .select(
            `
            *,
            categories:product_categories(
              category:categories(*)
            )
          `
          )
          .or(isUUID ? `id.eq.${productId}` : `slug.eq.${productId}`)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          // console.error('❌ No product found for:', productId);
        }

        setProduct(data);
      } catch (error: any) {
        console.error('❌ Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleConfigSave = () => {
    // Refresh product data after save
    const refreshProduct = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .single();

      if (data) {
        setProduct(data);
      }
    };
    refreshProduct();
  };

  const handleConfigurerSelect = async (configurerId: string | null) => {
    const supabase = createClient();

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        // console.error('❌ Not authenticated:', authError);
        toast.error('You must be logged in to save changes');
        return;
      }

      // Get current product config, ensure it's an object
      const currentConfig =
        product.config && typeof product.config === 'object'
          ? product.config
          : {};

      // Create updated config
      const updatedConfig = {
        ...currentConfig,
        configurerType: configurerId,
      };

      const { data, error } = await supabase
        .from('products')
        .update({
          config: updatedConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
        .select('id, name, slug, config');

      if (error) {
        toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
        return;
      }

      if (!data || data.length === 0) {
        toast.error('Update failed: No data returned');
        return;
      }

      // Update local state with the returned data
      setProduct({
        ...product,
        config: data[0].config,
      });

      toast.success(
        configurerId
          ? '✅ Configurer saved successfully!'
          : 'Configurer removed'
      );
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Failed to save'}`);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e]' />
          <span className='ml-2 text-gray-600'>Loading product...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className='max-w-5xl mx-auto'>
          <div className='text-center py-12'>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Product not found
            </h2>
            <p className='text-gray-600 mb-6'>
              The product you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => navigate('/admin/products')}>
              Back to Products
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const productTypeLabels: Record<string, string> = {
    canvas: 'Canvas Print',
    framed_canvas: 'Framed Canvas',
    metal_print: 'Metal Print',
  };

  return (
    <AdminLayout>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <button
            onClick={() => navigate('/admin/products')}
            className='flex items-center gap-2 text-gray-600 hover:text-[#f63a9e] mb-6 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            Back to Products
          </button>

          <div className='flex items-start gap-6'>
            {/* Product Image */}
            {product.images && product.images.length > 0 && (
              <div className='w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                <ImageWithFallback
                  src={product.images[0]}
                  alt={product.name}
                  className='w-full h-full object-cover'
                />
              </div>
            )}

            {/* Product Info */}
            <div className='flex-1'>
              <div className='flex items-start justify-between'>
                <div>
                  <h1
                    className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
                    style={{ fontSize: '32px', fontWeight: '600' }}
                  >
                    {product.name}
                  </h1>
                  <p className='text-gray-600 mb-3'>
                    {product.description || 'No description'}
                  </p>
                  <div className='flex items-center gap-4 text-sm'>
                    <div>
                      <span className='text-gray-600'>Type:</span>{' '}
                      <span className='font-medium'>
                        {productTypeLabels[product.product_type] ||
                          product.product_type}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-600'>Base Price:</span>{' '}
                      <span className='font-medium text-[#f63a9e]'>
                        £
                        {typeof product.price === 'number'
                          ? product.price.toFixed(2)
                          : product.price}
                        /sq in
                      </span>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          product.config_status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {product.config_status === 'active'
                          ? 'Configured'
                          : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className='my-8' />

        {/* Tabs for Product Info, Configuration, Images, Categories & Featured, and Tags */}
        <Tabs defaultValue='content' className='w-full'>
          <TabsList className='grid w-full max-w-5xl grid-cols-5'>
            <TabsTrigger value='content' className='flex items-center gap-2'>
              <FileText className='w-4 h-4' />
              Product Info & Content
            </TabsTrigger>
            <TabsTrigger
              value='configuration'
              className='flex items-center gap-2'
            >
              <SettingsIcon className='w-4 h-4' />
              Configuration
            </TabsTrigger>
            <TabsTrigger value='images' className='flex items-center gap-2'>
              <Images className='w-4 h-4' />
              Product Images
            </TabsTrigger>
            <TabsTrigger value='categories' className='flex items-center gap-2'>
              <Tag className='w-4 h-4' />
              Categories & Featured
            </TabsTrigger>
            <TabsTrigger value='tags' className='flex items-center gap-2'>
              <Tag className='w-4 h-4' />
              Tags
            </TabsTrigger>
          </TabsList>

          {/* Product Info & Content Tab */}
          <TabsContent value='content' className='mt-6'>
            <AdminProductContentEditor productId={product.id} />
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value='configuration' className='mt-6'>
            <div className='bg-white rounded-lg border border-gray-200 p-6 mb-6'>
              <h2 className="font-['Bricolage_Grotesque',_sans-serif] text-xl font-semibold mb-6">
                Product Configurator
              </h2>

              {/* Configurer Selector - NEW */}
              <AdminConfigurerSelector
                productId={product.id}
                currentConfigurerId={product.config?.configurerType || null}
                onSelect={handleConfigurerSelect}
              />
            </div>

            {/* Room Backgrounds Editor - Only for multi-canvas-wall configurator */}
            {product.config?.configurerType === 'multi-canvas-wall' && (
              <div className='mb-6'>
                <AdminProductRoomBackgroundsEditor
                  productId={product.id}
                  currentRooms={product.config?.roomBackgrounds || []}
                />
              </div>
            )}

            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h2 className="font-['Bricolage_Grotesque',_sans-serif] text-xl font-semibold mb-6">
                Size & Pricing Configuration
              </h2>

              {/* Check if product has a custom configurator */}
              {hasCustomConfigurator(product.id) ? (
                // Use product-specific configurator
                (() => {
                  const productConfig = getProductConfig(product.id);

                  // Map config types to dynamic components
                  const ConfigEditorComponent =
                    productConfig?.configType === 'single-canvas'
                      ? SingleCanvasConfigEditor
                      : null;

                  return ConfigEditorComponent ? (
                    <>
                      <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
                        <p className='text-sm text-green-700'>
                          ✓ Using custom configurator for{' '}
                          <strong>{productConfig.product.name}</strong>
                        </p>
                      </div>
                      <Suspense
                        fallback={
                          <div className='p-4 flex items-center justify-center'>
                            <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e]' />
                          </div>
                        }
                      >
                        <ConfigEditorComponent
                          currentConfig={product.config}
                          onSave={handleConfigSave}
                        />
                      </Suspense>
                    </>
                  ) : null;
                })()
              ) : (
                // Use generic configurator
                <>
                  <div className='mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
                    <p className='text-sm text-gray-600'>
                      Using generic configurator. Create a custom configurator
                      in{' '}
                      <code className='bg-gray-200 px-1 rounded'>
                        components/product-configs/{product.slug}/
                      </code>{' '}
                      for product-specific options.
                    </p>
                  </div>
                  <AdminProductConfigEditor
                    productId={product.id}
                    productType={product.product_type}
                    currentConfig={product.config}
                    onSave={handleConfigSave}
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* Product Images Tab */}
          <TabsContent value='images' className='mt-6'>
            <AdminProductImageManager productId={product.id} />
          </TabsContent>

          {/* Categories & Featured Tab */}
          <TabsContent value='categories' className='mt-6'>
            <div className='space-y-6'>
              {/* Categories Section */}
              <AdminProductCategoriesEditor productId={product.id} />

              <Separator />

              {/* Featured Product Section */}
              <AdminFeaturedProductEditor productId={product.id} />
            </div>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value='tags' className='mt-6'>
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <AdminProductTagsEditor productId={product.id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
