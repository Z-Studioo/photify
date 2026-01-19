import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from './admin-layout';
import { Search, Plus, Edit, Trash2, Filter, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Removed hardcoded data - will fetch from Supabase

export function AdminArtCollectionPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [artProducts, setArtProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch art products from Supabase
  useEffect(() => {
    async function fetchArtProducts() {
      try {
        const supabase = createClient();
        console.log('Fetching art products from database...');

        const { data, error } = await supabase
          .from('art_products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log(`Successfully loaded ${data?.length || 0} art products`);
        setArtProducts(data || []);
      } catch (error: any) {
        console.error('Error fetching art products:', error);
        const errorMessage =
          error?.message ||
          error?.hint ||
          'Failed to load art products. Check console for details.';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    fetchArtProducts();
  }, []);

  const filteredProducts = artProducts.filter(product => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
              Art Collection Management
            </h1>
            <p className='text-gray-600'>
              Manage ready-made art products and inventory
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/art-collection/new')}
            className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
            style={{ height: '50px' }}
          >
            <Plus className='w-5 h-5' />
            Add New Art
          </Button>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg border border-gray-200 p-6 mb-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <Input
                placeholder='Search art by name...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className='w-full md:w-[200px]'>
                <Filter className='w-4 h-4 mr-2' />
                <SelectValue placeholder='Filter by category' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Categories</SelectItem>
                <SelectItem value='Abstract'>Abstract</SelectItem>
                <SelectItem value='Religion'>Religion</SelectItem>
                <SelectItem value='Animals'>Animals</SelectItem>
                <SelectItem value='Nepal'>Nepal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Art Products List */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e] mr-2' />
              <span className='text-gray-600'>Loading art products...</span>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Product
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Type
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Category
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Price
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Stock
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {filteredProducts.map(product => {
                    const firstImage =
                      product.images?.[0] || product.image || '';
                    return (
                      <tr
                        key={product.id}
                        className='hover:bg-gray-50 transition-colors'
                      >
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-4'>
                            <div className='w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                              {firstImage && (
                                <ImageWithFallback
                                  src={firstImage}
                                  alt={product.name}
                                  className='w-full h-full object-cover'
                                />
                              )}
                            </div>
                            <div>
                              <p
                                className="font-['Bricolage_Grotesque',_sans-serif]"
                                style={{ fontSize: '16px', fontWeight: '600' }}
                              >
                                {product.name}
                              </p>
                              {product.is_bestseller && (
                                <span className='inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-[#f63a9e] text-white'>
                                  Best Seller
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <span className='text-sm text-gray-900'>
                            {product.product_type || 'Canvas'}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <span className='text-sm text-gray-900'>
                            {product.category}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <span className='text-sm font-medium text-[#f63a9e]'>
                            {product.price}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <span className='text-sm text-gray-900'>
                            {product.stock_quantity || 0}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              product.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : product.status === 'inactive'
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {product.status || 'Active'}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center justify-end gap-2'>
                            <button
                              onClick={() =>
                                router.push(
                                  `/admin/art-collection/edit/${product.id}`
                                )
                              }
                              className='p-2 text-gray-600 hover:text-[#f63a9e] hover:bg-pink-50 rounded-lg transition-colors'
                              title='Edit'
                            >
                              <Edit className='w-4 h-4' />
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  confirm(
                                    'Are you sure you want to delete this art product?'
                                  )
                                ) {
                                  try {
                                    const supabase = createClient();
                                    const { error } = await supabase
                                      .from('art_products')
                                      .delete()
                                      .eq('id', product.id);

                                    if (error) throw error;

                                    toast.success('Art product deleted');
                                    // Refresh list
                                    setArtProducts(
                                      artProducts.filter(
                                        p => p.id !== product.id
                                      )
                                    );
                                  } catch (error) {
                                    console.error('Error deleting:', error);
                                    toast.error('Failed to delete art product');
                                  }
                                }
                              }}
                              className='p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                              title='Delete'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredProducts.length === 0 && (
          <div className='bg-white rounded-lg border border-gray-200 p-12 text-center'>
            <p className='text-gray-500'>
              No art products found matching your criteria.
            </p>
          </div>
        )}

        {/* Summary */}
        {!loading && (
          <div className='mt-6 bg-white rounded-lg border border-gray-200 p-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Total Products</p>
                <p
                  className="font-['Bricolage_Grotesque',_sans-serif]"
                  style={{ fontSize: '24px', fontWeight: '600' }}
                >
                  {artProducts.length}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Active Products</p>
                <p
                  className="font-['Bricolage_Grotesque',_sans-serif]"
                  style={{ fontSize: '24px', fontWeight: '600' }}
                >
                  {artProducts.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Total Stock</p>
                <p
                  className="font-['Bricolage_Grotesque',_sans-serif]"
                  style={{ fontSize: '24px', fontWeight: '600' }}
                >
                  {artProducts.reduce(
                    (sum, p) => sum + (p.stock_quantity || 0),
                    0
                  )}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Best Sellers</p>
                <p
                  className="font-['Bricolage_Grotesque',_sans-serif]"
                  style={{ fontSize: '24px', fontWeight: '600' }}
                >
                  {artProducts.filter(p => p.is_bestseller).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
