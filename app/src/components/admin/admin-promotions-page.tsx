import { useState } from 'react';
import { AdminLayout } from './admin-layout';
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog';
import { Plus, Edit, Trash2, Copy, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { usePromotions } from '@/lib/supabase/hooks';
import { createClient } from '@/lib/supabase/client';
import { useNavigate } from 'react-router';

export function AdminPromotionsPage() {
  const navigate = useNavigate();
  const { data: dbPromotions, loading, refetch } = usePromotions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<{
    id: string;
    code: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const normalizeNumber = (value: any, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  // Transform database promotions to display format
  const promotions = (dbPromotions || []).map((promo: any) => {
    const today = new Date().toISOString().split('T')[0];
    let status = 'Active';

    if (!promo.is_active) {
      status = 'Inactive';
    } else if (promo.end_date < today) {
      status = 'Expired';
    } else if (promo.start_date > today) {
      status = 'Scheduled';
    }

    // Capitalize type
    let displayType = promo.type;
    if (promo.type === 'percentage') displayType = 'Percentage';
    if (promo.type === 'fixed_amount') displayType = 'Fixed Amount';
    if (promo.type === 'free_shipping') displayType = 'Free Shipping';

    return {
      id: promo.id,
      code: promo.code,
      description: promo.description,
      type: displayType,
      value: normalizeNumber(promo.value),
      minOrder: normalizeNumber(promo.min_order),
      maxUses:
        promo.max_uses === null || promo.max_uses === undefined
          ? null
          : normalizeNumber(promo.max_uses),
      used: normalizeNumber(promo.used_count),
      startDate: promo.start_date,
      endDate: promo.end_date,
      status,
    };
  });

  const totalPromotions = promotions.length;
  const activePromotions = promotions.filter(p => p.status === 'Active').length;
  const inactivePromotions = promotions.filter(p => p.status !== 'Active').length;
  const totalUses = promotions.reduce((sum, p) => sum + p.used, 0);
  const estimatedTotalDiscount = promotions.reduce((sum, promo) => {
    if (promo.type === 'Fixed Amount') {
      return sum + promo.value * promo.used;
    }
    if (promo.type === 'Percentage') {
      return sum + (promo.minOrder * promo.value * promo.used) / 100;
    }
    return sum;
  }, 0);
  const conversionRate = totalPromotions
    ? (activePromotions / totalPromotions) * 100
    : 0;

  // Pagination
  const totalPages = Math.ceil(totalPromotions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPromotions = promotions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (promotionId: string) => {
    navigate(`/admin/promotions/edit/${promotionId}`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const handleDeleteConfirm = async () => {
    if (!promotionToDelete) return;

    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promotionToDelete.id);

      if (error) throw error;

      toast.success('Promotion deleted successfully');
      refetch(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete promotion');
      console.warn('Delete promotion error:', error);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setPromotionToDelete(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='max-w-7xl mx-auto flex items-center justify-center py-20'>
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
              Promotions & Discounts
            </h1>
            <p className='text-gray-600'>
              Create and manage promotional codes and discounts
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/promotions/new')}
            className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
            style={{ height: '50px' }}
          >
            <Plus className='w-5 h-5' />
            Create Promotion
          </Button>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>Active Promotions</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              {activePromotions}
            </p>
          </div>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>Total Uses</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              {totalUses}
            </p>
          </div>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>Total Discount</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              £{estimatedTotalDiscount.toFixed(2)}
            </p>
          </div>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>Conversion Rate</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              {conversionRate.toFixed(1)}%
            </p>
            <p className='text-xs text-gray-500 mt-1'>
              {inactivePromotions} inactive or scheduled
            </p>
          </div>
        </div>

        {/* Promotions Table */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Code
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Description
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Type
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Value
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Usage
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Valid Until
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Status
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPromotions.map(promo => (
                  <tr
                    key={promo.id}
                    className='border-b border-gray-100 last:border-0 hover:bg-gray-50'
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <code className='bg-gray-100 px-2 py-1 rounded text-sm font-mono font-semibold'>
                          {promo.code}
                        </code>
                        <button
                          onClick={() => handleCopyCode(promo.code)}
                          className='p-1 hover:bg-gray-200 rounded'
                        >
                          <Copy className='w-4 h-4 text-gray-600' />
                        </button>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {promo.description}
                    </td>
                    <td className='px-6 py-4 text-sm'>
                      <span className='inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs'>
                        <Tag className='w-3 h-3' />
                        {promo.type}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm font-medium'>
                      {promo.type === 'Percentage'
                        ? `${promo.value}%`
                        : promo.type === 'Fixed Amount'
                          ? `£${promo.value}`
                          : 'Free'}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm'>
                        <span className='font-medium'>{promo.used}</span>
                        <span className='text-gray-600'>
                          {' '}
                          / {promo.maxUses ?? 'Unlimited'}
                        </span>
                      </div>
                      {promo.maxUses ? (
                        <div className='w-full bg-gray-200 rounded-full h-1.5 mt-1'>
                          <div
                            className='bg-[#f63a9e] h-1.5 rounded-full'
                            style={{
                              width: `${Math.min(
                                (promo.used / promo.maxUses) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      ) : null}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {formatDate(promo.endDate)}
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          promo.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {promo.status}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => handleEdit(promo.id)}
                          className='p-2 hover:bg-pink-50 rounded-lg transition-colors'
                          title='Edit'
                        >
                          <Edit className='w-4 h-4 text-gray-600 hover:text-[#f63a9e]' />
                        </button>
                        <button
                          onClick={() => {
                            setPromotionToDelete({
                              id: promo.id,
                              code: promo.code,
                            });
                            setShowDeleteDialog(true);
                          }}
                          className='p-2 hover:bg-red-50 rounded-lg transition-colors'
                          title='Delete'
                        >
                          <Trash2 className='w-4 h-4 text-red-600' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={totalPromotions}
            itemName='promotions'
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title='Delete Promotion?'
        itemName={promotionToDelete?.code}
        itemType='promotion'
        loading={deleting}
        warningMessage='This action cannot be undone.'
        description={`Are you sure you want to delete the promotion code "${promotionToDelete?.code}"?`}
      />
    </AdminLayout>
  );
}
