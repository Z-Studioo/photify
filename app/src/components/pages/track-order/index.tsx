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
  Clock,
  CheckCheck,
  PackageCheck,
  Frame,
  Image as ImageIcon,
  Square,
  Layers,
  Camera,
  PictureInPicture,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react';

// Database Order Type
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
  status: string; // 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: string; // 'pending' | 'paid' | 'failed' | 'refunded'
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

// UI Order Status Type
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

// Helper function to transform database order to UI format
const transformOrderToUI = (dbOrder: DatabaseOrder): OrderStatus => {
  // Map database status to UI status
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

  // Format dates
  const orderDate = new Date(dbOrder.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const estimatedDelivery = dbOrder.estimated_delivery
    ? new Date(dbOrder.estimated_delivery).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'TBD';

  // Extract city from address
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
    label: 'Order Confirmed',
    icon: Box,
    description: 'Your order is being prepared',
    image:
      'https://images.unsplash.com/photo-1608497454474-29b2a8e9fa91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXJlaG91c2UlMjBzaGlwcGluZ3xlbnwxfHx8fDE3NjA4NjkzNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    key: 'shipped',
    label: 'On the Way',
    icon: Truck,
    description: 'Package is on the way to you',
    image:
      'https://images.unsplash.com/photo-1759671934974-a4928e049dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaGlwcGluZyUyMHRydWNrJTIwZGVsaXZlcnl8ZW58MXx8fHwxNzYwOTYxNzM3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: CheckCircle2,
    description: 'Successfully delivered',
    image:
      'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNTMxMjY2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export function OrderTrackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(
    searchParams.get('order_id') || searchParams.get('order') || ''
  );
  const [email, setEmail] = useState(
    searchParams.get('email') || ''
  );
  const [searchedOrder, setSearchedOrder] = useState<OrderStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const orderDetailsRef = useRef<HTMLDivElement>(null);

  // Auto-search when both order_id and email are present as query params (email link)
  useEffect(() => {
    const paramOrderId = searchParams.get('order_id') || searchParams.get('order');
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

      // Query order with order number and email verification
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber.toUpperCase().trim())
        .eq('customer_email', email.toLowerCase().trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          setSearchedOrder(null);
          setNotFound(true);
          toast.error(
            'Order not found. Please check your order number and email.'
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
        toast.success('Order found!');
        setTimeout(() => {
          orderDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setSearchedOrder(null);
        setNotFound(true);
        toast.error(
          'Order not found. Please check your order number and email.'
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

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const currentStatusStep = searchedOrder
    ? statusSteps[getStatusIndex(searchedOrder.status)]
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-white font-['Mona_Sans',_sans-serif]">
      <Header />

      <main className='flex-1'>
        {!searchedOrder && (
          <div className='relative overflow-hidden bg-[#FFF5FB]'>
            {/* Animated Decorative Elements */}
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              {/* Floating Circles */}
              <motion.div
                className='absolute top-20 right-[10%] w-32 h-32 border-4 border-[#f63a9e]/20 rounded-full'
                animate={{
                  y: [0, -30, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className='absolute bottom-32 left-[8%] w-24 h-24 border-4 border-[#f63a9e]/10 rounded-full'
                animate={{
                  y: [0, 40, 0],
                  rotate: [360, 180, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              />

              {/* Floating Business Icons */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className='absolute'
                  style={{
                    left: `${10 + i * 8}%`,
                    top: `${15 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [0, -40, 0],
                    opacity: [0.2, 0.5, 0.2],
                    rotate: [0, 15, -15, 0],
                  }}
                  transition={{
                    duration: 4 + (i % 4),
                    delay: i * 0.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {i % 6 === 0 && <Frame className='w-7 h-7 text-[#f63a9e]/30' />}
                  {i % 6 === 1 && (
                    <ImageIcon className='w-6 h-6 text-[#f63a9e]/30' />
                  )}
                  {i % 6 === 2 && (
                    <Square className='w-6 h-6 text-[#f63a9e]/30' />
                  )}
                  {i % 6 === 3 && (
                    <Layers className='w-6 h-6 text-[#f63a9e]/30' />
                  )}
                  {i % 6 === 4 && (
                    <Camera className='w-7 h-7 text-[#f63a9e]/30' />
                  )}
                  {i % 6 === 5 && (
                    <PictureInPicture className='w-6 h-6 text-[#f63a9e]/30' />
                  )}
                </motion.div>
              ))}
            </div>

            <div className='relative z-10 max-w-[1400px] mx-auto px-8 py-24'>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className='text-center max-w-3xl mx-auto'
              >
                {/* Animated Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    duration: 0.8,
                    bounce: 0.5,
                  }}
                  className='inline-flex items-center justify-center relative mb-8'
                >
                  <motion.div
                    className='w-32 h-32 rounded-full bg-[#f63a9e] flex items-center justify-center shadow-2xl'
                    animate={{
                      boxShadow: [
                        '0 20px 60px rgba(246, 58, 158, 0.3)',
                        '0 20px 80px rgba(246, 58, 158, 0.5)',
                        '0 20px 60px rgba(246, 58, 158, 0.3)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Package className='w-16 h-16 text-white' />
                  </motion.div>

                  {/* Orbiting Business Icons */}
                  {[Frame, ImageIcon, Square].map((Icon, i) => (
                    <motion.div
                      key={i}
                      className='absolute'
                      style={{
                        left: '50%',
                        top: '50%',
                      }}
                      animate={{
                        rotate: [0 + i * 120, 360 + i * 120],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <div
                        style={{
                          transform: 'translate(-50%, -50%) translateY(-80px)',
                        }}
                      >
                        <Icon className='w-7 h-7 text-[#f63a9e]' />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <h1
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                  style={{
                    fontSize: '40px',
                    fontWeight: '700',
                    lineHeight: '1.2',
                  }}
                >
                  Track Your Order
                </h1>

                <p className='text-gray-600 mb-10 text-lg'>
                  Enter your order number and email to see real-time updates on
                  your delivery
                </p>

                {/* Search Box */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className='relative max-w-2xl mx-auto'
                >
                  <div className='bg-white rounded-2xl p-6 shadow-2xl border-2 border-gray-100 space-y-4'>
                  {/* Order Number Input */}
                  <div>
                    <Label
                      htmlFor='orderNumber'
                      className='text-gray-700 mb-2 block'
                      style={{ fontWeight: '600' }}
                    >
                      Order Number
                    </Label>
                    <div className='relative'>
                      <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                      <Input
                        id='orderNumber'
                        type='text'
                        placeholder='e.g., PH-123456'
                        value={orderNumber}
                        onChange={e => setOrderNumber(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSearch()}
                        className='h-[56px] pl-12 pr-4 border-2 border-gray-200 focus-visible:ring-2 focus-visible:ring-[#f63a9e] focus-visible:border-[#f63a9e] text-lg'
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div>
                    <Label
                      htmlFor='email'
                      className='text-gray-700 mb-2 block'
                      style={{ fontWeight: '600' }}
                    >
                      Email Address
                    </Label>
                    <div className='relative'>
                      <Mail className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                      <Input
                        id='email'
                        type='email'
                        placeholder='your@email.com'
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSearch()}
                        className='h-[56px] pl-12 pr-4 border-2 border-gray-200 focus-visible:ring-2 focus-visible:ring-[#f63a9e] focus-visible:border-[#f63a9e] text-lg'
                      />
                    </div>
                  </div>

                  {/* Search Button */}
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[56px] shadow-lg'
                    style={{ fontWeight: '700' }}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className='w-6 h-6 mr-2 animate-spin' />
                        Searching...
                      </>
                    ) : (
                      <>
                        Track Order
                        <ArrowRight className='w-5 h-5 ml-2' />
                      </>
                    )}
                  </Button>
                  </div>

                  {/* Help Text */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className='text-center text-gray-500 text-sm mt-4'
                  >
                    Your order number was sent to your email after purchase
                  </motion.p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className='max-w-[1400px] mx-auto px-8 py-16'>
          {searchedOrder && currentStatusStep && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className='mb-8'
            >
              <div className='bg-[#f63a9e] text-white rounded-2xl px-6 py-4 shadow-xl'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                  <div className='flex items-center gap-3'>
                    <div className='w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center'>
                      {React.createElement(currentStatusStep.icon, {
                        className: 'w-6 h-6',
                      })}
                    </div>
                    <div>
                      <p className='text-white/80 text-xs' style={{ fontWeight: '600' }}>
                        Order Status
                      </p>
                      <h2
                        className="font-['Bricolage_Grotesque',_sans-serif]"
                        style={{ fontSize: '22px', fontWeight: '700', lineHeight: '1.2' }}
                      >
                        {currentStatusStep.label}
                      </h2>
                    </div>
                  </div>
                  <div className='text-left sm:text-right'>
                    <p className='text-white/80 text-xs' style={{ fontWeight: '600' }}>
                      Order Number
                    </p>
                    <p style={{ fontWeight: '700' }}>{searchedOrder.orderNumber}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode='wait'>
            {/* Not Found Message */}
            {notFound && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='max-w-lg mx-auto text-center'
              >
                <div className='relative bg-white rounded-3xl p-12 shadow-2xl border-2 border-gray-100'>
                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                    }}
                    transition={{ duration: 0.5 }}
                    className='w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6'
                  >
                    <AlertCircle className='w-12 h-12 text-gray-400' />
                  </motion.div>
                  <h3
                    className='text-gray-900 mb-3'
                    style={{ fontSize: '24px', fontWeight: '700' }}
                  >
                    Order Not Found
                  </h3>
                  <p className='text-gray-600 mb-8'>
                    We couldn&apos;t find an order with number{' '}
                    <span className='font-bold text-[#f63a9e]'>
                      &quot;{orderNumber}&quot;
                    </span>
                    .
                    <br />
                    Please check your order number and try again.
                  </p>
                  <Button
                    onClick={() => {
                      setOrderNumber('');
                      setEmail('');
                      setNotFound(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[50px] px-8'
                    style={{ fontWeight: '700' }}
                  >
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Order Details */}
            {searchedOrder && (
              <motion.div
                ref={orderDetailsRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
              >
                {/* Main Content Grid */}
                <div className='grid lg:grid-cols-3 gap-8'>
                  {/* Left: Order Timeline & Items */}
                  <div className='lg:col-span-2 space-y-8'>
                    {/* Order Header */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className='bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100'
                    >
                      <div className='flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-100'>
                        <div>
                          <h3
                            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2"
                            style={{ fontSize: '24px', fontWeight: '700' }}
                          >
                            Order {searchedOrder.orderNumber}
                          </h3>
                          <p className='text-gray-500'>
                            Placed on {searchedOrder.orderDate}
                          </p>
                        </div>

                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                          }}
                        >
                          <PackageCheck className='w-12 h-12 text-[#f63a9e]' />
                        </motion.div>
                      </div>

                      {/* Visual Progress Timeline */}
                      <div className='space-y-6'>
                        {statusSteps.map((step, index) => {
                          const StepIcon = step.icon;
                          const currentIndex = getStatusIndex(
                            searchedOrder.status
                          );
                          const isCompleted = index <= currentIndex;
                          const isCurrent = index === currentIndex;

                          return (
                            <motion.div
                              key={step.key}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                              className='relative'
                            >
                              <div
                                className={`flex items-center gap-6 p-6 rounded-2xl transition-all ${
                                  isCurrent
                                    ? 'bg-[#FFF5FB] border-2 border-[#f63a9e] shadow-lg'
                                    : isCompleted
                                      ? 'bg-gray-50 border-2 border-gray-200'
                                      : 'bg-white border-2 border-gray-100'
                                }`}
                              >
                                {/* Step Number/Icon */}
                                <motion.div
                                  className={`relative w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-lg ${
                                    isCompleted ? 'bg-[#f63a9e]' : 'bg-gray-200'
                                  }`}
                                  animate={
                                    isCurrent
                                      ? {
                                          scale: [1, 1.1, 1],
                                        }
                                      : {}
                                  }
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  <StepIcon
                                    className={`w-10 h-10 ${isCompleted ? 'text-white' : 'text-gray-400'}`}
                                  />

                                  {isCurrent && (
                                    <motion.div
                                      className='absolute inset-0 rounded-2xl border-4 border-[#f63a9e]'
                                      animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [1, 0, 1],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                      }}
                                    />
                                  )}
                                </motion.div>

                                {/* Content */}
                                <div className='flex-1'>
                                  <h4
                                    className={`mb-2 ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}
                                    style={{
                                      fontWeight: '700',
                                      fontSize: '18px',
                                    }}
                                  >
                                    {step.label}
                                  </h4>
                                  <p
                                    className={`${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}
                                  >
                                    {step.description}
                                  </p>
                                </div>

                                {/* Status Check */}
                                {isCompleted && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className='w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg'
                                  >
                                    <CheckCheck className='w-6 h-6 text-white' />
                                  </motion.div>
                                )}
                              </div>

                              {/* Connector */}
                              {index < statusSteps.length - 1 && (
                                <div className='flex justify-start pl-10 py-2'>
                                  <div
                                    className={`w-1 h-8 rounded-full ${
                                      index < currentIndex
                                        ? 'bg-[#f63a9e]'
                                        : 'bg-gray-200'
                                    }`}
                                  />
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Tracking Number */}
                      {searchedOrder.trackingNumber && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 }}
                          className='mt-8 p-6 bg-[#FFF5FB] rounded-2xl border-2 border-[#f63a9e]/30'
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <p
                                className='text-[#f63a9e] text-xs mb-2'
                                style={{ fontWeight: '700' }}
                              >
                                TRACKING NUMBER
                              </p>
                              <p
                                className='text-gray-900'
                                style={{
                                  fontWeight: '800',
                                  fontSize: '20px',
                                  letterSpacing: '0.05em',
                                }}
                              >
                                {searchedOrder.trackingNumber}
                              </p>
                            </div>
                            <Clock className='w-10 h-10 text-[#f63a9e]' />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>

                  </div>

                  {/* Right: Quick Actions */}
                  <div className='space-y-6'>
                    {/* Action Buttons */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className='space-y-3'
                    >
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => navigate('/')}
                          className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[50px] shadow-lg'
                          style={{ fontWeight: '700' }}
                        >
                          <Home className='w-5 h-5 mr-2' />
                          Back to Home
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => {
                            setSearchedOrder(null);
                            setOrderNumber('');
                            setEmail('');
                            setNotFound(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          variant='outline'
                          className='w-full border-2 border-[#f63a9e] text-[#f63a9e] hover:bg-[#FFF5FB] rounded-xl h-[50px]'
                          style={{ fontWeight: '700' }}
                        >
                          <Search className='w-5 h-5 mr-2' />
                          Track Another Order
                        </Button>
                      </motion.div>
                    </motion.div>

                    {/* Items in This Order (Compact) */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 }}
                      className='bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-xl'
                    >
                      <div className='flex items-center gap-3 mb-5'>
                        <div className='w-11 h-11 rounded-xl bg-[#FFF5FB] flex items-center justify-center'>
                          <Box className='w-5 h-5 text-[#f63a9e]' />
                        </div>
                        <h3
                          className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                          style={{ fontSize: '22px', fontWeight: '700' }}
                        >
                          Items in This Order
                        </h3>
                      </div>

                      <div className='space-y-3'>
                        {searchedOrder.items.map((item, index) => (
                          <div
                            key={`${item.name}-${index}`}
                            className='flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100'
                          >
                            <div className='w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-200'>
                              <ImageWithFallback
                                src={item.image}
                                alt={item.name}
                                className='w-full h-full object-cover'
                              />
                            </div>
                            <div className='min-w-0 flex-1'>
                              <p
                                className='text-gray-900 truncate'
                                style={{ fontWeight: '700' }}
                              >
                                {item.name}
                              </p>
                              <p className='text-xs text-gray-600 mt-1'>
                                {item.size} • Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Support Card */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className='bg-[#FFF5FB] rounded-3xl p-6 border-2 border-[#f63a9e]/25 shadow-xl'
                    >
                      <h3
                        className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                        style={{ fontSize: '22px', fontWeight: '700' }}
                      >
                        Need help with this order?
                      </h3>
                      <div className='space-y-3'>
                        <a
                          href='tel:+447700900123'
                          className='flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-[#f63a9e]/40 transition-colors'
                        >
                          <Phone className='w-5 h-5 text-[#f63a9e]' />
                          <div>
                            <p className='text-xs text-gray-500'>Phone / WhatsApp</p>
                            <p className='text-gray-900' style={{ fontWeight: '700' }}>
                              +44 7700 900123
                            </p>
                          </div>
                        </a>
                        <a
                          href='mailto:support@photify.co.uk'
                          className='flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-[#f63a9e]/40 transition-colors'
                        >
                          <Mail className='w-5 h-5 text-[#f63a9e]' />
                          <div>
                            <p className='text-xs text-gray-500'>Email</p>
                            <p className='text-gray-900 break-all' style={{ fontWeight: '700' }}>
                              support@photify.co.uk
                            </p>
                          </div>
                        </a>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Initial State - Empty State */}
            {!searchedOrder && !notFound && !isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='text-center py-20'
              >
                <motion.div
                  animate={{
                    y: [0, -15, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className='relative inline-block mb-8'
                >
                  <div className='w-56 h-56 rounded-full bg-[#FFF5FB] border-4 border-[#f63a9e]/20 flex items-center justify-center mx-auto'>
                    <Package className='w-32 h-32 text-[#f63a9e]/40' />
                  </div>

                  {/* Floating Business Icons Around */}
                  {[
                    { Icon: Frame, angle: 0 },
                    { Icon: ImageIcon, angle: 90 },
                    { Icon: Square, angle: 180 },
                    { Icon: Camera, angle: 270 },
                  ].map(({ Icon, angle }, i) => (
                    <motion.div
                      key={i}
                      className='absolute'
                      style={{
                        left: '50%',
                        top: '50%',
                      }}
                      animate={{
                        rotate: [angle, angle + 360],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <div
                        style={{
                          transform: `translate(-50%, -50%) translateY(-140px)`,
                        }}
                      >
                        <motion.div
                          animate={{
                            y: [0, -10, 0],
                            rotate: [0, 15, -15, 0],
                          }}
                          transition={{
                            duration: 3,
                            delay: i * 0.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          <Icon className='w-10 h-10 text-[#f63a9e]' />
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <h3
                  className='text-gray-900 mb-4'
                  style={{ fontSize: '24px', fontWeight: '700' }}
                >
                  Enter Your Order Number
                </h3>
                <p className='text-gray-500 max-w-md mx-auto text-lg'>
                  Track your beautiful prints and see exactly where they are on
                  their journey to you
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
