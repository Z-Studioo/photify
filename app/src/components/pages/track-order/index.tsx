import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Box,
  Home,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react';

interface DatabaseOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    address: string;
    postcode: string;
  };
  shipping_postcode: string;
  items: Array<{
    id: string;
    name: string;
    image: string;
    quantity: number;
    price: number;
    size?: string;
  }>;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: string;
  payment_status: string;
  video_permission: boolean;
  estimated_delivery: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
}

interface OrderStatus {
  orderNumber: string;
  status: 'processing' | 'shipped' | 'delivered' | 'pending';
  orderDate: string;
  estimatedDelivery: string;
  shippingCity: string;
  shippingAddress: string;
  trackingNumber?: string;
  items: {
    name: string;
    image: string;
    quantity: number;
    size: string;
  }[];
}

const transformOrderToUI = (dbOrder: DatabaseOrder): OrderStatus => {
  let uiStatus: OrderStatus['status'] = 'pending';
  if (dbOrder.status === 'delivered') {
    uiStatus = 'delivered';
  } else if (dbOrder.status === 'shipped') {
    uiStatus = 'shipped';
  } else if (
    dbOrder.status === 'processing' ||
    dbOrder.payment_status === 'paid'
  ) {
    uiStatus = 'processing';
  }

  const orderDate = new Date(dbOrder.created_at).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const estimatedDelivery = dbOrder.estimated_delivery
    ? new Date(dbOrder.estimated_delivery).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'TBD';

  const shippingAddress =
    typeof dbOrder.shipping_address === 'string'
      ? dbOrder.shipping_address
      : dbOrder.shipping_address?.address || 'N/A';

  const shippingCity = dbOrder.shipping_postcode || 'N/A';

  return {
    orderNumber: dbOrder.order_number,
    status: uiStatus,
    orderDate,
    estimatedDelivery,
    shippingCity,
    shippingAddress,
    trackingNumber: dbOrder.stripe_payment_intent_id
      ?.substring(0, 20)
      .toUpperCase(),
    items: dbOrder.items.map(item => ({
      name: item.name,
      image:
        item.image ||
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?w=400',
      quantity: item.quantity,
      size: item.size || 'Custom Size',
    })),
  };
};

const statusSteps = [
  {
    key: 'processing',
    label: 'Order confirmed',
    icon: Box,
    description: 'We have your order and are preparing it for production.',
  },
  {
    key: 'shipped',
    label: 'On the way',
    icon: Truck,
    description: 'Your package has left our facility and is heading to you.',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: CheckCircle2,
    description: 'Successfully delivered. Enjoy your prints.',
  },
];

const journeyStages = [
  {
    label: 'Order confirmed',
    description:
      'As soon as your payment goes through we pick up your order and start the print queue.',
    duration: 'Within minutes',
  },
  {
    label: 'In production',
    description:
      'Your photos are printed, framed (where applicable) and quality-checked by hand.',
    duration: '1–3 working days',
  },
  {
    label: 'Shipped',
    description:
      "Your package is dispatched with our courier. You'll get a tracking reference by email.",
    duration: 'Same / next day',
  },
  {
    label: 'Delivered',
    description:
      'Your prints arrive at the address you provided at checkout. Time to hang them up.',
    duration: 'Standard 6 days · Express 3',
  },
];

const trackingFaqs = [
  {
    q: 'Where do I find my order number?',
    a: "Your order number was emailed to you right after checkout — it starts with 'PH-' followed by 6 digits. Check your inbox (and spam folder) for an email from support@photify.co.",
  },
  {
    q: "Why doesn't my order number work?",
    a: "Make sure you're using the same email address you placed the order with. Both fields are required and case-insensitive. If it still doesn't work, get in touch and we'll look it up for you.",
  },
  {
    q: 'How long does delivery take?',
    a: 'Standard delivery takes 6 working days from order. Express delivery (selectable at checkout) takes 3 working days. You can see your estimated date once your order is confirmed.',
  },
  {
    q: 'My order is late — what should I do?',
    a: "Couriers occasionally run a day or two behind. If your order is more than 2 working days past the estimated date, email support@photify.co with your order number and we'll chase it for you.",
  },
  {
    q: 'Can I change my delivery address after ordering?',
    a: "If your order hasn't shipped yet we can usually update the address — message us as soon as possible. Once it's with the courier, we can't reroute it.",
  },
];

