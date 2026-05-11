import { useState, useEffect, useMemo, type JSX } from 'react';
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
  Download,
  ExternalLink,
  FileText,
  AlertTriangle,
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
import { AdminOrderShipping } from './admin-order-shipping';
import {
  nextStatus as computeNextStatus,
  previousStatus as computePreviousStatus,
  nextActionLabel,
  statusLabel,
  statusBadgeClass,
  normaliseStatus,
  type OrderStatus,
} from '@/lib/orders/status';
import {
  openInvoiceForPrint,
  downloadInvoiceHtml,
  type InvoiceItem,
} from '@/lib/orders/invoice';

type UpdatingAction = null | 'next' | 'revert' | 'cancel';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const generateTimeline = (data: any) => {
  const createdAt = new Date(data.created_at);
  const paidAt = data.paid_at ? new Date(data.paid_at) : null;
  const shippedAt = data.shipped_at ? new Date(data.shipped_at) : null;
  const deliveredAt = data.delivered_at ? new Date(data.delivered_at) : null;
  const cancelledAt = data.cancelled_at ? new Date(data.cancelled_at) : null;

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const status = normaliseStatus(data.status);
  const paymentConfirmed = data.payment_status === 'paid';

  // For cancelled orders we collapse the timeline to the steps that
  // genuinely happened: Order Placed → (optional) Payment Confirmed →
  // (optional) Dispatched → Cancelled. We never imply Delivered if it
  // wasn't reached.
  if (status === 'cancelled') {
    const steps: any[] = [
      {
        label: 'Order Placed',
        date: formatDate(createdAt),
        time: formatTime(createdAt),
        completed: true,
      },
    ];
    if (paymentConfirmed || paidAt) {
      steps.push({
        label: 'Payment Confirmed',
        date: paidAt ? formatDate(paidAt) : '',
        time: paidAt ? formatTime(paidAt) : '',
        completed: true,
      });
    }
    if (shippedAt) {
      steps.push({
        label: 'Dispatched',
        date: formatDate(shippedAt),
        time: formatTime(shippedAt),
        completed: true,
      });
    }
    steps.push({
      label: 'Cancelled',
      date: cancelledAt ? formatDate(cancelledAt) : '',
      time: cancelledAt ? formatTime(cancelledAt) : '',
      completed: true,
      cancelled: true,
    });
    return steps;
  }

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
      completed: status !== 'pending' && paymentConfirmed,
      active: status === 'pending' && paymentConfirmed,
    },
    {
      label: 'Dispatched',
      date: shippedAt ? formatDate(shippedAt) : '',
      time: shippedAt ? formatTime(shippedAt) : '',
      completed: status === 'delivered',
      active: status === 'shipped',
      statusText: status === 'shipped' ? 'In Progress' : undefined,
    },
    {
      label: 'Delivered',
      date: deliveredAt ? formatDate(deliveredAt) : '',
      time: deliveredAt ? formatTime(deliveredAt) : '',
      completed: status === 'delivered',
    },
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
  // Memoised so we don't recreate the client (and re-trigger fetchOrder) on
  // every render.
  const supabase = useMemo(() => createClient(), []);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [updating, setUpdating] = useState<UpdatingAction>(null);

  // Derived flags used in several places below — keeps render logic readable.
  const status: OrderStatus = order ? normaliseStatus(order.status) : 'pending';
  const isTerminal = status === 'delivered' || status === 'cancelled';
  const hasParcel2GoShipment = Boolean(order?.parcel2go_order_id);
  const paymentConfirmed = order?.payment_status === 'paid';
  // Once a Parcel2Go shipment is booked, ship/deliver transitions are owned
  // by Parcel2Go automation (webhook + cron) — admins should refresh the
  // Shipping panel instead of pressing manual status buttons.
  const manualAdvanceLocked =
    hasParcel2GoShipment &&
    (status === 'processing' || status === 'shipped');
  // pending → processing is only meaningful once Stripe has confirmed payment.
  const canConfirmPayment = status !== 'pending' || paymentConfirmed;

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
              data.payment_status === 'paid'
                ? 'Card Payment'
                : data.payment_status === 'refunded'
                  ? 'Refunded'
                  : data.payment_status === 'failed'
                    ? 'Payment Failed'
                    : 'Pending',
            deliveryMethod:
              data.service_name ||
              (parseFloat(data.shipping_cost || 0) >= 6 ? 'Express' : 'Standard'),
            deliveryPrice: `£${parseFloat(data.shipping_cost || 0).toFixed(2)}`,
            subtotal: `£${parseFloat(data.subtotal).toFixed(2)}`,
            deliveryCharge: `£${parseFloat(data.shipping_cost || 0).toFixed(2)}`,
            discount: parseFloat(data.discount || 0),
            promoCode: data.promo_code || null,
            total: `£${parseFloat(data.total).toFixed(2)}`,
            timeline: generateTimeline({ ...data, status: dbStatus }),
            payment_status: data.payment_status,
            paid_at: data.paid_at,
            cancelled_at: data.cancelled_at,
            consent: data.video_permission
              ? 'Customer has consented to video processing'
              : 'No video consent',
            items: (data.items || []).map((item: any) => ({
              product: item.name,
              size: item.size || 'N/A',
              category: 'Product',
              image: item.image || '#',
              images: Array.isArray(item.images) ? item.images : [],
              unitPrice: `£${parseFloat(item.price).toFixed(2)}`,
              quantity: item.quantity || 1,
              customization: item.customization || null,
            })),
            hosted_invoice_url: data.hosted_invoice_url || '#',
            remarks: data.remarks || '',
            // Parcel2Go shipment fields (used by AdminOrderShipping)
            parcel2go_order_id: data.parcel2go_order_id || null,
            parcel2go_orderline_id: data.parcel2go_orderline_id || null,
            tracking_number: data.tracking_number || null,
            tracking_url: data.tracking_url || null,
            tracking_stage: data.tracking_stage || null,
            carrier_name: data.carrier_name || null,
            service_name: data.service_name || null,
            service_id: data.service_id || null,
            label_url: data.label_url || null,
            shipped_at: data.shipped_at || null,
            shipment_cost: data.shipment_cost || null,
            parcel_dimensions: data.parcel_dimensions || null,
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

  /**
   * Calls the centralised `PATCH /api/orders/:orderNumber/status` endpoint.
   * The backend handles state-machine validation, optimistic locking,
   * audit logging, and idempotent customer email — so the frontend just
   * has to react to the result.
   */
  const callStatusEndpoint = async (
    next: OrderStatus,
    opts: { allowRevert?: boolean; reason?: string } = {}
  ): Promise<{
    ok: boolean;
    emailSent?: boolean;
    error?: string;
    reasonCode?: string;
  }> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { ok: false, error: 'Not authenticated' };
    }
    const response = await fetch(
      `${API_BASE}/api/orders/${encodeURIComponent(order.id)}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: next,
          allowRevert: Boolean(opts.allowRevert),
          reason: opts.reason ?? null,
        }),
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'Failed to update status',
        reasonCode: data.reasonCode,
      };
    }
    return { ok: true, emailSent: Boolean(data.data?.emailSent) };
  };

  const applyLocalStatus = (
    next: OrderStatus,
    extras: Record<string, any> = {}
  ) => {
    setOrder((prev: any) => {
      if (!prev) return prev;
      const merged = { ...prev, status: next, ...extras };
      return {
        ...merged,
        timeline: generateTimeline(merged),
      };
    });
  };

  const handleNextStatus = async () => {
    if (!order || isTerminal || updating) return;
    if (manualAdvanceLocked) {
      toast.info(
        'Use the Shipping panel — dispatch/delivery is driven by Parcel2Go tracking.'
      );
      return;
    }
    if (status === 'pending' && !paymentConfirmed) {
      toast.error(
        'Cannot mark payment as confirmed — Stripe has not reported a successful charge yet.'
      );
      return;
    }

    const next = computeNextStatus(status);
    if (next === status) return;

    setUpdating('next');
    const result = await callStatusEndpoint(next);
    setUpdating(null);

    if (!result.ok) {
      toast.error(result.error || 'Failed to update order status');
      return;
    }

    const extras: Record<string, any> = {};
    if (next === 'shipped') extras.shipped_at = new Date().toISOString();
    if (next === 'delivered') extras.delivered_at = new Date().toISOString();
    applyLocalStatus(next, extras);

    toast.success(`Order moved to ${statusLabel(next)}`, {
      description: result.emailSent
        ? 'Customer notification email sent.'
        : 'No email sent (already notified for this status).',
    });
  };

  const handleBackStatus = async () => {
    if (!order || status === 'pending' || status === 'cancelled' || updating)
      return;
    const previous = computePreviousStatus(status);
    if (previous === status) return;

    setUpdating('revert');
    const result = await callStatusEndpoint(previous, { allowRevert: true });
    setUpdating(null);

    if (!result.ok) {
      toast.error(result.error || 'Failed to revert order status');
      return;
    }

    const extras: Record<string, any> = {};
    if (status === 'shipped') extras.shipped_at = null;
    if (status === 'delivered') extras.delivered_at = null;
    applyLocalStatus(previous, extras);

    toast.success(`Order reverted to ${statusLabel(previous)}`, {
      description: 'No email sent for reverts.',
    });
  };

  const handleCancelOrder = async () => {
    if (updating) return;

    setUpdating('cancel');
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error('No active session token found');
        toast.error('Failed to cancel order: Not authenticated');
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/orders/${encodeURIComponent(order.id)}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reason: cancelReason }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          errorBody.error || errorBody.message || 'Failed to cancel order'
        );
      }

      const result = await response.json();

      const payload = {
        status: 'cancelled' as const,
        remarks: cancelReason || order.remarks,
        cancelled_at: new Date().toISOString(),
        payment_status: 'refunded',
      };
      applyLocalStatus('cancelled', payload);

      toast.success(
        `Order cancelled. £${Number(result.data?.refund_amount || 0).toFixed(2)} refund initiated.`,
        {
          description: result.data?.parcel2go_warning
            ? `Parcel2Go: ${result.data.parcel2go_warning}`
            : result.data?.parcel2go_cancelled
              ? 'Parcel2Go shipment voided.'
              : 'Refund will appear on the original payment method in 3–5 business days.',
        }
      );
      setShowCancelDialog(false);
    } catch (err) {
      console.error('Error cancelling order:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to cancel order';
      toast.error(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  const buildInvoiceData = () => ({
    orderNumber: `#${order.id}`,
    customer: order.customer,
    email: order.email,
    phone: order.phone,
    date: order.date,
    shippingMethod: order.deliveryMethod,
    items: (order.items as any[]).map<InvoiceItem>(item => ({
      product: item.product,
      size: item.size,
      unitPrice: item.unitPrice,
      quantity: item.quantity ?? 1,
    })),
    subtotal: order.subtotal,
    deliveryCharge: order.deliveryCharge,
    discount: order.discount,
    promoCode: order.promoCode,
    total: order.total,
  });

  const handlePrintInvoice = () => {
    if (!order) return;
    const ok = openInvoiceForPrint(buildInvoiceData());
    if (ok) toast.success('Invoice opened in print window');
    else toast.error('Could not open print window — check your popup blocker.');
  };

  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error('Could not download image — opening in new tab instead');
      window.open(url, '_blank');
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    downloadInvoiceHtml(buildInvoiceData());
    toast.success('Invoice downloaded');
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
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold ${statusBadgeClass(status)}`}
                    >
                      {statusLabel(status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Refund Alert Banner */}
              {order.payment_status === 'refunded' && (
                <Alert className='mb-6 border-green-200 bg-green-50'>
                  <CheckCircle2Icon className='h-4 w-4 text-green-600' />
                  <AlertTitle className='text-green-900'>Order Refunded</AlertTitle>
                  <AlertDescription className='text-green-700'>
                    {order.cancelled_at
                      ? `This order was cancelled and refunded on ${new Date(order.cancelled_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}. The refund has been processed to the customer's original payment method.`
                      : 'This order has been cancelled and refunded to the customer.'}
                  </AlertDescription>
                </Alert>
              )}

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
                  {order.timeline[0]?.date && (
                    <span className='text-xs text-gray-500'>
                      Placed:{' '}
                      <span className='text-[#f63a9e] font-medium'>
                        {order.timeline[0].date}
                      </span>
                    </span>
                  )}
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
                      disabled={updating !== null || isTerminal}
                      onClick={() => setShowCancelDialog(true)}
                      className='flex-shrink-0'
                    >
                      {updating === 'cancel' ? (
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
                          updating !== null ||
                          status === 'pending' ||
                          status === 'cancelled'
                        }
                        onClick={handleBackStatus}
                        className='min-w-[140px]'
                      >
                        {updating === 'revert' ? (
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
                          updating !== null ||
                          isTerminal ||
                          manualAdvanceLocked ||
                          !canConfirmPayment
                        }
                        onClick={handleNextStatus}
                        className='min-w-[180px] bg-[#f63a9e] hover:bg-[#e02d8d]'
                      >
                        {updating === 'next' ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Updating...
                          </>
                        ) : (
                          <>
                            <span className='font-semibold'>
                              {nextActionLabel(status)}
                            </span>
                            <MoveRight className='ml-2' />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Helper Text */}
                  {!updating && !isTerminal && (
                    <>
                      {manualAdvanceLocked ? (
                        <div className='mt-4 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-3'>
                          <AlertTriangle className='w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0' />
                          <p>
                            <strong>Status owned by Parcel2Go.</strong> A
                            shipment is booked — the order will move to{' '}
                            <strong>Dispatched</strong> when Parcel2Go reports
                            drop-off and to <strong>Delivered</strong> when
                            confirmed. Use the Shipping panel to refresh
                            tracking instead of advancing manually.
                          </p>
                        </div>
                      ) : status === 'pending' && !paymentConfirmed ? (
                        <div className='mt-4 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-3'>
                          <AlertTriangle className='w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0' />
                          <p>
                            Waiting for Stripe payment confirmation. This
                            order will auto-advance to{' '}
                            <strong>Payment Confirmed</strong> as soon as
                            Stripe reports a successful charge.
                          </p>
                        </div>
                      ) : (
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
                            {status === 'pending' ? (
                              <span>
                                <strong>Next action:</strong> Order will be
                                marked as{' '}
                                <strong className='text-blue-700'>
                                  Payment Confirmed
                                </strong>
                                . Customer notification already sent during
                                checkout.
                              </span>
                            ) : status === 'processing' ? (
                              <span>
                                <strong>Next action:</strong> Order will be
                                marked as{' '}
                                <strong className='text-purple-700'>
                                  Dispatched
                                </strong>{' '}
                                and customer will receive a dispatch
                                notification email.
                              </span>
                            ) : status === 'shipped' ? (
                              <span>
                                <strong>Next action:</strong> Order will be
                                marked as{' '}
                                <strong className='text-green-700'>
                                  Delivered
                                </strong>{' '}
                                and customer will receive a delivery
                                confirmation email.
                              </span>
                            ) : null}
                          </p>
                        </div>
                      )}
                    </>
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
              <div className={`bg-white rounded-lg border p-4 ${
                order.payment_status === 'refunded'
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200'
              }`}>
                <div className='flex items-center gap-2 mb-2'>
                  <CreditCard className={`w-4 h-4 ${
                    order.payment_status === 'refunded'
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`} />
                  <h3 className='text-sm font-medium'>Payment Method</h3>
                  {order.payment_status === 'refunded' && (
                    <span className='ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700'>
                      Refunded
                    </span>
                  )}
                </div>
                <p className={`text-sm ${
                  order.payment_status === 'refunded'
                    ? 'text-green-700 font-medium'
                    : 'text-gray-600'
                }`}>{order.paymentMethod}</p>
                {order.payment_status === 'refunded' && order.cancelled_at && (
                  <p className='text-xs text-green-600 mt-1'>
                    Refunded on {new Date(order.cancelled_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                )}
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
                    <div className='px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-3'>
                      {/* Images row */}
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-[10px] font-medium text-gray-400 uppercase tracking-wide'>Images:</span>
                        {item.images && item.images.length > 0 ? (
                          (item.images as string[]).map((imgUrl: string, imgIdx: number) => (
                            <div key={imgUrl || `img-${imgIdx}`} className='flex items-center gap-1'>
                              <a
                                href={imgUrl}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center gap-1 px-2 py-1 rounded-l-md bg-blue-50 border border-blue-200 text-xs text-blue-700 hover:bg-blue-100 transition-colors font-medium'
                                title='View image'
                              >
                                <ExternalLink className='w-3 h-3' />
                                Image {imgIdx + 1}
                              </a>
                              <button
                                onClick={() => handleDownloadImage(imgUrl, `order-${orderId}-image-${imgIdx + 1}.jpg`)}
                                className='inline-flex items-center gap-1 px-2 py-1 rounded-r-md bg-blue-600 border border-blue-600 text-xs text-white hover:bg-blue-700 transition-colors font-medium -ml-px'
                                title='Download image'
                              >
                                <Download className='w-3 h-3' />
                              </button>
                            </div>
                          ))
                        ) : item.image && item.image !== '#' ? (
                          <div className='flex items-center gap-1'>
                            <a
                              href={item.image}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center gap-1 px-2 py-1 rounded-l-md bg-blue-50 border border-blue-200 text-xs text-blue-700 hover:bg-blue-100 transition-colors font-medium'
                              title='View image'
                            >
                              <ExternalLink className='w-3 h-3' />
                              View Image
                            </a>
                            <button
                              onClick={() => handleDownloadImage(item.image, `order-${orderId}-image.jpg`)}
                              className='inline-flex items-center gap-1 px-2 py-1 rounded-r-md bg-blue-600 border border-blue-600 text-xs text-white hover:bg-blue-700 transition-colors font-medium -ml-px'
                              title='Download image'
                            >
                              <Download className='w-3 h-3' />
                            </button>
                          </div>
                        ) : (
                          <span className='text-xs text-gray-400 italic'>No image</span>
                        )}
                      </div>

                      {/* Invoice row */}
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-[10px] font-medium text-gray-400 uppercase tracking-wide'>Invoice:</span>
                        {order.hosted_invoice_url && order.hosted_invoice_url !== '#' && (
                          <a
                            href={order.hosted_invoice_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 border border-gray-300 text-xs text-gray-700 hover:bg-gray-200 transition-colors font-medium'
                            title='View invoice on Stripe'
                          >
                            <ExternalLink className='w-3 h-3' />
                            View on Stripe
                          </a>
                        )}
                        <button
                          onClick={handlePrintInvoice}
                          className='inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 border border-gray-300 text-xs text-gray-700 hover:bg-gray-200 transition-colors font-medium'
                          title='Print invoice'
                        >
                          <FileText className='w-3 h-3' />
                          Print INV/{orderId}
                        </button>
                        <button
                          onClick={handleDownloadInvoice}
                          className='inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#f63a9e] border border-[#f63a9e] text-xs text-white hover:bg-[#e02d8d] transition-colors font-medium'
                          title='Download invoice as HTML'
                        >
                          <Download className='w-3 h-3' />
                          Download INV
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className='my-4' />

              {/* Totals */}
              <div className='flex justify-end'>
                <div className='w-72 space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Subtotal:</span>
                    <span>{order.subtotal}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Delivery:</span>
                    <span>{order.deliveryCharge}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className='flex justify-between text-sm rounded-md bg-green-50 border border-green-200 px-2 py-1'>
                      <span className='text-green-700 font-medium'>
                        Discount{order.promoCode ? ` (${order.promoCode})` : ''}:
                      </span>
                      <span className='text-green-700 font-semibold'>
                        -£{order.discount.toFixed(2)}
                      </span>
                    </div>
                  )}
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
            {/* Shipping (Parcel2Go) */}
            <AdminOrderShipping
              order={{
                order_number: order.id,
                parcel2go_order_id: order.parcel2go_order_id,
                parcel2go_orderline_id: order.parcel2go_orderline_id,
                tracking_number: order.tracking_number,
                tracking_url: order.tracking_url,
                tracking_stage: order.tracking_stage,
                carrier_name: order.carrier_name,
                service_name: order.service_name,
                service_id: order.service_id,
                label_url: order.label_url,
                shipped_at: order.shipped_at,
                shipment_cost: order.shipment_cost,
                parcel_dimensions: order.parcel_dimensions,
                status: order.status,
              }}
              onShipmentBooked={updates => {
                setOrder((prev: any) => {
                  if (!prev) return prev;
                  const merged = { ...prev, ...updates };
                  return {
                    ...merged,
                    timeline: generateTimeline({
                      ...merged,
                      status: updates.status || merged.status,
                    }),
                  };
                });
              }}
            />

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
            {/* <div className='bg-white rounded-lg border border-gray-200 p-6'>
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
            </div> */}
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
            <AlertDialogCancel disabled={updating === 'cancel'}>
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              className='bg-red-600 hover:bg-red-700'
              onClick={handleCancelOrder}
              disabled={updating === 'cancel'}
            >
              {updating === 'cancel' ? (
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
