import { useState, useEffect, type JSX } from 'react';
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
  CreditCard,
  Loader2,
  MoveLeft,
  MoveRight,
  XCircle,
  X,
  CheckCircle2Icon,
  Copy,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '../ui/badge';

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered'] as const;
type OrderStatus = (typeof STATUS_FLOW)[number] | 'cancelled';

const getNextStatus = (current: OrderStatus): OrderStatus => {
  const index = STATUS_FLOW.indexOf(current as any);
  return STATUS_FLOW[index + 1] ?? current;
};

const getPreviousStatus = (current: OrderStatus): OrderStatus => {
  const index = STATUS_FLOW.indexOf(current as any);
  return STATUS_FLOW[index - 1] ?? current;
};

const generateTimeline = (data: any) => {
  const createdAt = new Date(data.created_at);
  const paidAt = data.paid_at ? new Date(data.paid_at) : null;
  const cancelledAt = data.cancelled_at ? new Date(data.cancelled_at) : null;

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const status = data.status;
  const isCancelled = status === 'cancelled';

  return [
    {
      label: 'Order Placed',
      date: formatDate(createdAt),
      time: formatTime(createdAt),
      completed: true,
    },
    {
      label: 'Payment Confirmed',
      date: paidAt ? formatDate(paidAt) : '',
      time: paidAt ? formatTime(paidAt) : '',
      completed:
        !isCancelled && status !== 'pending' && data.payment_status === 'paid',
    },
    {
      label: 'Dispatched',
      date: '',
      time: '',
      completed: !isCancelled && status === 'delivered',
      active: !isCancelled && status === 'shipped',
      statusText:
        !isCancelled && status === 'shipped' ? 'In Progress' : undefined,
    },
    {
      label: 'Delivered',
      date: '',
      time: '',
      completed: status === 'delivered',
    },
    ...(isCancelled
      ? [
          {
            label: 'Cancelled',
            date: cancelledAt ? formatDate(cancelledAt) : '',
            time: cancelledAt ? formatTime(cancelledAt) : '',
            completed: true,
            cancelled: true,
          },
        ]
      : []),
  ];
};

const timelineIcons: Record<string, JSX.Element> = {
  'Order Placed': <Package className='w-5 h-5' />,
  'Payment Confirmed': <CreditCard className='w-5 h-5' />,
  Dispatched: <Truck className='w-5 h-5' />,
  Delivered: <CheckCircle className='w-5 h-5' />,
  Cancelled: <XCircle className='w-5 h-5' />,
};

