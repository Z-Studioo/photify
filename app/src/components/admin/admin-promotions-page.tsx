import { useState } from 'react';
import { AdminLayout } from './admin-layout';
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog';
import { Plus, Edit, Trash2, Copy, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      value: promo.value,
      minOrder: promo.min_order,
      maxUses: promo.max_uses,
      used: promo.used_count,
      startDate: promo.start_date,
      endDate: promo.end_date,
      status,
    };
  });

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
              {promotions.filter(p => p.status === 'Active').length}
            </p>
          </div>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>Total Uses</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              {promotions.reduce((sum, p) => sum + p.used, 0)}
            </p>
          </div>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>Total Discount</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              £2,847
            </p>
          </div>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>Conversion Rate</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              12.4%
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
                {promotions.map(promo => (
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
                          / {promo.maxUses}
                        </span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-1.5 mt-1'>
                        <div
                          className='bg-[#f63a9e] h-1.5 rounded-full'
                          style={{
                            width: `${(promo.used / promo.maxUses) * 100}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {promo.endDate}
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
