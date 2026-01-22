import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Tag, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface AdminProductCategoriesEditorProps {
  productId: string;
}

export function AdminProductCategoriesEditor({
  productId,
}: AdminProductCategoriesEditorProps) {
  const supabase = createClient();
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [productId]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Fetch all available categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, slug, description')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setAllCategories(categoriesData || []);

      // Fetch current product categories
      const { data: productCategoriesData, error: productCategoriesError } =
        await supabase
          .from('product_categories')
          .select('category_id')
          .eq('product_id', productId);

      if (productCategoriesError) throw productCategoriesError;

      const categoryIds = (productCategoriesData || []).map(
        pc => pc.category_id
      );
      setSelectedCategoryIds(categoryIds);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // First, delete all existing category associations
      const { error: deleteError } = await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', productId);

      if (deleteError) throw deleteError;

      // Then, insert new category associations
      if (selectedCategoryIds.length > 0) {
        const categoryInserts = selectedCategoryIds.map(categoryId => ({
          product_id: productId,
          category_id: categoryId,
        }));

        const { error: insertError } = await supabase
          .from('product_categories')
          .insert(categoryInserts);

        if (insertError) throw insertError;
      }

      toast.success('Categories saved successfully');
    } catch (error: any) {
      console.error('Error saving categories:', error);
      toast.error('Failed to save categories');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e]' />
        <span className='ml-2 text-gray-600'>Loading categories...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Categories Selection */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <div className='flex items-center gap-2 mb-6'>
          <Tag className='w-5 h-5 text-[#f63a9e]' />
          <h3 className='text-lg font-semibold'>Product Categories</h3>
        </div>

        {allCategories.length === 0 ? (
          <div className='text-center py-8'>
            <AlertCircle className='w-8 h-8 text-gray-400 mx-auto mb-2' />
            <p className='text-gray-600'>No categories available</p>
            <p className='text-sm text-gray-500 mt-1'>
              Create categories first in the Categories page
            </p>
          </div>
        ) : (
          <>
            <p className='text-sm text-gray-600 mb-4'>
              Select the categories this product belongs to. This product will
              appear on all selected category pages.
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
              {allCategories.map(category => {
                const isSelected = selectedCategoryIds.includes(category.id);
                return (
                  <label
                    key={category.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#f63a9e] bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={() => toggleCategory(category.id)}
                      className='mt-0.5 w-4 h-4 text-[#f63a9e] border-gray-300 rounded focus:ring-[#f63a9e] cursor-pointer'
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-gray-900 text-sm'>
                        {category.name}
                      </div>
                      {category.description && (
                        <div className='text-xs text-gray-500 mt-1 line-clamp-2'>
                          {category.description}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0' />
                <div className='text-sm text-blue-800'>
                  <strong className='font-semibold'>
                    Selected: {selectedCategoryIds.length} categories
                  </strong>
                  {selectedCategoryIds.length === 0 && (
                    <p className='mt-1'>
                      This product won&apos;t appear in any category pages. Select at
                      least one category.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Save Button */}
      <div className='flex justify-end'>
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
              Save Categories
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
