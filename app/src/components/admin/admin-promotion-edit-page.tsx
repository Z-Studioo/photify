import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Trash2,
  Copy,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePromotion } from '@/lib/supabase/hooks';
import { createClient } from '@/lib/supabase/client';

export function AdminPromotionEditPage() {
  const navigate = useNavigate();
  const { promotionId } = useParams<{ promotionId: string }>();
  const isEditing = !!promotionId && promotionId !== 'new';

  // Fetch existing promotion if editing - always call hook unconditionally
  const { data: existingPromo, loading } = usePromotion(
    isEditing && typeof promotionId === 'string' ? promotionId : ''
  );

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: 0,
    minOrder: 0,
    maxUses: 100,
    used: 0,
    startDate: '',
    endDate: '',
    active: true,
    firstOrderOnly: false,
    isFeatured: false,
    categories: ['all'],
  });

  const [saving, setSaving] = useState(false);

  // Load existing promotion data
  useEffect(() => {
    if (existingPromo) {
      setFormData({
        code: existingPromo.code || '',
        description: existingPromo.description || '',
        type: existingPromo.type || 'percentage',
        value: existingPromo.value || 0,
        minOrder: existingPromo.min_order || 0,
        maxUses: existingPromo.max_uses || 100,
        used: existingPromo.used_count || 0,
        startDate: existingPromo.start_date || '',
        endDate: existingPromo.end_date || '',
        active: existingPromo.is_active,
        firstOrderOnly: existingPromo.first_order_only || false,
        isFeatured: existingPromo.is_featured || false,
        categories: existingPromo.categories || ['all'],
      });
    }
  }, [existingPromo]);

  const usageStats = {
    totalRevenue: '£4,892',
    totalOrders: formData.used,
    avgOrderValue: '£104.09',
    conversionRate: '12.4%',
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      toast.error('Please enter a promotion code');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please set start and end dates');
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const promotionData = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description,
        type: formData.type,
        value: parseFloat(formData.value.toString()),
        min_order: parseFloat(formData.minOrder.toString()),
        max_uses: formData.maxUses
          ? parseInt(formData.maxUses.toString())
          : null,
        start_date: formData.startDate,
        end_date: formData.endDate,
        is_active: formData.active,
        first_order_only: formData.firstOrderOnly,
        is_featured: formData.isFeatured,
        categories: formData.categories,
      };

      if (isEditing && promotionId) {
        // Update existing promotion
        const { error } = await supabase
          .from('promotions')
          .update(promotionData)
          .eq('id', promotionId);

        if (error) throw error;
        toast.success('Promotion updated successfully');
      } else {
        // Create new promotion
        const { error } = await supabase
          .from('promotions')
          .insert(promotionData);

        if (error) throw error;
        toast.success('Promotion created successfully');
      }

      navigate('/admin/promotions');
    } catch (error: any) {
      console.error('Error saving promotion:', error);
      toast.error(error.message || 'Failed to save promotion');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this promotion? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promotionId);

      if (error) throw error;

      toast.success('Promotion deleted successfully');
      navigate('/admin/promotions');
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Failed to delete promotion');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(formData.code);
    toast.success('Promotion code copied to clipboard');
  };

  const usagePercentage =
    formData.maxUses > 0 ? (formData.used / formData.maxUses) * 100 : 0;

  if (loading) {
    return (
      <AdminLayout>
        <div className='max-w-5xl mx-auto flex items-center justify-center py-20'>
          <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='max-w-5xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <Button
            variant='ghost'
            onClick={() => navigate('/admin/promotions')}
            className='mb-4 -ml-2'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Promotions
          </Button>

          <div className='flex items-start justify-between'>
            <div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
                style={{ fontSize: '32px', fontWeight: '600' }}
              >
                {isEditing ? 'Edit Promotion' : 'Create Promotion'}
              </h1>
              <p className='text-gray-600'>
                {isEditing
                  ? 'Update promotion code and settings'
                  : 'Set up a new discount code for your customers'}
              </p>
            </div>

            {isEditing && (
              <Button
                variant='outline'
                onClick={handleDelete}
                className='text-red-600 hover:text-red-700 hover:bg-red-50'
              >
                <Trash2 className='w-4 h-4 mr-2' />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Form */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Basic Information */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3
                className="font-['Bricolage_Grotesque',_sans-serif] mb-4"
                style={{ fontSize: '18px', fontWeight: '600' }}
              >
                Basic Information
              </h3>

              <div className='space-y-4'>
                <div>
                  <Label htmlFor='code'>Promotion Code *</Label>
                  <div className='flex gap-2'>
                    <Input
                      id='code'
                      value={formData.code}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder='e.g., SAVE20'
                      className='font-mono'
                    />
                    <Button
                      variant='outline'
                      onClick={handleCopyCode}
                      disabled={!formData.code}
                    >
                      <Copy className='w-4 h-4' />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor='description'>Description *</Label>
                  <Textarea
                    id='description'
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder='Brief description of this promotion'
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Discount Settings */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3
                className="font-['Bricolage_Grotesque',_sans-serif] mb-4"
                style={{ fontSize: '18px', fontWeight: '600' }}
              >
                Discount Settings
              </h3>

              <div className='space-y-4'>
                <div>
                  <Label htmlFor='type'>Discount Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={value =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='percentage'>Percentage</SelectItem>
                      <SelectItem value='fixed_amount'>Fixed Amount</SelectItem>
                      <SelectItem value='free_shipping'>
                        Free Shipping
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type !== 'free_shipping' && (
                  <div>
                    <Label htmlFor='value'>
                      {formData.type === 'percentage'
                        ? 'Percentage (%)'
                        : 'Amount (£)'}
                    </Label>
                    <Input
                      id='value'
                      type='number'
                      value={formData.value}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          value: parseFloat(e.target.value) || 0,
                        })
                      }
                      min='0'
                      step={formData.type === 'percentage' ? '1' : '0.01'}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor='minOrder'>Minimum Order Value (£)</Label>
                  <Input
                    id='minOrder'
                    type='number'
                    value={formData.minOrder}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        minOrder: parseFloat(e.target.value) || 0,
                      })
                    }
                    min='0'
                    step='0.01'
                  />
                </div>
              </div>
            </div>

            {/* Usage Limits */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3
                className="font-['Bricolage_Grotesque',_sans-serif] mb-4"
                style={{ fontSize: '18px', fontWeight: '600' }}
              >
                Usage Limits
              </h3>

              <div className='space-y-4'>
                <div>
                  <Label htmlFor='maxUses'>Maximum Uses</Label>
                  <Input
                    id='maxUses'
                    type='number'
                    value={formData.maxUses}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        maxUses: parseInt(e.target.value) || 0,
                      })
                    }
                    min='0'
                  />
                  <p className='text-xs text-gray-600 mt-1'>
                    Leave as 0 for unlimited uses
                  </p>
                </div>

                {isEditing && (
                  <div>
                    <Label>Current Usage</Label>
                    <div className='mt-2'>
                      <div className='flex items-center justify-between mb-1 text-sm'>
                        <span>
                          {formData.used} / {formData.maxUses || '∞'} uses
                        </span>
                        <span>{usagePercentage.toFixed(1)}%</span>
                      </div>
                      <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-[#f63a9e]'
                          style={{
                            width: `${Math.min(usagePercentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='firstOrderOnly'>First Order Only</Label>
                    <p className='text-xs text-gray-600 mt-1'>
                      Only valid for new customers
                    </p>
                  </div>
                  <Switch
                    id='firstOrderOnly'
                    checked={formData.firstOrderOnly}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, firstOrderOnly: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3
                className="font-['Bricolage_Grotesque',_sans-serif] mb-4"
                style={{ fontSize: '18px', fontWeight: '600' }}
              >
                Schedule
              </h3>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='startDate'>Start Date *</Label>
                  <Input
                    id='startDate'
                    type='date'
                    value={formData.startDate}
                    onChange={e =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor='endDate'>End Date *</Label>
                  <Input
                    id='endDate'
                    type='date'
                    value={formData.endDate}
                    onChange={e =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Status */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3
                className="font-['Bricolage_Grotesque',_sans-serif] mb-4"
                style={{ fontSize: '18px', fontWeight: '600' }}
              >
                Status
              </h3>

              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='active'>Active</Label>
                    <p className='text-xs text-gray-600 mt-1'>
                      Enable this promotion
                    </p>
                  </div>
                  <Switch
                    id='active'
                    checked={formData.active}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, active: checked })
                    }
                  />
                </div>

                <Separator />

                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='isFeatured'>Featured</Label>
                    <p className='text-xs text-gray-600 mt-1'>
                      Show in cart as suggested promo
                    </p>
                  </div>
                  <Switch
                    id='isFeatured'
                    checked={formData.isFeatured}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, isFeatured: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Usage Statistics (only for existing promotions) */}
            {isEditing && (
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-4 flex items-center gap-2"
                  style={{ fontSize: '18px', fontWeight: '600' }}
                >
                  <TrendingUp className='w-5 h-5 text-[#f63a9e]' />
                  Performance
                </h3>

                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Total Revenue</span>
                    <span className='font-semibold'>
                      {usageStats.totalRevenue}
                    </span>
                  </div>
                  <Separator />
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Total Orders</span>
                    <span className='font-semibold'>
                      {usageStats.totalOrders}
                    </span>
                  </div>
                  <Separator />
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>
                      Avg. Order Value
                    </span>
                    <span className='font-semibold'>
                      {usageStats.avgOrderValue}
                    </span>
                  </div>
                  <Separator />
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>
                      Conversion Rate
                    </span>
                    <span className='font-semibold text-green-600'>
                      {usageStats.conversionRate}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className='w-full bg-[#f63a9e] hover:bg-[#e02d8d]'
              style={{ height: '50px' }}
            >
              {saving ? (
                <>
                  <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <Save className='w-5 h-5 mr-2' />
                  {isEditing ? 'Update Promotion' : 'Create Promotion'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
