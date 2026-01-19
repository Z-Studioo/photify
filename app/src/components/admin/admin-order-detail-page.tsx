import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  MapPin,
  Mail,
  Phone,
  Download,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export function AdminOrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [notes, setNotes] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderId)
          .single();

        if (error) {
          console.error('Error fetching order:', error);
          toast.error('Failed to load order details');
          setLoading(false);
          return;
        }

        if (data) {
          // Transform database order to component format
          const shippingAddress =
            typeof data.shipping_address === 'string'
              ? data.shipping_address
              : data.shipping_address?.address || 'N/A';

          const transformedOrder = {
            id: data.order_number,
            customer: data.customer_name,
            email: data.customer_email,
            phone: data.customer_phone || 'N/A',
            address: shippingAddress,
            product: data.items?.[0]?.name || 'Order Items',
            quantity:
              data.items?.reduce(
                (sum: number, item: any) => sum + item.quantity,
                0
              ) || 0,
            amount: `£${parseFloat(data.total).toFixed(2)}`,
            status:
              data.status?.charAt(0).toUpperCase() + data.status?.slice(1) ||
              'Pending',
            date: new Date(data.created_at).toLocaleDateString('en-GB'),
            shipping: 'Standard Delivery',
            paymentMethod:
              data.payment_status === 'paid' ? 'Card Payment' : 'Pending',
            deliveryMethod: 'Standard',
            deliveryPrice: `£${parseFloat(data.shipping_cost || 0).toFixed(2)}`,
            subtotal: `£${parseFloat(data.subtotal).toFixed(2)}`,
            deliveryCharge: `£${parseFloat(data.shipping_cost || 0).toFixed(2)}`,
            total: `£${parseFloat(data.total).toFixed(2)}`,
            timeline: [
              {
                label: 'Order',
                date: new Date(data.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
                time: new Date(data.created_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                }),
                completed: true,
              },
              {
                label: 'Payment',
                date: data.paid_at
                  ? new Date(data.paid_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '',
                time: data.paid_at
                  ? new Date(data.paid_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : '',
                completed: !!data.paid_at,
              },
              {
                label: 'Packing',
                date:
                  data.status === 'processing' ||
                  data.status === 'shipped' ||
                  data.status === 'delivered'
                    ? 'In Progress'
                    : '',
                time: '',
                completed:
                  data.status === 'shipped' || data.status === 'delivered',
              },
              {
                label: 'Shipping',
                date: data.shipped_at
                  ? new Date(data.shipped_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '',
                time: data.shipped_at
                  ? new Date(data.shipped_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : '',
                completed: !!data.shipped_at,
              },
            ],
            consent: data.video_permission
              ? 'Customer has consented to video processing'
              : 'No video consent',
            items: (data.items || []).map((item: any) => ({
              product: item.name,
              size: item.size || 'N/A',
              category: 'Product',
              image: item.image || '#',
              invoice: `#INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              unitPrice: `£${parseFloat(item.price).toFixed(2)}`,
            })),
          };

          setOrder(transformedOrder);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <AdminLayout>
        <div className='max-w-7xl mx-auto flex items-center justify-center py-20'>
          <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className='max-w-7xl mx-auto text-center py-20'>
          <p className='text-gray-600 mb-4'>Order not found</p>
          <Button onClick={() => navigate('/admin/orders')}>
            Back to Orders
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const handlePrintInvoice = () => {
    toast.success('Invoice sent to printer');
  };

  const handleDownloadLabel = () => {
    toast.success('Shipping label downloaded');
  };

  const handleAddNote = () => {
    if (notes.trim()) {
      toast.success('Note added successfully');
      setNotes('');
    }
  };

  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <button
            onClick={() => navigate('/admin/orders')}
            className='flex items-center gap-2 text-gray-600 hover:text-[#f63a9e] mb-4'
          >
            <ArrowLeft className='w-4 h-4' />
            Back to Orders
          </button>
          <div className='flex items-center justify-between'>
            <div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
                style={{ fontSize: '32px', fontWeight: '600' }}
              >
                Order Detail
              </h1>
            </div>
            <button className='p-2 hover:bg-gray-100 rounded-lg'>
              <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
                <path
                  d='M10 5L10 15M5 10L15 10'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
            </button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content - Left Side */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Order Header */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3'>
                  <Package className='w-5 h-5 text-gray-600' />
                  <div>
                    <span className='text-sm text-gray-600'>
                      Order #{order.id}
                    </span>
                  </div>
                </div>
                <span className='px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium'>
                  Priced
                </span>
              </div>

              {/* Order Timeline */}
              <div className='mb-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-sm font-medium flex items-center gap-2'>
                    <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
                      <circle
                        cx='8'
                        cy='8'
                        r='7'
                        stroke='currentColor'
                        strokeWidth='1.5'
                      />
                      <path
                        d='M8 4V8L11 11'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                      />
                    </svg>
                    Order Timeline
                  </h3>
                  <span className='text-xs text-[#f63a9e]'>
                    Est. Delivery:{' '}
                    {order.timeline[0]?.date || 'Oct 24th - Oct 28th'}
                  </span>
                </div>

                {/* Timeline Progress */}
                <div className='relative'>
                  <div className='flex justify-between items-start'>
                    {order.timeline.map((step: any, index: number) => (
                      <div
                        key={index}
                        className='flex flex-col items-center relative'
                        style={{ flex: 1 }}
                      >
                        {/* Connector Line */}
                        {index < order.timeline.length - 1 && (
                          <div
                            className='absolute top-5 left-1/2 h-0.5 bg-gray-200'
                            style={{
                              width: 'calc(100% + 20px)',
                              transform: 'translateX(-50%)',
                            }}
                          >
                            <div
                              className='h-full bg-[#f63a9e] transition-all'
                              style={{ width: step.completed ? '100%' : '0%' }}
                            />
                          </div>
                        )}

                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center z-10 mb-2 ${
                            step.completed
                              ? 'bg-[#f63a9e] text-white'
                              : 'bg-white border-2 border-gray-200 text-gray-400'
                          }`}
                        >
                          {index === 0 && <Package className='w-5 h-5' />}
                          {index === 1 && <CreditCard className='w-5 h-5' />}
                          {index === 2 && <Package className='w-5 h-5' />}
                          {index === 3 && <Truck className='w-5 h-5' />}
                        </div>

                        {/* Label */}
                        <div className='text-center'>
                          <p className='text-xs font-medium mb-0.5'>
                            {step.label}
                          </p>
                          {step.date && (
                            <>
                              <p className='text-xs text-gray-600'>
                                {step.date}
                              </p>
                              <p className='text-xs text-gray-500'>
                                {step.time}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Details */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='font-semibold mb-4 flex items-center gap-2'>
                <MapPin className='w-4 h-4' />
                Shipping Details
              </h3>
              <div className='space-y-3'>
                <div>
                  <p className='font-medium'>{order.customer}</p>
                  <p className='text-sm text-gray-600 mt-1'>{order.address}</p>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Mail className='w-4 h-4' />
                  <span>{order.email}</span>
                  <button className='ml-1 p-1 hover:bg-gray-100 rounded'>
                    <svg width='14' height='14' viewBox='0 0 14 14' fill='none'>
                      <rect
                        x='1'
                        y='1'
                        width='8'
                        height='8'
                        rx='1'
                        stroke='currentColor'
                        strokeWidth='1.5'
                      />
                      <path
                        d='M5 5V4C5 2.89543 5.89543 2 7 2H10C11.1046 2 12 2.89543 12 4V7C12 8.10457 11.1046 9 10 9H9'
                        stroke='currentColor'
                        strokeWidth='1.5'
                      />
                    </svg>
                  </button>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Phone className='w-4 h-4' />
                  <span>{order.phone}</span>
                  <button className='ml-1 p-1 hover:bg-gray-100 rounded'>
                    <svg width='14' height='14' viewBox='0 0 14 14' fill='none'>
                      <rect
                        x='1'
                        y='1'
                        width='8'
                        height='8'
                        rx='1'
                        stroke='currentColor'
                        strokeWidth='1.5'
                      />
                      <path
                        d='M5 5V4C5 2.89543 5.89543 2 7 2H10C11.1046 2 12 2.89543 12 4V7C12 8.10457 11.1046 9 10 9H9'
                        stroke='currentColor'
                        strokeWidth='1.5'
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Consent */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='font-semibold mb-3 flex items-center gap-2'>
                <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
                  <path
                    d='M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1Z'
                    stroke='currentColor'
                    strokeWidth='1.5'
                  />
                  <path
                    d='M5.5 8L7 9.5L10.5 6'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                Customer Consent
              </h3>
              <div className='flex items-start gap-3'>
                <div className='mt-0.5'>
                  <CheckCircle className='w-4 h-4 text-gray-400' />
                </div>
                <div>
                  <p className='font-medium text-sm'>
                    Behind-the-scenes process
                  </p>
                  <p className='text-sm text-gray-600'>{order.consent}</p>
                </div>
              </div>
            </div>

            {/* Payment & Delivery Info */}
            <div className='grid grid-cols-3 gap-4'>
              <div className='bg-white rounded-lg border border-gray-200 p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <CreditCard className='w-4 h-4 text-gray-600' />
                  <h3 className='text-sm font-medium'>Payment Method</h3>
                </div>
                <p className='text-sm text-gray-600'>{order.paymentMethod}</p>
              </div>
              <div className='bg-white rounded-lg border border-gray-200 p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <Truck className='w-4 h-4 text-gray-600' />
                  <h3 className='text-sm font-medium'>Delivery Method</h3>
                </div>
                <p className='text-sm text-gray-600'>{order.deliveryMethod}</p>
              </div>
              <div className='bg-white rounded-lg border border-gray-200 p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 16 16'
                    fill='none'
                    className='text-gray-600'
                  >
                    <path
                      d='M2 4H14M2 8H14M2 12H14'
                      stroke='currentColor'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                    />
                  </svg>
                  <h3 className='text-sm font-medium'>Delivery Price</h3>
                </div>
                <p className='text-sm text-gray-600'>{order.deliveryPrice}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='font-semibold mb-4'>Order Items</h3>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='border-b border-gray-200'>
                    <tr>
                      <th className='text-left py-3 px-2 text-xs font-medium text-gray-600'>
                        Product
                      </th>
                      <th className='text-left py-3 px-2 text-xs font-medium text-gray-600'>
                        Sizes
                      </th>
                      <th className='text-left py-3 px-2 text-xs font-medium text-gray-600'>
                        Category
                      </th>
                      <th className='text-left py-3 px-2 text-xs font-medium text-gray-600'>
                        Images
                      </th>
                      <th className='text-left py-3 px-2 text-xs font-medium text-gray-600'>
                        Invoice
                      </th>
                      <th className='text-right py-3 px-2 text-xs font-medium text-gray-600'>
                        Unit Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item: any, index: number) => (
                      <tr
                        key={index}
                        className='border-b border-gray-100 last:border-0'
                      >
                        <td className='py-4 px-2 text-sm'>{item.product}</td>
                        <td className='py-4 px-2 text-sm'>{item.size}</td>
                        <td className='py-4 px-2 text-sm'>{item.category}</td>
                        <td className='py-4 px-2'>
                          <a
                            href={item.image}
                            className='text-sm text-blue-600 hover:underline'
                          >
                            link/SJDJDH
                          </a>
                        </td>
                        <td className='py-4 px-2'>
                          <a
                            href='#'
                            className='text-sm text-blue-600 hover:underline'
                          >
                            {item.invoice}
                          </a>
                        </td>
                        <td className='py-4 px-2 text-sm text-right'>
                          {item.unitPrice}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator className='my-4' />

              {/* Totals */}
              <div className='flex justify-end'>
                <div className='w-64 space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Subtotal:</span>
                    <span>{order.subtotal}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Delivery:</span>
                    <span>{order.deliveryCharge}</span>
                  </div>
                  <Separator />
                  <div className='flex justify-between font-semibold'>
                    <span>Total:</span>
                    <span>{order.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className='space-y-6 sticky top-6 self-start'>
            {/* Actions */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='font-semibold mb-4'>Actions</h3>
              <div className='space-y-3'>
                <Button
                  onClick={handlePrintInvoice}
                  className='w-full bg-[#f63a9e] hover:bg-[#e02d8d]'
                  style={{ height: '44px' }}
                >
                  Invoice
                </Button>
                <Button
                  onClick={handleDownloadLabel}
                  variant='outline'
                  className='w-full'
                  style={{ height: '44px' }}
                >
                  <Download className='w-4 h-4 mr-2' />
                  Download label
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='font-semibold mb-4'>Notes</h3>
              <Textarea
                placeholder='Add any additional notes here...'
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                className='mb-3'
              />
              <Button
                onClick={handleAddNote}
                variant='outline'
                className='w-full'
                size='sm'
              >
                Add Note
              </Button>
            </div>

            {/* Email History */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <div className='flex items-center gap-2 mb-4'>
                <Mail className='w-4 h-4' />
                <h3 className='font-semibold'>Email History</h3>
              </div>
              <div className='space-y-3'>
                <div className='flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100'>
                  <div className='w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-5 h-5 text-white' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2 mb-1'>
                      <p className='font-medium text-sm'>Order Confirmation</p>
                      <button className='text-sm text-[#f63a9e] hover:underline whitespace-nowrap'>
                        New email
                      </button>
                    </div>
                    <p className='text-xs text-gray-600'>
                      October 20th, 2025, 5:55 pm
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
