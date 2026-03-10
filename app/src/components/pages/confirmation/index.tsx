import { useEffect, useState, type ComponentType } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Package,
  Truck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Home,
  ShoppingBag,
  Video,
  Sparkles,
  Heart,
  Star,
  Download,
  Share2,
  Shield,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
}

interface OrderData {
  orderNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  deliveryType: string;
  estimatedDays: string;
  total: number;
  videoPermission: boolean;
  estimatedDelivery: string;
}

// Confetti component
const Confetti = () => {
  const confettiCount = 50;

  return (
    <div className='fixed inset-0 pointer-events-none z-50 overflow-hidden'>
      {[...Array(confettiCount)].map((_, i) => (
        <motion.div
          key={i}
          className='absolute w-2 h-2 rounded-full bg-[#f63a9e]'
          style={{
            left: `${Math.random() * 100}%`,
            top: -20,
          }}
          animate={{
            y: [0, window.innerHeight + 100],
            x: [0, (Math.random() - 0.5) * 200],
            rotate: [0, Math.random() * 360],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
};

// Floating shapes
const FloatingShape = ({
  delay,
  duration,
  className,
}: {
  delay: number;
  duration: number;
  className: string;
}) => (
  <motion.div
    className={`absolute rounded-full ${className}`}
    animate={{
      y: [0, -30, 0],
      x: [0, 20, 0],
      rotate: [0, 180, 360],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

export function ConfirmationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const orderId = searchParams.get('order_id');

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    { text: 'The prints arrived beautifully packaged!', author: 'Sarah M.' },
    { text: 'Amazing quality and fast shipping!', author: 'John D.' },
    { text: "Best photo printing service I've used!", author: 'Emma L.' },
  ];

  // Fetch order data
  useEffect(() => {
    async function fetchOrder() {
      try {
        if (!orderId) {
          toast.error('No order ID provided');
          navigate('/');
          return;
        }

        const supabase = createClient();
        const { data: order, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) {
          console.error('Error fetching order:', error);
          toast.error('Failed to load order details');
          navigate('/');
          return;
        }

        if (!order) {
          toast.error('Order not found');
          navigate('/');
          return;
        }

        // Format order data
        const shippingAddress =
          typeof order.shipping_address === 'string'
            ? order.shipping_address
            : order.shipping_address?.address || 'N/A';

        // Calculate delivery type and estimated days based on shipping cost
        const shippingCost = parseFloat(
          order.shipping_cost || order.delivery_fee || 0
        );
        const isExpressShipping = Math.abs(shippingCost - 19.99) < 0.01;
        const deliveryType = isExpressShipping
          ? 'Express Shipping'
          : 'Standard Delivery';
        const estimatedDays = isExpressShipping
          ? '2-3 business days'
          : '5-7 business days';

        const formattedOrder: OrderData = {
          orderNumber: order.order_number,
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone || '',
          address: shippingAddress,
          items: order.items || [],
          subtotal: parseFloat(order.subtotal),
          deliveryFee: shippingCost,
          deliveryType: deliveryType,
          estimatedDays: estimatedDays,
          total: parseFloat(order.total),
          videoPermission: order.video_permission || false,
          estimatedDelivery: order.estimated_delivery
            ? new Date(order.estimated_delivery).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(
                'en-US',
                {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }
              ),
        };

        setOrderData(formattedOrder);
        setOrderStatus(order.status || 'pending');

        // Clear cart after successful payment
        if (order.payment_status === 'paid') {
          clearCart();
          // Clear sessionStorage
          sessionStorage.removeItem('pendingOrderId');
        }
      } catch (err) {
        console.error('Error:', err);
        toast.error('Failed to load order');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, navigate, clearCart]);

  // Hide confetti after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Realtime order status updates
  useEffect(() => {
    if (!orderId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`confirmation-order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        payload => {
          const newStatus = (payload.new as { status?: string })?.status;
          if (newStatus) setOrderStatus(newStatus);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  const handlePrintInvoice = () => {
    if (!orderData) return;
    const win = window.open('', '_blank', 'width=820,height=900');
    if (!win) { toast.error('Please allow popups to print the invoice'); return; }
    const itemsHtml = orderData.items
      .map(
        item => `<tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${(item as { size?: string }).size || '—'}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">£${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
      )
      .join('');
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Invoice – ${orderData.orderNumber}</title>
<style>
  body{font-family:sans-serif;color:#111;margin:40px;}
  h1{color:#f63a9e;font-size:28px;margin:0;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #f63a9e;padding-bottom:16px;margin-bottom:24px;}
  .section{margin-bottom:20px;}
  .section h2{font-size:12px;text-transform:uppercase;color:#888;letter-spacing:.1em;margin-bottom:8px;}
  table{width:100%;border-collapse:collapse;}
  th{background:#fafafa;padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#888;border-bottom:2px solid #eee;}
  td{font-size:14px;}
  .total-row td{font-weight:bold;font-size:16px;color:#f63a9e;border-top:2px solid #eee;}
  @media print{body{margin:20px;}}
</style></head><body>
<div class="header">
  <div><h1>Photify</h1><p style="color:#888;margin:4px 0 0;">Invoice</p></div>
  <div style="text-align:right;font-size:13px;color:#555;">
    <strong>Order #${orderData.orderNumber}</strong><br/>
    ${new Date().toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'})}
  </div>
</div>
<div class="section">
  <h2>Customer Details</h2>
  <p style="margin:2px 0;font-size:14px;"><strong>${orderData.name}</strong></p>
  <p style="margin:2px 0;font-size:14px;">${orderData.email}</p>
  <p style="margin:2px 0;font-size:14px;">${orderData.phone || '—'}</p>
  <p style="margin:2px 0;font-size:14px;">${orderData.address}</p>
</div>
<div class="section">
  <h2>Order Items</h2>
  <table>
    <thead><tr><th>Item</th><th style="text-align:center;">Size</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr><td colspan="3" style="padding:8px 12px;">Subtotal</td><td style="padding:8px 12px;text-align:right;">£${orderData.subtotal.toFixed(2)}</td></tr>
      <tr><td colspan="3" style="padding:8px 12px;">${orderData.deliveryType}</td><td style="padding:8px 12px;text-align:right;">£${orderData.deliveryFee.toFixed(2)}</td></tr>
      <tr class="total-row"><td colspan="3" style="padding:12px;">Total</td><td style="padding:12px;text-align:right;">£${orderData.total.toFixed(2)}</td></tr>
    </tfoot>
  </table>
</div>
<div style="margin-top:24px;color:#888;font-size:12px;">Estimated Delivery: ${orderData.estimatedDelivery} (${orderData.deliveryType} · ${orderData.estimatedDays})</div>
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareText = `I just ordered from Photify! Order #${orderData?.orderNumber}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Photify Order', text: shareText, url });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          toast.success('Order link copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Order link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 font-['Mona_Sans',_sans-serif]">
        <Header />
        <main className='flex-1 flex items-center justify-center'>
          <div className='text-center'>
            <Loader2 className='w-12 h-12 animate-spin text-[#f63a9e] mx-auto mb-4' />
            <p className='text-gray-600 text-lg' style={{ fontWeight: '600' }}>
              Loading your order...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 font-['Mona_Sans',_sans-serif] relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && <Confetti />}

      <Header />

      <main className='flex-1 relative'>
        {/* Subtle Background Elements */}
        <div className='fixed inset-0 overflow-hidden pointer-events-none'>
          <FloatingShape
            delay={0}
            duration={8}
            className='top-20 left-10 w-32 h-32 bg-[#f63a9e]/5 blur-3xl'
          />
          <FloatingShape
            delay={1}
            duration={10}
            className='top-40 right-20 w-40 h-40 bg-gray-300/10 blur-3xl'
          />
          <FloatingShape
            delay={2}
            duration={12}
            className='bottom-40 left-1/4 w-36 h-36 bg-[#f63a9e]/5 blur-3xl'
          />
          <FloatingShape
            delay={3}
            duration={9}
            className='bottom-20 right-1/3 w-44 h-44 bg-gray-200/10 blur-3xl'
          />
        </div>

        {/* Hero Section */}
        <div className='relative overflow-hidden bg-white border-b border-gray-200'>
          <div className='max-w-[1400px] mx-auto px-8 py-16'>
            {/* Success Icon and Title Section */}
            <div className='flex flex-col md:flex-row items-start md:items-center gap-8 mb-12'>
              {/* Left: Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  duration: 0.6,
                  bounce: 0.4,
                }}
                className='flex-shrink-0'
              >
                <div className='w-24 h-24 rounded-full bg-[#f63a9e] flex items-center justify-center shadow-lg'>
                  <CheckCircle2 className='w-12 h-12 text-white' />
                </div>
              </motion.div>

              {/* Right: Title and Description */}
              <div className='flex-1'>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                    style={{
                      fontSize: '40px',
                      fontWeight: '700',
                      lineHeight: '1.2',
                    }}
                  >
                    Thank you, {orderData.name.split(' ')[0]}!
                  </h1>
                  <p className='text-gray-600 mb-4'>
                    Your order has been confirmed and we&apos;re already working
                    on your beautiful prints.
                  </p>

                  {/* Order Number */}
                  <div className='flex items-center gap-3'>
                    <span
                      className='text-gray-500 text-sm'
                      style={{ fontWeight: '600' }}
                    >
                      Order Number:
                    </span>
                    <span
                      className="font-['Bricolage_Grotesque',_sans-serif] text-[#f63a9e]"
                      style={{
                        fontSize: '24px',
                        fontWeight: '800',
                        letterSpacing: '0.02em',
                      }}
                    >
                      #{orderData.orderNumber}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Key Information Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='grid grid-cols-1 md:grid-cols-3 gap-4'
            >
              {/* Confirmation Email */}
              <div className='bg-gray-50 rounded-xl p-5 border border-gray-200'>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='w-10 h-10 rounded-lg bg-white flex items-center justify-center'>
                    <Mail className='w-5 h-5 text-[#f63a9e]' />
                  </div>
                  <div>
                    <h3 className='text-gray-900' style={{ fontWeight: '700' }}>
                      Confirmation Sent
                    </h3>
                    <p className='text-gray-500 text-sm'>Check your inbox</p>
                  </div>
                </div>
              </div>

              {/* Processing */}
              <div className='bg-[#f63a9e]/5 rounded-xl p-5 border-2 border-[#f63a9e]/30'>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='w-10 h-10 rounded-lg bg-[#f63a9e] flex items-center justify-center'>
                    <Package className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='text-gray-900' style={{ fontWeight: '700' }}>
                      Processing
                    </h3>
                    <p className='text-gray-500 text-sm'>Being prepared now</p>
                  </div>
                </div>
              </div>

              {/* Delivery Date */}
              <div className='bg-gray-50 rounded-xl p-5 border border-gray-200'>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='w-10 h-10 rounded-lg bg-white flex items-center justify-center'>
                    <Truck className='w-5 h-5 text-gray-600' />
                  </div>
                  <div>
                    <h3 className='text-gray-900' style={{ fontWeight: '700' }}>
                      {orderData.deliveryType}
                    </h3>
                    <p className='text-gray-500 text-sm'>
                      {orderData.estimatedDays} • Arrives by{' '}
                      {orderData.estimatedDelivery}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className='max-w-[1400px] mx-auto px-8 py-16 relative z-10'>
          <div className='grid lg:grid-cols-3 gap-8'>
            {/* Left Column - Order Journey & Details */}
            <div className='lg:col-span-2 space-y-8'>
              {/* What's Next - Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className='bg-white rounded-3xl p-8 shadow-lg border border-gray-200 relative overflow-hidden'>
                  <div className='relative z-10'>
                    <div className='flex items-center gap-3 mb-8'>
                      <div className='w-12 h-12 rounded-xl bg-[#f63a9e] flex items-center justify-center shadow-md'>
                        <Clock className='w-6 h-6 text-white' />
                      </div>
                      <h2
                        className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                        style={{ fontSize: '24px', fontWeight: '700' }}
                      >
                        What&apos;s Next
                      </h2>
                    </div>

                    <div className='space-y-6 relative'>
                      {/* Connecting line */}
                      <div className='absolute left-7 top-14 bottom-14 w-0.5 bg-gray-200' />

                      {((): Array<{ icon: ComponentType<{ className?: string }>; title: string; description: string; status: 'complete' | 'current' | 'upcoming'; badge: string }> => {
                          const s = orderStatus;
                          const step1 = s === 'processing' || s === 'shipped' || s === 'delivered' ? 'complete' : 'complete';
                          const step2 = s === 'shipped' || s === 'delivered' ? 'complete' : (s === 'processing' ? 'current' : 'current');
                          const step3 = s === 'delivered' ? 'complete' : (s === 'shipped' ? 'current' : 'upcoming');
                          const badgeFor = (st: string) => st === 'complete' ? 'Done' : st === 'current' ? 'In Progress' : 'Soon';
                          return [
                            {
                              icon: Mail,
                              title: 'Confirmation Sent',
                              description: `Check ${orderData.email} for your receipt`,
                              status: step1,
                              badge: badgeFor(step1),
                            },
                            {
                              icon: Package,
                              title: s === 'shipped' || s === 'delivered' ? 'Order Prepared' : 'Preparing Your Order',
                              description: 'Our team is carefully crafting your prints',
                              status: step2,
                              badge: badgeFor(step2),
                            },
                            {
                              icon: Truck,
                              title: s === 'delivered' ? 'Delivered' : (s === 'shipped' ? 'On the Way' : 'Delivery'),
                              description: s === 'delivered' ? 'Your prints have arrived!' : `${orderData.deliveryType} • ${orderData.estimatedDays}`,
                              status: step3,
                              badge: s === 'delivered' ? 'Delivered' : badgeFor(step3),
                            },
                          ];
                        })().map((step, index) => {
                        const StepIcon = step.icon;
                        return (
                          <motion.div
                            key={step.title}
                            className={`relative flex items-start gap-5 p-6 rounded-2xl border transition-all ${
                              step.status === 'current'
                                ? 'bg-[#f63a9e]/5 border-[#f63a9e]/30 shadow-md'
                                : 'bg-gray-50 border-gray-100'
                            }`}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1 + index * 0.15 }}
                            whileHover={{ scale: 1.02, x: 5 }}
                          >
                            {/* Icon */}
                            <motion.div
                              className={`relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg z-10 ${
                                step.status === 'current'
                                  ? 'bg-[#f63a9e]'
                                  : 'bg-white border-2 border-gray-200'
                              }`}
                              animate={
                                step.status === 'current'
                                  ? {
                                      scale: [1, 1.05, 1],
                                    }
                                  : {}
                              }
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <StepIcon
                                className={`w-7 h-7 ${step.status === 'current' ? 'text-white' : 'text-gray-400'}`}
                              />

                              {/* Status indicator */}
                              {step.status === 'complete' && (
                                <motion.div
                                  className='absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#f63a9e] flex items-center justify-center shadow-lg'
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    delay: 1.2 + index * 0.15,
                                    type: 'spring',
                                  }}
                                >
                                  <CheckCircle2 className='w-4 h-4 text-white' />
                                </motion.div>
                              )}

                              {step.status === 'current' && (
                                <motion.div
                                  className='absolute -top-2 -right-2 w-3 h-3 rounded-full bg-white'
                                  animate={{ scale: [1, 1.5, 1] }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                  }}
                                />
                              )}
                            </motion.div>

                            {/* Content */}
                            <div className='flex-1 pt-1'>
                              <div className='flex items-center gap-3 mb-2'>
                                <h3
                                  className='text-gray-900'
                                  style={{ fontWeight: '700' }}
                                >
                                  {step.title}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs ${
                                    step.status === 'current'
                                      ? 'bg-[#f63a9e] text-white'
                                      : 'bg-gray-200 text-gray-600'
                                  }`}
                                  style={{ fontWeight: '700' }}
                                >
                                  {step.badge}
                                </span>
                              </div>
                              <p className='text-gray-600 text-sm'>
                                {step.description}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Video Permission */}
              {orderData.videoPermission && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                >
                  <div className='bg-gradient-to-br from-[#f63a9e]/5 to-gray-50 rounded-3xl p-8 border border-[#f63a9e]/20 shadow-lg'>
                    <div className='flex items-start gap-5'>
                      <motion.div
                        className='w-16 h-16 rounded-2xl bg-[#f63a9e] flex items-center justify-center flex-shrink-0 shadow-xl'
                        animate={{
                          y: [0, -5, 0],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Video className='w-8 h-8 text-white' />
                      </motion.div>

                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-3'>
                          <h3
                            className='text-gray-900'
                            style={{ fontWeight: '700' }}
                          >
                            Behind-the-Scenes Video
                          </h3>
                          <Sparkles className='w-5 h-5 text-[#f63a9e]' />
                        </div>

                        <p className='text-gray-600 mb-4'>
                          You&apos;ll receive a personalized video showing your
                          prints being crafted with care. We&apos;ll send it to
                          your email once ready. 🎥
                        </p>

                        <div className='flex flex-wrap gap-3'>
                          {['Quality Check', 'Packaging', 'Personal Touch'].map(
                            (feature, i) => (
                              <motion.div
                                key={feature}
                                className='flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100'
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.4 + i * 0.1 }}
                              >
                                <div className='w-2 h-2 rounded-full bg-[#f63a9e]' />
                                <span
                                  className='text-sm text-gray-700'
                                  style={{ fontWeight: '600' }}
                                >
                                  {feature}
                                </span>
                              </motion.div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
              >
                <div className='bg-white rounded-3xl p-8 shadow-lg border border-gray-200'>
                  <div className='flex items-center justify-between mb-8'>
                    <div className='flex items-center gap-3'>
                      <div className='w-12 h-12 rounded-xl bg-[#f63a9e] flex items-center justify-center'>
                        <ShoppingBag className='w-6 h-6 text-white' />
                      </div>
                      <h2
                        className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                        style={{ fontSize: '24px', fontWeight: '700' }}
                      >
                        Your Order
                      </h2>
                    </div>
                    <div
                      className='px-4 py-2 rounded-full bg-gray-100 text-gray-900 text-sm'
                      style={{ fontWeight: '700' }}
                    >
                      {orderData.items.length}{' '}
                      {orderData.items.length === 1 ? 'Item' : 'Items'}
                    </div>
                  </div>

                  <div className='grid gap-4 mb-6'>
                    {orderData.items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        className='group flex gap-5 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#f63a9e]/30 hover:shadow-md transition-all'
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.6 + index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        {/* Image */}
                        <div className='relative flex-shrink-0'>
                          <motion.img
                            src={item.image}
                            alt={item.name}
                            className='w-28 h-28 rounded-xl object-cover shadow-md'
                            whileHover={{ scale: 1.05 }}
                          />
                          <div
                            className='absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#f63a9e] flex items-center justify-center text-white text-xs shadow-lg'
                            style={{ fontWeight: '700' }}
                          >
                            {item.quantity}
                          </div>
                        </div>

                        {/* Details */}
                        <div className='flex-1 flex flex-col justify-center'>
                          <h3
                            className='text-gray-900 mb-2'
                            style={{ fontWeight: '700' }}
                          >
                            {item.name}
                          </h3>
                          <div className='flex items-center gap-4 text-sm text-gray-600 mb-3'>
                            <span
                              className='px-3 py-1 bg-white rounded-full shadow-sm border border-gray-100'
                              style={{ fontWeight: '600' }}
                            >
                              {item.size}
                            </span>
                            <span style={{ fontWeight: '600' }}>
                              Qty: {item.quantity}
                            </span>
                          </div>
                          <div
                            className='text-[#f63a9e]'
                            style={{ fontSize: '20px', fontWeight: '800' }}
                          >
                            £{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Price Summary */}
                  <div className='bg-gray-50 rounded-2xl p-6 border border-gray-100'>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center text-gray-600'>
                        <span className='flex items-center gap-2'>
                          <Package className='w-4 h-4' />
                          Subtotal
                        </span>
                        <span style={{ fontWeight: '700', fontSize: '18px' }}>
                          £{orderData.subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className='flex justify-between items-center text-gray-600'>
                        <span className='flex items-center gap-2'>
                          <Truck className='w-4 h-4' />
                          Delivery
                        </span>
                        <div className='text-right'>
                          <span style={{ fontWeight: '700', fontSize: '18px' }}>
                            £{orderData.deliveryFee.toFixed(2)}
                          </span>
                          <p className='text-xs text-gray-500 mt-0.5'>
                            {orderData.deliveryType} • {orderData.estimatedDays}
                          </p>
                        </div>
                      </div>

                      <div className='h-px bg-gray-200 my-4' />

                      <div className='flex justify-between items-center pt-2'>
                        <span
                          className='text-gray-900'
                          style={{ fontWeight: '700', fontSize: '20px' }}
                        >
                          Total
                        </span>
                        <span
                          className='text-[#f63a9e]'
                          style={{ fontWeight: '800', fontSize: '28px' }}
                        >
                          £{orderData.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Info & Actions */}
            <div className='space-y-6'>
              {/* Delivery Details */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.7 }}
              >
                <div className='bg-white rounded-3xl p-6 shadow-lg border border-gray-200'>
                  <div className='flex items-center gap-3 mb-6'>
                    <div className='w-12 h-12 rounded-xl bg-[#f63a9e] flex items-center justify-center'>
                      <MapPin className='w-6 h-6 text-white' />
                    </div>
                    <h3
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                      style={{ fontSize: '24px', fontWeight: '700' }}
                    >
                      Delivery Details
                    </h3>
                  </div>

                  <div className='space-y-4'>
                    {[
                      { icon: Mail, label: 'Email', value: orderData.email },
                      { icon: Phone, label: 'Phone', value: orderData.phone },
                      {
                        icon: MapPin,
                        label: 'Address',
                        value: orderData.address,
                      },
                      {
                        icon: Calendar,
                        label: 'Expected',
                        value: orderData.estimatedDelivery,
                      },
                    ].map((item, i) => {
                      const ItemIcon = item.icon;
                      return (
                        <motion.div
                          key={item.label}
                          className='flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#f63a9e]/30 transition-all'
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.8 + i * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className='w-10 h-10 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0'>
                            <ItemIcon className='w-5 h-5 text-gray-600' />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p
                              className='text-gray-500 text-xs mb-1'
                              style={{ fontWeight: '600' }}
                            >
                              {item.label}
                            </p>
                            <p
                              className='text-gray-900 text-sm break-words'
                              style={{ fontWeight: '700' }}
                            >
                              {item.value}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                className='space-y-4'
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.0 }}
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    onClick={() => navigate('/')}
                    className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-2xl shadow-xl h-[50px]'
                    style={{ fontWeight: '700' }}
                  >
                    <Home className='w-5 h-5 mr-2' />
                    Continue Shopping
                  </Button>
                </motion.div>

                <div className='grid grid-cols-2 gap-3'>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      onClick={handlePrintInvoice}
                      variant='outline'
                      className='w-full border-2 border-gray-200 hover:border-[#f63a9e] hover:bg-[#f63a9e]/5 rounded-xl h-[50px]'
                      style={{ fontWeight: '700' }}
                    >
                      <Download className='w-5 h-5 mr-2' />
                      Print
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      onClick={handleShare}
                      variant='outline'
                      className='w-full border-2 border-gray-200 hover:border-[#f63a9e] hover:bg-[#f63a9e]/5 rounded-xl h-[50px]'
                      style={{ fontWeight: '700' }}
                    >
                      <Share2 className='w-5 h-5 mr-2' />
                      Share
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              {/* Security Badge */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.1 }}
              >
                <div className='bg-gray-50 rounded-2xl p-6 border border-gray-200'>
                  <div className='flex items-center gap-4 mb-4'>
                    <div className='w-12 h-12 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm'>
                      <Shield className='w-6 h-6 text-gray-600' />
                    </div>
                    <div>
                      <h4
                        className='text-gray-900'
                        style={{ fontWeight: '800' }}
                      >
                        Secure Payment
                      </h4>
                      <p className='text-gray-600 text-xs'>
                        Encrypted & Protected
                      </p>
                    </div>
                  </div>
                  <p className='text-gray-600 text-sm'>
                    Your payment was processed securely via Stripe with 256-bit
                    encryption 🔒
                  </p>
                </div>
              </motion.div>

              {/* Customer Testimonial */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.2 }}
              >
                <div className='bg-gradient-to-br from-[#f63a9e]/5 to-gray-50 rounded-2xl p-6 border border-[#f63a9e]/20 relative overflow-hidden'>
                  <div className='relative z-10'>
                    <div className='flex items-center justify-between mb-4'>
                      <Heart className='w-8 h-8 text-[#f63a9e]' />
                      <div className='flex gap-1'>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className='w-4 h-4 text-[#f63a9e] fill-[#f63a9e]'
                          />
                        ))}
                      </div>
                    </div>

                    <AnimatePresence mode='wait'>
                      <motion.div
                        key={currentTestimonial}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                      >
                        <p
                          className='text-gray-700 mb-3 italic'
                          style={{ fontWeight: '500' }}
                        >
                          &quot;{testimonials[currentTestimonial].text}&quot;
                        </p>
                        <p
                          className='text-gray-900 text-sm'
                          style={{ fontWeight: '700' }}
                        >
                          — {testimonials[currentTestimonial].author}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
