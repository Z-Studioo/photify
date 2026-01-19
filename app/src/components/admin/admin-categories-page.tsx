import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from './admin-layout';
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog';
import {
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Eye,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image_url?: string;
  bg_color: string;
  display_order: number;
  is_active: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
  product_count?: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  active: boolean;
}

// Sortable Row Component
function SortableRow({
  category,
  onView,
  onDelete,
  onViewProducts,
}: {
  category: Category;
  onView: (category: Category) => void;
  onDelete: (category: Category) => void;
  onViewProducts: (category: Category) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className='hover:bg-gray-50 transition-colors group'
    >
      <td className='px-6 py-4'>
        <div className='flex items-center gap-4'>
          <div
            {...attributes}
            {...listeners}
            className='cursor-move p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <GripVertical className='w-5 h-5 text-gray-400' />
          </div>

          {/* Category Image or Color Square */}
          <div className='relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0'>
            {category.image_url ? (
              <ImageWithFallback
                src={category.image_url}
                alt={category.name}
                className='w-full h-full object-cover'
              />
            ) : (
              <div
                className='w-full h-full flex items-center justify-center'
                style={{ backgroundColor: category.bg_color }}
              >
                <span className='text-xs text-gray-600'>No Image</span>
              </div>
            )}
          </div>

          <div>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '16px', fontWeight: '600' }}
            >
              {category.name}
            </p>
            {category.description && (
              <p className='text-sm text-gray-500 mt-1 line-clamp-1'>
                {category.description}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className='px-6 py-4'>
        <span className='text-sm text-gray-600'>/{category.slug}</span>
      </td>
      <td className='px-6 py-4'>
        <button
          onClick={() => onViewProducts(category)}
          className='flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-[#f63a9e] transition-colors'
        >
          <Package className='w-4 h-4' />
          {category.product_count || 0} products
        </button>
      </td>
      <td className='px-6 py-4'>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            category.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {category.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className='px-6 py-4'>
        <div className='flex items-center justify-end gap-2'>
          <button
            onClick={() => onView(category)}
            className='p-2 text-gray-600 hover:text-[#f63a9e] hover:bg-pink-50 rounded-lg transition-colors'
            title='View & Edit'
          >
            <Eye className='w-4 h-4' />
          </button>
          <button
            onClick={() => onDelete(category)}
            className='p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
            title='Delete'
          >
            <Trash2 className='w-4 h-4' />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: 'Frame',
    imageUrl: '',
    bgColor: '#e8e4df',
    description: '',
    isActive: true,
  });

  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch categories with product counts
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Try to fetch from view first (with product counts)
      let { data, error } = await supabase
        .from('v_categories_with_counts')
        .select('*')
        .order('display_order', { ascending: true });

      // If view doesn't exist, fall back to regular categories table
      if (error && error.code === '42P01') {
        console.warn(
          'View v_categories_with_counts not found, using categories table'
        );
        const response = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });

        data = response.data;
        error = response.error;

        // Add product_count: 0 to each category for consistency
        if (data) {
          data = data.map(cat => ({
            ...cat,
            product_count: 0,
            active_product_count: 0,
          }));
        }
      }

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error(
        'Failed to load categories: ' + (error.message || 'Unknown error')
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for a category
  const fetchCategoryProducts = async (category: Category) => {
    setLoadingProducts(true);
    setSelectedCategory(category);
    setShowProductsModal(true);

    try {
      // Try using the RPC function first
      // eslint-disable-next-line prefer-const
      let { data, error } = await supabase.rpc('get_category_products', {
        category_uuid: category.id,
      });

      // If function doesn't exist, use manual join query
      if (
        error &&
        (error.code === '42883' ||
          error.message?.includes('function') ||
          error.message?.includes('does not exist'))
      ) {
        console.warn(
          'Function get_category_products not found, using manual query'
        );
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
              active
            )
          `
          )
          .eq('category_id', category.id);

        if (response.error) throw response.error;

        // Transform the data to match expected format
        data =
          response.data?.map((item: any) => item.products).filter(Boolean) ||
          [];
      } else if (error) {
        throw error;
      }

      setCategoryProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching category products:', error);
      toast.error(
        'Failed to load products: ' + (error.message || 'Unknown error')
      );
      setCategoryProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = categories.findIndex(cat => cat.id === active.id);
    const newIndex = categories.findIndex(cat => cat.id === over.id);

    const newCategories = arrayMove(categories, oldIndex, newIndex);

    setCategories(newCategories);

    try {
      const updates = newCategories.map((cat, index) => ({
        id: cat.id,
        display_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('Category order updated successfully');
    } catch (error: any) {
      console.error('Error updating category order:', error);
      toast.error('Failed to update category order');
      fetchCategories();
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: formData.name,
          slug: formData.slug,
          icon: formData.icon,
          image_url: formData.imageUrl || null,
          bg_color: formData.bgColor,
          description: formData.description || null,
          is_active: formData.isActive,
          display_order: categories.length + 1,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Category created! Redirecting to edit page...');

      // Redirect to the detail page
      if (data) {
        router.push(`/admin/categories/${data.id}`);
      }
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category: ' + error.message);
    }
  };

  const handleView = (category: Category) => {
    router.push(`/admin/categories/${category.id}`);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      toast.error('Failed to delete category: ' + error.message);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setCategoryToDelete(null);
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

  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8 flex items-start justify-between'>
          <div>
            <h1
              className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
              style={{ fontSize: '32px', fontWeight: '600' }}
            >
              Category Management
            </h1>
            <p className='text-gray-600'>
              Drag and drop to reorder categories. Order will reflect on
              homepage.
            </p>

            {/* Setup Notice */}
            {categories.length === 0 && !loading && (
              <div className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                <p className='text-sm text-yellow-800'>
                  <strong>Setup Required:</strong> Run the setup script in
                  Supabase SQL Editor.
                  <br />
                  <span className='text-xs'>
                    File:{' '}
                    <code className='bg-yellow-100 px-1 py-0.5 rounded'>
                      supabase/setup-categories-complete.sql
                    </code>
                  </span>
                </p>
              </div>
            )}
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
            style={{ height: '50px' }}
          >
            <Plus className='w-5 h-5' />
            Add Category
          </Button>
        </div>

        {/* Categories List with Drag & Drop */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Category
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Slug
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Products
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <SortableContext
                  items={categories.map(cat => cat.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className='divide-y divide-gray-200'>
                    {categories.map(category => (
                      <SortableRow
                        key={category.id}
                        category={category}
                        onView={handleView}
                        onDelete={handleDelete}
                        onViewProducts={fetchCategoryProducts}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        </div>

        {/* Quick Add Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md font-['Mona_Sans',_sans-serif]">
            <DialogHeader>
              <DialogTitle
                className="font-['Bricolage_Grotesque',_sans-serif]"
                style={{ fontSize: '24px', fontWeight: '600' }}
              >
                Add New Category
              </DialogTitle>
              <p className='text-sm text-gray-600'>
                Create a category. You can add details on the next page.
              </p>
            </DialogHeader>

            <div className='space-y-4 mt-4'>
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
                  autoFocus
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
                  Auto-generated from name. Used in URLs.
                </p>
              </div>

              <div className='flex items-center gap-3 pt-4'>
                <Button
                  onClick={handleSave}
                  className='flex-1 bg-[#f63a9e] hover:bg-[#e02d8d]'
                  style={{ height: '50px' }}
                >
                  Create & Edit Details
                </Button>
                <Button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      name: '',
                      slug: '',
                      icon: 'Frame',
                      imageUrl: '',
                      bgColor: '#e8e4df',
                      description: '',
                      isActive: true,
                    });
                  }}
                  variant='outline'
                  style={{ height: '50px' }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Products Modal */}
        <Dialog open={showProductsModal} onOpenChange={setShowProductsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto font-['Mona_Sans',_sans-serif]">
            <DialogHeader>
              <DialogTitle
                className="font-['Bricolage_Grotesque',_sans-serif]"
                style={{ fontSize: '24px', fontWeight: '600' }}
              >
                Products in &quot;{selectedCategory?.name}&quot;
              </DialogTitle>
            </DialogHeader>

            <div className='mt-4'>
              {loadingProducts ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
                </div>
              ) : categoryProducts.length === 0 ? (
                <div className='text-center py-12'>
                  <Package className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                  <p className='text-gray-600'>
                    No products in this category yet
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {categoryProducts.map(product => (
                    <div
                      key={product.id}
                      className='flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow'
                    >
                      <div className='relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0'>
                        {product.images && product.images.length > 0 ? (
                          <ImageWithFallback
                            src={product.images[0]}
                            alt={product.name}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                            <Package className='w-8 h-8 text-gray-400' />
                          </div>
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className="font-['Bricolage_Grotesque',_sans-serif] font-semibold text-sm truncate">
                          {product.name}
                        </p>
                        <p className='text-sm text-gray-600 mt-1'>
                          £{product.price.toFixed(2)}/sq in
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                            product.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {product.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          window.open(
                            `/admin/products/edit/${product.slug}`,
                            '_blank'
                          )
                        }
                      >
                        <Eye className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteConfirm}
          title='Delete Category?'
          itemName={categoryToDelete?.name}
          itemType='category'
          loading={deleting}
          warningMessage='This action cannot be undone.'
          cascadeInfo={
            categoryToDelete && (categoryToDelete.product_count || 0) > 0
              ? [
                  `${categoryToDelete.product_count} product${(categoryToDelete.product_count || 0) > 1 ? 's' : ''} will lose this category association`,
                ]
              : undefined
          }
        />
      </div>
    </AdminLayout>
  );
}
