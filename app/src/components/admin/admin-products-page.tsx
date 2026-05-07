import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import { Search, Edit, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { useProducts } from '@/lib/supabase/hooks';

const productTypeLabels: Record<string, string> = {
  canvas: 'Canvas',
  framed_canvas: 'Framed Canvas',
  metal_print: 'Metal Print',
};

export function AdminProductsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products from database
  const { data: dbProducts, loading, error } = useProducts();

  // Transform database products to match display format
  const products =
    dbProducts?.map((product: any) => {
      const categories =
        product.categories
          ?.map((pc: any) => pc.category?.name)
          .filter(Boolean) || [];
      return {
        id: product.slug || product.id,
        name: product.name,
        category:
          categories.length > 0
            ? categories.join(', ')
            : productTypeLabels[product.product_type] || 'Uncategorized',
        stock: 'Unlimited',
        status: product.active ? 'Active' : 'Inactive',
        image:
          product.images?.[0] ||
          'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?w=1080',
        productType: product.product_type,
        isFeatured: product.is_featured,
      };
    }) || [];

  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div>
            <h1
              className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
              style={{ fontSize: '32px', fontWeight: '600' }}
            >
              Products Management
            </h1>
            <p className='text-gray-600'>
              View and edit product configurations
            </p>
          </div>
        </div>

        {/* Search */}
        <div className='bg-white rounded-lg border border-gray-200 p-6 mb-6'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
            <Input
              placeholder='Search products by name or category...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className='bg-white rounded-lg border border-gray-200 p-12 text-center'>
            <p className='text-gray-500'>Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className='bg-white rounded-lg border border-red-200 p-12 text-center'>
            <p className='text-red-600'>
              Error loading products: {error.message}
            </p>
          </div>
        )}

        {/* Products List */}
        {!loading && !error && (
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Product
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                      Categories
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
                  {filteredProducts.map(product => (
                    <tr
                      key={product.id}
                      className='hover:bg-gray-50 transition-colors'
                    >
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-4'>
                          <div className='w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                            <ImageWithFallback
                              src={product.image}
                              alt={product.name}
                              className='w-full h-full object-cover'
                            />
                          </div>
                          <div>
                            <p
                              className="font-['Bricolage_Grotesque',_sans-serif]"
                              style={{ fontSize: '16px', fontWeight: '600' }}
                            >
                              {product.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <span className='text-sm text-gray-900'>
                          {product.category}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            product.status === 'Active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center justify-end gap-2'>
                          <button
                            onClick={() =>
                              navigate(`/admin/products/edit/${product.id}`)
                            }
                            className='p-2 text-gray-600 hover:text-[#f63a9e] hover:bg-pink-50 rounded-lg transition-colors'
                            title='View Product'
                          >
                            <Eye className='w-4 h-4' />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/admin/products/edit/${product.id}`)
                            }
                            className='p-2 text-gray-600 hover:text-[#f63a9e] hover:bg-pink-50 rounded-lg transition-colors'
                            title='Edit Configuration'
                          >
                            <Edit className='w-4 h-4' />
                          </button>
                          {/* Delete button disabled */}
                          {/* <button 
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className='bg-white rounded-lg border border-gray-200 p-12 text-center'>
            <p className='text-gray-500'>
              No products found matching your search.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