export function AdminOrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [notes, setNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderId)
          .single();

        if (error) throw error;

        if (data) {
          // normalize status to lowercase
          const dbStatus = data.status?.toLowerCase() || 'pending';
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
            status: dbStatus, // lowercase
            date: new Date(data.created_at).toLocaleDateString('en-GB'),
            shipping: 'Standard Delivery',
            paymentMethod:
              data.payment_status === 'paid' ? 'Card Payment' : 'Pending',
            deliveryMethod:
              Math.abs(parseFloat(data.shipping_cost || 0) - 19.99) < 0.01
                ? 'Express'
                : 'Standard',
            deliveryPrice: `£${parseFloat(data.shipping_cost || 0).toFixed(2)}`,
            subtotal: `£${parseFloat(data.subtotal).toFixed(2)}`,
            deliveryCharge: `£${parseFloat(data.shipping_cost || 0).toFixed(2)}`,
            total: `£${parseFloat(data.total).toFixed(2)}`,
            timeline: generateTimeline({ ...data, status: dbStatus }),
            payment_status: data.payment_status,
            paid_at: data.paid_at,
            consent: data.video_permission
              ? 'Customer has consented to video processing'
              : 'No video consent',
            items: (data.items || []).map((item: any) => ({
              product: item.name,
              size: item.size || 'N/A',
              category: 'Product',
              image: item.image || '#',
              images: Array.isArray(item.images) ? item.images : [],
              invoice: `#INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              unitPrice: `£${parseFloat(item.price).toFixed(2)}`,
              quantity: item.quantity || 1,
              customization: item.customization || null,
            })),
            hosted_invoice_url: data.hosted_invoice_url || '#',
            remarks: data.remarks || '',
          };

          setOrder(transformedOrder);
          setNotes(data.notes || '');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, supabase]);

  // Helper function to send status change notification email
  const sendStatusNotificationEmail = async (
    orderNumber: string,
    status: string
  ) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // Get the current Supabase session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error('No active session token found');
        toast.error('Failed to send notification email: Not authenticated');
        return;
      }

      const response = await fetch(
        `${apiUrl}/api/orders/${orderNumber}/status-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send notification');
      }

      toast.success('Customer notification email sent');
    } catch (error) {
      console.error('Failed to send status notification email:', error);
      toast.error('Status updated but email notification failed');
    }
  };

  const handleNextStatus = async () => {
    if (
      !order ||
      order.status === 'delivered' ||
      order.status === 'cancelled' ||
      updating
    )
      return;

    const nextStatus = getNextStatus(order.status);
    if (nextStatus === order.status) return;

    try {
      setUpdating(true);
      const payload: any = { status: nextStatus };

      if (nextStatus === 'shipped')
        payload.shipped_at = new Date().toISOString();
      if (nextStatus === 'delivered')
        payload.delivered_at = new Date().toISOString();

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('order_number', order.id)
        .select();

      if (error) throw error;

      // Update local state
      setOrder((prev: any) => ({
        ...prev,
        status: nextStatus,
        ...payload,
        timeline: generateTimeline({ ...prev, ...payload, status: nextStatus }),
      }));

      toast.success(`Order moved to ${nextStatus}`);

      // Send email notification to customer (await to prevent race conditions)
      await sendStatusNotificationEmail(order.id, nextStatus);
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleBackStatus = async () => {
    if (
      !order ||
      order.status === 'pending' ||
      order.status === 'cancelled' ||
      updating
    )
      return;

    const previousStatus = getPreviousStatus(order.status);
    if (previousStatus === order.status) return;

    try {
      setUpdating(true);
      const payload: any = { status: previousStatus };

      if (order.status === 'shipped') payload.shipped_at = null;
      if (order.status === 'delivered') payload.delivered_at = null;

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('order_number', order.id)
        .select();

      if (error) throw error;

      // Update local state
      setOrder((prev: any) => ({
        ...prev,
        status: previousStatus,
        ...payload,
        timeline: generateTimeline({
          ...prev,
          ...payload,
          status: previousStatus,
        }),
      }));

      toast.success(`Order reverted to ${previousStatus}`);
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (updating) return;

    try {
      setUpdating(true);
      const payload = {
        status: 'cancelled',
        remarks: cancelReason,
        cancelled_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('order_number', order.id)
        .select();

      if (error) throw error;

      // Update local state
      setOrder((prev: any) => ({
        ...prev,
        ...payload,
        timeline: generateTimeline({
          ...prev,
          ...payload,
        }),
      }));

      toast.success('Order cancelled');
      setShowCancelDialog(false);

      // Send cancellation email notification to customer (await to prevent race conditions)
      await sendStatusNotificationEmail(order.id, 'cancelled');
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast.error('Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!order) return;

    const invoiceHtml = `
    <html>
      <head>
        <title>Invoice #${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #f63a9e; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Invoice #${order.id}</h1>
        <p><strong>Customer:</strong> ${order.customer}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Size</th>
              <th>Unit Price</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item: any) =>
                  `<tr>
                    <td>${item.product}</td>
                    <td>${item.size}</td>
                    <td>${item.unitPrice}</td>
                    <td>1</td>
                  </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <h3>Total: ${order.total}</h3>
      </body>
    </html>
  `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }

    toast.success('Invoice opened in print window');
  };

  const handleCopy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    });
  };

  const handleSaveNote = async () => {
    if (!orderId) return;
    setSavingNote(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ notes })
        .eq('order_number', orderId);
      if (error) throw error;
      toast.success('Note saved successfully');
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className='max-w-7xl mx-auto flex items-center justify-center py-20'>
          <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
        </div>
      </AdminLayout>
    );

  if (!order)
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
                <div className='flex items-center gap-3'>
                  {/* Current Status Badge */}
                  <div className='flex items-center gap-2'>
                    <span className='text-xs text-gray-500 font-medium'>
                      Current Status:
                    </span>
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'shipped'
                              ? 'bg-purple-100 text-purple-800'
                              : order.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {order.status === 'pending'
                        ? 'Pending'
                        : order.status === 'processing'
                          ? 'Payment Confirmed'
                          : order.status === 'shipped'
                            ? 'Dispatched'
                            : order.status === 'delivered'
                              ? 'Delivered'
                              : order.status === 'cancelled'
                                ? 'Cancelled'
                                : order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)}
                    </span>
                  </div>
                </div>
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
                    Order Status Timeline
                  </h3>
                  <span className='text-xs text-gray-500'>
                    Est. Delivery:{' '}
                    <span className='text-[#f63a9e] font-medium'>
                      {order.timeline[0]?.date || 'Oct 24th - Oct 28th'}
                    </span>
                  </span>
                </div>
                {/* Timeline Progress */}
                <div className='relative'>
                  <div className='flex justify-between items-start'>
                    {order.timeline.map((step: any, index: number) => {
                      const isNextCompleted =
                        !step.cancelled && order.timeline[index + 1]?.completed;

                      return (
                        <div
                          key={index}
                          className='flex flex-col items-center relative'
                          style={{ flex: 1 }}
                        >
                          {/* Connector Line */}
                          {index < order.timeline.length - 1 && (
                            <div
                              className='absolute top-5 right-0 h-0.5 bg-gray-200'
                              style={{
                                width: '100%',
                                transform: 'translateX(50%)',
                              }}
                            >
                              <div
                                className='h-full bg-[#f63a9e] transition-all duration-500'
                                style={{
                                  width: isNextCompleted ? '100%' : '0%',
                                }}
                              />
                            </div>
                          )}

                          {/* Icon */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center z-10 mb-2 transition-all
                            ${
                              step.cancelled
                                ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                                : step.completed
                                  ? 'bg-[#f63a9e] text-white shadow-lg shadow-pink-200'
                                  : step.active
                                    ? 'bg-white border-2 border-[#f63a9e] text-[#f63a9e] animate-pulse'
                                    : 'bg-white border-2 border-gray-200 text-gray-400'
                            }
                          `}
                          >
                            {timelineIcons[step.label]}
                          </div>

                          {/* Label + Meta */}
                          <div className='text-center'>
                            <p
                              className={`text-xs font-medium mb-0.5 ${
                                step.completed
                                  ? 'text-gray-900'
                                  : step.active
                                    ? 'text-[#f63a9e] font-bold'
                                    : 'text-gray-500'
                              }`}
                            >
                              {step.label}
                            </p>

                            {/* Date */}
                            {step.date && (
                              <p className='text-xs text-gray-600'>
                                {step.date}
                              </p>
                            )}

                            {/* Time */}
                            {step.time && (
                              <p className='text-xs text-gray-500'>
                                {step.time}
                              </p>
                            )}

                            {/* Status Text (In Progress) */}
                            {step.statusText && (
                              <p className='text-xs text-[#f63a9e] font-medium'>
                                {step.statusText}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className='mt-8 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-5'>
                  <div className='flex items-center justify-between gap-4'>
                    {/* Cancel Order */}
                    <Button
                      size='lg'
                      variant='destructive'
                      disabled={
                        updating ||
                        order.status === 'delivered' ||
                        order.status === 'cancelled'
                      }
                      onClick={() => setShowCancelDialog(true)}
                      className='flex-shrink-0'
                    >
                      {updating ? (
                        <Loader2 className='mr-2 animate-spin' />
                      ) : (
                        <X className='mr-2' />
                      )}
                      <span>Cancel Order</span>
                    </Button>

                    {/* Status Info and Navigation */}
                    <div className='flex items-center gap-3 flex-1 justify-end'>
                      {/* Previous Status Button */}
                      <Button
                        size='lg'
                        variant='outline'
                        disabled={
                          updating ||
                          order.status === 'pending' ||
                          order.status === 'cancelled'
                        }
                        onClick={handleBackStatus}
                        className='min-w-[140px]'
                      >
                        {updating ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Reverting...
                          </>
                        ) : (
                          <>
                            <MoveLeft className='mr-2' />
                            Revert Status
                          </>
                        )}
                      </Button>

                      {/* Next Status Button */}
                      <Button
                        size='lg'
                        disabled={
                          updating ||
                          order.status === 'delivered' ||
                          order.status === 'cancelled'
                        }
                        onClick={handleNextStatus}
                        className='min-w-[180px] bg-[#f63a9e] hover:bg-[#e02d8d]'
                      >
                        {updating ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Updating...
                          </>
                        ) : (
                          <>
                            <span className='font-semibold'>
                              {order.status === 'pending'
                                ? 'Confirm Payment'
                                : order.status === 'processing'
                                  ? 'Mark as Dispatched'
                                  : order.status === 'shipped'
                                    ? 'Mark as Delivered'
                                    : 'Next Status'}
                            </span>
                            <MoveRight className='ml-2' />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Helper Text */}
                  {!updating &&
                    order.status !== 'delivered' &&
                    order.status !== 'cancelled' && (
                      <div className='mt-4 flex items-start gap-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-3'>
                        <svg
                          className='w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                          />
                        </svg>
                        <p>
                          {order.status === 'pending' ? (
                            <span>
                              <strong>Next action:</strong> Order will be marked
                              as{' '}
                              <strong className='text-blue-700'>
                                Payment Confirmed
                              </strong>
                              . Customer notification already sent during
                              checkout.
                            </span>
                          ) : order.status === 'processing' ? (
                            <span>
                              <strong>Next action:</strong> Order will be marked
                              as{' '}
                              <strong className='text-purple-700'>
                                Dispatched
                              </strong>{' '}
                              and customer will receive a dispatch notification
                              email.
                            </span>
                          ) : order.status === 'shipped' ? (
                            <span>
                              <strong>Next action:</strong> Order will be marked
                              as{' '}
                              <strong className='text-green-700'>
                                Delivered
                              </strong>{' '}
                              and customer will receive a delivery confirmation
                              email.
                            </span>
                          ) : null}
                        </p>
                      </div>
                    )}
                </div>

                {order.remarks && order.remarks.length && (
                  <Alert className='max-w-full mt-4 border border-[#f63a9e]'>
                    <CheckCircle2Icon color='#f63a9e' />
                    <AlertTitle>Remarks</AlertTitle>
                    <AlertDescription>{order.remarks}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Shipping Details */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='font-semibold mb-4 flex items-center gap-2'>
                <MapPin className='w-4 h-4' />
                Shipping Details
              </h3>
              <div className='space-y-3'>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='font-medium'>{order.customer}</p>
                    <p className='text-sm text-gray-600 mt-1'>
                      {order.address}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        `${order.customer}\n${order.address}`,
                        'Name & address'
                      )
                    }
                    className='p-1.5 hover:bg-gray-100 rounded flex-shrink-0 mt-0.5'
                    title='Copy name & address'
                  >
                    <Copy className='w-3.5 h-3.5 text-gray-400' />
                  </button>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Mail className='w-4 h-4' />
                  <span className='flex-1'>{order.email}</span>
                  <button
                    onClick={() => handleCopy(order.email, 'Email')}
                    className='p-1 hover:bg-gray-100 rounded'
                    title='Copy email'
                  >
                    <Copy className='w-3.5 h-3.5 text-gray-400' />
                  </button>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Phone className='w-4 h-4' />
                  <span className='flex-1'>{order.phone}</span>
                  <button
                    onClick={() => handleCopy(order.phone, 'Phone')}
                    className='p-1 hover:bg-gray-100 rounded'
                    title='Copy phone'
                  >
                    <Copy className='w-3.5 h-3.5 text-gray-400' />
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
              <div className='flex items-start justify-between gap-2'>
                <div className='flex items-start gap-3 flex-1'>
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
                <button
                  onClick={() => handleCopy(order.consent, 'Consent')}
                  className='p-1.5 hover:bg-gray-100 rounded flex-shrink-0 mt-0.5'
                  title='Copy consent'
                >
                  <Copy className='w-3.5 h-3.5 text-gray-400' />
                </button>
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
              <div className='flex items-center justify-between mb-5'>
                <h3 className='font-semibold text-gray-900'>Order Items</h3>
                <span className='text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium'>
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className='space-y-4'>
                {order.items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className='border border-gray-200 rounded-xl overflow-hidden'
                  >
                    {/* Item header */}
                    <div className='bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200'>
                      <div className='flex items-center gap-3 min-w-0'>
                        <span className='flex-shrink-0 w-6 h-6 rounded-full bg-[#f63a9e]/10 text-[#f63a9e] text-xs font-bold flex items-center justify-center'>
                          {index + 1}
                        </span>
                        <span className='font-semibold text-sm text-gray-900 truncate'>{item.product}</span>
                      </div>
                      <span className='flex-shrink-0 text-base font-bold text-gray-900 ml-4'>{item.unitPrice}</span>
                    </div>

                    {/* Item body */}
                    <div className='px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4'>
                      {/* Size */}
                      <div>
                        <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1'>Size</p>
                        <p className='text-sm font-semibold text-gray-800'>{item.size}</p>
                      </div>

                      {/* Quantity */}
                      <div>
                        <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1'>Qty</p>
                        <p className='text-sm font-semibold text-gray-800'>× {item.quantity}</p>
                      </div>

                      {/* Customization */}
                      <div className='col-span-2'>
                        <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1.5'>Customization</p>
                        {item.customization ? (
                          <div className='flex flex-wrap gap-1.5'>
                            {item.customization.shape && (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-xs text-purple-700'>
                                <span className='font-medium'>Shape:</span>
                                <span className='capitalize font-semibold'>{item.customization.shape}</span>
                              </span>
                            )}
                            {item.customization.edgeType && (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-700'>
                                <span className='font-medium'>Sides:</span>
                                <span className='capitalize font-semibold'>{item.customization.edgeType}</span>
                              </span>
                            )}
                            {item.customization.cornerStyle && (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-700'>
                                <span className='font-medium'>Corners:</span>
                                <span className='capitalize font-semibold'>{item.customization.cornerStyle}</span>
                              </span>
                            )}
                            {item.customization.imageQuality !== undefined && (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700'>
                                <span className='font-medium'>Quality:</span>
                                <span className='font-semibold'>{item.customization.imageQuality}%</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className='text-xs text-gray-400 italic'>No customization data</span>
                        )}
                      </div>
                    </div>

                    {/* Item footer — images + invoice */}
                    <div className='px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3'>
                      {/* Images */}
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-[10px] font-medium text-gray-400 uppercase tracking-wide'>Images:</span>
                        {item.images && item.images.length > 0 ? (
                          (item.images as string[]).map((imgUrl: string, imgIdx: number) => (
                            <a
                              key={imgUrl || `img-${imgIdx}`}
                              href={imgUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-700 hover:bg-blue-100 transition-colors font-medium'
                            >
                              <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                              </svg>
                              Image {imgIdx + 1}
                            </a>
                          ))
                        ) : item.image && item.image !== '#' ? (
                          <a
                            href={item.image}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-700 hover:bg-blue-100 transition-colors font-medium'
                          >
                            <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                              <path strokeLinecap='round' strokeLinejoin='round' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                            </svg>
                            View Image
                          </a>
                        ) : (
                          <span className='text-xs text-gray-400 italic'>No image</span>
                        )}
                      </div>

                      {/* Invoice */}
                      <a
                        href={order.hosted_invoice_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 border border-gray-300 text-xs text-gray-700 hover:bg-gray-200 transition-colors font-medium'
                      >
                        <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                        </svg>
                        INV/{orderId}
                      </a>
                    </div>
                  </div>
                ))}
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
                  Print Invoice
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
                onClick={handleSaveNote}
                variant='outline'
                className='w-full'
                size='sm'
                disabled={savingNote}
              >
                {savingNote ? (
                  <>
                    <Loader2 className='w-3.5 h-3.5 mr-2 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save Note'
                )}
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
                      <Badge>New email</Badge>
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
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The order will be permanently
              cancelled and cannot be advanced further.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Optional reason */}
          <Textarea
            placeholder='Reason for cancellation (optional)'
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
          />

          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              className='bg-red-600 hover:bg-red-700'
              onClick={handleCancelOrder}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Cancelling...
                </>
              ) : (
                'Yes, cancel order'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
