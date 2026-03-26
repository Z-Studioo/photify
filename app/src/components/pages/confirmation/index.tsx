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
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [filmingConsent, setFilmingConsent] = useState<'yes' | 'no' | null>(
    null
  );

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

  // Show confetti only after consent and hide after 4 seconds
  useEffect(() => {
    if (filmingConsent === null) return;
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, [filmingConsent]);

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

      {filmingConsent === null ? (
        <main className='fixed inset-0 z-[120] bg-white/95 backdrop-blur-sm flex items-center justify-center px-4 sm:px-6 py-10'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className='w-full max-w-2xl bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6 sm:p-8'
          >
            <div className='flex items-start gap-4 mb-5'>
              <div className='w-12 h-12 rounded-xl bg-[#FFF5FB] flex items-center justify-center flex-shrink-0'>
                <Video className='w-6 h-6 text-[#f63a9e]' />
              </div>
              <div>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                  style={{ fontSize: '28px', fontWeight: '700', lineHeight: '1.2' }}
                >
                  Quick Consent
                </h2>
                <p className='text-gray-600 mt-1'>
                  Would you allow us to film the making of your product for
                  promotional purposes?
                </p>
              </div>
            </div>

            <div className='rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6'>
              <p className='text-sm text-gray-600'>
                Your choice is required to continue to your order confirmation.
              </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <Button
                onClick={() => setFilmingConsent('yes')}
                className='h-12 rounded-xl bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
                style={{ fontWeight: '700' }}
              >
                Yes, I consent
              </Button>
              <Button
                onClick={() => setFilmingConsent('no')}
                variant='outline'
                className='h-12 rounded-xl border-2 border-gray-200 hover:border-gray-300 bg-white'
                style={{ fontWeight: '700' }}
              >
                No, I do not consent
              </Button>
            </div>
          </motion.div>
        </main>
      ) : (
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
                            Your Behind-the-Scenes Video is Coming!
                          </h3>
                          <Sparkles className='w-5 h-5 text-[#f63a9e]' />
                        </div>

                        <p className='text-gray-600 mb-4'>
                          We&apos;re creating a special video of your prints being crafted — perfect for sharing on social media! 📱✨
                          We&apos;ll send it to <strong>{orderData.email}</strong> once ready.
                        </p>

                        <div className='flex flex-wrap gap-3'>
                          {[
                            { icon: '📸', label: 'Social Ready' },
                            { icon: '🎨', label: 'Crafting Process' },
                            { icon: '✨', label: 'Shareable Content' },
                          ].map((feature, i) => (
                            <motion.div
                              key={feature.label}
                              className='flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100'
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.4 + i * 0.1 }}
                            >
                                <span className='text-sm'>{feature.icon}</span>
                                <span
                                  className='text-sm text-gray-700'
                                  style={{ fontWeight: '600' }}
                                >
                                  {feature.label}
                                </span>
                              </motion.div>
                          ))}
                        </div>

                        <p className='text-xs text-gray-500 mt-3'>
                          💡 Get ready to share your print journey with the world! 🌍
                        </p>
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
      )}

      <Footer />
    </div>
  );
}