export function OrderTrackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(
    searchParams.get('order_id') || searchParams.get('order') || '',
  );
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [searchedOrder, setSearchedOrder] = useState<OrderStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const orderDetailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paramOrderId =
      searchParams.get('order_id') || searchParams.get('order');
    const paramEmail = searchParams.get('email');
    if (paramOrderId && paramEmail) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      toast.error('Please enter an order number');
      return;
    }

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSearching(true);
    setNotFound(false);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber.toUpperCase().trim())
        .eq('customer_email', email.toLowerCase().trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setSearchedOrder(null);
          setNotFound(true);
          toast.error(
            'Order not found. Please check your order number and email.',
          );
        } else {
          console.error('Error fetching order:', error);
          toast.error('Failed to fetch order. Please try again.');
        }
        return;
      }

      if (data) {
        const transformedOrder = transformOrderToUI(data as DatabaseOrder);
        setSearchedOrder(transformedOrder);
        setNotFound(false);
        toast.success('Order found');
        setTimeout(() => {
          orderDetailsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 100);
      } else {
        setSearchedOrder(null);
        setNotFound(true);
        toast.error(
          'Order not found. Please check your order number and email.',
        );
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('An error occurred while searching. Please try again.');
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusIndex = (status: string) =>
    statusSteps.findIndex(step => step.key === status);

  return (
    <div className="min-h-screen flex flex-col bg-white font-['Mona_Sans',_sans-serif]">
      <Header />

      <main className='flex-1'>
        {/* Hero + Search */}
        {!searchedOrder && (
          <div className='border-b border-gray-200'>
            <div className='max-w-[1200px] mx-auto px-6 md:px-12 pt-20 pb-16'>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className='max-w-2xl'
              >
                <div className='flex items-center gap-2 mb-6'>
                  <Package className='w-4 h-4 text-[#f63a9e]' />
                  <p
                    className='text-[11px] uppercase tracking-[0.18em] text-gray-500'
                    style={{ fontWeight: 600 }}
                  >
                    Order tracking
                  </p>
                </div>
                <h1
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-5"
                  style={{
                    fontSize: 'clamp(36px, 5vw, 52px)',
                    fontWeight: 700,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.05,
                  }}
                >
                  Where&apos;s my order?
                </h1>
                <p className='text-gray-600 text-[17px] leading-relaxed mb-8'>
                  Enter your order number and the email you used at checkout
                  to see real-time progress on your prints.
                </p>

                {/* Search card */}
                <div className='border border-gray-200 rounded-xl p-5 bg-white space-y-4'>
                  <div className='grid sm:grid-cols-2 gap-4'>
                    <div>
                      <Label
                        htmlFor='orderNumber'
                        className='text-[13px] text-gray-700 mb-1.5 block'
                        style={{ fontWeight: 500 }}
                      >
                        Order number
                      </Label>
                      <div className='relative'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          id='orderNumber'
                          type='text'
                          placeholder='e.g. PH-123456'
                          value={orderNumber}
                          onChange={e => setOrderNumber(e.target.value)}
                          onKeyDown={e =>
                            e.key === 'Enter' && handleSearch()
                          }
                          className='h-11 pl-9 pr-3 border-gray-300 focus:border-gray-900 focus-visible:ring-0'
                        />
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor='email'
                        className='text-[13px] text-gray-700 mb-1.5 block'
                        style={{ fontWeight: 500 }}
                      >
                        Email address
                      </Label>
                      <div className='relative'>
                        <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input
                          id='email'
                          type='email'
                          placeholder='you@example.com'
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          onKeyDown={e =>
                            e.key === 'Enter' && handleSearch()
                          }
                          className='h-11 pl-9 pr-3 border-gray-300 focus:border-gray-900 focus-visible:ring-0'
                        />
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center justify-between gap-4 pt-1'>
                    <p className='text-xs text-gray-400'>
                      Your order number was emailed to you after purchase.
                    </p>
                    <Button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className='inline-flex items-center gap-2 bg-[#f63a9e] hover:bg-[#e02d8d] disabled:bg-[#f63a9e]/50 text-white px-5 h-11 rounded-lg text-sm shadow-none'
                      style={{ fontWeight: 500 }}
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className='w-4 h-4 animate-spin' />
                          Searching…
                        </>
                      ) : (
                        <>
                          Track order
                          <ArrowRight className='w-4 h-4' />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className='max-w-[1200px] mx-auto px-6 md:px-12 py-16'>
          <AnimatePresence mode='wait'>
            {/* Not found */}
            {notFound && !searchedOrder && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className='max-w-xl mx-auto text-center border border-gray-200 rounded-xl p-10'
              >
                <div className='w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center mx-auto mb-5'>
                  <AlertCircle className='w-5 h-5 text-gray-400' />
                </div>
                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2"
                  style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.015em' }}
                >
                  Order not found
                </h3>
                <p className='text-gray-500 text-[14.5px] leading-relaxed mb-7'>
                  We couldn&apos;t find an order matching{' '}
                  <span
                    className='text-gray-900'
                    style={{ fontWeight: 500 }}
                  >
                    &ldquo;{orderNumber}&rdquo;
                  </span>{' '}
                  and that email. Please check both and try again.
                </p>
                <Button
                  onClick={() => {
                    setOrderNumber('');
                    setEmail('');
                    setNotFound(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className='bg-gray-900 hover:bg-black text-white rounded-lg h-10 px-5 text-sm shadow-none'
                  style={{ fontWeight: 500 }}
                >
                  Try again
                </Button>
              </motion.div>
            )}

            {/* Order details */}
            {searchedOrder && (
              <motion.div
                ref={orderDetailsRef}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
              >
                {/* Top bar */}
                <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 pb-8 border-b border-gray-200'>
                  <div>
                    <p
                      className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-2'
                      style={{ fontWeight: 600 }}
                    >
                      Order {searchedOrder.orderNumber}
                    </p>
                    <h2
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2"
                      style={{
                        fontSize: 'clamp(28px, 4vw, 40px)',
                        fontWeight: 700,
                        letterSpacing: '-0.022em',
                        lineHeight: 1.1,
                      }}
                    >
                      {(() => {
                        const i = getStatusIndex(searchedOrder.status);
                        return statusSteps[i]?.label ?? 'In progress';
                      })()}
                    </h2>
                    <p className='text-gray-500 text-[15px]'>
                      Placed on {searchedOrder.orderDate} · Estimated delivery{' '}
                      {searchedOrder.estimatedDelivery}
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-3'>
                    <Button
                      onClick={() => {
                        setSearchedOrder(null);
                        setOrderNumber('');
                        setEmail('');
                        setNotFound(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      variant='outline'
                      className='inline-flex items-center gap-2 border border-gray-300 hover:border-gray-900 text-gray-900 bg-white hover:bg-white h-10 px-4 rounded-lg text-sm shadow-none'
                      style={{ fontWeight: 500 }}
                    >
                      <Search className='w-4 h-4' />
                      Track another
                    </Button>
                    <Button
                      onClick={() => navigate('/')}
                      className='inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white h-10 px-4 rounded-lg text-sm shadow-none'
                      style={{ fontWeight: 500 }}
                    >
                      <Home className='w-4 h-4' />
                      Home
                    </Button>
                  </div>
                </div>

                <div className='grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16'>
                  {/* Timeline + tracking */}
                  <div>
                    <p
                      className='text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-5'
                      style={{ fontWeight: 600 }}
                    >
                      Progress
                    </p>
                    <ol className='relative border-l border-gray-200 pl-7 space-y-8'>
                      {statusSteps.map((step, index) => {
                        const StepIcon = step.icon;
                        const currentIndex = getStatusIndex(
                          searchedOrder.status,
                        );
                        const isCompleted = index <= currentIndex;
                        const isCurrent = index === currentIndex;

                        return (
                          <li key={step.key} className='relative'>
                            <span
                              className={`absolute -left-[37px] top-0 flex items-center justify-center w-7 h-7 rounded-full border-2 ${
                                isCurrent
                                  ? 'bg-[#f63a9e] border-[#f63a9e] text-white'
                                  : isCompleted
                                    ? 'bg-white border-[#f63a9e] text-[#f63a9e]'
                                    : 'bg-white border-gray-200 text-gray-300'
                              }`}
                            >
                              <StepIcon className='w-3.5 h-3.5' />
                            </span>
                            <div className='flex items-start justify-between gap-4'>
                              <div>
                                <p
                                  className={`text-[15.5px] mb-1 ${
                                    isCompleted
                                      ? 'text-gray-900'
                                      : 'text-gray-400'
                                  }`}
                                  style={{
                                    fontWeight: 600,
                                    letterSpacing: '-0.01em',
                                  }}
                                >
                                  {step.label}
                                </p>
                                <p
                                  className={`text-[14px] leading-relaxed ${
                                    isCompleted
                                      ? 'text-gray-500'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  {step.description}
                                </p>
                              </div>
                              {isCurrent && (
                                <span
                                  className='inline-flex items-center px-2 py-0.5 rounded-full bg-[#f63a9e]/10 text-[#f63a9e] text-[11px] uppercase tracking-[0.12em] flex-shrink-0'
                                  style={{ fontWeight: 600 }}
                                >
                                  Now
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>

                    {searchedOrder.trackingNumber && (
                      <div className='mt-10 border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                        <div>
                          <p className='text-[11px] uppercase tracking-[0.14em] text-gray-500 mb-1'>
                            Tracking number
                          </p>
                          <p
                            className='text-gray-900 tabular-nums'
                            style={{
                              fontWeight: 600,
                              fontSize: '15.5px',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {searchedOrder.trackingNumber}
                          </p>
                        </div>
                        <p className='text-xs text-gray-400'>
                          Reference for our shipping partner
                        </p>
                      </div>
                    )}

                    {/* Shipping summary */}
                    <div className='mt-10'>
                      <p
                        className='text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3'
                        style={{ fontWeight: 600 }}
                      >
                        Shipping to
                      </p>
                      <p className='text-gray-900 text-[15px]'>
                        {searchedOrder.shippingAddress}
                      </p>
                      <p className='text-gray-500 text-[14px]'>
                        {searchedOrder.shippingCity}
                      </p>
                    </div>
                  </div>

                  {/* Right rail: items + support */}
                  <aside className='space-y-12'>
                    <div>
                      <p
                        className='text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-5'
                        style={{ fontWeight: 600 }}
                      >
                        Items in this order
                      </p>
                      <ul className='border border-gray-200 rounded-xl divide-y divide-gray-100'>
                        {searchedOrder.items.map((item, index) => (
                          <li
                            key={`${item.name}-${index}`}
                            className='flex items-start gap-4 p-4'
                          >
                            <div className='w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-200'>
                              <ImageWithFallback
                                src={item.image}
                                alt={item.name}
                                className='w-full h-full object-cover'
                              />
                            </div>
                            <div className='min-w-0 flex-1'>
                              <p
                                className='text-gray-900 truncate text-[14.5px]'
                                style={{ fontWeight: 500 }}
                              >
                                {item.name}
                              </p>
                              <p className='text-xs text-gray-500 mt-0.5'>
                                {item.size} · Qty {item.quantity}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p
                        className='text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3'
                        style={{ fontWeight: 600 }}
                      >
                        Need help?
                      </p>
                      <p className='text-gray-500 text-[14px] leading-relaxed mb-4'>
                        Something not right with this order? Get in touch and
                        we&apos;ll be back to you within one working day.
                      </p>
                      <div className='space-y-2.5'>
                        <a
                          href='mailto:support@photify.co'
                          className='flex items-center justify-between gap-3 border border-gray-200 hover:border-gray-900 transition-colors rounded-lg px-4 py-3'
                        >
                          <span className='flex items-center gap-3'>
                            <Mail className='w-4 h-4 text-[#f63a9e]' />
                            <span>
                              <span className='block text-xs text-gray-500'>
                                Email
                              </span>
                              <span
                                className='block text-gray-900 text-[14px]'
                                style={{ fontWeight: 500 }}
                              >
                                support@photify.co
                              </span>
                            </span>
                          </span>
                          <ArrowUpRight className='w-4 h-4 text-gray-400' />
                        </a>
                        <a
                          href='https://wa.me/447438940960'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center justify-between gap-3 border border-gray-200 hover:border-gray-900 transition-colors rounded-lg px-4 py-3'
                        >
                          <span className='flex items-center gap-3'>
                            <Phone className='w-4 h-4 text-[#f63a9e]' />
                            <span>
                              <span className='block text-xs text-gray-500'>
                                Phone &amp; WhatsApp
                              </span>
                              <span
                                className='block text-gray-900 text-[14px]'
                                style={{ fontWeight: 500 }}
                              >
                                07438 940960
                              </span>
                            </span>
                          </span>
                          <ArrowUpRight className='w-4 h-4 text-gray-400' />
                        </a>
                      </div>
                    </div>
                  </aside>
                </div>
              </motion.div>
            )}

            {/* Empty / initial state — full editorial content */}
            {!searchedOrder && !notFound && !isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {/* How tracking works */}
                <section className='grid lg:grid-cols-[280px_1fr] gap-10 lg:gap-16 mb-20'>
                  <div>
                    <p
                      className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-3'
                      style={{ fontWeight: 600 }}
                    >
                      How tracking works
                    </p>
                    <h2
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                      style={{
                        fontSize: '26px',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.15,
                      }}
                    >
                      From confirmation to your front door.
                    </h2>
                    <p className='text-gray-500 text-[14.5px] leading-relaxed'>
                      Every order moves through these four stages. We&apos;ll
                      update your tracker as soon as each one starts.
                    </p>
                  </div>
                  <ol className='border-t border-gray-200'>
                    {journeyStages.map((stage, i) => (
                      <li
                        key={i}
                        className='grid grid-cols-[40px_1fr_auto] gap-6 items-start py-5 border-b border-gray-200'
                      >
                        <span
                          className='text-gray-300 tabular-nums text-[15px] pt-0.5'
                          style={{ fontWeight: 500 }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className='min-w-0'>
                          <p
                            className='text-gray-900 mb-1 text-[15.5px]'
                            style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
                          >
                            {stage.label}
                          </p>
                          <p className='text-gray-500 text-[14px] leading-relaxed'>
                            {stage.description}
                          </p>
                        </div>
                        <span className='text-gray-500 text-[13px] whitespace-nowrap pt-0.5'>
                          {stage.duration}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* Delivery & dispatch facts */}
                <section className='border-t border-b border-gray-200 bg-gray-50/60 -mx-6 md:-mx-12 px-6 md:px-12 py-10 mb-20'>
                  <div className='max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-6'>
                    {[
                      {
                        title: 'Standard delivery',
                        desc: '6 working days from order, free over £40.',
                      },
                      {
                        title: 'Express delivery',
                        desc: '3 working days, selectable at checkout.',
                      },
                      {
                        title: 'Dispatch updates',
                        desc: 'Emailed the moment your order leaves us.',
                      },
                      {
                        title: 'UK only',
                        desc: 'We currently ship within the United Kingdom.',
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className='border-l-2 border-[#f63a9e]/60 pl-4'
                      >
                        <p
                          className='text-gray-900 mb-1 text-[14.5px]'
                          style={{ fontWeight: 600 }}
                        >
                          {item.title}
                        </p>
                        <p className='text-gray-500 text-[13.5px] leading-relaxed'>
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* FAQ */}
                <section className='grid lg:grid-cols-[280px_1fr] gap-10 lg:gap-16 mb-20'>
                  <div>
                    <p
                      className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-3'
                      style={{ fontWeight: 600 }}
                    >
                      Tracking FAQ
                    </p>
                    <h2
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                      style={{
                        fontSize: '26px',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.15,
                      }}
                    >
                      Questions about your order?
                    </h2>
                    <p className='text-gray-500 text-[14.5px] leading-relaxed'>
                      Quick answers to the things we get asked most often
                      about delivery and tracking.
                    </p>
                  </div>
                  <div className='border-t border-gray-200'>
                    {trackingFaqs.map((faq, i) => (
                      <details
                        key={i}
                        className='group border-b border-gray-200 py-4'
                      >
                        <summary className='flex items-start justify-between gap-4 cursor-pointer list-none'>
                          <span
                            className='text-gray-900 text-[15px] leading-snug'
                            style={{ fontWeight: 500 }}
                          >
                            {faq.q}
                          </span>
                          <span className='text-gray-400 text-xl leading-none transition-transform group-open:rotate-45 flex-shrink-0'>
                            +
                          </span>
                        </summary>
                        <p className='text-gray-600 text-[14px] mt-3 leading-relaxed'>
                          {faq.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>

                {/* Need help footer */}
                <section className='border-t border-gray-200 pt-12'>
                  <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6'>
                    <div className='max-w-md'>
                      <h3
                        className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2"
                        style={{
                          fontSize: '22px',
                          fontWeight: 700,
                          letterSpacing: '-0.015em',
                        }}
                      >
                        Can&apos;t find your order?
                      </h3>
                      <p className='text-gray-500 text-[15px] leading-relaxed'>
                        Send us your name and the email you ordered with —
                        we&apos;ll look it up and get back to you within one
                        working day.
                      </p>
                    </div>
                    <div className='flex flex-wrap gap-3'>
                      <a
                        href='mailto:support@photify.co'
                        className='inline-flex items-center gap-2 bg-[#f63a9e] hover:bg-[#e02d8d] text-white px-5 h-11 rounded-lg text-sm transition-colors'
                        style={{ fontWeight: 500 }}
                      >
                        <Mail className='w-4 h-4' />
                        Email support
                      </a>
                      <a
                        href='https://wa.me/447438940960'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-2 border border-gray-300 hover:border-gray-900 text-gray-900 px-5 h-11 rounded-lg text-sm transition-colors'
                        style={{ fontWeight: 500 }}
                      >
                        <Phone className='w-4 h-4' />
                        WhatsApp us
                        <ArrowUpRight className='w-3.5 h-3.5 text-gray-400' />
                      </a>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
